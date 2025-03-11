const merchantDialogues = {
    introduction: {
        id: 'intro',
        speaker: "merchant",
        text: [
            "Ah, [Player]! Curious about anything?<br>",
            "Ask me, the Magnificent Merchant, anything and I'll give you an answer.<br>",
            "I'll even give you some coins in return because I'm so nice!"
        ],
        options: [{
                id: 1,
                question: "What is this place?",
                response: {
                    speaker: "merchant",
                    lines: [{
                            speaker: "player",
                            text: "I washed up here after.. well honestly I don't remember what happened. Where exactly am I and what is this place?"
                        }, {
                            speaker: "merchant",
                            text: "This island is by no means ordinary, and I can't expect you to understand this place just by taking my words."
                        }, {
                            speaker: "merchant",
                            text: "To be frank, I'm just as clueless to how you got here as you are, but I'm glad you did."
                        }, {
                            speaker: "player",
                            text: "Ok but what is this place though? I still don't understand what's going on."
                        }, {
                            speaker: "merchant",
                            text: "As I said, I can't expect you to understand this place just by taking my words."
                        }, {
                            speaker: "merchant",
                            text: "This island has a rich history and it's impossible to exactly describe this island to an outsider."
                        }, {
                            speaker: "player",
                            text: "What about this island's history is so rich? Why is it so hard for you to just tell me where I am, or how I can at least get back home?"
                        }, {
                            speaker: "merchant",
                            text: "I'm afraid it's not that simple.."
                        }, {
                            speaker: "merchant",
                            text: "The Cove has chosen you, so I wouldn't think about going back \"home\" any time soon."
                        }, {
                            speaker: "player",
                            text: "???"
                        }
                    ]
                },
                reward: 25,
                completed: false
            }, {
                id: 2,
                question: "Who are you really?",
                response: {
                    speaker: "merchant",
                    lines: [{
                            speaker: "player",
                            text: "I know you call yourself the Magnificent Merchant, but who are you really?"
                        }, {
                            speaker: "merchant",
                            text: "Why, what do you mean? I am the Magnificent Merchant, it's that simple really."
                        }, {
                            speaker: "player",
                            text: "No but I mean like, where did you come from? What is your origin story?"
                        }, {
                            speaker: "merchant",
                            text: "I was born on this island many years ago. I never knew my parents, so I had to raise myself on this island, alone."
                        }, {
                            speaker: "merchant",
                            text: "There used to be a thriving community on this island, and my job was being a common merchantman."
                        }, {
                            speaker: "merchant",
                            text: "I wasn't respected very much, and I was quite poor because my sales were failing."
                        }, {
                            speaker: "merchant",
                            text: "That was until one day, while going out for a jog, I discovered coins flowing in from a nearby cove."
                        }, {
                            speaker: "merchant",
                            text: "I stared at the coins and started picking them up, and then more coins came, and more, and more."
                        }, {
                            speaker: "merchant",
                            text: "But then suddenly the coins stopped coming, and.. I don't remember what happened next.."
                        }, {
                            speaker: "player",
                            text: "What do you mean you don't remember what happened next???"
                        }, {
                            speaker: "merchant",
                            text: "All I remember is that the coins stopped coming and.. next thing I know I'm still at the same cove but the area looks different."
                        }, {
                            speaker: "merchant",
                            text: "I look around the area, and the entire community of people is gone. Extinct. I was the only person on the island."
                        }, {
                            speaker: "merchant",
                            text: "So I came back to this Cove, and made it my new living space."
                        }, {
                            speaker: "merchant",
                            text: "Then you showed up."
                        }, {
                            speaker: "player",
                            text: "..."
                        },

                    ]
                },
                reward: 25000, // reward is so high for testing purposes
                completed: false
            }, {
                id: 3,
                question: "Why so many coins?",
                response: {
                    speaker: "merchant",
                    lines: [{
                            speaker: "player",
                            text: "Where are all these coins coming from?"
                        }, {
                            speaker: "merchant",
                            text: "The Coin Cove is a very mysterious place, and it'd be hard to exactly tell you how it works."
                        }, {
                            speaker: "merchant",
                            text: "Just know that I am able to use my magnificent magic to control the flow of these coins, though I require coins to do so in the first place."
                        }, {
                            speaker: "player",
                            text: "What the hell are you talking about??? What do you mean magic???"
                        }, {
                            speaker: "merchant",
                            text: "[Player], it would be too hard to explain what I mean when I say magic, but you should know that I have a powerful connection to this Cove."
                        }, {
                            speaker: "player",
                            text: "What so is the cove a living thing or something??? Why are you speaking in riddles???"
                        }, {
                            speaker: "merchant",
                            text: "You will learn more about this island in due time, if you just keep collecting coins."
                        }, {
                            speaker: "merchant",
                            text: "Everyone loves collecting coins, and you should too."
                        }, {
                            speaker: "player",
                            text: "But where are the coins coming from.."
                        }, {
                            speaker: "merchant",
                            text: "As I have said, that is something too difficult for me to explain at the moment."
                        }, {
                            speaker: "player",
                            text: "..."
                        },
                    ]
                },
                reward: 25,
                completed: false
            }, {
                id: 4,
                hidden: true,
                question: "What are special coins?",
                requirement: (saveData) => (saveData.upgrades?.[2]?.level || 0) >= 1,
                response: {
                    speaker: "merchant",
                    lines: [{
                            speaker: "merchant",
                            text: "Ah, you've discovered the special coins..."
                        }, {
                            speaker: "player",
                            text: "Yes, where are they coming from? Why are they blue?"
                        }, {
                            speaker: "merchant",
                            text: "Well, these coins are very special."
                        }, {
                            speaker: "merchant",
                            text: "These coins are imbued with magical energy, and only those who are wise enough (i.e., have enough XP) can understand the true power they hold."
                        }, {
                            speaker: "merchant",
                            text: "Long ago, many of these special coins were formed in the deep depths where no one has ever been."
                        }, {
                            speaker: "merchant",
                            text: "The Cove can feel your energy residing through each and every coin you pick up, which empowers it, which gives it more energy."
                        }, {
                            speaker: "merchant",
                            text: "You may not realize it now, but each special coin you pick up brings you closer to understand the Cove's true power."
                        }, {
                            speaker: "merchant",
                            text: "The Cove chose you, [Player], because it sensed something special within you."
                        }, {
                            speaker: "merchant",
                            text: "With each coin you collect, you'll come to understand more about why you're here—about why you're meant to be collecting coins here at the Cove."
                        }, {
                            speaker: "player",
                            text: "The Cove is a living thing???"
                        }, {
                            speaker: "player",
                            text: "???"
                        }
                    ]
                },
                reward: 250,
                completed: false
            }
        ]
    }
};

function showDialogue() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const playerName = saveData.playerName || "Traveler";

    // Remove existing dialogue container if it exists
    const existingContainer = document.querySelector('.dialogue-container');
    if (existingContainer)
        existingContainer.remove();

    const container = document.createElement('div');
    container.className = 'dialogue-container';
    container.innerHTML = `
        <div class="dialogue-box">
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
        const requirementMet = option.requirement ? option.requirement(saveData) : true;
        const isMysterious = option.hidden && !requirementMet;

        const optionElement = document.createElement('div');
        optionElement.className = `dialogue-option
            ${option.completed ? 'completed' : ''} 
            ${isMysterious ? 'mysterious' : ''}`;

        // Use the actual question text if the requirement is met, otherwise show "???"
        const questionText = isMysterious ? "???" : option.question;

        optionElement.innerHTML = `
            ${questionText}
            ${!option.completed && requirementMet ? 
`<span class="reward-indicator">(+${option.reward} <img src="Images/coin.png" class="coin-icon">)</span>`
             : ''}
        `;

        // Add ask-again button if completed
        if (option.completed) {
            const askAgainButton = document.createElement('button');
            askAgainButton.className = 'ask-again-btn';
            askAgainButton.textContent = '↻ Ask Again';
            askAgainButton.addEventListener('click', () => handleDialogueChoice(option, optionElement));
            optionElement.appendChild(askAgainButton);
        }

        // Handle clickability
        if (!option.completed) {
            optionElement.style.cursor = requirementMet ? 'pointer' : 'not-allowed';
            optionElement.style.opacity = requirementMet ? 1 : 0.6;
            if (requirementMet) {
                optionElement.addEventListener('click', () => handleDialogueChoice(option, optionElement));
            }
        }

        optionsContainer.appendChild(optionElement);
    });

    // Add close handlers
    container.addEventListener('click', (e) => {
        if (e.target === container)
            closeDialogue();
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

    if (option.requirement && !option.requirement(saveData)) {
        element.classList.add('disabled');
        element.style.pointerEvents = 'none';
        return;
    }

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
                    // ADD THE MISSING REWARD LOGIC HERE
                    coinCount += option.reward;
                    updateCoinDisplay();

                    option.completed = true;
                    saveDialogueProgress();
                    updateGoalDisplay();
                }
                closeDialogue();
                showDialogue();
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
            if (saved)
                option.completed = saved.completed;
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
        upgBenefits: "1.1x Coin Spawn Rate per level",
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
    },
    3: {
        id: 3,
        upgName: "Educated Coins",
        upgDesc: "Make those coins become educated, improving their XP output!",
        upgBenefits: "1.1x XP per level",
        baseCost: 1000,
        maxLevel: 10,
        currentLevel: 0,
        scaling: (baseCost, level) => (baseCost + 2 * level) * Math.pow(1.1, level),
        mysterious: true
    }
};

const specialUpgrades = {
    1: {
        id: 1,
        name: "Wisdom Boost",
        desc: "Increase XP gain by 1.25x per level",
        baseCost: 1,
        levelCap: 10,
        effect: 1.25,
        costIncrement: 1,
        type: "xp"
    },
    2: {
        id: 2,
        name: "Golden Touch",
        desc: "Increase coin value by 1.25x per level",
        baseCost: 1,
        levelCap: 10,
        effect: 1.25,
        costIncrement: 1,
        type: "coinValue"
    },
    3: {
        id: 3,
        name: "Mysterious Power I",
        desc: "Requires Level 100",
        baseCost: 100,
        levelCap: 1,
        effect: 1,
        costIncrement: 0,
        type: "mystery",
        requirement: 100
    },
    4: {
        id: 4,
        name: "Mysterious Power II",
        desc: "Requires Level 100",
        baseCost: 100,
        levelCap: 1,
        effect: 1,
        costIncrement: 0,
        type: "mystery",
        requirement: 100
    },
    5: {
        id: 5,
        name: "Ancient Knowledge I",
        desc: "Requires Level 1000",
        baseCost: 1000,
        levelCap: 1,
        effect: 1,
        costIncrement: 0,
        type: "mystery",
        requirement: 1000
    },
    6: {
        id: 6,
        name: "Ancient Knowledge II",
        desc: "Requires Level 1000",
        baseCost: 1000,
        levelCap: 1,
        effect: 1,
        costIncrement: 0,
        type: "mystery",
        requirement: 1000
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

    document.body.addEventListener('click', async(event) => {
        if (windSoundInitialized)
            return;

        // Only play sound if clicking an empty save slot
        const saveSlot = event.target.closest('.save-slot');
        if (!saveSlot || saveSlot.classList.contains('has-data'))
            return;

        // Don't play if clicking management UI
        if (event.target.closest('.manage-saves-btn'))
            return;

        try {
            if (windSound.context)
                await windSound.context.resume();
            await windSound.play();
            windSoundInitialized = true;
        } catch (err) {
            console.error('Sound error:', err);
        }
    }, {
        once: true
    });
}

let windSoundTimeout = null;

// Save slot data structure
let saveSlots = [1, 2, 3].map(id => ({
        id,
        data: JSON.parse(localStorage.getItem(`saveSlot${id}`)),
        element: null,
        get isData() {
            return this.data !== null
        }
    }));

// Cinematic slideshow data
const cinematicSlides = [{
        text: "🌊 🌊 🌊.. 𝘵𝘩𝘦 𝘸𝘢𝘷𝘦𝘴 𝘨𝘳𝘰𝘸 𝘭𝘰𝘶𝘥𝘦𝘳.."
    }, {
        text: "It must have been a bad dream, a terribly bad nightmare.."
    }, {
        text: "Where is the boat?.. Where are my friends?.."
    }, {
        text: "Where am 𝘐?.."
    }, {
        text: "..."
    }, {
        text: "What.. What is that in the water?.."
    }, {
        text: "Is that.. Are those.. 𝘤𝘰𝘪𝘯𝘴?.."
    },
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

        // Round the displayed coin value
        const displayCoins = slot.data ? Math.round(slot.data.coins || 0) : 0;

        slotElement.innerHTML = `
            <div class="slot-number">Slot ${slot.id}</div>
            ${slot.data ? `
                <div class="slot-data">
                    <div>Coins: ${displayCoins}</div>
                    ${hasMerchant ? '<div class="merchant-unlocked">Merchant Unlocked</div>' : ''}
                    <div>Created on: ${timestamp}</div>
                </div>` :
            '<div class="no-data">No Save Data</div>'}
        `;

        // Reattach click handler
        slotElement.addEventListener('click', (e) => {
            if (e.target.closest('.save-slot'))
                handleSlotClick(slot);
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

    if (!isSlotClickable)
        return;
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
    if (!canAdvance)
        return;

    const container = document.querySelector('.slideshow-container');
    const currentText = container.querySelector('.lore-text');

    if (cinematicTimeout)
        clearTimeout(cinematicTimeout);

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
    if (skipBtn)
        skipBtn.remove();

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
let activeSpawns = [];
let audioCooldown = false;
let MAX_COIN_CAPACITY = parseInt(localStorage.getItem('coinCapacity')) || 2500;
const activeCoins = [];
const beachContainer = document.querySelector('.beach-container');
const coinCounter = document.querySelector('.coin-counter');

function loadGame(saveData) {
    // Create normalized save data
    const fullSaveData = {
        coins: 0,
        upgrades: {
            1: {
                level: 0
            }
        }, // Default structure
        merchantCinematicShown: false,
        timestamp: Date.now(),
        ...saveData
    };

    // Initialize upgrades data
    if (!fullSaveData.upgrades)
        fullSaveData.upgrades = {};
    if (!fullSaveData.upgrades[1])
        fullSaveData.upgrades[1] = {
            level: 0
        };

    // Initialize special upgrades data
    if (!fullSaveData.specialUpgrades)
        fullSaveData.specialUpgrades = {};

    // Load state
    coinCount = fullSaveData.coins || 0; // Load precise coin count
    merchantCinematicShown = fullSaveData.merchantCinematicShown || false;

    // Load the user's preferred coin capacity in settings
    MAX_COIN_CAPACITY = parseInt(localStorage.getItem('coinCapacity')) || 2500;
    document.getElementById('coinCapacitySlider').value = MAX_COIN_CAPACITY;
    document.getElementById('coinCapacityValue').textContent = MAX_COIN_CAPACITY;

    // Get the name from the save slot's data
    const playerName = saveData.playerName || "Traveler";
    console.log(`Welcome back, ${playerName}!`);

    // Update UI with rounded values
    updateCoinDisplay(); // Use the centralized display function
    document.querySelector('.merchant-btn').style.display = merchantCinematicShown ? 'block' : 'none';

    // XP System initialization
    const xpContainer = document.querySelector('.xp-container');
    if (saveData.upgrades?.[2]?.level >= 1) {
        xpContainer.style.display = 'block';
        updateXPDisplay(
            saveData.xp || 0,
            saveData.level || 0,
            saveData.xpNeeded || 10);
    } else {
        xpContainer.style.display = 'none';
    }

    // Update storage with normalized data
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(fullSaveData));

    // Update slot data reference
    const slot = saveSlots.find(s => s.id === currentSlotId);
    if (slot)
        slot.data = fullSaveData;

    // Update goal display
    if (merchantCinematicShown)
        currentGoal = 10;
    updateGoalDisplay();

    // Load dialogue progress
    loadDialogueProgress();

    // Start game and apply upgrades
    startGame();
    applyUpgradeEffects();
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

    // Reset game state
    gameActive = false;

    // Clear ALL existing intervals and timeouts
    clearInterval(window.spawnInterval);
    window.spawnInterval = null;

    // Reset spawn tracking
    if (typeof activeSpawns === 'undefined') {
        window.activeSpawns = [];
    } else {
        activeSpawns.forEach(id => {
            if (typeof id === 'number') {
                cancelAnimationFrame(id);
            } else {
                clearTimeout(id);
            }
        });
        activeSpawns = [];
    }

    // Clear existing elements
    beachContainer.innerHTML = '';
    document.querySelector('.menu-container').style.display = 'none';

    gameActive = true;

    if (musicManager.isMusicOn) {
        musicManager.playRandom();
    }

    document.body.classList.add('game-active');
    document.querySelector('.game-screen').style.display = 'block';

    // Start coin spawning
    spawnCoin();
    window.spawnInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(window.spawnInterval);
        } else {
            spawnCoin();
        }
    }, 3000);

    // Show goal message and merchant button
    updateGoalDisplay();
    document.querySelector('.merchant-btn').style.display = merchantCinematicShown ? 'block' : 'none';
}

function spawnCoin() {
    if (!gameActive)
        return; // Prevent spawning when game is inactive

    // Get current spawn rate
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const upgradeLevel = saveData.upgrades?.[1]?.level || 0;
    const spawnRateMultiplier = Math.pow(0.9, upgradeLevel);

    // Check if max capacity is reached
    if (activeCoins.length >= MAX_COIN_CAPACITY) {
        // Remove the oldest coin
        const oldestCoin = activeCoins.shift(); // Remove the first coin from the array
        if (oldestCoin) {
            oldestCoin.remove(); // Remove the coin from the DOM
        }
    }

    // Track spawn attempt
    const spawnID = setTimeout(() => {
        const coin = document.createElement('div');
        coin.className = 'coin';

        requestAnimationFrame(() => {
            if (!gameActive)
                return; // Additional safety check

            const startX = Math.random() * (beachContainer.offsetWidth - 40);
            coin.style.left = `${startX}px`;
            coin.style.top = `-50px`;
            beachContainer.appendChild(coin);

            // Add coin to the activeCoins array
            activeCoins.push(coin);

            void coin.offsetHeight; // Force layout recalculation

            coin.style.transition = 'top 1s ease-out, left 1.5s ease-out';
            coin.style.left = `${startX + (Math.random() * 100 - 50)}px`;
            coin.style.top = `${Math.random() * (beachContainer.offsetHeight - 40) + 20}px`;

            setTimeout(() => {
                if (!gameActive)
                    return; // Final safety check
                coin.classList.add('collectable');
                addHoverEffect(coin);
            }, 100);
        });

        // Remove spawn ID from tracking after completion
        activeSpawns = activeSpawns.filter(id => id !== spawnID);
    }, Math.random() * 100); // Small random delay for spawn staggering

    // Track this spawn attempt
    activeSpawns.push(spawnID);
}

function addHoverEffect(coin) {
    let collected = false;
    let previousLevel = 0;

    function collectCoin() {
        if (collected)
            return;
        collected = true;

        // Remove the coin from the activeCoins array
        const coinIndex = activeCoins.indexOf(coin);
        if (coinIndex !== -1) {
            activeCoins.splice(coinIndex, 1); // Remove the coin from the array
        }

        const coinSound = document.createElement('audio');
        coinSound.src = document.getElementById('coin-sound').src;
        coinSound.volume = 0.3;

        // Handle audio state
        const playPromise = coinSound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name !== 'AbortError') {
                    console.log('Audio play interrupted');
                }
            });
        }

        // Get current save data
        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};

        // Apply coin value multiplier
        const coinValueMultiplier = getCoinValueMultiplier();
        coinCount += 1 * coinValueMultiplier;
        updateCoinDisplay(); // Update display with rounded value

        // Store previous level before updating
        previousLevel = saveData.level || 0;

        // Check if Special Coins upgrade is active
        const hasSpecialCoins = (saveData.upgrades?.[2]?.level || 0) >= 1;

        // Handle XP if upgrade is active
        if (hasSpecialCoins) {
            // Initialize XP data if not present
            if (typeof saveData.xp === 'undefined') {
                saveData.xp = 0; // Start with 0 XP
                saveData.level = 0;
                saveData.xpNeeded = 10;
            }

            // Calculate XP gain with multiplier
            const xpGain = 1 * getXPMultiplier(); // Apply multiplier here
            saveData.xp += xpGain;

            // Process level up
            while (saveData.xp >= saveData.xpNeeded) {
                saveData.xp -= saveData.xpNeeded;
                saveData.level += 1;
                saveData.xpNeeded = 10 * Math.pow(1.1, saveData.level);
            }

            // Check for level up and spawn special coin
            if (saveData.level > previousLevel) {
                spawnSpecialCoin();
            }

            // Update XP display
            updateXPDisplay(saveData.xp, saveData.level, saveData.xpNeeded);
        }

        // Create updated save data
        const updatedData = {
            ...saveData,
            coins: coinCount, // Store precise value
            merchantCinematicShown: merchantCinematicShown,
            timestamp: saveData.timestamp || Date.now()
        };

        // Save updated data
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(updatedData));

        // Animate coin collection
        coin.style.transform = 'scale(2) translateY(-20px)';
        coin.style.opacity = '0';

        // Remove coin after animation
        setTimeout(() => coin.remove(), 500);

        // Update slot display
        const slot = saveSlots.find(s => s.id === currentSlotId);
        if (slot) {
            slot.data = updatedData;
            initializeSaveSlots(); // Refresh UI
        }

        // Update goal display if needed
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

function spawnSpecialCoin() {
    if (!gameActive)
        return;

    const coin = document.createElement('div');
    coin.className = 'special-coin';

    // Get container dimensions
    const containerWidth = beachContainer.offsetWidth;
    const containerHeight = beachContainer.offsetHeight;

    requestAnimationFrame(() => {
        // Random starting position across full width
        const startX = Math.random() * (containerWidth - 50);
        coin.style.left = `${startX}px`;
        coin.style.top = `-60px`; // Start slightly higher
        beachContainer.appendChild(coin);

        // Force layout recalculation
        void coin.offsetHeight;

        // Animate with transition
        coin.style.transition = 'top 1s ease-out, left 1.5s ease-out';

        // Random end position within container bounds
        const endX = Math.max(10, Math.min(
                    startX + (Math.random() * 100 - 50),
                    containerWidth - 50));

        const endY = Math.random() * (containerHeight - 50) + 20;

        coin.style.left = `${endX}px`;
        coin.style.top = `${endY}px`;

        // Enable collection after 300ms
        setTimeout(() => {
            coin.classList.add('collectable');
            addSpecialCoinHoverEffect(coin);
        }, 300);
    });
}

function addSpecialCoinHoverEffect(coin) {
    let collected = false;

    function collectSpecialCoin() {
        if (collected)
            return;
        collected = true;
        coin.classList.add('collected');

        // Play sound
        const specialCoinSound = document.getElementById('special-coin-sound').cloneNode(true);
        specialCoinSound.volume = 0.6;

        // Ensure sound plays
        specialCoinSound.play()
        .then(() => {
            // Sound played successfully
        })
        .catch((error) => {
            console.error('Error playing special coin sound:', error);
            // Fallback to regular coin sound
            const fallbackSound = document.getElementById('coin-sound').cloneNode(true);
            fallbackSound.volume = 0.6;
            fallbackSound.play();
        });

        // Update special coin count
        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
        saveData.specialCoins = (saveData.specialCoins || 0) + 1;
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

        // Update display
        const specialCoinDisplay = document.querySelector('.special-coin-balance');
        if (specialCoinDisplay) {
            specialCoinDisplay.textContent = `Special Coins: ${Math.round(saveData.specialCoins)}`;
        }

        // Remove after animation
        setTimeout(() => coin.remove(), 600);
    }

    // Add interaction handlers
    coin.addEventListener('mouseenter', collectSpecialCoin);
    coin.addEventListener('touchstart', (e) => {
        e.preventDefault();
        collectSpecialCoin();
    });

    // Hover effects
    coin.addEventListener('mouseenter', () => {
        if (!collected) {
            coin.style.transform = 'scale(1.1) rotate(15deg)';
        }
    });

    coin.addEventListener('mouseleave', () => {
        if (!collected) {
            coin.style.transform = 'scale(1) rotate(0deg)';
        }
    });
}

function updateXPDisplay(currentXP, currentLevel, xpNeeded) {
    const xpProgress = document.querySelector('.xp-progress');
    const xpLevel = document.querySelector('.xp-level');
    const xpCurrent = document.querySelector('.xp-current');
    const xpNeededSpan = document.querySelector('.xp-needed');

    const progressPercent = (currentXP / xpNeeded) * 100;
    xpProgress.style.width = `${progressPercent}%`;
    xpLevel.textContent = currentLevel;
    xpCurrent.textContent = currentXP.toFixed(1);
    xpNeededSpan.textContent = `${xpNeeded.toFixed(1)} XP`;
}

function getXPMultiplier() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const specialUpgrade1 = saveData.specialUpgrades?.[1] || {
        level: 0
    }; // Wisdom Boost
    const upgrade3 = saveData.upgrades?.[3] || {
        level: 0
    }; // Educated Coins

    // Combine multipliers: 1.25^WisdomBoostLevel * 1.1^EducatedCoinsLevel
    return Math.pow(1.25, specialUpgrade1.level) * Math.pow(1.1, upgrade3.level);
}

function getCoinValueMultiplier() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const upgrade = saveData.specialUpgrades?.[2] || {
        level: 0
    };
    const playerLevel = saveData.level || 0;

    // Combine both multipliers: 1.25^upgradeLevel * 1.05^playerLevel
    return Math.pow(1.25, upgrade.level) * Math.pow(1.05, playerLevel);
}

function updateCoinDisplay() {
    // Always show rounded value but keep precise internal count
    coinCounter.textContent = `Coins: ${Math.round(coinCount)}`;

    // Update merchant display if open
    const merchantCoinCount = document.getElementById('merchant-coin-count');
    if (merchantCoinCount) {
        merchantCoinCount.textContent = Math.round(coinCount);
    }
}

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
        if (this.isMusicOn)
            this.audio.volume = 0.5;
    },

    shuffleTracks() {
        this.shuffledTracks = [...this.tracks].sort(() => Math.random() - 0.5);
    },

    playRandom() {
        if (!this.shuffledTracks.length)
            this.shuffleTracks();
        this.currentTrackIndex = 0;
        this.playCurrent();
    },

    playCurrent() {
        if (!this.isMusicOn)
            return;

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

        if (this.isMusicOn) {
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
document.getElementById('coinCapacitySlider').value = MAX_COIN_CAPACITY;
document.getElementById('coinCapacityValue').textContent = MAX_COIN_CAPACITY;
document.getElementById('coinCapacitySlider').addEventListener('input', function (e) {
    const value = Math.round(e.target.value / 100) * 100; // Round to nearest 100
    document.getElementById('coinCapacityValue').textContent = value;
    MAX_COIN_CAPACITY = value;
    localStorage.setItem('coinCapacity', value);
});
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
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const goalMessage = document.querySelector('.goal-message');
    const hasSpecialCoinsUpgrade = (saveData.upgrades?.[2]?.level || 0) >= 1;
    const specialDialogue = merchantDialogues.introduction.options[3];

    // Check if first 3 dialogues are completed (excluding mysterious one)
    const initialDialoguesCompleted = merchantDialogues.introduction.options
        .slice(0, 3) // Only check first 3 dialogues
        .every(opt => opt.completed);

    // 1. Check for merchant cinematic trigger
    if (!merchantCinematicShown && coinCount >= currentGoal) {
        startMerchantCinematic();
        goalMessage.style.display = 'none';
        return;
    }

    // 2. Check for special coins state
    if (hasSpecialCoinsUpgrade && !specialDialogue.completed) {
        goalMessage.innerHTML = '"Maybe the merchant can explain what these special coins are..."';
        goalMessage.style.display = 'block';
        return;
    }

    // 3. Check if initial 3 dialogues are completed
    if (initialDialoguesCompleted && !specialDialogue.completed) {
        goalMessage.innerHTML = '"Guess I\'ll keep collecting coins for now.."';
        goalMessage.style.display = 'block';
        return;
    }

    // 4. Check if ALL dialogues are completed
    if (merchantDialogues.introduction.options.every(opt => opt.completed)) {
        goalMessage.innerHTML = '"Guess I\'ll keep collecting coins for now.."';
        goalMessage.style.display = 'block';
        return;
    }

    // 5. Default merchant unlocked state
    if (merchantCinematicShown) {
        goalMessage.innerHTML = '"Maybe I should go talk to the merchant..<br>he can answer some of my questions.."';
        goalMessage.style.display = 'block';
        return;
    }

    // 6. Fallback for new players
    goalMessage.innerHTML = '"Hmm.. I wonder what would happen<br>if I collected some of these coins..."';
    goalMessage.style.display = 'block';
}

function allDialoguesCompleted() {
    return merchantDialogues.introduction.options.every(option => option.completed);
}

function startMerchantCinematic() {
    if (merchantCinematicShown)
        return;

    // Pause game activity
    gameActive = false;

    // Clear existing intervals and timeouts
    if (window.spawnInterval) {
        clearInterval(window.spawnInterval);
        window.spawnInterval = null;
    }

    // Save state
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const updatedData = {
        ...saveData,
        merchantCinematicShown: true,
        coins: coinCount,
        timestamp: Date.now()
    };
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(updatedData));

    // Update state
    merchantCinematicShown = true;
    const slot = saveSlots.find(s => s.id === currentSlotId);
    if (slot)
        slot.data = updatedData;

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
    const merchantSlides = [{
            text: "💨💨💨..𝘛𝘩𝘦 𝘸𝘪𝘯𝘥 𝘴𝘶𝘥𝘥𝘦𝘯𝘭𝘺 𝘱𝘪𝘤𝘬𝘴 𝘶𝘱.."
        }, {
            text: "What.. What is that in the distance?.."
        }, {
            text: "Wait.. 𝘞𝘩𝘰 is that in the distance?.."
        }, {
            text: "\"Greetings, castaway!\" says a mysterious figure.."
        }, {
            text: "\"I see you've found my Cove!\""
        }, {
            text: "Who.. Who are you?.."
        }, {
            text: "\"Why, I am of course the Magnificent Merchant!\""
        }, {
            text: "..."
        }, {
            text: "\"It seems your presence has revitalized the Coin Cove back to full power!\""
        }, {
            text: "..."
        }, {
            text: "\"You're probably a bit confused right now, but all that matters is that you've saved my business.\""
        }, {
            text: "\"Keep collecting those coins and I can help both of us achieve the things we want!\""
        },
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
        if (!canAdvance)
            return;
        handleCinematicClick();
    };

    overlay.addEventListener('click', clickHandler);

    continueBtn.onclick = () => {
        // Restore game state
        gameActive = true;

        // Clear ALL existing spawns and intervals
        clearInterval(window.spawnInterval);

        // Clear active timeouts CORRECTED VERSION
        activeSpawns.forEach(id => {
            clearTimeout(id); // Changed from cancelAnimationFrame
        });
        activeSpawns = [];

        // Apply upgrades - handles interval setup
        applyUpgradeEffects();

        // Restore original slides
        cinematicSlides.length = 0;
        cinematicSlides.push(...originalSlides);

        // Cleanup
        overlay.removeEventListener('click', clickHandler);
        overlay.style.display = 'none';

        // Audio handling
        const windSound = document.getElementById('wind-sound');
        windSound.play().catch(err => {
            if (err.name !== 'AbortError') {
                console.error('Error playing wind sound:', err);
            }
        });
        musicManager.audio.pause();
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
    if (!container)
        return;

    container.innerHTML = '';

    // Check if Special Coins upgrade is purchased
    const hasSpecialCoins = (saveData.upgrades?.[2]?.level || 0) >= 1;
    const specialCoins = Math.round(saveData.specialCoins || 0); // Round special coins

    // Render existing upgrades
    Object.values(upgrades).forEach(upg => {
        const upgradeData = saveData.upgrades?.[upg.id] || {
            level: 0
        };
        const currentLevel = upgradeData.level;
        const isLocked = upg.mysterious && currentLevel === 0 && coinCount < upg.baseCost;
        const isMaxed = currentLevel >= upg.maxLevel;
        const isSpecialUpgrade = upg.id === 2;

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
    <div class="upgrade-item ${isLocked ? 'mysterious-upgrade' : ''} ${isSpecialUpgrade ? 'special-coins-upgrade' : ''}">
        <div class="upgrade-header">
            <h3>${isLocked ? '???' : statusText}</h3>
            ${!isMaxed ? `
                <button class="buy-btn" 
                    data-upgrade-id="${upg.id}"
                    ${!canAfford ? 'disabled' : ''}>
                    ${isLocked ? `Req: ${upg.baseCost}` : `Cost: ${cost}`} Coins
                </button>
            ` : ''}
        </div>
        ${isLocked ? `
            <p>???</p>
            <p><em>???</em></p>
        ` : `
            <p>${upg.upgDesc}</p>
            ${!isMaxed ? `<p><em>${upg.upgBenefits}</em></p>` : ''}
        `}
    </div>
`;

        // Append the upgrade HTML
        container.innerHTML += upgradeHTML;

        // Append the special upgrades section immediately after the Special Coins upgrade
        if (isSpecialUpgrade && hasSpecialCoins) {
            const specialSectionHTML = `
                <div class="special-coins-section">
                    <div class="special-coins-header">
                        Collect normal coins to gain XP!<br>
                        - Get enough XP to level up<br>
                        - Level up to spawn special coins<br>
                        - Each level gives 1.05x more coin value<br>
                        <div class="special-coin-balance">Special Coins: ${specialCoins}</div>
                    </div>
                    <div class="upgrades-grid">
                        ${Array.from({
                    length: 6
                }, (_, i) => {
                    const upgrade = specialUpgrades[i + 1];
                    const currentLevel = saveData.specialUpgrades?.[i + 1]?.level || 0;
                    const meetsRequirement = (!upgrade.requirement || (saveData.level || 0) >= upgrade.requirement);
                    const cost = upgrade.baseCost + (currentLevel * upgrade.costIncrement);
                    const canAfford = specialCoins >= cost;

                    return `
                                <div class="upgrade-placeholder ${!meetsRequirement ? 'locked' : ''}">
                                    ${meetsRequirement ? `
                                        <h4>${upgrade.name}</h4>
                                        <p>${upgrade.desc}</p>
                                        <p>(Level ${currentLevel}/${upgrade.levelCap})</p>
                                        <button class="buy-special-btn" 
                                            data-upgrade-id="${upgrade.id}"
                                            ${!canAfford || currentLevel >= upgrade.levelCap ? 'disabled' : ''}>
                                            Cost: ${cost} Special Coins
                                        </button>
                                    ` : `
                                        <h4>${upgrade.name}</h4>
                                        <p>Requires Level ${upgrade.requirement}</p>
                                    `}
                                </div>
                            `;
                }).join('')}
                    </div>
                </div>
            `;
            container.innerHTML += specialSectionHTML;
        }
    });

    // Add event listeners for special upgrades
    container.querySelectorAll('.buy-special-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const upgradeId = parseInt(this.dataset.upgradeId);
            purchaseSpecialUpgrade(upgradeId);
        });
    });

    // Rebind event listeners
    container.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const upgradeId = parseInt(this.dataset.upgradeId);
            purchaseUpgrade(upgradeId);
        });
    });

    updateEffectsDisplay();
}

function purchaseUpgrade(upgradeId) {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const upg = upgrades[upgradeId];
    if (!upg)
        return;

    const upgradeData = saveData.upgrades[upgradeId] || {
        level: 0
    };
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

        // Special handling for Special Coins upgrade (ID 2)
        if (upgradeId === 2) {
            if (!saveData.xp) {
                saveData.xp = 0;
                saveData.level = 0;
                saveData.xpNeeded = 10;
                updateGoalDisplay();
            }

            // Refresh the dialogue UI to update the 4th option's visibility
            const dialogueContainer = document.querySelector('.dialogue-container');
            if (dialogueContainer) {
                dialogueContainer.remove();
                showDialogue(); // Re-render the dialogue options
            }

            // Show XP container
            document.querySelector('.xp-container').style.display = 'block';
            updateXPDisplay(saveData.xp, saveData.level, saveData.xpNeeded);
        }

        // Update UI
        updateCoinDisplay();
        updateMerchantDisplay();
        applyUpgradeEffects();
    }
}

function purchaseSpecialUpgrade(upgradeId) {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const upgrade = specialUpgrades[upgradeId];
    const currentLevel = saveData.specialUpgrades?.[upgradeId]?.level || 0;

    // Calculate cost
    const cost = upgrade.baseCost + (currentLevel * upgrade.costIncrement);

    if (saveData.specialCoins >= cost && currentLevel < upgrade.levelCap) {
        saveData.specialCoins -= cost;
        saveData.specialUpgrades = saveData.specialUpgrades || {};
        saveData.specialUpgrades[upgradeId] = {
            level: currentLevel + 1
        };

        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
        updateMerchantDisplay();
        updateEffectsDisplay();
    }
}

function updateEffectsDisplay() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const effectsContainer = document.querySelector('.current-effects');

    const xpLevel = saveData.specialUpgrades?.[1]?.level || 0; // Wisdom Boost
    const coinLevel = saveData.specialUpgrades?.[2]?.level || 0; // Golden Touch
    const educatedCoinsLevel = saveData.upgrades?.[3]?.level || 0; // Educated Coins
    const playerLevel = saveData.level || 0;

    effectsContainer.innerHTML = `
        <strong>Active Effects:</strong>
        <div>• Coin Spawn Rate: ${(1000 / (3000 * Math.pow(0.9, saveData.upgrades?.[1]?.level || 0))).toFixed(1)}/sec</div>
        ${(xpLevel > 0 || educatedCoinsLevel > 0) ? `
            <div>• XP Multiplier: ${getXPMultiplier().toFixed(2)}x</div>
        ` : ''}
        ${(coinLevel > 0 || playerLevel > 0) ? 
        `<div>• Coin Multiplier: ${getCoinValueMultiplier().toFixed(2)}x</div>` : ''}
    `;
}

function applyUpgradeEffects() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const speedUpgrade = saveData.upgrades?.[1] || {
        level: 0
    };

    // Calculate spawn rate
    const spawnRate = 3000 * Math.pow(0.9, speedUpgrade.level);

    // Clear existing interval
    clearInterval(window.spawnInterval);

    // Set up interval with calculated rate
    window.spawnInterval = setInterval(() => {
        if (gameActive)
            spawnCoin();
    }, spawnRate);
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
    if (!manageMode)
        initializeSaveSlots();
});
