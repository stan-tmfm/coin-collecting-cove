// js/ui/delveOverlay.js

import { MERCHANT_DIALOGUES } from '../misc/merchantDialogues.js';

const MERCHANT_ICON_SRC = 'img/misc/merchant.png';
const MERCHANT_MET_KEY  = 'ccc:merchantMet';
const MERCHANT_TAB_KEY  = 'ccc:merchantTab';

const MERCHANT_TABS_DEF = [
  { key: 'dialogue',  label: 'Dialogue', unlocked: true },
  { key: 'reset',     label: '???',      unlocked: false },
  { key: 'minigames', label: '???',      unlocked: false },
];

// If you already expose IS_MOBILE globally elsewhere, we'll reuse it.
// Otherwise, fall back to the same heuristic here (module-scoped).
const IS_MOBILE =
  (typeof window.IS_MOBILE !== 'undefined')
    ? window.IS_MOBILE
    : (window.matchMedia?.('(any-pointer: coarse)')?.matches) || ('ontouchstart' in window);

// ----- Module state -----
let merchantOverlayEl = null;
let merchantSheetEl   = null;
let merchantOpen      = false;
let merchantDrag      = null;
let merchantEventsBound = false;
let merchantTabs = { buttons: {}, panels: {}, tablist: null };

// ========================= Typing SFX (WebAudio, zero-latency, mobile volume) =========================
const TYPING_SFX_SOURCE = ['sounds/merchant_typing.mp3']; // ensure this asset exists

let __audioCtx = null;
let __typingGain = null;
let __typingBuffer = null;     // decoded buffer (once)
let __bufferLoadPromise = null;

let __typingSfx = null;        // fallback <audio> element
let __typingSource = null;     // MediaElementSource (once)
let __bufferSource = null;     // current BufferSource (recreated each start)

let __typingSfxPrimed = false;
let __isTypingActive  = false;

function ensureAudioCtx() {
  if (!__audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    __audioCtx = new Ctx();
  }
  if (!__typingGain) {
    __typingGain = __audioCtx.createGain();
    __typingGain.gain.value = IS_MOBILE ? 0.15 : 0.3;  // mobile quieter
    __typingGain.connect(__audioCtx.destination);
  }
}

function pickSupportedSrc() { return TYPING_SFX_SOURCE[0]; }

async function loadTypingBuffer() {
  ensureAudioCtx();
  if (__typingBuffer) return __typingBuffer;
  if (__bufferLoadPromise) return __bufferLoadPromise;

  const url = pickSupportedSrc();
  __bufferLoadPromise = (async () => {
    const res = await fetch(url, { cache: 'force-cache' });
    const arr = await res.arrayBuffer();
    return await __audioCtx.decodeAudioData(arr);
  })()
  .then(buf => (__typingBuffer = buf))
  .catch(err => { console.warn('Typing SFX decode failed:', err); __bufferLoadPromise = null; });

  return __bufferLoadPromise;
}

function ensureTypingAudioElement() {
  if (__typingSfx) return __typingSfx;
  const a = new Audio();
  a.loop = true;
  a.preload = 'auto';
  a.muted = false;
  a.volume = 1.0; // iOS ignores this; gain node controls volume

  const url = pickSupportedSrc();
  a.src = url;

  __typingSfx = a;
  return a;
}

function ensureElementGraph() {
  ensureAudioCtx();
  ensureTypingAudioElement();
  if (!__typingSource) {
    __typingSource = __audioCtx.createMediaElementSource(__typingSfx);
    __typingSource.connect(__typingGain);
  }
}

export function setTypingGainForDevice() {
  if (!__typingGain) return;
  __typingGain.gain.value = IS_MOBILE ? 0.15 : 0.3;
}

// Prime from a user gesture — silent, no AbortError spam
export function primeTypingSfx() {
  if (__typingSfxPrimed) return;
  __typingSfxPrimed = true;

  ensureAudioCtx();
  __audioCtx.resume().catch(()=>{});

  // Kick off buffer decode early
  loadTypingBuffer();

  // Satisfy autoplay policies silently via element path
  const a = ensureTypingAudioElement();
  ensureElementGraph();

  const prevLoop = a.loop;
  const prevMuted = a.muted;
  a.loop = false;
  a.muted = true;

  a.play()
    .then(() => { a.pause(); a.currentTime = 0; })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        console.warn('Typing SFX prime error:', err);
        __typingSfxPrimed = false;
      }
    })
    .finally(() => { a.loop = prevLoop; a.muted = prevMuted; });
}

async function startTypingSfx() {
  ensureAudioCtx();
  await __audioCtx.resume().catch(()=>{});

  await loadTypingBuffer();

  // Prefer zero-latency buffer path
  if (__isTypingActive && __typingBuffer) {
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

  // Fallback element path (rare first-line race)
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
  if (__bufferSource) {
    try { __bufferSource.stop(0); } catch {}
    try { __bufferSource.disconnect(); } catch {}
    __bufferSource = null;
  }
  if (__typingSfx) {
    __typingSfx.pause();
    __typingSfx.currentTime = 0;
  }
}

// Keep gain correct if device/orientation changes
window.matchMedia?.('(any-pointer: coarse)')?.addEventListener?.('change', setTypingGainForDevice);
window.addEventListener('orientationchange', setTypingGainForDevice);

// ========================= Typewriter =========================
function typeText(el, full, msPerChar = 22, skipTargets = []) {
  return new Promise((resolve) => {
    let i = 0, skipping = false;
    let armed = false;

    __isTypingActive = true;
    startTypingSfx();

    const skip = (e) => { if (!armed) return; e.preventDefault(); skipping = true; };
    const onKey = (e) => { if (!armed) return; if (e.key === 'Enter' || e.key === ' ') skipping = true; };

    const targets = skipTargets.length ? skipTargets : [el];

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
      __isTypingActive = false;
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

// ========================= DialogueEngine =========================
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

      // Pre-render next choices invisibly to reserve height (unless deferring)
      if (!this.deferNextChoices && nextNode && nextNode.type === 'choice') {
        this._renderChoices(nextNode.options || [], true);
      } else {
        this._hideChoices();
      }

      await typeText(this.textEl, node.say, node.msPerChar ?? 22, this.skipTargets);

      if (nextNode && nextNode.type === 'choice') {
        this.current = node.next;

        if (this.deferNextChoices) {
          this.deferNextChoices = false;
          this._renderChoices(nextNode.options || [], false); // build & reveal now
          this.choicesEl.style.minHeight = '';
          return;
        }

        this._revealPreparedChoices();
        return;
      }

      this.choicesEl.style.minHeight = '';
      if (node.next === 'end' || node.end === true) return this.onEnd();
      if (node.next) return this.goto(node.next);
      return;
    }

    if (node.type === 'choice') {
      this._renderChoices(node.options || [], false);
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
        e.stopPropagation();
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
      return;
    }
    this.choicesEl.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => this.choicesEl.classList.add('is-visible'));
  }

  _revealPreparedChoices() {
    this.choicesEl.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => this.choicesEl.classList.add('is-visible'));
  }
}

// ========================= Merchant Overlay (Delve) =========================
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

  // Grabber
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

  // Tabs + Panels
  const tabs = document.createElement('div');
  tabs.className = 'merchant-tabs';
  tabs.setAttribute('role', 'tablist');

  const panelsWrap = document.createElement('div');
  panelsWrap.className = 'merchant-panels';

  // Dialogue panel
  const panelDialogue = document.createElement('section');
  panelDialogue.className = 'merchant-panel is-active';
  panelDialogue.id = 'merchant-panel-dialogue';

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
  text.textContent = '…';

  bubble.append(avatar, text);
  dialog.appendChild(bubble);
  panelDialogue.appendChild(dialog);

  // Other panels (locked initially)
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

  // Actions
  const actions = document.createElement('div');
  actions.className = 'merchant-actions';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'merchant-close';
  closeBtn.textContent = 'Close';
  actions.appendChild(closeBtn);

  // First-time chat overlay
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

  merchantSheetEl.append(grabber, content, actions, firstChat);
  merchantOverlayEl.appendChild(merchantSheetEl);
  document.body.appendChild(merchantOverlayEl);

  // One-time events
  if (!merchantEventsBound) {
    merchantEventsBound = true;
    closeBtn.addEventListener('click', closeMerchant);
    document.addEventListener('keydown', onKeydownForMerchant);
    grabber.addEventListener('pointerdown', onMerchantDragStart);
    grabber.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

    // Allow priming via any pointer in the overlay (mobile-safe)
    merchantOverlayEl.addEventListener('pointerdown', primeTypingSfx, { once: true });
  }
}

function runFirstMeet() {
  const fc = merchantOverlayEl.querySelector('.merchant-firstchat');
  const textEl = fc.querySelector('#merchant-first-line');
  const rowEl  = fc.querySelector('.merchant-firstchat__row');
  const cardEl = fc.querySelector('.merchant-firstchat__card');
  const choicesEl = fc.querySelector('#merchant-first-choices');

  const engine = new DialogueEngine({
    textEl,
    choicesEl,
    skipTargets: [textEl, rowEl, cardEl],
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

  // Reset transform and transition
  merchantSheetEl.style.transition = 'none';
  merchantSheetEl.style.transform = '';
  merchantOverlayEl.setAttribute('aria-hidden', 'false');

  // Animate in next frame
  void merchantSheetEl.offsetHeight;
  requestAnimationFrame(() => {
    merchantSheetEl.style.transition = '';
    merchantOverlayEl.classList.add('is-open');

    // Restore last tab
    let last = 'dialogue';
    try { last = localStorage.getItem(MERCHANT_TAB_KEY) || 'dialogue'; } catch {}
    selectMerchantTab(last);

    // Ensure no orphaned audio
    stopTypingSfx();

    // First-time chat
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

// Drag to dismiss
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

  window.addEventListener('pointermove', onMerchantDragMove, { passive: true });
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

// Tabs
function selectMerchantTab(key) {
  const def = MERCHANT_TABS_DEF.find(t => t.key === key);
  if (!def || !def.unlocked) key = 'dialogue';

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
      btn.textContent = def.label;
    }
  });
}

// Expose for other modules that may build UI later
export { ensureMerchantOverlay };
