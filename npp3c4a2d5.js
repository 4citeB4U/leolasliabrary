// Extra helper functions for the memory match game

// Confetti animation for celebrating match completion
function createConfetti() {
    // Create confetti container if it doesn't exist
    let container = document.getElementById('confetti-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'confetti-container';
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
    const colors = ['#FF7F50', '#DAA06D', '#8B4513', '#FFD700', '#FFA07A'];
    const confettiCount = 150;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            const size = Math.random() * 10 + 5;
            
            confetti.style.position = 'absolute';
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
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
        }, Math.random() * 1000); // Stagger the creation of confetti
    }
    
    // Clean up container after all confetti are gone
    setTimeout(() => {
        if (container) {
            container.remove();
        }
    }, 6000);
}

// Create sound effects with fallback
function createSoundEffects() {
    const sounds = {
        flip: new Audio(),
        match: new Audio(),
        complete: new Audio(),
        hint: new Audio()
    };
    
    try {
        // Set sound sources using data URIs for simple sounds
        sounds.flip.src = 'data:audio/wav;base64,UklGRjIAAABXQVZFZmt0IBAAAAABAAEARKwAAIhYAAABAAgAZGF0YRAAAAAAAAAAAP//AAAAAAAAAAAAAw==';
        sounds.match.src = 'data:audio/wav;base64,UklGRjIAAABXQVZFZmt0IBAAAAABAAEARKwAAIhYAAABAAgAZGF0YRAAAAAAAAAAAP//AAAAAAAAAAAAAw==';
        sounds.complete.src = 'data:audio/wav;base64,UklGRjIAAABXQVZFZmt0IBAAAAABAAEARKwAAIhYAAABAAgAZGF0YRAAAAAAAAAAAP//AAAAAAAAAAAAAw==';
        sounds.hint.src = 'data:audio/wav;base64,UklGRjIAAABXQVZFZmt0IBAAAAABAAEARKwAAIhYAAABAAgAZGF0YRAAAAAAAAAAAP//AAAAAAAAAAAAAw==';
        
        // Lower volume
        Object.values(sounds).forEach(sound => {
            sound.volume = 0.3;
        });
    } catch (e) {
        console.log('Failed to load sound effects', e);
    }
    
    return {
        playFlip: function() {
            try { sounds.flip.play(); } catch (e) {}
        },
        playMatch: function() {
            try { sounds.match.play(); } catch (e) {}
        },
        playComplete: function() {
            try { sounds.complete.play(); } catch (e) {}
        },
        playHint: function() {
            try { sounds.hint.play(); } catch (e) {}
        }
    };
}

// Calculate star rating based on moves and difficulty
function calculateStarRating(moves, difficulty, maxMatches) {
    let thresholds;
    
    switch(difficulty) {
        case 'easy':
            thresholds = { three: maxMatches * 2, two: maxMatches * 3 };
            break;
        case 'medium':
            thresholds = { three: maxMatches * 1.8, two: maxMatches * 2.5 };
            break;
        case 'hard':
            thresholds = { three: maxMatches * 1.5, two: maxMatches * 2 };
            break;
        default:
            thresholds = { three: maxMatches * 2, two: maxMatches * 3 };
    }
    
    if (moves <= thresholds.three) {
        return 3;
    } else if (moves <= thresholds.two) {
        return 2;
    } else {
        return 1;
    }
}

// Show star rating
function displayStarRating(container, rating) {
    if (!container) return;
    
    container.innerHTML = '';
    const starFull = '⭐';
    const starEmpty = '☆';
    
    for (let i = 0; i < 3; i++) {
        const star = document.createElement('span');
        star.textContent = i < rating ? starFull : starEmpty;
        star.style.fontSize = '1.5rem';
        star.style.margin = '0 5px';
        container.appendChild(star);
    }
}

// Track high scores
function updateHighScore(difficulty, moves) {
    const storageKey = `memoryMatch_highscore_${difficulty}`;
    const currentHighScore = localStorage.getItem(storageKey);
    
    if (!currentHighScore || moves < parseInt(currentHighScore)) {
        localStorage.setItem(storageKey, moves.toString());
        return true; // New high score
    }
    
    return false; // Not a new high score
}

// Get high score
function getHighScore(difficulty) {
    const storageKey = `memoryMatch_highscore_${difficulty}`;
    return localStorage.getItem(storageKey) || '-';
}

// Export functions for use in main game script
window.gameHelpers = {
    createConfetti,
    createSoundEffects,
    calculateStarRating,
    displayStarRating,
    updateHighScore,
    getHighScore
};