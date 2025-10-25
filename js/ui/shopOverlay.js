// js/ui/shopOverlay.js

import { MERCHANT_DIALOGUES } from '../misc/merchantDialogues.js';

let shopOverlayEl = null;
let shopSheetEl = null;
let shopOpen = false;
let drag = null; // {startY, lastY, startT, moved, canceled}
let eventsBound = false;
let merchantOverlayEl = null;
let merchantSheetEl = null;
let merchantOpen = false;
let merchantDrag = null;
let merchantEventsBound = false;
const IS_MOBILE = (window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window);


const MERCHANT_ICON_SRC = 'img/misc/merchant.png';
const MERCHANT_MET_KEY = 'ccc:merchantMet'
const MERCHANT_TAB_KEY = 'ccc:merchantTab';
const MERCHANT_TABS_DEF = [
  { key: 'dialogue', label: 'Dialogue', unlocked: true },
  { key: 'reset',    label: '???',      unlocked: false },
  { key: 'minigames',label: '???',      unlocked: false },
];

let merchantTabs = { buttons: {}, panels: {}, tablist: null };
// ---- Typing SFX (loop) ----
const TYPING_SFX_SOURCE = [
  'sounds/merchant_typing.mp3',
  // add .ogg/.wav variants if you have them
];

let __audioCtx = null;
let __typingGain = null;
let __typingBuffer = null;     // decoded buffer (once)
let __bufferLoadPromise = null;

let __typingSfx = null;        // fallback <audio> element (kept for compatibility)
let __typingSource = null;     // <audio> → MediaElementSource (once)
let __bufferSource = null;     // current BufferSource (recreated each start)

let __typingSfxPrimed = false;
let __isTypingActive = false;  // set in typeText()

function ensureAudioCtx() {
  if (!__audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    __audioCtx = new Ctx();
  }
  if (!__typingGain) {
    __typingGain = __audioCtx.createGain();
    const mobile = (typeof IS_MOBILE !== 'undefined' && IS_MOBILE);
    __typingGain.gain.value = mobile ? 0.15 : 0.3;
    __typingGain.connect(__audioCtx.destination);
  }
}

function pickSupportedSrc() {
  // naive picker — first one is fine in most setups
  return TYPING_SFX_SOURCE[0];
}

async function loadTypingBuffer() {
  ensureAudioCtx();
  if (__typingBuffer) return __typingBuffer;
  if (__bufferLoadPromise) return __bufferLoadPromise;

  const url = pickSupportedSrc();
  __bufferLoadPromise = (async () => {
    const res = await fetch(url, { cache: 'force-cache' });
    const arr = await res.arrayBuffer();
    return await __audioCtx.decodeAudioData(arr);
  })().then(buf => (__typingBuffer = buf))
     .catch(err => { console.warn('Typing SFX decode failed:', err); __bufferLoadPromise = null; });

  return __bufferLoadPromise;
}

function ensureTypingAudioElement() {
  if (__typingSfx) return __typingSfx;
  const a = new Audio();
  a.loop = true;
  a.preload = 'auto';
  a.muted = false;
  a.volume = 1.0; // volume handled by gain in element path as well (iOS ignores this)

  const url = pickSupportedSrc();
  a.src = url;

  __typingSfx = a;
  return a;
}

function ensureElementGraph() {
  // Route the <audio> element through the same gain node (mobile volume)
  ensureAudioCtx();
  ensureTypingAudioElement();
  if (!__typingSource) {
    __typingSource = __audioCtx.createMediaElementSource(__typingSfx);
    __typingSource.connect(__typingGain);
  }
}

function setTypingGainForDevice() {
  if (!__typingGain) return;
  const mobile = (typeof IS_MOBILE !== 'undefined' && IS_MOBILE);
  __typingGain.gain.value = mobile ? 0.15 : 0.3;
}

// Prime from a user gesture — silently
function primeTypingSfx() {
  if (__typingSfxPrimed) return;
  __typingSfxPrimed = true;

  ensureAudioCtx();
  __audioCtx.resume().catch(()=>{});

  // Kick off buffer decode early so it's ready when typing starts
  loadTypingBuffer();

  // Silent play/pause on the element path to satisfy autoplay policies (some browsers)
  const a = ensureTypingAudioElement();
  ensureElementGraph();

  const prevLoop = a.loop;
  const prevMuted = a.muted;
  a.loop = false;
  a.muted = true;
  a.play().then(() => { a.pause(); a.currentTime = 0; })
    .finally(() => { a.loop = prevLoop; a.muted = prevMuted; });
}

async function startTypingSfx() {
  ensureAudioCtx();
  await __audioCtx.resume().catch(()=>{});

  // Prefer zero-latency buffer if available (or fall back if decode not ready yet)
  await loadTypingBuffer();

  if (__isTypingActive && __typingBuffer) {
    // stop previous buffer source if any
    if (__bufferSource) {
      try { __bufferSource.stop(0); } catch {}
      try { __bufferSource.disconnect(); } catch {}
      __bufferSource = null;
    }
    __bufferSource = __audioCtx.createBufferSource();
    __bufferSource.buffer = __typingBuffer;
    __bufferSource.loop = true;
    __bufferSource.connect(__typingGain);
    __bufferSource.start(0);
    return;
  }

  // Fallback: element path (first ever line before decode finishes)
  ensureElementGraph();
  if (__isTypingActive && __typingSfx) {
    __typingSfx.currentTime = 0;
    try { await __typingSfx.play(); }
    catch {
      const once = () => { if (__isTypingActive) __typingSfx.play().catch(()=>{}); document.removeEventListener('click', once); };
      document.addEventListener('click', once, { once: true });
    }
  }
}

function stopTypingSfx() {
  // stop buffer path
  if (__bufferSource) {
    try { __bufferSource.stop(0); } catch {}
    try { __bufferSource.disconnect(); } catch {}
    __bufferSource = null;
  }
  // stop element path
  if (__typingSfx) {
    __typingSfx.pause();
    __typingSfx.currentTime = 0;
  }
}

// React to device/orientation changes so gain stays correct
window.matchMedia?.('(any-pointer: coarse)')?.addEventListener?.('change', setTypingGainForDevice);
window.addEventListener('orientationchange', setTypingGainForDevice);

// === React to device/orientation changes so gain stays correct ===
window.matchMedia?.('(any-pointer: coarse)')?.addEventListener?.('change', setTypingGainForDevice);
window.addEventListener('orientationchange', setTypingGainForDevice);

// -------- Config (paths) --------
const ICON_DIR = 'img/sc_upg_icons/';
const BASE_ICON_SRC = 'img/coin/coinBase.png';

// 1×1 transparent PNG (fallback when an icon is missing)
const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3x0S8AAAAASUVORK5CYII=';

// Currently setting manual upgrades but will change it to dynamic later
let UPGRADE_COUNT = 17;

// Upgrades registry (minimal for now)
let upgrades = {};

const FIRST_LINE = 'So you want to delve deeper within my shop, do you?';

function typeText(el, full, msPerChar = 22, skipTargets = []) {
  return new Promise((resolve) => {
    let i = 0, skipping = false;
    let armed = false;

    __isTypingActive = true;       // <- start of typing
    startTypingSfx();

    const skip = (e) => { if (!armed) return; e.preventDefault(); skipping = true; };
    const onKey = (e) => { if (!armed) return; if (e.key === 'Enter' || e.key === ' ') skipping = true; };

    const targets = skipTargets.length ? skipTargets : [el];

    // Delay arming so the same click that chose a choice can't insta-skip next line
    requestAnimationFrame(() => {
      armed = true;
      targets.forEach(t => t.addEventListener('click', skip, { once: true }));
      document.addEventListener('keydown', onKey, { once: true });
    });

    el.classList.add('is-typing');
    el.textContent = '';

    const cleanup = () => {
      targets.forEach(t => t.removeEventListener('click', skip));
      document.removeEventListener('keydown', onKey);
      el.classList.remove('is-typing');
      stopTypingSfx();
      __isTypingActive = false;    // <- end of typing
    };

    const tick = () => {
      if (skipping) { el.textContent = full; cleanup(); resolve(); return; }
      el.textContent = full.slice(0, i++);
      if (i <= full.length) setTimeout(tick, msPerChar);
      else { cleanup(); resolve(); }
    };
    tick();
  });
}

class DialogueEngine {
  constructor({ textEl, choicesEl, skipTargets, onEnd }) {
    this.textEl = textEl;
    this.choicesEl = choicesEl;
    this.skipTargets = skipTargets;
    this.onEnd = onEnd || (() => {});
    this.nodes = {};
    this.current = null;
	this.deferNextChoices = false; 
	this._reservedH = 0; 
  }

  load(script) {
    this.nodes = script.nodes || {};
    this.startId = script.start;
  }

  async start() {
    if (!this.startId) return;
    await this.goto(this.startId);
  }

  async goto(id) {
    const node = this.nodes[id];
    if (!node) return;
    this.current = id;

   if (node.type === 'line') {
  const nextNode = this.nodes[node.next];

  // Only pre-render if we are NOT deferring (keeps initial line smooth)
  if (!this.deferNextChoices && nextNode && nextNode.type === 'choice') {
    this._renderChoices(nextNode.options || [], /*prepare=*/true);
  } else {
    this._hideChoices();
  }

  await typeText(this.textEl, node.say, node.msPerChar ?? 22, this.skipTargets);

  if (nextNode && nextNode.type === 'choice') {
    this.current = node.next;

    if (this.deferNextChoices) {
      // We just came from a choice → line transition.
      // Now that typing is done, render the new choices and release the height lock.
      this.deferNextChoices = false;
      this._renderChoices(nextNode.options || [], /*prepare=*/false); // builds & reveals
      this.choicesEl.style.minHeight = '';  // release reserved height
      return;
    }

    // Normal path (e.g., initial line): reveal the already prepared buttons
    this._revealPreparedChoices();
    return;
  }

  // No choices after this line
  this.choicesEl.style.minHeight = '';
  if (node.next === 'end' || node.end === true) return this.onEnd();
  if (node.next) return this.goto(node.next);
  return;
}


    if (node.type === 'choice') {
      // (rare path) direct jump to a choice node
      this._renderChoices(node.options || [], /*prepare=*/false);
    }
  }
  
  _hideChoices() {
    this.choicesEl.classList.remove('is-visible');
    this.choicesEl.setAttribute('aria-hidden', 'true');
  }

  _renderChoices(options, prepare = false) {
    this.choicesEl.innerHTML = '';

    for (const opt of options) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.textContent = opt.label;
      btn.addEventListener('click', async (e) => {
		e.stopPropagation();                // <<< prevents this click from hitting the card/text skip
		this._reservedH = this.choicesEl.offsetHeight | 0;
		this.choicesEl.style.minHeight = this._reservedH + 'px';
		this._hideChoices();
		this.choicesEl.innerHTML = '';

		this.deferNextChoices = true;

		if (opt.to === 'end') return this.onEnd();
		await this.goto(opt.to);
		}, { once: true });

      this.choicesEl.appendChild(btn);
    }

    if (prepare) {
      this.choicesEl.classList.remove('is-visible');
      this.choicesEl.setAttribute('aria-hidden', 'true');
      return; // in-flow, invisible, non-clickable — reserves height
    }

    this.choicesEl.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => this.choicesEl.classList.add('is-visible'));
  }

  _revealPreparedChoices() {
    this.choicesEl.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => this.choicesEl.classList.add('is-visible'));
  }
}

function ensureCustomScrollbar() {
  const scroller = shopOverlayEl?.querySelector('.shop-content');
  if (!scroller || scroller.__customScroll) return;

  const bar = document.createElement('div');
  bar.className = 'shop-scrollbar';
  const thumb = document.createElement('div');
  thumb.className = 'shop-scrollbar__thumb';
  bar.appendChild(thumb);
  shopSheetEl.appendChild(bar);

  scroller.__customScroll = { bar, thumb };

  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const FADE_SCROLL_MS = 150;  // was 900 → snappier
  const FADE_DRAG_MS   = 120;  // was 600
  const supportsScrollEnd = 'onscrollend' in window;

  const updateBounds = () => {
    const grab = shopOverlayEl.querySelector('.shop-grabber');
    const header = shopOverlayEl.querySelector('.shop-header');
    const actions = shopOverlayEl.querySelector('.shop-actions');

    const top = ((grab?.offsetHeight || 0) + (header?.offsetHeight || 0)) | 0;
    const bottom = (actions?.offsetHeight || 0) | 0;

    bar.style.top = top + 'px';
    bar.style.bottom = bottom + 'px';
  };

  const updateThumb = () => {
    const { scrollHeight, clientHeight, scrollTop } = scroller;
    const barH = bar.clientHeight;
    const visibleRatio = clientHeight / Math.max(1, scrollHeight);
    const thumbH = Math.max(28, Math.round(barH * visibleRatio));

    const maxScroll = Math.max(1, scrollHeight - clientHeight);
    const range = Math.max(0, barH - thumbH);
    const y = Math.round((scrollTop / maxScroll) * range);

    thumb.style.height = thumbH + 'px';
    thumb.style.transform = `translateY(${y}px)`;
    bar.style.display = (scrollHeight <= clientHeight + 1) ? 'none' : '';
  };

  const updateAll = () => { updateBounds(); updateThumb(); };

  // ---- visibility helpers (mobile) ----
  const showBar = () => {
    if (!isTouch) return;
    shopSheetEl.classList.add('is-scrolling');
    clearTimeout(scroller.__fadeTimer);
  };
  const scheduleHide = (delay) => {
    if (!isTouch) return;
    clearTimeout(scroller.__fadeTimer);
    scroller.__fadeTimer = setTimeout(() => {
      shopSheetEl.classList.remove('is-scrolling');
    }, delay);
  };

  const onScroll = () => {
    updateThumb();
    if (isTouch) showBar();
    // If scrollend isn’t supported, fall back to a short timeout
    if (!supportsScrollEnd) scheduleHide(FADE_SCROLL_MS);
  };

  const onScrollEnd = () => {
    // Fired once momentum stops — schedule quick fade
    scheduleHide(FADE_SCROLL_MS);
  };

  scroller.addEventListener('scroll', onScroll, { passive: true });
  if (supportsScrollEnd) {
    scroller.addEventListener('scrollend', onScrollEnd, { passive: true });
  }

  const ro = new ResizeObserver(updateAll);
  ro.observe(scroller);
  window.addEventListener('resize', updateAll);
  requestAnimationFrame(updateAll);

  // --- Drag to scroll ---
  let dragging = false;
  let dragStartY = 0;
  let startScrollTop = 0;

  const startDrag = (e) => {
    dragging = true;
    dragStartY = e.clientY;
    startScrollTop = scroller.scrollTop;
    thumb.classList.add('dragging');
    showBar();
    try { thumb.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
  };

  const onDragMove = (e) => {
    if (!dragging) return;
    const barH = bar.clientHeight;
    const thH = thumb.clientHeight;
    const range = Math.max(1, barH - thH);
    const scrollMax = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    const deltaY = e.clientY - dragStartY;
    const scrollDelta = (deltaY / range) * scrollMax;
    scroller.scrollTop = startScrollTop + scrollDelta;
  };

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    thumb.classList.remove('dragging');
    scheduleHide(FADE_DRAG_MS);
    try { thumb.releasePointerCapture(e.pointerId); } catch {}
  };

  thumb.addEventListener('pointerdown', startDrag);
  window.addEventListener('pointermove', onDragMove, { passive: true });
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // --- Click track to jump ---
  bar.addEventListener('pointerdown', (e) => {
    if (e.target === thumb) return; // drag handled above
    const rect = bar.getBoundingClientRect();
    const clickY = e.clientY - rect.top;

    const barH = bar.clientHeight;
    const thH = thumb.clientHeight;
    const range = Math.max(0, barH - thH);
    const targetY = Math.max(0, Math.min(clickY - thH / 2, range));

    const scrollMax = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    scroller.scrollTop = (targetY / Math.max(1, range)) * scrollMax;

    showBar();
    scheduleHide(FADE_SCROLL_MS);
  });
}

// Build (or rebuild) the upgrades object
function buildUpgradesData(count = UPGRADE_COUNT) {
  upgrades = {};
  for (let i = 0; i < count; i++) {
    const key = `upg_${i + 1}`;
    upgrades[key] = {
      key,
      level: 1,
      baseIcon: BASE_ICON_SRC,
      // Using the same starter icon for now, as requested
      upgradeIcon: `${ICON_DIR}faster_coins_id_1.png`,
    };
  }
}

// Render the grid from the upgrades object
function renderShopGrid() {
  const grid = shopOverlayEl?.querySelector('#shop-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (const key in upgrades) {
    const upg = upgrades[key];

    const btn = document.createElement('button');
    btn.className = 'shop-upgrade';
    btn.type = 'button';
    btn.setAttribute('role', 'gridcell');
    btn.dataset.key = upg.key;
    btn.setAttribute('aria-label', `Upgrade ${upg.key.replace('upg_', '')}, level ${upg.level}`);

    // Layered, perfectly centered images
    const tile = document.createElement('div');
    tile.className = 'shop-tile';

    const baseImg = document.createElement('img');
    baseImg.className = 'base';
    baseImg.src = upg.baseIcon;
    baseImg.alt = '';

    const iconImg = document.createElement('img');
    iconImg.className = 'icon';
    iconImg.src = upg.upgradeIcon;
    iconImg.alt = '';
    iconImg.decoding = 'async';
    iconImg.loading = 'lazy';
    iconImg.addEventListener('error', () => {
      // Fallback to invisible icon if the requested one is missing
      iconImg.src = TRANSPARENT_PX;
    });

    const badge = document.createElement('span');
    badge.className = 'level-badge';
    badge.textContent = String(upg.level);

    tile.append(baseImg, iconImg, badge);
    btn.appendChild(tile);
    grid.appendChild(btn);
  }
}

function ensureShopOverlay() {
  if (shopOverlayEl) return;

  shopOverlayEl = document.createElement('div');
  shopOverlayEl.className = 'shop-overlay';
  shopOverlayEl.id = 'shop-overlay';
  shopOverlayEl.setAttribute('aria-hidden', 'true');

  // Sheet
  shopSheetEl = document.createElement('div');
  shopSheetEl.className = 'shop-sheet';
  shopSheetEl.setAttribute('role', 'dialog');
  shopSheetEl.setAttribute('aria-modal', 'false');
  shopSheetEl.setAttribute('aria-label', 'Shop');

  // Grabber
  const grabber = document.createElement('div');
  grabber.className = 'shop-grabber';
  grabber.innerHTML = `<div class="grab-handle" aria-hidden="true"></div>`;

    // Content: sticky header + grid (no extra scroller)
const content = document.createElement('div');
content.className = 'shop-content';

const header = document.createElement('header');
header.className = 'shop-header';
header.innerHTML = `
  <div class="shop-title">SHOP</div>
  <div class="shop-line" aria-hidden="true"></div>
`;

const grid = document.createElement('div');
grid.className = 'shop-grid';
grid.id = 'shop-grid';
grid.setAttribute('role', 'grid');
grid.setAttribute('aria-label', 'Shop Upgrades');

content.appendChild(header);
content.appendChild(grid);
ensureCustomScrollbar();

  // Actions
  const actions = document.createElement('div');
  actions.className = 'shop-actions';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'shop-close';
  closeBtn.textContent = 'Close';

  const delveBtn = document.createElement('button');
 delveBtn.type = 'button';
 delveBtn.className = 'shop-delve';
 delveBtn.textContent = 'Delve';

  actions.appendChild(closeBtn);
  actions.appendChild(delveBtn);
  
  delveBtn.addEventListener('click', () => { primeTypingSfx(); openMerchant(); });

  // Compose
  shopSheetEl.appendChild(grabber);
  shopSheetEl.appendChild(content);
  shopSheetEl.appendChild(actions);
  shopOverlayEl.appendChild(shopSheetEl);
  document.body.appendChild(shopOverlayEl);

  // Data + first render
  buildUpgradesData(UPGRADE_COUNT);
  renderShopGrid();

  // Events (one-time)
  if (!eventsBound) {
    eventsBound = true;

    closeBtn.addEventListener('click', closeShop);
    document.addEventListener('keydown', onKeydownForShop);

    // Drag to dismiss (grabber only)
    grabber.addEventListener('pointerdown', onDragStart);
    grabber.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent iOS bounce
    }, { passive: false });
  }
}

function onKeydownForShop(e) {
  if (!shopOpen) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeShop();
  }
}

export function openShop() {
  ensureShopOverlay();
  if (shopOpen) return;

  // Mark as opening
  shopOpen = true;

  // Ensure we start from the closed state with NO inline transform
  shopSheetEl.style.transition = 'none';
  shopSheetEl.style.transform = '';

  // Expose to a11y; pointer-events stay off until .is-open is added
  shopOverlayEl.setAttribute('aria-hidden', 'false');

  // Commit closed state, then animate open next frame
  void shopSheetEl.offsetHeight;
  requestAnimationFrame(() => {
    shopSheetEl.style.transition = ''; // back to CSS var(--shop-anim)
    shopOverlayEl.classList.add('is-open');
	ensureCustomScrollbar();

    // Focus something useful for keyboard users
    const focusable =
      shopOverlayEl.querySelector('#shop-grid .shop-upgrade') ||
      shopOverlayEl.querySelector('#shop-grid');
    if (focusable) focusable.focus();
  });
}

export function closeShop() {
  if (!shopOpen) return;

  // Reset any drag transform
  if (shopSheetEl) {
    shopSheetEl.style.transition = '';
    shopSheetEl.style.transform = '';
  }

  shopOpen = false;
  shopOverlayEl.classList.remove('is-open');
  shopOverlayEl.setAttribute('aria-hidden', 'true');
}

// ----- Drag helpers -----
function onDragStart(e) {
  if (!shopOpen) return;

  const clientY = typeof e.clientY === 'number'
    ? e.clientY
    : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

  drag = {
    startY: clientY,
    lastY: clientY,
    startT: performance.now(),
    moved: 0,
    canceled: false,
  };

  shopSheetEl.style.transition = 'none';

  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
  window.addEventListener('pointercancel', onDragCancel);
}

function onDragMove(e) {
  if (!drag || drag.canceled) return;
  const y = e.clientY;
  if (typeof y !== 'number') return;

  const dy = Math.max(0, y - drag.startY); // only downward
  drag.lastY = y;
  drag.moved = dy;

  shopSheetEl.style.transform = `translateY(${dy}px)`;
}

function onDragEnd() {
  if (!drag || drag.canceled) { cleanupDrag(); return; }

  const dt = Math.max(1, performance.now() - drag.startT);
  const dy = drag.moved;
  const velocity = dy / dt; // px/ms

  const shouldClose = (velocity > 0.55 && dy > 40) || dy > 140;

  if (shouldClose) {
    shopSheetEl.style.transition = 'transform 140ms ease-out';
    shopSheetEl.style.transform = 'translateY(100%)';
    setTimeout(() => { closeShop(); }, 150);
  } else {
    shopSheetEl.style.transition = 'transform 180ms ease';
    shopSheetEl.style.transform = 'translateY(0)';
  }

  cleanupDrag();
}

function onDragCancel() {
  if (!drag) return;
  drag.canceled = true;
  shopSheetEl.style.transition = 'transform 180ms ease';
  shopSheetEl.style.transform = 'translateY(0)';
  cleanupDrag();
}

function cleanupDrag() {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
  window.removeEventListener('pointercancel', onDragCancel);
  drag = null;
}

function ensureMerchantOverlay() {
  if (merchantOverlayEl) return;

  // Overlay
  merchantOverlayEl = document.createElement('div');
  merchantOverlayEl.className = 'merchant-overlay';
  merchantOverlayEl.id = 'merchant-overlay';
  merchantOverlayEl.setAttribute('aria-hidden', 'true');

  // Sheet
  merchantSheetEl = document.createElement('div');
  merchantSheetEl.className = 'merchant-sheet';
  merchantSheetEl.setAttribute('role', 'dialog');
  merchantSheetEl.setAttribute('aria-modal', 'false');
  merchantSheetEl.setAttribute('aria-label', 'Merchant');

  // Pull bar / grabber (same UX as shop)
  const grabber = document.createElement('div');
  grabber.className = 'merchant-grabber';
  grabber.innerHTML = `<div class="grab-handle" aria-hidden="true"></div>`;

  // Content
  const content = document.createElement('div');
  content.className = 'merchant-content';

  // Header
  const header = document.createElement('header');
  header.className = 'merchant-header';
  header.innerHTML = `
    <div class="merchant-title">Merchant</div>
    <div class="merchant-line" aria-hidden="true"></div>
  `;

  // Tabs + panels --------------------------------------------
  const tabs = document.createElement('div');
  tabs.className = 'merchant-tabs';
  tabs.setAttribute('role', 'tablist');

  const panelsWrap = document.createElement('div');
  panelsWrap.className = 'merchant-panels';

  // Dialogue panel (main)
  const panelDialogue = document.createElement('section');
  panelDialogue.className = 'merchant-panel is-active';
  panelDialogue.id = 'merchant-panel-dialogue';

  // Merchant dialogue bubble
  const dialog = document.createElement('div');
  dialog.className = 'merchant-dialog';
  dialog.setAttribute('role', 'group');
  dialog.setAttribute('aria-label', 'Dialogue');

  const bubble = document.createElement('div');
  bubble.className = 'merchant-bubble';

  const avatar = document.createElement('img');
  avatar.className = 'merchant-icon';
  avatar.src = MERCHANT_ICON_SRC;
  avatar.alt = '';

  const text = document.createElement('div');
  text.className = 'merchant-text';
  text.textContent = '…'; // placeholder

  bubble.append(avatar, text);
  dialog.appendChild(bubble);
  panelDialogue.appendChild(dialog);

  // Other panels (locked at start)
  const panelReset = document.createElement('section');
  panelReset.className = 'merchant-panel';
  panelReset.id = 'merchant-panel-reset';

  const panelMinigames = document.createElement('section');
  panelMinigames.className = 'merchant-panel';
  panelMinigames.id = 'merchant-panel-minigames';

  // Tabs setup
  MERCHANT_TABS_DEF.forEach(def => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'merchant-tab';
    btn.dataset.tab = def.key;
    btn.textContent = def.unlocked ? def.label : '???';
    if (!def.unlocked) {
      btn.classList.add('is-locked');
      btn.disabled = true;
      btn.title = 'Locked';
    }
    btn.addEventListener('click', () => selectMerchantTab(def.key));
    tabs.appendChild(btn);
    merchantTabs.buttons[def.key] = btn;
  });

  merchantTabs.panels['dialogue']  = panelDialogue;
  merchantTabs.panels['reset']     = panelReset;
  merchantTabs.panels['minigames'] = panelMinigames;
  merchantTabs.tablist = tabs;

  panelsWrap.append(panelDialogue, panelReset, panelMinigames);
  content.append(header, tabs, panelsWrap);
  // -----------------------------------------------------------

  // Actions (Close button)
  const actions = document.createElement('div');
  actions.className = 'merchant-actions';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'merchant-close';
  closeBtn.textContent = 'Close';
  actions.appendChild(closeBtn);

  // First-time chat overlay (stays centered on first visit)
  const firstChat = document.createElement('div');
  firstChat.className = 'merchant-firstchat';
  firstChat.innerHTML = `
    <div class="merchant-firstchat__card" role="dialog" aria-label="First chat">
      <div class="merchant-firstchat__header">
        <div class="name">Merchant</div>
        <div class="rule" aria-hidden="true"></div>
      </div>
      <div class="merchant-firstchat__row">
        <img class="merchant-firstchat__icon" src="${MERCHANT_ICON_SRC}" alt="">
        <div class="merchant-firstchat__text" id="merchant-first-line">…</div>
      </div>
      <div class="merchant-firstchat__choices" id="merchant-first-choices"></div>
    </div>
  `;

  // Compose overlay
  merchantSheetEl.append(grabber, content, actions, firstChat);
  merchantOverlayEl.appendChild(merchantSheetEl);
  document.body.appendChild(merchantOverlayEl);

  // Events (one-time)
  if (!merchantEventsBound) {
    merchantEventsBound = true;

    closeBtn.addEventListener('click', closeMerchant);
    document.addEventListener('keydown', onKeydownForMerchant);

    grabber.addEventListener('pointerdown', onMerchantDragStart);
    grabber.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  }
}

function runFirstMeet() {
  const fc = merchantOverlayEl.querySelector('.merchant-firstchat');
  const textEl = fc.querySelector('#merchant-first-line');
  const rowEl = fc.querySelector('.merchant-firstchat__row');
  const cardEl = fc.querySelector('.merchant-firstchat__card');
  const choicesEl = fc.querySelector('#merchant-first-choices');

  const engine = new DialogueEngine({
    textEl,
    choicesEl,
    skipTargets: [textEl, rowEl, cardEl], // click anywhere to skip typing
    onEnd: () => {
      try { localStorage.setItem(MERCHANT_MET_KEY, '1'); } catch {}
      fc.classList.remove('is-visible');
      merchantOverlayEl.classList.remove('firstchat-active');
    }
  });

  engine.load(MERCHANT_DIALOGUES.intro);
  engine.start();
}

export function openMerchant() {
  ensureMerchantOverlay();
  if (merchantOpen) return;

  merchantOpen = true;

  // Reset transform and transition (same pattern as shop)
  merchantSheetEl.style.transition = 'none';
  merchantSheetEl.style.transform = '';
  merchantOverlayEl.setAttribute('aria-hidden', 'false');

  // Animate in next frame
  void merchantSheetEl.offsetHeight;
  requestAnimationFrame(() => {
    merchantSheetEl.style.transition = ''; // picks up CSS var(--shop-anim)
    merchantOverlayEl.classList.add('is-open');

    let last = 'dialogue';
    try { last = localStorage.getItem(MERCHANT_TAB_KEY) || 'dialogue'; } catch {}
    selectMerchantTab(last);
	stopTypingSfx(); // ensure no orphaned loop


    // Show first-time chat overlay (no animation)
    let met = false;
    try { met = localStorage.getItem(MERCHANT_MET_KEY) === '1'; } catch {}
    if (!met) {
      const fc = merchantOverlayEl.querySelector('.merchant-firstchat');
      fc?.classList.add('is-visible');
      merchantOverlayEl.classList.add('firstchat-active');
      runFirstMeet();  	  
    }
  });
}

export function closeMerchant() {
  if (!merchantOpen) return;

  merchantOpen = false;
  merchantSheetEl.style.transition = '';
  merchantSheetEl.style.transform = '';
  merchantOverlayEl.classList.remove('is-open');
  merchantOverlayEl.setAttribute('aria-hidden', 'true');
  stopTypingSfx();
  __isTypingActive = false;
}

function onKeydownForMerchant(e) {
  if (!merchantOpen) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeMerchant();
  }
}

// ---- Drag to dismiss (Merchant) ----
function onMerchantDragStart(e) {
  if (!merchantOpen) return;

  const clientY = typeof e.clientY === 'number'
    ? e.clientY
    : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

  merchantDrag = {
    startY: clientY,
    lastY: clientY,
    startT: performance.now(),
    moved: 0,
    canceled: false,
  };

  merchantSheetEl.style.transition = 'none';

  window.addEventListener('pointermove', onMerchantDragMove);
  window.addEventListener('pointerup', onMerchantDragEnd);
  window.addEventListener('pointercancel', onMerchantDragCancel);
}

function onMerchantDragMove(e) {
  if (!merchantDrag || merchantDrag.canceled) return;
  const y = e.clientY;
  if (typeof y !== 'number') return;

  const dy = Math.max(0, y - merchantDrag.startY);
  merchantDrag.lastY = y;
  merchantDrag.moved = dy;

  merchantSheetEl.style.transform = `translateY(${dy}px)`;
}

function onMerchantDragEnd() {
  if (!merchantDrag || merchantDrag.canceled) { cleanupMerchantDrag(); return; }

  const dt = Math.max(1, performance.now() - merchantDrag.startT);
  const dy = merchantDrag.moved;
  const velocity = dy / dt;

  const shouldClose = (velocity > 0.55 && dy > 40) || dy > 140;

  if (shouldClose) {
    merchantSheetEl.style.transition = 'transform 140ms ease-out';
    merchantSheetEl.style.transform = 'translateY(100%)';
    setTimeout(() => { closeMerchant(); }, 150);
  } else {
    merchantSheetEl.style.transition = 'transform 180ms ease';
    merchantSheetEl.style.transform = 'translateY(0)';
  }

  cleanupMerchantDrag();
}

function onMerchantDragCancel() {
  if (!merchantDrag) return;
  merchantDrag.canceled = true;
  merchantSheetEl.style.transition = 'transform 180ms ease';
  merchantSheetEl.style.transform = 'translateY(0)';
  cleanupMerchantDrag();
}

function cleanupMerchantDrag() {
  window.removeEventListener('pointermove', onMerchantDragMove);
  window.removeEventListener('pointerup', onMerchantDragEnd);
  window.removeEventListener('pointercancel', onMerchantDragCancel);
  merchantDrag = null;
}

function selectMerchantTab(key) {
  const def = MERCHANT_TABS_DEF.find(t => t.key === key);
  if (!def || !def.unlocked) key = 'dialogue'; // fallback

  for (const k in merchantTabs.buttons) {
    merchantTabs.buttons[k].classList.toggle('is-active', k === key);
  }
  for (const k in merchantTabs.panels) {
    merchantTabs.panels[k].classList.toggle('is-active', k === key);
  }
  try { localStorage.setItem(MERCHANT_TAB_KEY, key); } catch {}
}

export function unlockMerchantTabs(keys = []) {
  keys.forEach(key => {
    const def = MERCHANT_TABS_DEF.find(t => t.key === key);
    if (!def) return;
    def.unlocked = true;
    const btn = merchantTabs.buttons[key];
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('is-locked');
      btn.textContent = def.label; // replace ??? with real label
    }
  });
}

// ----- Tiny API for later wiring -----
export function setUpgradeCount(n) {
  UPGRADE_COUNT = Math.max(0, n | 0);
  buildUpgradesData(UPGRADE_COUNT);
  renderShopGrid();
}
export function getUpgrades() { return upgrades; }

