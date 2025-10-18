// js/game/coinPickup.js
//
// Mobile: WebAudio ONLY with a master GainNode (MOBILE_VOLUME controls loudness).
// Desktop: HTMLAudio pool at DESKTOP_VOLUME.
// Mobile animation is OFF by default for silky pickups; desktop uses CSS keyframe
// ('.coin--collected') starting from --ccc-start baseline.
// Smooth swipe: rAF-throttled "brush"; HUD/storage batched once per frame.
//
// Safe to init multiple times; guarded by `initialized`.

let initialized = false;

export function initCoinPickup({
  playfieldSelector  = '.area-cove .playfield',
  coinsLayerSelector = '.area-cove .coins-layer',
  hudAmountSelector  = '.hud-top .coin-amount',
  soundSrc           = 'sounds/coin_pickup.mp3',
  storageKey         = 'ccc:coins:v1',
  // Mobile animation OFF by default (you can expose this later in a settings menu)
  disableAnimation   = ((window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window)),
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
  // Keep touch pointer stream continuous (prevents browser gestures from stealing events)
  pf.style.touchAction = 'none';

  // ----- HUD / storage (batched once per frame) -----
  let coins = Number(localStorage.getItem(storageKey) || 0);
  const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const updateHud = () => { amt.textContent = fmt(coins); };
  const save      = () => { localStorage.setItem(storageKey, String(coins)); };
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

  // Desktop HTMLAudio volume; Mobile WebAudio master GainNode volume
  const DESKTOP_VOLUME = 0.25;
  const MOBILE_VOLUME  = 0.06; // <- your preferred mobile loudness; now respected

  // Mobile WebAudio (forced): BufferSource -> masterGain(MOBILE_VOLUME) -> destination
  let ac = null, masterGain = null, buffer = null;
  let webAudioReady = false, webAudioLoading = false, queuedPlays = 0;

  async function initWebAudioOnce() {
    if (webAudioReady || webAudioLoading) return;
    if (!('AudioContext' in window || 'webkitAudioContext' in window)) return;

    webAudioLoading = true;
    ac = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = ac.createGain();
    masterGain.gain.value = MOBILE_VOLUME;   // authoritative mobile volume
    masterGain.connect(ac.destination);

    try {
      const res = await fetch(soundSrc, { cache: 'force-cache' });
      const arr = await res.arrayBuffer();
      buffer = await new Promise((resolve, reject) => ac.decodeAudioData(arr, resolve, reject));
      if (ac.state === 'suspended') { try { await ac.resume(); } catch {} }
      webAudioReady = true;
    } catch (err) {
      console.warn('[coinPickup] WebAudio init failed:', err);
    } finally {
      webAudioLoading = false;
    }

    // Flush queued plays (coins collected before decode completed)
    if (webAudioReady && queuedPlays > 0) {
      const n = Math.min(queuedPlays, 64);
      queuedPlays = 0;
      for (let i = 0; i < n; i++) playCoinWebAudio();
    }
  }

  // Warm the context on first user gesture for iOS autoplay policy
  pf.addEventListener('pointerdown', () => { if (IS_MOBILE) initWebAudioOnce(); }, { once: true, passive: true });

  function playCoinWebAudio() {
    if (!webAudioReady || !ac || !buffer || !masterGain) {
      queuedPlays++;
      if (!webAudioLoading) initWebAudioOnce();
      return true; // will play after decode
    }
    try {
      const src = ac.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = 1.0; // no pitch change
      src.detune = 0;
      src.connect(masterGain);
      // tiny start jitter to avoid phasey feel; doesn't affect loudness
      const t = ac.currentTime + Math.random() * 0.006; // up to ~6ms
      src.start(t);
      return true;
    } catch (e) {
      console.warn('[coinPickup] playCoinWebAudio error:', e);
      return false;
    }
  }

  // Desktop HTMLAudio pool (desktop only)
  let pool = null, pIdx = 0, lastSoundAt = 0;
  if (!IS_MOBILE) {
    pool = Array.from({ length: 8 }, () => {
      const a = new Audio(soundSrc);
      a.preload = 'auto';
      a.volume = DESKTOP_VOLUME;
      return a;
    });
  }
  function playCoinHtmlAudio() {
    const now = performance.now();
    if ((now - lastSoundAt) < 40) return; // tiny de-thrash that matched your PC feel
    lastSoundAt = now;
    const a = pool[pIdx++ % pool.length];
    try { a.currentTime = 0; a.play(); } catch {}
  }

  // One sound per coin: MOBILE -> WebAudio only; DESKTOP -> HTMLAudio
  function playSound() {
    if (IS_MOBILE) {
      playCoinWebAudio();
    } else {
      playCoinHtmlAudio();
    }
  }

  // ----- Collect animation + removal -----
  function animateAndRemove(el) {
    if (disableAnimation) { el.remove(); return; } // mobile default: no animation
    // Desktop/or when enabled: original CSS keyframes ('.coin--collected')
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
    setTimeout(done, 600); // safety
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

  // ----- Newly spawned coins become interactive -----
  const mo = new MutationObserver((recs) => {
    for (const r of recs) {
      r.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        if (!node.classList.contains('coin')) return;
        node.style.pointerEvents = 'auto';
        // Desktop UX
        node.addEventListener('mouseenter', () => queueCollect(node), { passive: true });
        node.addEventListener('pointerdown', () => queueCollect(node), { passive: true });
      });
    }
  });
  mo.observe(cl, { childList: true });

  // ----- Mobile swipe: rAF-throttled brush (forgiving + efficient) -----
  const BRUSH_R = 24; // tweak 24–30 for bigger footprint if desired
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

  // Public helper (for your future settings UI)
  return {
    get count() { return coins; },
    set count(v) { coins = Math.max(0, Number(v) || 0); updateHud(); save(); },
    setMobileVolume(v) {
      if (!masterGain || !ac) return;
      const vol = Math.max(0, Math.min(1, Number(v) || 0));
      masterGain.gain.setValueAtTime(vol, ac.currentTime);
    }
  };
}
