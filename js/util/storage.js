// js/util/storage.js

import { BigNum } from '../util/bigNum.js';
import { formatNumber } from '../util/numFormat.js';

const PREFIX = 'ccc:';  // short for Coin Collecting Cove

const KEYS = {
  HAS_OPENED_SAVE_SLOT: `${PREFIX}hasOpenedSaveSlot`,
};

export function getHasOpenedSaveSlot() {
  return localStorage.getItem(KEYS.HAS_OPENED_SAVE_SLOT) === 'true';
}

export function setHasOpenedSaveSlot(value) {
  localStorage.setItem(KEYS.HAS_OPENED_SAVE_SLOT, value ? 'true' : 'false');
}

export function ensureStorageDefaults() {
  if (localStorage.getItem(KEYS.HAS_OPENED_SAVE_SLOT) === null) {
    setHasOpenedSaveSlot(false);
  }
}
