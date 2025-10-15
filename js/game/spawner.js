// js/game/spawner.js  (PATCH v2)
export function createSpawner(opts = {}) {
  const {
    playfieldSelector = '.area-cove .playfield',
    waterSelector    = '#water-base',
    surgesHost       = '#surges',
    coinsHost        = '#coins-layer',
    coinSrc          = 'img/coin.png',
    coinSize         = 40,
    coinsPerSecond   = 10,
    surgeLifetimeMs  = 1400,
    surgeWidthVw     = 22,
    maxActiveCoins   = 1000,
    perFrameBudget   = 24,
    enableDropShadow = false
  } = opts;

  const $ = () => ({
    pf:  document.querySelector(playfieldSelector),
    w:   document.querySelector(waterSelector),
    s:   document.querySelector(surgesHost),
    c:   document.querySelector(coinsHost),
    hud: document.getElementById('hud-bottom'),
  });

  let M = { pfRect: null, wRect: null, safeBottom: 0, pfW: 0 };
  function computeMetrics() {
    const { pf, w, hud } = $();
    if (!pf || !w) return false;
    const pfRect = pf.getBoundingClientRect();
    const wRect  = w.getBoundingClientRect();
    const hudH   = hud ? hud.getBoundingClientRect().height : 0;
    M = { pfRect, wRect, safeBottom: pfRect.height - hudH, pfW: pfRect.width };
    return true;
  }
  computeMetrics();
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => computeMetrics()) : null;
  if (ro) { const { pf } = $(); if (pf) ro.observe(pf); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) computeMetrics(); });

  const COIN_POOL_MAX  = 1000;
  const SURGE_POOL_MAX = 200;
  const coinPool  = [];
  const surgePool = [];

  function makeCoin() {
    const el = document.createElement('div');
    el.className = 'coin';
    el.style.position = 'absolute';
    el.style.width  = `${coinSize}px`;
    el.style.height = `${coinSize}px`;
    el.style.background = `url(${coinSrc}) center/contain no-repeat`;
    el.style.borderRadius = '50%';
    el.style.pointerEvents = 'none';
    el.style.willChange = 'transform, opacity';
    el.style.contain = 'layout paint style size';
    if (enableDropShadow) el.style.filter = 'drop-shadow(0 2px 2px rgba(0,0,0,.35))';
    return el;
  }
  const getCoin = () => (coinPool.length ? coinPool.pop() : makeCoin());
  function releaseCoin(el) {
    el.style.animation = 'none';
    el.style.transform = '';
    el.style.opacity   = '1';
    el.remove();
    if (coinPool.length < COIN_POOL_MAX) coinPool.push(el);
  }

  function makeSurge() { const el = document.createElement('div'); el.className = 'wave-surge'; return el; }
  const getSurge = () => (surgePool.length ? surgePool.pop() : makeSurge());
  function releaseSurge(el) {
    el.classList.remove('run');
    el.remove();
    if (surgePool.length < SURGE_POOL_MAX) surgePool.push(el);
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function planSpawn() {
    if (!M.pfRect || !M.wRect) return null;

    const { c } = $();
    if (!c) return null;
    if (maxActiveCoins !== Infinity && c.childElementCount >= maxActiveCoins) {
      const first = c.firstElementChild;
      if (first) releaseCoin(first);
    }

    const pfW   = M.pfW;
    const waveW = clamp(pfW * (surgeWidthVw / 100), 220, 520);
    const margin  = 12;
    const leftMax = Math.max(1, pfW - waveW - margin * 2);
    const waveX   = Math.random() * leftMax + margin;

    const waterToPfTop = M.wRect.top - M.pfRect.top;
    const waveTop      = Math.max(0, waterToPfTop + M.wRect.height * 0.05);

    const crestCenter = waveX + waveW / 2 + (Math.random() * 60 - 30);
    const startX = crestCenter - coinSize / 2;
    const startY = waveTop + 10 - coinSize / 2;

	const drift = Math.random() * 240 - 120;
	const endX  = clamp(startX + drift, margin, pfW - coinSize - margin);

	const minY  = Math.max(M.wRect.height + 40, 80);  // start closer to water (was +80)
	const maxY  = Math.max(minY + 180, M.safeBottom - coinSize - 10); // extend lower range
	const endY  = clamp(minY + Math.random() * (maxY - minY), minY, maxY);

    const midX = startX + (endX - startX) * 0.66;
    const jitterMs = Math.random() * 100;

    return { wave: { x: waveX, y: waveTop, w: waveW },
             coin: { x0: startX, y0: startY, xMid: midX, y1: endY, x1: endX, jitterMs } };
  }

  // --- PATCHED: trigger animations AFTER append, with a forced restart ---
  function commitBatch(batch) {
    const { s, c } = $();
    if (!s || !c || !batch.length) return;

    const wavesFrag = document.createDocumentFragment();
    const coinsFrag = document.createDocumentFragment();
    const newCoins = []; // collect coins to animate post-append

    for (const { wave, coin } of batch) {
      const surge = getSurge();
      surge.style.left  = `${wave.x}px`;
      surge.style.top   = `${wave.y}px`;
      surge.style.width = `${wave.w}px`;
      wavesFrag.appendChild(surge);
      // set class after append (we'll toggle once in RAF)
      surge.dataset.needsRun = '1';

      const el = getCoin();
      // set CSS vars used by keyframes AND a baseline transform so the coin is visible
      el.style.setProperty('--x0',   `${coin.x0}px`);
      el.style.setProperty('--y0',   `${coin.y0}px`);
      el.style.setProperty('--xmid', `${coin.xMid}px`);
      el.style.setProperty('--y1',   `${coin.y1}px`);
      el.style.setProperty('--x1',   `${coin.x1}px`);
      el.style.transform = `translate3d(${coin.x0}px, ${coin.y0}px, 0)`; // baseline
      // don't set animation yet; do it after append
      el.dataset.jitter = String(coin.jitterMs);
      coinsFrag.appendChild(el);
      newCoins.push(el);
    }

    s.appendChild(wavesFrag);
    c.appendChild(coinsFrag);

    // One RAF tick to ensure DOM attach, then start animations cleanly.
    requestAnimationFrame(() => {
      // Run surges
      s.querySelectorAll('.wave-surge[data-needs-run="1"]').forEach(surge => {
        surge.removeAttribute('data-needs-run');
        // restart anim reliably
        surge.classList.remove('run');
        // force reflow so animation restarts even from pool
        void surge.offsetWidth;
        surge.classList.add('run');
        const off = (e) => { if (e.target === surge) { surge.removeEventListener('animationend', off); releaseSurge(surge); } };
        surge.addEventListener('animationend', off, { once: true });
      });

      // Kick coin animations (restart-safe)
      for (const el of newCoins) {
        const jitter = Number(el.dataset.jitter) || 0;
        el.style.animation = 'none';
        void el.offsetWidth; // force reflow to reset
        el.style.animation = `coin-from-wave 1.5s ease-out ${jitter}ms 1 both`;
      }
    });
  }

  let rate = coinsPerSecond;
  let rafId = null;
  let last  = performance.now();
  let carry = 0;
  let queued = 0;

  function loop(now) {
    if (!M.pfRect || !M.wRect) computeMetrics();

    const dt = (now - last) / 1000;
    last = now;

	const BACKLOG_CAP = 600;
    carry += rate * dt;
	const due = carry | 0;
	if (due > 0) {
    // Clamp queued backlog so it never exceeds BACKLOG_CAP
    queued = Math.min(queued + due, BACKLOG_CAP);
    carry -= due;
  }

    const n = Math.min(queued, perFrameBudget);
    if (n > 0) {
      const batch = [];
      for (let i = 0; i < n; i++) {
        const plan = planSpawn();
        if (plan) batch.push(plan);
      }
      commitBatch(batch);
      queued -= n;
    }
    rafId = requestAnimationFrame(loop);
  }

  function start() { if (!rafId) { last = performance.now(); rafId = requestAnimationFrame(loop); } }
  function stop()  { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }
  function setRate(n) { rate = Math.max(0, Number(n) || 0); }

  document.addEventListener('visibilitychange', () => { if (!document.hidden && !rafId) start(); });

  return { start, stop, setRate };
}
