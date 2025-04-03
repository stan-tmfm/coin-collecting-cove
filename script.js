let coinCount = 0;
let gameActive = false;
let activeSpawns = [];
let audioCooldown = false;
let MAX_COIN_CAPACITY = parseInt(localStorage.getItem('coinCapacity')) || 2500;
const activeCoins = [];
const activeBoostCoins = [];
let boostCoinsUnlocked = false;
let activeBoosts = {};
let boostSpawnInterval = null;
let boostCycleIndex = 0;
const BOOST_CYCLE = ['coins', 'xp'];
const BOOST_TYPES = {
    coins: {
        class: 'boosted-coin',
        color: 'rgba(255, 215, 0, 0.8)'
    },
    xp: {
        class: 'boosted-xp',
        color: 'rgba(100, 200, 255, 0.8)'
    },
    platinum: {
        class: 'boosted-platinum',
        color: 'rgba(255, 255, 255, 0.8)'
    }
};
let isPlatinumSpawning = false;
const beachContainer = document.querySelector('.beach-container');
const coinCounter = document.querySelector('.coin-counter');
let useScientificNotation = localStorage.getItem('useScientificNotation') === 'true';
let cursorPosition = {
    x: 0,
    y: 0
};
let isCursorInContainer = false;
const UNIT_TO_PX = 3;

// Track cursor position
beachContainer.addEventListener('mousemove', (e) => {
    const rect = beachContainer.getBoundingClientRect();
    cursorPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    isCursorInContainer = true;
});

beachContainer.addEventListener('mouseleave', () => {
    isCursorInContainer = false;
});

// Mobile touch support
beachContainer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = beachContainer.getBoundingClientRect();
    cursorPosition = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
    isCursorInContainer = true;
}, {
    passive: false
});

const SOUND_THRESHOLD = 250; // Disable sound if more than 250 coins are collected at once
let coinsCollectedThisFrame = 0;
let automationCoreInterval = null;

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
                reward: 25,
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
                question: "Any really cool coins?",
                response: {
                    speaker: "merchant",
                    lines: [{
                            speaker: "player",
                            text: "I've only seen golden yellow coins so far, will I find some cooler or more interesting coins soon?"
                        }, {
                            speaker: "merchant",
                            text: "Hmm.. well, I suppose I can tell you about the 𝗯𝗼𝗼𝘀𝘁 𝗰𝗼𝗶𝗻."
                        }, {
                            speaker: "player",
                            text: "What?"
                        }, {
                            speaker: "merchant",
                            text: "Ah yes, the magnificent boost coin, quite the rare sight."
                        }, {
                            speaker: "merchant",
                            text: "These elusive coins may only wash up about every 60 seconds or so, but they hold a corrupt energy within them."
                        }, {
                            speaker: "player",
                            text: "Corrupt..?"
                        }, {
                            speaker: "merchant",
                            text: "Within a few seconds, these boost coins could fizzle into thin air from this terrible corruption."
                        }, {
                            speaker: "merchant",
                            text: "However, if you manage to get hold of one of these boost coins before it withers away, it can bring you great blessing."
                        }, {
                            speaker: "merchant",
                            text: "Aye, capturing one of these rare treasures can yield you 30 seconds of an remarkable boost, thus the name."
                        }, {
                            speaker: "player",
                            text: "Boost..?"
                        }, {
                            speaker: "merchant",
                            text: "Yes, I recall finding one of these boost coins one day and then for the next 30 seconds, all the coins that flowed in were surrounded by a golden halo."
                        }, {
                            speaker: "merchant",
                            text: "Each coin that came to me during that time was worth triple its normal value—a truly remarkable occurrence."
                        }, {
                            speaker: "player",
                            text: "Woah, that does sound pretty cool.."
                        }, {
                            speaker: "merchant",
                            text: "Legend has it that these boost coins can bless other aspects of the Cove, but that is yet to be discovered."
                        }, {
                            speaker: "player",
                            text: "So, in summary, every minute or so a boost coin with corrupted energy should wash ashore and I may only have a few seconds to get its blessings otherwise it will fizzle into thin air."
                        }, {
                            speaker: "player",
                            text: "Interesting.."
                        },
                    ]
                },
                reward: 25,
                completed: false
            }, {
                id: 5,
                hidden: true,
                question: "What are special coins?",
                requirement: (saveData) => (saveData.upgrades?.[2]?.level || 0) >= 1,
                response: {
                    speaker: "merchant",
                    lines: [{
                            speaker: "player",
                            text: "What are special coins?"
                        }, {
                            speaker: "merchant",
                            text: "These are very special coins."
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
                            text: "You may not realize it now, but each special coin you pick up brings you closer to understanding the Cove's true power."
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
            }, {
                id: 6,
                hidden: true,
                question: "What to do in the Forge?",
                requirement: (saveData) => (saveData.upgrades?.[4]?.level || 0) >= 1,
                response: {
                    speaker: "merchant",
                    lines: [{
                            speaker: "player",
                            text: "I noticed this new Forge section, what exactly does it do?"
                        }, {
                            speaker: "merchant",
                            text: "Ah, the Forge! This is where we convert your hard-earned coins into a more valuable type of coin, the molten coin."
                        }, {
                            speaker: "player",
                            text: "I'm sorry did you just say \"we?\""
                        }, {
                            speaker: "merchant",
                            text: "Wh—Oh, sorry I misspoke. I meant I forge the molten coins, I'm the only one who is able to forge these infernal beasts!"
                        }, {
                            speaker: "merchant",
                            text: `Here in the Forge you can convert ${formatNumber(10000)} regular boring old coins into one superforged molten coin, yielding immense energy and power.`
                        }, {
                            speaker: "merchant",
                            text: "Aye, and also you should know that with greater wisdom comes more molten coins, why every 10 levels you'll get double molten coins from this Forge isn't that incredible."
                        }, {
                            speaker: "player",
                            text: "Are you hiding something from me? I feel like you're hiding something from me."
                        }, {
                            speaker: "merchant",
                            text: "...What? Oh, actually yes, I did forget to tell you something. Eventually, my magic won't be able to sustain such exponential growth, and after forging so many molten coins my powers will fade in strength.",
                        }, {
                            speaker: "merchant",
                            text: "But fear not, for you shall be able to get many molten coins in the near future if you put your heart to it!"
                        }, {
                            speaker: "player",
                            text: "That's not what I meant but okay, tell me more about this forge, how do you use it?"
                        }, {
                            speaker: "merchant",
                            text: "Oh, right, I forgot to tell you this important thing also. Igniting the Forge is a costly ritual; it requires sacrifice."
                        }, {
                            speaker: "player",
                            text: "Sacrifice?"
                        }, {
                            speaker: "merchant",
                            text: "Yes, sacrifice, it will sacrifice all your current progress up to this point but it is so worth it."
                        }, {
                            speaker: "merchant",
                            text: "And your first ignition of the Forge will even let you discover a special new type of coin which I'll let you discover for yourself."
                        }, {
                            speaker: "merchant",
                            text: "Besides, since molten coins hold immense molten energy, I am able to provide very powerful upgrades to your coin collecting progression once you get things going."
                        }, {
                            speaker: "player",
                            text: "I guess that is pretty convincing."
                        }
                    ]
                },
                reward: {
                    type: "molten",
                    amount: 5
                },
                completed: false
            }, {
                id: 7,
                hidden: true,
                question: "What are platinum coins?",
                requirement: (saveData) => saveData.hasPlatinumUnlocked,
                response: {
                    speaker: "merchant",
                    lines: [{
                            speaker: "player",
                            text: "I noticed there's a new \"Platinum Coin Upgrades\" section in your shop and I was curious what those are."
                        }, {
                            speaker: "merchant",
                            text: "Ah yes, platinum coins are the special new currency I detailed in the Forge section, I'm sure you read it."
                        }, {
                            speaker: "player",
                            text: "So.. what are they?"
                        }, {
                            speaker: "merchant",
                            text: "Igniting the Forge for the first time in ages has rebirthed this special shiny platinum coin, and it is quite a rare one."
                        }, {
                            speaker: "merchant",
                            text: "This rare coin appears about 10% of the time a normal coin appears, but I can use my magic to increase that chance with some upgrades in my shop."
                        }, {
                            speaker: "merchant",
                            text: "These platinum coins can be spent on powerful upgrades, and you will want to collect many of them because of their high value."
                        }, {
                            speaker: "merchant",
                            text: "I know that there's even a boost coin that improves platinum coin potential significantly, you just need to find it."
                        }, {
                            speaker: "player",
                            text: "Wait, so these platinum coins are even more valuable than molten coins?"
                        }, {
                            speaker: "merchant",
                            text: "Not quite. Molten coins are forged directly from you making progress, while platinum coins naturally accumulate over time. One is crafted, the other is discovered."
                        }, {
                            speaker: "merchant",
                            text: "It will be important for you to collect many molten coins and platinum coins equally, since they can both be spent on powerful upgrades in my shop."
                        }, {
                            speaker: "player",
                            text: "By the way, how do you actually manage to take these coins and turn them into beneficial upgrades to my coin collection?"
                        }, {
                            speaker: "merchant",
                            text: "I'm afraid a question like that I cannot answer at the moment."
                        }, {
                            speaker: "player",
                            text: "..."
                        }, {
                            speaker: "player",
                            text: "Ok whatever. Platinum coins sound like they're cool I guess."
                        }
                    ]
                },
                reward: {
                    type: "platinum",
                    amount: 50
                },
                completed: false
            }
        ]
    },
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

        const rewardType = option.reward?.type || 'coins';
        const rewardAmount = option.reward?.amount || option.reward;

        optionElement.innerHTML = `
    ${questionText}
    ${!option.completed && requirementMet ? 
            `<span class="reward-indicator">
        +${rewardAmount} 
        <img src="Images/${rewardType === 'platinum' ? 'platinum_coin' : rewardType === 'molten' ? 'molten_coin' : 'coin'}.png" 
             class="coin-icon ${rewardType === 'platinum' ? 'platinum' : rewardType === 'molten' ? 'molten' : ''}">
    </span>`
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
    refreshAllDisplays();
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
                    // Handle different reward types
                    if (option.reward.type === "platinum") {
                        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
                        saveData.platinumCoins = (saveData.platinumCoins || 0) + option.reward.amount;
                        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
                    } else if (option.reward.type === "molten") {
                        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
                        saveData.moltenCoins = (saveData.moltenCoins || 0) + option.reward.amount;
                        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
                    } else {
                        // Handle regular coin rewards
                        coinCount += option.reward.amount || option.reward;
                    }
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

function restoreMerchantDialogues() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};

    // Reset all dialogue completion states
    merchantDialogues.introduction.options.forEach(option => {
        option.completed = false;
    });

    // Update save data if needed
    if (saveData.dialogues) {
        saveData.dialogues.forEach(dialogue => {
            dialogue.completed = false;
        });
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
    }
    showDialogue();
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
        upgDesc: "Give coins to the Merchant and he will use his powers to make the Cove produce coins faster",
        upgBenefits: "1.1x Coin Spawn Rate per level",
        baseCost: 10,
        maxLevel: 10,
        currentLevel: 0,
        scaling: (baseCost, level) => (baseCost + 2 * level) * Math.pow(1.1, level)
    },
    2: {
        id: 2,
        upgName: "Special Coins",
        upgDesc: "Unlock the magical power of Special Coins, a new special type of coin that can be used to buy cool things",
        upgBenefits: "Unlocks Special Coins and new upgrades",
        baseCost: 100,
        maxLevel: 1,
        currentLevel: 0,
        scaling: (baseCost) => baseCost,
        mysterious: true
    },
    3: {
        id: 3,
        upgName: "Educated Coins",
        upgDesc: "Make the coins become educated, improving their XP output",
        upgBenefits: "1.1x XP per level",
        baseCost: 1000,
        maxLevel: 10,
        currentLevel: 0,
        scaling: (baseCost, level) => (baseCost + 200 * level) * Math.pow(1.1, level),
        mysterious: true
    },
    4: {
        id: 4,
        upgName: "The Forge",
        upgDesc: "Unlock the magmatic power of Molten Coins alongside The Forge",
        upgBenefits: "Unlocks Molten Coins and new upgrades",
        baseCost: 0,
        maxLevel: 1,
        currentLevel: 0,
        scaling: () => 0,
        mysterious: true,
        requirements: {
            coins: 10000,
            level: 31
        },
        get reqText() {
            return `Req: ${formatNumber(this.requirements.coins)} Coins & Lvl ${this.requirements.level}`;
        }
    },
    5: {
        id: 5,
        upgName: "Platinum Coin Upgrades",
        upgDesc: "Unlock the very powerful platinum coin upgrades",
        upgBenefits: "Unlocks platinum coin upgrades",
        baseCost: 0,
        maxLevel: 1,
        currentLevel: 0,
        scaling: () => 0,
        mysterious: true,
        requirements: (saveData) => saveData.hasPlatinumUnlocked,
    },
    6: {
        id: 6,
        upgName: "Flame Enhancement",
        upgDesc: "Enhance the flames of the Forge for increased molten coin gain",
        upgBenefits: "1.25x molten coins per level",
        baseCost: 1e6,
        maxLevel: 10,
        currentLevel: 0,
        scaling: (baseCost, level) => (baseCost + 2e5 * level) * Math.pow(1.5, level),
        mysterious: true
    },
    7: {
        id: 7,
        upgName: "Silver Lining",
        upgDesc: "No this is not a metaphor, this is just an upgrade to platinum coin value",
        upgBenefits: "1.1x platinum coins per level",
        baseCost: 1e9,
        maxLevel: 10,
        currentLevel: 0,
        scaling: (baseCost, level) => (baseCost + 2e8 * level) * Math.pow(1.5, level),
        mysterious: true
    },
	8: {
        id: 8,
        upgName: "Infuse",
        upgDesc: "Unlock the arcane power of infused magic",
        upgBenefits: "Unlocks Infused Coins and new upgrades",
        baseCost: 0,
        maxLevel: 1,
        currentLevel: 0,
        scaling: () => 0,
        mysterious: true,
        requirements: {
            coins: 1e9,
            level: 121
        },
        get reqText() {
            return `Req: ${formatNumber(this.requirements.coins)} Coins & Lvl ${this.requirements.level}`;
        }
    },
	9: {
        id: 9,
        upgName: "Automation Upgrades",
        upgDesc: "Unlock automated systems to enhance productivity",
        upgBenefits: "Unlocks Automation upgrades",
        baseCost: 0,
        maxLevel: 1,
        currentLevel: 0,
        scaling: () => 0,
        mysterious: true,
        requirement: (saveData) => saveData.hasDoneInfuseReset,
        reqText: "Req: ???"
    },
	10: {
        id: 10,
        upgName: "Time Machine",
        upgDesc: "time machine",
        upgBenefits: "Unlocks the Time Machine",
        baseCost: 0,
        maxLevel: 1,
        currentLevel: 0,
        scaling: () => 0,
        mysterious: true,
        requirement: (saveData) => saveData.hasDoneInfuseReset,
        reqText: "Req: ???"
    },
    11: {
        id: 11,
        upgName: "Wisdom's Flow",
        upgDesc: "The wisdom flows deeper within you, providing an XP boost",
        upgBenefits: "1.1x XP per level",
        baseCost: 1e12,
        maxLevel: 10,
        currentLevel: 0,
        scaling: (baseCost, level) => (baseCost + 2e11 * level) * Math.pow(1.5, level),
        mysterious: true
    },
    12: {
        id: 12,
        upgName: "Purified Platinum",
        upgDesc: "Purified platinum is extra shiny and valuable",
        upgBenefits: "1.25x platinum coins per level",
        baseCost: 1e15,
        maxLevel: 10,
        currentLevel: 0,
        scaling: (baseCost, level) => (baseCost + 2e14 * level) * Math.pow(1.5, level),
        mysterious: true
    },
    13: {
        id: 13,
        upgName: "Arcane Mastery",
        upgDesc: "Tap into the ancient arcane forces and gain a large XP boost",
        upgBenefits: "1.5x XP per level",
        baseCost: 1e18,
        maxLevel: 10,
        currentLevel: 0,
        scaling: (baseCost, level) => (baseCost + 2e17 * level) * Math.pow(1.5, level),
        mysterious: true
    },
};

const specialUpgrades = {
    1: {
        id: 1,
        name: "Wisdom Boost",
        desc: "Increases XP gain by 1.25x per level",
        baseCost: 1,
        levelCap: 10,
        effect: 1.25,
        costIncrement: 1,
        type: "xp"
    },
    2: {
        id: 2,
        name: "Golden Touch",
        desc: "Increases coin value by 1.25x per level",
        baseCost: 1,
        levelCap: 10,
        effect: 1.25,
        costIncrement: 1,
        type: "coinValue"
    },
    3: {
        id: 3,
        name: "Mysterious Power I",
        desc: "Requires Level 200",
        baseCost: 100,
        levelCap: 1,
        effect: 1,
        costIncrement: 0,
        type: "mystery",
        requirement: 200
    },
    4: {
        id: 4,
        name: "Mysterious Power II",
        desc: "Requires Level 200",
        baseCost: 100,
        levelCap: 1,
        effect: 1,
        costIncrement: 0,
        type: "mystery",
        requirement: 200
    },
    5: {
        id: 5,
        name: "Ancient Knowledge I",
        desc: "Requires Level 2000",
        baseCost: 1000,
        levelCap: 1,
        effect: 1,
        costIncrement: 0,
        type: "mystery",
        requirement: 2000
    },
    6: {
        id: 6,
        name: "Ancient Knowledge II",
        desc: "Requires Level 2000",
        baseCost: 1000,
        levelCap: 1,
        effect: 1,
        costIncrement: 0,
        type: "mystery",
        requirement: 2000
    }
};

const forgeUpgrades = {
    1: {
        id: 1,
        name: "Coin Surge",
        desc: "Triples coin spawn rate",
        baseCost: 1,
        levelCap: 1,
        scaling: (baseCost) => baseCost
    },
    2: {
        id: 2,
        name: "Magnet Powers",
        desc: "Unlocks the Coin Magnet for easier coin collection.<br>Each level boosts collection radius by +5 units.<br>(PERMANENT UPGRADE)",
        baseCost: 5,
        levelCap: 10,
        scaling: (baseCost, level) => baseCost * Math.pow(5, level)
    },
    3: {
        id: 3,
        name: "Molten Riches",
        desc: "Increases coin value by 1.1x per level",
        baseCost: 10,
        levelCap: 50,
        scaling: (baseCost, level) => baseCost * Math.pow(2, level),
        type: "coinValue"
    },
    4: {
        id: 4,
        name: "Ember's Wisdom",
        desc: "Increases XP gain by 1.1x per level",
        baseCost: 10,
        levelCap: 50,
        scaling: (baseCost, level) => baseCost * Math.pow(2, level),
        type: "xpGain"
    },
    5: {
        id: 5,
        name: "Flame's Fortune",
        desc: "Increases platinum spawn chance by +9%.<br>At max level, the platinum boost coin will no longer exist, freeing up space for other boost coins.",
        baseCost: 100,
        levelCap: 10,
        scaling: (baseCost, level) => baseCost * Math.pow(5, level)
    },
    6: {
        id: 6,
        name: "Molten Mastery",
        desc: `Each unspent molten coin boosts coin value by 2^log(MC/${formatNumber(1e15)})`,
        baseCost: 1e18,
        levelCap: 1,
        scaling: (baseCost) => baseCost,
    }
};

const platinumUpgrades = {
    1: {
        id: 1,
        name: "Endless Prosperity",
        desc: "Boosts coin value and XP gain by 2x per level",
        baseCost: 1,
        levelCap: "♾️",
        scaling: (baseCost, level) => baseCost * Math.pow(10, level)
    },
    2: {
        id: 2,
        name: "Rushing Currents",
        desc: "Increases coin spawn rate by +10% per level",
        baseCost: 5,
        levelCap: 10,
        scaling: (baseCost, level) => baseCost * Math.pow(2, level)
    },
    3: {
        id: 3,
        name: "Cove's Treasure",
        desc: "Increases coin value by 1.5x per level",
        baseCost: 10,
        levelCap: 5,
        scaling: (baseCost, level) => baseCost * Math.pow(5, level)
    },
    4: {
        id: 4,
        name: "Tidal Knowledge",
        desc: "Increases XP gain by 1.5x per level",
        baseCost: 10,
        levelCap: 5,
        scaling: (baseCost, level) => baseCost * Math.pow(5, level)
    },
    5: {
        id: 5,
        name: "Heating Up",
        desc: "Increases molten coin gain by 1.25x per level",
        baseCost: 100,
        levelCap: 10,
        scaling: (baseCost, level) => baseCost * Math.pow(2, level)
    },
    6: {
        id: 6,
        name: "Mysterious Upgrade",
        desc: "You have no idea what this upgrade could do",
        baseCost: 1e10,
        levelCap: 1,
        scaling: (baseCost) => baseCost
    },
    7: {
        id: 7,
        name: "placeholder name",
        desc: "???",
        baseCost: 999,
        levelCap: 10,
        scaling: (baseCost, level) => baseCost * Math.pow(1.5, level),
        requirement: (saveData) => saveData.platinumUpgrades?.[6]?.level >= 1,
        reqText: "Requires Mysterious Upgrade"
    },
    8: {
        id: 8,
        name: "placeholder name",
        desc: "???",
        baseCost: 999,
        levelCap: 10,
        scaling: (baseCost, level) => baseCost * Math.pow(1.5, level),
        requirement: (saveData) => saveData.platinumUpgrades?.[6]?.level >= 1,
        reqText: "Requires Mysterious Upgrade"
    },
    9: {
        id: 9,
        name: "placeholder name",
        desc: "???",
        baseCost: 999,
        levelCap: 10,
        scaling: (baseCost, level) => baseCost * Math.pow(1.5, level),
        requirement: (saveData) => saveData.platinumUpgrades?.[6]?.level >= 1,
        reqText: "Requires Mysterious Upgrade"
    },
    10: {
        id: 10,
        name: "placeholder name",
        desc: "???",
        baseCost: 999,
        levelCap: 10,
        scaling: (baseCost, level) => baseCost * Math.pow(1.5, level),
        requirement: (saveData) => saveData.platinumUpgrades?.[6]?.level >= 1,
        reqText: "Requires Mysterious Upgrade"
    },
    11: {
        id: 11,
        name: "placeholder name",
        desc: "???",
        baseCost: 999,
        levelCap: 10,
        scaling: (baseCost, level) => baseCost * Math.pow(1.5, level),
        requirement: (saveData) => saveData.platinumUpgrades?.[6]?.level >= 1,
        reqText: "Requires Mysterious Upgrade"
    },
    12: {
        id: 12,
        name: "placeholder name",
        desc: "???",
        baseCost: 999,
        levelCap: 10,
        scaling: (baseCost, level) => baseCost * Math.pow(1.5, level),
        requirement: (saveData) => saveData.platinumUpgrades?.[6]?.level >= 1,
        reqText: "Requires Mysterious Upgrade"
    },
};

const infuseUpgrades = {
    1: {
        id: 1,
        name: "Arcane Knowledge",
        desc: "Multiplies XP gain by 3",
        baseCost: 1,
        levelCap: 1,
        scaling: (baseCost) => baseCost
    },
    2: {
        id: 2,
        name: "Automaton Awakening",
        desc: "Generates Automation Cores.<br>Doubles Automation Core production each level.<br>(PERMANENT UPGRADE)",
        baseCost: 5,
        levelCap: 10,
        scaling: (baseCost, level) => baseCost * Math.pow(10, level)
    },
    3: {
        id: 3,
        name: "Wealth Infusion",
        desc: "Increases coin value by 1.25x per level",
        baseCost: 10,
        levelCap: 25,
        scaling: (baseCost, level) => baseCost * Math.pow(5, level)
    },
    4: {
        id: 4,
        name: "Wisdom Infusion",
        desc: "Increases XP gain by 1.25x per level",
        baseCost: 10,
        levelCap: 25,
        scaling: (baseCost, level) => baseCost * Math.pow(5, level)
    },
    5: {
        id: 5,
        name: "Chrono Acceleration",
        desc: "Improves Time Warp efficiency by +2% per level",
        baseCost: 100,
        levelCap: 50,
        scaling: (baseCost, level) => baseCost * Math.pow(2, level)
    },
    6: {
        id: 6,
        name: "Arcane Mastery",
        desc: `Each unspent infused coin boosts XP gain by 1.5^log(IC/${formatNumber(1e17)})`,
        baseCost: 1e20,
        levelCap: 1,
        scaling: (base) => base
    }
};

const automationUpgrades = {
    1: {
        id: 1,
        name: "Auto-Clicker",
        desc: "Automatically clicks coins for you (1 click/sec per level)",
        baseCost: 1e3,
        levelCap: 10,
        scaling: (base, lvl) => base * Math.pow(2, lvl),
        effect: (level) => level // Returns clicks per second
    },
    2: {
        id: 2,
        name: "Coin Magnetizer",
        desc: "Automatically collects coins within radius (5 units per level)",
        baseCost: 1e4,
        levelCap: 10,
        scaling: (base, lvl) => base * Math.pow(2, lvl),
        effect: (level) => level * 5
    },
	3: {
        id: 3,
        name: "Coin Magnetizer",
        desc: "Automatically collects coins within radius (5 units per level)",
        baseCost: 1e4,
        levelCap: 10,
        scaling: (base, lvl) => base * Math.pow(2, lvl),
        effect: (level) => level * 5
    },
	4: {
        id: 4,
        name: "Coin Magnetizer",
        desc: "Automatically collects coins within radius (5 units per level)",
        baseCost: 1e4,
        levelCap: 10,
        scaling: (base, lvl) => base * Math.pow(2, lvl),
        effect: (level) => level * 5
    },
	5: {
        id: 5,
        name: "Coin Magnetizer",
        desc: "Automatically collects coins within radius (5 units per level)",
        baseCost: 1e4,
        levelCap: 10,
        scaling: (base, lvl) => base * Math.pow(2, lvl),
        effect: (level) => level * 5
    },
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

    // Toggle visibility based on whether the player has a name
    if (saveData.playerName) {
        nameChangeSection.style.display = 'flex';
        nameChangeSection.style.opacity = '1';
        nameChangeSection.style.visibility = 'visible';
    } else {
        nameChangeSection.style.display = 'none';
        nameChangeSection.style.opacity = '0';
        nameChangeSection.style.visibility = 'hidden';
    }

    // Pre-fill the input field with the current name
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
        const hasForge = slot.data?.hasDoneForgeReset || false;
		const hasInfuse = slot.data?.hasDoneInfuseReset || false;
        const timestamp = slot.data?.timestamp ? new Date(slot.data.timestamp).toLocaleDateString() : 'No date';

        // Round the displayed coin value
        displayCoins = slot.data ? formatNumber(Math.floor(slot.data.coins || 0)) : 0;

        slotElement.innerHTML = `
    <div class="slot-number">Slot ${slot.id}</div>
    ${slot.data ? `
        <div class="slot-data">
            <div>Coins: ${displayCoins}</div>
            ${hasInfuse ?
            '<div class="infuse-unlocked">Magic Infused</div>' :
            (hasForge ?
                '<div class="forge-unlocked">Forge Ignited</div>' :
                (hasMerchant ?
                    '<div class="merchant-unlocked">Merchant Unlocked</div>' : ''))}
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

function loadGame(saveData) {
    // Create normalized save data
    const fullSaveData = {
        coins: 0,
        upgrades: {
            1: {
                level: 0
            }
        },
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
    updateCoinDisplay();
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

    // Determine if boost coins are unlocked and start the interval
    boostCoinsUnlocked = saveData.boostsUnlocked || saveData.merchantCinematicShown;

    // Clear existing boost interval if any
    if (boostSpawnInterval) {
        clearInterval(boostSpawnInterval);
        boostSpawnInterval = null;
    }
    // Restart boost spawning if unlocked
    if (boostCoinsUnlocked) {
        boostSpawnInterval = setInterval(spawnBoostCoin, 60000);
        boostCycleIndex = saveData.boostCycleIndex || 0; // Restore cycle position
    }

    // Load active boosts
    activeBoosts = saveData.activeBoosts || {};
    formatSliderValues();

    if (!musicManager.isMusicOn) {
        document.querySelector('.music-controls').style.display = 'none';
        document.getElementById('now-playing').style.display = 'none';
    } else {
        document.querySelector('.music-controls').style.display = 'flex'; // Keep as flex
        document.getElementById('now-playing').style.display = 'block';
    }
    cleanUpLogs();
	
	// Add Automation Core generation
	if (saveData.infuseUpgrades?.[2]?.level >= 1) {
	    if (automationCoreInterval)
	        clearInterval(automationCoreInterval);
	    automationCoreInterval = setInterval(generateAutomationCores, 1000);
	}
	
	if (typeof saveData.automationCores === 'undefined') {
	    saveData.automationCores = 0;
	}
	if (!saveData.automationUpgrades) {
	    saveData.automationUpgrades = {};
	}
}

function startGame() {
	const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    if (JSON.parse(localStorage.getItem('disableCoinSpawning') || 'false')) {
        clearInterval(window.spawnInterval);
    }

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
	if (automationCoreInterval) {
		clearInterval(automationCoreInterval);
		automationCoreInterval = null;
	}
	if (saveData.infuseUpgrades?.[2]?.level >= 1) {
	    automationCoreInterval = setInterval(generateAutomationCores, 1000);
	}

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

    // Create magnet indicator if it doesn't exist
    if (beachContainer && !document.getElementById('magnet-indicator')) {
        const magnetIndicator = document.createElement('div');
        magnetIndicator.id = 'magnet-indicator';
        magnetIndicator.className = 'magnet-indicator';
        beachContainer.appendChild(magnetIndicator);
    }

    requestAnimationFrame(updateMagnetIndicator);

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

    if (boostCoinsUnlocked && !boostSpawnInterval) {
        boostSpawnInterval = setInterval(spawnBoostCoin, 60000);
    }
}

function spawnCoin() {
    if (!gameActive)
        return;

    // Get current spawn rate
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const upgradeLevel = saveData.upgrades?.[1]?.level || 0;
    const spawnRateMultiplier = Math.pow(0.9, upgradeLevel);

    // Check if max capacity is reached
    if (activeCoins.length + document.querySelectorAll('.boost-coin').length >= MAX_COIN_CAPACITY) {
        // Remove the oldest coin
        const oldestCoin = activeCoins.shift();
        if (oldestCoin) {
            oldestCoin.remove();
        }
    }

    // Track spawn attempt
    const spawnID = setTimeout(() => {
        const coin = document.createElement('div');
        coin.className = 'coin';

        // Track active boosts at spawn time
        const now = Date.now();
        let isBoostedCoin = false;
        let isBoostedXP = false;

        // Check if the boost was active at spawn time
        if (activeBoosts['coins'] > now) {
            coin.classList.add('boosted-coin'); // Add visual effect
            coin.dataset.boostMultiplier = "3"; // Store boost value for later use
            isBoostedCoin = true;
        } else {
            coin.dataset.boostMultiplier = "1"; // No boost, normal value
        }

        if (activeBoosts['xp'] > now) {
            coin.classList.add('boosted-xp'); // Add visual effect
            coin.dataset.xpMultiplier = "3"; // Store XP boost value for later use
            isBoostedXP = true;
        } else {
            coin.dataset.xpMultiplier = "1"; // No boost, normal value
        }

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
                    return;
                coin.classList.add('collectable');
                addHoverEffect(coin);
            }, 100);
        });

        // Remove spawn ID from tracking after completion
        activeSpawns = activeSpawns.filter(id => id !== spawnID);
    }, Math.random() * 100); // Small random delay for spawn staggering

    // Track this spawn attempt
    activeSpawns.push(spawnID);

    if (saveData.hasPlatinumUnlocked && !isPlatinumSpawning) {
        let spawnPlatinum = false;
        const now = Date.now();
        const forgeUpg5Level = saveData.forgeUpgrades?.[5]?.level || 0;

        if (activeBoosts['platinum'] && now < activeBoosts['platinum']) {
            spawnPlatinum = true; // 100% chance during boost
        } else if (forgeUpg5Level >= 10) {
            spawnPlatinum = true; // 100% chance if forgeUpg5 is maxed
        } else {
            const baseChance = 0.1; // 10%
            const chance = baseChance + (forgeUpg5Level * 0.09);
            spawnPlatinum = Math.random() < chance;
        }

        if (spawnPlatinum) {
            isPlatinumSpawning = true; // Set the flag
            spawnPlatinumCoin();
        }
    }
}

function spawnPlatinumCoin() {
    if (!gameActive)
        return;
    if (!JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`))?.hasPlatinumUnlocked)
        return;

    const allCoins = [
        ...activeCoins,
        ...activeBoostCoins,
        ...document.querySelectorAll('.special-coin'),
        ...document.querySelectorAll('.platinum-coin')
    ];

    if (allCoins.length >= MAX_COIN_CAPACITY) {
        const platinumCoins = document.querySelectorAll('.platinum-coin');
        if (platinumCoins.length > 0) {
            const oldestPlatinum = platinumCoins[0];
            oldestPlatinum.remove();

            const index = activeCoins.indexOf(oldestPlatinum);
            if (index !== -1) {
                activeCoins.splice(index, 1);
            }
        } else {
            return;
        }
    }

    const platinumCoin = document.createElement('div');
    platinumCoin.className = 'platinum-coin collectable';
    platinumCoin.style.position = 'absolute';
    platinumCoin.style.cursor = 'pointer';

    const now = Date.now();
    if (activeBoosts['platinum'] && now < activeBoosts['platinum']) {
        platinumCoin.classList.add('boosted-platinum');
    }

    const startX = Math.random() * (beachContainer.offsetWidth - 50);
    platinumCoin.style.left = `${startX}px`;
    platinumCoin.style.top = '-60px';
    beachContainer.appendChild(platinumCoin);

    requestAnimationFrame(() => {
        platinumCoin.style.transition = 'top 1s ease-out, left 1.5s ease-out';
        const endX = startX + (Math.random() * 100 - 50);
        const endY = Math.random() * (beachContainer.offsetHeight - 50) + 20;
        platinumCoin.style.left = `${endX}px`;
        platinumCoin.style.top = `${endY}px`;
    });

    platinumCoin.addEventListener('click', collectPlatinumCoin);
    platinumCoin.addEventListener('mouseenter', collectPlatinumCoin);

    // Add to activeCoins array for tracking
    activeCoins.push(platinumCoin);

    isPlatinumSpawning = false;
}

function collectPlatinumCoin(event) {
    const coin = event.target;
    if (coin.classList.contains('collected'))
        return;
    coin.classList.add('collected');

    // Play sound if enabled
    if (!disableSound.checked) {
        const sound = new Audio('Sounds/platinum_coin_pickup.mp3');
        sound.volume = 0.3;
        sound.play().catch(() => {});
    }

    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const baseValue = 1;
    const multiplier = getPlatinumCoinValueMultiplier();

    saveData.platinumCoins = (saveData.platinumCoins || 0) + (baseValue * multiplier);
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

    // Animation handling
    if (!disableAnimation.checked) {
        setTimeout(() => coin.remove(), 500);
    } else {
        coin.remove();
    }
}

function formatNumber(number, isXP = false, isEffect = false) {
    if (JSON.parse(localStorage.getItem('disableFormattedNumbers') || 'false')) {
        return number.toLocaleString();
    }

    const num = Number(number);

    // Effect display specific formatting (normal formatting kicks in after 1e6)
    if (isEffect) {
        if (num < 100) {
            return num.toFixed(2);
        } else if (num < 1000) {
            return num.toFixed(1);
        } else if (num < 1e6) {
            return Math.floor(num).toLocaleString();
        }
    }

    if (useScientificNotation || isXP) {
        return num >= 1e6 ? num.toExponential(3).replace(/e\+?/, 'e') : num.toFixed(isXP ? 1 : 0);
    }

    if (num < 1e6)
        return num.toLocaleString();

    const suffixes = [{
            value: 1e303,
            suffix: 'Ce'
        }, {
            value: 1e300,
            suffix: 'NoNg'
        }, {
            value: 1e297,
            suffix: 'OcNg'
        }, {
            value: 1e294,
            suffix: 'SpNg'
        }, {
            value: 1e291,
            suffix: 'SxNg'
        }, {
            value: 1e288,
            suffix: 'QnNg'
        }, {
            value: 1e285,
            suffix: 'QdNg'
        }, {
            value: 1e282,
            suffix: 'TNg'
        }, {
            value: 1e279,
            suffix: 'DNg'
        }, {
            value: 1e276,
            suffix: 'UNg'
        }, {
            value: 1e273,
            suffix: 'Ng'
        }, {
            value: 1e270,
            suffix: 'NoOg'
        }, {
            value: 1e267,
            suffix: 'OcOg'
        }, {
            value: 1e264,
            suffix: 'SpOg'
        }, {
            value: 1e261,
            suffix: 'SxOg'
        }, {
            value: 1e258,
            suffix: 'QnOg'
        }, {
            value: 1e255,
            suffix: 'QdOg'
        }, {
            value: 1e252,
            suffix: 'TOg'
        }, {
            value: 1e249,
            suffix: 'DOg'
        }, {
            value: 1e246,
            suffix: 'UOg'
        }, {
            value: 1e243,
            suffix: 'Og'
        }, {
            value: 1e240,
            suffix: 'NoSg'
        }, {
            value: 1e237,
            suffix: 'OcSg'
        }, {
            value: 1e234,
            suffix: 'SpSg'
        }, {
            value: 1e231,
            suffix: 'SxSg'
        }, {
            value: 1e228,
            suffix: 'QnSg'
        }, {
            value: 1e225,
            suffix: 'QdSg'
        }, {
            value: 1e222,
            suffix: 'TSg'
        }, {
            value: 1e219,
            suffix: 'DSg'
        }, {
            value: 1e216,
            suffix: 'USg'
        }, {
            value: 1e213,
            suffix: 'Sg'
        }, {
            value: 1e210,
            suffix: 'Nosg'
        }, {
            value: 1e207,
            suffix: 'Ocsg'
        }, {
            value: 1e204,
            suffix: 'Spsg'
        }, {
            value: 1e201,
            suffix: 'Sxsg'
        }, {
            value: 1e198,
            suffix: 'Qnsg'
        }, {
            value: 1e195,
            suffix: 'Qdsg'
        }, {
            value: 1e192,
            suffix: 'Tsg'
        }, {
            value: 1e189,
            suffix: 'Dsg'
        }, {
            value: 1e186,
            suffix: 'Usg'
        }, {
            value: 1e183,
            suffix: 'sg'
        }, {
            value: 1e180,
            suffix: 'NoQg'
        }, {
            value: 1e177,
            suffix: 'OcQg'
        }, {
            value: 1e174,
            suffix: 'SpQg'
        }, {
            value: 1e171,
            suffix: 'SxQg'
        }, {
            value: 1e168,
            suffix: 'QnQg'
        }, {
            value: 1e165,
            suffix: 'QdQg'
        }, {
            value: 1e162,
            suffix: 'TQg'
        }, {
            value: 1e159,
            suffix: 'DQg'
        }, {
            value: 1e156,
            suffix: 'UQg'
        }, {
            value: 1e153,
            suffix: 'Qg'
        }, {
            value: 1e150,
            suffix: 'Noqg'
        }, {
            value: 1e147,
            suffix: 'Ocqg'
        }, {
            value: 1e144,
            suffix: 'Spqg'
        }, {
            value: 1e141,
            suffix: 'Sxqg'
        }, {
            value: 1e138,
            suffix: 'Qnqg'
        }, {
            value: 1e135,
            suffix: 'Qdqg'
        }, {
            value: 1e132,
            suffix: 'Tqg'
        }, {
            value: 1e129,
            suffix: 'Dqg'
        }, {
            value: 1e126,
            suffix: 'Uqg'
        }, {
            value: 1e123,
            suffix: 'qg'
        }, {
            value: 1e120,
            suffix: 'NoTg'
        }, {
            value: 1e117,
            suffix: 'OcTg'
        }, {
            value: 1e114,
            suffix: 'SpTg'
        }, {
            value: 1e111,
            suffix: 'SxTg'
        }, {
            value: 1e108,
            suffix: 'QnTg'
        }, {
            value: 1e105,
            suffix: 'QdTg'
        }, {
            value: 1e102,
            suffix: 'TTg'
        }, {
            value: 1e99,
            suffix: 'DTg'
        }, {
            value: 1e96,
            suffix: 'UTg'
        }, {
            value: 1e93,
            suffix: 'Tg'
        }, {
            value: 1e90,
            suffix: 'NoVt'
        }, {
            value: 1e87,
            suffix: 'OcVt'
        }, {
            value: 1e84,
            suffix: 'SpVt'
        }, {
            value: 1e81,
            suffix: 'SxVt'
        }, {
            value: 1e78,
            suffix: 'QnVt'
        }, {
            value: 1e75,
            suffix: 'QdVt'
        }, {
            value: 1e72,
            suffix: 'TVt'
        }, {
            value: 1e69,
            suffix: 'DVt'
        }, {
            value: 1e66,
            suffix: 'UVt'
        }, {
            value: 1e63,
            suffix: 'Vt'
        }, {
            value: 1e60,
            suffix: 'NoDe'
        }, {
            value: 1e57,
            suffix: 'OcDe'
        }, {
            value: 1e54,
            suffix: 'SpDe'
        }, {
            value: 1e51,
            suffix: 'SxDe'
        }, {
            value: 1e48,
            suffix: 'QnDe'
        }, {
            value: 1e45,
            suffix: 'QdDe'
        }, {
            value: 1e42,
            suffix: 'TDe'
        }, {
            value: 1e39,
            suffix: 'DDe'
        }, {
            value: 1e36,
            suffix: 'UDe'
        }, {
            value: 1e33,
            suffix: 'De'
        }, {
            value: 1e30,
            suffix: 'No'
        }, {
            value: 1e27,
            suffix: 'Oc'
        }, {
            value: 1e24,
            suffix: 'Sp'
        }, {
            value: 1e21,
            suffix: 'Sx'
        }, {
            value: 1e18,
            suffix: 'Qn'
        }, {
            value: 1e15,
            suffix: 'Qd'
        }, {
            value: 1e12,
            suffix: 'T'
        }, {
            value: 1e9,
            suffix: 'B'
        }, {
            value: 1e6,
            suffix: 'M'
        }
    ];

    for (const {
        value,
        suffix
    }
        of suffixes) {
        if (num >= value) {
            const divided = num / value;
            const leadingDigits = Math.floor(divided).toString().length;
            let decimals;
            if (leadingDigits === 1)
                decimals = 3;
            else if (leadingDigits === 2)
                decimals = 2;
            else
                decimals = 1;

            return divided.toFixed(decimals) + suffix;
        }
    }
    return num.toLocaleString();
}

// Add to settings initialization
document.getElementById('notation-toggle').addEventListener('click', toggleNotation);
updateNotationButton();

function toggleNotation() {
    useScientificNotation = !useScientificNotation;
    localStorage.setItem('useScientificNotation', useScientificNotation);
    updateNotationButton();
    refreshAllDisplays();
}

function updateNotationButton() {
    const btn = document.getElementById('notation-toggle');
    btn.textContent = `Notation: ${useScientificNotation ? 'Scientific' : 'Standard'}`;

    // Initialize with correct state
    if (localStorage.getItem('useScientificNotation') === null) {
        localStorage.setItem('useScientificNotation', 'false');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('useScientificNotation') === null) {
        localStorage.setItem('useScientificNotation', 'false');
    }
    useScientificNotation = localStorage.getItem('useScientificNotation') === 'true';
    updateNotationButton();
});

function refreshAllDisplays() {
    // Force reload fresh data
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};

    // Update all displays with validated numbers
    updateCoinDisplay();
    updateXPDisplay();
    updateMerchantDisplay();
    updateEffectsDisplay();

    // Force redraw any active coins
    document.querySelectorAll('.coin').forEach(coin => {
        coin.style.transform = coin.style.transform; // Trigger reflow
    });
}

function spawnBoostCoin() {
    if (!gameActive || activeCoins.length + activeBoostCoins.length >= MAX_COIN_CAPACITY) {
        return;
    }

    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const hasSpecialCoinsUpgrade = (saveData.upgrades?.[2]?.level || 0) >= 1;
    const hasPlatinumUnlocked = saveData.hasPlatinumUnlocked || false;
    const forgeUpg5Level = saveData.forgeUpgrades?.[5]?.level || 0;
    const canSpawnPlatinumBoost = hasPlatinumUnlocked && forgeUpg5Level < 10;

    let availableBoostTypes = hasSpecialCoinsUpgrade ? [...BOOST_CYCLE] : ['coins'];
    if (canSpawnPlatinumBoost) {
        availableBoostTypes.push('platinum');
    }

    // Determine boost type from cycle
    const boostType = availableBoostTypes[boostCycleIndex % availableBoostTypes.length];
    boostCycleIndex++; // Move to next position in cycle

    const boostCoin = document.createElement('div');
    boostCoin.className = 'boost-coin';

    // Apply boost-specific class and styles
    const boostConfig = BOOST_TYPES[boostType];
    if (boostConfig) {
        boostCoin.classList.add(boostConfig.class);
        boostCoin.style.setProperty('--boost-color', boostConfig.color);
    }
    boostCoin.dataset.boostType = boostType;

    // Check total coins (regular + active boosts)
    const totalCoins = activeCoins.length + activeBoostCoins.length;
    if (totalCoins >= MAX_COIN_CAPACITY)
        return;

    const startX = Math.random() * (beachContainer.offsetWidth - 50);
    boostCoin.style.left = `${startX}px`;
    boostCoin.style.top = '-60px';
    beachContainer.appendChild(boostCoin);

    // Add to tracking array
    activeBoostCoins.push(boostCoin);

    // Force layout recalculation
    void boostCoin.offsetHeight;

    // Animate with transition
    boostCoin.style.transition = 'top 1s ease-out, left 1.5s ease-out';

    // Random end position within container bounds
    const endX = Math.max(10, Math.min(
                startX + (Math.random() * 100 - 50),
                beachContainer.offsetWidth - 50));
    const endY = Math.random() * (beachContainer.offsetHeight - 50) + 20;

    boostCoin.style.left = `${endX}px`;
    boostCoin.style.top = `${endY}px`;

    // Enable collection after 300ms
    setTimeout(() => {
        boostCoin.classList.add('collectable');
    }, 300);

    // Auto-remove after 5 seconds
    const removeTimer = setTimeout(() => {
        boostCoin.classList.add('death');
        setTimeout(() => {
            boostCoin.remove();
            const index = activeBoostCoins.indexOf(boostCoin);
            if (index !== -1) {
                activeBoostCoins.splice(index, 1);
            }
        }, 500); // Match animation duration
    }, 5000);

    // Add collection handler
    boostCoin.addEventListener('click', (e) => {
        e.preventDefault();
        collectBoostCoin(boostCoin);
    });
    boostCoin.addEventListener('touchstart', (e) => {
        e.preventDefault();
        collectBoostCoin(boostCoin);
    });
    boostCoin.addEventListener('mouseenter', () => collectBoostCoin(boostCoin));
}

function collectBoostCoin(coin) {
    if (coin.classList.contains('collected'))
        return; // Early exit if already collected
    coin.classList.add('collected'); // Mark as collected immediately

    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const now = Date.now();

    // Determine boost type from dataset instead of class
    const boostType = coin.dataset.boostType || 'coins'; // Default to coins if not set
    const duration = 30000; // 30 seconds

    // Add boost to active boosts
    activeBoosts[boostType] = now + duration;

    if (!disableSound.checked) {
        const boostSound = new Audio('Sounds/boost_coin_pickup.mp3');
        boostSound.play();
    }

    // Create text popup
    const popup = document.createElement('div');
    popup.className = 'boost-popup';
    popup.textContent =
        boostType === 'coins' ? '3x Coins 30s' :
        boostType === 'xp' ? '3x XP 30s' :
        '100% Plat Chance 30s';
    popup.style.left = `${coin.offsetLeft}px`;
    popup.style.top = `${coin.offsetTop}px`;
    beachContainer.appendChild(popup);

    // Animate popup
    setTimeout(() => {
        popup.style.transform = 'translateY(-50px)';
        popup.style.opacity = '0';
    }, 500);

    // Remove popup after animation
    setTimeout(() => popup.remove(), 3000);

    // Remove coin after animation
    setTimeout(() => {
        coin.remove();
        const index = activeBoostCoins.indexOf(coin);
        if (index !== -1) {
            activeBoostCoins.splice(index, 1);
        }
    }, 300);

    // Update effects display immediately
    updateEffectsDisplay();

    // Save updated boost state
    const updatedData = {
        ...saveData,
        activeBoosts: activeBoosts, // Save active boosts
        boostCycleIndex: boostCycleIndex, // Save cycle position
        boostsUnlocked: true,
        timestamp: Date.now()
    };
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(updatedData));
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
            activeCoins.splice(coinIndex, 1);
        }

        // Play sound if enabled
        if (!disableSound.checked) {
            const coinSound = document.createElement('audio');
            coinSound.src = document.getElementById('coin-sound').src;
            coinSound.volume = 0.3;
            coinSound.play().catch(() => {});
        }

        // Get current save data
        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};

        // Animation handling
        if (!disableAnimation.checked) {
            coin.style.transform = 'scale(2) translateY(-20px)';
            coin.style.opacity = '0';
            setTimeout(() => coin.remove(), 500);
        } else {
            coin.remove();
        }

        if (coinCount >= 10000 && (saveData.level || 0) >= 31) {
            updateGoalDisplay(); // force update the goal text for the Forge goal text
        }

        let currentXP = Number(saveData.xp) || 0;
        let currentLevel = Number(saveData.level) || 0;
        let xpNeeded = Number(saveData.xpNeeded) || 10;

        // Read multipliers from dataset (only applied if coin had a boost at spawn)
        let coinMultiplier = parseFloat(coin.dataset.boostMultiplier) || 1;
        let xpMultiplier = parseFloat(coin.dataset.xpMultiplier) || 1;

        // Apply permanent upgrades
        coinMultiplier *= getCoinValueMultiplier();
        xpMultiplier *= getXPMultiplier();

        // Update coin count and XP
        coinCount += 1 * coinMultiplier;
        updateCoinDisplay();

        previousLevel = saveData.level || 0;

        const hasSpecialCoins = (saveData.upgrades?.[2]?.level || 0) >= 1;

        if (hasSpecialCoins) {
            if (typeof saveData.xp === 'undefined') {
                saveData.xp = 0;
                saveData.level = 0;
                saveData.xpNeeded = 10;
            }

            saveData.xp += 1 * xpMultiplier;

            while (saveData.xp >= saveData.xpNeeded) {
                saveData.xp -= saveData.xpNeeded;
                saveData.level += 1;
                saveData.xpNeeded = 10 * Math.pow(1.1, saveData.level);
            }

            updateXPDisplay(saveData.xp, saveData.level, saveData.xpNeeded);

            const levelsGained = saveData.level - previousLevel;
            for (let i = 0; i < levelsGained; i++) {
                // Check if we're at max capacity before spawning special coin
                const currentCoinCount = activeCoins.length + activeBoostCoins.length +
                    document.querySelectorAll('.special-coin').length +
                    document.querySelectorAll('.platinum-coin').length;

                if (currentCoinCount >= MAX_COIN_CAPACITY) {
                    // Add special coin directly to inventory
                    saveData.specialCoins = (saveData.specialCoins || 0) + 1;
                } else {
                    spawnSpecialCoin();
                }
            }
        }

        const updatedData = {
            ...saveData,
            coins: coinCount,
            merchantCinematicShown: merchantCinematicShown,
            timestamp: saveData.timestamp || Date.now()
        };

        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(updatedData));

        coin.style.transform = 'scale(2) translateY(-20px)';
        coin.style.opacity = '0';

        setTimeout(() => coin.remove(), 500);

        const slot = saveSlots.find(s => s.id === currentSlotId);
        if (slot) {
            slot.data = updatedData;
            initializeSaveSlots();
        }

        if (coinCount < currentGoal || !merchantCinematicShown) {
            updateGoalDisplay();
        }
        refreshAllDisplays();
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
    if (JSON.parse(localStorage.getItem('disableSpecialSpawning') || 'false'))
        return;

    // Check current active coins (regular, boost, uncollected special)
    const currentRegular = activeCoins.length;
    const currentBoost = activeBoostCoins.length;
    const currentSpecial = document.querySelectorAll('.special-coin:not(.collected)').length;
    const currentPlatinum = document.querySelectorAll('.platinum-coin:not(.collected)').length;
    const totalCoins = currentRegular + currentBoost + currentSpecial + currentPlatinum;

    if (totalCoins >= MAX_COIN_CAPACITY) {
        return; // Do not spawn if capacity is reached
    }

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

        // Play sound if enabled
        if (!disableSound.checked) {
            const specialCoinSound = document.getElementById('special-coin-sound').cloneNode(true);
            specialCoinSound.volume = 0.6;
            specialCoinSound.play().catch(() => {});
        }

        // Update special coin count
        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
        saveData.specialCoins = (saveData.specialCoins || 0) + 1;
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

        // Animation handling
        if (!disableAnimation.checked) {
            setTimeout(() => coin.remove(), 600);
        } else {
            coin.remove();
        }
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

function getXPMultiplier() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const wisdomBoost = saveData.specialUpgrades?.[1]?.level || 0;
    const educatedCoins = saveData.upgrades?.[3]?.level || 0;
    const emberWisdom = saveData.forgeUpgrades?.[4]?.level || 0;
    const arcaneKnowledge = saveData.infuseUpgrades?.[1]?.level || 0;
    const wisdomFlow = saveData.upgrades?.[11]?.level || 0;
    const arcaneMastery = saveData.upgrades?.[13]?.level || 0;
    let multiplier = 1;
    
    multiplier *= Math.pow(1.25, wisdomBoost);
    multiplier *= Math.pow(1.1, educatedCoins);
    multiplier *= Math.pow(1.1, emberWisdom);
    multiplier *= Math.pow(1.1, wisdomFlow);
    multiplier *= Math.pow(1.5, arcaneMastery);
    if (arcaneKnowledge >= 1) {
        multiplier *= 3;
    }
    multiplier *= getPlatinumXPMultiplier();

    return multiplier;
}

function getCoinValueMultiplier() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const specialUpgrade2 = saveData.specialUpgrades?.[2] || {
        level: 0
    };
    const forgeUpgrade3 = saveData.forgeUpgrades?.[3] || {
        level: 0
    };
    const playerLevel = saveData.level || 0;
    const moltenCoins = saveData.moltenCoins || 0;
    const moltenMasteryLevel = saveData.forgeUpgrades?.[6]?.level || 0;

    let multiplier = (
        Math.pow(1.25, specialUpgrade2.level) *
        Math.pow(1.1, playerLevel) *
        Math.pow(1.1, forgeUpgrade3.level));

    if (moltenMasteryLevel >= 1) {
        const moltenMasteryBonus = calculateMoltenMasteryBonus(moltenCoins);
        multiplier *= moltenMasteryBonus;
    }

    return multiplier * getPlatinumCoinValueMultiplier();
}

function getPlatinumCoinMultiplier() { // to clarify this function is for coins affected by platinum coin upgrades
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    return Math.pow(1.1, saveData.platinumUpgrades?.[2]?.level || 0);
}

function getPlatinumCoinValueMultiplier() { // this function is for platinum coin value
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const silverLining = Math.pow(1.1, saveData.upgrades?.[7]?.level || 0);
    const purifiedPlatinum = Math.pow(1.25, saveData.upgrades?.[9]?.level || 0);
    return silverLining * purifiedPlatinum;
}

function getPlatinumXPMultiplier() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    return Math.pow(2, saveData.platinumUpgrades?.[1]?.level || 0) *
    Math.pow(1.5, saveData.platinumUpgrades?.[4]?.level || 0);
}

function getMoltenCoinMultiplier() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const forgeEnhancement = Math.pow(1.25, saveData.upgrades?.[6]?.level || 0);
    const platinumBoost = Math.pow(1.25, saveData.platinumUpgrades?.[5]?.level || 0);
    return forgeEnhancement * platinumBoost;
}

function updateCoinDisplay() {
    // Round coin count before formatting
    const roundedCoins = Math.floor(coinCount);
    const formatted = formatNumber(roundedCoins);

    // Update game screen display
    document.querySelector('.coin-counter').textContent = `Coins: ${formatted}`;

    // Update merchant modal display
    const merchantDisplay = document.getElementById('merchant-coin-count');
    if (merchantDisplay) {
        merchantDisplay.textContent = formatted;
    }
}

function updateXPDisplay(currentXP = null, currentLevel = null, xpNeeded = null) {
    if (currentXP === null || currentLevel === null || xpNeeded === null) {
        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
        currentXP = Number(saveData.xp) || 0;
        currentLevel = Number(saveData.level) || 0;
        xpNeeded = Number(saveData.xpNeeded) || 10;
        if (coinCount >= 10000 && (saveData.level || 0) >= 31) {
            updateGoalDisplay();
        }
    }

    // Round XP values to one decimal place but ensure the format keeps the .0 if necessary
    const roundedXP = currentXP.toFixed(1);
    const roundedXPNeeded = xpNeeded.toFixed(1);

    // Format the numbers
    document.querySelector('.xp-current').textContent = formatNumber(roundedXP);
    document.querySelector('.xp-needed').textContent = `${formatNumber(roundedXPNeeded)} XP`;

    // Update the progress bar based on the rounded values
    const progressPercent = (parseFloat(roundedXP) / parseFloat(roundedXPNeeded)) * 100;
    document.querySelector('.xp-progress').style.width = `${progressPercent}%`;
    document.querySelector('.xp-level').textContent = currentLevel;
}

function updateMoltenCoins() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    if (saveData.upgrades?.[4]?.level >= 1) {
        const level = saveData.level || 0;
        const coins = saveData.coins || 0;

        // Base conversion (up to 1e12 coins)
        const baseCoins = Math.min(coins, 1e15);
        const baseMolten = baseCoins / 10000;

        // Diminishing returns conversion (coins beyond 1e12)
        const excessCoins = Math.max(coins - 1e12, 0);
        const excessMolten = excessCoins > 0 ? Math.pow(5, Math.log10(excessCoins)) : 0;

        // Apply level bonus and molten multiplier
        const levelBonus = level > 31 ?
            Math.pow(2, Math.floor((Math.min(level, 251) - 31) / 10)) :
            1;
        const moltenMultiplier = getMoltenCoinMultiplier();

        const totalMolten = Math.floor((baseMolten + excessMolten) * levelBonus * moltenMultiplier);

        // Update molten coins in save data
        saveData.moltenCoins = (saveData.moltenCoins || 0) + totalMolten;
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
    }
}

// Music System
const musicManager = {
    nextTrackHandler: null,
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
        const checkbox = document.getElementById('music-toggle');
        checkbox.checked = !this.isMusicOn; // Checkbox checked = music disabled
        this.updateToggleButton();

        if (!this.isMusicOn) {
            document.getElementById('now-playing').textContent = '';
        } else {
            this.playCurrent();
        }

        checkbox.addEventListener('change', () => this.toggleMusic());
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

        this.audio.removeEventListener('ended', this.nextTrackHandler);

        this.nextTrackHandler = () => this.playNext();
        this.audio.addEventListener('ended', this.nextTrackHandler);

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
        this.isMusicOn = !document.getElementById('music-toggle').checked;
        localStorage.setItem('musicEnabled', this.isMusicOn);
        this.updateToggleButton();

        const controls = document.querySelector('.music-controls');
        const nowPlaying = document.getElementById('now-playing');

        if (this.isMusicOn) {
            controls.style.display = 'flex';
            nowPlaying.style.display = 'block';
            this.playCurrent();
        } else {
            controls.style.display = 'none';
            nowPlaying.style.display = 'none';
            this.audio.pause();
        }
    },

    updateToggleButton() {
        const checkbox = document.getElementById('music-toggle');
        const label = document.getElementById('music-label');

        label.textContent = 'Disable Background Music';

        checkbox.checked = !this.isMusicOn;

        checkbox.parentElement.classList.toggle('off', !this.isMusicOn);
        checkbox.parentElement.classList.toggle('on', this.isMusicOn);
    }
};

// Initialize music when DOM loads
document.addEventListener('DOMContentLoaded', () => musicManager.init());

// Settings functionality
const settingsBtn = document.querySelector('.settings-btn');
const settingsModal = document.querySelector('.settings-modal');
const closeSettingsBtn = document.querySelector('.close-settings-btn');
const disableAnimation = document.getElementById('disable-animation');
const disableSound = document.getElementById('disable-sound');

// Initialize settings from localStorage
disableAnimation.checked = localStorage.getItem('disableAnimation') === 'true';
disableSound.checked = localStorage.getItem('disableSound') === 'true';

// Save settings changes
disableAnimation.addEventListener('change', () => {
    localStorage.setItem('disableAnimation', disableAnimation.checked);
});

disableSound.addEventListener('change', () => {
    localStorage.setItem('disableSound', disableSound.checked);
});
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
document.getElementById('music-toggle').checked = musicManager.isMusicOn;
document.getElementById('music-label').textContent = musicManager.isMusicOn ? 'Disable Background Music' : 'Disable Background Music';

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

document.addEventListener('DOMContentLoaded', function () {
    useScientificNotation = localStorage.getItem('useScientificNotation') === 'true';
    const notationToggle = document.getElementById('notation-toggle');
    if (notationToggle) {
        notationToggle.checked = useScientificNotation;
    }
    refreshAllDisplays();
});

document.getElementById('notation-toggle').addEventListener('change', function () {
    useScientificNotation = this.checked;
    localStorage.setItem('useScientificNotation', useScientificNotation);
    refreshAllDisplays();
});

function formatSliderValues() {
    // Get the elements
    const coinCapacityValue = document.getElementById('coinCapacityValue');
    const minCapacityLabel = document.getElementById('minCapacityLabel');
    const maxCapacityLabel = document.getElementById('maxCapacityLabel');

    // Format the numbers
    coinCapacityValue.textContent = formatNumber(parseInt(coinCapacityValue.textContent));
    minCapacityLabel.textContent = formatNumber(parseInt(minCapacityLabel.textContent));
    maxCapacityLabel.textContent = formatNumber(parseInt(maxCapacityLabel.textContent));
}

document.getElementById('coinCapacitySlider').addEventListener('input', function (e) {
    const value = parseInt(e.target.value);
    const formattedValue = formatNumber(value);
    document.getElementById('coinCapacityValue').textContent = formattedValue;
});

function updateGoalDisplay() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const goalMessage = document.querySelector('.goal-message');
    const hasSpecialCoinsUpgrade = (saveData.upgrades?.[2]?.level || 0) >= 1;
    const specialDialogue = merchantDialogues.introduction.options[4];
    const hasForgeUpgrade = (saveData.upgrades?.[4]?.level || 0) >= 1;
    const meetsForgeRequirements = coinCount >= 10000 && (saveData.level || 0) >= 31;
    const platinumDialogue = merchantDialogues.introduction.options[6]; // ID 7 is index 6

    // Track if the player has ever reached 10 coins
    const hasReached10Coins = saveData.hasReached10Coins || false;

    // Update the flag if the player reaches 10 coins
    if (coinCount >= 10 && !hasReached10Coins) {
        saveData.hasReached10Coins = true;
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
    }

    // Check if first 4 dialogues are completed (excluding mysterious ones)
    const initialDialoguesCompleted = merchantDialogues.introduction.options
        .slice(0, 4) // Only check first 4 dialogues
        .every(opt => opt.completed);

    let shouldBounce = true;

    // 1. Check for merchant cinematic trigger
    if (!merchantCinematicShown && coinCount >= currentGoal) {
        startMerchantCinematic();
        goalMessage.style.display = 'none';
        return;
    }

    // 2. Check for forge requirements
    if (!hasForgeUpgrade && meetsForgeRequirements) {
        goalMessage.innerHTML = '"I wonder if the merchant has anything new I can check out<br>since I have so many coins and levels now.."';
        goalMessage.style.display = 'block';
        goalMessage.classList.toggle('bounce', shouldBounce);
        return;
    }

    // 3. Check for platinum dialogue state
    if (saveData.hasPlatinumUnlocked && !platinumDialogue.completed) {
        goalMessage.innerHTML = '"I wonder how platinum coins work..<br>maybe I should go ask the merchant.."';
        goalMessage.style.display = 'block';
        goalMessage.classList.toggle('bounce', shouldBounce);
        return;
    }

    // 4. Check for special coins state
    if (hasSpecialCoinsUpgrade && !specialDialogue.completed) {
        goalMessage.innerHTML = '"Maybe the merchant can explain what these special coins are.."';
        goalMessage.style.display = 'block';
        goalMessage.classList.toggle('bounce', shouldBounce);
        return;
    }

    // 5. Check if player has fewer than 10 coins AND has never reached 10 coins before
    if (coinCount < 10 && !hasReached10Coins) {
        goalMessage.innerHTML = '"Hmm.. I wonder what would happen<br>if I collected some of these coins..."';
        goalMessage.style.display = 'block';
        shouldBounce = false;
        goalMessage.classList.toggle('bounce', shouldBounce);
        return;
    }

    // 6. Check if the merchant cinematic has been shown but the player hasn't completed the initial 4 dialogues
    if (merchantCinematicShown && !initialDialoguesCompleted) {
        goalMessage.innerHTML = '"Maybe I should go talk to the merchant..<br>he can answer some of my questions.."';
        goalMessage.style.display = 'block';
        goalMessage.classList.toggle('bounce', shouldBounce);
        return;
    }

    // 7. Default fallback
    goalMessage.innerHTML = '"Guess I\'ll keep collecting coins for now.."';
    goalMessage.style.display = 'block';
    shouldBounce = false;
    goalMessage.classList.toggle('bounce', shouldBounce);
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
        boostsUnlocked: boostCoinsUnlocked,
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
        clearInterval(boostSpawnInterval);

        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};

        // Update the save data with ALL necessary fields
        const updatedData = {
            ...saveData, // Preserve existing data
            boostsUnlocked: true, // Set the boost flag
            merchantCinematicShown: true,
            coins: coinCount,
            timestamp: Date.now()
        };

        // Save the updated data
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(updatedData));
        boostCoinsUnlocked = true;

        // Clear active timeouts
        activeSpawns.forEach(id => {
            clearTimeout(id); // Changed from cancelAnimationFrame
        });
        activeSpawns = [];

        // Start spawning systems
        applyUpgradeEffects();
        if (!boostSpawnInterval) {
            boostSpawnInterval = setInterval(spawnBoostCoin, 60000);
        }

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

        // Start boost spawning
        if (!boostSpawnInterval) {
            boostSpawnInterval = setInterval(spawnBoostCoin, 60000);
        }
    };

    // Audio handling
    const windSound = document.getElementById('wind-sound');
    windSound.play();
    musicManager.audio.pause();
}

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

    // Render existing upgrades
    Object.values(upgrades).forEach(upg => {
        const upgradeData = saveData.upgrades?.[upg.id] || {
            level: 0
        };
        const currentLevel = upgradeData.level;

        // Special handling for Forge upgrade (ID 4)
        const isForgeUpgrade = upg.id === 4;
        const forgeRequirementsMet = isForgeUpgrade ?
            coinCount >= 10000 && (saveData.level || 0) >= 31 :
            true;

        const isPlatinumUpgrade = upg.id === 5;
        const platinumRequirementsMet = isPlatinumUpgrade ?
            saveData.hasPlatinumUnlocked :
            true;

        const isInfuseUpgrade = upg.id === 8;
        const isAutomationUpgrade = upg.id === 9;
        const isTimeMachineUpgrade = upg.id === 10;

        const isLocked = upg.mysterious && currentLevel === 0 &&
            (isForgeUpgrade ? !forgeRequirementsMet :
                isPlatinumUpgrade ? !platinumRequirementsMet :
                isInfuseUpgrade ? !(coinCount >= upg.requirements.coins && (saveData.level || 0) >= upg.requirements.level) :
                (isAutomationUpgrade || isTimeMachineUpgrade) ? !upg.requirement(saveData) :
                coinCount < upg.baseCost);

        const isMaxed = currentLevel >= upg.maxLevel;
        const isSpecialUpgrade = upg.id === 2;

        // Cost calculation remains the same
        const cost = isLocked ? upg.baseCost : Math.floor(upg.scaling(upg.baseCost, currentLevel));
        const canAfford = Math.floor(coinCount) >= cost;

        // Determine status text
        let statusText;
        if (isMaxed) {
            statusText = upg.maxLevel === 1 ? `${upg.upgName} - PURCHASED` : `${upg.upgName} - MAXED`;
        } else {
            statusText = upg.maxLevel > 1 ? `${upg.upgName} (Level ${currentLevel}/${upg.maxLevel})` : upg.upgName;
        }

        const buttonText = isLocked ?
            (isInfuseUpgrade ? upg.reqText :
                isAutomationUpgrade || isTimeMachineUpgrade ? "Req: ???" :
`Req: ${formatNumber(upg.baseCost)} Coins`) :
            (isInfuseUpgrade || isAutomationUpgrade || isTimeMachineUpgrade || isPlatinumUpgrade || isForgeUpgrade) && cost === 0 ?
            'Unlock' :
`Cost: ${formatNumber(cost)} Coins`;

        const upgradeHTML = `
    <div class="upgrade-item ${isLocked ? 'mysterious-upgrade' : ''} ${isSpecialUpgrade ? 'special-coins-upgrade' : ''}">
        <div class="upgrade-header">
            <h3>${isLocked ? '???' : statusText}</h3>
            ${!isMaxed ? `
                <button class="buy-btn" 
                    data-upgrade-id="${upg.id}"
                    ${!canAfford || (isForgeUpgrade && !forgeRequirementsMet) || isLocked ? 'disabled' : ''}>
                    ${isForgeUpgrade && isLocked ? upg.reqText : buttonText}
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

        container.innerHTML += upgradeHTML;

        // Add Forge section if purchased
        if (isForgeUpgrade && currentLevel >= 1) {
            container.innerHTML += `
			<div class="forge-section">
				<div class="forge-header">
					- Reset all progress up to this point for molten coins<br>
					- Forge ${formatNumber(10000)} normal coins into one molten coin*<br>
					- 2x molten coins every 10 levels after level 31*<br>
					- Unlock a special rare new currency<br>
					- Unlock powerful new upgrades<br>
					<div class="molten-coin-balance">
						<img src="Images/molten_coin.png" alt="molten coin" class="molten-coin-icon">
						Molten Coins: ${formatNumber(Math.floor(saveData.moltenCoins || 0))}
					</div>
				</div>
				<button class="forge-btn">
					Forge +<span class="forge-amount">0</span>
				</button>
				<div class="forge-upgrades-grid">
    ${Object.values(forgeUpgrades).map(forgeUpg => {
                const currentLevel = saveData.forgeUpgrades?.[forgeUpg.id]?.level || 0;
                const cost = Math.floor(forgeUpg.scaling(forgeUpg.baseCost, currentLevel));
                const canAfford = (saveData.moltenCoins || 0) >= cost;

                return `
    <div class="forge-upgrade-placeholder">
        <div class="forge-upgrade">
            <div class="forge-upgrade-header">
                <h4>${forgeUpg.name} (${currentLevel}/${forgeUpg.levelCap})</h4>
                ${currentLevel < forgeUpg.levelCap ? `
                    <button class="buy-forge-btn" 
                        ${canAfford ? '' : 'disabled'}
                        data-upgrade-id="${forgeUpg.id}">
                        ${formatNumber(cost)} MC
                    </button>
                ` : '<span class="forge-upgrade-maxed">MAXED</span>'}
            </div>
            <p>${forgeUpg.desc}</p>
            ${forgeUpg.id === 6 && currentLevel > 0 ? `
                <div class="molten-mastery-display">
					Current Bonus: ${formatNumber(calculateMoltenMasteryBonus(saveData.moltenCoins || 0).toFixed(1))}x
				</div>

            ` : ''}
        </div>
    </div>
`;
            }).join('')}
</div><span class="forge-disclaimer">*coin to molten coin conversion ratio drops from ${formatNumber(10000)}:1 to  5^log(coins) after ${formatNumber(1e15)} coins and molten coin level scaling stops applying entirely after level 251 because the merchant cannot handle it anymore</span>
			</div>
		  `;
        }

        // Check if Special Coins upgrade is purchased
        const hasSpecialCoins = (saveData.upgrades?.[2]?.level || 0) >= 1;
        const specialCoins = Math.floor(Number(saveData.specialCoins)) || 0;

        // Render special coins section
        if (isSpecialUpgrade && hasSpecialCoins) {
            const specialSectionHTML = `
        <div class="special-coins-section">
            <div class="special-coins-header">
                Collect coins for XP!<br>
                - Get enough XP to level up<br>
                - Level up to spawn special coins<br>
                - Each level gives 1.1x more coin value<br>
                <div class="special-coin-balance">
                    <img src="Images/special_coin.png" alt="Special Coin" class="special-coin-icon">
                    Special Coins: ${formatNumber(specialCoins)}
                </div>
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
                    const isMaxed = currentLevel >= upgrade.levelCap;

                    // Conditional check for cost of 1 Special Coin
                    const costText = cost === 1 ? "Cost: 1 Special Coin" : `Cost: ${formatNumber(cost)} Special Coins`;

                    return `
                        <div class="special-upgrade-placeholder ${!meetsRequirement ? 'locked' : ''}">
                            ${meetsRequirement ? `
                                <h4>${upgrade.name}</h4>
                                <p>${upgrade.desc}</p>
                                <p>(Level ${currentLevel}/${upgrade.levelCap})</p>
                                ${isMaxed ? `
                                    <button class="buy-special-btn" disabled>MAXED</button>
                                ` : `
                                    <button class="buy-special-btn" 
                                        data-upgrade-id="${upgrade.id}"
                                        ${!canAfford ? 'disabled' : ''}>
                                        ${costText}
                                    </button>
                                `}
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

       if (isPlatinumUpgrade && currentLevel >= 1 && saveData.hasPlatinumUnlocked) {
    const platinumPage = saveData.platinumPage || 0;
    const allPlatinumUpgrades = Object.values(platinumUpgrades);
    const basicUpgrades = allPlatinumUpgrades.slice(0, 6);
    const mysteriousUpgrades = allPlatinumUpgrades.slice(6);
    const currentUpgrades = platinumPage === 0 ? basicUpgrades : mysteriousUpgrades;

    container.innerHTML += `
        <div class="platinum-section">
            <div class="platinum-header">
                <img src="Images/platinum_coin.png" class="platinum-coin-icon">
                Platinum Coins: ${formatNumber(Math.floor(saveData.platinumCoins || 0))}
                ${mysteriousUpgrades.length > 0 ? `
                <div class="platinum-navigation">
                    <button class="platinum-arrow" ${platinumPage === 0 ? 'disabled' : ''} 
                        id="platinum-prev">← Page 1</button>
                    <button class="platinum-arrow" ${platinumPage === 1 ? 'disabled' : ''} 
                        id="platinum-next">→ Page 2</button>
                </div>` : ''}
            </div>
            <div class="platinum-upgrades-grid">
                ${currentUpgrades.map(upgrade => {
                    const meetsRequirement = upgrade.requirement ? upgrade.requirement(saveData) : true;
                    const currentLevel = saveData.platinumUpgrades?.[upgrade.id]?.level || 0;
                    const cost = Math.round(upgrade.scaling(upgrade.baseCost, currentLevel));
                    const canAfford = (saveData.platinumCoins || 0) >= cost;
                    const isMaxed = currentLevel >= upgrade.levelCap;

                    return `
                        <div class="platinum-upgrade-placeholder ${!meetsRequirement ? 'locked' : ''}">
                            <h4>${meetsRequirement ? upgrade.name : '???'}</h4>
                            <p>${meetsRequirement ? upgrade.desc : upgrade.reqText || '???'}</p>
                            ${meetsRequirement ? `<p>Level ${currentLevel}/${upgrade.levelCap}</p>` : ''}
                            ${meetsRequirement ? `
                                ${isMaxed ? 
                                    '<span class="platinum-upgrade-maxed">MAXED</span>' :
                                    `<button class="buy-platinum-btn" 
                                        data-upgrade-id="${upgrade.id}"
                                        ${canAfford ? '' : 'disabled'}>
                                        ${formatNumber(cost)} PC
                                    </button>`
                                }
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

        if (isInfuseUpgrade && currentLevel >= 1) {
            container.innerHTML += `
        <div class="infuse-section">
            <div class="infuse-header">
				- text<br>
				- text<br>
				- more text<br>
				- even more text<br>
				- even more even more text<br>
					<div class="infused-coin-balance">
						<img src="Images/infused_coin.png" alt="infused coin" class="infused-coin-icon">
						Infused Coins: ${formatNumber(Math.floor(saveData.infusedCoins || 0))}
					</div>
            </div>
            <button class="infuse-btn" id="infuse-btn">
                Infuse +1 <img src="Images/infused_coin.png" class="infused-coin-icon-2">
            </button>
            <div class="infuse-upgrades-grid">
                ${Object.values(infuseUpgrades).map(upg => {
                const currentLevel = saveData.infuseUpgrades?.[upg.id]?.level || 0;
                const cost = Math.round(upg.scaling(upg.baseCost, currentLevel));
                const canAfford = (saveData.infusedCoins || 0) >= cost;
                const isMaxed = currentLevel >= upg.levelCap;

                return `
                        <div class="infuse-upgrade-placeholder">
                            <div class="infuse-upgrade">
                                <h4>${upg.name} (${currentLevel}/${upg.levelCap})</h4>
                                <p>${upg.desc}</p>
                                ${isMaxed ?
                '<span class="infuse-upgrade-maxed">MAXED</span>' :
                `<button class="buy-infuse-btn" 
                                        data-upgrade-id="${upg.id}"
                                        ${!canAfford ? 'disabled' : ''}>
                                        ${formatNumber(cost)} IC
                                    </button>`
}
                            </div>
                        </div>
                    `;
            }).join('')}
            </div>
        </div>
    `;
        }

        if (isAutomationUpgrade && currentLevel >= 1) {
    const automationPage = saveData.automationPage || 0;
    const allUpgrades = Object.values(automationUpgrades);
    const pageCount = Math.ceil(allUpgrades.length / 4);
    const visibleUpgrades = allUpgrades.slice(automationPage * 4, (automationPage + 1) * 4);
    const awakeningLevel = saveData.infuseUpgrades?.[2]?.level || 0;
    const coresPerSecond = awakeningLevel > 0 ? Math.pow(2, awakeningLevel - 1) : 0;

    container.innerHTML += `
        <div class="automation-header">
    <div class="core-icon-left">
        <img src="Images/automation_core.png" alt="Automation Core" class="automation-core-icon">
    </div>
    
    <div class="automation-features">
        <div class="feature-item">- Purchase "Automaton Awakening" to start generating cores</div>
        <div class="feature-item">- These cores can be spent on automating various things</div>
        <div class="feature-item">- Automation Cores and other generated currencies will generate OFFLINE while you're away!</div>
		<div class="feature-item">- You can also click the icon to the left to earn cores I guess</div>
    </div>
    
    <div class="core-balance">
        <img src="Images/automation_core.png" alt="Automation Core" class="automation-core-icon-small">
        <span class="core-count">${formatNumber(Math.floor(saveData.automationCores || 0))}</span>
        <span class="core-rate">(${formatNumber(coresPerSecond)}/sec)</span>
    </div>
</div>
            <div class="automation-navigation">
            </div>
            <div class="automation-upgrades-grid">
                ${visibleUpgrades.map(upg => {
                    const currentLevel = saveData.automationUpgrades?.[upg.id]?.level || 0;
                    const cost = Math.floor(upg.scaling(upg.baseCost, currentLevel));
                    const canAfford = (saveData.automationCores || 0) >= cost;
                    const isMaxed = currentLevel >= upg.levelCap;

                    return `
                        <div class="automation-upgrade-placeholder">
                            <h4>${upg.name} (${currentLevel}/${upg.levelCap})</h4>
                            <p>${upg.desc}</p>
                            ${isMaxed ? 
                                '<span class="automation-upgrade-maxed">MAXED</span>' :
                                `<button class="buy-automation-btn" 
                                    data-upgrade-id="${upg.id}"
                                    ${!canAfford ? 'disabled' : ''}>
                                    ${formatNumber(cost)} AC
                                </button>`
                            }
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    }
});

    // Add event listeners for special upgrades
    container.querySelectorAll('.buy-special-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const upgradeId = parseInt(this.dataset.upgradeId);
            purchaseSpecialUpgrade(upgradeId);
        });
    });

    const forgeButton = container.querySelector('.forge-btn');
    if (forgeButton) {
        // Calculate molten coins with new formula
        const coins = coinCount;
        const baseCoins = Math.min(coins, 1e12);
        const baseMolten = baseCoins / 10000;
        const excessCoins = Math.max(coins - 1e12, 0);
        const excessMolten = excessCoins > 0 ? Math.pow(5, Math.log10(excessCoins)) : 0;
        const levelBonus = saveData.level > 31 ?
            Math.pow(2, Math.floor((Math.min(saveData.level, 251) - 31) / 10)) :
            1;
        const moltenMultiplier = getMoltenCoinMultiplier();
        const totalMolten = Math.floor((baseMolten + excessMolten) * levelBonus * moltenMultiplier);

        // Update button text with floored value
        forgeButton.querySelector('.forge-amount').innerHTML = `
        ${formatNumber(totalMolten)}
        <img src="Images/molten_coin.png" alt="molten coin" class="molten-coin-icon-2">
    `;

        forgeButton.addEventListener('click', () => {
            // Get fresh data before calculations
            let saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};

            // Perform forge reset
            forgeReset();

            // Get new data after reset
            saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
            if (totalMolten > 0) {
                // Add floored molten coins to the player's total
                saveData.moltenCoins = (saveData.moltenCoins || 0) + totalMolten;
                localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
                updateMerchantDisplay();
            }
        });

        // Disable button if no molten coins available
        forgeButton.disabled = totalMolten === 0;
    }

    // Add event listeners for Forge upgrades
    container.querySelectorAll('.buy-forge-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const upgradeId = parseInt(this.dataset.upgradeId);
            purchaseForgeUpgrade(upgradeId);
        });
    });

    // Add event listeners for Platinum upgrades
    container.querySelectorAll('.buy-platinum-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const upgradeId = parseInt(this.dataset.upgradeId);
            purchasePlatinumUpgrade(upgradeId);
        });
    });

    // Add event listener for Infuse button
    const infuseButton = document.getElementById('infuse-btn');
    if (infuseButton) {
        infuseButton.addEventListener('click', () => {
            const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
            saveData.infusedCoins = (saveData.infusedCoins || 0) + 1;
            if (!saveData.hasDoneInfuseReset)
                saveData.hasDoneInfuseReset = true;
            localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
            updateMerchantDisplay();
        });
    }

    // Add event listeners for Infuse upgrades
    document.querySelectorAll('.buy-infuse-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const upgradeId = parseInt(this.dataset.upgradeId);
            purchaseInfuseUpgrade(upgradeId);
        });
    });
	
	// Add event listeners for Automation upgrades
	document.querySelectorAll('.buy-automation-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const upgradeId = parseInt(this.dataset.upgradeId);
            purchaseAutomationUpgrade(upgradeId);
        });
    });
	
	// manual automation click for those who want it
	const coreIcon = document.querySelector('.automation-core-icon');
if (coreIcon) {
    // Mouse click
    coreIcon.addEventListener('click', handleCoreClick);
    
    // Touch events (mobile)
    coreIcon.addEventListener('touchstart', handleCoreClick, { passive: true });
    coreIcon.addEventListener('touchend', (e) => e.preventDefault());
}

coreIcon?.addEventListener('touchend', () => {
    coreIcon.classList.remove('core-tap-active');
});
coreIcon?.addEventListener('mouseup', () => {
    coreIcon.classList.remove('core-tap-active');
});
coreIcon?.addEventListener('mouseleave', () => {
    coreIcon.classList.remove('core-tap-active');
});

    // Platinum navigation
    document.getElementById('platinum-prev')?.addEventListener('click', () => {
        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
        saveData.platinumPage = 0;
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
        updateMerchantDisplay();
    });
    document.getElementById('platinum-next')?.addEventListener('click', () => {
        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
        saveData.platinumPage = 1;
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
        updateMerchantDisplay();
    });

    // Automation navigation
    document.getElementById('automation-prev')?.addEventListener('click', () => {
        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
        const currentPage = saveData.automationPage || 0;
        if (currentPage > 0) {
            saveData.automationPage = currentPage - 1;
            localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
            updateMerchantDisplay();
        }
    });

    document.getElementById('automation-next')?.addEventListener('click', () => {
        const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
        const currentPage = saveData.automationPage || 0;
        const allUpgrades = Object.values(automationUpgrades);
        const pageCount = Math.ceil(allUpgrades.length / 4);

        if (currentPage < pageCount - 1) {
            saveData.automationPage = currentPage + 1;
            localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
            updateMerchantDisplay();
        }
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
    // Special case for Platinum upgrade (ID 5)
    if (upgradeId === 5) {
        // Prevent purchase if not unlocked or already purchased
        if (!saveData.hasPlatinumUnlocked || saveData.upgrades?.[5]?.level >= 1)
            return;

        // Grant the upgrade
        saveData.upgrades[5] = {
            level: 1
        };
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
        updateMerchantDisplay();
        return;
    }

    const upg = upgrades[upgradeId];
    if (!upg)
        return;

    const upgradeData = saveData.upgrades[upgradeId] || {
        level: 0
    };
    const currentLevel = upgradeData.level;

    // Check if the upgrade is mysterious and requirements are met
    if (upg.mysterious && upg.requirement && !upg.requirement(saveData)) {
        console.log(`Upgrade ${upgradeId} requirements not met!`);
        return;
    }

    const cost = Math.floor(upg.scaling(upg.baseCost, currentLevel));

    // Check if the upgrade can be purchased
    if (currentLevel < upg.maxLevel && Math.floor(coinCount) >= cost) {
        coinCount -= cost;
        coinCount = Math.floor(coinCount);
        upgradeData.level = currentLevel + 1;
        saveData.upgrades[upgradeId] = upgradeData;

        // Handle Special Coins upgrade (ID 2)
        if (upgradeId === 2) {
            if (!saveData.xp) {
                saveData.xp = 0;
                saveData.level = 0;
                saveData.xpNeeded = 10;
            }

            localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

            updateGoalDisplay();

            const dialogueContainer = document.querySelector('.dialogue-container');
            if (dialogueContainer) {
                dialogueContainer.remove();
                showDialogue();
            }
            document.querySelector('.xp-container').style.display = 'block';
            updateXPDisplay(saveData.xp, saveData.level, saveData.xpNeeded);
        }

        // Handle Forge upgrade (ID 4)
        if (upgradeId === 4) {
            updateGoalDisplay();
            updateMerchantDisplay();
        }

        // Save updated data
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify({
                ...saveData,
                coins: coinCount,
                upgrades: saveData.upgrades
            }));

        // General UI updates
        updateGoalDisplay();
        updateCoinDisplay();
        updateMerchantDisplay();
        applyUpgradeEffects();
    }
    updateEffectsDisplay();
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

function purchaseForgeUpgrade(upgradeId) {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const forgeUpg = forgeUpgrades[upgradeId];
    if (!forgeUpg)
        return;

    const currentLevel = saveData.forgeUpgrades?.[upgradeId]?.level || 0;
    if (currentLevel >= forgeUpg.levelCap)
        return;

    const cost = Math.floor(forgeUpg.scaling(forgeUpg.baseCost, currentLevel));
    if ((saveData.moltenCoins || 0) < cost)
        return;

    saveData.moltenCoins -= cost;
    saveData.forgeUpgrades = saveData.forgeUpgrades || {};
    saveData.forgeUpgrades[upgradeId] = {
        level: currentLevel + 1
    };
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

    updateMerchantDisplay();
    applyUpgradeEffects();
}

function calculateMoltenMasteryBonus(moltenCoins) {
    if (moltenCoins < 1e16)
        return 1;
    return Math.pow(2, Math.log10(moltenCoins / 1e15));
}

function purchasePlatinumUpgrade(upgradeId) {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const upgrade = platinumUpgrades[upgradeId];
    if (!upgrade)
        return;

    const currentLevel = saveData.platinumUpgrades?.[upgradeId]?.level || 0;
    if (currentLevel >= upgrade.levelCap)
        return;

    const cost = Math.round(upgrade.scaling(upgrade.baseCost, currentLevel));
    if ((saveData.platinumCoins || 0) < cost)
        return;

    saveData.platinumCoins -= cost;
    saveData.platinumUpgrades = saveData.platinumUpgrades || {};
    saveData.platinumUpgrades[upgradeId] = {
        level: currentLevel + 1
    };
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

    updateMerchantDisplay();
}

function purchaseInfuseUpgrade(upgradeId) {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const upgrade = infuseUpgrades[upgradeId];
    if (!upgrade) return;

    const currentLevel = saveData.infuseUpgrades?.[upgradeId]?.level || 0;
    if (currentLevel >= upgrade.levelCap) return;

    const cost = Math.floor(upgrade.scaling(upgrade.baseCost, currentLevel));
    if ((saveData.infusedCoins || 0) < cost) return;

    saveData.infusedCoins -= cost;
    saveData.infuseUpgrades = saveData.infuseUpgrades || {};
    saveData.infuseUpgrades[upgradeId] = {
        level: currentLevel + 1
    };
    
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
    updateMerchantDisplay();
}

function purchaseAutomationUpgrade(upgradeId) {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const upgrade = automationUpgrades[upgradeId];
    if (!upgrade) return;

    const currentLevel = saveData.automationUpgrades?.[upgradeId]?.level || 0;
    if (currentLevel >= upgrade.levelCap) return;

    const cost = Math.floor(upgrade.scaling(upgrade.baseCost, currentLevel));
    if ((saveData.automationCores || 0) < cost) return;

    saveData.automationCores -= cost;
    saveData.automationUpgrades = saveData.automationUpgrades || {};
    saveData.automationUpgrades[upgradeId] = {
        level: currentLevel + 1
    };
    
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
    updateMerchantDisplay();
    applyUpgradeEffects(); // If these upgrades affect gameplay
}

function generateAutomationCores() {
    if (!gameActive) return;
    
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const awakeningLevel = saveData.infuseUpgrades?.[2]?.level || 0;
    
    if (awakeningLevel >= 1) {
        const coresPerSecond = Math.pow(2, awakeningLevel - 1);
        saveData.automationCores = (saveData.automationCores || 0) + coresPerSecond;
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
        
        // Only update display if merchant UI is open
        if (document.querySelector('.merchant-modal').style.display === 'flex') {
            updateMerchantDisplay();
        }
    }
}

function handleCoreClick() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    
    if (saveData.infuseUpgrades?.[2]?.level >= 1) {
        // Visual feedback - immediate response
        this.classList.add('core-tap-active');
       
            saveData.automationCores = (saveData.automationCores || 0) + 1;
            localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
            
            // Update UI if merchant open
            if (document.querySelector('.merchant-modal')?.style.display === 'flex') {
                updateMerchantDisplay();
            }
        }
    }

function updateEffectsDisplay() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const effectsContainer = document.querySelector('.current-effects');
    const now = Date.now();

    // Initialize unlocked multipliers tracking - convert array back to Set
    const unlocked = new Set(saveData.unlockedMultipliers || []);

    // Calculate all multipliers
    const multipliers = {
        spawnRate: 1000 / calculateSpawnInterval(saveData),
        coinValue: getCoinValueMultiplier(),
        xp: getXPMultiplier(),
        mc: getMoltenCoinMultiplier(),
        pc: getPlatinumCoinValueMultiplier()
    };

    // Track which multipliers have been ever activated
    Object.entries(multipliers).forEach(([key, value]) => {
        if (value > 1)
            unlocked.add(key);
    });

    // Build effects display
    let effectsHTML = `<strong>Active Effects:</strong><div class="permanent-upgrades">`;

    // Always show spawn rate
    effectsHTML += `<div>• Coin Spawn Rate: ${formatNumber(multipliers.spawnRate, false, true)}/sec</div>`;

    // Conditionally show other multipliers if ever unlocked
    if (unlocked.has('coinValue')) {
        effectsHTML += `<div>• Coin Value Multi: ${formatNumber(multipliers.coinValue, false, true)}x</div>`;
    }
    if (unlocked.has('xp')) {
        effectsHTML += `<div>• XP Multi: ${formatNumber(multipliers.xp, false, true)}x</div>`;
    }
    if (unlocked.has('mc')) {
        effectsHTML += `<div>• MC Value Multi: ${formatNumber(multipliers.mc, false, true)}x</div>`;
    }
    if (unlocked.has('pc')) {
        effectsHTML += `<div>• PC Value Multi: ${formatNumber(multipliers.pc, false, true)}x</div>`;
    }

    effectsHTML += `</div>`;

    // Add boost displays (unchanged)
    Object.entries(activeBoosts).forEach(([type, expiry]) => {
        const remaining = Math.max(0, Math.ceil((expiry - now) / 1000));
        if (remaining > 0) {
            const boostEffect = type === 'coins' ? '3x Coins' : '3x XP';
            effectsHTML += `<div class="active-boost">${type.toUpperCase()} Boost — ${boostEffect}: ${remaining}s remaining</div>`;
        }
    });

    if (effectsContainer) {
        effectsContainer.innerHTML = effectsHTML;
    }

    // Refresh every second if boosts are active
    if (Object.keys(activeBoosts).length > 0) {
        setTimeout(updateEffectsDisplay, 1000);
    }
}

// Helper function for spawn rate calculation
function calculateSpawnInterval(saveData) {
    const base = 3000;
    let interval = base * Math.pow(0.896, saveData.upgrades?.[1]?.level || 0);

    if (saveData.forgeUpgrades?.[1]?.level >= 1) {
        interval /= 3;
    }

    const platinumBonus = 1 + (0.1 * (saveData.platinumUpgrades?.[2]?.level || 0));
    return interval / platinumBonus;
}

function applyUpgradeEffects() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const spawnRateUpg1 = saveData.upgrades?.[1]?.level || 0;
    const spawnRateUpg2 = saveData.platinumUpgrades?.[2]?.level || 0;
    const additiveSpawnRateBonus = 1 + (0.10 * spawnRateUpg2);
    let spawnInterval = 3000 * Math.pow(0.9, spawnRateUpg1);

    spawnInterval /= additiveSpawnRateBonus;

    // Apply Forge Upgrade: Coin Surge (ID 1)
    const forgeUpgrade1Level = saveData.forgeUpgrades?.[1]?.level || 0;
    if (forgeUpgrade1Level >= 1) {
        spawnInterval /= 3; // Triples spawn rate
    }

    clearInterval(window.spawnInterval);
    window.spawnInterval = setInterval(() => {
        if (gameActive)
            spawnCoin();
    }, spawnInterval);
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

function forgeReset() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};

    saveData.coins = 0;

    const preserveIds = [2, 4, 5, 8, 9, 10];
    
    if (saveData.upgrades) {
        Object.keys(saveData.upgrades).forEach(upgradeId => {
            const id = parseInt(upgradeId);
            if (!preserveIds.includes(id)) {
                saveData.upgrades[upgradeId].level = 0;
            }
        });
    }

    saveData.specialCoins = 0;
    saveData.specialUpgrades = {};

    saveData.level = 0;
    saveData.xp = 0;
    saveData.xpNeeded = 10;

    if (!saveData.hasDoneForgeReset) {
        saveData.hasDoneForgeReset = true;
        saveData.hasPlatinumUnlocked = true;
    }

    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

    coinCount = saveData.coins;

    updateCoinDisplay();
    updateXPDisplay(saveData.xp, saveData.level, saveData.xpNeeded);
    updateMerchantDisplay();
    updateEffectsDisplay();
    applyUpgradeEffects();

    beachContainer.querySelectorAll('.coin, .special-coin, .platinum-coin').forEach(coin => coin.remove());
    activeCoins.length = 0;
    activeBoostCoins.length = 0;

    updateGoalDisplay();

    if (document.querySelector('.merchant-modal').style.display === 'flex') {
        updateMerchantDisplay();
    }
}

let magnetIndicator = null; // Cache the magnet indicator element

function updateMagnetIndicator() {
    if (!magnetIndicator) {
        magnetIndicator = document.getElementById('magnet-indicator');
        if (!magnetIndicator) {
            requestAnimationFrame(updateMagnetIndicator); // Retry until the indicator exists
            return;
        }
    }

    if (!isCursorInContainer) {
        magnetIndicator.style.display = 'none';
        requestAnimationFrame(updateMagnetIndicator);
        return;
    }

    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const magnetLevel = saveData.forgeUpgrades?.[2]?.level || 0;

    if (magnetLevel < 1) {
        magnetIndicator.style.display = 'none';
        requestAnimationFrame(updateMagnetIndicator);
        return;
    }

    const radius = magnetLevel * 5 * UNIT_TO_PX;
    magnetIndicator.style.display = 'block';
    magnetIndicator.style.width = `${radius * 2}px`;
    magnetIndicator.style.height = `${radius * 2}px`;
    magnetIndicator.style.transform = `translate(${cursorPosition.x - radius}px, ${cursorPosition.y - radius}px)`;

    requestAnimationFrame(updateMagnetIndicator);
}

const GRID_CELL_SIZE = 1000;
let coinGrid = [];

function checkMagnetCollection() {
    if (JSON.parse(localStorage.getItem('disableMagnet') || 'false'))
        return;

    coinsCollectedThisFrame = 0;
    if (!isCursorInContainer)
        return;

    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const magnetLevel = saveData.forgeUpgrades?.[2]?.level || 0;
    if (magnetLevel < 1)
        return;

    const radius = magnetLevel * 5 * UNIT_TO_PX;
    const containerRect = beachContainer.getBoundingClientRect();
    const cursorX = cursorPosition.x;
    const cursorY = cursorPosition.y;
    const gridX = Math.floor(cursorX / GRID_CELL_SIZE);
    const gridY = Math.floor(cursorY / GRID_CELL_SIZE);

    // Expand the search to a 5x5 grid (cells 2 away in each direction)
    const cellsToCheck = [];
    for (let i = gridY - 2; i <= gridY + 2; i++) {
        for (let j = gridX - 2; j <= gridX + 2; j++) {
            cellsToCheck.push([i, j]);
        }
    }

    const bufferMargin = 5;

    cellsToCheck.forEach(([y, x]) => {
        if (coinGrid[y] && coinGrid[y][x]) {
            coinGrid[y][x].forEach(coin => {
                const rect = coin.getBoundingClientRect();
                const coinX = (rect.left - containerRect.left) + rect.width / 2;
                const coinY = (rect.top - containerRect.top) + rect.height / 2;
                const distance = Math.hypot(coinX - cursorX, coinY - cursorY);
                if (distance <= radius + bufferMargin) {
                    safeCollect(coin);
                }
            });
        }
    });
}

// Run at 60fps
setInterval(checkMagnetCollection, 1000 / 60);

// Add resize observer to maintain unit consistency
const resizeObserver = new ResizeObserver(() => {
    // Reset cursor position on resize (reduces possibility of cheating magnet radius)
    cursorPosition = {
        x: -1000,
        y: -1000
    };
});

resizeObserver.observe(beachContainer);

beachContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        cursorPosition = {
            x: -1000,
            y: -1000
        };
    }
});

function updateCoinGrid() {
    const containerRect = beachContainer.getBoundingClientRect();
    const gridWidth = Math.ceil(containerRect.width / GRID_CELL_SIZE);
    const gridHeight = Math.ceil(containerRect.height / GRID_CELL_SIZE);

    coinGrid = Array.from({
        length: gridHeight
    }, () =>
            Array.from({
                length: gridWidth
            }, () => []));

    const allCoins = [
        ...document.querySelectorAll('.coin:not(.collected)'),
        ...document.querySelectorAll('.special-coin:not(.collected)'),
        ...document.querySelectorAll('.platinum-coin:not(.collected)'),
        ...document.querySelectorAll('.boost-coin:not(.collected)')
    ];

    allCoins.forEach(coin => {
        const rect = coin.getBoundingClientRect();

        // Clamp coin position to container bounds
        const clampedLeft = Math.max(0, rect.left - containerRect.left);
        const clampedTop = Math.max(0, rect.top - containerRect.top);

        const x = Math.floor(clampedLeft / GRID_CELL_SIZE);
        const y = Math.floor(clampedTop / GRID_CELL_SIZE);

        if (coinGrid[y] && coinGrid[y][x]) {
            coinGrid[y][x].push(coin);
        }
    });
}

// Update grid every 500ms
setInterval(updateCoinGrid, 500);

const collectedCoins = new WeakSet(); // Tracks collected coins
function safeCollect(coin) {
    if (!coin || !coin.parentElement || collectedCoins.has(coin))
        return;

    collectedCoins.add(coin);
    coinsCollectedThisFrame++;

    // Skip animation if disabled
    if (disableAnimation.checked) {
        setTimeout(() => {
            if (coin.parentElement)
                coin.remove();
        }, 100);
    }

    // Determine coin type and collect accordingly
    if (coin.classList.contains('platinum-coin')) {
        if (coinsCollectedThisFrame <= SOUND_THRESHOLD) {
            collectPlatinumCoin({
                target: coin
            });
        } else {
            collectPlatinumCoin({
                target: coin,
                skipSound: true
            });
        }
    } else if (coin.classList.contains('boost-coin')) {
        if (coinsCollectedThisFrame <= SOUND_THRESHOLD) {
            collectBoostCoin(coin);
        } else {
            collectBoostCoin(coin, true);
        }
    } else if (coin.classList.contains('special-coin')) {
        const event = new Event('mouseenter', {
            bubbles: true
        });
        coin.dispatchEvent(event);
    } else {
        coin.dispatchEvent(new Event('mouseenter', {
                bubbles: true
            }));
    }
    coin.classList.add('collected');

    setTimeout(() => {
        if (coin && coin.parentElement) {
            coin.remove();
        }
    }, 300); // Wait 300ms to allow any animations
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

let testModeEnabled = true;
let devMenuOpen = false;
let devMenuUpdateInterval = null;
let activeInputElement = null;
let pendingStatUpdates = {};
const maxLogEntries = 100;
function getCurrentActionLog() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    return saveData.actionLog || [];
}

const devMenuCSS = `
.dev-menu {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0,0,0,0.9);
    color: white;
    padding: 15px;
    font-family: Arial, sans-serif;
    width: 430px;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 100000;
    border-radius: 5px 0 0 5px;
    box-shadow: -2px 0 10px rgba(0,0,0,0.7);
}
.dev-menu-title {
    font-size: 1.2em;
    font-weight: bold;
    text-align: center;
    padding: 10px;
    margin: -10px -10px 10px -10px;
    background: rgba(255,255,255,0.1);
    position: sticky;
    top: 0;
    backdrop-filter: blur(5px);
}
.dev-section {
    margin: 12px 0;
    border: 1px solid #444;
    padding: 8px;
    border-radius: 4px;
    background: rgba(0,0,0,0.3);
}
.dev-section-content {
    display: none;
    margin-top: 5px;
}
.dev-section-header {
    cursor: pointer;
    font-weight: bold;
    padding: 6px;
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
    display: flex;
    align-items: center;
}
.dev-section-header::before {
    content: '▶';
    margin-right: 8px;
    font-size: 0.8em;
}
.dev-section-header.expanded::before {
    content: '▼';
}
.stat-item {
    margin: 8px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.9em;
}
.stat-item span:first-child {
    flex: 1;
    margin-right: 15px;
}
.stat-item input {
    width: 120px;
    background: #333;
    color: white;
    border: 1px solid #555;
    padding: 4px 8px;
    border-radius: 4px;
}
.upgrade-id {
    font-size: 0.8em;
    color: #888;
    margin-left: 8px;
}
.flag-item {
    margin: 8px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.flag-toggle {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
}
.flag-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
}
.flag-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #555;
    transition: .2s;
    border-radius: 12px;
}
.flag-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .2s;
    border-radius: 50%;
}
.flag-toggle input:checked + .flag-slider {
    background-color: #2196F3;
}
.flag-toggle input:checked + .flag-slider:before {
    transform: translateX(26px);
}
.dev-misc-button {
    display: block;
    width: 100%;
    background: #444;
    color: white;
    border: 1px solid #666;
    border-radius: 4px;
    padding: 8px 12px;
    margin: 8px 0;
    cursor: pointer;
    transition: background 0.2s;
    text-align: center;
    font-size: 0.9em;
}
.dev-misc-button:hover {
    background: #555;
}
.dev-misc-button:active {
    background: #333;
}
.action-log-entry {
    font-size: 0.8em;
    padding: 5px;
    border-bottom: 1px solid #333;
    font-family: monospace;
    word-break: break-word;
}
.action-log-time {
    color: #aaa;
    margin-right: 8px;
}
.action-log-message {
    color: #ddd;
}
.action-log-empty {
    color: #aaa;
    font-style: italic;
    padding: 10px;
    text-align: center;
    font-size: 0.9em;
}
.action-log-number {
    color: #FFD700;
    font-weight: bold;
    text-shadow: 0 0 2px rgba(0,0,0,0.5);
    padding: 0 2px;
    border-radius: 3px;
    background: rgba(255, 215, 0, 0.1);
}
.action-log-number::after {
    content: "";
    color: #FFD700;
}
.dev-menu::-webkit-scrollbar {
    width: 8px;
}
.dev-menu::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
}
.dev-menu::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}
.dev-menu::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}
#action-log-entries::-webkit-scrollbar {
    width: 8px;
}
#action-log-entries::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
}
#action-log-entries::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}
#action-log-entries::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}
.action-log-level {
    color: #FFD700;
    font-weight: bold;
    text-shadow: 0 0 2px rgba(0,0,0,0.5);
    background: rgba(255, 215, 0, 0.1);
    border-radius: 3px;
    padding: 0 2px;
}
.action-log-level span {
    color: #FFD700;
}
.action-log-gold {
    color: #FFD700;
    font-weight: bold;
    text-shadow: 0 0 2px rgba(0,0,0,0.5);
    background: rgba(255, 215, 0, 0.1);
    border-radius: 3px;
    padding: 0 2px;
}
`;

function createDevMenu() {
    if (!testModeEnabled || devMenuOpen)
        return;

    // Remove existing menu if any
    const existingMenu = document.querySelector('.dev-menu');
    if (existingMenu)
        existingMenu.remove();

    // Create new menu
    const style = document.createElement('style');
    style.id = 'dev-menu-style';
    style.textContent = devMenuCSS;
    document.head.appendChild(style);

    const menu = document.createElement('div');
    menu.className = 'dev-menu';
    menu.innerHTML = `
        <div class="dev-menu-title">Dev Menu</div>
        <div class="dev-section">
            <div class="dev-section-header">Stats</div>
            <div class="dev-section-content" style="display:none" id="stats-section"></div>
        </div>
        <div class="dev-section">
            <div class="dev-section-header">Upgrades</div>
            <div class="dev-section-content" style="display:none" id="upgrades-section"></div>
        </div>
        <div class="dev-section">
            <div class="dev-section-header">Flags</div>
            <div class="dev-section-content" style="display:none" id="flags-section"></div>
        </div>
        <div class="dev-section">
            <div class="dev-section-header">Misc</div>
            <div class="dev-section-content" style="display:none" id="misc-section">
                <button class="dev-misc-button" id="spawn-boost-coin">Spawn Boost Coin</button>
                <button class="dev-misc-button" id="restore-dialogues">Restore Merchant Dialogues</button>
				<button class="dev-misc-button" id="instant-complete-merchant-dialogues">Instantly Complete All Merchant Dialogues</button>
				<button class="dev-misc-button" id="reset-all-stats">Reset All Stats to Nothing</button>
                <button class="dev-misc-button" id="reset-all-upgrades">Reset All Upgrades to Level 0</button>
				<button class="dev-misc-button" id="clear-active-coins">Clear All Active Coins</button>
				<button class="dev-misc-button" id="increment-all-upgrades">+1 Level to All Upgrades</button>
				<button class="dev-misc-button" id="hard-reset-game">Hard Reset All Progress</button>
            </div>
        </div>
		<div class="dev-section">
            <div class="dev-section-header">Action Log</div>
            <div class="dev-section-content" style="display:none" id="action-log-section">
                <div id="action-log-entries" style="max-height: 200px; overflow-y: auto;"></div>
            </div>
        </div>
    `;

    document.body.appendChild(menu);
    devMenuOpen = true;

    document.getElementById('spawn-boost-coin').addEventListener('click', () => {
        logAction("Manually spawned boost coin");
        spawnBoostCoin();
    });
    document.getElementById('restore-dialogues').addEventListener('click', () => {
        logAction("Restored merchant dialogues");
        restoreMerchantDialogues();
    });
    document.getElementById('instant-complete-merchant-dialogues').addEventListener('click', () => {
        instantCompleteMerchantDialogues();
    });
    document.getElementById('reset-all-stats').addEventListener('click', () => {
        resetAllStats();
    });
    document.getElementById('reset-all-upgrades').addEventListener('click', () => {
        resetAllUpgradesToZero();
    });
    document.getElementById('clear-active-coins').addEventListener('click', () => {
        clearAllCoins();
    });
    document.getElementById('increment-all-upgrades').addEventListener('click', () => {
        incrementAllUpgradeLevels();
    });
    document.getElementById('hard-reset-game').addEventListener('click', () => {
        if (confirm("Are you sure you want to perform a hard reset? This will wipe all stats and upgrades!")) {
            resetGame();
            refreshAllDisplays();
        }
    });

    // Initialize all sections as collapsed
    document.querySelectorAll('.dev-section-header').forEach(header => {
        header.addEventListener('click', function () {
            const wasExpanded = this.classList.contains('expanded');
            this.classList.toggle('expanded');
            const content = this.nextElementSibling;
            content.style.display = wasExpanded ? 'none' : 'block';
        });
    });

    if (localStorage.getItem('actionLog')) {
        const actionLog = getCurrentActionLog();
        try {
            const storedLogs = JSON.parse(localStorage.getItem('actionLog'));
            if (Array.isArray(storedLogs)) {
                actionLog.push(...storedLogs);
            }
        } catch (e) {
            console.error("Couldn't load action log", e);
        }
        updateActionLogDisplay(); // Update display with either logs or empty message
    }

    // Start real-time updates
    devMenuUpdateInterval = setInterval(updateDevMenu, 16);
    updateDevMenu();
    updateActionLogDisplay();
}

function handleStatChange(stat, value) {
    const oldValue = getCurrentStatValue(stat);
    const numValue = Number(value);
    if (isNaN(numValue))
        return;

    logAction(`Modified ${stat} from ${formatNumber(oldValue)} to ${formatNumber(numValue)}`);

    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    switch (stat) {
    case 'Coins':
        coinCount = numValue;
        break;
    case 'Molten Coins':
        saveData.moltenCoins = numValue;
        break;
    case 'Platinum Coins':
        saveData.platinumCoins = numValue;
        break;
    case 'Special Coins':
        saveData.specialCoins = numValue;
        break;
    case 'Level':
        saveData.level = numValue;
        saveData.xpNeeded = 10 * Math.pow(1.1, numValue);
        break;
    case 'XP':
        saveData.xp = numValue;
        break;
    }
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
    refreshAllDisplays();
}

function getCurrentStatValue(stat) {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    switch (stat) {
    case 'Coins':
        return coinCount;
    case 'Molten Coins':
        return saveData.moltenCoins || 0;
    case 'Platinum Coins':
        return saveData.platinumCoins || 0;
    case 'Special Coins':
        return saveData.specialCoins || 0;
    case 'Level':
        return saveData.level || 0;
    case 'XP':
        return saveData.xp || 0;
    default:
        return '?';
    }
}

function handleUpgradeChange(id, category, value) {
    // Load the current saveData
    let saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    if (!saveData[category])
        saveData[category] = {};

    const oldLevel = saveData[category][id]?.level || 0;
    const newLevel = Number(value);

    const categoryName = Object.entries({
        'Coin Upgrades': 'upgrades',
        'Special Coin Upgrades': 'specialUpgrades',
        'Molten Coin Upgrades': 'forgeUpgrades',
        'Platinum Coin Upgrades': 'platinumUpgrades'
    }).find(([_, cat]) => cat === category)?.[0] || category;

    const upgradeName = {
        upgrades: upgrades[id]?.upgName,
        forgeUpgrades: forgeUpgrades[id]?.name,
        platinumUpgrades: platinumUpgrades[id]?.name,
        specialUpgrades: specialUpgrades[id]?.name
    }
    [category] || `ID ${id}`;

    logAction(`Modified ${upgradeName} (${categoryName} - ID: ${id}) from Level ${formatNumber(oldLevel)} to Level ${formatNumber(newLevel)}`);

    // Reload saveData so we capture the updated actionLog
    saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    if (!saveData[category])
        saveData[category] = {};

    // Update the upgrade level
    saveData[category][id] = {
        level: newLevel
    };
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

    applyUpgradeEffects();
    updateMerchantDisplay();
    updateDevMenu();
}

function getUpgradeName(id, category) {
    return {
        upgrades: upgrades[id]?.upgName,
        forgeUpgrades: forgeUpgrades[id]?.name,
        platinumUpgrades: platinumUpgrades[id]?.name,
        specialUpgrades: specialUpgrades[id]?.name
    }
    [category] || `ID ${id}`;
}

function updateDevMenu() {
    if (!devMenuOpen)
        return;

    // Update stats
    const statsSection = document.getElementById('stats-section');
    const currentStats = {
        'Coins': coinCount,
        'XP': JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`))?.xp || 0,
        'Level': JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`))?.level || 0,
        'Special Coins': JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`))?.specialCoins || 0,
        'Molten Coins': JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`))?.moltenCoins || 0,
        'Platinum Coins': JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`))?.platinumCoins || 0,
    };

    // Create a map of existing stat items
    const existingStats = {};
    statsSection.querySelectorAll('.stat-item').forEach(item => {
        const name = item.querySelector('span').textContent.replace(':', '').trim();
        existingStats[name] = item;
    });

    // Update or create stat items
    Object.entries(currentStats).forEach(([name, value]) => {
        if (existingStats[name]) {
            const input = existingStats[name].querySelector('input');
            // Only update if not currently being edited
            if (input && input !== activeInputElement && input.value !== String(value)) {
                input.value = value;
            }
        } else {
            const item = document.createElement('div');
            item.className = 'stat-item';
            const input = document.createElement('input');
            input.type = 'number';
            input.value = value;
            input.step = 'any'; // Allow decimals
            // Disable validation tooltip
            input.oninvalid = (e) => e.preventDefault();
            input.addEventListener('input', function () {
                handleStatChange(name, this.value);
            });
            input.addEventListener('focus', function () {
                activeInputElement = this;
            });
            input.addEventListener('blur', function () {
                activeInputElement = null;
                // Apply any queued updates
                Object.entries(pendingStatUpdates).forEach(([stat, value]) => {
                    handleStatChange(stat, value);
                });
                pendingStatUpdates = {};
            });

            item.innerHTML = `<span>${name}:</span>`;
            item.appendChild(input);
            statsSection.appendChild(item);
        }
    });

    // Update upgrades
    const upgradeCategories = {
        'Coin Upgrades': {
            object: upgrades,
            key: 'upgrades'
        },
        'Special Coin Upgrades': {
            object: specialUpgrades,
            key: 'specialUpgrades'
        },
        'Molten Coin Upgrades': {
            object: forgeUpgrades,
            key: 'forgeUpgrades'
        },
        'Platinum Coin Upgrades': {
            object: platinumUpgrades,
            key: 'platinumUpgrades'
        }
    };

    Object.entries(upgradeCategories).forEach(([category, data]) => {
        const categoryId = category.replace(/\s+/g, '-');
        let contentDiv = document.getElementById(`${categoryId}-content`);

        if (!contentDiv) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'dev-subsection';
            const header = document.createElement('div');
            header.className = 'dev-section-header';
            header.textContent = category;

            contentDiv = document.createElement('div');
            contentDiv.className = 'dev-section-content';
            contentDiv.id = `${categoryId}-content`;

            header.addEventListener('click', function () {
                this.classList.toggle('expanded');
                contentDiv.style.display =
                    this.classList.contains('expanded') ? 'block' : 'none';
            });

            categoryDiv.appendChild(header);
            categoryDiv.appendChild(contentDiv);
            document.getElementById('upgrades-section').appendChild(categoryDiv);
        }

        // Create a map of existing upgrade items
        const existingUpgrades = {};
        contentDiv.querySelectorAll('.stat-item').forEach(item => {
            const id = item.querySelector('input')?.dataset.upgradeId;
            if (id)
                existingUpgrades[id] = item;
        });

        Object.values(data.object).forEach(upg => {
            const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
            const currentLevel = saveData[data.key]?.[upg.id]?.level || 0;

            if (existingUpgrades[upg.id]) {
                const input = existingUpgrades[upg.id].querySelector('input');
                // Only update if not currently being edited
                if (input && input !== activeInputElement && input.value !== String(currentLevel)) {
                    input.value = currentLevel;
                }
            } else {
                const item = document.createElement('div');
                item.className = 'stat-item';
                const input = document.createElement('input');
                input.type = 'number';
                input.value = currentLevel;
                input.min = 0;
                input.max = upg.maxLevel || upg.levelCap || 999;
                input.step = 'any'; // Allow decimals
                // Disable validation tooltip
                input.oninvalid = (e) => e.preventDefault();
                input.dataset.upgradeId = upg.id;
                input.addEventListener('input', function () {
                    handleUpgradeChange(upg.id, data.key, this.value);
                });
                input.addEventListener('focus', function () {
                    activeInputElement = this;
                });
                input.addEventListener('blur', function () {
                    activeInputElement = null;
                });

                item.innerHTML = `
            <span>${upg.upgName || upg.name}
                <span class="upgrade-id">(ID: ${upg.id})</span>
            </span>
        `;
                item.appendChild(input);
                contentDiv.appendChild(item);
            }
        });
    });
    // Update flags
    const flagsSection = document.getElementById('flags-section');
    const currentFlags = {
        'Game Active': gameActive,
        'Disable Background Music': !musicManager.isMusicOn,
        'Disable Coin Pickup Animation': disableAnimation.checked,
        'Disable Coin Pickup Sound': disableSound.checked,
        'Enable Scientific Notation': useScientificNotation,
        'Disable Formatted Numbers': JSON.parse(localStorage.getItem('disableFormattedNumbers') || 'false'),
        'Disable Boost Coin Spawning': !boostCoinsUnlocked,
        'Has Done Forge Reset': JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`))?.hasDoneForgeReset || false,
        'Has Platinum Unlocked': JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`))?.hasPlatinumUnlocked || false,
        'Disable Magnet': JSON.parse(localStorage.getItem('disableMagnet') || 'false')
    };

    // Create a map of existing flag items
    const existingFlags = {};
    flagsSection.querySelectorAll('.flag-item').forEach(item => {
        const name = item.querySelector('span').textContent;
        existingFlags[name] = item;
    });

    // Update or create flag items
    Object.entries(currentFlags).forEach(([name, value]) => {
        if (existingFlags[name]) {
            const input = existingFlags[name].querySelector('input');
            if (input && input.checked !== value) {
                input.checked = value;
            }
        } else {
            const item = document.createElement('div');
            item.className = 'flag-item';

            const label = document.createElement('label');
            label.className = 'flag-toggle';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = value;
            input.addEventListener('change', function () {
                handleFlagChange(name, this.checked);
            });

            const slider = document.createElement('span');
            slider.className = 'flag-slider';

            label.appendChild(input);
            label.appendChild(slider);

            item.innerHTML = `<span>${name}</span>`;
            item.appendChild(label);
            flagsSection.appendChild(item);
        }
    });
}

function handleFlagChange(name, value) {
    const currentFlags = {
        'Game Active': gameActive,
        'Disable Background Music': !musicManager.isMusicOn,
        'Disable Coin Pickup Animation': disableAnimation.checked,
        'Disable Coin Pickup Sound': disableSound.checked,
        'Enable Scientific Notation': useScientificNotation,
        'Disable Formatted Numbers': JSON.parse(localStorage.getItem('disableFormattedNumbers') || 'false'),
        'Disable Boost Coin Spawning': !boostCoinsUnlocked,
        'Has Done Forge Reset': JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`))?.hasDoneForgeReset || false,
        'Has Platinum Unlocked': JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`))?.hasPlatinumUnlocked || false,
        'Disable Magnet': JSON.parse(localStorage.getItem('disableMagnet') || 'false')
    };

    const oldValue = currentFlags[name];
    logAction(`Toggled flag "${name}" from ${oldValue} to ${value}`);

    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};

    switch (name) {
    case 'Game Active':
        gameActive = value;
        if (!value)
            pauseGame();
        else
            startGame();
        break;

    case 'Disable Background Music':
        document.getElementById('music-toggle').checked = value;
        musicManager.toggleMusic();
        break;

    case 'Disable Coin Pickup Animation':
        disableAnimation.checked = value;
        localStorage.setItem('disableAnimation', value);
        break;

    case 'Disable Coin Pickup Sound':
        disableSound.checked = value;
        localStorage.setItem('disableSound', value);
        break;

    case 'Enable Scientific Notation':
        useScientificNotation = value;
        localStorage.setItem('useScientificNotation', value);
        document.getElementById('notation-toggle').checked = value;
        refreshAllDisplays();
        break;

    case 'Disable Formatted Numbers':
        localStorage.setItem('disableFormattedNumbers', value);
        refreshAllDisplays();
        break;

    case 'Disable Boost Coin Spawning':
        boostCoinsUnlocked = !value;
        if (value)
            clearInterval(boostSpawnInterval);
        else
            boostSpawnInterval = setInterval(spawnBoostCoin, 60000);
        break;

    case 'Has Done Forge Reset':
        saveData.hasDoneForgeReset = value;
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
        break;

    case 'Has Platinum Unlocked':
        saveData.hasPlatinumUnlocked = value;
        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
        const platinumSection = document.querySelector('.platinum-section');
        if (platinumSection) {
            platinumSection.remove();
        }
        break;

    case 'Disable Magnet':
        saveData.forgeUpgrades = saveData.forgeUpgrades || {};

        if (value) {
            if (!localStorage.getItem('prevMagnetLevel')) {
                localStorage.setItem('prevMagnetLevel', saveData.forgeUpgrades[2]?.level || 0);
            }
            saveData.forgeUpgrades[2] = {
                level: 0
            };
        } else {
            const prevLevel = parseInt(localStorage.getItem('prevMagnetLevel')) || 0;
            saveData.forgeUpgrades[2] = {
                level: prevLevel
            };
            localStorage.removeItem('prevMagnetLevel');
        }

        localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));
        localStorage.setItem('disableMagnet', value);
        updateMagnetIndicator();
        updateMerchantDisplay();
        break;
    }

    refreshAllDisplays();
}

// Close menu and cleanup
function closeDevMenu() {
    const actionLog = getCurrentActionLog()
        const menu = document.querySelector('.dev-menu');
    if (menu)
        menu.remove();
    const style = document.getElementById('dev-menu-style');
    if (style)
        style.remove();
    devMenuOpen = false;
    if (devMenuUpdateInterval) {
        clearInterval(devMenuUpdateInterval);
        devMenuUpdateInterval = null;
    }
    localStorage.setItem('actionLog', JSON.stringify(actionLog.slice(0, maxLogEntries)));
}

function updateActionLog(newEntry) {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const actionLog = saveData.actionLog || [];

    actionLog.unshift(newEntry);

    // Trim to max length
    if (actionLog.length > maxLogEntries) {
        actionLog.length = maxLogEntries;
    }

    saveData.actionLog = actionLog;
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

    return actionLog;
}

function logAction(message) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    updateActionLog({
        time: timeString,
        message: message,
        timestamp: now.getTime()
    });

    if (devMenuOpen)
        updateActionLogDisplay();
}

function updateActionLogDisplay() {
    const logContainer = document.getElementById('action-log-entries');
    if (!logContainer)
        return;

    const actionLog = getCurrentActionLog();

    if (actionLog.length === 0) {
        logContainer.innerHTML = `
			<div class="action-log-empty">
                Actions you perform in the Dev Menu will be logged permanently in this action log.
            </div>
		`;
    } else {
        logContainer.innerHTML = actionLog.map(entry => {
            let formattedMessage = entry.message.replace(
                    /\[GOLD\](.*?)\[\/GOLD\]/g,
                    '<span class="action-log-gold">$1</span>');

            formattedMessage = formattedMessage.replace(
                    /\b(Level \d+)\b/g,
                    '<span class="action-log-level">$1</span>');

            formattedMessage = formattedMessage.replace(
                    /(\d[\d,.]*(?:e[+-]?\d+)*(?:[KMBTQa-zA-Z]*))/g,
                    (match) => /\d/.test(match) ? `<span class="action-log-number">${match}</span>` : match);

            return `
                <div class="action-log-entry">
                    <span class="action-log-time">${entry.time}:</span>
                    <span class="action-log-message">${formattedMessage}</span>
                </div>
            `;
        }).join('');
    }
}

function cleanUpLogs() {
    const actionLog = getCurrentActionLog();
    if (actionLog.length > maxLogEntries) {
        actionLog = actionLog.slice(0, maxLogEntries);
        localStorage.setItem('actionLog', JSON.stringify(actionLog));
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'c' && testModeEnabled) {
        e.preventDefault();
        if (devMenuOpen) {
            closeDevMenu();
        } else {
            createDevMenu();
        }
    }
});

function instantCompleteMerchantDialogues() {
    const saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};

    let completeCount = 0;

    // Iterate through the merchant dialogues and mark them as completed
    merchantDialogues.introduction.options.forEach(option => {
        if (!option.completed) {
            // Mark the dialogue as completed
            option.completed = true;

            // Give the reward for this dialogue
            if (option.reward) {
                if (option.reward.type === 'platinum') {
                    saveData.platinumCoins = (saveData.platinumCoins || 0) + option.reward.amount;
                } else if (option.reward.type === 'molten') {
                    saveData.moltenCoins = (saveData.moltenCoins || 0) + option.reward.amount;
                } else {
                    // Regular coins
                    coinCount += option.reward.amount || option.reward;
                }
            }

            completeCount++;
        }
    });

    // Save the updated save data
    saveData.dialogues = merchantDialogues.introduction.options.map(option => ({
                id: option.id,
                completed: option.completed
            }));
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

    // Log the action in the action log
    logAction(`Instantly completed all merchant dialogues. Total dialogues completed: ${completeCount}`);

    updateDevMenu();
    refreshAllDisplays();
    showDialogue();
}

function resetAllStats() {
    // Load save data
    let saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    let resetCount = 0;

    // Reset the global coin count
    if (coinCount !== 0) {
        coinCount = 0;
        resetCount++;
    }

    // Define the correct keys and their default values
    const statProperties = [{
            key: 'moltenCoins',
        default:
            0
        }, {
            key: 'platinumCoins',
        default:
            0
        }, {
            key: 'specialCoins',
        default:
            0
        }, {
            key: 'level',
        default:
            0
        }, {
            key: 'xp',
        default:
            0
        }, {
            key: 'xpNeeded',
        default:
            10
        }
    ];

    // Reset each stat in the save data
    statProperties.forEach(stat => {
        // Only reset if the property exists and is different from its default value
        if (typeof saveData[stat.key] !== 'undefined' && saveData[stat.key] !== stat.default) {
            saveData[stat.key] = stat.default;
            resetCount++;
        }
    });

    // Save the updated data
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

    // Log the action with the total reset count
    logAction(`Reset all stats to nothing. Total stats reset: ${resetCount}`);

    // Update the UI immediately
    updateDevMenu();
    refreshAllDisplays();
}

function resetAllUpgradesToZero() {
    let saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    const upgradeCategories = [
        'upgrades',
        'specialUpgrades',
        'forgeUpgrades',
        'platinumUpgrades'
    ];

    let resetCount = 0;

    upgradeCategories.forEach(category => {
        if (saveData[category]) {
            Object.keys(saveData[category]).forEach(id => {
                const currentLevel = saveData[category][id].level;
                if (currentLevel !== 0) {
                    saveData[category][id].level = 0;
                    resetCount++;
                }
            });
        }
    });

    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

    logAction(`Reset all upgrades to Level 0. Total upgrades reset: ${resetCount}`);

    applyUpgradeEffects();
    updateDevMenu();
    updateMerchantDisplay();
}

function clearAllCoins() {
    // Remove all coin elements
    const coins = document.querySelectorAll('.coin, .special-coin, .boost-coin, .platinum-coin');
    coins.forEach(coin => coin.remove());

    // Clear pending spawns
    activeSpawns.forEach(timeoutId => clearTimeout(timeoutId));
    activeSpawns = [];
}

function incrementAllUpgradeLevels() {
    // Load current save data
    let saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};
    let incrementCount = 0;

    // Define the upgrade categories and their corresponding keys
    const upgradeCategories = [{
            key: 'upgrades',
            upgrades: upgrades
        }, {
            key: 'specialUpgrades',
            upgrades: specialUpgrades
        }, {
            key: 'forgeUpgrades',
            upgrades: forgeUpgrades
        }, {
            key: 'platinumUpgrades',
            upgrades: platinumUpgrades
        }
    ];

    // Ensure the upgrade categories exist in saveData
    upgradeCategories.forEach(category => {
        if (!saveData[category.key]) {
            saveData[category.key] = {};
        }
    });

    // Iterate over each category of upgrades and increment their levels
    upgradeCategories.forEach(category => {
        Object.entries(category.upgrades).forEach(([id, upgrade]) => {
            // Check if the upgrade exists in the save data
            const currentLevel = saveData[category.key][id]?.level || 0;

            // If it doesn't exist in the save data, initialize it with level 0
            if (saveData[category.key][id] === undefined) {
                saveData[category.key][id] = {
                    level: 0
                };
            }

            // Increment the level by 1
            saveData[category.key][id].level = currentLevel + 1;
            incrementCount++;
        });
    });

    // Save the updated data
    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

    // Log the action
    logAction(`Incremented all upgrade levels by 1. Total upgrades incremented: ${incrementCount}`);

    // Update the UI to reflect the changes
    updateDevMenu();
    applyUpgradeEffects();
    refreshAllDisplays();
}

function resetGame() {
    // Load current save data
    let saveData = JSON.parse(localStorage.getItem(`saveSlot${currentSlotId}`)) || {};

    const upgradeCategories = [
        'upgrades', 'specialUpgrades', 'forgeUpgrades', 'platinumUpgrades'
    ];

    if (coinCount !== 0) {
        coinCount = 0;
    }

    upgradeCategories.forEach(category => {
        saveData[category] = {};
    });

    const statsToReset = [
        'coins', 'moltenCoins', 'platinumCoins', 'specialCoins', 'level', 'xp', 'xpNeeded'
    ];

    statsToReset.forEach(stat => {
        if (stat === 'xpNeeded') {
            saveData[stat] = 10;
        } else {
            saveData[stat] = 0;
        }
    });

    // Set key flags to false
    const flagsToReset = [
        'hasReached10Coins', 'hasDoneForgeReset', 'hasPlatinumUnlocked',
    ];

    flagsToReset.forEach(flag => {
        saveData[flag] = false;
    });

    localStorage.setItem(`saveSlot${currentSlotId}`, JSON.stringify(saveData));

    updateDevMenu();
    updateActionLogDisplay();

    restoreMerchantDialogues();

    logAction('Performed a hard reset. All stats and upgrades have been wiped.');
    clearAllCoins();
    applyUpgradeEffects();
}
