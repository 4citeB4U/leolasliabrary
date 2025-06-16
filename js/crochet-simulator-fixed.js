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
    const sounds = {
        stitch: new Audio(),
        correct: new Audio(),
        wrong: new Audio(),
        complete: new Audio()
    };
    
    // Pre-load audio files with fallback
    function loadAudio() {
        try {
            sounds.stitch.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFBQUFBQUFDQ0NDQ0NDQ0NDQ0VFRUVFRUVFRUVFRvb29vb29vb29vb4+Pj4+Pj4+Pj4+PqKioqKioqKioqKjFxcXFxcXFxcXFxebm5ubm5ubm5ubm//////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYQAAAAAAAAHjOZTf9zAAAAAAAAAAAAAAAAAP/7UMQAAAesTXWUEQAC7hjMc4IgAIAmSQDQQ4EcY5/OXJq5O3y/u+mZnCT69KjrzN5TU5i/9cpnJ1g/u7nRbrI5xQeYAyNsIhKJC9UmYigAuKg0Pr/y8qCPxYD4uGeV6u1y8SBuNoVFSA9Bm/0Teglcg5E5FzGMYxiAggZBEDh/4sLcCA8KhUSLi8LCQFDQ0e/+JxmaGhdjERLxceDUMDQ0AYaGiAsMiIeLB4lDjkOMLDR8X//7UMQZgA5Ix1mcEQAC0BTqsYgwAOhzf1ERE/Fh4X//+W5ubhIglUAzPsgyLDQMgQGS/RCAZBkGSYJAiDoJAiTf/2SC4ZjHhYMhkMiw2LDQeIxYdFloWHi8KCw2GhYZDQ2Hx8X/ggJxYZHBeHyAiIlwWHxYXFwkNkBmZgGYaGRYbGQ8MjI8P/8WGRYaGRYfgGZfAGZmAZlwBmZgGAZgAYCABmZjAMzAMDExP/7UMQ4AA4Y31VkEQAC4AhqrIIgAHAzEGZgGYYGAZmAmYYGYYGYGJphiZmYYGZhiZhhmIT///5mZmYmZmZmZmZmZmAZmZmZmZmZmZmZmZmZmamZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZm//7UMQ6gAugMVNkMGACzAYibAYMAFmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZm';
            sounds.correct.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFBQUFBQUFDQ0NDQ0NDQ0NDQ0VFRUVFRUVFRUVFRvb29vb29vb29vb4+Pj4+Pj4+Pj4+PqKioqKioqKioqKjFxcXFxcXFxcXFxebm5ubm5ubm5ubm//////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYQAAAAAAAAHjOZTf9zAAAAAAAAAAAAAAAAAP/7UMQAAAesTXWUEQAC7hjMc4IgAIAmSQDQQ4EcY5/OXJq5O3y/u+mZnCT69KjrzN5TU5i/9cpnJ1g/u7nRbrI5xQeYAyNsIhKJC9UmYigAuKg0Pr/y8qCPxYD4uGeV6u1y8SBuNoVFSA9Bm/0Teglcg5E5FzGMYxiAggZBEDh/4sLcCA8KhUSLi8LCQFDQ0e/+JxmaGhdjERLxceDUMDQ0AYaGiAsMiIeLB4lDjkOMLDR8X//7UMQZgA5Ix1mcEQAC0BTqsYgwAOhzf1ERE/Fh4X//+W5ubhIglUAzPsgyLDQMgQGS/RCAZBkGSYJAiDoJAiTf/2SC4ZjHhYMhkMiw2LDQeIxYdFloWHi8KCw2GhYZDQ2Hx8X/ggJxYZHBeHyAiIlwWHxYXFwkNkBmZgGYaGRYbGQ8MjI8P/8WGRYaGRYfgGZfAGZmAZlwBmZgGAZgAYCABmZjAMzAMDExP/7UMQ4AA4Y31VkEQAC4AhqrIIgAHAzEGZgGYYGAZmAmYYGYYGYGJphiZmYYGZhiZhhmIT///5mZmYmZmZmZmZmZmAZmZmZmZmZmZmZmZmZmamZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZm//7UMQ6gAugMVNkMGACzAYibAYMAFmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZm';
            sounds.wrong.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFBQUFBQUFDQ0NDQ0NDQ0NDQ0VFRUVFRUVFRUVFRvb29vb29vb29vb4+Pj4+Pj4+Pj4+PqKioqKioqKioqKjFxcXFxcXFxcXFxebm5ubm5ubm5ubm//////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYQAAAAAAAAHjOZTf9zAAAAAAAAAAAAAAAAAP/7UMQAAAesTXWUEQAC7hjMc4IgAIAmSQDQQ4EcY5/OXJq5O3y/u+mZnCT69KjrzN5TU5i/9cpnJ1g/u7nRbrI5xQeYAyNsIhKJC9UmYigAuKg0Pr/y8qCPxYD4uGeV6u1y8SBuNoVFSA9Bm/0Teglcg5E5FzGMYxiAggZBEDh/4sLcCA8KhUSLi8LCQFDQ0e/+JxmaGhdjERLxceDUMDQ0AYaGiAsMiIeLB4lDjkOMLDR8X//7UMQZgA5Ix1mcEQAC0BTqsYgwAOhzf1ERE/Fh4X//+W5ubhIglUAzPsgyLDQMgQGS/RCAZBkGSYJAiDoJAiTf/2SC4ZjHhYMhkMiw2LDQeIxYdFloWHi8KCw2GhYZDQ2Hx8X/ggJxYZHBeHyAiIlwWHxYXFwkNkBmZgGYaGRYbGQ8MjI8P/8WGRYaGRYfgGZfAGZmAZlwBmZgGAZgAYCABmZjAMzAMDExP/7UMQ4AA4Y31VkEQAC4AhqrIIgAHAzEGZgGYYGAZmAmYYGYYGYGJphiZmYYGZhiZhhmIT///5mZmYmZmZmZmZmZmAZmZmZmZmZmZmZmZmZmamZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZm//7UMQ6gAugMVNkMGACzAYibAYMAFmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZm';
            sounds.complete.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFBQUFBQUFDQ0NDQ0NDQ0NDQ0VFRUVFRUVFRUVFRvb29vb29vb29vb4+Pj4+Pj4+Pj4+PqKioqKioqKioqKjFxcXFxcXFxcXFxebm5ubm5ubm5ubm//////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYQAAAAAAAAHjOZTf9zAAAAAAAAAAAAAAAAAP/7UMQAAAesTXWUEQAC7hjMc4IgAIAmSQDQQ4EcY5/OXJq5O3y/u+mZnCT69KjrzN5TU5i/9cpnJ1g/u7nRbrI5xQeYAyNsIhKJC9UmYigAuKg0Pr/y8qCPxYD4uGeV6u1y8SBuNoVFSA9Bm/0Teglcg5E5FzGMYxiAggZBEDh/4sLcCA8KhUSLi8LCQFDQ0e/+JxmaGhdjERLxceDUMDQ0AYaGiAsMiIeLB4lDjkOMLDR8X//7UMQZgA5Ix1mcEQAC0BTqsYgwAOhzf1ERE/Fh4X//+W5ubhIglUAzPsgyLDQMgQGS/RCAZBkGSYJAiDoJAiTf/2SC4ZjHhYMhkMiw2LDQeIxYdFloWHi8KCw2GhYZDQ2Hx8X/ggJxYZHBeHyAiIlwWHxYXFwkNkBmZgGYaGRYbGQ8MjI8P/8WGRYaGRYfgGZfAGZmAZlwBmZgGAZgAYCABmZjAMzAMDExP/7UMQ4AA4Y31VkEQAC4AhqrIIgAHAzEGZgGYYGAZmAmYYGYYGYGJphiZmYYGZhiZhhmIT///5mZmYmZmZmZmZmZmAZmZmZmZmZmZmZmZmZmamZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZm//7UMQ6gAugMVNkMGACzAYibAYMAFmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZm';
            
            // Lower volume
            Object.values(sounds).forEach(sound => {
                sound.volume = 0.3;
            });
        } catch (e) {
            console.log('Audio loading fallback mode');
        }
    }
    
    loadAudio();

    // Define CSS styles for stitches, yarns, etc.
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .stitch-cell {
            border: 1px solid #eee;
            position: relative;
            transition: all 0.3s ease;
        }
        
        .stitch-cell:hover {
            background-color: rgba(255, 127, 80, 0.1);
        }
        
        .stitch-cell.highlight {
            animation: pulse 1.5s infinite;
            background-color: rgba(255, 215, 0, 0.3);
            border: 2px dashed #FF7F50;
        }
        
        .stitch-cell.wrong {
            animation: shake 0.5s;
        }
        
        .stitch-cell.completed {
            opacity: 1;
        }
        
        .stitch {
            display: none;
            width: 80%;
            height: 80%;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        
        .stitch.visible {
            display: block;
        }
        
        .stitch-chain {
            border-radius: 50%;
            border: 2px solid rgba(0,0,0,0.2);
        }
        
        .stitch-single {
            border-radius: 30%;
            border: 2px solid rgba(0,0,0,0.2);
        }
        
        .stitch-double {
            border-radius: 20%;
            height: 90%;
            border: 2px solid rgba(0,0,0,0.2);
        }
        
        .yarn-container {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 15px;
        }
        
        .yarn-ball {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 3px 5px rgba(0,0,0,0.2);
        }
        
        .yarn-ball:hover {
            transform: scale(1.2);
        }
        
        .yarn-ball.selected {
            border: 3px solid #333;
            transform: scale(1.2);
        }
        
        .yarn-pink {
            background-color: #FF7F7F;
        }
        
        .yarn-blue {
            background-color: #7F7FFF;
        }
        
        .yarn-green {
            background-color: #7FFF7F;
        }
        
        .yarn-purple {
            background-color: #BF7FFF;
        }
        
        .yarn-yellow {
            background-color: #FFFF7F;
        }
        
        .hook-container {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .hook {
            width: 60px;
            height: 150px;
            background-color: #DAA06D;
            border-radius: 10px;
            position: relative;
            cursor: pointer;
            transition: all 0.3s ease;
            transform: rotate(-15deg);
        }
        
        .hook:before {
            content: '';
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 0 0;
            border: 10px solid #DAA06D;
            border-bottom: none;
        }
        
        .hook:hover {
            transform: rotate(-5deg) scale(1.05);
        }
        
        .hook.active {
            box-shadow: 0 0 15px gold;
            animation: hookGlow 1.5s infinite;
        }
        
        .pattern-steps {
            list-style-type: none;
            padding: 0;
            margin: 15px 0;
        }
        
        .pattern-steps li {
            padding: 10px 15px;
            margin-bottom: 8px;
            background-color: #f5f5f5;
            border-left: 4px solid #ddd;
            transition: all 0.3s ease;
        }
        
        .pattern-steps li.current {
            background-color: #FFE4B5;
            border-left-color: #FFA500;
            font-weight: bold;
        }
        
        .pattern-steps li.completed {
            background-color: #E8F5E9;
            border-left-color: #4CAF50;
            text-decoration: line-through;
            opacity: 0.7;
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 127, 80, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(255, 127, 80, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 127, 80, 0); }
        }
        
        @keyframes hookGlow {
            0% { box-shadow: 0 0 5px gold; }
            50% { box-shadow: 0 0 20px gold; }
            100% { box-shadow: 0 0 5px gold; }
        }
        
        @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
        }
    `;
    document.head.appendChild(styleEl);

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

        // Show welcome screen
        if (introSection) introSection.classList.remove('hidden');
        if (simulatorSection) simulatorSection.classList.add('hidden');
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
        if (introSection) introSection.classList.add('hidden');
        if (simulatorSection) simulatorSection.classList.remove('hidden');
        
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
        if (!crochetBoard) return;
        
        // Clear existing content
        crochetBoard.innerHTML = '';
        
        // Set 3D perspective based on view
        crochetBoard.style.transform = currentView === '3d' ? 'perspective(1000px) rotateX(20deg)' : 'none';
        
        // Create stitch grid
        const gridSize = currentPattern.gridSize;
        const stitchGrid = document.createElement('div');
        stitchGrid.className = 'crochet-grid';
        stitchGrid.style.display = 'grid';
        stitchGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        stitchGrid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
        stitchGrid.style.width = '100%';
        stitchGrid.style.height = '100%';
        
        // Create cells
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'stitch-cell';
            cell.dataset.index = i;
            
            // Create stitch element
            const stitch = document.createElement('div');
            stitch.className = 'stitch';
            cell.appendChild(stitch);
            
            // Add click event
            cell.addEventListener('click', () => attemptStitch(cell));
            
            // Add to grid
            stitchGrid.appendChild(cell);
        }
        
        crochetBoard.appendChild(stitchGrid);
        
        // Create yarn container
        const yarnContainer = document.createElement('div');
        yarnContainer.className = 'yarn-container';
        
        // Add yarn balls
        const yarnColors = ['pink', 'blue', 'green', 'purple', 'yellow'];
        yarnColors.forEach(color => {
            const yarnBall = document.createElement('div');
            yarnBall.className = `yarn-ball yarn-${color}`;
            yarnBall.dataset.color = color;
            yarnBall.addEventListener('click', () => selectYarn(yarnBall));
            yarnContainer.appendChild(yarnBall);
        });
        
        crochetBoard.appendChild(yarnContainer);
        
        // Create hook
        const hookContainer = document.createElement('div');
        hookContainer.className = 'hook-container';
        
        const hook = document.createElement('div');
        hook.className = 'hook';
        hook.addEventListener('click', toggleHook);
        
        hookContainer.appendChild(hook);
        crochetBoard.appendChild(hookContainer);
    }

    // Create pattern steps
    function createPatternSteps() {
        if (!patternSteps) return;
        
        patternSteps.innerHTML = '';
        
        const stepsList = document.createElement('ul');
        stepsList.className = 'pattern-steps';
        
        currentPattern.steps.forEach((step, index) => {
            const stepItem = document.createElement('li');
            stepItem.dataset.index = index;
            stepItem.textContent = `${index + 1}. ${step.description}`;
            
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
            sounds.stitch.play();
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
        if (hook) {
            hook.classList.add('active');
        }
        hookActive = true;
        gamePhase = 'hook-active';
        
        // Play sound
        try {
            sounds.correct.play();
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
                sounds.wrong.play();
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
        stitch.style.backgroundColor = getColorFromName(selectedYarn);
        
        // Play stitch sound
        try {
            sounds.stitch.play();
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
                sounds.correct.play();
            } catch (e) {}
        }
    }
    
    // Get color from name
    function getColorFromName(colorName) {
        const colorMap = {
            'pink': '#FF7F7F',
            'blue': '#7F7FFF',
            'green': '#7FFF7F',
            'purple': '#BF7FFF',
            'yellow': '#FFFF7F'
        };
        
        return colorMap[colorName] || '#FF7F50';
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
        if (statusMessage && gameStatus) {
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
            sounds.complete.play();
        } catch (e) {}
        
        // Trigger confetti celebration
        if (window.confetti && typeof window.confetti.celebrate === 'function') {
            confetti.celebrate();
        } else {
            // Simple confetti fallback
            createConfetti();
        }
        
        // Award badge for completed difficulty
        if (window.badgeSystem && typeof window.badgeSystem.awardBadge === 'function') {
            badgeSystem.awardBadge(currentDifficulty);
        }
        
        // Show complete modal
        if (resultTitle && resultMessage && resultScore && resultModal) {
            resultTitle.textContent = '🎉 Congratulations!';
            resultMessage.textContent = `You've completed the ${currentPattern.name} pattern with ${timer} seconds remaining!`;
            resultScore.textContent = `Score: ${score}`;
            resultModal.style.display = 'flex';
        }
    }
    
    // Simple confetti celebration
    function createConfetti() {
        const confettiCount = 100;
        const colors = ['#FF7F50', '#DAA06D', '#8B4513', '#FFD700', '#FFA07A'];
        
        // Create container if it doesn't exist
        let container = document.querySelector('.confetti-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'confetti-container';
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.pointerEvents = 'none';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        
        // Create confetti pieces
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                
                confetti.style.position = 'absolute';
                confetti.style.width = `${Math.random() * 10 + 5}px`;
                confetti.style.height = `${Math.random() * 10 + 5}px`;
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.left = `${Math.random() * 100}%`;
                confetti.style.top = '-20px';
                confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
                confetti.style.opacity = Math.random() * 0.8 + 0.2;
                confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                
                container.appendChild(confetti);
                
                // Animate falling
                const duration = Math.random() * 3 + 2;
                const horizontalMovement = (Math.random() - 0.5) * 100;
                
                confetti.animate([
                    { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                    { transform: `translate(${horizontalMovement}px, ${window.innerHeight}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
                ], {
                    duration: duration * 1000,
                    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                    fill: 'forwards'
                });
                
                // Remove after animation
                setTimeout(() => {
                    confetti.remove();
                }, duration * 1000);
            }, Math.random() * 1000); // Stagger the confetti
        }
        
        // Clean up container after all confetti are gone
        setTimeout(() => {
            if (container) {
                container.remove();
            }
        }, 6000);
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
            timeDisplay.style.color = '#FF0000';
        } else {
            timeDisplay.style.color = '#000000';
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
        const board = document.getElementById('crochet-board');
        if (board) {
            board.style.transform = currentView === '3d' ? 'perspective(1000px) rotateX(20deg)' : 'none';
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
            resultModal.style.display = 'flex';
        }
    }

    // Close result modal
    function closeModal() {
        if (resultModal) {
            resultModal.style.display = 'none';
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