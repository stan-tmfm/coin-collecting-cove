// js/main.js
import { initSlots } from './util/slots.js';
import { createSpawner } from './game/spawner.js';
import { initCoinPickup } from './game/coinPickup.js';
import {
  initHudButtons,
  unlockShop, unlockMap, lockShop, lockMap,
} from './ui/hudButtons.js';
import {
  getHasOpenedSaveSlot,
  setHasOpenedSaveSlot,
  ensureStorageDefaults,
} from './util/storage.js';

// --- no-loupe helpers (iOS double-tap-and-hold magnifier) --------------------
let cleanupNoLoupe = null;

function enableNoLoupeForGameArea() {
  // Only do this on touch-centric devices
  if (!window.matchMedia('(pointer: coarse)').matches) return () => {};

  document.documentElement.classList.add('no-loupe');

  const area = document.querySelector('.area-cove');

  const clearSelection = () => {
    const sel = window.getSelection?.();
    if (sel && sel.rangeCount) sel.removeAllRanges();
  };

  const preventInArea = (e) => {
    if (area && e.target && area.contains(e.target)) {
      e.preventDefault();
      clearSelection();
    }
  };

  // Block the remaining paths that can spawn the loupe
  ['selectstart', 'gesturestart', 'contextmenu'].forEach((evt) => {
    document.addEventListener(evt, preventInArea, { passive: false, capture: true });
  });
  document.addEventListener('selectionchange', clearSelection, { passive: true });

  // Return cleanup function
  return () => {
    document.documentElement.classList.remove('no-loupe');
    ['selectstart', 'gesturestart', 'contextmenu'].forEach((evt) => {
      document.removeEventListener(evt, preventInArea, { capture: true });
    });
    document.removeEventListener('selectionchange', clearSelection);
  };
}
// -----------------------------------------------------------------------------

export const AREAS = {
  MENU: 0,
  STARTER_COVE: 1,
};

let currentArea = AREAS.MENU;
let spawner = null;

function enterArea(areaID) {
  if (currentArea === areaID) return;
  currentArea = areaID;

  const menuRoot = document.querySelector('.menu-root');
  switch (areaID) {
    case AREAS.STARTER_COVE: {
      if (menuRoot) {
        menuRoot.setAttribute('aria-hidden', 'true');
        menuRoot.style.display = 'none';
      }
      document.body.classList.remove('menu-bg');
      const gameRoot = document.getElementById('game-root');
      if (gameRoot) {
        gameRoot.hidden = false;
        initHudButtons();
      }

      // Enable no-loupe while the game area is active
      if (cleanupNoLoupe) cleanupNoLoupe();
      cleanupNoLoupe = enableNoLoupeForGameArea();

      if (!spawner) {
        spawner = createSpawner({
          coinSrc: 'img/coin/coin.png',
          coinSize: 40,
          initialRate: 1,
          surgeLifetimeMs: 1800,
          surgeWidthVw: 22,
        });
        initCoinPickup();
      }
      spawner.start();
      break;
    }

    case AREAS.MENU: {
      if (menuRoot) {
        menuRoot.style.display = '';
        menuRoot.removeAttribute('aria-hidden');
      }
      const gameRoot = document.getElementById('game-root');
      if (gameRoot) gameRoot.hidden = true;

      // Cleanup no-loupe when leaving the game area
      if (cleanupNoLoupe) { cleanupNoLoupe(); cleanupNoLoupe = null; }

      if (spawner) spawner.stop();
      break;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ensureStorageDefaults();

  const titleEl = document.getElementById('panel-title');
  if (getHasOpenedSaveSlot()) {
    document.body.classList.add('has-opened');
    if (titleEl) titleEl.style.opacity = '0';
  } else {
    if (titleEl) titleEl.style.opacity = '1';
  }

  initSlots(() => {
    setHasOpenedSaveSlot(true);
    document.body.classList.add('has-opened');
    if (titleEl) titleEl.style.opacity = '0';
    enterArea(AREAS.STARTER_COVE);
  });
});
