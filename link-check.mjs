// Crawls the site, checks links & anchors, and writes a JSON report.
// Run with the server running at http://localhost:8080
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { URL } from 'node:url';

const BASE = process.env.TEST_BASE || 'http://localhost:8080';

const report = {
  scannedAt: new Date().toISOString(),
  base: BASE,
  pages: [],
  totals: { internal: 0, external: 0, anchorsChecked: 0 },
  errors: [],
};

function normalizeUrl(href) {
  try { return new URL(href, BASE).href; } catch { return null; }
}

function isExternal(href) {
  try {
    const u = new URL(href, BASE);
    return u.origin !== new URL(BASE).origin;
  } catch { return false; }
}

const visited = new Set();

async function scanPage(page, path = '/') {
  const url = new URL(path, BASE).href;
  if (visited.has(url)) return;
  visited.add(url);

  await page.goto(url, { waitUntil: 'load' });
  const links = await page.$$eval('a[href]', as => as.map(a => ({
    href: a.getAttribute('href'),
    text: (a.textContent || '').trim(),
  })));

  const pageReport = { url, links: [], anchors: [] };

  // Check anchors
  const anchors = links.filter(l => l.href && l.href.includes('#'));
  for (const a of anchors) {
    const [p, hash] = a.href.split('#');
    if (!hash) continue;
    const id = hash;
    if (!p || p === '' || p === '#') {
      // same-page anchor
      const exists = await page.$(`#${CSS.escape(id)}`) != null;
      report.totals.anchorsChecked++;
      if (!exists) report.errors.push({ type: 'missing-anchor', url, anchor: `#${id}` });
      pageReport.anchors.push({ anchor: `#${id}`, exists });
    } else {
      // cross-page anchor: skip (single-page site)
    }
  }

  for (const l of links) {
    const href = l.href;
    if (!href || href.trim() === '' || href === '#') {
      report.errors.push({ type: 'empty-href', url, linkText: l.text });
      continue;
    }
    const abs = normalizeUrl(href);
    if (!abs) {
      report.errors.push({ type: 'malformed-url', url, href });
      continue;
    }
    if (isExternal(href)) {
      report.totals.external++;
      // fetch HEAD/GET
      try {
        const resp = await fetch(abs, { method: 'GET', redirect: 'follow' });
        if (!resp.ok) {
          report.errors.push({ type: 'external-bad-status', href: abs, status: resp.status });
        }
      } catch (e) {
        report.errors.push({ type: 'external-fetch-failed', href: abs, error: String(e) });
      }
      pageReport.links.push({ href: abs, external: true });
    } else {
      report.totals.internal++;
      // navigate to make sure it resolves
      try {
        const r = await page.goto(abs, { waitUntil: 'domcontentloaded' });
        if (!r || r.status() >= 400) {
          report.errors.push({ type: 'internal-bad-status', href: abs, status: r ? r.status() : 'no-response' });
        }
      } catch (e) {
        report.errors.push({ type: 'internal-nav-failed', href: abs, error: String(e) });
      } finally {
        await page.goto(url, { waitUntil: 'domcontentloaded' }); // go back
      }
      pageReport.links.push({ href: abs, external: false });
    }
  }

  report.pages.push(pageReport);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await scanPage(page, '/');
  } finally {
    await browser.close();
    await writeFile('tests/link-report.json', JSON.stringify(report, null, 2));
    // also print a tiny summary for CI logs
    const summary = {
      totals: report.totals,
      errorCount: report.errors.length,
      errors: report.errors.slice(0, 5), // first few
    };
    console.log('LINK-REPORT-SUMMARY', JSON.stringify(summary));
  }
})();
