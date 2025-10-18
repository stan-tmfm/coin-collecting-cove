// js/game/coinPickup.js
//
// Mobile-optimized coin collection that feels like PC:
// - Each coin plays its own sound on mobile (WebAudio), no clumping
// - rAF-throttled swipe + small "brush" so swipes aren't finicky
// - Batches HUD/localStorage (1 write per frame), reduces jank
// - Desktop: hover/click still work as before
//
// Safe to init multiple times; internal guard prevents duplicates.

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

  // Ensure pointer stream is smooth on touch (prevents scroll/zoom hijacking)
  pf.style.touchAction = 'none';

  // ----- state -----
  let coins = Number(localStorage.getItem(storageKey) || 0);
  function fmt(n) { return n.toLocaleString(undefined, { maximumFractionDigits: 0 }); }
  function updateHud() { amt.textContent = fmt(coins); }
  function save() { localStorage.setItem(storageKey, String(coins)); }
  updateHud();

  // Batch HUD/storage to once per frame
  let pendingHudDelta = 0;
  let hudFlushScheduled = false;
  function addCoins(n) {
    if (n <= 0) return;
    pendingHudDelta += n;
    if (!hudFlushScheduled) {
      hudFlushScheduled = true;
      requestAnimationFrame(() => {
        if (pendingHudDelta) {
          coins += pendingHudDelta;
          pendingHudDelta = 0;
          updateHud();
          save();
        }
        hudFlushScheduled = false;
      });
    }
  }

  // ----- audio -----
  const IS_MOBILE = (window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window);
  const VOL_DESKTOP = 0.25;
  const VOL_MOBILE  = 0.08;
  const COIN_VOLUME = IS_MOBILE ? VOL_MOBILE : VOL_DESKTOP;

  // WebAudio (for perfect overlap on mobile)
  let ac = null, gain = null, buffer = null, bufferPromise = null;

  async function initWebAudioOnce() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    gain = ac.createGain();
    gain.gain.value = COIN_VOLUME;
    gain.connect(ac.destination);
    // Decode once
    bufferPromise = bufferPromise || (async () => {
      const res = await fetch(soundSrc);
      const arr = await res.arrayBuffer();
      return await ac.decodeAudioData(arr);
    })();
    buffer = await bufferPromise;
    if (ac.state === 'suspended') {
      // Will resume on first user input automatically; we also try:
      try { await ac.resume(); } catch {}
    }
  }

  function playCoinWebAudio() {
    if (!ac || !buffer) return false;
    try {
      const src = ac.createBufferSource();
      src.buffer = buffer;
      // small random pitch for variety
      src.playbackRate.value = 0.98 + Math.random() * 0.06;
      src.connect(gain);
      src.start();
      return true;
    } catch {
      return false;
    }
  }

  // HTMLAudio fallback pool (desktop or if WA fails)
  const pool = Array.from({ length: 8 }, () => {
    const a = new Audio(soundSrc);
    a.preload = 'auto';
    a.volume = COIN_VOLUME;
    return a;
  });
  let pIdx = 0;

  function playCoinHtmlAudio() {
    const a = pool[pIdx++ % pool.length];
    try { a.currentTime = 0; a.play(); } catch {}
  }

  function playSound() {
    // On first collect (user gesture), warm WebAudio for mobile
    if (IS_MOBILE && !ac) {
      initWebAudioOnce().then(() => {
        if (!playCoinWebAudio()) playCoinHtmlAudio();
      }).catch(() => playCoinHtmlAudio());
      return;
    }
    // Prefer WebAudio on mobile (no rate limit -> every coin audible)
    if (IS_MOBILE && ac && buffer) {
      if (!playCoinWebAudio()) playCoinHtmlAudio();
      return;
    }
    // Desktop: HTMLAudio is fine (no strict rate limit to allow fast rolls)
    playCoinHtmlAudio();
  }

  // ----- collect animation + removal -----
  function animateAndRemove(el) {
    // Avoid heavy getComputedStyle; start from identity if needed
    // You can uncomment below if you want the exact live transform baseline:
    // const cs = getComputedStyle(el);
    // const start = cs.transform && cs.transform !== 'none' ? cs.transform : 'translate3d(0,0,0)';
    // el.style.setProperty('--ccc-start', start);

    el.style.animation = 'none';
    el.style.transition = 'none';
    requestAnimationFrame(() => {
      el.style.animation = '';
      el.style.transition = '';
      el.classList.add('coin--collected');
      const done = () => { el.removeEventListener('animationend', done); el.remove(); };
      el.addEventListener('animationend', done);
      setTimeout(done, 600);
    });
  }

  // Queue + flush per frame (but play one sound **per coin**)
  const toCollect = new Set();
  let flushScheduled = false;

  function queueCollect(el) {
    if (!el || el.dataset.collected === '1') return;
    toCollect.add(el);
    if (!flushScheduled) {
      flushScheduled = true;
      requestAnimationFrame(() => {
        if (toCollect.size) {
          // Play a sound for each coin (like PC) — WebAudio handles overlap well
          for (const coin of toCollect) {
            coin.dataset.collected = '1';
            playSound();
            animateAndRemove(coin);
          }
          addCoins(toCollect.size);
          toCollect.clear();
        }
        flushScheduled = false;
      });
    }
  }

  // ----- Make newly spawned coins interactive -----
  const mo = new MutationObserver((recs) => {
    for (const r of recs) {
      r.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        if (!node.classList.contains('coin')) return;
        node.style.pointerEvents = 'auto';
        // Desktop UX: hover/click to collect
        node.addEventListener('mouseenter', () => queueCollect(node), { passive: true });
        node.addEventListener('pointerdown', () => queueCollect(node), { passive: true });
      });
    }
  });
  mo.observe(cl, { childList: true });

  // ----- Mobile swipe: rAF-throttled "brush" so it’s not finicky -----
  const BRUSH_R = 24; // 24–30px works well
  const OFF = [
    [0,0],
    [ BRUSH_R, 0], [-BRUSH_R, 0], [0, BRUSH_R], [0, -BRUSH_R]
  ];

  let pendingPoint = null;
  let brushScheduled = false;

  function brushAt(x, y) {
    for (let i = 0; i < OFF.length; i++) {
      const px = x + OFF[i][0];
      const py = y + OFF[i][1];
      const stack = document.elementsFromPoint(px, py);
      for (let j = 0; j < stack.length; j++) {
        const el = stack[j];
        if (el instanceof HTMLElement && el.classList.contains('coin') && el.dataset.collected !== '1') {
          queueCollect(el);
        }
      }
    }
  }

  function scheduleBrush(x, y) {
    pendingPoint = { x, y };
    if (!brushScheduled) {
      brushScheduled = true;
      requestAnimationFrame(() => {
        if (pendingPoint) {
          brushAt(pendingPoint.x, pendingPoint.y);
          pendingPoint = null;
        }
        brushScheduled = false;
      });
    }
  }

  // Unified pointer events for touch/pen
  pf.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      scheduleBrush(e.clientX, e.clientY);
    }
  }, { passive: true });
  pf.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      scheduleBrush(e.clientX, e.clientY);
    }
  }, { passive: true });
  pf.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      scheduleBrush(e.clientX, e.clientY);
    }
  }, { passive: true });

  // Desktop mouse "paint" (light throttle)
  let lastX = -1, lastY = -1;
  pf.addEventListener('mousemove', (e) => {
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if ((dx*dx + dy*dy) < 9) return;
    lastX = e.clientX; lastY = e.clientY;
    scheduleBrush(e.clientX, e.clientY);
  }, { passive: true });

  // Public helper
  return {
    get count() { return coins; },
    set count(v) { coins = Math.max(0, Number(v) || 0); updateHud(); save(); }
  };
}

