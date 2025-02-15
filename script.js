let currentSlotId = null;
let manageMode = false;

let windSoundInitialized = false;

function initializeWindSound() {
    const windSound = document.getElementById('wind-sound');
    
    document.body.addEventListener('click', async (event) => {
        if (windSoundInitialized) return;
        
        // Only play sound if clicking an empty save slot
        const saveSlot = event.target.closest('.save-slot');
        if (!saveSlot || saveSlot.classList.contains('has-data')) return;

        // Don't play if clicking management UI
        if (event.target.closest('.manage-saves-btn')) return;

        try {
            if (windSound.context) await windSound.context.resume();
            await windSound.play();
            windSoundInitialized = true;
        } catch (err) {
            console.error('Sound error:', err);
        }
    }, { once: true });
}

let windSoundTimeout = null;

// Save slot data structure
let saveSlots = [1, 2, 3].map(id => ({
    id,
    data: JSON.parse(localStorage.getItem(`saveSlot${id}`)),
    element: null,
    get isData() { return this.data !== null }
}));

// Cinematic slideshow data
const cinematicSlides = [
    { text: "🌊 🌊 🌊.. 𝘵𝘩𝘦 𝘸𝘢𝘷𝘦𝘴 𝘨𝘳𝘰𝘸 𝘭𝘰𝘶𝘥𝘦𝘳.." },
    { text: "It must have been a bad dream, a terribly bad nightmare.." },
    { text: "Where is the boat?.. Where are my friends?.." },
    { text: "Where am 𝘐?.." },
    { text: "..." },
    { text: "What.. What is that in the water?.." },
    { text: "Is that.. Are those.. 𝘤𝘰𝘪𝘯𝘴?.." },
];

let currentSlide = 0;
let canAdvance = true; // Controls whether the player can advance slides
let cinematicTimeout = null; // Tracks the delay timeout

// Initialize save slots
function initializeSaveSlots() {
    const saveMenu = document.querySelector('.save-menu');
    saveMenu.innerHTML = '';

    saveSlots.forEach((slot) => {
        const slotElement = document.createElement('div');
        // Fix this line (remove duplicate class assignment):
        slotElement.className = `save-slot ${slot.isData ? 'has-data' : 'empty'} ${manageMode ? 'manage-mode' : ''}`;
        
        slotElement.innerHTML = `
            <div class="slot-number">Slot ${slot.id}</div>
            ${slot.isData ? 
                `<div class="slot-data">
                    <div>Coins: ${slot.data.coins}</div>
                    <div>${new Date(slot.data.timestamp).toLocaleDateString()}</div>
                </div>` : 
                '<div class="no-data">No Save Data</div>'}
        `;

        slot.element = slotElement;
        saveMenu.appendChild(slotElement);
        slotElement.addEventListener('click', (e) => {
            if (e.target.closest('.save-slot')) handleSlotClick(slot);
        });
    });
}

let isSlotClickable = true;

function handleSlotClick(slot) {
    if (manageMode) {
        if (slot.isData) {
            if (confirm(`Delete save slot ${slot.id}?`)) {
                document.getElementById('wind-sound').pause();
                localStorage.removeItem(`saveSlot${slot.id}`);
                slot.data = null;
                initializeSaveSlots();
                
                // Reset sound initialization
                windSoundInitialized = false;
                initializeWindSound();
            }
        }
        return;
    }

    if (!isSlotClickable) return;
    isSlotClickable = false;
    currentSlotId = slot.id;

    if (slot.isData) {
        loadGame(slot.data);
    } else {
        startCinematic();
    }

    setTimeout(() => isSlotClickable = true, 1000);
}

function updateSlotDisplay(slot) {
    const element = slot.element;
    element.classList.remove('empty');
    element.querySelector('.no-data')?.remove();
    
    if (!slot.isData) {
        element.innerHTML += '<div class="no-data">No Save Data</div>';
    } else {
        // will add something here later
    }
}

// Cinematic Slideshow Functions
function startCinematic() {
    const windSound = document.getElementById('wind-sound');
    // Ensure sound plays even if initialization missed
    if (windSound.paused) {
        windSound.play().catch(console.error);
    }
    const overlay = document.querySelector('.cinematic-overlay');
    const bars = document.querySelectorAll('.top-bar, .bottom-bar');
    
    // Reset state
    currentSlide = 0;
    canAdvance = false; // Start with advancing disabled
    overlay.style.display = 'block';
    
    // Add skip button
    addSkipButton();

    // Animate bars
        bars.forEach(bar => bar.style.transform = 'scaleY(1)');
        document.querySelector('.slideshow-container').style.opacity = '1';
        showNextSlide();
        
        // Start 3-second delay for first slide
        cinematicTimeout = setTimeout(() => {
            showClickPrompt();
            canAdvance = true; // Enable advancing after delay
        }, 5000);

    // Click handler for advancing slides
    overlay.addEventListener('click', handleCinematicClick);
}

function handleCinematicClick() {
    if (!canAdvance) return;

    const container = document.querySelector('.slideshow-container');
    const currentText = container.querySelector('.lore-text');

    if (cinematicTimeout) clearTimeout(cinematicTimeout);

    canAdvance = false;
    currentText.classList.remove('visible');
    hideClickPrompt();

    setTimeout(() => {
        currentSlide++;
        if (currentSlide < cinematicSlides.length) {
            showNextSlide();
            cinematicTimeout = setTimeout(() => {
                showClickPrompt();
                canAdvance = true;
            }, 5000);
        } else {
            showContinueButton();
        }
    }, 2000);
}


function showNextSlide() {
    const container = document.querySelector('.slideshow-container');
    const slide = container.querySelector('.slide');
    
    slide.innerHTML = `<p class="lore-text">${cinematicSlides[currentSlide].text}</p>`;
    
    // Wait 100ms for DOM update before starting animation
    setTimeout(() => {
        slide.querySelector('.lore-text').classList.add('visible');
    }, 100);
}

// Click Prompt Functions
function hideClickPrompt() {
    const prompt = document.querySelector('.click-prompt');
    prompt.style.opacity = '0';
    // Remove element after transition completes
    setTimeout(() => {
        prompt.style.display = 'none';
    }, 2000);
}

function showContinueButton() {
    const btn = document.querySelector('.continue-btn');
    const overlay = document.querySelector('.cinematic-overlay');
    const skipBtn = document.querySelector('.skip-btn');
    
    // Remove click handler for slides
    overlay.removeEventListener('click', handleCinematicClick);
    
    // Safely remove skip button
    if (skipBtn) skipBtn.remove();
    
    // Show immediately with animation
    btn.style.display = 'block';
    btn.style.opacity = '0';
    
    // Animate fade-in
    setTimeout(() => {
        btn.style.opacity = '1';
    }, 100);

    // Continue button handler
    btn.addEventListener('click', () => {
        overlay.style.display = 'none';
        document.getElementById('wind-sound').pause();
        
        // Create new save data
        const newSave = {
            coins: 0,
            upgrades: {},
            timestamp: Date.now()
        };
        
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(newSave));
        saveSlots.find(s => s.id === currentSlotId).data = newSave;
        initializeSaveSlots();
        startGame();
    });
    
    // Immediately hide click prompt
    const prompt = document.querySelector('.click-prompt');
    if (prompt) {
        prompt.style.display = 'none';
    }
}

// Skip Button Functionality
function addSkipButton() {
    const skipBtn = document.createElement('button');
    skipBtn.className = 'skip-btn';
    skipBtn.textContent = 'Skip';
    skipBtn.addEventListener('click', () => {
        // Clear existing timeouts and force advance
        clearTimeout(cinematicTimeout);
        canAdvance = true;
        currentSlide = cinematicSlides.length - 1;
        handleCinematicClick();
    });
    
    document.querySelector('.cinematic-overlay').appendChild(skipBtn);
}

// Click Prompt Functions
function showClickPrompt() {
    const prompt = document.querySelector('.click-prompt');
    prompt.style.display = 'block';
    setTimeout(() => {
        prompt.style.opacity = '1';
    }, 100);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSaveSlots);

let coinCount = 0;
let gameActive = false;
const beachContainer = document.querySelector('.beach-container');
const coinCounter = document.querySelector('.coin-counter');

function loadGame(saveData) {
    coinCount = saveData.coins;
    startGame();
    coinCounter.textContent = `Coins: ${coinCount}`;
}

function startGame() {
    const windSound = document.getElementById('wind-sound');
    
    // Clear any pending wind sound timeout
    if (windSoundTimeout) {
        clearTimeout(windSoundTimeout);
        windSoundTimeout = null;
    }

    // Stop wind sound
    windSound.pause();
    windSound.currentTime = 0;

    gameActive = true;
    
    document.body.classList.add('game-active');
    document.querySelector('.game-screen').style.display = 'block';
    
    // Clear existing elements
    beachContainer.innerHTML = '';
    document.querySelector('.menu-container').style.display = 'none';
    
    // Start coin spawning
    spawnCoin();
    const spawnInterval = setInterval(() => {
        if (!gameActive) clearInterval(spawnInterval);
        else spawnCoin();
    }, 3000);
}

function spawnCoin() {
    if (!gameActive) return;

    const coin = document.createElement('div');
    coin.className = 'coin';
    
    // Force DOM update before animation
    requestAnimationFrame(() => {
        // Set initial position
        const startX = Math.random() * (beachContainer.offsetWidth - 40);
        coin.style.left = `${startX}px`;
        coin.style.top = `-50px`;
        beachContainer.appendChild(coin);

        // Force layout recalculation
        void coin.offsetHeight;

        // Animate with transition
        coin.style.transition = 'top 1s ease-out, left 1.5s ease-out';
        coin.style.left = `${startX + (Math.random() * 100 - 50)}px`;
        coin.style.top = `${Math.random() * (beachContainer.offsetHeight - 40) + 20}px`;

        // Enable collection after 300ms
        setTimeout(() => {
            coin.classList.add('collectable');
            addHoverEffect(coin);
        }, 100);
    });
}

function addHoverEffect(coin) {
    let collected = false;
    
   function collectCoin() {
    if (collected) return;
    collected = true;

    const coinSound = document.getElementById('coin-sound').cloneNode();
    coinSound.volume = 0.3;
    coinSound.play().catch(console.error);
    
    // Update counter
    coinCount++;
    coinCounter.textContent = `Coins: ${coinCount}`;
    
    // Animate collection
    coin.style.transform = 'scale(2) translateY(-20px)';
    coin.style.opacity = '0';
    
    // Remove after animation
    setTimeout(() => coin.remove(), 500);
    
    // THEN add the save code
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`));
    saveData.coins = coinCount;
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
    
    // Update slot display
    const slot = saveSlots.find(s => s.id === currentSlotId);
    if (slot?.element) {
        slot.element.querySelector('.slot-data').innerHTML = `
            <div>Coins: ${saveData.coins}</div>
            <div>${new Date(saveData.timestamp).toLocaleDateString()}</div>
        `;
    }
}

    // Desktop hover
    coin.addEventListener('mouseenter', collectCoin);
    
    // Mobile touch
    coin.addEventListener('touchstart', (e) => {
        e.preventDefault();
        collectCoin();
    });
}

// Mobile hover simulation
beachContainer.addEventListener('touchmove', (e) => {
    if (!gameActive) return;
    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    
    elements.forEach(element => {
        if (element.classList.contains('coin')) {
            element.dispatchEvent(new Event('mouseenter'));
        }
    });
});

function resetGame() {
    const windSound = document.getElementById('wind-sound');
    gameActive = false;
    windSound.pause();
    windSound.currentTime = 0;

    coinCount = 0;
    document.body.classList.remove('game-active');
    document.querySelector('.game-screen').style.display = 'none';
    beachContainer.innerHTML = '';
    coinCounter.textContent = 'Coins: 0';
    document.querySelector('.menu-container').style.display = 'flex';
}

document.querySelector('.manage-saves-btn').textContent = 'Manage Save Slots';
document.querySelector('.manage-saves-btn').addEventListener('click', () => {
    manageMode = !manageMode;
    document.querySelectorAll('.save-slot').forEach(slot => {
        slot.classList.toggle('manage-mode', manageMode);
    });
    if (!manageMode) initializeSaveSlots();
});