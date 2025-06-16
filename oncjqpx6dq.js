document.addEventListener('DOMContentLoaded', function() {
    // Game elements
    const gameGrid = document.getElementById('game-grid');
    const movesDisplay = document.getElementById('moves');
    const matchesDisplay = document.getElementById('matches');
    const startGameBtn = document.getElementById('start-game');
    const hintBtn = document.getElementById('hint-btn');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const resultModal = document.getElementById('result-modal');
    const closeModalBtn = document.querySelector('.close');
    const finalMovesDisplay = document.getElementById('final-moves');
    const playAgainBtn = document.getElementById('play-again');
    const goHomeBtn = document.getElementById('go-home');
    const gameInstructions = document.getElementById('game-instructions');
    const badgeContainer = document.getElementById('badge-container');
    const badgeName = document.getElementById('badge-name');
    const badgeImg = document.getElementById('badge-img');
    
    // Game state
    let cards = [];
    let flippedCards = [];
    let moves = 0;
    let matches = 0;
    let maxMatches = 0;
    let gameStarted = false;
    let canFlip = true;
    let currentDifficulty = 'easy';
    let hintsRemaining = 3;
    
    // Card data
    const cardItems = [
        { id: 'apple', name: 'Apple', emoji: '🍎' },
        { id: 'banana', name: 'Banana', emoji: '🍌' },
        { id: 'orange', name: 'Orange', emoji: '🍊' },
        { id: 'pear', name: 'Pear', emoji: '🍐' },
        { id: 'strawberry', name: 'Strawberry', emoji: '🍓' },
        { id: 'grapes', name: 'Grapes', emoji: '🍇' },
        { id: 'watermelon', name: 'Watermelon', emoji: '🍉' },
        { id: 'kiwi', name: 'Kiwi', emoji: '🥝' },
        { id: 'pineapple', name: 'Pineapple', emoji: '🍍' },
        { id: 'cherry', name: 'Cherry', emoji: '🍒' },
        { id: 'peach', name: 'Peach', emoji: '🍑' },
        { id: 'coconut', name: 'Coconut', emoji: '🥥' },
        { id: 'avocado', name: 'Avocado', emoji: '🥑' },
        { id: 'lemon', name: 'Lemon', emoji: '🍋' },
        { id: 'mango', name: 'Mango', emoji: '🥭' },
        { id: 'blueberries', name: 'Blueberries', emoji: '🫐' },
        { id: 'melon', name: 'Melon', emoji: '🍈' },
        { id: 'tomato', name: 'Tomato', emoji: '🍅' }
    ];
    
    // Difficulty settings
    const difficultySetting = {
        'easy': {
            pairs: 6,
            maxHints: 3
        },
        'medium': {
            pairs: 8,
            maxHints: 2
        },
        'hard': {
            pairs: 12,
            maxHints: 1
        }
    };
    
    // Badges
    const badges = {
        'easy': {
            name: 'Novice Matcher',
            emoji: '🥉'
        },
        'medium': {
            name: 'Memory Expert',
            emoji: '🥈'
        },
        'hard': {
            name: 'Memory Master',
            emoji: '🥇'
        }
    };
    
    // Initialize game
    function initGame() {
        // Reset game state
        gameGrid.innerHTML = '';
        flippedCards = [];
        moves = 0;
        matches = 0;
        gameStarted = true;
        canFlip = true;
        
        // Update display
        movesDisplay.textContent = moves;
        matchesDisplay.textContent = matches;
        
        // Get difficulty settings
        const difficulty = difficultySetting[currentDifficulty];
        maxMatches = difficulty.pairs;
        hintsRemaining = difficulty.maxHints;
        
        // Update instructions
        gameInstructions.textContent = `Match all ${maxMatches} pairs! You have ${hintsRemaining} hints available.`;
        
        // Enable hint button based on hints available
        if (hintsRemaining > 0) {
            hintBtn.disabled = false;
        } else {
            hintBtn.disabled = true;
        }
        
        // Shuffle and select card items for current difficulty
        const shuffledItems = [...cardItems].sort(() => Math.random() - 0.5);
        const selectedItems = shuffledItems.slice(0, maxMatches);
        
        // Create card pairs
        cards = [];
        selectedItems.forEach(item => {
            // Add two cards for each item (pair)
            cards.push({
                id: `${item.id}_1`,
                itemId: item.id,
                name: item.name,
                emoji: item.emoji,
                matched: false
            });
            
            cards.push({
                id: `${item.id}_2`,
                itemId: item.id,
                name: item.name,
                emoji: item.emoji,
                matched: false
            });
        });
        
        // Shuffle cards
        cards.sort(() => Math.random() - 0.5);
        
        // Create card elements
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.id = card.id;
            
            cardElement.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">?</div>
                    <div class="card-back">
                        <div class="card-image">${card.emoji}</div>
                        <div class="card-name">${card.name}</div>
                    </div>
                </div>
            `;
            
            cardElement.addEventListener('click', () => flipCard(cardElement, card));
            gameGrid.appendChild(cardElement);
        });
    }
    
    // Flip card
    function flipCard(cardElement, card) {
        // Check if card can be flipped
        if (!canFlip || cardElement.classList.contains('flipped') || card.matched || flippedCards.length >= 2) {
            return;
        }
        
        // Flip the card
        cardElement.classList.add('flipped');
        flippedCards.push({ element: cardElement, card: card });
        
        // Check if two cards are flipped
        if (flippedCards.length === 2) {
            // Update moves
            moves++;
            movesDisplay.textContent = moves;
            
            // Prevent further flipping until match check is complete
            canFlip = false;
            
            // Check for match
            checkForMatch();
        }
    }
    
    // Check for match
    function checkForMatch() {
        const card1 = flippedCards[0];
        const card2 = flippedCards[1];
        
        if (card1.card.itemId === card2.card.itemId) {
            // Match found
            card1.card.matched = true;
            card2.card.matched = true;
            matches++;
            matchesDisplay.textContent = matches;
            
            // Reset flipped cards
            flippedCards = [];
            canFlip = true;
            
            // Check if game is complete
            if (matches === maxMatches) {
                setTimeout(gameComplete, 500);
            }
        } else {
            // No match, flip back after delay
            setTimeout(() => {
                card1.element.classList.remove('flipped');
                card2.element.classList.remove('flipped');
                flippedCards = [];
                canFlip = true;
            }, 1000);
        }
    }
    
    // Show hint
    function showHint() {
        if (hintsRemaining <= 0 || matches === maxMatches) {
            return;
        }
        
        // Find unmatched pairs
        const unmatchedPairs = {};
        cards.forEach(card => {
            if (!card.matched) {
                if (unmatchedPairs[card.itemId]) {
                    unmatchedPairs[card.itemId].push(card.id);
                } else {
                    unmatchedPairs[card.itemId] = [card.id];
                }
            }
        });
        
        // Select a random unmatched pair
        const unmatchedKeys = Object.keys(unmatchedPairs);
        if (unmatchedKeys.length === 0) return;
        
        const randomKey = unmatchedKeys[Math.floor(Math.random() * unmatchedKeys.length)];
        const pairIds = unmatchedPairs[randomKey];
        
        // Flash the hint
        const cardElements = pairIds.map(id => document.querySelector(`.card[data-id="${id}"]`));
        
        cardElements.forEach(element => {
            element.classList.add('hint');
            setTimeout(() => {
                element.classList.remove('hint');
            }, 1000);
        });
        
        // Update hint count
        hintsRemaining--;
        
        // Update instructions
        gameInstructions.textContent = `Hints remaining: ${hintsRemaining}`;
        
        // Disable hint button if all used
        if (hintsRemaining <= 0) {
            hintBtn.disabled = true;
        }
    }
    
    // Game complete
    function gameComplete() {
        // Show result modal
        resultModal.style.display = 'flex';
        finalMovesDisplay.textContent = moves;
        
        // Award badge based on difficulty
        const badge = badges[currentDifficulty];
        badgeName.textContent = badge.name;
        
        // Set badge emoji
        badgeImg.textContent = badge.emoji;
        
        // Award badge using badge-manager.js if available
        if (window.BadgeManager && typeof window.BadgeManager.awardBadge === 'function') {
            window.BadgeManager.awardBadge(`memory_match_${currentDifficulty}`);
        }
    }
    
    // Event listeners
    startGameBtn.addEventListener('click', initGame);
    
    hintBtn.addEventListener('click', showHint);
    
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            difficultyBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update difficulty
            currentDifficulty = this.dataset.difficulty;
            
            // Reset and init game if already started
            if (gameStarted) {
                initGame();
            }
        });
    });
    
    closeModalBtn.addEventListener('click', function() {
        resultModal.style.display = 'none';
    });
    
    playAgainBtn.addEventListener('click', function() {
        resultModal.style.display = 'none';
        initGame();
    });
    
    goHomeBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === resultModal) {
            resultModal.style.display = 'none';
        }
    });
    
    // Initialize with first game
    initGame();
});