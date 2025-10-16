// js/game/coinPickup.js
//
// Lightweight, fast coin collection for CCC.
// - Desktop: hover OR click collects
// - Mobile: swipe collects (hit-test under finger)
// - Plays "sounds/coin_pickup.mp3"
// - Updates the new HUD counter: .hud-top .coin-amount
//
// This is self-contained and safe to call multiple times (no double init).

let initialized = false;

export function initCoinPickup({
  playfieldSelector    = '.area-cove .playfield',
  coinsLayerSelector   = '.area-cove .coins-layer',
  hudAmountSelector    = '.hud-top .coin-amount',
  soundSrc             = 'sounds/coin_pickup.mp3',
  storageKey           = 'ccc:coins:v1',
} = {}) {
  if (initialized) return;
  initialized = true;

  // ----- DOM refs -----
  const pf  = document.querySelector(playfieldSelector);
  const cl  = document.querySelector(coinsLayerSelector);
  const amt = document.querySelector(hudAmountSelector);
  if (!pf || !cl || !amt) {
    console.warn('[coinPickup] missing required nodes', { pf: !!pf, cl: !!cl, amt: !!amt });
    return;
  }

  // ----- state -----
  let coins = Number(localStorage.getItem(storageKey) || 0);
  let lastSoundAt = 0;

  function fmt(n) {
    // readable, non-expensive formatter
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  function save() { localStorage.setItem(storageKey, String(coins)); }
  function updateHud() { amt.textContent = fmt(coins); }

  updateHud();

  // ----- audio (small pool to avoid play() rejections/latency) -----
  const pool = Array.from({ length: 6 }, () => {
    const a = new Audio(soundSrc);
    a.preload = 'auto';
    a.volume = 0.35;
    return a;
  });
  let pIdx = 0;
  function playSound() {
    const now = performance.now();
    if (now - lastSoundAt < 40) return; // mild rate-limit
    lastSoundAt = now;
    const a = pool[pIdx++ % pool.length];
    try { a.currentTime = 0; a.play(); } catch {}
  }

  // ----- collect animation + removal -----
function animateAndRemove(el) {
  // Read current transform so the keyframes can start from live position
  const cs = getComputedStyle(el);
  const start = cs.transform && cs.transform !== 'none' ? cs.transform : 'translate3d(0,0,0)';
  el.style.setProperty('--ccc-start', start);

  // Kill any inline animation/transition from spawn so our CSS rule can take over
  el.style.animation = 'none';
  el.style.transition = 'none';

  // Force reflow to commit the 'none' values
  // (this makes sure the next change is seen as a new animation)
  // eslint-disable-next-line no-unused-expressions
  el.offsetWidth;

  // Clear inline props so stylesheet can apply, then add our class
  el.style.animation = '';
  el.style.transition = '';
  el.classList.add('coin--collected');

  // Remove on animation end (with a safety fallback)
  const done = () => { el.removeEventListener('animationend', done); el.remove(); };
  el.addEventListener('animationend', done);
  setTimeout(done, 600);
}


  function collect(el) {
    if (!el || el.dataset.collected === '1') return;
    el.dataset.collected = '1';
    coins += 1;
    updateHud();
    save();
    playSound();
    animateAndRemove(el);
  }

  // ----- Ensure newly spawned coins can be hit-tested -----
  // The spawner creates .coin with `pointer-events: none` inline; override to 'auto'
  // and attach desktop hover handler. We do this via a MutationObserver to avoid
  // touching spawner internals.  (Spawner: js/game/spawner.js) :contentReference[oaicite:0]{index=0}
  const mo = new MutationObserver((recs) => {
    for (const r of recs) {
      r.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        if (!node.classList.contains('coin')) return;
        // Make it interactive:
        node.style.pointerEvents = 'auto';
        // Desktop hover should collect immediately:
        node.addEventListener('mouseenter', () => collect(node), { passive: true });
        // Click/tap also collects (useful if hover is not desired on some devices)
        node.addEventListener('pointerdown', () => collect(node), { passive: true });
      });
    }
  });
  mo.observe(cl, { childList: true });

  // ----- Mobile swipe hit-testing -----
  function collectAt(x, y) {
    // Use elementsFromPoint so we can pick coins while swiping across the field,
    // even if the original touch target doesn't change.
    const under = document.elementsFromPoint(x, y);
    const coin = under.find(el => el instanceof HTMLElement && el.classList.contains('coin'));
    if (coin) collect(coin);
  }

  // Touch: start + move = collect
  function handleTouch(ev) {
    for (let i = 0; i < ev.touches.length; i++) {
      const t = ev.touches[i];
      collectAt(t.clientX, t.clientY);
    }
  }
  pf.addEventListener('touchstart', handleTouch, { passive: true });
  pf.addEventListener('touchmove',  handleTouch, { passive: true });

  // Optional: desktop hover via mousemove sweep (in addition to per-coin mouseenter)
  // This lets users "paint" over dense piles quickly.
  let lastX = -1, lastY = -1;
  pf.addEventListener('mousemove', (e) => {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if ((dx*dx + dy*dy) < 9) return; // small throttle
    lastX = e.clientX; lastY = e.clientY;
    collectAt(e.clientX, e.clientY);
  }, { passive: true });

  // Also pick up immediately if user clicks/taps on the playfield
  pf.addEventListener('pointerdown', (e) => collectAt(e.clientX, e.clientY), { passive: true });

  // Public helper (optional): reset counter (not used yet)
  return {
    get count() { return coins; },
    set count(v) { coins = Math.max(0, Number(v) || 0); updateHud(); save(); }
  };
}
