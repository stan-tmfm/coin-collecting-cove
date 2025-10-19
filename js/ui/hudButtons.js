// js/ui/hudButtons.js
// Controls visibility (unlock/lock) and layout of HUD buttons across desktop & mobile.
// DOM order: Help → Shop → Stats & Settings → Map
// Mobile portrait (2×2): if 3 visible, put Help & Stats on row 1, Shop full width on row 2.

const UNLOCK_KEYS = {
  SHOP: 'ccc:unlock:shop',
  MAP:  'ccc:unlock:map',
};

function isUnlocked(key) { return localStorage.getItem(key) === '1'; }
function setUnlocked(key, v) { localStorage.setItem(key, v ? '1' : '0'); }
function ensureUnlockDefaults() {
  if (localStorage.getItem(UNLOCK_KEYS.SHOP) === null) setUnlocked(UNLOCK_KEYS.SHOP, false);
  if (localStorage.getItem(UNLOCK_KEYS.MAP)  === null) setUnlocked(UNLOCK_KEYS.MAP,  false);
}

function setButtonVisible(key, visible) {
  const el = document.querySelector(`.hud-bottom [data-btn="${key}"]`);
  if (el) el.hidden = !visible;
}

function phonePortrait() {
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const isPortrait = window.innerHeight >= window.innerWidth;
  return isCoarse && isPortrait;
}

let listenersBound = false;

export function applyHudLayout() {
  const hud = document.querySelector('.hud-bottom');
  if (!hud) return;

  // Matches your HTML: <button class="menu-btn ...">
  const all = [...hud.querySelectorAll('.menu-btn')];
  const visible = all.filter(el => !el.hidden);

  // Reset previous hints
  hud.classList.remove('is-2','is-3','is-4');
  visible.forEach(el => {
    el.style.gridColumn = '';
    el.style.gridRow = '';
    el.classList.remove('span-2');
    el.style.order = '';
  });
  hud.style.gridTemplateColumns = '';
  hud.classList.add(`is-${visible.length}`);

  // --- Desktop centering (avoid vw so iPad landscape matches 4-button width) ---
  if (!phonePortrait()) {
    const cs  = getComputedStyle(hud);
    const gap = parseFloat(cs.columnGap || cs.gap || '0') || 0; // px
    const cw  = hud.clientWidth;                                // px
    const per = Math.max(180, Math.floor((cw - 3 * gap) / 4));  // width per button in 4-col layout

    if (visible.length === 2) {
      hud.style.gridTemplateColumns = `1fr ${per}px ${per}px 1fr`;
      visible[0].style.gridColumn = '2';
      visible[1].style.gridColumn = '3';
      return;
    }
    if (visible.length === 3) {
      hud.style.gridTemplateColumns = `1fr ${per}px ${per}px ${per}px 1fr`;
      visible[0].style.gridColumn = '2';
      visible[1].style.gridColumn = '3';
      visible[2].style.gridColumn = '4';
      return;
    }
    // 4 buttons → let CSS handle it
  }

  // --- Mobile portrait (2×2): Help & Stats top; Shop full width bottom ---
  if (phonePortrait() && visible.length === 3) {
    const help  = hud.querySelector('[data-btn="help"]:not([hidden])');
    const stats = hud.querySelector('[data-btn="stats"]:not([hidden])');
    const shop  = hud.querySelector('[data-btn="shop"]:not([hidden])');

    if (help && stats && shop) {
      help.style.gridColumn  = '1'; help.style.gridRow  = '1';
      stats.style.gridColumn = '2'; stats.style.gridRow = '1';
      shop.style.gridColumn  = '1 / -1'; shop.style.gridRow = '2';
    }
  }
}

export function initHudButtons() {
  ensureUnlockDefaults();

  // Always-on buttons
  setButtonVisible('help',  true);
  setButtonVisible('stats', true);

  // Default-locked buttons
  setButtonVisible('shop', isUnlocked(UNLOCK_KEYS.SHOP));
  setButtonVisible('map',  isUnlocked(UNLOCK_KEYS.MAP));

  applyHudLayout();

  if (!listenersBound) {
    listenersBound = true;
    window.addEventListener('resize', applyHudLayout);
    window.addEventListener('orientationchange', applyHudLayout);
  }
}

// Convenience helpers
export function unlockShop() { setUnlocked(UNLOCK_KEYS.SHOP, true); setButtonVisible('shop', true); applyHudLayout(); }
export function unlockMap()  { setUnlocked(UNLOCK_KEYS.MAP,  true); setButtonVisible('map',  true); applyHudLayout(); }
export function lockShop()   { setUnlocked(UNLOCK_KEYS.SHOP, false); setButtonVisible('shop', false); applyHudLayout(); }
export function lockMap()    { setUnlocked(UNLOCK_KEYS.MAP,  false); setButtonVisible('map',  false); applyHudLayout(); }
