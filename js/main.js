import { initSlots } from './util/slots.js';

const STORAGE_KEY = 'hasOpenedSaveSlot';

function getHasOpenedSaveSlot() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function setHasOpenedSaveSlot(value) {
  localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
}

function ensureStorageDefaults() {
  if (localStorage.getItem(STORAGE_KEY) === null) {
    setHasOpenedSaveSlot(false);
  }
}

// === Area IDs =====================================================
export const AREAS = {
  MENU: 0,
  STARTER_COVE: 1,
};

let currentArea = AREAS.MENU;

// === Area Handling ================================================
function enterArea(areaID) {
  if (currentArea === areaID) return;
  currentArea = areaID;

  const menuRoot = document.querySelector('.menu-root');

  switch (areaID) {
    case AREAS.STARTER_COVE:
      // Instantly hide menu (no fade)
      if (menuRoot) {
        menuRoot.setAttribute('aria-hidden', 'true');
        menuRoot.style.display = 'none';
      }
      document.body.classList.remove('menu-bg');
      break;

    case AREAS.MENU:
      // Instantly show menu again
      if (menuRoot) {
        menuRoot.style.display = '';
        menuRoot.removeAttribute('aria-hidden');
      }
      break;

    default:
      break;
  }
}

// === Initialization ===============================================
document.addEventListener('DOMContentLoaded', () => {
  ensureStorageDefaults();

  const titleEl = document.getElementById('panel-title'); // "SELECT A SAVE SLOT"

  if (getHasOpenedSaveSlot()) {
    // Returning player: set body class and ensure title stays hidden via opacity
    document.body.classList.add('has-opened');
    if (titleEl) titleEl.style.opacity = '0';
  } else {
    // First-time player: reveal title (CSS default keeps it hidden before JS runs)
    if (titleEl) titleEl.style.opacity = '1';
  }

  initSlots(() => {
    // On first save slot click, persist flag and update UI instantly
    setHasOpenedSaveSlot(true);
    document.body.classList.add('has-opened');
    // also hide title immediately
    if (titleEl) titleEl.style.opacity = '0';

    enterArea(AREAS.STARTER_COVE);
  });
});
