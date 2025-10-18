// js/game/coinPickup.js
//
// Mobile: WebAudio ONLY (no HTMLAudio) so volume always respects MOBILE_VOLUME.
// - Each coin: BufferSource -> perVoiceGain(1.0) -> masterGain(MOBILE_VOLUME) -> destination
// - If buffer not ready yet, we queue plays and flush after decode (no loud fallback)
// - Animation disabled by default on mobile for perf; PC uses your CSS keyframe
// - Smooth swipe: rAF-throttled brush; HUD/storage batched once per frame
//
// Desktop: HTMLAudio pool at DESKTOP_VOLUME; same CSS keyframe animation
//
// Safe to init multiple times; guarded.

let initialized = false;

export function initCoinPickup({
  playfieldSelector  = '.area-cove .playfield',
  coinsLayerSelector = '.area-cove .coins-layer',
  hudAmountSelector  = '.hud-top .coin-amount',
  soundSrc           = 'sounds/coin_pickup.mp3',
  storageKey         = 'ccc:coins:v1',
  // Mobile animation defaults OFF (settings-ready later)
  disableAnimation   = ((window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window)),
} = {}) {
  if (initialized) return;
  initialized = true;

  // ---- DOM ----
  const pf  = document.querySelector(playfieldSelector);
  const cl  = document.querySelector(coinsLayerSelector);
  const amt = document.querySelector(hudAmountSelector);
  if (!pf || !cl || !amt) {
    console.warn('[coinPickup] missing required nodes', { pf: !!pf, cl: !!cl, amt: !!amt });
    return;
  }

  // Keep touch pointer stream continuous
  pf.style.touchAction = 'none';

  // ---- HUD / storage (batched) ----
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

  // ---- Audio ----
  const IS_MOBILE = (window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window);

  // Volumes
  const DESKTOP_VOLUME = 0.25; // HTMLAudio
  const MOBILE_VOLUME  = 0.08; // master GainNode on mobile — change this to taste

  // Mobile WebAudio (forced)
  let ac = null, masterGain = null, buffer = null;
  let webAudioReady = false, webAudioLoading = false;
  let queuedPlays = 0; // how many coins tried to play before buffer was ready

  async function initWebAudioOnce() {
    if (webAudioReady || webAudioLoading) return;
    if (!('AudioContext' in window || 'webkitAudioContext' in window)) return;

    webAudioLoading = true;
    ac = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain controls overall mobile loudness
    masterGain = ac.createGain();
    masterGain.gain.value = MOBILE_VOLUME;
    masterGain.connect(ac.destination);

    // Fetch + decode the buffer once
    try {
      const res = await fetch(soundSrc, { cache: 'force-cache' });
      const arr = await res.arrayBuffer();
      buffer = await new Promise((resolve, reject) =>
        ac.decodeAudioData(arr, resolve, reject)
      );
      if (ac.state === 'suspended') { try { await ac.resume(); } catch {} }
      webAudioReady = true;
    } catch (err) {
      console.warn('[coinPickup] WebAudio init failed:', err);
    } finally {
      webAudioLoading = false;
    }

    // Flush any queued plays now that we’re ready
    if (webAudioReady && queuedPlays > 0) {
      const n = Math.min(queuedPlays, 64); // cap just in case
      queuedPlays = 0;
      for (let i = 0; i < n; i++) playCoinWebAudio();
    }
  }

  // Warm context on first touch for iOS
  pf.addEventListener('pointerdown', () => { if (IS_MOBILE) initWebAudioOnce(); }, { once: true, passive: true });

  function playCoinWebAudio() {
    if (!webAudioReady || !ac || !buffer || !masterGain) {
      // Not ready yet — queue and kick off init
      queuedPlays++;
      if (!webAudioLoading) initWebAudioOnce();
      return true; // consider handled; it will play after decode
    }
    try {
      const src = ac.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = 1.0; // no pitch shift
      // Per-voice gain (keep at 1.0; masterGain is the volume control)
      const g = ac.createGain();
      g.gain.value = 1.0;
      src.connect(g);
      g.connect(masterGain);
      // Small start jitter prevents clicks/phasiness without affecting loudness expectation
      const t = ac.currentTime + Math.random() * 0.006; // up to ~6ms
      src.start(t);
      return true;
    } catch (e) {
      console.warn('[coinPickup] playCoinWebAudio error:', e);
      return false;
    }
  }

  // Desktop HTMLAudio pool
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

  // One sound per coin, but: MOBILE => WebAudio only; DESKTOP => HTMLAudio
  function playSound() {
    if (IS_MOBILE) {
      // Force WebAudio; never fall back to HTMLAudio on mobile
      playCoinWebAudio();
      return;
    }
    playCoinHtmlAudio();
  }

  // ---- Collect animation + removal ----
  function animateAndRemove(el) {
    if (disableAnimation) { el.remove(); return; }
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
    setTimeout(done, 600);
  }

  // ---- Collect queue (flush per frame) ----
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
            playSound();
            animateAndRemove(coin);
          }
          addCoins(toCollect.size); // HUD/storage once per frame
          toCollect.clear();
        }
        flushScheduled = false;
      });
    }
  }

  // ---- Newly spawned coins interactive ----
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

  // ---- Mobile swipe: rAF-throttled brush ----
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

  // Desktop mouse paint (light throttle)
  let lastX = -1, lastY = -1;
  pf.addEventListener('mousemove', (e) => {
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if ((dx*dx + dy*dy) < 9) return;
    lastX = e.clientX; lastY = e.clientY;
    scheduleBrush(e.clientX, e.clientY);
  }, { passive: true });

  // Public helper to tweak mobile volume at runtime (for your future settings menu)
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
