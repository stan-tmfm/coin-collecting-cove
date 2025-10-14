// /js/main.js
// Entry point: initialize the menu's slot clicks and transition to a black screen.

import { initSlots } from './util/slots.js';

function enterArea(area) {
  const menuRoot = document.querySelector('.menu-root');

  if (area === 'game') {
    // 1) Add a full-screen black overlay (only once)
    let overlay = document.getElementById('ccc-blackout');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ccc-blackout';
      Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        background: '#000',
        zIndex: '1000',   // sits above menu-root and panel (which are z-index: 1)
        opacity: '0',
      });
      document.body.appendChild(overlay);

      // Fade in smoothly so you can see the transition
      requestAnimationFrame(() => {
        overlay.style.transition = 'opacity 200ms ease';
        overlay.style.opacity = '1';
      });
    }

    // 2) Hide the menu area, but keep it in the DOM for future returns
    if (menuRoot) {
      menuRoot.setAttribute('aria-hidden', 'true');
      menuRoot.style.display = 'none';
    }

    // 3) Optional: remove the animated background class to reduce work
    //    (Your background and UI are layered: body.menu-bg (z:0) and menu content (z:1).)
    //    We’re covering everything with z-index 1000 anyway.:contentReference[oaicite:3]{index=3}
    document.body.classList.remove('menu-bg');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Treat the menu as the initial "area"
  // When a slot is selected, switch to the "game" area (black screen for now).
  initSlots((slotNum) => {
    // In the future you can route based on slotNum, load save data, etc.
    enterArea('game');
  });
});
