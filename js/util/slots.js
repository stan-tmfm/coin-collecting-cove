import { setHasOpenedSaveSlot } from './storage.js';

export function initSlots(onSelect) {
  const slots = document.querySelectorAll('.slot-card');

  slots.forEach((btn, idx) => {
    const slotNum = idx + 1;

    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      setHasOpenedSaveSlot(true);          // ← persist the flag
      if (typeof onSelect === 'function') onSelect(slotNum, ev);
    });
  });
}
