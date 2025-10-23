// js/main.js
import { initSlots } from './util/slots.js';
import { createSpawner } from './game/spawner.js';
import { initCoinPickup } from './game/coinPickup.js';
import { initHudButtons } from './ui/hudButtons.js';
import {
  getHasOpenedSaveSlot,
  setHasOpenedSaveSlot,
  ensureStorageDefaults,
} from './util/storage.js';

export const AREAS = {
  MENU: 0,
  STARTER_COVE: 1,
};

let currentArea = AREAS.MENU;
let spawner = null;

/* ---------------------------
   LOADER UI (immediate black + progress)
----------------------------*/
// Yield to the browser for a frame (layout/paint opportunity)
const nextFrame = () => new Promise(r => requestAnimationFrame(r));
// Two frames gives slower devices time to style/layout
const twoFrames = async () => { await nextFrame(); await nextFrame(); };
function showLoader(text = 'Loading assets...') {
  // Reuse the pre-rendered loader if it exists
  let root = document.getElementById('boot-loader');
  if (!root) {
    root = document.createElement('div');
    root.id = 'boot-loader';
    root.className = 'loading-screen';
    document.body.appendChild(root);
  }

  // Build the inner UI (bar + %), preserve immediate black background
  root.innerHTML = '';
  Object.assign(root.style, {
    position: 'fixed',
    inset: '0',
    background: '#000',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    zIndex: '2147483647',
    opacity: '1',                     // already fully black
    transition: 'opacity 0.4s ease',
  });

  const wrap = document.createElement('div');
  wrap.style.textAlign = 'center';
  wrap.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

  const label = document.createElement('div');
  label.textContent = text;
  Object.assign(label.style, {
    fontSize: 'clamp(16px, 2.4vw, 22px)',
    letterSpacing: '.04em',
    opacity: '.92',
  });

  const bar = document.createElement('div');
  Object.assign(bar.style, {
    width: 'min(420px, 70vw)',
    height: '10px',
    background: 'rgba(255,255,255,.15)',
    borderRadius: '999px',
    margin: '12px auto 6px',
    overflow: 'hidden',
  });

  const fill = document.createElement('div');
  Object.assign(fill.style, {
    width: '0%',
    height: '100%',
    background: '#fff',
    transform: 'translateZ(0)',
    transition: 'width .15s linear',
  });

  const pct = document.createElement('div');
  pct.textContent = '0%';
  Object.assign(pct.style, { fontSize: '12px', opacity: '.85' });

  bar.appendChild(fill);
  wrap.append(label, bar, pct);
  root.appendChild(wrap);

  root.__mountedAt = performance.now();
  root.__done = false;
  root.__fill = fill;
  root.__pct = pct;
  root.__label = label;
  return root;
}

function setLoaderProgress(loaderEl, fraction) {
  if (!loaderEl) return;
  const f = Math.max(0, Math.min(1, fraction || 0));
  const pct = Math.round(f * 100);
  loaderEl.__fill.style.width = pct + '%';
  loaderEl.__pct.textContent = pct + '%';
}

function finishAndHideLoader(loaderEl) {
  if (!loaderEl || loaderEl.__done) return;
  loaderEl.__done = true;

  const MIN_FINISHED_DWELL_MS = 500;
  if (loaderEl.__label) loaderEl.__label.textContent = 'Finished loading assets';

  // Force layout so label change commits before timer starts
  // eslint-disable-next-line no-unused-expressions
  loaderEl.offsetHeight;

  setTimeout(() => {
    loaderEl.style.opacity = '0';
    const onEnd = () => {
      loaderEl.remove();
      // Reveal UI now that boot is complete
      document.documentElement.classList.remove('booting');
    };
    loaderEl.addEventListener('transitionend', onEnd, { once: true });
    setTimeout(onEnd, 450);
  }, MIN_FINISHED_DWELL_MS);
}

/* ---------------------------
   PRELOADERS (images, audio, fonts)
----------------------------*/
function preloadImages(sources, onEach) {
  return sources.map(src => new Promise(resolve => {
    const img = new Image();
    const done = () => { try { onEach?.(src); } catch {} resolve(src); };
    img.onload = done;
    img.onerror = done;
    img.src = src;
  }));
}

function preloadAudio(sources, onEach) {
  return sources.map(url => new Promise(resolve => {
    const a = new Audio();
    const done = () => { try { onEach?.(url); } catch {} resolve(url); };
    a.addEventListener('canplaythrough', done, { once: true });
    a.addEventListener('error', done, { once: true });
    a.preload = 'auto';
    a.src = url;
    a.load?.();
  }));
}

function preloadFonts(onEach) {
  if (document.fonts && document.fonts.ready) {
    return [document.fonts.ready.then(() => { try { onEach?.('fonts'); } catch {} })];
  }
  return [Promise.resolve().then(() => { try { onEach?.('fonts'); } catch {} })];
}

async function preloadAssetsWithProgress({ images = [], audio = [], fonts = true }, onProgress) {
  const total = images.length + audio.length + (fonts ? 1 : 0);
  if (total === 0) { onProgress?.(1); return; }
  let done = 0;
  const bump = () => { done++; onProgress?.(done / total); };

  const tasks = [
    ...preloadImages(images, bump),
    ...preloadAudio(audio, bump),
    ...(fonts ? preloadFonts(bump) : []),
  ];

  await Promise.all(tasks.map(p => p.catch(() => null)));
}

/* ---------------------------
   GAME AREA CONTROL
----------------------------*/
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

/* ---------------------------
   BOOT FLOW
----------------------------*/
document.addEventListener('DOMContentLoaded', async () => {
  const loader = showLoader('Loading assets...');

  const ASSET_MANIFEST = {
    images: [
      'img/Hot_dog_with_mustard.png',
      'img/coin/coin.png',
      'img/coin/coinBase.png',
      'img/coin/coinPlusBase.png',
      'img/sc_upg_icons/faster_coins_id_1.png',
    ],
    audio: [
      'audio/coin_pickup.mp3',
    ],
    fonts: true,
  };

  // Start preloading and update progress…
  let progress = 0;
  await preloadAssetsWithProgress(ASSET_MANIFEST, f => {
    progress = f;
    setLoaderProgress(loader, f);
  });

  // Remove the booting CSS (which hides menu/game) but keep loader on top.
  await twoFrames();                              // give CSS/DOM a moment
  document.documentElement.classList.remove('booting');

  // Give it one more frame so fonts/images settle
  await nextFrame();

  // Show "Finished…" for 0.5s, then fade out the loader
  finishAndHideLoader(loader);

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
