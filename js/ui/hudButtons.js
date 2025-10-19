// js/ui/hudButtons.js
// Controls visibility (unlock/lock) and layout of HUD buttons across desktop & mobile.

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
  visible.forEach(el => { el.style.gridColumn = ''; el.classList.remove('span-2'); });
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
    // If exactly 3 buttons, keep them centered (Map hidden, e.g.)
    if (visible.length === 3) {
      hud.style.gridTemplateColumns = '1fr minmax(180px, 22vw) minmax(180px, 22vw) minmax(180px, 22vw) 1fr';
      visible[0].style.gridColumn = '2';
      visible[1].style.gridColumn = '3';
      visible[2].style.gridColumn = '4';
      return;
    }
  }

  // --- Mobile portrait 2x2 special case ---
  // If 3 visible (Help, Settings, Shop), make Shop full width under them
  if (phonePortrait() && visible.length === 3) {
    const shop = hud.querySelector('[data-btn="shop"]');
    if (shop && !shop.hidden) shop.classList.add('span-2'); // CSS makes it span both columns
  }
}

export function initHudButtons() {
  ensureUnlockDefaults();

  // Always-on buttons
  setButtonVisible('help',  true);
  setButtonVisible('stats', true); // your Settings button uses data-btn="stats"

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
