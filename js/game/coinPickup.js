// js/game/coinPickup.js — fixed mobile pickup + safe volume handling
// Works on touch + mouse. Mobile uses WebAudio with a master GainNode (respects MOBILE_VOLUME)
// and falls back to <audio> if decode/autoplay fails. Desktop uses a small HTMLAudio pool.
// Picking coins works via: (a) brush sweep using elementsFromPoint, (b) direct coin pointerdown/mouseenter.
// No reliance on CSS animations for pickup on mobile; desktop animation class is optional.

import { BigNum } from '../util/bigNum.js';
import { formatCoin } from '../util/numFormat.js';
import { unlockShop } from '../ui/hudButtons.js';

const SHOP_UNLOCK_KEY   = 'ccc:unlock:shop';          // matches HUD
const SHOP_PROGRESS_KEY = 'ccc:unlock:shop:progress'; // simple integer counter
let coinPickup = null; // to allow re-inits without double listeners

export function initCoinPickup({
  playfieldSelector   = '.area-cove .playfield',
  coinsLayerSelector  = '.area-cove .coins-layer',
  hudAmountSelector   = '.hud-top .coin-amount',
  // A tolerant default: supports class, data-attr, or prior sprite class names.
  coinSelector        = '.coin, [data-coin], .coin-sprite',
  soundSrc            = 'sounds/coin_pickup.mp3',
  storageKey          = 'ccc:coins',
  disableAnimation    = (window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window),
} = {}) {
  // Clean up previous init if any
  if (coinPickup?.destroy) {
    coinPickup.destroy();
  }

  // ----- DOM -----
  const pf  = document.querySelector(playfieldSelector);
  const cl  = document.querySelector(coinsLayerSelector);
  const amt = document.querySelector(hudAmountSelector);
  if (!pf || !cl || !amt) {
    console.warn('[coinPickup] missing required nodes', { pf: !!pf, cl: !!cl, amt: !!amt });
    return { destroy(){} };
  }

  // Avoid browser gestures hijacking touch while keeping pointer events flowing
  pf.style.touchAction = 'none';

  // ----- HUD / storage -----
  let coins = BigNum.fromStorage(localStorage.getItem(storageKey)) || BigNum.zero();
  const updateHud = () => { amt.textContent = formatCoin(coins); };
  const save      = () => { localStorage.setItem(storageKey, coins.toStorage()); };
  updateHud();
    // If progress already met the threshold but the flag isn't set yet, unlock now
  const prog = parseInt(localStorage.getItem(SHOP_PROGRESS_KEY) || '0', 10);
  if (prog >= 10 && localStorage.getItem(SHOP_UNLOCK_KEY) !== '1') {
    unlockShop(); // shows the button and writes localStorage
  }


  // ----- Helpers -----
  const IS_MOBILE = (window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window);
  const DESKTOP_VOLUME = 0.25;
  const MOBILE_VOLUME  = 0.08;
  const resolvedSrc = new URL(soundSrc, document.baseURI).href;

  // coins test
  const isCoin = (el) => el instanceof HTMLElement && el.dataset.collected !== '1' && el.matches(coinSelector);

  // Make current & future coins receptive to events even if CSS had pointer-events:none
  function ensureInteractive(el){ try { el.style.pointerEvents = 'auto'; } catch {} }
  cl.querySelectorAll(coinSelector).forEach(ensureInteractive);
  const mo = new MutationObserver((recs) => {
    for (const r of recs){
      r.addedNodes.forEach(n => { if (n instanceof HTMLElement && n.matches(coinSelector)) { ensureInteractive(n); bindCoinDirect(n); } });
    }
  });
  mo.observe(cl, { childList: true, subtree: true });

  // ----- Audio (Mobile: WebAudio + fallback) -----
  let ac = null, masterGain = null, buffer = null;
  let webAudioReady = false, webAudioLoading = false, webAudioAttempted = false;
  let queuedPlays = 0;

  // mobile fallback
  let mobileFallback = null;
  function playCoinMobileFallback(){
    if (!mobileFallback){
      mobileFallback = new Audio(resolvedSrc);
      mobileFallback.preload = 'auto';
      mobileFallback.volume = MOBILE_VOLUME;
    }
    try { mobileFallback.currentTime = 0; mobileFallback.play(); } catch {}
  }

  async function initWebAudioOnce(){
    if (webAudioReady || webAudioLoading) return;
    if (!('AudioContext' in window || 'webkitAudioContext' in window)) return;

    webAudioLoading = true; webAudioAttempted = true;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ac.createGain();
    masterGain.gain.value = MOBILE_VOLUME;
    masterGain.connect(ac.destination);

    try {
      const res = await fetch(resolvedSrc, { cache: 'force-cache' });
      const arr = await res.arrayBuffer();
      buffer = await new Promise((ok, err) => ac.decodeAudioData(arr, ok, err));
      if (ac.state === 'suspended') { try { await ac.resume(); } catch {} }
      webAudioReady = true;
    } catch (e) {
      console.warn('[coinPickup] WebAudio init failed:', e);
    } finally {
      webAudioLoading = false;
    }

    // Flush queued plays if coins were collected before decode finished
    if (webAudioReady && queuedPlays > 0){
      const n = Math.min(queuedPlays, 64); queuedPlays = 0;
      for (let i=0;i<n;i++) playCoinWebAudio();
    }
  }

  function playCoinWebAudio(){
    if (ac && ac.state === 'suspended'){ try { ac.resume(); } catch {} }

    if (!webAudioReady || !ac || !buffer || !masterGain){
      queuedPlays++;
      if (!webAudioLoading) initWebAudioOnce();
      if (IS_MOBILE && webAudioAttempted && !webAudioLoading && buffer == null && queuedPlays > 1){
        playCoinMobileFallback();
      }
      return true;
    }

    try {
      const src = ac.createBufferSource();
      src.buffer = buffer;
      try { src.detune = 0; } catch {}
      src.connect(masterGain);
      const t = ac.currentTime + Math.random()*0.006; // avoid phasing when many play
      src.start(t);
      return true;
    } catch (e){
      console.warn('[coinPickup] playCoinWebAudio error:', e);
      if (IS_MOBILE) playCoinMobileFallback();
      return false;
    }
  }

  function playSound(){
    if (IS_MOBILE) return playCoinWebAudio();
    return playCoinHtmlAudio();
  }

  // Warm WebAudio eager on any gesture (window + playfield), capture=true so overlays don’t block
  const warm = () => { if (IS_MOBILE) initWebAudioOnce(); };
  ['pointerdown', 'touchstart', 'click'].forEach(evt => {
    window.addEventListener(evt, warm, { once: true, passive: true, capture: true });
    pf.addEventListener(evt, warm, { once: true, passive: true, capture: true });
  });

  // ----- Desktop audio pool -----
  let pool = null, pIdx = 0, lastAt = 0;
  if (!IS_MOBILE){
    pool = Array.from({ length: 8 }, () => { const a = new Audio(resolvedSrc); a.preload = 'auto'; a.volume = DESKTOP_VOLUME; return a; });
  }
  function playCoinHtmlAudio(){
    const now = performance.now(); if ((now - lastAt) < 40) return; lastAt = now;
    const a = pool[pIdx++ % pool.length];
    try { a.currentTime = 0; a.play(); } catch {}
  }

  // ----- Collecting -----
  function animateAndRemove(el){
    if (disableAnimation) { el.remove(); return; }
    const cs = getComputedStyle(el);
    const start = cs.transform && cs.transform !== 'none' ? cs.transform : 'translate3d(0,0,0)';
    el.style.setProperty('--ccc-start', start);
    el.classList.add('coin--collected');
    const done = () => { el.removeEventListener('animationend', done); el.remove(); };
    el.addEventListener('animationend', done);
    setTimeout(done, 600);
  }

  function collect(el){
    if (!isCoin(el)) return false;
    el.dataset.collected = '1';
    playSound();
    animateAndRemove(el);
    // BigNum-safe increment
    coins = coins.add(BigNum.fromInt(1));
    updateHud();
    save();
	    // --- progress toward shop unlock ---
    if (localStorage.getItem(SHOP_UNLOCK_KEY) !== '1') {
      const next = (parseInt(localStorage.getItem(SHOP_PROGRESS_KEY) || '0', 10) + 1);
      if (next >= 10) {
        // Reaching 10 pickups unlocks the shop immediately
        localStorage.setItem(SHOP_PROGRESS_KEY, String(next));
        unlockShop(); // updates localStorage ('ccc:unlock:shop') and reveals the button
      } else {
        localStorage.setItem(SHOP_PROGRESS_KEY, String(next));
      }
    }

    return true;
  }


  // direct coin events as a safety net (helps if elementsFromPoint misses due to CSS)
  function bindCoinDirect(coin){
    coin.addEventListener('pointerdown', (e) => { collect(coin); }, { passive: true });
    coin.addEventListener('mouseenter', () => { if (!IS_MOBILE) collect(coin); }, { passive: true });
  }
  cl.querySelectorAll(coinSelector).forEach(bindCoinDirect);

  // Brush sweep — checks several offsets so you can “graze” coins while swiping
  const BRUSH_R = 18; // px
  const OFF = [[0,0],[BRUSH_R,0],[-BRUSH_R,0],[0,BRUSH_R],[0,-BRUSH_R]];
  function brushAt(x,y){
    // Primary: use hit-test stack
    for (let k=0;k<OFF.length;k++){
      const px = x + OFF[k][0], py = y + OFF[k][1];
      const stack = document.elementsFromPoint(px, py);
      for (let i=0;i<stack.length;i++){
        const el = stack[i];
        if (isCoin(el)) { collect(el); }
      }
    }
  }

  // Schedule brush per frame for performance
  let pending = null, brushScheduled = false;
  function scheduleBrush(x,y){
    pending = {x,y};
    if (!brushScheduled){
      brushScheduled = true;
      requestAnimationFrame(() => {
        if (pending){ brushAt(pending.x, pending.y); pending = null; }
        brushScheduled = false;
      });
    }
  }

  // Touch / pen
  pf.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') scheduleBrush(e.clientX, e.clientY); }, { passive: true });
  pf.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') scheduleBrush(e.clientX, e.clientY); }, { passive: true });
  pf.addEventListener('pointerup',   (e) => { if (e.pointerType !== 'mouse') scheduleBrush(e.clientX, e.clientY); }, { passive: true });

  // Desktop mouse hover sweep (lightly throttled by rAF above)
  pf.addEventListener('mousemove', (e) => { scheduleBrush(e.clientX, e.clientY); }, { passive: true });

  // Public API + cleanup
  function setMobileVolume(v){
    const vol = Math.max(0, Math.min(1, Number(v) || 0));
    if (masterGain && ac) masterGain.gain.setValueAtTime(vol, ac.currentTime);
    if (mobileFallback) mobileFallback.volume = vol;
  }

  const destroy = () => {
    try { mo.disconnect(); } catch {}
    try { ['pointerdown','pointermove','pointerup','mousemove'].forEach(evt => pf.replaceWith(pf.cloneNode(true))); } catch {}
    // We don’t tear down window warm handlers; they’re once:true so harmless.
  };

  coinPickup = { destroy };

  return {
    get count(){ return coins; },
    set count(v){ coins = Math.max(0, Number(v) || 0); updateHud(); save(); },
    setMobileVolume,
    destroy,
  };
}
