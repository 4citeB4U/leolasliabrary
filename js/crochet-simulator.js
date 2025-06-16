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
    let selectedYarnColor = null;
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
            stitchSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt55';
            correctSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt55';
            wrongSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBT2P2fPPfCwFLIHO8tiJNwgZaLvt55';
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
        if (startBtn) startBtn.addEventListener('click', startSimulator);
        if (backBtn) backBtn.addEventListener('click', returnToMenu);
        if (resetBtn) resetBtn.addEventListener('click', resetGame);
        if (helpBtn) helpBtn.addEventListener('click', showHelp);
        if (closeHelpBtn) closeHelpBtn.addEventListener('click', hideHelp);
        if (modalClose) modalClose.addEventListener('click', closeModal);
        if (playAgainBtn) playAgainBtn.addEventListener('click', playAgain);
        if (tryHarderBtn) tryHarderBtn.addEventListener('click', tryHarder);

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

        // Setup tool and yarn color selection
        setupToolsAndYarn();

        // Show welcome screen
        if (introSection) introSection.classList.remove('hidden');
        if (simulatorSection) simulatorSection.classList.add('hidden');
        updateInstructions();
    }

    // Setup tools and yarn color selection
    function setupToolsAndYarn() {
        // Set up tool selection
        const tools = document.querySelectorAll('.tool');
        tools.forEach(tool => {
            tool.addEventListener('click', () => {
                if (tool.dataset.tool === 'hook') {
                    toggleHook();
                } else if (tool.dataset.tool === 'yarn') {
                    showStatus("Please select a yarn color from below!", 2000);
                } else if (tool.dataset.tool === 'scissors') {
                    cutYarn();
                } else if (tool.dataset.tool === 'undo') {
                    undoLastStitch();
                }
            });
        });

        // Set up yarn color selection
        const yarnColors = document.querySelectorAll('.yarn-color');
        yarnColors.forEach(yarnColor => {
            yarnColor.addEventListener('click', () => {
                yarnColors.forEach(color => color.classList.remove('active'));
                yarnColor.classList.add('active');
                selectedYarnColor = yarnColor.dataset.color;
                selectYarn(selectedYarnColor);
            });
        });

        // Setup crochet board
        setupCrochetBoard();
    }

    // Setup crochet board
    function setupCrochetBoard() {
        if (!crochetBoard) return;
        
        // Create crochet grid
        const crochetGrid = document.createElement('div');
        crochetGrid.className = 'crochet-grid';
        
        // Create cells
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 20; col++) {
                const cell = document.createElement('div');
                cell.className = 'crochet-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => attemptStitch(cell));
                crochetGrid.appendChild(cell);
            }
        }
        
        crochetBoard.innerHTML = '';
        crochetBoard.appendChild(crochetGrid);
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
        selectedYarnColor = null;
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
        if (introSection) introSection.classList.add('hidden');
        if (simulatorSection) simulatorSection.classList.remove('hidden');
        
        // Reset yarn colors and tools
        document.querySelectorAll('.yarn-color').forEach(color => color.classList.remove('active'));
        document.querySelectorAll('.tool').forEach(tool => tool.classList.remove('active'));
        
        // Reset crochet board
        setupCrochetBoard();
        
        // Create pattern steps
        createPatternSteps();
        
        // Start timer
        startTimer();
        
        // Show initial status
        showStatus("Click on a yarn ball to select your color!", 3000);
    }

    // Create pattern steps
    function createPatternSteps() {
        if (!patternSteps) return;
        
        patternSteps.innerHTML = '';
        
        currentPattern.steps.forEach((step, index) => {
            const patternStep = document.createElement('div');
            patternStep.className = 'pattern-step';
            patternStep.dataset.index = index;
            patternStep.textContent = step.description;
            
            patternSteps.appendChild(patternStep);
        });
    }

    // Select yarn
    function selectYarn(color) {
        // Play sound
        try {
            stitchSound.play();
        } catch (e) {}
        
        selectedYarn = true;
        selectedYarnColor = color;
        gamePhase = 'yarn-selected';
        
        updateInstructions();
        showStatus(`Great choice! ${color} yarn selected. Now click the hook!`, 2000);
        
        score += 5;
        updateScore();
    }

    // Toggle hook
    function toggleHook() {
        if (!selectedYarn) {
            showStatus("Please select a yarn color first!", 2000);
            return;
        }
        
        // Activate hook
        const hook = document.querySelector('.tool[data-tool="hook"]');
        if (hook) {
            document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
            hook.classList.add('active');
        }
        
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
            const firstStepItem = document.querySelector('.pattern-step[data-index="0"]');
            if (firstStepItem) {
                firstStepItem.classList.add('active');
            }
        }, 1000);
    }

    // Cut yarn function
    function cutYarn() {
        if (!gameStarted || gameFinished) return;
        
        if (gamePhase === 'playing') {
            showStatus("Cutting yarn... You'll need to select a new color!", 2000);
            selectedYarn = null;
            selectedYarnColor = null;
            gamePhase = 'start';
            
            // Deselect yarn colors
            document.querySelectorAll('.yarn-color').forEach(color => color.classList.remove('active'));
            
            // Deactivate hook
            document.querySelectorAll('.tool').forEach(tool => tool.classList.remove('active'));
            hookActive = false;
            
            updateInstructions();
        } else {
            showStatus("There's no yarn to cut yet!", 2000);
        }
    }

    // Undo last stitch
    function undoLastStitch() {
        if (!gameStarted || gameFinished || gamePhase !== 'playing') {
            showStatus("Nothing to undo yet!", 2000);
            return;
        }
        
        const completedCells = document.querySelectorAll('.crochet-cell.stitch');
        if (completedCells.length > 0) {
            const lastCell = completedCells[completedCells.length - 1];
            lastCell.classList.remove('stitch');
            
            completedStitches--;
            score = Math.max(0, score - 5);
            
            updateScore();
            updateProgress();
            showStatus("Last stitch undone!", 1500);
        } else {
            showStatus("No stitches to undo!", 1500);
        }
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
        
        // Check if this cell is valid for stitching
        if (cell.classList.contains('stitch')) {
            showStatus("This spot already has a stitch!", 1500);
            return;
        }
        
        // Get current step
        const step = currentPattern.steps[currentStep];
        
        // Add stitch
        cell.classList.add('stitch');
        cell.style.backgroundColor = selectedYarnColor;
        
        // Play stitch sound
        try {
            stitchSound.play();
        } catch (e) {}
        
        // Update completed stitches
        completedStitches++;
        
        // Add score
        score += 10 * (currentDifficulty === 'easy' ? 1 : (currentDifficulty === 'medium' ? 2 : 3));
        updateScore();
        updateProgress();
        
        // Check if step is complete
        if (completedStitches % step.count === 0) {
            // Mark current step as completed
            const currentStepItem = document.querySelector(`.pattern-step[data-index="${currentStep}"]`);
            if (currentStepItem) {
                currentStepItem.classList.remove('active');
                currentStepItem.classList.add('completed');
            }
            
            // Move to next step
            currentStep++;
            
            // Check if pattern is complete
            if (currentStep >= currentPattern.steps.length) {
                patternComplete();
                return;
            }
            
            // Highlight next step
            setTimeout(() => {
                // Mark next step as current
                const nextStepItem = document.querySelector(`.pattern-step[data-index="${currentStep}"]`);
                if (nextStepItem) {
                    nextStepItem.classList.add('active');
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
        // No actual highlighting in this simplified version
        // This would typically highlight cells where the user should place their next stitches
    }

    // Show status message
    function showStatus(message, duration = 2000) {
        if (statusMessage && gameStatus) {
            statusMessage.textContent = message;
            gameStatus.style.display = 'block';
            
            setTimeout(() => {
                gameStatus.style.display = 'none';
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
        
        // Award badge for completed difficulty
        if (window.badgeSystem && typeof window.badgeSystem.awardBadge === 'function') {
            const badgeName = currentDifficulty === 'easy' ? 'beginner-crocheter' : 
                             (currentDifficulty === 'medium' ? 'intermediate-crocheter' : 'master-crocheter');
            window.badgeSystem.awardBadge(badgeName);
        }
        
        // Show complete modal
        if (resultTitle && resultMessage && resultScore && resultModal) {
            resultTitle.textContent = '🎉 Congratulations!';
            resultMessage.textContent = `You've completed the ${currentPattern.name} pattern with ${timer} seconds remaining!`;
            resultScore.textContent = `Score: ${score}`;
            resultModal.classList.remove('hidden');
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
                gameOver();
            }
        }, 1000);
    }

    // Update timer display
    function updateTimer() {
        if (!timeDisplay) return;
        
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Add warning color when time is running out
        if (timer <= 30) {
            timeDisplay.style.color = '#ff4500';
        } else {
            timeDisplay.style.color = '#333';
        }
    }

    // Update score display
    function updateScore() {
        if (scoreDisplay) {
            scoreDisplay.textContent = score;
        }
    }

    // Update progress display
    function updateProgress() {
        if (progressDisplay) {
            const progress = totalStitches > 0 ? Math.floor((completedStitches / totalStitches) * 100) : 0;
            progressDisplay.textContent = `${progress}%`;
        }
    }

    // Update view
    function updateView() {
        if (currentView === '3d') {
            crochetBoard.style.transform = 'perspective(1000px) rotateX(20deg)';
        } else if (currentView === 'tutorial') {
            crochetBoard.style.transform = 'none';
            showHelp();
        } else {
            crochetBoard.style.transform = 'none';
        }
    }

    // Game over
    function gameOver() {
        gameFinished = true;
        
        // Show game over modal
        if (resultTitle && resultMessage && resultScore && resultModal) {
            resultTitle.textContent = '⏰ Time\'s Up!';
            resultMessage.textContent = `You completed ${completedStitches} out of ${totalStitches} stitches. Great effort!`;
            resultScore.textContent = `Score: ${score}`;
            resultModal.classList.remove('hidden');
        }
    }

    // Close result modal
    function closeModal() {
        if (resultModal) {
            resultModal.classList.add('hidden');
        }
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
        if (introSection) introSection.classList.remove('hidden');
        if (simulatorSection) simulatorSection.classList.add('hidden');
    }

    // Show help overlay
    function showHelp() {
        if (helpOverlay) {
            helpOverlay.classList.add('visible');
        }
    }

    // Hide help overlay
    function hideHelp() {
        if (helpOverlay) {
            helpOverlay.classList.remove('visible');
        }
    }
    
    // Add event listener for escape key to close help overlay
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && helpOverlay && helpOverlay.classList.contains('visible')) {
            hideHelp();
        }
    });

    // Initialize the simulator
    init();
});