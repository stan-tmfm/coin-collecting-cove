// /js/main.js
import { initSlots } from './util/slots.js';

const STORAGE_KEY = 'hasOpenedSaveSlot';

export const AREAS = {
  MENU: 0,
  STARTER_COVE: 1,
};

let currentArea = AREAS.MENU;

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

// ----------------- HUD button helpers -----------------
function setButtonVisible(key, visible) {
  const el = document.querySelector(`.hud-bottom [data-btn="${key}"]`);
  if (!el) return;
  el.hidden = !visible;
}

function initHudButtons() {
  // For now: show all four buttons (you will change this as game logic unlocks them)
  setButtonVisible('help',  true);  // visible from the start
  setButtonVisible('shop',  true);  // currently visible (you can toggle later)
  setButtonVisible('stats', true);  // visible from the start (stats & settings)
  setButtonVisible('map',   true);  // currently visible (toggle later)
}
// ------------------------------------------------------

// Area switching / UI show/hide
function enterArea(areaID) {
  if (currentArea === areaID) return;
  currentArea = areaID;

  const menuRoot = document.querySelector('.menu-root');

  switch (areaID) {
    case AREAS.STARTER_COVE: {
      // Hide menu
      if (menuRoot) {
        menuRoot.setAttribute('aria-hidden', 'true');
        menuRoot.style.display = 'none';
      }
      document.body.classList.remove('menu-bg');

      // Show the StarterCove area
      const gameRoot = document.getElementById('game-root');
      if (gameRoot) {
        gameRoot.hidden = false;
        // initialize HUD buttons state for this area
        initHudButtons();
      }
      break;
    }

    case AREAS.MENU: {
      // Show menu again, hide game area
      if (menuRoot) {
        menuRoot.style.display = '';
        menuRoot.removeAttribute('aria-hidden');
      }
      const gameRoot = document.getElementById('game-root');
      if (gameRoot) {
        gameRoot.hidden = true;
      }
      break;
    }

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

  // Initialize save-slot UI and click handler
  initSlots(() => {
    // On first save slot click, persist flag and update UI instantly
    setHasOpenedSaveSlot(true);
    document.body.classList.add('has-opened');
    if (titleEl) titleEl.style.opacity = '0';

    // Enter the Starter Cove area (game view)
    enterArea(AREAS.STARTER_COVE);
  });
});
