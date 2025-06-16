document.addEventListener('DOMContentLoaded', function() {
    // Game elements
    const introSection = document.getElementById('intro-section');
    const gameSection = document.getElementById('game-section');
    const startBtn = document.getElementById('start-game');
    const backBtn = document.getElementById('back-to-menu');
    const gameBoard = document.getElementById('game-board');
    const progressBar = document.getElementById('progress-bar');
    const timerDisplay = document.getElementById('timer');
    const scoreDisplay = document.getElementById('score');
    const movesDisplay = document.getElementById('moves');
    const levelButtons = document.querySelectorAll('.level-btn');
    const resultModal = document.getElementById('result-modal');
    const modalClose = document.querySelector('.close');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const resultScore = document.getElementById('result-score');
    const playAgainBtn = document.getElementById('play-again');
    const helpBtn = document.getElementById('help-btn');
    const instructionsModal = document.getElementById('instructions-modal');
    const instructionsClose = document.querySelector('#instructions-modal .close');

    // Game state
    let currentLevel = 'easy';
    let score = 0;
    let moves = 0;
    let timer = 0;
    let timerInterval;
    let selectedCards = [];
    let matchedPairs = 0;
    let totalPairs = 0;
    let gameStarted = false;
    let gameFinished = false;
    
    // Audio effects
    let flipSound = new Audio();
    let matchSound = new Audio();
    let errorSound = new Audio();
    let winSound = new Audio();
    
    // Pre-load audio files
    function loadAudio() {
        flipSound.src = 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3';
        matchSound.src = 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3';
        errorSound.src = 'https://assets.mixkit.co/active_storage/sfx/952/952-preview.mp3';
        winSound.src = 'https://assets.mixkit.co/active_storage/sfx/282/282-preview.mp3';
        
        // Preload sounds
        flipSound.load();
        matchSound.load();
        errorSound.load();
        winSound.load();
    }
    
    loadAudio();

    // Crochet stitch data
    const stitchData = [
        {
            name: "Chain Stitch",
            image: "https://public.youware.com/users-website-assets/prod/655e34bf-b4d0-41d0-8aec-0b830b42677b/gc1b626b4039fd02577ddc5060cb3e87e80e02c2fbdf99a8ac9aa3f7edc287b9ab181aa1bec193e546e7ef3281b01f0ec91b8bf4690071049fea9bb2a1ec7ccaf_1280.jpg",
            description: "The foundation of most crochet projects"
        },
        {
            name: "Single Crochet",
            image: "https://public.youware.com/users-website-assets/prod/655e34bf-b4d0-41d0-8aec-0b830b42677b/g2b1d73b9f745a662b945b1e7a52cb80b947ae37e52a1d2ba2dcd4892c8c4092d0c03f541d4f14a713ed4625aea3fa291c003f980c2b9edfb7173af86f21b5c02_1280.jpg",
            description: "Creates a dense, sturdy fabric"
        },
        {
            name: "Double Crochet",
            image: "https://public.youware.com/users-website-assets/prod/655e34bf-b4d0-41d0-8aec-0b830b42677b/g4fced38b55540e6ed29f9750fcaff42badc8829381357e1745173393ecc02a37d5e970af38f0119d44156279c32eabdad26c5f2045d89e8001a5242a5bc53730_1280.jpg",
            description: "A taller stitch that works up quickly"
        },
        {
            name: "Half Double Crochet",
            image: "https://public.youware.com/users-website-assets/prod/655e34bf-b4d0-41d0-8aec-0b830b42677b/gc1b626b4039fd02577ddc5060cb3e87e80e02c2fbdf99a8ac9aa3f7edc287b9ab181aa1bec193e546e7ef3281b01f0ec91b8bf4690071049fea9bb2a1ec7ccaf_1280.jpg",
            description: "Between single and double crochet in height"
        },
        {
            name: "Treble Crochet",
            image: "https://public.youware.com/users-website-assets/prod/655e34bf-b4d0-41d0-8aec-0b830b42677b/g2b1d73b9f745a662b945b1e7a52cb80b947ae37e52a1d2ba2dcd4892c8c4092d0c03f541d4f14a713ed4625aea3fa291c003f980c2b9edfb7173af86f21b5c02_1280.jpg",
            description: "Taller than double crochet, creates an open fabric"
        },
        {
            name: "Slip Stitch",
            image: "https://public.youware.com/users-website-assets/prod/655e34bf-b4d0-41d0-8aec-0b830b42677b/g4fced38b55540e6ed29f9750fcaff42badc8829381357e1745173393ecc02a37d5e970af38f0119d44156279c32eabdad26c5f2045d89e8001a5242a5bc53730_1280.jpg",
            description: "Used to join stitches or move across a row"
        },
        {
            name: "Shell Stitch",
            image: "https://public.youware.com/users-website-assets/prod/655e34bf-b4d0-41d0-8aec-0b830b42677b/gc1b626b4039fd02577ddc5060cb3e87e80e02c2fbdf99a8ac9aa3f7edc287b9ab181aa1bec193e546e7ef3281b01f0ec91b8bf4690071049fea9bb2a1ec7ccaf_1280.jpg",
            description: "A decorative stitch that fans out like a shell"
        },
        {
            name: "Puff Stitch",
            image: "https://public.youware.com/users-website-assets/prod/655e34bf-b4d0-41d0-8aec-0b830b42677b/g2b1d73b9f745a662b945b1e7a52cb80b947ae37e52a1d2ba2dcd4892c8c4092d0c03f541d4f14a713ed4625aea3fa291c003f980c2b9edfb7173af86f21b5c02_1280.jpg",
            description: "Creates a raised, puffy texture"
        }
    ];

    // Level settings
    const levels = {
        easy: {
            pairs: 4,
            time: 60,
            scoreMultiplier: 1
        },
        medium: {
            pairs: 6,
            time: 90,
            scoreMultiplier: 2
        },
        hard: {
            pairs: 8,
            time: 120,
            scoreMultiplier: 3
        }
    };

    // Initialize game event listeners
    function init() {
        startBtn.addEventListener('click', startGame);
        backBtn.addEventListener('click', returnToMenu);
        helpBtn.addEventListener('click', showInstructions);
        instructionsClose.addEventListener('click', closeInstructions);
        modalClose.addEventListener('click', closeModal);
        playAgainBtn.addEventListener('click', playAgain);

        // Level selection
        levelButtons.forEach(button => {
            button.addEventListener('click', () => {
                levelButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentLevel = button.getAttribute('data-level');
            });
        });

        // Show welcome screen
        introSection.classList.remove('hidden');
        gameSection.classList.add('hidden');
    }

    // Start game with selected level
    function startGame() {
        gameStarted = true;
        gameFinished = false;
        score = 0;
        moves = 0;
        matchedPairs = 0;
        selectedCards = [];
        
        // Set up level
        totalPairs = levels[currentLevel].pairs;
        timer = levels[currentLevel].time;
        
        // Update display
        updateScore();
        updateTimer();
        updateProgressBar();
        
        // Show game section and hide intro
        introSection.classList.add('hidden');
        gameSection.classList.remove('hidden');
        
        // Create game board
        createGameBoard();
        
        // Start timer
        startTimer();
    }

    // Create game board with cards
    function createGameBoard() {
        gameBoard.innerHTML = '';
        
        // Select stitches for game
        let gameStitches = [...stitchData];
        gameStitches.sort(() => Math.random() - 0.5);
        gameStitches = gameStitches.slice(0, totalPairs);
        
        // Create pairs
        let gamePairs = [];
        gameStitches.forEach(stitch => {
            // Create two copies of each stitch
            gamePairs.push({...stitch, id: Math.random().toString(36).substring(2)});
            gamePairs.push({...stitch, id: Math.random().toString(36).substring(2)});
        });
        
        // Shuffle cards
        gamePairs.sort(() => Math.random() - 0.5);
        
        // Create card elements
        gamePairs.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'flip-container';
            cardElement.dataset.id = card.id;
            cardElement.dataset.name = card.name;
            
            cardElement.innerHTML = `
                <div class="flipper">
                    <div class="front">
                        <span>?</span>
                    </div>
                    <div class="back">
                        <img src="${card.image}" alt="${card.name}">
                        <h3>${card.name}</h3>
                    </div>
                </div>
            `;
            
            cardElement.addEventListener('click', () => flipCard(cardElement));
            gameBoard.appendChild(cardElement);
        });
    }

    // Flip card
    function flipCard(card) {
        // Don't allow flipping if game is finished or card is already flipped
        if (gameFinished || card.classList.contains('flipped') || selectedCards.length >= 2) {
            return;
        }
        
        // Play flip sound
        flipSound.play();
        
        // Flip the card
        card.classList.add('flipped');
        
        // Add to selected cards
        selectedCards.push(card);
        
        // Check for match if two cards are selected
        if (selectedCards.length === 2) {
            moves++;
            updateMoves();
            checkForMatch();
        }
    }

    // Check if selected cards match
    function checkForMatch() {
        const card1 = selectedCards[0];
        const card2 = selectedCards[1];
        
        if (card1.dataset.name === card2.dataset.name) {
            // Match found
            setTimeout(() => {
                matchSound.play();
                card1.classList.add('matched');
                card2.classList.add('matched');
                selectedCards = [];
                matchedPairs++;
                
                // Calculate score - more points for quicker matches
                const timeBonus = Math.floor(timer / 5);
                score += 10 * levels[currentLevel].scoreMultiplier + timeBonus;
                updateScore();
                updateProgressBar();
                
                // Check if game is won
                if (matchedPairs === totalPairs) {
                    gameWon();
                }
            }, 500);
        } else {
            // No match
            setTimeout(() => {
                errorSound.play();
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                selectedCards = [];
            }, 1000);
        }
    }

    // Start timer
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timer--;
            updateTimer();
            
            if (timer <= 0) {
                clearInterval(timerInterval);
                gameLost();
            }
        }, 1000);
    }

    // Update timer display
    function updateTimer() {
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Add warning color when time is running out
        if (timer <= 10) {
            timerDisplay.style.color = 'var(--error-color)';
        } else {
            timerDisplay.style.color = 'var(--text-color)';
        }
    }

    // Update score display
    function updateScore() {
        scoreDisplay.textContent = score;
    }

    // Update moves display
    function updateMoves() {
        movesDisplay.textContent = moves;
    }

    // Update progress bar
    function updateProgressBar() {
        const progress = (matchedPairs / totalPairs) * 100;
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${Math.round(progress)}%`;
    }

    // Game won
    function gameWon() {
        gameFinished = true;
        clearInterval(timerInterval);
        
        // Calculate final score with time bonus
        const timeBonus = timer * 2;
        score += timeBonus;
        updateScore();
        
        // Play win sound
        winSound.play();
        
        // Show win modal
        resultTitle.textContent = 'Congratulations!';
        resultMessage.textContent = `You've mastered the crochet stitches with ${moves} moves and ${timer} seconds remaining!`;
        resultScore.textContent = score;
        resultModal.style.display = 'flex';
    }

    // Game lost
    function gameLost() {
        gameFinished = true;
        
        // Show lose modal
        resultTitle.textContent = 'Time\'s Up!';
        resultMessage.textContent = `You matched ${matchedPairs} out of ${totalPairs} pairs.`;
        resultScore.textContent = score;
        resultModal.style.display = 'flex';
    }

    // Close result modal
    function closeModal() {
        resultModal.style.display = 'none';
    }

    // Play again with same settings
    function playAgain() {
        closeModal();
        startGame();
    }

    // Return to menu
    function returnToMenu() {
        gameFinished = true;
        clearInterval(timerInterval);
        introSection.classList.remove('hidden');
        gameSection.classList.add('hidden');
    }

    // Show instructions modal
    function showInstructions() {
        instructionsModal.style.display = 'flex';
    }

    // Close instructions modal
    function closeInstructions() {
        instructionsModal.style.display = 'none';
    }

    // Initialize the game
    init();
});