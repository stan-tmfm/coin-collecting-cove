const merchantDialogues = {
    introduction: {
        id: 'intro',
        speaker: "merchant",
        text: [
            "Ah, [Player]! Curious about anything?<br>", 
            "Ask me, the Magnificent Merchant, anything and I'll give you an answer.<br>", 
            "I'll even give you some coins in return because I'm so nice!"
        ],
        options: [
            {
    id: 1,
    question: "What is this place?",
    response: {
        speaker: "merchant",
        lines: [
            {speaker: "player", text: "I washed up here after.. well honestly I don't remember what happened. Where exactly am I and what is this place?"},
            {speaker: "merchant", text: "This island is by no means ordinary, and I can't expect you to understand this place just by taking my words."},
            {speaker: "merchant", text: "To be frank, I'm just as clueless to how you got here as you are, but I'm glad you did."},
            {speaker: "player", text: "Ok but what is this place though? I still don't understand what's going on."},
            {speaker: "merchant", text: "As I said, I can't expect you to understand this place just by taking my words."},
            {speaker: "merchant", text: "This island has a rich history and it's impossible to exactly describe this island to an outsider."},
            {speaker: "player", text: "What about this island's history is so rich? Why is it so hard for you to just tell me where I am, or how I can at least get back home?"},
            {speaker: "merchant", text: "I'm afraid it's not that simple.."},
            {speaker: "merchant", text: "The cove has chosen you, so I wouldn't think about going back \"home\" any time soon."},
            {speaker: "player", text: "???"}
        ]
    },
    reward: 25,
    completed: false
},
            {
    id: 2,
    question: "Who are you really?",
    response: {
        speaker: "merchant",
        lines: [
            {speaker: "player", text: "I know you call yourself the Magnificent Merchant, but who are you really?"},
            {speaker: "merchant", text: "Why, what do you mean? I am the Magnificent Merchant, it's that simple really."},
            {speaker: "player", text: "No but I mean like, where did you come from? What is your origin story?"},
            {speaker: "merchant", text: "I was born on this island many years ago. I never knew my parents, so I had to raise myself on this island, alone."},
            {speaker: "merchant", text: "There used to be a thriving community on this island, and my job was being a common merchantman."},
	    {speaker: "merchant", text: "I wasn't respected very much, and I was quite poor because my sales were failing."},
	    {speaker: "merchant", text: "That was until one day, while going out for a jog, I discovered coins flowing in from a nearby cove."},
	    {speaker: "merchant", text: "I stared at the coins and started picking them up, and then more coins came, and more, and more."},
	    {speaker: "merchant", text: "But then suddenly the coins stopped coming, and.. I don't remember what happened next.."},
            {speaker: "player", text: "What do you mean you don't remember what happened next???"},
            {speaker: "merchant", text: "All I remember is that the coins stopped coming and.. next thing I know I'm still at the same cove but the area looks different."},
            {speaker: "merchant", text: "I look around the area, and the entire community of people is gone. Extinct. I was the only person on the island."},
	    {speaker: "merchant", text: "So I came back to this cove, and made it my new living space."},
            {speaker: "merchant", text: "Then you showed up."},
	    {speaker: "player", text: "..."},

        ]
    },
    reward: 25000, // reward is so high for testing purposes
    completed: false
},
            {
    id: 3,
    question: "Why do the coins keep appearing?",
    response: {
        speaker: "merchant",
        lines: [
            {speaker: "player", text: "Where are all these coins coming from?"},
            {speaker: "merchant", text: "The Coin Cove is a very mysterious place, and it'd be hard to exactly tell you how it works."},
            {speaker: "merchant", text: "Just know that I am able to use my magnificent magic to control the flow of these coins, though I require coins to do so in the first place."},
            {speaker: "player", text: "What the hell are you talking about??? What do you mean magic???"},
            {speaker: "merchant", text: "[Player], it would be too hard to explain what I mean when I say magic, but you should know that I have a powerful connection to this cove."},
            {speaker: "player", text: "What so is the cove a living being or something??? Why are you speaking in riddles???"},
            {speaker: "merchant", text: "You will learn more about this island in due time, if you just keep collecting coins."},
            {speaker: "merchant", text: "Everyone loves collecting coins, and you should too."},
	    {speaker: "player", text: "But where are the coins coming from.."},
	    {speaker: "merchant", text: "As I have said, that is something too difficult for me to explain at the moment."},
	    {speaker: "player", text: "..."},
        ]
    },
    reward: 25,
    completed: false
},
        ]
    }
};



function showDialogue() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const playerName = saveData.playerName || "Traveler";

    const container = document.createElement('div');
    container.className = 'dialogue-container';
    container.innerHTML = `
        <div class="dialogue-box">
            <!-- Merchant name plate only for merchant dialogue -->
            ${currentDialogue.speaker === 'merchant' ? 
                `<div class="speaker-name merchant-name">Magnificent Merchant</div>` : ''}
            <div class="merchant-message">${currentDialogue.text.join('<br>').replace(/\[Player\]/g, playerName)}</div>
            <div class="dialogue-options"></div>
            <div class="replay-container"></div>
            <div class="dialogue-controls">
                <button class="cancel-dialogue-btn">Cancel</button>
            </div>
        </div>
    `;

    const optionsContainer = container.querySelector('.dialogue-options');
    merchantDialogues.introduction.options.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = `dialogue-option ${option.completed ? 'completed' : ''}`;
        optionElement.innerHTML = `
            ${option.question}
            ${!option.completed ? `<span class="reward-indicator">(+${option.reward} <img src="Images/coin.png" class="coin-icon">)</span>` : ''}
        `;

        // Add the "Ask Again" button if the option is completed
        if (option.completed) {
            const askAgainButton = document.createElement('button');
            askAgainButton.className = 'ask-again-btn';
            askAgainButton.textContent = '↻ Ask Again';
            askAgainButton.addEventListener('click', () => {
                handleDialogueChoice(option, optionElement);
            });
            optionElement.appendChild(askAgainButton);
        }

        // Add click handler for incomplete options
        if (!option.completed) {
            optionElement.addEventListener('click', () => handleDialogueChoice(option, optionElement));
        }

        optionsContainer.appendChild(optionElement);
    });

    // Add close handlers
    container.addEventListener('click', (e) => {
        if (e.target === container) closeDialogue();
    });

    document.addEventListener('keydown', handleDialogueEscape);
    container.querySelector('.cancel-dialogue-btn').addEventListener('click', closeDialogue);

    document.body.appendChild(container);
    container.style.display = 'flex';
}

function handleDialogueEscape(e) {
    if (e.key === 'Escape') {
        closeDialogue();
    }
}

function closeDialogue() {
    const container = document.querySelector('.dialogue-container');
    if (container) {
        document.removeEventListener('keydown', handleDialogueEscape);
        container.remove();
    }
}

function handleDialogueChoice(option, element) {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    if (!saveData.playerName) {
        showNameModal();
        return; // Exit if the player hasn't set a name
    }

    // Set a flag to indicate the player has talked to the merchant
    saveData.hasTalkedToMerchant = true;
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

    const dialogueBox = document.querySelector('.dialogue-box');
    let currentDialoguePart = 0; // Track the current part of the dialogue

    // Function to show the current part of the dialogue
       const showDialoguePart = () => {
        const currentLine = option.response.lines[currentDialoguePart];
        const playerName = saveData.playerName || "Traveler";
        
        const speakerName = currentLine.speaker === 'merchant' 
            ? '<div class="speaker-name merchant-name">Magnificent Merchant</div>'
            : `<div class="speaker-name player-name">${playerName}</div>`;

        const responseHTML = `
            ${speakerName}
            <div class="merchant-message">
                ${currentLine.text.replace(/\[Player\]/g, playerName)}
            </div>
            <div class="dialogue-controls">
                <button class="merchant-continue-btn">Continue</button>
            </div>
        `;

        // Update the dialogue box
        dialogueBox.innerHTML = responseHTML;

        // Add continue handler
        const continueBtn = dialogueBox.querySelector('.merchant-continue-btn');
        continueBtn.addEventListener('click', () => {
            currentDialoguePart++;
            if (currentDialoguePart < option.response.lines.length) {
                showDialoguePart();
            } else {
                if (!option.completed) {
                    coinCount += option.reward;
                    updateCoinDisplay();
                    option.completed = true;
                    saveDialogueProgress();
                }
                closeDialogue();
                showDialogue();
		updateGoalDisplay();
            }
        });
    };

    showDialoguePart();
}

function saveDialogueProgress() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    saveData.dialogues = merchantDialogues.introduction.options.map(option => ({
        id: option.id,
        completed: option.completed
    }));
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
}

function loadDialogueProgress() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    if (saveData.dialogues) {
        merchantDialogues.introduction.options.forEach(option => {
            const saved = saveData.dialogues.find(d => d.id === option.id);
            if (saved) option.completed = saved.completed;
        });
    }
}

function promptPlayerName() {
    const name = prompt("What should I call you, traveler?");
    if (name) {
        localStorage.setItem(`playerName_${currentSlotId}`, name); // Save the name with the current slot ID
        return name;
    }
    return "Traveler"; // Default name if the player doesn't enter one
}

function showNameModal() {
    const nameModal = document.createElement('div');
    nameModal.className = 'name-modal-overlay';
    nameModal.innerHTML = `
        <div class="name-modal">
            <h2>What should I call you, traveler?</h2>
            <br>
            <input type="text" id="player-name-input" placeholder="Enter your name">
            <button id="confirm-name-btn">Confirm</button>
        </div>
    `;

    document.body.appendChild(nameModal);

    // Get references to elements
    const input = nameModal.querySelector('#player-name-input');
    const confirmBtn = nameModal.querySelector('#confirm-name-btn');

    // Add click handler
    confirmBtn.addEventListener('click', handleNameConfirm);

    // Add Enter key handler
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleNameConfirm();
        }
    });

    // Focus the input immediately
    input.focus();

    function handleNameConfirm() {
        const newName = input.value.trim();
        if (newName) {
            const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
            saveData.playerName = newName;
            localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
            
            nameModal.remove();
            currentDialogue = merchantDialogues.introduction;
            loadDialogueProgress();
            showDialogue();
        } else {
            alert("Please enter a valid name.");
        }
    }
}

const upgrades = {
    1: {
        id: 1,
        upgName: "Faster Coins",
        upgDesc: "Give coins to the Merchant and he will use his powers to make the Cove produce coins faster!",
        upgBenefits: "1.1x Coin Spawnrate per level",
        baseCost: 10,
        maxLevel: 10,
        currentLevel: 0,
        scaling: (baseCost, level) => (baseCost + 2 * level) * Math.pow(1.1, level)
    },
    2: {
        id: 2,
        upgName: "Special Coins",
        upgDesc: "Unlock the magical power of Special Coins, a new special type of coin that can be used to buy cool things!",
        upgBenefits: "Unlocks Special Coins",
        baseCost: 100,
        maxLevel: 1,
        currentLevel: 0,
        scaling: (baseCost) => baseCost,
        mysterious: true // New property for styling
    }
};

document.getElementById('change-name-btn').addEventListener('click', changePlayerName);

function changePlayerName() {
    const newName = document.getElementById('player-name-input').value.trim();
    if (newName) {
        // Save the player's name under the current save slot
        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
        saveData.playerName = newName;
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
        alert(`Your name has been updated to ${newName}!`);
    } else {
        alert("Please enter a valid name.");
    }
}

// Pre-fill the input field with the current name when the settings modal opens
document.querySelector('.settings-btn').addEventListener('click', () => {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const nameChangeSection = document.querySelector('.name-change-section');
    nameChangeSection.style.display = saveData.playerName ? 'block' : 'none';

    // Pre-fill the input field
    document.getElementById('player-name-input').value = saveData.playerName || "Traveler";
});

let currentGoal = 10;
let merchantCinematicShown = false;
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
        slotElement.className = `save-slot ${slot.data ? 'has-data' : 'empty'} ${manageMode ? 'manage-mode' : ''}`;
        
        // Safely check merchant status
        const hasMerchant = slot.data?.merchantCinematicShown || false;
        const timestamp = slot.data?.timestamp ? new Date(slot.data.timestamp).toLocaleDateString() : 'No date';
        
        slotElement.innerHTML = `
            <div class="slot-number">Slot ${slot.id}</div>
            ${slot.data ? `
                <div class="slot-data">
                    <div>Coins: ${slot.data.coins || 0}</div>
                    ${hasMerchant ? '<div class="merchant-unlocked">Merchant Unlocked</div>' : ''}
                    <div>Created on: ${timestamp}</div>
                </div>` : 
                '<div class="no-data">No Save Data</div>'}
        `;

        // Reattach click handler
        slotElement.addEventListener('click', (e) => {
            if (e.target.closest('.save-slot')) handleSlotClick(slot);
        });

        slot.element = slotElement;
        saveMenu.appendChild(slotElement);
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
	    merchantCinematicShown: false,
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
    // Get the name from the save slot's data
    const playerName = saveData.playerName || "Traveler"; // Corrected
    console.log(`Welcome back, ${playerName}!`);
    const fullSaveData = {
        coins: 0,
        upgrades: { 1: { level: 0 } }, // Default structure
        merchantCinematicShown: false,
        timestamp: Date.now(),
        ...saveData
    };

    // Initialize upgrades data
    if (!fullSaveData.upgrades) fullSaveData.upgrades = {};
    if (!fullSaveData.upgrades[1]) fullSaveData.upgrades[1] = { level: 0 };

    // Update storage with normalized data
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(fullSaveData));

    // Load state
    coinCount = fullSaveData.coins;
    merchantCinematicShown = fullSaveData.merchantCinematicShown;

  if (merchantCinematicShown) currentGoal = 10;

    // Update UI
    coinCounter.textContent = `Coins: ${coinCount}`;
    document.querySelector('.merchant-btn').style.display = merchantCinematicShown ? 'block' : 'none';

    // Update slot data reference
    const slot = saveSlots.find(s => s.id === currentSlotId);
    if (slot) slot.data = fullSaveData;

 updateGoalDisplay();
 loadDialogueProgress();
   startGame();
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

    if (musicManager.isMusicOn) {
        musicManager.playRandom();
    }
    
    document.body.classList.add('game-active');
    document.querySelector('.game-screen').style.display = 'block';
    
    // Clear existing elements
    beachContainer.innerHTML = '';
    document.querySelector('.menu-container').style.display = 'none';
    
    // Clear any existing intervals
    if (window.spawnInterval) {
        clearInterval(window.spawnInterval);
    }
    
    // Start coin spawning
    spawnCoin();
    window.spawnInterval = setInterval(() => {
        if (!gameActive) clearInterval(window.spawnInterval);
        else spawnCoin();
    }, 3000);

    // Show goal message and merchant button
    updateGoalDisplay();
    document.querySelector('.merchant-btn').style.display = merchantCinematicShown ? 'block' : 'none';
}

function spawnCoin() {
    if (!gameActive) return;
    
    // Get current spawn rate
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const upgradeLevel = saveData.upgrades?.[1]?.level || 0;
    const spawnRateMultiplier = Math.pow(0.9, upgradeLevel);

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
    
  // Update counter with integer values
     coinCount = Math.round(coinCount + 1);
     coinCounter.textContent = `Coins: ${coinCount}`;

  // Update save data PROPERLY
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const updatedData = {
        ...saveData,
        coins: coinCount,
        merchantCinematicShown: merchantCinematicShown,
        timestamp: saveData.timestamp || Date.now()
    };
    
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(updatedData));
    
    // Update goal display
    updateGoalDisplay();
    
    // Animate collection
    coin.style.transform = 'scale(2) translateY(-20px)';
    coin.style.opacity = '0';
    
    // Remove after animation
    setTimeout(() => coin.remove(), 500);
    
     // Update slot display
    const slot = saveSlots.find(s => s.id === currentSlotId);
    if (slot) {
        slot.data = updatedData;
        initializeSaveSlots(); // Refresh UI
    }
    if (coinCount < currentGoal || !merchantCinematicShown) {
              updateGoalDisplay();
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

    musicManager.audio.pause();

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

// Music System
const musicManager = {
    audio: new Audio(),
    tracks: [
        'DEAF KEV - Invincible  Glitch Hop  NCS - Copyright Free Music.mp3',
        'Different Heaven & EH!DE - My Heart  Drumstep  NCS - Copyright Free Music.mp3',
        'Elektronomia - Sky High  Progressive House  NCS - Copyright Free Music.mp3',
        'Disfigure - Blank  Melodic Dubstep  NCS - Copyright Free Music.mp3',
        'Different Heaven - Nekozilla  Electro  NCS - Copyright Free Music.mp3',
        'Jim Yosef - Firefly  Progressive House  NCS - Copyright Free Music.mp3',
        'Desmeon - Hellcat  Drumstep  NCS - Copyright Free Music.mp3',
        'JPB - High  Trap  NCS - Copyright Free Music.mp3',
        'K-391 - Earth  Drumstep  NCS - Copyright Free Music.mp3',
        'Jim Yosef & Anna Yvette - Linked  House  NCS - Copyright Free Music.mp3',
        'LFZ - Popsicle  House  NCS - Copyright Free Music.mp3',
        'Jim Yosef - Eclipse  House  NCS - Copyright Free Music.mp3',
        'Electro-Light - Symbolism  Trap  NCS - Copyright Free Music.mp3',
        'Cartoon, Jéja - On & On (feat. Daniel Levi)  Electronic Pop  NCS - Copyright Free Music.mp3',
        'Julius Dreisig & Zeus X Crona - Invisible  Trap  NCS - Copyright Free Music.mp3',
        'Killercats - Tell Me (feat. Alex Skrindo)  Future Bass  NCS - Copyright Free Music.mp3',
        'Distrion & Alex Skrindo - Entropy  House  NCS - Copyright Free Music.mp3',
        'Distrion & Electro-Light - Rubik  House  NCS - Copyright Free Music.mp3',
        'Lensko - Lets Go!  House  NCS - Copyright Free Music.mp3',
        'Kovan & Electro-Light - Skyline  House  NCS - Copyright Free Music.mp3',
    ],
    currentTrackIndex: 0,
    shuffledTracks: [],
    isMusicOn: localStorage.getItem('musicEnabled') !== 'false',
    
    init() {
        this.shuffleTracks();
        this.audio.addEventListener('ended', () => this.playNext());
        this.updateToggleButton();
        
        // Load music state from localStorage
        if(this.isMusicOn) this.audio.volume = 0.5;
    },

    shuffleTracks() {
        this.shuffledTracks = [...this.tracks].sort(() => Math.random() - 0.5);
    },

    playRandom() {
        if(!this.shuffledTracks.length) this.shuffleTracks();
        this.currentTrackIndex = 0;
        this.playCurrent();
    },

   playCurrent() {
      if (!this.isMusicOn) return;
    
         const track = this.shuffledTracks[this.currentTrackIndex];
         this.audio.src = `Sounds/${track}`;
      this.audio.play().catch(() => {});
    
         const songTitle = track.replace('.mp3', '');
         document.getElementById('now-playing').textContent = `🎵 Now Playing - ${songTitle}`;
    },

    playNext() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.shuffledTracks.length;
        this.playCurrent();
    },

    playPrev() {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.shuffledTracks.length) % 
                                this.shuffledTracks.length;
        this.playCurrent();
    },

    toggleMusic() {
        this.isMusicOn = !this.isMusicOn;
        localStorage.setItem('musicEnabled', this.isMusicOn);
        this.updateToggleButton();
        
        if(this.isMusicOn) {
            this.playCurrent();
        } else {
            this.audio.pause();
        }
    },

    updateToggleButton() {
        const btn = document.getElementById('music-toggle');
        btn.textContent = `Music: ${this.isMusicOn ? 'ON' : 'OFF'}`;
        btn.classList.toggle('off', !this.isMusicOn);
    }
};

// Initialize music when DOM loads
document.addEventListener('DOMContentLoaded', () => musicManager.init());

// Settings functionality
const settingsBtn = document.querySelector('.settings-btn');
const settingsModal = document.querySelector('.settings-modal');
const closeSettingsBtn = document.querySelector('.close-settings-btn');
document.querySelector('.shuffle-btn').addEventListener('click', () => {
    musicManager.shuffleTracks();
    musicManager.currentTrackIndex = -1;
    musicManager.playNext();
});

document.querySelector('.prev-btn').addEventListener('click', () => musicManager.playPrev());
document.querySelector('.next-btn').addEventListener('click', () => musicManager.playNext());
document.getElementById('music-toggle').addEventListener('click', () => musicManager.toggleMusic());

// Open settings
settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
});

// Close settings
closeSettingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

// Close when clicking outside
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});

// Close when pressing esc
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal.style.display === 'flex') {
        settingsModal.style.display = 'none';
    }
});

function updateGoalDisplay() {
    const goalMessage = document.querySelector('.goal-message');
    const allCompleted = merchantDialogues.introduction.options.every(opt => opt.completed);
    
    // Always check completion status first
    if (allCompleted) {
        goalMessage.style.display = 'block';
        goalMessage.innerHTML = '"Guess I\'ll keep collecting coins for now.."';
        return;
    }

    // Existing logic
    if (merchantCinematicShown) {
        goalMessage.style.display = 'block';
        goalMessage.innerHTML = '"Maybe I should go talk to the merchant..<br>he can answer some of my questions.."';
        return;
    }

    if (coinCount >= currentGoal) {
        startMerchantCinematic();
        goalMessage.style.display = 'none';
    } else {
        goalMessage.style.display = 'block';
        goalMessage.innerHTML = coinCount === 0 
            ? `"Hmm.. I wonder what would happen<br>if I collected some of these coins..."`
            : `"Hmm.. I wonder what would happen<br>if I collected some of these coins..."`;
    }
}

function allDialoguesCompleted() {
    return merchantDialogues.introduction.options.every(option => option.completed);
}

function startMerchantCinematic() {
    if (merchantCinematicShown) return;

    // Save FIRST before any cinematic UI changes
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const updatedData = {
        ...saveData,
        merchantCinematicShown: true,
        coins: coinCount, // <-- Capture current coins
        timestamp: Date.now() // <-- Always update timestamp
    };

    // Commit save IMMEDIATELY
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(updatedData));
    
    // Update local state
    merchantCinematicShown = true;
    const slot = saveSlots.find(s => s.id === currentSlotId);
    if (slot) slot.data = updatedData;

    const overlay = document.querySelector('.cinematic-overlay');
    const continueBtn = document.querySelector('.continue-btn');
    const bars = document.querySelectorAll('.top-bar, .bottom-bar');
    
    // Reset cinematic elements
    continueBtn.style.display = 'none';
    overlay.style.display = 'block';
    
    // Add skip button
    addSkipButton();

    // Animate bars
    bars.forEach(bar => bar.style.transform = 'scaleY(1)');
    document.querySelector('.slideshow-container').style.opacity = '1';

    // Merchant-specific slides
    const merchantSlides = [
        { text: "💨💨💨..𝘛𝘩𝘦 𝘸𝘪𝘯𝘥 𝘴𝘶𝘥𝘥𝘦𝘯𝘭𝘺 𝘱𝘪𝘤𝘬𝘴 𝘶𝘱.." },
        { text: "What.. What is that in the distance?.." },
        { text: "Wait.. 𝘞𝘩𝘰 is that in the distance?.." },
        { text: "\"Greetings, castaway!\" says a mysterious figure.." },
        { text: "\"I see you've found my Cove!\"" },
	{ text: "Startled, I ask, \"Who.. Who are you?..\"" },
        { text: "\"Why, I am of course the Magnificent Merchant!\"" },
        { text: "..." },
        { text: "\"It seems your presence has revitalized the Coin Cove back to full power!\"" },
        { text: "..." },
        { text: "\"You're probably a bit confused right now, but all that matters is that you've saved my business.\"" },
        { text: "\"Keep collecting those coins and I can help both of us achieve the things we want!\"" },
    ];

    // Store original slides and restore after cinematic
    const originalSlides = [...cinematicSlides];
    cinematicSlides.length = 0;
    cinematicSlides.push(...merchantSlides);

    // Reset cinematic state
    currentSlide = 0;
    canAdvance = false;
    showNextSlide();
    
    // Start initial delay
    cinematicTimeout = setTimeout(() => {
        showClickPrompt();
        canAdvance = true;
    }, 5000);

    // Click handler
    const clickHandler = () => {
        if (!canAdvance) return;
        handleCinematicClick();
    };

    overlay.addEventListener('click', clickHandler);
    
    // Final continue handler
    continueBtn.onclick = () => {
        // Restore original slides
        cinematicSlides.length = 0;
        cinematicSlides.push(...originalSlides);
        
        overlay.removeEventListener('click', clickHandler);
        overlay.style.display = 'none';
        gameActive = true;
        document.querySelector('.merchant-btn').style.display = 'block';
        
        // Reset spawning
        if (window.spawnInterval) clearInterval(window.spawnInterval);
        window.spawnInterval = setInterval(spawnCoin, 3000);
    };

    // Audio handling
    const windSound = document.getElementById('wind-sound');
    windSound.play();
    musicManager.audio.pause();
}

window.addEventListener('beforeunload', () => {
    if (currentSlotId) {
        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
        const updatedData = {
            ...saveData,
            coins: coinCount,
            merchantCinematicShown: merchantCinematicShown,
            timestamp: Date.now()
        };
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(updatedData));
    }
});

function showMerchantUI() {
    const modal = document.querySelector('.merchant-modal');
    modal.style.display = 'flex';
    
    // Force immediate update of all elements
    updateCoinDisplay();
    updateMerchantDisplay();
    applyUpgradeEffects();
    
    document.addEventListener('keydown', handleMerchantEscape);
    document.querySelector('.merchant-modal').addEventListener('click', handleMerchantClickOutside);
}

function updateMerchantDisplay() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const container = document.querySelector('.upgrades-container');
    if (!container) return;

    container.innerHTML = '';

    Object.values(upgrades).forEach(upg => {
        const upgradeData = saveData.upgrades?.[upg.id] || { level: 0 };
        const currentLevel = upgradeData.level;
        const isLocked = upg.mysterious && currentLevel === 0 && coinCount < upg.baseCost;
        const isMaxed = currentLevel >= upg.maxLevel;

        // Calculate cost
        const cost = upg.mysterious ? upg.baseCost : 
            Math.round(upg.scaling(upg.baseCost, currentLevel));
        const canAfford = Math.round(coinCount) >= cost;

        // Determine the status text
        let statusText;
        if (isMaxed) {
            statusText = upg.maxLevel === 1 ? `${upg.upgName} - PURCHASED` : `${upg.upgName} - MAXED`;
        } else {
            statusText = upg.maxLevel > 1 ? `${upg.upgName} (Level ${currentLevel}/${upg.maxLevel})` : upg.upgName;
        }

        const upgradeHTML = `
            <div class="upgrade-item ${isLocked ? 'mysterious-upgrade' : ''}">
                <div class="upgrade-header">
                    <h3>${isLocked ? '???' : statusText}</h3>
                    ${!isMaxed ? `
                        <button class="buy-btn" 
                            data-upgrade-id="${upg.id}"
                            ${!canAfford ? 'disabled' : ''}>
                            Cost: ${isLocked ? `${upg.baseCost}` : `${cost}`} Coins
                        </button>
                    ` : ''}
                </div>
                ${isLocked ? `
                    <p>???</p>
                    <p><em>???</em></p>
                ` : `
                    <p>${upg.upgDesc}</p>
                `}
            </div>
        `;
        container.innerHTML += upgradeHTML;
    });

    // Rebind event listeners
    container.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const upgradeId = parseInt(this.dataset.upgradeId);
            purchaseUpgrade(upgradeId);
        });
    });

    updateEffectsDisplay();
}

function purchaseUpgrade(upgradeId) {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const upg = upgrades[upgradeId];
    if (!upg) return;

    const upgradeData = saveData.upgrades[upgradeId] || { level: 0 };
    const currentLevel = upgradeData.level;
    const cost = Math.round(upg.scaling(upg.baseCost, currentLevel));

    if (currentLevel < upg.maxLevel && Math.round(coinCount) >= cost) {
        coinCount -= cost;
        coinCount = Math.round(coinCount);
        upgradeData.level = currentLevel + 1;
        saveData.upgrades[upgradeId] = upgradeData;
        
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify({
            ...saveData,
            coins: coinCount,
            upgrades: saveData.upgrades
        }));
        
        updateCoinDisplay();
        updateMerchantDisplay();
        applyUpgradeEffects();
    }
}

function updateEffectsDisplay() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const upgradeLevel = saveData.upgrades?.[1]?.level || 0;
    
    // Round to 1 decimal place
    const coinsPerSecond = (1000 / (3000 * Math.pow(0.9, upgradeLevel))).toFixed(1);
    
    document.querySelector('.current-effects').innerHTML = `
        <strong>Active Effects:</strong>
        <div>• Coin Spawn Rate: ${coinsPerSecond}/sec</div>
    `;
}

function applyUpgradeEffects() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const speedUpgrade = saveData.upgrades?.[1] || { level: 0 };
    
    // Only adjust spawn rate for the speed upgrade
    const spawnRateMultiplier = Math.pow(0.9, speedUpgrade.level);
    const newInterval = 3000 * spawnRateMultiplier;
    
    clearInterval(window.spawnInterval);
    window.spawnInterval = setInterval(() => {
        if (gameActive) spawnCoin();
    }, newInterval);
}

document.querySelector('.merchant-btn').addEventListener('click', () => {
    showMerchantUI();
    applyUpgradeEffects(); // Ensure effects are current
  document.addEventListener('keydown', handleMerchantEscape);
    document.querySelector('.merchant-modal').addEventListener('click', handleMerchantClickOutside);
});

document.querySelector('.close-merchant-btn').addEventListener('click', () => {
    document.querySelector('.merchant-modal').style.display = 'none';
});

function updateCoinDisplay() {
    // Always update both displays
    const currentCoins = Math.round(coinCount);
    
    // Update game UI
    document.querySelector('.coin-counter').textContent = `Coins: ${currentCoins}`;
    
    // Update merchant UI
    const merchantCoinDisplay = document.getElementById('merchant-coin-count');
    if (merchantCoinDisplay) {
        merchantCoinDisplay.textContent = currentCoins;
    }
    
    // Force merchant refresh if open
    if (document.querySelector('.merchant-modal').style.display === 'flex') {
        updateMerchantDisplay();
    }
}
function handleMerchantEscape(e) {
    if (e.key === 'Escape') {
        closeMerchantUI();
    }
}

function handleMerchantClickOutside(e) {
    if (e.target.classList.contains('merchant-modal')) {
        closeMerchantUI();
    }
}

function closeMerchantUI() {
    const modal = document.querySelector('.merchant-modal');
    modal.style.display = 'none';
    document.removeEventListener('keydown', handleMerchantEscape);
    modal.removeEventListener('click', handleMerchantClickOutside);
}

// Update close button handler
document.querySelector('.close-merchant-btn').addEventListener('click', closeMerchantUI);

document.querySelector('.talk-to-merchant-btn').addEventListener('click', () => {
    // Get the current save data
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    
    // Check if the player has a name
    if (!saveData.playerName) {
        showNameModal(); // Show name modal if no name exists
    } else {
        currentDialogue = merchantDialogues.introduction;
        loadDialogueProgress();
        showDialogue();
    }
});
