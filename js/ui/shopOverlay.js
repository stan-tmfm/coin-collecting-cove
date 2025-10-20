// js/ui/shopOverlay.js
// Bottom-sheet Shop overlay + dynamic icon grid (no purchase logic yet).

let shopOverlayEl = null;
let shopSheetEl = null;
let shopOpen = false;
let drag = null; // {startY, lastY, startT, moved, canceled}
let eventsBound = false;

// -------- Config (paths) --------
const ICON_DIR = 'img/sc_upg_icons/';
const BASE_ICON_SRC = 'img/coin/coinBase.png';

// 1×1 transparent PNG (fallback when an icon is missing)
const TRANSPARENT_PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3x0S8AAAAASUVORK5CYII=';

// Dynamic count of upgrades (editable later via setUpgradeCount)
let UPGRADE_COUNT = 30;

// Upgrades registry (minimal for now)
let upgrades = {};

function ensureCustomScrollbar() {
  const scroller = shopOverlayEl?.querySelector('.shop-content');
  if (!scroller || scroller.__customScroll) return;

  const bar = document.createElement('div');
  bar.className = 'shop-scrollbar';
  const thumb = document.createElement('div');
  thumb.className = 'shop-scrollbar__thumb';
  bar.appendChild(thumb);
  shopSheetEl.appendChild(bar);

  scroller.__customScroll = { bar, thumb };

  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const FADE_SCROLL_MS = 150;  // was 900 → snappier
  const FADE_DRAG_MS   = 120;  // was 600
  const supportsScrollEnd = 'onscrollend' in window;

  const updateBounds = () => {
    const grab = shopOverlayEl.querySelector('.shop-grabber');
    const header = shopOverlayEl.querySelector('.shop-header');
    const actions = shopOverlayEl.querySelector('.shop-actions');

    const top = ((grab?.offsetHeight || 0) + (header?.offsetHeight || 0)) | 0;
    const bottom = (actions?.offsetHeight || 0) | 0;

    bar.style.top = top + 'px';
    bar.style.bottom = bottom + 'px';
  };

  const updateThumb = () => {
    const { scrollHeight, clientHeight, scrollTop } = scroller;
    const barH = bar.clientHeight;
    const visibleRatio = clientHeight / Math.max(1, scrollHeight);
    const thumbH = Math.max(28, Math.round(barH * visibleRatio));

    const maxScroll = Math.max(1, scrollHeight - clientHeight);
    const range = Math.max(0, barH - thumbH);
    const y = Math.round((scrollTop / maxScroll) * range);

    thumb.style.height = thumbH + 'px';
    thumb.style.transform = `translateY(${y}px)`;
    bar.style.display = (scrollHeight <= clientHeight + 1) ? 'none' : '';
  };

  const updateAll = () => { updateBounds(); updateThumb(); };

  // ---- visibility helpers (mobile) ----
  const showBar = () => {
    if (!isTouch) return;
    shopSheetEl.classList.add('is-scrolling');
    clearTimeout(scroller.__fadeTimer);
  };
  const scheduleHide = (delay) => {
    if (!isTouch) return;
    clearTimeout(scroller.__fadeTimer);
    scroller.__fadeTimer = setTimeout(() => {
      shopSheetEl.classList.remove('is-scrolling');
    }, delay);
  };

  const onScroll = () => {
    updateThumb();
    if (isTouch) showBar();
    // If scrollend isn’t supported, fall back to a short timeout
    if (!supportsScrollEnd) scheduleHide(FADE_SCROLL_MS);
  };

  const onScrollEnd = () => {
    // Fired once momentum stops — schedule quick fade
    scheduleHide(FADE_SCROLL_MS);
  };

  scroller.addEventListener('scroll', onScroll, { passive: true });
  if (supportsScrollEnd) {
    scroller.addEventListener('scrollend', onScrollEnd, { passive: true });
  }

  const ro = new ResizeObserver(updateAll);
  ro.observe(scroller);
  window.addEventListener('resize', updateAll);
  requestAnimationFrame(updateAll);

  // --- Drag to scroll ---
  let dragging = false;
  let dragStartY = 0;
  let startScrollTop = 0;

  const startDrag = (e) => {
    dragging = true;
    dragStartY = e.clientY;
    startScrollTop = scroller.scrollTop;
    thumb.classList.add('dragging');
    showBar();
    try { thumb.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
  };

  const onDragMove = (e) => {
    if (!dragging) return;
    const barH = bar.clientHeight;
    const thH = thumb.clientHeight;
    const range = Math.max(1, barH - thH);
    const scrollMax = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    const deltaY = e.clientY - dragStartY;
    const scrollDelta = (deltaY / range) * scrollMax;
    scroller.scrollTop = startScrollTop + scrollDelta;
  };

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    thumb.classList.remove('dragging');
    scheduleHide(FADE_DRAG_MS);
    try { thumb.releasePointerCapture(e.pointerId); } catch {}
  };

  thumb.addEventListener('pointerdown', startDrag);
  window.addEventListener('pointermove', onDragMove, { passive: true });
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // --- Click track to jump ---
  bar.addEventListener('pointerdown', (e) => {
    if (e.target === thumb) return; // drag handled above
    const rect = bar.getBoundingClientRect();
    const clickY = e.clientY - rect.top;

    const barH = bar.clientHeight;
    const thH = thumb.clientHeight;
    const range = Math.max(0, barH - thH);
    const targetY = Math.max(0, Math.min(clickY - thH / 2, range));

    const scrollMax = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    scroller.scrollTop = (targetY / Math.max(1, range)) * scrollMax;

    showBar();
    scheduleHide(FADE_SCROLL_MS);
  });
}

// Build (or rebuild) the upgrades object
function buildUpgradesData(count = UPGRADE_COUNT) {
  upgrades = {};
  for (let i = 0; i < count; i++) {
    const key = `upg_${i + 1}`;
    upgrades[key] = {
      key,
      level: 1,
      baseIcon: BASE_ICON_SRC,
      // Using the same starter icon for now, as requested
      upgradeIcon: `${ICON_DIR}faster_coins_id_1.png`,
    };
  }
}

// Render the grid from the upgrades object
function renderShopGrid() {
  const grid = shopOverlayEl?.querySelector('#shop-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (const key in upgrades) {
    const upg = upgrades[key];

    const btn = document.createElement('button');
    btn.className = 'shop-upgrade';
    btn.type = 'button';
    btn.setAttribute('role', 'gridcell');
    btn.dataset.key = upg.key;
    btn.setAttribute('aria-label', `Upgrade ${upg.key.replace('upg_', '')}, level ${upg.level}`);

    // Layered, perfectly centered images
    const tile = document.createElement('div');
    tile.className = 'shop-tile';

    const baseImg = document.createElement('img');
    baseImg.className = 'base';
    baseImg.src = upg.baseIcon;
    baseImg.alt = '';

    const iconImg = document.createElement('img');
    iconImg.className = 'icon';
    iconImg.src = upg.upgradeIcon;
    iconImg.alt = '';
    iconImg.decoding = 'async';
    iconImg.loading = 'lazy';
    iconImg.addEventListener('error', () => {
      // Fallback to invisible icon if the requested one is missing
      iconImg.src = TRANSPARENT_PX;
    });

    const badge = document.createElement('span');
    badge.className = 'level-badge';
    badge.textContent = String(upg.level);

    tile.append(baseImg, iconImg, badge);
    btn.appendChild(tile);
    grid.appendChild(btn);
  }
}

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

    // Content: sticky header + grid (no extra scroller)
const content = document.createElement('div');
content.className = 'shop-content';

const header = document.createElement('header');
header.className = 'shop-header';
header.innerHTML = `
  <div class="shop-title">SHOP</div>
  <div class="shop-line" aria-hidden="true"></div>
`;

const grid = document.createElement('div');
grid.className = 'shop-grid';
grid.id = 'shop-grid';
grid.setAttribute('role', 'grid');
grid.setAttribute('aria-label', 'Shop Upgrades');

content.appendChild(header);
content.appendChild(grid);
ensureCustomScrollbar();

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

  // Data + first render
  buildUpgradesData(UPGRADE_COUNT);
  renderShopGrid();

  // Events (one-time)
  if (!eventsBound) {
    eventsBound = true;

    closeBtn.addEventListener('click', closeShop);
    document.addEventListener('keydown', onKeydownForShop);

    // Drag to dismiss (grabber only)
    grabber.addEventListener('pointerdown', onDragStart);
    grabber.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent iOS bounce
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
  shopSheetEl.style.transition = 'none';
  shopSheetEl.style.transform = '';

  // Expose to a11y; pointer-events stay off until .is-open is added
  shopOverlayEl.setAttribute('aria-hidden', 'false');

  // Commit closed state, then animate open next frame
  void shopSheetEl.offsetHeight;
  requestAnimationFrame(() => {
    shopSheetEl.style.transition = ''; // back to CSS var(--shop-anim)
    shopOverlayEl.classList.add('is-open');
	ensureCustomScrollbar();

    // Focus something useful for keyboard users
    const focusable =
      shopOverlayEl.querySelector('#shop-grid .shop-upgrade') ||
      shopOverlayEl.querySelector('#shop-grid');
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

// ----- Tiny API for later wiring -----
export function setUpgradeCount(n) {
  UPGRADE_COUNT = Math.max(0, n | 0);
  buildUpgradesData(UPGRADE_COUNT);
  renderShopGrid();
}
export function getUpgrades() { return upgrades; }






