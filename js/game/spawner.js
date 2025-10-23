// spawner.js

export function createSpawner({
    playfieldSelector = '.area-cove .playfield',
    waterSelector = '.water-base',
    surgesHost = '.surges',
    coinsHost = '.coins-layer',
    coinSrc = 'img/coin/coin.png',
    coinSize = 40, // px
    animationName = 'coin-from-wave',
    animationDurationMs = 1500,
    surgeLifetimeMs = 1400,
    surgeWidthVw = 22, // width of wave in vw of playfield
    coinsPerSecond = 20,
    perFrameBudget = 24, // max spawns committed per RAF
    backlogCap = 600, // queue backpressure
    maxActiveCoins = 1250, // coin capacity before coins are recycled
    initialBurst = 1, // the amount of coins that spawn on room enter
	coinTtlMs = 60000, // auto-despawn each coin after 60s
    enableDropShadow = false, // if I ever want to enable drop shadow on the spawned coins
} = {}) {
    
	// Mobile-only resume boost tuning
	const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
	let boostFramesLeft = 0;
	const MOBILE_RESUME_BOOST_FRAMES = 8;   // how many frames to boost
	const MOBILE_RESUME_BURST_MAX   = 180;  // hard cap per boosted frame
	const MOBILE_SPAWN_TIME_BUDGET_MS = 3.5; // max ms spent building a boosted batch

    // ---------- resolve and keep DOM references ----------
    const refs = {
        pf: document.querySelector(playfieldSelector),
        w: document.querySelector(waterSelector),
        s: document.querySelector(surgesHost),
        c: document.querySelector(coinsHost),
        hud: document.getElementById('hud-bottom'),
    };

    function validRefs() {
        return !!(refs.pf && refs.w && refs.s && refs.c);
    }

    if (!validRefs()) {
        console.warn('[Spawner] Missing required nodes. Check your selectors:', {
            playfieldSelector,
            waterSelector,
            surgesHost,
            coinsHost
        });
    }

    // ---------- cached layout metrics (refreshed on resize/visibility) ----------
    let M = {
        pfRect: null,
        wRect: null,
        safeBottom: 0,
        pfW: 0
    };

    function computeMetrics() {
        if (!validRefs())
            return false;
        const pfRect = refs.pf.getBoundingClientRect();
        const wRect = refs.w.getBoundingClientRect();
        const hudH = refs.hud ? refs.hud.getBoundingClientRect().height : 0;

        M = {
            pfRect,
            wRect,
            safeBottom: pfRect.height - hudH,
            pfW: pfRect.width
        };
        return true;
    }

    computeMetrics();

    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => computeMetrics()) : null;
    if (ro && refs.pf)
        ro.observe(refs.pf);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden)
            computeMetrics();
    });

    // ---------- small utilities ----------
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    // ---------- pools ----------
    const COIN_POOL_MAX = Math.max(2000, maxActiveCoins * 3);
    const SURGE_POOL_MAX = 800;

    const coinPool = [];
    const surgePool = [];

    function makeCoin() {
        const el = document.createElement('div');
        el.className = 'coin';
        el.style.position = 'absolute';
        el.style.width = `${coinSize}px`;
        el.style.height = `${coinSize}px`;
        el.style.background = `url(${coinSrc}) center/contain no-repeat`;
        el.style.borderRadius = '50%';
        el.style.pointerEvents = 'none';
        el.style.willChange = 'transform, opacity';
        el.style.contain = 'layout paint style size';
        if (enableDropShadow)
            el.style.filter = 'drop-shadow(0 2px 2px rgba(0,0,0,.35))';
        return el;
    }
    const getCoin = () => (coinPool.length ? coinPool.pop() : makeCoin());
     function releaseCoin(el) {
   el.style.animation = 'none';
   el.style.transform = '';
   el.style.opacity = '1';
    delete el.dataset.dieAt;
    delete el.dataset.jitter;
    delete el.dataset.collected;

   if (el.parentNode)
     el.remove();
   if (coinPool.length < COIN_POOL_MAX)
     coinPool.push(el);
 }

    function makeSurge() {
        const el = document.createElement('div');
        el.className = 'wave-surge';
        el.style.willChange = 'transform, opacity';
        return el;
    }
    const getSurge = () => (surgePool.length ? surgePool.pop() : makeSurge());
    function releaseSurge(el) {
        el.classList.remove('run');
        if (el.parentNode)
            el.remove();
        if (surgePool.length < SURGE_POOL_MAX)
            surgePool.push(el);
    }

    // ---------- spawn planning ----------
    function planSpawn() {
        if (!validRefs())
            return null;
        if (!M.pfRect || !M.wRect)
            computeMetrics();

        // soft cap active coins: recycle oldest to prevent DOM runaway
        if (maxActiveCoins !== Infinity && refs.c.childElementCount >= maxActiveCoins) {
            const oldest = refs.c.firstElementChild;
            if (oldest)
                releaseCoin(oldest);
        }

        const pfW = M.pfW;
        const waveW = clamp(pfW * (surgeWidthVw / 100), 220, 520);
        const margin = 12;
        const leftMax = Math.max(1, pfW - waveW - margin * 2);
        const waveX = Math.random() * leftMax + margin;

        // position wave just below water band
        const waterToPfTop = M.wRect.top - M.pfRect.top;
        const waveTop = Math.max(0, waterToPfTop + M.wRect.height * 0.05);

        // coin emerges under crest with slight random offset
        const crestCenter = waveX + waveW / 2 + (Math.random() * 60 - 30);
        const startX = crestCenter - coinSize / 2;
        const startY = waveTop + 10 - coinSize / 2;

        // shoreline landing with +/- drift
        const drift = Math.random() * 100 - 50;
        const endX = clamp(startX + drift, margin, pfW - coinSize - margin);
        const minY = Math.max(M.wRect.height + 80, 120);
        const maxY = Math.max(minY + 40, M.safeBottom - coinSize - 6);
        const endY = clamp(minY + Math.random() * (maxY - minY), minY, maxY);

        // mid point to finish Y early then slide X (matches CSS keyframes 66%)
        const midX = startX + (endX - startX) * 0.66;

        const jitterMs = Math.random() * 100;

        return {
            wave: {
                x: waveX,
                y: waveTop,
                w: waveW
            },
            coin: {
                x0: startX,
                y0: startY,
                xMid: midX,
                y1: endY,
                x1: endX,
                jitterMs
            }
        };
    }

    // ---------- commit spawns: batch DOM writes; start animations after append ----------
    function commitBatch(batch) {
        if (!batch.length || !validRefs())
            return;

        const wavesFrag = document.createDocumentFragment();
        const coinsFrag = document.createDocumentFragment();
        const newCoins = [];
        const newSurges = [];

        for (const {
            wave,
            coin
        }
            of batch) {
            // wave
            const surge = getSurge();
            surge.style.left = `${wave.x}px`;
            surge.style.top = `${wave.y}px`;
            surge.style.width = `${wave.w}px`;
            wavesFrag.appendChild(surge);
            newSurges.push(surge);

            // coin
            const el = getCoin();
            el.style.setProperty('--x0', `${coin.x0}px`);
            el.style.setProperty('--y0', `${coin.y0}px`);
            el.style.setProperty('--xmid', `${coin.xMid}px`);
            el.style.setProperty('--y1', `${coin.y1}px`);
            el.style.setProperty('--x1', `${coin.x1}px`);
            // baseline so it's visible even if animation doesn't kick this frame
            el.style.transform = `translate3d(${coin.x0}px, ${coin.y0}px, 0)`;
            el.dataset.jitter = String(coin.jitterMs);
			el.dataset.dieAt = String(performance.now() + coinTtlMs);

            coinsFrag.appendChild(el);
            newCoins.push(el);
        }

        refs.s.appendChild(wavesFrag);
        refs.c.appendChild(coinsFrag);

        // Kick animations after append (pool-safe, restart-safe)
        requestAnimationFrame(() => {
            for (const surge of newSurges) {
                surge.classList.remove('run');
                // force reflow to restart CSS animation even if element comes from pool
                void surge.offsetWidth;
                surge.classList.add('run');
                // reclaim when wave animation ends
                const onEnd = (e) => {
                    if (e.target === surge)
                        releaseSurge(surge);
                };
                surge.addEventListener('animationend', onEnd, {
                    once: true
                });
            }
            for (const el of newCoins) {
                const jitter = Number(el.dataset.jitter) || 0;
                el.style.animation = 'none';
                void el.offsetWidth; // reset
                el.style.animation = `${animationName} ${animationDurationMs}ms ease-out ${jitter}ms 1 both`;
                // Optional auto-recycle after landing:
                // el.addEventListener('animationend', () => releaseCoin(el), { once: true });
            }
        });
    }

    function spawnBurst(n = 1) {
        if (!validRefs())
            return;
        if (!M.pfRect || !M.wRect)
            computeMetrics();
        const batch = [];
        for (let i = 0; i < n; i++) {
            const plan = planSpawn();
            if (plan)
                batch.push(plan);
        }
        if (batch.length)
            commitBatch(batch);
    }

    // ---------- RAF loop with accumulator + micro-batching + backpressure ----------
    let rate = coinsPerSecond;
    let rafId = null;
    let last = performance.now();
    let carry = 0; // fractional coins
    let queued = 0; // whole coins awaiting spawn
	let ttlCursor = null;
	const ttlChecksPerFrame = 200;

    function loop(now) {
  if (!M.pfRect || !M.wRect) computeMetrics();

  const dt = (now - last) / 1000; // keep backlog intact on resume
  last = now;

  // ---- TTL cleanup (matches your pooling) ----
  {
    let checked = 0;
    let node = ttlCursor || (refs.c && refs.c.firstElementChild);
    while (node && checked < ttlChecksPerFrame) {
      const next = node.nextElementSibling;
      const dieAt = Number((node.dataset && node.dataset.dieAt) || 0);
      if (dieAt && now >= dieAt) {
        releaseCoin(node); // return to pool
      }
      node = next;
      checked++;
    }
    ttlCursor = node || null;
  }

  // ---- Backlog accumulation ----
  carry += rate * dt;
  const due = carry | 0;
  if (due > 0) {
    queued = Math.min(backlogCap, queued + due);
    carry -= due;
  }

  // ---- Spawn: PC path unchanged; mobile gets a short boost after resume ----
  let spawnTarget = Math.min(queued, perFrameBudget);

  if (isTouch && boostFramesLeft > 0) {
    // Adaptive burst that scales with backlog but stays capped
    const adaptive = Math.max(perFrameBudget, Math.ceil(Math.sqrt(queued) * 8));
    spawnTarget = Math.min(queued, MOBILE_RESUME_BURST_MAX, adaptive);

    // Time-budget the planning to avoid frame hitching on phones
    const t0 = performance.now();
    const batch = [];
    for (let i = 0; i < spawnTarget; i++) {
      if (performance.now() - t0 > MOBILE_SPAWN_TIME_BUDGET_MS) break;
      const plan = planSpawn();
      if (plan) batch.push(plan);
    }
    if (batch.length) {
      commitBatch(batch);
      queued -= batch.length;
    }
    boostFramesLeft--;
  } else {
    // Original per-frame budget (desktop + normal mobile frames)
    const n = spawnTarget;
    if (n > 0) {
      const batch = [];
      for (let i = 0; i < n; i++) {
        const plan = planSpawn();
        if (plan) batch.push(plan);
      }
      if (batch.length) {
        commitBatch(batch);
        queued -= batch.length;
      }
    }
  }

  rafId = requestAnimationFrame(loop);
}


    function start() {
        if (rafId)
            return;
        if (!validRefs()) {
            console.warn('[Spawner] start() called but required nodes are missing.');
            return;
        }
        computeMetrics();

        // Instant wave/coin spawn before the first RAF tick:
        if (initialBurst > 0)
            spawnBurst(initialBurst);

        last = performance.now();
        rafId = requestAnimationFrame(loop);
    }

    function stop() {
        if (!rafId)
            return;
        cancelAnimationFrame(rafId);
        rafId = null;
    }

    function setRate(n) {
        rate = Math.max(0, Number(n) || 0);
    }

    // Resume clean when tab is visible again
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        if (isTouch) boostFramesLeft = MOBILE_RESUME_BOOST_FRAMES;
        if (!rafId) start();
      }
    });


    return {
        start,
        stop,
        setRate
    };
}
