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

  // Make touch move silky (prevents browser scroll/zoom interfering with pointer stream)
  // You can move this to CSS (.playfield { touch-action:none; }) if you prefer.
  pf.style.touchAction = 'none';

  // ----- state -----
  let coins = Number(localStorage.getItem(storageKey) || 0);
  function fmt(n) { return n.toLocaleString(undefined, { maximumFractionDigits: 0 }); }
  function updateHud() { amt.textContent = fmt(coins); }
  function save() { localStorage.setItem(storageKey, String(coins)); }
  updateHud();

  // Batch HUD/localStorage to once per frame
  let pendingHudDelta = 0;
  let hudFlushScheduled = false;
  function addCoins(n) {
    pendingHudDelta += n;
    if (!hudFlushScheduled) {
      hudFlushScheduled = true;
      requestAnimationFrame(() => {
        if (pendingHudDelta !== 0) {
          coins += pendingHudDelta;
          pendingHudDelta = 0;
          updateHud();
          save();
        }
        hudFlushScheduled = false;
      });
    }
  }

  // ----- audio (mobile quieter) -----
  const IS_MOBILE = (window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window);
  const COIN_VOL_DESKTOP = 0.25;
  const COIN_VOL_MOBILE  = 0.05;
  const COIN_VOLUME = IS_MOBILE ? COIN_VOL_MOBILE : COIN_VOL_DESKTOP;

  const pool = Array.from({ length: 6 }, () => {
    const a = new Audio(soundSrc);
    a.preload = 'auto';
    a.volume = COIN_VOLUME;
    return a;
  });
  let pIdx = 0;
  let lastSoundAt = 0;
  function playSound() {
    const now = performance.now();
    if (now - lastSoundAt < 40) return; // soft rate-limit
    lastSoundAt = now;
    const a = pool[pIdx++ % pool.length];
    try { a.currentTime = 0; a.play(); } catch {}
  }

  // ----- collect animation + removal -----
  function animateAndRemove(el) {
    const cs = getComputedStyle(el);
    const start = cs.transform && cs.transform !== 'none' ? cs.transform : 'translate3d(0,0,0)';
    el.style.setProperty('--ccc-start', start);

    // Clear inline anim so CSS rule takes over; sequence via rAF avoids per-coin forced reflow
    el.style.animation = 'none';
    el.style.transition = 'none';

    requestAnimationFrame(() => {
      el.style.animation = '';
      el.style.transition = '';
      el.classList.add('coin--collected');

      const done = () => { el.removeEventListener('animationend', done); el.remove(); };
      el.addEventListener('animationend', done);
      setTimeout(done, 600); // safety
    });
  }

  // Batch collect (avoid doing full work inside touch event)
  const toCollect = new Set();
  let sweepFlushScheduled = false;
  function queueCollect(el) {
    if (!el || el.dataset.collected === '1') return;
    toCollect.add(el);
    if (!sweepFlushScheduled) {
      sweepFlushScheduled = true;
      requestAnimationFrame(() => {
        // Flush all queued coins this frame
        if (toCollect.size) {
          // HUD & storage once per frame (batched)
          addCoins(toCollect.size);

          // Do per-coin side effects
          for (const coin of toCollect) {
            coin.dataset.collected = '1';
            animateAndRemove(coin);
          }

          // Play one sound (rate-limited) — this still sounds great during swipes
          playSound();

          // Mobile haptic (optional)
          if (IS_MOBILE && navigator.vibrate) navigator.vibrate(10);

          toCollect.clear();
        }
        sweepFlushScheduled = false;
      });
    }
  }

  // ----- Ensure newly spawned coins are interactive (desktop) -----
  // (Spawner creates .coin with pointer-events: none; we flip to auto)
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

  // ----- Mobile swipe hit-testing (rAF-throttled "brush") -----
  // Sample pattern: center + ring (8 points) around the finger.
  const BRUSH_R = 28; // px radius around finger (tweak 22–34 if needed)
  const OFF = [
    [ 0,  0],
    [ BRUSH_R, 0], [-BRUSH_R, 0], [0,  BRUSH_R], [0, -BRUSH_R],
    [ 0.7071*BRUSH_R,  0.7071*BRUSH_R],
    [ 0.7071*BRUSH_R, -0.7071*BRUSH_R],
    [-0.7071*BRUSH_R,  0.7071*BRUSH_R],
    [-0.7071*BRUSH_R, -0.7071*BRUSH_R],
  ];

  let pendingPoint = null;
  let brushScheduled = false;

  function brushAt(x, y) {
    // Hit-test a handful of points; dedupe and queue coins
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

  // Use unified pointer events for mobile swipe; keep passive listeners for responsiveness
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

  // Also collect on generic tap/click anywhere inside playfield
  pf.addEventListener('pointerup', (e) => {
    scheduleBrush(e.clientX, e.clientY);
  }, { passive: true });

  // Desktop "paint" with mouse (cheaply throttled)
  let lastX = -1, lastY = -1;
  pf.addEventListener('mousemove', (e) => {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if ((dx*dx + dy*dy) < 9) return;
    lastX = e.clientX; lastY = e.clientY;
    scheduleBrush(e.clientX, e.clientY);
  }, { passive: true });

  // Exposed helper (optional)
  return {
    get count() { return coins; },
    set count(v) { coins = Math.max(0, Number(v) || 0); updateHud(); save(); }
  };
}

