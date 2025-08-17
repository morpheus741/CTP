/* Push The Button — core game logic */
(() => {
  const bigButton = document.getElementById('bigButton');
  const startBtn = document.getElementById('startBtn');
  const resetBtn = document.getElementById('resetBtn');

  const timeEl = document.getElementById('time');
  const scoreEl = document.getElementById('score');
  const cpsEl = document.getElementById('cps');
  const cpsMeter = document.getElementById('cpsMeter').firstElementChild;

  const resultsSection = document.getElementById('results');
  const finalScoreEl = document.getElementById('finalScore');
  const avgCpsEl = document.getElementById('avgCps');
  const bestCpsEl = document.getElementById('bestCps');

  const sessionBoard = document.getElementById('sessionBoard');
  const deviceBestEl = document.getElementById('deviceBest');

  const shareBtn = document.getElementById('shareBtn');
  const downloadCardBtn = document.getElementById('downloadCardBtn');
  const muteToggle = document.getElementById('muteToggle');
  const rememberDevice = document.getElementById('rememberDevice');

  const live = document.getElementById('live');
  document.getElementById('year').textContent = new Date().getFullYear();

  // Sounds
  const sounds = new window.ClickSounds();

  // State
  let running = false;
  let startTime = 0;
  let remaining = 60_000; // ms
  let score = 0;
  let pressTimestamps = []; // for CPS rolling window (ms)
  let best1sCps = 0;
  let pressCountThisSecond = 0;
  let lastPressAt = 0;
  let activePointerId = null;
  let timerRaf = null;
  const MIN_INTERVAL_MS = 20; // ignore ultra-fast presses
  const MAX_CPS = 50; // implied by MIN_INTERVAL_MS

  const sessionScores = []; // per page load

  // Device (optional)
  const DEVICE_KEY = 'ctb_device_best';
  try {
    const best = Number(localStorage.getItem(DEVICE_KEY));
    if (Number.isFinite(best) && best > 0) {
      deviceBestEl.textContent = `${best} taps`;
    }
  } catch {}

  // Visibility pause
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) {
      pauseGame();
    }
  });

  // Controls
  startBtn.addEventListener('click', startGame);
  resetBtn.addEventListener('click', resetGame);

  muteToggle.addEventListener('click', async () => {
    if (!sounds.ctx) await sounds.ensure();
    const on = muteToggle.getAttribute('aria-pressed') !== 'true';
    muteToggle.setAttribute('aria-pressed', String(on));
    muteToggle.textContent = on ? '🔊 Sound' : '🔇 Muted';
    sounds.toggle(on);
  });

  rememberDevice.addEventListener('change', () => {
    // no immediate action; we save after rounds if checked
  });

  // Button input — mouse + touch only. No keyboard.
  bigButton.addEventListener('pointerdown', onPressStart);
  bigButton.addEventListener('pointerup', onPressEnd);
  bigButton.addEventListener('pointercancel', onPressCancel);
  bigButton.addEventListener('contextmenu', e => e.preventDefault());

  function validPointer(e) {
    return e.isTrusted && (e.pointerType === 'mouse' || e.pointerType === 'touch');
  }

  async function startGame() {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    resetBtn.disabled = false;
    resultsSection.hidden = true;
    score = 0;
    pressTimestamps = [];
    best1sCps = 0;
    pressCountThisSecond = 0;
    lastPressAt = 0;
    activePointerId = null;
    startTime = performance.now();
    remaining = 60_000;
    updateHUD();

    // enable sound after user gesture if not yet
    try { await sounds.ensure(); sounds.toggle(true); muteToggle.setAttribute('aria-pressed','true'); } catch {}
    sounds.start();

    loop();
  }

  function pauseGame() {
    if (!running) return;
    running = false;
    startBtn.disabled = false;
    cancelAnimationFrame(timerRaf);
    live.textContent = 'Paused due to tab hidden.';
  }

  function resetGame() {
    running = false;
    startBtn.disabled = false;
    resetBtn.disabled = true;
    cancelAnimationFrame(timerRaf);
    remaining = 60_000;
    score = 0;
    pressTimestamps = [];
    best1sCps = 0;
    pressCountThisSecond = 0;
    activePointerId = null;
    updateHUD();
    resultsSection.hidden = true;
  }

  function endGame() {
    running = false;
    startBtn.disabled = false;
    cancelAnimationFrame(timerRaf);
    sounds.finish();

    const elapsed = 60_000 - remaining;
    const avgCps = score / (elapsed / 1000);
    finalScoreEl.textContent = String(score);
    avgCpsEl.textContent = avgCps.toFixed(2);
    bestCpsEl.textContent = best1sCps.toFixed(2);

    // Update session leaderboard
    const entry = { score, avgCps, best1sCps, at: new Date() };
    sessionScores.push(entry);
    sessionScores.sort((a,b) => b.score - a.score);
    renderSessionBoard();

    // Device best (optional)
    if (rememberDevice.checked) {
      try {
        const prev = Number(localStorage.getItem(DEVICE_KEY) || 0);
        if (!Number.isFinite(prev) || score > prev) {
          localStorage.setItem(DEVICE_KEY, String(score));
          deviceBestEl.textContent = `${score} taps`;
        } else {
          deviceBestEl.textContent = `${prev} taps`;
        }
      } catch {}
    }

    resultsSection.hidden = false;
    live.textContent = `Round finished. Score ${score}. Average CPS ${avgCps.toFixed(1)}.`;
  }

  function renderSessionBoard() {
    sessionBoard.innerHTML = '';
    sessionScores.slice(0, 10).forEach((s, i) => {
      const li = document.createElement('li');
      li.textContent = `#${i+1} — ${s.score} taps (${s.avgCps.toFixed(1)} cps)`;
      sessionBoard.appendChild(li);
    });
  }

  function onPressStart(e) {
    if (!validPointer(e)) return;
    // single-pointer enforcement
    if (activePointerId !== null && activePointerId !== e.pointerId) return;
    activePointerId = e.pointerId;

    if (!running) {
      // allow tapping big button to start
      startGame();
      return;
    }

    const now = performance.now();
    const delta = now - lastPressAt;
    if (delta < MIN_INTERVAL_MS) {
      return; // ignore too-fast presses
    }
    lastPressAt = now;

    // record press
    score += 1;
    sounds.press();
    if (score % 10 === 0) sounds.ping();

    // Rolling 1s window
    pressTimestamps.push(now);
    while (pressTimestamps.length && now - pressTimestamps[0] > 1000) {
      pressTimestamps.shift();
    }
    const cpsNow = pressTimestamps.length;
    if (cpsNow > best1sCps) best1sCps = cpsNow;

    updateHUD();
  }

  function onPressEnd(e) {
    if (!validPointer(e)) return;
    if (activePointerId === e.pointerId) activePointerId = null;
  }
  function onPressCancel(e) {
    if (activePointerId === e.pointerId) activePointerId = null;
  }

  function updateHUD() {
    timeEl.textContent = (remaining / 1000).toFixed(1);
    scoreEl.textContent = String(score);
    cpsEl.textContent = (pressTimestamps.length).toFixed(1);
    const pct = Math.min(100, Math.round((pressTimestamps.length / MAX_CPS) * 100));
    cpsMeter.style.width = pct + '%';
  }

  function loop() {
    const now = performance.now();
    const elapsed = now - startTime;
    remaining = Math.max(0, 60_000 - elapsed);
    updateHUD();
    if (remaining <= 0) {
      endGame();
      return;
    }
    timerRaf = requestAnimationFrame(loop);
  }

  // Sharing
  shareBtn.addEventListener('click', async () => {
    const dateText = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const dataUrl = await window.generateShareCardPNG({
      score,
      avgCps: score / ((60_000 - remaining) / 1000 || 1),
      bestCps: best1sCps,
      dateText
    });

    const blob = await (await fetch(dataUrl)).blob();
    const files = [new File([blob], 'ctb-score.png', { type: 'image/png' })];

    if (navigator.share && navigator.canShare && navigator.canShare({ files })) {
      try {
        await navigator.share({
          title: 'Push The Button — My Score',
          text: `I scored ${score} taps in 60 seconds on CTB!`,
          files
        });
      } catch (e) {
        // user canceled — no-op
      }
    } else {
      // Fallback: download
      const a = document.createElement('a');
      a.href = dataUrl; a.download = 'ctb-score.png';
      document.body.appendChild(a); a.click(); a.remove();
    }
  });

  downloadCardBtn.addEventListener('click', async () => {
    const dateText = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const dataUrl = await window.generateShareCardPNG({
      score,
      avgCps: score / ((60_000 - remaining) / 1000 || 1),
      bestCps: best1sCps,
      dateText
    });
    const a = document.createElement('a');
    a.href = dataUrl; a.download = 'ctb-score.png';
    document.body.appendChild(a); a.click(); a.remove();
  });

  // init
  (function init() {
    // Ensure ARIA states reflect defaults
    muteToggle.setAttribute('aria-pressed', 'true');
    sounds.ensure().then(() => sounds.toggle(true)).catch(()=>{});
    updateHUD();
  })();
})();
