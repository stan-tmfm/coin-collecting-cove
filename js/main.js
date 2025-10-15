// js/main.js
import { initSlots } from './util/slots.js';
import { createSpawner } from './game/spawner.js';

const STORAGE_KEY = 'hasOpenedSaveSlot';

export const AREAS = {
  MENU: 0,
  STARTER_COVE: 1,
};

let currentArea = AREAS.MENU;
let spawner = null;

function getHasOpenedSaveSlot() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}
function setHasOpenedSaveSlot(value) {
  localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
}
function ensureStorageDefaults() {
  if (localStorage.getItem(STORAGE_KEY) === null) setHasOpenedSaveSlot(false);
}

// HUD helpers
function setButtonVisible(key, visible) {
  const el = document.querySelector(`.hud-bottom [data-btn="${key}"]`);
  if (el) el.hidden = !visible;
}
function initHudButtons() {
  setButtonVisible('help',  true);
  setButtonVisible('shop',  true);
  setButtonVisible('stats', true);
  setButtonVisible('map',   true);
}

// Area switching
function enterArea(areaID) {
  if (currentArea === areaID) return;
  currentArea = areaID;

  const menuRoot = document.querySelector('.menu-root');
  switch (areaID) {
    case AREAS.STARTER_COVE: {
      if (menuRoot) { menuRoot.setAttribute('aria-hidden', 'true'); menuRoot.style.display = 'none'; }
      document.body.classList.remove('menu-bg');
      const gameRoot = document.getElementById('game-root');
      if (gameRoot) { gameRoot.hidden = false; initHudButtons(); }

      // start spawner (create if not created)
      if (!spawner) {
        spawner = createSpawner({
          coinSrc: 'img/coin.png',
          coinSize: 40,
          initialRate: 1,
          surgeLifetimeMs: 1800,
          surgeWidthVw: 22
        });
      }
      spawner.start();
      break;
    }

    case AREAS.MENU: {
      if (menuRoot) { menuRoot.style.display = ''; menuRoot.removeAttribute('aria-hidden'); }
      const gameRoot = document.getElementById('game-root');
      if (gameRoot) gameRoot.hidden = true;

      if (spawner) spawner.stop();
      break;
    }
  }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  ensureStorageDefaults();

  const titleEl = document.getElementById('panel-title');
  if (getHasOpenedSaveSlot()) {
    document.body.classList.add('has-opened');
    if (titleEl) titleEl.style.opacity = '0';
  } else {
    if (titleEl) titleEl.style.opacity = '1';
  }

  // initSlots should call callback when a slot is opened
  initSlots(() => {
    setHasOpenedSaveSlot(true);
    document.body.classList.add('has-opened');
    if (titleEl) titleEl.style.opacity = '0';
    enterArea(AREAS.STARTER_COVE);
  });
});
