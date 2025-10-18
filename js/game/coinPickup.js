// js/game/coinPickup.js
//
// Mobile + desktop collection that feels like PC:
// - Mobile: each coin plays its own sound (WebAudio), no clumping, no pitch shift
// - rAF-throttled swipe + small "brush" so swipes aren't finicky
// - Batches HUD/localStorage (1 write per frame), reduces jank
// - Restores CSS collect animation (uses --ccc-start baseline)
// - Desktop: hover/click still work
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

  // Smooth touch pointer stream (prevents scroll/zoom hijacking)
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
  const VOL_MOBILE  = 0.01;
  const COIN_VOLUME = IS_MOBILE ? VOL_MOBILE : VOL_DESKTOP;

  // WebAudio (mobile overlap with no pitch change)
  let ac = null, gain = null, buffer = null, bufferPromise = null;
  const START_JITTER_MAX = 0.008; // up to ~8ms random start to avoid phasey clumps

  async function initWebAudioOnce() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    gain = ac.createGain();
    gain.gain.value = COIN_VOLUME;
    gain.connect(ac.destination);
    bufferPromise = bufferPromise || (async () => {
      const res = await fetch(soundSrc);
      const arr = await res.arrayBuffer();
      return await ac.decodeAudioData(arr);
    })();
    buffer = await bufferPromise;
    if (ac.state === 'suspended') {
      try { await ac.resume(); } catch {}
    }
  }

  function playCoinWebAudio() {
    if (!ac || !buffer) return false;
    try {
      const src = ac.createBufferSource();
      src.buffer = buffer;
      // No pitch change (fix for “high-pitched” cluster); just tiny start jitter
      src.playbackRate.value = 1.0;
      src.detune = 0;
      src.connect(gain);
      const t = ac.currentTime + Math.random() * START_JITTER_MAX;
      src.start(t);
      return true;
    } catch {
      return false;
    }
  }

  // HTMLAudio fallback (desktop or WA fail)
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
    if (IS_MOBILE && !ac) {
      initWebAudioOnce().then(() => {
        if (!playCoinWebAudio()) playCoinHtmlAudio();
      }).catch(() => playCoinHtmlAudio());
      return;
    }
    if (IS_MOBILE && ac && buffer) {
      if (!playCoinWebAudio()) playCoinHtmlAudio();
      return;
    }
    playCoinHtmlAudio(); // desktop
  }

  // ----- collect animation + removal (restore CSS animation) -----
  function animateAndRemove(el) {
    // Capture live transform so keyframes start from the coin’s current pose
    const cs = getComputedStyle(el);
    const start = cs.transform && cs.transform !== 'none' ? cs.transform : 'translate3d(0,0,0)';
    el.style.setProperty('--ccc-start', start);

    // Clear any inline anim/transition from spawn; force reflow; then run CSS animation
    el.style.animation = 'none';
    el.style.transition = 'none';
    // Force reflow to commit 'none'
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.style.animation = '';
    el.style.transition = '';
    el.classList.add('coin--collected');

    const done = () => { el.removeEventListener('animationend', done); el.remove(); };
    el.addEventListener('animationend', done);
    setTimeout(done, 600); // safety
  }

  // Queue + flush per frame (sound plays per coin)
  const toCollect = new Set();
  let flushScheduled = false;

  function queueCollect(el) {
    if (!el || el.dataset.collected === '1') return;
    toCollect.add(el);
    if (!flushScheduled) {
      flushScheduled = true;
      requestAnimationFrame(() => {
        if (toCollect.size) {
          for (const coin of toCollect) {
            coin.dataset.collected = '1';
            playSound();          // one sound per coin (like PC)
            animateAndRemove(coin);
          }
          addCoins(toCollect.size);
          toCollect.clear();
        }
        flushScheduled = false;
      });
    }
  }

  // ----- make newly spawned coins interactive -----
  const mo = new MutationObserver((recs) => {
    for (const r of recs) {
      r.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        if (!node.classList.contains('coin')) return;
        node.style.pointerEvents = 'auto';
        node.addEventListener('mouseenter', () => queueCollect(node), { passive: true });
        node.addEventListener('pointerdown', () => queueCollect(node), { passive: true });
      });
    }
  });
  mo.observe(cl, { childList: true });

  // ----- mobile swipe: rAF-throttled brush -----
  const BRUSH_R = 24;
  const OFF = [
    [0,0], [ BRUSH_R, 0], [-BRUSH_R, 0], [0, BRUSH_R], [0, -BRUSH_R]
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
    if (e.pointerType === 'touch' || e.pointerType === 'pen') scheduleBrush(e.clientX, e.clientY);
  }, { passive: true });
  pf.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') scheduleBrush(e.clientX, e.clientY);
  }, { passive: true });
  pf.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') scheduleBrush(e.clientX, e.clientY);
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

