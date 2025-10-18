// js/game/coinPickup.js
//
// Mobile volume FIX: always use WebAudio on mobile and control loudness via GainNode.
// - Mobile: WebAudio per-coin sound @ 0.08 (change MOBILE_VOLUME to taste), no clumping
// - Desktop: HTMLAudio pool (unchanged feel)
// - Animation: disabled by default on mobile (flag), original CSS keyframes on desktop
// - Smoothness: rAF-throttled swipe "brush", batched HUD/storage once per frame
//
// Safe to init multiple times; guarded.

let initialized = false;

export function initCoinPickup({
  playfieldSelector    = '.area-cove .playfield',
  coinsLayerSelector   = '.area-cove .coins-layer',
  hudAmountSelector    = '.hud-top .coin-amount',
  soundSrc             = 'sounds/coin_pickup.mp3',
  storageKey           = 'ccc:coins:v1',
  // Animation flag: OFF by default on mobile, ON on desktop
  disableAnimation     = ((window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window)),
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

  // ----- audio (mobile always WebAudio) -----
  const IS_MOBILE = (window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window);

  // Volumes
  const DESKTOP_VOLUME = 0.25;
  const MOBILE_VOLUME  = 0.25;

  // WebAudio graph for mobile
  let ac = null, gain = null, buffer = null, bufferPromise = null, webAudioReady = false;
  const START_JITTER_MAX = 0.008; // ~8ms random offset to avoid phasing

  async function initWebAudioOnce() {
    if (webAudioReady) return;
    if (!('AudioContext' in window || 'webkitAudioContext' in window)) {
      webAudioReady = false; return; // very rare
    }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    gain = ac.createGain();
    gain.gain.value = MOBILE_VOLUME;          // << mobile loudness lives here
    gain.connect(ac.destination);

    bufferPromise = bufferPromise || (async () => {
      const res = await fetch(soundSrc, { cache: 'force-cache' });
      const arr = await res.arrayBuffer();
      return await new Promise((resolve, reject) => {
        ac.decodeAudioData(arr, resolve, reject);
      });
    })();

    buffer = await bufferPromise;
    if (ac.state === 'suspended') { try { await ac.resume(); } catch {} }
    webAudioReady = true;
  }

  // Warm WebAudio on the first touch so the very first coin plays at the right volume
  const warmAudio = () => { if (IS_MOBILE) initWebAudioOnce(); };
  pf.addEventListener('pointerdown', warmAudio, { once: true, passive: true });

  function playCoinWebAudio() {
    if (!webAudioReady || !ac || !buffer || !gain) return false;
    try {
      const src = ac.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = 1.0; // no pitch shift
      src.detune = 0;
      src.connect(gain);
      const t = ac.currentTime + Math.random() * START_JITTER_MAX;
      src.start(t);
      return true;
    } catch {
      return false;
    }
  }

  // Desktop / fallback: HTMLAudio pool
  const pool = Array.from({ length: 8 }, () => {
    const a = new Audio(soundSrc);
    a.preload = 'auto';
    a.volume = DESKTOP_VOLUME; // desktop loudness
    return a;
  });
  let pIdx = 0;
  let lastSoundAt = 0;
  function playCoinHtmlAudio() {
    const now = performance.now();
    if ((now - lastSoundAt) < 40) return; // tiny de-thrash
    lastSoundAt = now;
    const a = pool[pIdx++ % pool.length];
    try { a.currentTime = 0; a.play(); } catch {}
  }

  function playSound() {
    if (IS_MOBILE) {
      // Ensure WA is ready; if not, queue init and also try playback right away once ready
      if (!webAudioReady) {
        initWebAudioOnce().then(() => { playCoinWebAudio(); });
        return;
      }
      // Mobile path always WebAudio so MOBILE_VOLUME is honored
      if (!playCoinWebAudio()) {
        // absolute fallback (very rare). On iOS, HTMLAudio volume is often ignored.
        playCoinHtmlAudio();
      }
      return;
    }
    // Desktop: HTMLAudio pool is fine
    playCoinHtmlAudio();
  }

  // ----- collect animation + removal -----
  function animateAndRemove(el) {
    if (disableAnimation) {
      el.remove();
      return;
    }
    // Desktop/or when animations enabled: run the original keyframes from coin.css
    const cs = getComputedStyle(el);
    const start = cs.transform && cs.transform !== 'none' ? cs.transform : 'translate3d(0,0,0)';
    el.style.setProperty('--ccc-start', start);
    el.style.animation = 'none';
    el.style.transition = 'none';
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
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
    addCoins(1);
    playSound();
    animateAndRemove(el);
  }

  // ----- Make newly spawned coins interactive -----
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

  // ----- Mobile swipe: rAF-throttled brush -----
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
          collect(el);
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
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.classList && el.classList.contains('coin')) collect(el);
  }, { passive: true });

  // Public helper
  return {
    get count() { return coins; },
    set count(v) { coins = Math.max(0, Number(v) || 0); updateHud(); save(); }
  };
}
