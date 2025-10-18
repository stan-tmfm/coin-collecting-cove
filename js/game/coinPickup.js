// js/game/coinPickup.js
//
// Mobile feels like PC, without lag:
// - Mobile: cheap compositor-only transition on collect (no reflow), WebAudio per-coin sound
// - Desktop: keep CSS keyframe collect animation (coin--collected)
// - rAF-throttled swipe brush + batched HUD/storage
//
// Safe to init multiple times; guarded.

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

  // Smooth touch pointer stream on mobile
  pf.style.touchAction = 'none';

  // ----- state / HUD -----
  let coins = Number(localStorage.getItem(storageKey) || 0);
  const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const updateHud = () => { amt.textContent = fmt(coins); };
  const save = () => { localStorage.setItem(storageKey, String(coins)); };
  updateHud();

  // Batch HUD/storage once per frame
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
  const VOL_MOBILE  = 0.01;  // your preferred mobile volume
  const COIN_VOLUME = IS_MOBILE ? VOL_MOBILE : VOL_DESKTOP;

  // WebAudio (mobile) for perfect overlap (one sound per coin, no clumping)
  let ac = null, gain = null, buffer = null, bufferPromise = null;
  const START_JITTER_MAX = 0.008; // ~8ms random start to avoid phasey stacks

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
    if (ac.state === 'suspended') { try { await ac.resume(); } catch {} }
  }

  function playCoinWebAudio() {
    if (!ac || !buffer) return false;
    try {
      const src = ac.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = 1.0; // no pitch shift
      src.detune = 0;
      src.connect(gain);
      const t = ac.currentTime + Math.random() * START_JITTER_MAX;
      src.start(t);
      return true;
    } catch { return false; }
  }

  // HTMLAudio fallback (desktop / WA fail)
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

  // ----- collect animation + removal -----
  // Desktop: keep CSS keyframe `.coin--collected` (nice pop/float/fade)
  // Mobile: use a cheap compositor-only transition (no reflow/getComputedStyle)
  function animateAndRemove(el) {
    if (IS_MOBILE) {
      // CHEAP MOBILE PATH (no layout reads, no animationend listeners)
      // Prepare transition then change props next frame.
      el.style.willChange = 'transform,opacity';
      el.style.transition = 'transform 160ms cubic-bezier(.2,.9,.35,1), opacity 160ms linear';
      requestAnimationFrame(() => {
        // Append a small lift+scale on top of whatever transform it has
        // (If transform is empty, the += still works as a concat string op.)
        el.style.transform = (el.style.transform || '') + ' translateY(-10px) scale(1.22)';
        el.style.opacity = '0';
        setTimeout(() => { el.remove(); }, 200);
      });
    } else {
      // DESKTOP CSS KEYFRAME PATH
      // Start keyframes from current pose without forcing reflow:
      // cancel any running CSS animation cleanly
      try { el.getAnimations?.().forEach(a => a.cancel()); } catch {}
      // Capture current computed transform for --ccc-start (one style read on desktop only)
      const cs = getComputedStyle(el);
      const start = cs.transform && cs.transform !== 'none' ? cs.transform : 'translate3d(0,0,0)';
      el.style.setProperty('--ccc-start', start);
      // Kick the CSS animation
      el.classList.add('coin--collected');
      const done = () => { el.removeEventListener('animationend', done); el.remove(); };
      el.addEventListener('animationend', done);
      setTimeout(done, 600); // safety
    }
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
          addCoins(toCollect.size); // HUD/storage once per frame
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

  // ----- Mobile swipe: rAF-throttled brush (forgiving) -----
  const BRUSH_R = 24; // tweak 24–30 if needed
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

