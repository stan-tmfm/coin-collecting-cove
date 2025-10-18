// js/game/coinPickup.js
//
// Best of both:
// - Mobile: WebAudio per-coin @ 0.08 through GainNode (no pitch shift), animation disabled by default
// - Desktop: original CSS keyframe collect animation ('.coin--collected')
// - Smooth: rAF-throttled swipe "brush" + batched HUD/storage (1 write per frame)
// - One sound per coin on both platforms
//
// Safe to init multiple times; guarded by `initialized`.

let initialized = false;

export function initCoinPickup({
  playfieldSelector    = '.area-cove .playfield',
  coinsLayerSelector   = '.area-cove .coins-layer',
  hudAmountSelector    = '.hud-top .coin-amount',
  soundSrc             = 'sounds/coin_pickup.mp3',
  storageKey           = 'ccc:coins:v1',
  // Animation: OFF by default on mobile, ON on desktop (we can expose this later in settings)
  disableAnimation     = ((window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window)),
} = {}) {
  if (initialized) return;
  initialized = true;

  // ----- DOM -----
  const pf  = document.querySelector(playfieldSelector);
  const cl  = document.querySelector(coinsLayerSelector);
  const amt = document.querySelector(hudAmountSelector);
  if (!pf || !cl || !amt) {
    console.warn('[coinPickup] missing required nodes', { pf: !!pf, cl: !!cl, amt: !!amt });
    return;
  }

  // Mobile pointer stream stays continuous (prevents browser gestures stealing events)
  pf.style.touchAction = 'none';

  // ----- HUD / storage (batched) -----
  let coins = Number(localStorage.getItem(storageKey) || 0);
  const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const updateHud = () => { amt.textContent = fmt(coins); };
  const save = () => { localStorage.setItem(storageKey, String(coins)); };
  updateHud();

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

  // ----- Audio -----
  const IS_MOBILE = (window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window);

  // Desktop HTMLAudio volume; Mobile WebAudio GainNode volume
  const DESKTOP_VOLUME = 0.25;
  const MOBILE_VOLUME  = 0.08;

  // WebAudio (mobile) for exact volume + overlap
  let ac = null, gain = null, buffer = null, bufferPromise = null, webAudioReady = false;
  const START_JITTER_MAX = 0.008; // ~8ms start offset to avoid phasing when many start together

  async function initWebAudioOnce() {
    if (webAudioReady) return;
    if (!('AudioContext' in window || 'webkitAudioContext' in window)) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    gain = ac.createGain();
    gain.gain.value = MOBILE_VOLUME;   // << mobile loudness lives here and WILL work
    gain.connect(ac.destination);
    bufferPromise = bufferPromise || (async () => {
      const res = await fetch(soundSrc, { cache: 'force-cache' });
      const arr = await res.arrayBuffer();
      return await new Promise((resolve, reject) => ac.decodeAudioData(arr, resolve, reject));
    })();
    buffer = await bufferPromise;
    if (ac.state === 'suspended') { try { await ac.resume(); } catch {} }
    webAudioReady = true;
  }

  // Warm the context on first user touch so first pickup uses correct volume
  pf.addEventListener('pointerdown', () => { if (IS_MOBILE) initWebAudioOnce(); }, { once: true, passive: true });

  function playCoinWebAudio() {
    if (!webAudioReady || !ac || !buffer || !gain) return false;
    try {
      const src = ac.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = 1.0; // no pitch randomization (prevents “high” clusters)
      src.detune = 0;
      src.connect(gain);
      const t = ac.currentTime + Math.random() * START_JITTER_MAX; // tiny timing jitter only
      src.start(t);
      return true;
    } catch { return false; }
  }

  // Desktop / fallback HTMLAudio pool
  const pool = Array.from({ length: 8 }, () => {
    const a = new Audio(soundSrc);
    a.preload = 'auto';
    a.volume = DESKTOP_VOLUME;
    return a;
  });
  let pIdx = 0;
  let lastSoundAt = 0;
  function playCoinHtmlAudio() {
    const now = performance.now();
    if ((now - lastSoundAt) < 40) return; // tiny de-thrash, desktop felt good with this
    lastSoundAt = now;
    const a = pool[pIdx++ % pool.length];
    try { a.currentTime = 0; a.play(); } catch {}
  }

  function playSound() {
    if (IS_MOBILE) {
      if (!webAudioReady) {
        initWebAudioOnce().then(() => playCoinWebAudio());
        return;
      }
      if (!playCoinWebAudio()) playCoinHtmlAudio(); // rare fallback
      return;
    }
    playCoinHtmlAudio(); // desktop
  }

  // ----- Collect animation + removal -----
  // Mobile: animation disabled => instant remove (keeps pickups silky)
  // Desktop: original keyframe animation from your CSS ('.coin--collected')
  function animateAndRemove(el) {
    if (disableAnimation) { el.remove(); return; }

    // (Desktop path) Start keyframes from live pose for correct look
    const cs = getComputedStyle(el);
    const start = cs.transform && cs.transform !== 'none' ? cs.transform : 'translate3d(0,0,0)';
    el.style.setProperty('--ccc-start', start);

    el.style.animation = 'none';
    el.style.transition = 'none';
    // force reflow to commit 'none'
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.style.animation = '';
    el.style.transition = '';
    el.classList.add('coin--collected');

    const done = () => { el.removeEventListener('animationend', done); el.remove(); };
    el.addEventListener('animationend', done);
    setTimeout(done, 600); // safety
  }

  // ----- Collect queue (per-frame flush) -----
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
            playSound();          // one sound per coin
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
        // Desktop UX: hover/click
        node.addEventListener('mouseenter', () => queueCollect(node), { passive: true });
        node.addEventListener('pointerdown', () => queueCollect(node), { passive: true });
      });
    }
  });
  mo.observe(cl, { childList: true });

  // ----- Mobile swipe: rAF-throttled “brush” (forgiving + efficient) -----
  const BRUSH_R = 24; // tweak 24–30 if you want bigger footprint
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

  // Desktop mouse paint (light throttle)
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
