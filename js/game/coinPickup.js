// js/game/coinPickup.js
//
// Best of both worlds + mobile volume that actually stays quiet:
// - Mobile: WebAudio (GainNode @ MOBILE_VOLUME) -> DynamicsCompressor -> destination
//           + voice-aware gain so big overlaps don't get loud
//           + one sound per coin, no pitch change, tiny start jitter to avoid phasing
//           + collect animation disabled by default (fast removal, silky)
// - Desktop: HTMLAudio pool at DESKTOP_VOLUME, original CSS keyframe collect animation
// - Smooth: rAF-throttled swipe "brush" + batched HUD/localStorage once per frame
//
// Safe to init multiple times; guarded by `initialized`.

let initialized = false;

export function initCoinPickup({
  playfieldSelector    = '.area-cove .playfield',
  coinsLayerSelector   = '.area-cove .coins-layer',
  hudAmountSelector    = '.hud-top .coin-amount',
  soundSrc             = 'sounds/coin_pickup.mp3',
  storageKey           = 'ccc:coins:v1',
  // Animation OFF by default on mobile, ON on desktop (settings-ready later)
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

  // Keep touch pointer stream continuous (prevents scroll/zoom hijacking)
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

  // Volumes
  const DESKTOP_VOLUME = 0.25;
  const MOBILE_VOLUME  = 0.08; // change this freely; it *will* take effect now

  // WebAudio graph for mobile:
  // [BufferSource x N] -> Gain (master) -> Compressor -> Destination
  let ac = null, gain = null, comp = null, buffer = null, bufferPromise = null, webAudioReady = false;

  // tiny start-time jitter to avoid phasey stacks
  const START_JITTER_MAX = 0.008; // ~8ms

  // active voices for gentle gain scaling when many coins overlap
  let activeVoices = 0;

  function recomputeMobileGain() {
    // Soft scaling: the more sources, the lower the per-coin mix
    // Tweak factor (0.18) to taste; lower = less attenuation.
    const factor = 0.18;
    const scale = 1 / (1 + factor * Math.max(0, activeVoices - 1));
    const target = MOBILE_VOLUME * scale;
    try {
      gain.gain.setTargetAtTime(target, ac.currentTime, 0.01);
    } catch {
      if (gain) gain.gain.value = target;
    }
  }

  async function initWebAudioOnce() {
    if (webAudioReady) return;
    if (!('AudioContext' in window || 'webkitAudioContext' in window)) return;

    ac = new (window.AudioContext || window.webkitAudioContext)();

    gain = ac.createGain();
    gain.gain.value = MOBILE_VOLUME;

    // DynamicsCompressor to tame big overlaps (prevents “gets loud” effect)
    comp = ac.createDynamicsCompressor();
    try {
      comp.threshold.value = -24; // start compressing around -24 dB
      comp.knee.value = 20;
      comp.ratio.value = 12;      // strong limiting when many stack
      comp.attack.value = 0.003;  // fast attack
      comp.release.value = 0.1;   // quick release
    } catch {}

    gain.connect(comp);
    comp.connect(ac.destination);

    bufferPromise = bufferPromise || (async () => {
      const res = await fetch(soundSrc, { cache: 'force-cache' });
      const arr = await res.arrayBuffer();
      return await new Promise((resolve, reject) => ac.decodeAudioData(arr, resolve, reject));
    })();
    buffer = await bufferPromise;

    if (ac.state === 'suspended') { try { await ac.resume(); } catch {} }
    webAudioReady = true;
    recomputeMobileGain();
  }

  // Warm the context on first user touch so first pickup uses correct volume/mix
  pf.addEventListener('pointerdown', () => { if (IS_MOBILE) initWebAudioOnce(); }, { once: true, passive: true });

  function playCoinWebAudio() {
    if (!webAudioReady || !ac || !buffer || !gain) return false;
    try {
      const src = ac.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = 1.0; // no pitch randomization (fixes “high-pitched” feel)
      src.detune = 0;
      src.connect(gain);

      // track active voices so we can adjust gain softly
      activeVoices++;
      recomputeMobileGain();
      src.onended = () => {
        activeVoices = Math.max(0, activeVoices - 1);
        recomputeMobileGain();
      };

      const t = ac.currentTime + Math.random() * START_JITTER_MAX;
      src.start(t);
      return true;
    } catch {
      return false;
    }
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
    if ((now - lastSoundAt) < 40) return; // tiny de-thrash that matched your PC feel
    lastSoundAt = now;
    const a = pool[pIdx++ % pool.length];
    try { a.currentTime = 0; a.play(); } catch {}
  }

  function playSound() {
    if (IS_MOBILE) {
      if (!webAudioReady) {
        // initialize, then play
        initWebAudioOnce().then(() => { playCoinWebAudio(); });
        return;
      }
      if (!playCoinWebAudio()) playCoinHtmlAudio(); // extreme fallback
      return;
    }
    playCoinHtmlAudio(); // desktop
  }

  // ----- Collect animation + removal -----
  function animateAndRemove(el) {
    if (disableAnimation) {
      el.remove(); // mobile default: no animation for silky performance
      return;
    }
    // Desktop/or when enabled: run your original keyframes ('.coin--collected')
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

  // ----- Collect queue (flush per frame) -----
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
        // Desktop UX: hover/click
        node.addEventListener('mouseenter', () => queueCollect(node), { passive: true });
        node.addEventListener('pointerdown', () => queueCollect(node), { passive: true });
      });
    }
  });
  mo.observe(cl, { childList: true });

  // ----- Mobile swipe: rAF-throttled “brush” (forgiving + efficient) -----
  const BRUSH_R = 24; // tweak 24–30 if you want a bigger footprint
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

  // Public helper: if you want to tweak mobile volume at runtime later
  return {
    get count() { return coins; },
    set count(v) { coins = Math.max(0, Number(v) || 0); updateHud(); save(); },
    setMobileVolume(v) {
      if (!gain || !ac) return;
      const vol = Math.max(0, Math.min(1, Number(v) || 0));
      // reset base and recompute with current voice scaling
      gain.gain.setValueAtTime(vol, ac.currentTime);
      recomputeMobileGain();
    }
  };
}
