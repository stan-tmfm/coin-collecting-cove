document.addEventListener('DOMContentLoaded', () => {
    const windSound = document.getElementById('wind-sound');

    // Wait for user interaction before playing sounds
    document.body.addEventListener('click', () => {
        // Start wind sound loop after first interaction
        windSound.play().catch((error) => {
            console.error('Failed to play wind sound:', error);
        });
    });
});

// Save slot data structure
let saveSlots = [
    { id: 1, isData: false, element: null },
    { id: 2, isData: false, element: null },
    { id: 3, isData: false, element: null }
];

// Cinematic slideshow data
const cinematicSlides = [
    { text: "🌊 🌊 🌊.. 𝘵𝘩𝘦 𝘸𝘢𝘷𝘦𝘴 𝘨𝘳𝘰𝘸 𝘭𝘰𝘶𝘥𝘦𝘳.." },
    { text: "It must have been a bad dream, a terribly bad nightmare.." },
    { text: "Where is the boat?.. Where are my friends?.." },
    { text: "Where am 𝘐?.." },
    { text: "..." },
    { text: "What.. What is that in the water?.." },
    { text: "Is that.. 𝘨𝘰𝘭𝘥?.." },
];

let currentSlide = 0;
let canAdvance = true; // Controls whether the player can advance slides
let cinematicTimeout = null; // Tracks the delay timeout

// Initialize save slots
function initializeSaveSlots() {
    const saveMenu = document.querySelector('.save-menu');
    
    // Clear existing slots
    saveMenu.innerHTML = '';

    // Create new slots
    saveSlots.forEach((slot) => {
        const slotElement = document.createElement('div');
        slotElement.className = `save-slot ${slot.isData ? '' : 'empty'}`;
        slotElement.innerHTML = `
            <div class="slot-number">Slot ${slot.id}</div>
            ${!slot.isData ? '<div class="no-data">No Save Data</div>' : ''}
        `;

        // Store reference
        slot.element = slotElement;
        saveMenu.appendChild(slotElement);

        // Add click handler
        slotElement.addEventListener('click', () => handleSlotClick(slot));
    });
}

let isSlotClickable = true;

function handleSlotClick(slot) {
    if (!isSlotClickable) return;
    isSlotClickable = false; // Disable further clicks temporarily

    const windSound = document.getElementById('wind-sound');
        
    setTimeout(() => {
      windSound.currentTime = 0;
      windSound.play().catch((error) => {
        console.error('Failed to play wind sound:', error);
    });
  }, 100);

        startCinematic();
}

    setTimeout(() => {
        isSlotClickable = true; // Re-enable clicks after a delay
    }, 1000); // Adjust delay as needed


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
    
    // Wait 1 second before showing continue button
    setTimeout(() => {
        btn.style.display = 'block';
        btn.style.opacity = '0';
        setTimeout(() => btn.style.opacity = '1', 100);
    }, 1000); // 1 second delay before starting fade-in
    
    // Continue button handler
    btn.addEventListener('click', () => {
        overlay.style.display = 'none';
        document.getElementById('wind-sound').pause();
    });
    
    hideClickPrompt();
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

document.querySelectorAll(".save-slot").forEach(slot => {
    slot.addEventListener("click", () => {
        // Ensure audio is loaded
        windSound.currentTime = 0; // Reset sound to start
        windSound.play().catch(e => console.error("Audio play failed:", e));
    });
});


// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSaveSlots);