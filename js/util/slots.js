// /js/util/slots.js
// Makes all save slots clickable and notifies the caller which slot was chosen.

export function initSlots(onSelect) {
  const slots = document.querySelectorAll('.slot-card');

  slots.forEach((btn, idx) => {
    const slotNum = idx + 1;

    // Click works for mouse and touch (modern mobile browsers synthesize it)
    btn.addEventListener('click', (ev) => {
      // Keep default button behavior minimal and consistent
      ev.preventDefault();
      if (typeof onSelect === 'function') onSelect(slotNum, ev);
    });
  });
}
