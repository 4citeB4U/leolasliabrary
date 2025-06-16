// Enhanced card matching game integration with badge system

document.addEventListener('DOMContentLoaded', function() {
    // Additional game configurations
    const gameConfig = {
        // Game modes (can be extended for future variations)
        modes: {
            standard: {
                name: 'Standard',
                description: 'Find matching pairs of cards'
            },
            timed: {
                name: 'Timed',
                description: 'Find matches before time runs out'
            }
        },
        
        // Themes (can be used to change card sets)
        themes: {
            fruits: {
                name: 'Fruits',
                items: [
                    { id: 'apple', name: 'Apple', emoji: '🍎' },
                    { id: 'banana', name: 'Banana', emoji: '🍌' },
                    { id: 'orange', name: 'Orange', emoji: '🍊' },
                    { id: 'pear', name: 'Pear', emoji: '🍐' },
                    { id: 'strawberry', name: 'Strawberry', emoji: '🍓' },
                    { id: 'grapes', name: 'Grapes', emoji: '🍇' },
                    { id: 'watermelon', name: 'Watermelon', emoji: '🍉' },
                    { id: 'kiwi', name: 'Kiwi', emoji: '🥝' }
                ]
            },
            animals: {
                name: 'Animals',
                items: [
                    { id: 'dog', name: 'Dog', emoji: '🐶' },
                    { id: 'cat', name: 'Cat', emoji: '🐱' },
                    { id: 'fox', name: 'Fox', emoji: '🦊' },
                    { id: 'tiger', name: 'Tiger', emoji: '🐯' },
                    { id: 'lion', name: 'Lion', emoji: '🦁' },
                    { id: 'panda', name: 'Panda', emoji: '🐼' },
                    { id: 'monkey', name: 'Monkey', emoji: '🐵' },
                    { id: 'penguin', name: 'Penguin', emoji: '🐧' }
                ]
            }
        },
        
        // Badge definitions
        badges: {
            memory_match_easy: {
                id: 'memory_match_easy',
                name: 'Novice Matcher',
                description: 'Completed the Memory Match game on Easy difficulty',
                emoji: '🥉'
            },
            memory_match_medium: {
                id: 'memory_match_medium',
                name: 'Memory Expert',
                description: 'Completed the Memory Match game on Medium difficulty',
                emoji: '🥈'
            },
            memory_match_hard: {
                id: 'memory_match_hard',
                name: 'Memory Master',
                description: 'Completed the Memory Match game on Hard difficulty',
                emoji: '🥇'
            },
            memory_match_perfect: {
                id: 'memory_match_perfect',
                name: 'Perfect Memory',
                description: 'Completed a game with no wasted moves',
                emoji: '🏆'
            },
            memory_match_speed: {
                id: 'memory_match_speed',
                name: 'Speed Matcher',
                description: 'Completed a game in record time',
                emoji: '⚡'
            }
        }
    };
    
    // Integration with badge manager
    function registerBadges() {
        if (window.BadgeManager && typeof window.BadgeManager.registerBadge === 'function') {
            // Register badges with the badge manager
            Object.values(gameConfig.badges).forEach(badge => {
                window.BadgeManager.registerBadge(badge);
            });
            
            console.log('Memory Match badges registered with badge manager');
        }
    }
    
    // Award achievement badges based on gameplay milestones
    function checkForAchievements(gameStats) {
        if (!window.BadgeManager) return;
        
        const { difficulty, moves, matches, time } = gameStats;
        
        // Award badge for completing the game at the appropriate difficulty
        window.BadgeManager.awardBadge(`memory_match_${difficulty}`);
        
        // Check for perfect game (minimum possible moves)
        if (moves === matches) {
            window.BadgeManager.awardBadge('memory_match_perfect');
        }
        
        // Check for speed achievements (time-based) - threshold depends on difficulty
        let speedThreshold;
        switch(difficulty) {
            case 'easy': speedThreshold = 30; break;
            case 'medium': speedThreshold = 45; break;
            case 'hard': speedThreshold = 60; break;
            default: speedThreshold = 30;
        }
        
        if (time < speedThreshold) {
            window.BadgeManager.awardBadge('memory_match_speed');
        }
    }
    
    // Add game stats tracking
    const statsTracker = {
        gamesPlayed: 0,
        gamesWon: 0,
        
        // Track stats by difficulty
        easy: { played: 0, won: 0, bestMoves: Infinity, bestTime: Infinity },
        medium: { played: 0, won: 0, bestMoves: Infinity, bestTime: Infinity },
        hard: { played: 0, won: 0, bestMoves: Infinity, bestTime: Infinity },
        
        // Initialize from local storage
        init: function() {
            const savedStats = localStorage.getItem('memoryMatchStats');
            if (savedStats) {
                try {
                    const parsedStats = JSON.parse(savedStats);
                    Object.assign(this, parsedStats);
                } catch (e) {
                    console.error('Error loading memory match stats', e);
                }
            }
        },
        
        // Save to local storage
        save: function() {
            localStorage.setItem('memoryMatchStats', JSON.stringify({
                gamesPlayed: this.gamesPlayed,
                gamesWon: this.gamesWon,
                easy: this.easy,
                medium: this.medium,
                hard: this.hard
            }));
        },
        
        // Record game start
        startGame: function(difficulty) {
            this.gamesPlayed++;
            this[difficulty].played++;
            this.save();
        },
        
        // Record game win
        recordWin: function(difficulty, moves, time) {
            this.gamesWon++;
            this[difficulty].won++;
            
            // Update best scores if better
            if (moves < this[difficulty].bestMoves) {
                this[difficulty].bestMoves = moves;
            }
            
            if (time < this[difficulty].bestTime) {
                this[difficulty].bestTime = time;
            }
            
            this.save();
            
            return {
                isNewBestMoves: moves === this[difficulty].bestMoves,
                isNewBestTime: time === this[difficulty].bestTime
            };
        },
        
        // Get stats for display
        getStats: function() {
            return {
                gamesPlayed: this.gamesPlayed,
                gamesWon: this.gamesWon,
                winRate: this.gamesPlayed > 0 ? Math.round((this.gamesWon / this.gamesPlayed) * 100) : 0,
                byDifficulty: {
                    easy: {...this.easy},
                    medium: {...this.medium},
                    hard: {...this.hard}
                }
            };
        }
    };
    
    // Initialize stats
    statsTracker.init();
    
    // Register badges with the badge system
    registerBadges();
    
    // Make helpers available globally
    window.memoryMatchExtras = {
        gameConfig,
        checkForAchievements,
        statsTracker
    };
});