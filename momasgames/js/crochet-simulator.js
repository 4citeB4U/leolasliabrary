document.addEventListener('DOMContentLoaded', function() {
    // Game elements
    const introSection = document.getElementById('intro-section');
    const simulatorSection = document.getElementById('simulator-section');
    const startBtn = document.getElementById('start-simulator');
    const backBtn = document.getElementById('back-to-menu');
    const helpBtn = document.getElementById('help-btn');
    const resetBtn = document.getElementById('reset-btn');
    const crochetBoard = document.getElementById('crochet-board');
    const patternSteps = document.getElementById('pattern-steps');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const viewButtons = document.querySelectorAll('.view-btn');
    const scoreDisplay = document.getElementById('score');
    const progressDisplay = document.getElementById('progress');
    const timeDisplay = document.getElementById('time');
    const resultModal = document.getElementById('result-modal');
    const modalClose = document.querySelector('.close');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const resultScore = document.getElementById('result-score');
    const playAgainBtn = document.getElementById('play-again');
    const tryHarderBtn = document.getElementById('try-harder');
    const helpOverlay = document.getElementById('help-overlay');
    const closeHelpBtn = document.getElementById('close-help');
    const gameStatus = document.getElementById('game-status');
    const statusMessage = document.getElementById('status-message');
    const stepInstruction = document.getElementById('step-instruction');
    const currentStepNumber = document.getElementById('current-step-number');
    const totalSteps = document.getElementById('total-steps');

    // Game state
    let currentDifficulty = 'easy';
    let currentView = 'normal';
    let score = 0;
    let timer = 0;
    let timerInterval;
    let currentPattern = [];
    let currentStep = 0;
    let selectedYarn = null;
    let hookActive = false;
    let completedStitches = 0;
    let totalStitches = 0;
    let gameStarted = false;
    let gameFinished = false;
    let gamePhase = 'start'; // 'start', 'yarn-selected', 'hook-active', 'playing'
    
    // Audio effects with fallback
    let stitchSound = new Audio();
    let correctSound = new Audio();
    let wrongSound = new Audio();
    let completeSound = new Audio();
    
    // Pre-load audio files with fallback
    function loadAudio() {
        try {
            stitchSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt55';
            correctSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt55';
            wrongSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt55';
            completeSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt55';
        } catch (e) {
            console.log('Audio loading fallback mode');
        }
    }
    
    loadAudio();

    // Crochet patterns - simplified for clarity
    const patterns = {
        easy: {
            name: "Simple Coaster",
            steps: [
                { type: "chain", count: 3, description: "Chain 3 stitches to start" },
                { type: "single", count: 3, description: "Single crochet in each chain" },
                { type: "single", count: 3, description: "Add another row of single crochet" }
            ],
            gridSize: 4,
            timeLimit: 120
        },
        medium: {
            name: "Small Square",
            steps: [
                { type: "chain", count: 4, description: "Chain 4 stitches" },
                { type: "single", count: 4, description: "Single crochet row" },
                { type: "double", count: 4, description: "Double crochet row" },
                { type: "single", count: 4, description: "Finish with single crochet" }
            ],
            gridSize: 5,
            timeLimit: 180
        },
        hard: {
            name: "Pattern Swatch",
            steps: [
                { type: "chain", count: 6, description: "Foundation chain of 6" },
                { type: "single", count: 6, description: "Single crochet row" },
                { type: "double", count: 6, description: "Double crochet row" },
                { type: "single", count: 3, description: "Half single crochet" },
                { type: "double", count: 3, description: "Half double crochet" },
                { type: "single", count: 6, description: "Final single crochet row" }
            ],
            gridSize: 6,
            timeLimit: 240
        }
    };

    // Initialize game event listeners
    function init() {
        startBtn.addEventListener('click', startSimulator);
        backBtn.addEventListener('click', returnToMenu);
        resetBtn.addEventListener('click', resetGame);
        helpBtn.addEventListener('click', showHelp);
        closeHelpBtn.addEventListener('click', hideHelp);
        modalClose.addEventListener('click', closeModal);
        playAgainBtn.addEventListener('click', playAgain);
        tryHarderBtn.addEventListener('click', tryHarder);

        // Difficulty selection
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                difficultyButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentDifficulty = button.getAttribute('data-difficulty');
                updateInstructions();
            });
        });
        
        // View selection
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                viewButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentView = button.getAttribute('data-view');
                updateView();
            });
        });

        // Show welcome screen
        introSection.classList.remove('hidden');
        simulatorSection.classList.add('hidden');
        updateInstructions();
    }

    // Update instructions based on current state
    function updateInstructions() {
        const difficulty = patterns[currentDifficulty];
        if (totalSteps) {
            totalSteps.textContent = difficulty.steps.length;
        }
        
        switch (gamePhase) {
            case 'start':
                if (stepInstruction) {
                    stepInstruction.textContent = `Ready to start ${difficulty.name}? Select a yarn color to begin!`;
                }
                break;
            case 'yarn-selected':
                if (stepInstruction) {
                    stepInstruction.textContent = "Great! Now click on the crochet hook to activate it.";
                }
                break;
            case 'hook-active':
                if (stepInstruction) {
                    stepInstruction.textContent = "Perfect! Now click on the glowing squares to make stitches.";
                }
                break;
            case 'playing':
                if (currentStep < currentPattern.steps.length) {
                    const step = currentPattern.steps[currentStep];
                    if (stepInstruction) {
                        stepInstruction.textContent = step.description;
                    }
                    if (currentStepNumber) {
                        currentStepNumber.textContent = currentStep + 1;
                    }
                }
                break;
        }
    }

    // Start simulator with selected difficulty
    function startSimulator() {
        gameStarted = true;
        gameFinished = false;
        gamePhase = 'start';
        score = 0;
        completedStitches = 0;
        currentStep = 0;
        selectedYarn = null;
        hookActive = false;
        
        // Set up pattern
        currentPattern = patterns[currentDifficulty];
        totalStitches = currentPattern.steps.reduce((total, step) => total + step.count, 0);
        timer = currentPattern.timeLimit;
        
        // Update display
        updateScore();
        updateTimer();
        updateProgress();
        updateInstructions();
        
        // Show simulator section and hide intro
        introSection.classList.add('hidden');
        simulatorSection.classList.remove('hidden');
        
        // Create crochet board
        createCrochetBoard();
        
        // Create pattern steps
        createPatternSteps();
        
        // Start timer
        startTimer();
        
        // Show initial status
        showStatus("Click on a yarn ball to select your color!", 3000);
    }

    // Create crochet board
    function createCrochetBoard() {
        const board = document.getElementById('crochet-board');
        board.style.transform = currentView === '3d' ? 'perspective(1000px) rotateX(20deg)' : 'none';
        
        // Create stitch grid
        const stitchGrid = document.createElement('div');
        stitchGrid.className = 'stitch-grid';
        stitchGrid.style.gridTemplateColumns = `repeat(${currentPattern.gridSize}, 50px)`;
        stitchGrid.style.gridTemplateRows = `repeat(${currentPattern.gridSize}, 50px)`;
        
        // Create cells
        for (let i = 0; i < currentPattern.gridSize * currentPattern.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'stitch-cell';
            cell.dataset.index = i;
            
            // Create stitch element
            const stitch = document.createElement('div');
            stitch.className = 'stitch';
            cell.appendChild(stitch);
            
            cell.addEventListener('click', () => attemptStitch(cell));
            stitchGrid.appendChild(cell);
        }
        
        board.innerHTML = '';
        board.appendChild(stitchGrid);
        
        // Create yarn container
        const yarnContainer = document.createElement('div');
        yarnContainer.className = 'yarn-container';
        
        const yarnColors = ['pink', 'blue', 'green', 'purple', 'yellow'];
        yarnColors.forEach(color => {
            const yarnBall = document.createElement('div');
            yarnBall.className = `yarn-ball ${color}`;
            yarnBall.dataset.color = color;
            yarnBall.addEventListener('click', () => selectYarn(yarnBall));
            yarnContainer.appendChild(yarnBall);
        });
        
        board.appendChild(yarnContainer);
        
        // Create hook
        const hookContainer = document.createElement('div');
        hookContainer.className = 'hook-container';
        
        const hook = document.createElement('div');
        hook.className = 'hook';
        hook.addEventListener('click', toggleHook);
        
        hookContainer.appendChild(hook);
        board.appendChild(hookContainer);
    }

    // Create pattern steps
    function createPatternSteps() {
        patternSteps.innerHTML = '';
        
        const stepsList = document.createElement('div');
        stepsList.className = 'pattern-steps';
        
        currentPattern.steps.forEach((step, index) => {
            const stepItem = document.createElement('li');
            stepItem.dataset.index = index;
            stepItem.textContent = step.description;
            
            if (index === 0 && gamePhase === 'playing') {
                stepItem.classList.add('current');
            }
            
            stepsList.appendChild(stepItem);
        });
        
        patternSteps.appendChild(stepsList);
    }

    // Select yarn
    function selectYarn(yarnBall) {
        // Play sound
        try {
            stitchSound.play();
        } catch (e) {}
        
        // Deselect all yarn balls
        document.querySelectorAll('.yarn-ball').forEach(ball => {
            ball.classList.remove('selected');
        });
        
        // Select this yarn ball
        yarnBall.classList.add('selected');
        selectedYarn = yarnBall.dataset.color;
        gamePhase = 'yarn-selected';
        
        updateInstructions();
        showStatus(`Great choice! ${selectedYarn.charAt(0).toUpperCase() + selectedYarn.slice(1)} yarn selected. Now click the hook!`, 2000);
        
        score += 5;
        updateScore();
    }

    // Toggle hook
    function toggleHook() {
        if (!selectedYarn) {
            showStatus("Please select a yarn color first!", 2000);
            return;
        }
        
        const hook = document.querySelector('.hook');
        hook.classList.add('active');
        hookActive = true;
        gamePhase = 'hook-active';
        
        // Play sound
        try {
            correctSound.play();
        } catch (e) {}
        
        updateInstructions();
        showStatus("Hook activated! Click on the glowing squares to make stitches.", 2000);
        
        score += 10;
        updateScore();
        
        // Start highlighting cells after a short delay
        setTimeout(() => {
            gamePhase = 'playing';
            updateInstructions();
            highlightNextStitchCells();
            
            // Mark first step as current
            const firstStepItem = document.querySelector('.pattern-steps li[data-index="0"]');
            if (firstStepItem) {
                firstStepItem.classList.add('current');
            }
        }, 1000);
    }

    // Attempt stitch
    function attemptStitch(cell) {
        if (!gameStarted || gameFinished || !selectedYarn || !hookActive || gamePhase !== 'playing') {
            if (!selectedYarn) {
                showStatus("Select a yarn color first!", 1500);
            } else if (!hookActive) {
                showStatus("Activate your hook first!", 1500);
            }
            return;
        }
        
        // Check if this cell is currently highlighted
        if (!cell.classList.contains('highlight')) {
            try {
                wrongSound.play();
            } catch (e) {}
            
            // Apply shake animation
            cell.classList.add('wrong');
            setTimeout(() => {
                cell.classList.remove('wrong');
            }, 500);
            showStatus("Click on the glowing squares only!", 1500);
            return;
        }
        
        // Get current step
        const step = currentPattern.steps[currentStep];
        
        // Get stitch element
        const stitch = cell.querySelector('.stitch');
        
        // Set stitch class based on current step
        stitch.className = `stitch visible stitch-${step.type}`;
        
        // Set stitch color
        stitch.style.backgroundColor = `var(--yarn-${selectedYarn})`;
        
        // Play stitch sound
        try {
            stitchSound.play();
        } catch (e) {}
        
        // Mark cell as completed
        cell.classList.remove('highlight');
        cell.classList.add('completed');
        
        // Update completed stitches
        completedStitches++;
        
        // Add score
        score += 10 * (currentDifficulty === 'easy' ? 1 : (currentDifficulty === 'medium' ? 2 : 3));
        updateScore();
        updateProgress();
        
        // Check if step is complete
        const stepCells = document.querySelectorAll('.stitch-cell.highlight');
        if (stepCells.length === 0) {
            // Mark current step as completed
            const currentStepItem = document.querySelector(`.pattern-steps li[data-index="${currentStep}"]`);
            if (currentStepItem) {
                currentStepItem.classList.remove('current');
                currentStepItem.classList.add('completed');
            }
            
            // Move to next step
            currentStep++;
            
            // Check if pattern is complete
            if (currentStep >= currentPattern.steps.length) {
                patternComplete();
                return;
            }
            
            // Highlight next step cells
            setTimeout(() => {
                highlightNextStitchCells();
                
                // Mark next step as current
                const nextStepItem = document.querySelector(`.pattern-steps li[data-index="${currentStep}"]`);
                if (nextStepItem) {
                    nextStepItem.classList.add('current');
                }
                
                updateInstructions();
                showStatus("Step completed! Continue with the next step.", 1500);
            }, 500);
            
            // Play correct sound
            try {
                correctSound.play();
            } catch (e) {}
        }
    }

    // Highlight next stitch cells
    function highlightNextStitchCells() {
        // Clear any existing highlights
        document.querySelectorAll('.stitch-cell.highlight').forEach(cell => {
            cell.classList.remove('highlight');
        });
        
        // Get current step
        const step = currentPattern.steps[currentStep];
        
        // Find available cells (not completed)
        const availableCells = Array.from(document.querySelectorAll('.stitch-cell:not(.completed)'));
        
        // Select cells for this step
        const selectedCells = availableCells.slice(0, step.count);
        
        // Highlight selected cells
        selectedCells.forEach(cell => {
            cell.classList.add('highlight');
        });
    }

    // Show status message
    function showStatus(message, duration = 2000) {
        if (statusMessage) {
            statusMessage.textContent = message;
            gameStatus.classList.remove('hidden');
            
            setTimeout(() => {
                gameStatus.classList.add('hidden');
            }, duration);
        }
    }

    // Pattern complete
    function patternComplete() {
        gameFinished = true;
        clearInterval(timerInterval);
        
        // Add time bonus
        const timeBonus = timer * 3;
        score += timeBonus;
        updateScore();
        
        // Play complete sound
        try {
            completeSound.play();
        } catch (e) {}
        
        // Trigger confetti celebration
        if (window.confetti && typeof window.confetti.celebrate === 'function') {
            confetti.celebrate();
        }
        
        // Award badge for completed difficulty
        if (window.badgeSystem && typeof window.badgeSystem.awardBadge === 'function') {
            badgeSystem.awardBadge(currentDifficulty);
        }
        
        // Show complete modal
        resultTitle.textContent = '🎉 Congratulations!';
        resultMessage.textContent = `You've completed the ${currentPattern.name} pattern with ${timer} seconds remaining!`;
        resultScore.textContent = score;
        resultModal.style.display = 'flex';
    }

    // Start timer
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timer--;
            updateTimer();
            
            if (timer <= 0) {
                clearInterval(timerInterval);
                gameOver();
            }
        }, 1000);
    }

    // Update timer display
    function updateTimer() {
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Add warning color when time is running out
        if (timer <= 30) {
            timeDisplay.style.color = 'var(--error-color)';
        } else {
            timeDisplay.style.color = 'var(--accent-color)';
        }
    }

    // Update score display
    function updateScore() {
        scoreDisplay.textContent = score;
    }

    // Update progress display
    function updateProgress() {
        const progress = totalStitches > 0 ? Math.floor((completedStitches / totalStitches) * 100) : 0;
        progressDisplay.textContent = `${progress}%`;
    }

    // Update view
    function updateView() {
        const board = document.getElementById('crochet-board');
        if (board) {
            board.style.transform = currentView === '3d' ? 'perspective(1000px) rotateX(20deg)' : 'none';
        }
    }

    // Game over
    function gameOver() {
        gameFinished = true;
        
        // Show game over modal
        resultTitle.textContent = '⏰ Time\'s Up!';
        resultMessage.textContent = `You completed ${completedStitches} out of ${totalStitches} stitches. Great effort!`;
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
        startSimulator();
    }

    // Try harder difficulty
    function tryHarder() {
        closeModal();
        if (currentDifficulty === 'easy') {
            currentDifficulty = 'medium';
        } else if (currentDifficulty === 'medium') {
            currentDifficulty = 'hard';
        }
        
        // Update difficulty button
        difficultyButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-difficulty') === currentDifficulty) {
                btn.classList.add('active');
            }
        });
        
        startSimulator();
    }

    // Reset game
    function resetGame() {
        gameFinished = true;
        clearInterval(timerInterval);
        startSimulator();
    }

    // Return to menu
    function returnToMenu() {
        gameFinished = true;
        clearInterval(timerInterval);
        introSection.classList.remove('hidden');
        simulatorSection.classList.add('hidden');
    }

    // Show help overlay
    function showHelp() {
        helpOverlay.classList.add('visible');
    }

    // Hide help overlay
    function hideHelp() {
        helpOverlay.classList.remove('visible');
    }

    // Initialize the simulator
    init();
});