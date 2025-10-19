// js/ui/hudButtons.js
// Controls visibility (unlock/lock) and layout of HUD buttons across desktop & mobile.
// Updated for new DOM order: Help → Shop → Stats & Settings → Map
// Special mobile portrait (2×2) rule: when 3 buttons are visible (help, shop, stats),
// place Help & Stats on the top row, and force Shop to a full-width row beneath them
// (even though Shop appears before Stats in the DOM).

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

  const all = [...hud.querySelectorAll('.menu-btn')];
  const visible = all.filter(el => !el.hidden);

  // Reset any previous layout hints
  hud.classList.remove('is-2','is-3','is-4');
  visible.forEach(el => {
    el.style.gridColumn = '';
    el.style.gridRow = '';
    el.classList.remove('span-2');
    el.style.order = '';
  });
  hud.style.gridTemplateColumns = '';

  hud.classList.add(`is-${visible.length}`);

  // --- Desktop (PC) custom centering ---
  if (!phonePortrait()) {
    // If exactly 2 buttons, center them as a pair
    if (visible.length === 2) {
      hud.style.gridTemplateColumns = '1fr minmax(180px, 22vw) minmax(180px, 22vw) 1fr';
      visible[0].style.gridColumn = '2';
      visible[1].style.gridColumn = '3';
      return;
    }
    // If exactly 3 buttons, keep them centered across the middle three columns
    if (visible.length === 3) {
      hud.style.gridTemplateColumns = '1fr minmax(180px, 22vw) minmax(180px, 22vw) minmax(180px, 22vw) 1fr';
      visible[0].style.gridColumn = '2';
      visible[1].style.gridColumn = '3';
      visible[2].style.gridColumn = '4';
      return;
    }
    // 4 buttons → whatever your default CSS defines (no inline override)
  }

  // --- Mobile portrait (2×2) special case: 3 visible buttons ---
  // With new DOM order (help, shop, stats), we want:
  //   Row 1: Help (col 1), Stats (col 2)
  //   Row 2: Shop spanning both columns
  if (phonePortrait() && visible.length === 3) {
    const help = hud.querySelector('[data-btn="help"]:not([hidden])');
    const shop = hud.querySelector('[data-btn="shop"]:not([hidden])');
    const stats = hud.querySelector('[data-btn="stats"]:not([hidden])');

    if (help && stats && shop) {
      // Top row
      help.style.gridColumn = '1';
      help.style.gridRow = '1';

      stats.style.gridColumn = '2';
      stats.style.gridRow = '1';

      // Bottom, full-width
      shop.style.gridColumn = '1 / -1';
      shop.style.gridRow = '2';
      // (No need for .span-2 class if we pin both grid edges explicitly)
    }
  }
}

export function initHudButtons() {
  ensureUnlockDefaults();

  // Always-on buttons
  setButtonVisible('help',  true);
  setButtonVisible('stats', true); // Settings button uses data-btn="stats"

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

// Convenience helpers you can call from gameplay code
export function unlockShop() { setUnlocked(UNLOCK_KEYS.SHOP, true); setButtonVisible('shop', true); applyHudLayout(); }
export function unlockMap()  { setUnlocked(UNLOCK_KEYS.MAP,  true); setButtonVisible('map',  true); applyHudLayout(); }
export function lockShop()   { setUnlocked(UNLOCK_KEYS.SHOP, false); setButtonVisible('shop', false); applyHudLayout(); }
export function lockMap()    { setUnlocked(UNLOCK_KEYS.MAP,  false); setButtonVisible('map',  false); applyHudLayout(); }
