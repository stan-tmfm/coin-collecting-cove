// js/game/coinPickup.js

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

  function fmt(n) { return n.toLocaleString(undefined, { maximumFractionDigits: 0 }); }
  function save() { localStorage.setItem(storageKey, String(coins)); }
  function updateHud() { amt.textContent = fmt(coins); }

  updateHud();

  // ----- Audio: different volume for mobile vs desktop -----
  const IS_MOBILE = (window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window);
  const COIN_VOL_DESKTOP = 0.25;
  const COIN_VOL_MOBILE  = 0.1;
  const COIN_VOLUME = IS_MOBILE ? COIN_VOL_MOBILE : COIN_VOL_DESKTOP;

  const pool = Array.from({ length: 6 }, () => {
    const a = new Audio(soundSrc);
    a.preload = 'auto';
    a.volume = COIN_VOLUME;
    return a;
  });
  let pIdx = 0;

  function playSound() {
    const now = performance.now();
    if (now - lastSoundAt < 40) return;
    lastSoundAt = now;
    const a = pool[pIdx++ % pool.length];
    try { a.currentTime = 0; a.play(); } catch {}
  }

  // ----- collect animation + removal -----
  function animateAndRemove(el) {
    const cs = getComputedStyle(el);
    const start = cs.transform && cs.transform !== 'none' ? cs.transform : 'translate3d(0,0,0)';
    el.style.setProperty('--ccc-start', start);

    // clear inline anims so CSS rule applies
    el.style.animation = 'none';
    el.style.transition = 'none';
    el.offsetWidth; // reflow
    el.style.animation = '';
    el.style.transition = '';
    el.classList.add('coin--collected');

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

    // optional: gentle haptic feedback on mobile
    if (IS_MOBILE && navigator.vibrate) navigator.vibrate(10);

    animateAndRemove(el);
  }

  // ----- Ensure newly spawned coins can be hit-tested -----
  const mo = new MutationObserver((recs) => {
    for (const r of recs) {
      r.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        if (!node.classList.contains('coin')) return;
        node.style.pointerEvents = 'auto';
        node.addEventListener('mouseenter', () => collect(node), { passive: true });
        node.addEventListener('pointerdown', () => collect(node), { passive: true });
      });
    }
  });
  mo.observe(cl, { childList: true });

  // ----- Mobile swipe hit-testing -----
  function collectAt(x, y) {
    const under = document.elementsFromPoint(x, y);
    const coin = under.find(el => el instanceof HTMLElement && el.classList.contains('coin'));
    if (coin) collect(coin);
  }

  function handleTouch(ev) {
    for (let i = 0; i < ev.touches.length; i++) {
      const t = ev.touches[i];
      collectAt(t.clientX, t.clientY);
    }
  }
  pf.addEventListener('touchstart', handleTouch, { passive: true });
  pf.addEventListener('touchmove',  handleTouch, { passive: true });

  // Desktop hover paint
  let lastX = -1, lastY = -1;
  pf.addEventListener('mousemove', (e) => {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if ((dx*dx + dy*dy) < 9) return;
    lastX = e.clientX; lastY = e.clientY;
    collectAt(e.clientX, e.clientY);
  }, { passive: true });

  // Pointer down fallback
  pf.addEventListener('pointerdown', (e) => collectAt(e.clientX, e.clientY), { passive: true });

  // Exposed helper
  return {
    get count() { return coins; },
    set count(v) { coins = Math.max(0, Number(v) || 0); updateHud(); save(); }
  };
}
