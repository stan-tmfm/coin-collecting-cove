// js/ui/shopOverlay.js
// Bottom-sheet Shop overlay: DOM creation, open/close, ESC, and drag-to-dismiss.

let shopOverlayEl = null;
let shopSheetEl = null;
let shopOpen = false;
let drag = null; // {startY, lastY, startT, moved, canceled}
let eventsBound = false;

function ensureShopOverlay() {
  if (shopOverlayEl) return;

  shopOverlayEl = document.createElement('div');
  shopOverlayEl.className = 'shop-overlay';
  shopOverlayEl.id = 'shop-overlay';
  shopOverlayEl.setAttribute('aria-hidden', 'true');

  // Sheet
  shopSheetEl = document.createElement('div');
  shopSheetEl.className = 'shop-sheet';
  shopSheetEl.setAttribute('role', 'dialog');
  shopSheetEl.setAttribute('aria-modal', 'false');
  shopSheetEl.setAttribute('aria-label', 'Shop');

  // Grabber
  const grabber = document.createElement('div');
  grabber.className = 'shop-grabber';
  grabber.innerHTML = `<div class="grab-handle" aria-hidden="true"></div>`;

  // Content placeholder (real content will come later)
  const content = document.createElement('div');
  content.className = 'shop-content';
  content.innerHTML = `
    <div class="shop-placeholder" tabindex="-1">
      Shop UI framework is loaded. Content coming later.
    </div>
  `;

  // Actions
  const actions = document.createElement('div');
  actions.className = 'shop-actions';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'shop-close';
  closeBtn.textContent = 'Close';
  actions.appendChild(closeBtn);

  // Compose
  shopSheetEl.appendChild(grabber);
  shopSheetEl.appendChild(content);
  shopSheetEl.appendChild(actions);
  shopOverlayEl.appendChild(shopSheetEl);
  document.body.appendChild(shopOverlayEl);

  // Events (one-time)
  if (!eventsBound) {
    eventsBound = true;

    closeBtn.addEventListener('click', closeShop);
    document.addEventListener('keydown', onKeydownForShop);

    // Drag to dismiss (grabber only)
    grabber.addEventListener('pointerdown', onDragStart);
    grabber.addEventListener('touchstart', (e) => {
      // Prevent iOS bounce from interfering with the drag
      e.preventDefault();
    }, { passive: false });
  }
}

function onKeydownForShop(e) {
  if (!shopOpen) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeShop();
  }
}

export function openShop() {
  ensureShopOverlay();
  if (shopOpen) return;

  // Mark as opening
  shopOpen = true;

  // Ensure we start from the closed state with NO inline transform
  // (so the CSS default translateY(100%) applies)
  shopSheetEl.style.transition = 'none';
  shopSheetEl.style.transform = '';   // <-- critical: remove any leftover inline transform

  // Expose to a11y; pointer-events remain off until .is-open is added
  shopOverlayEl.setAttribute('aria-hidden', 'false');

  // Commit the closed state so the browser has a frame to diff against
  void shopSheetEl.offsetHeight;

  // Next frame: enable transition and add the open class so it animates up
  requestAnimationFrame(() => {
    shopSheetEl.style.transition = ''; // back to CSS transition (var(--shop-anim))
    shopOverlayEl.classList.add('is-open');

    // Focus for keyboard users
    const focusable = shopOverlayEl.querySelector('.shop-placeholder');
    if (focusable) focusable.focus();
  });
}


export function closeShop() {
  if (!shopOpen) return;

  // Reset any drag transform
  if (shopSheetEl) {
    shopSheetEl.style.transition = '';
    shopSheetEl.style.transform = '';
  }

  shopOpen = false;
  shopOverlayEl.classList.remove('is-open');
  shopOverlayEl.setAttribute('aria-hidden', 'true');
}

// ----- Drag helpers -----
function onDragStart(e) {
  if (!shopOpen) return;

  const clientY = typeof e.clientY === 'number'
    ? e.clientY
    : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

  drag = {
    startY: clientY,
    lastY: clientY,
    startT: performance.now(),
    moved: 0,
    canceled: false,
  };

  shopSheetEl.style.transition = 'none';

  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
  window.addEventListener('pointercancel', onDragCancel);
}

function onDragMove(e) {
  if (!drag || drag.canceled) return;
  const y = e.clientY;
  if (typeof y !== 'number') return;

  const dy = Math.max(0, y - drag.startY); // only downward
  drag.lastY = y;
  drag.moved = dy;

  shopSheetEl.style.transform = `translateY(${dy}px)`;
}

function onDragEnd() {
  if (!drag || drag.canceled) { cleanupDrag(); return; }

  const dt = Math.max(1, performance.now() - drag.startT);
  const dy = drag.moved;
  const velocity = dy / dt; // px/ms

  const shouldClose = (velocity > 0.55 && dy > 40) || dy > 140;

  if (shouldClose) {
    shopSheetEl.style.transition = 'transform 140ms ease-out';
    shopSheetEl.style.transform = 'translateY(100%)';
    setTimeout(() => { closeShop(); }, 150);
  } else {
    shopSheetEl.style.transition = 'transform 180ms ease';
    shopSheetEl.style.transform = 'translateY(0)';
  }

  cleanupDrag();
}

function onDragCancel() {
  if (!drag) return;
  drag.canceled = true;
  shopSheetEl.style.transition = 'transform 180ms ease';
  shopSheetEl.style.transform = 'translateY(0)';
  cleanupDrag();
}

function cleanupDrag() {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
  window.removeEventListener('pointercancel', onDragCancel);
  drag = null;
}
