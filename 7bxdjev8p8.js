// Memory Match Game - Main Integration Module

document.addEventListener('DOMContentLoaded', function() {
    // Check if all required scripts are loaded
    const requiredScripts = [
        { name: 'badge-manager', variable: 'BadgeManager' },
        { name: 'game-helpers', variable: 'gameHelpers' },
        { name: 'game-config', variable: 'memoryMatchExtras' }
    ];
    
    let missingScripts = [];
    requiredScripts.forEach(script => {
        if (!window[script.variable]) {
            missingScripts.push(script.name);
        }
    });
    
    if (missingScripts.length > 0) {
        console.warn(`Memory Match Game: Some required scripts are not loaded: ${missingScripts.join(', ')}`);
    }
    
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
    let gameState = {
        cards: [],
        flippedCards: [],
        moves: 0,
        matches: 0,
        maxMatches: 0,
        gameStarted: false,
        canFlip: true,
        difficulty: 'easy',
        hintsRemaining: 3,
        startTime: null,
        gameTime: 0,
        timerInterval: null
    };
    
    // Create sound effects
    const sounds = window.gameHelpers ? window.gameHelpers.createSoundEffects() : {
        playFlip: () => {},
        playMatch: () => {},
        playComplete: () => {},
        playHint: () => {}
    };
    
    // Get card data from config or use default
    function getCardData() {
        if (window.memoryMatchExtras && window.memoryMatchExtras.gameConfig) {
            // Get random theme
            const themes = Object.keys(window.memoryMatchExtras.gameConfig.themes);
            const randomTheme = themes[Math.floor(Math.random() * themes.length)];
            return window.memoryMatchExtras.gameConfig.themes[randomTheme].items;
        } else {
            // Fallback card data
            return [
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
                { id: 'coconut', name: 'Coconut', emoji: '🥥' }
            ];
        }
    }
    
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
    
    // Badges (fallback if not in config)
    const badges = window.memoryMatchExtras && window.memoryMatchExtras.gameConfig ?
        window.memoryMatchExtras.gameConfig.badges : {
            memory_match_easy: {
                id: 'memory_match_easy',
                name: 'Novice Matcher',
                description: 'Completed on Easy',
                emoji: '🥉'
            },
            memory_match_medium: {
                id: 'memory_match_medium',
                name: 'Memory Expert',
                description: 'Completed on Medium',
                emoji: '🥈'
            },
            memory_match_hard: {
                id: 'memory_match_hard',
                name: 'Memory Master',
                description: 'Completed on Hard',
                emoji: '🥇'
            }
        };
    
    // Start timer
    function startTimer() {
        gameState.startTime = Date.now();
        clearInterval(gameState.timerInterval);
        
        gameState.timerInterval = setInterval(() => {
            gameState.gameTime = Math.floor((Date.now() - gameState.startTime) / 1000);
            
            // Update timer display if exists
            const timerDisplay = document.getElementById('timer');
            if (timerDisplay) {
                const minutes = Math.floor(gameState.gameTime / 60);
                const seconds = gameState.gameTime % 60;
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    // Stop timer
    function stopTimer() {
        clearInterval(gameState.timerInterval);
    }
    
    // Initialize game
    function initGame() {
        // Reset game state
        gameState.cards = [];
        gameState.flippedCards = [];
        gameState.moves = 0;
        gameState.matches = 0;
        gameState.gameStarted = true;
        gameState.canFlip = true;
        
        // Clear the grid
        if (gameGrid) {
            gameGrid.innerHTML = '';
        }
        
        // Update display
        if (movesDisplay) movesDisplay.textContent = gameState.moves;
        if (matchesDisplay) matchesDisplay.textContent = gameState.matches;
        
        // Get difficulty settings
        const difficulty = difficultySetting[gameState.difficulty];
        gameState.maxMatches = difficulty.pairs;
        gameState.hintsRemaining = difficulty.maxHints;
        
        // Update instructions
        if (gameInstructions) {
            gameInstructions.textContent = `Match all ${gameState.maxMatches} pairs! You have ${gameState.hintsRemaining} hints available.`;
        }
        
        // Enable/disable hint button based on hints available
        if (hintBtn) {
            hintBtn.disabled = gameState.hintsRemaining <= 0;
        }
        
        // Get card data
        const cardItems = getCardData();
        
        // Shuffle and select card items for current difficulty
        const shuffledItems = [...cardItems].sort(() => Math.random() - 0.5);
        const selectedItems = shuffledItems.slice(0, gameState.maxMatches);
        
        // Create card pairs
        gameState.cards = [];
        selectedItems.forEach(item => {
            // Add two cards for each item (pair)
            gameState.cards.push({
                id: `${item.id}_1`,
                itemId: item.id,
                name: item.name,
                emoji: item.emoji,
                matched: false
            });
            
            gameState.cards.push({
                id: `${item.id}_2`,
                itemId: item.id,
                name: item.name,
                emoji: item.emoji,
                matched: false
            });
        });
        
        // Shuffle cards
        gameState.cards.sort(() => Math.random() - 0.5);
        
        // Create card elements
        if (gameGrid) {
            gameState.cards.forEach(card => {
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
        
        // Start the timer
        startTimer();
        
        // Record game start in stats
        if (window.memoryMatchExtras && window.memoryMatchExtras.statsTracker) {
            window.memoryMatchExtras.statsTracker.startGame(gameState.difficulty);
        }
    }
    
    // Flip card
    function flipCard(cardElement, card) {
        // Check if card can be flipped
        if (!gameState.canFlip || !cardElement || !gameState.gameStarted || 
            cardElement.classList.contains('flipped') || card.matched || 
            gameState.flippedCards.length >= 2) {
            return;
        }
        
        // Play flip sound
        sounds.playFlip();
        
        // Flip the card
        cardElement.classList.add('flipped');
        gameState.flippedCards.push({ element: cardElement, card: card });
        
        // Check if two cards are flipped
        if (gameState.flippedCards.length === 2) {
            // Update moves
            gameState.moves++;
            if (movesDisplay) movesDisplay.textContent = gameState.moves;
            
            // Prevent further flipping until match check is complete
            gameState.canFlip = false;
            
            // Check for match
            checkForMatch();
        }
    }
    
    // Check for match
    function checkForMatch() {
        const card1 = gameState.flippedCards[0];
        const card2 = gameState.flippedCards[1];
        
        if (card1.card.itemId === card2.card.itemId) {
            // Match found - play match sound
            sounds.playMatch();
            
            // Mark cards as matched
            card1.card.matched = true;
            card2.card.matched = true;
            gameState.matches++;
            if (matchesDisplay) matchesDisplay.textContent = gameState.matches;
            
            // Reset flipped cards
            gameState.flippedCards = [];
            gameState.canFlip = true;
            
            // Check if game is complete
            if (gameState.matches === gameState.maxMatches) {
                setTimeout(gameComplete, 500);
            }
        } else {
            // No match, flip back after delay
            setTimeout(() => {
                if (card1.element) card1.element.classList.remove('flipped');
                if (card2.element) card2.element.classList.remove('flipped');
                gameState.flippedCards = [];
                gameState.canFlip = true;
            }, 1000);
        }
    }
    
    // Show hint
    function showHint() {
        if (gameState.hintsRemaining <= 0 || gameState.matches === gameState.maxMatches) {
            return;
        }
        
        // Play hint sound
        sounds.playHint();
        
        // Find unmatched pairs
        const unmatchedPairs = {};
        gameState.cards.forEach(card => {
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
            if (element) {
                element.classList.add('hint');
                setTimeout(() => {
                    element.classList.remove('hint');
                }, 1000);
            }
        });
        
        // Update hint count
        gameState.hintsRemaining--;
        
        // Update instructions
        if (gameInstructions) {
            gameInstructions.textContent = `Hints remaining: ${gameState.hintsRemaining}`;
        }
        
        // Disable hint button if all used
        if (hintBtn && gameState.hintsRemaining <= 0) {
            hintBtn.disabled = true;
        }
    }
    
    // Game complete
    function gameComplete() {
        // Stop the timer
        stopTimer();
        
        // Play complete sound
        sounds.playComplete();
        
        // Create confetti celebration
        if (window.gameHelpers && window.gameHelpers.createConfetti) {
            window.gameHelpers.createConfetti();
        }
        
        // Record win in stats and check for achievements
        if (window.memoryMatchExtras) {
            if (window.memoryMatchExtras.statsTracker) {
                const results = window.memoryMatchExtras.statsTracker.recordWin(
                    gameState.difficulty, 
                    gameState.moves, 
                    gameState.gameTime
                );
                
                // If new record, show special message
                if (results.isNewBestMoves || results.isNewBestTime) {
                    const recordMsg = document.createElement('div');
                    recordMsg.className = 'new-record';
                    recordMsg.textContent = results.isNewBestMoves ? 
                        '🎉 New record for fewest moves!' : 
                        '⚡ New record for fastest time!';
                    
                    if (resultModal) {
                        const modalContent = resultModal.querySelector('.modal-content');
                        if (modalContent) {
                            modalContent.insertBefore(recordMsg, modalContent.firstChild);
                        }
                    }
                }
            }
            
            if (window.memoryMatchExtras.checkForAchievements) {
                window.memoryMatchExtras.checkForAchievements({
                    difficulty: gameState.difficulty,
                    moves: gameState.moves,
                    matches: gameState.matches,
                    time: gameState.gameTime
                });
            }
        }
        
        // Show result modal
        if (resultModal && finalMovesDisplay) {
            finalMovesDisplay.textContent = gameState.moves;
            
            // Add time info if available
            const timeDisplay = document.getElementById('final-time');
            if (timeDisplay) {
                const minutes = Math.floor(gameState.gameTime / 60);
                const seconds = gameState.gameTime % 60;
                timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // Display star rating if helper available
            if (window.gameHelpers && window.gameHelpers.calculateStarRating) {
                const ratingDisplay = document.getElementById('star-rating');
                if (ratingDisplay) {
                    const rating = window.gameHelpers.calculateStarRating(
                        gameState.moves, 
                        gameState.difficulty, 
                        gameState.maxMatches
                    );
                    window.gameHelpers.displayStarRating(ratingDisplay, rating);
                }
            }
            
            // Award badge based on difficulty
            const badge = badges[`memory_match_${gameState.difficulty}`];
            if (badgeName && badge) {
                badgeName.textContent = badge.name;
            }
            
            // Set badge emoji
            if (badgeImg && badge) {
                badgeImg.textContent = badge.emoji;
            }
            
            // Award badge using badge-manager.js if available
            if (window.BadgeManager && typeof window.BadgeManager.awardBadge === 'function') {
                window.BadgeManager.awardBadge(`memory_match_${gameState.difficulty}`);
            }
            
            resultModal.style.display = 'flex';
        }
    }
    
    // Event listeners
    if (startGameBtn) {
        startGameBtn.addEventListener('click', initGame);
    }
    
    if (hintBtn) {
        hintBtn.addEventListener('click', showHint);
    }
    
    if (difficultyBtns) {
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Update active button
                difficultyBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Update difficulty
                gameState.difficulty = this.dataset.difficulty;
                
                // Reset and init game if already started
                if (gameState.gameStarted) {
                    initGame();
                }
            });
        });
    }
    
    if (closeModalBtn && resultModal) {
        closeModalBtn.addEventListener('click', function() {
            resultModal.style.display = 'none';
        });
    }
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', function() {
            if (resultModal) {
                resultModal.style.display = 'none';
            }
            initGame();
        });
    }
    
    if (goHomeBtn) {
        goHomeBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    // Close modal when clicking outside
    if (resultModal) {
        window.addEventListener('click', function(event) {
            if (event.target === resultModal) {
                resultModal.style.display = 'none';
            }
        });
    }
    
    // Initialize with first game
    initGame();
});