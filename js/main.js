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
import { BigNum } from './util/bigNum.js';
import { formatCoin } from './util/numFormat.js';

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
