# Link Integrity Tests

## What is checked
- Internal links resolve without 4xx/5xx.
- External links respond OK (after redirects).
- `#anchor` targets exist on the page.
- No empty or malformed `href`.

## How to run
```bash
npm run test:links
