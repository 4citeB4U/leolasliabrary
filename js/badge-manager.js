// Badge Manager for Leola's Crochet World
const BadgeManager = (function() {
    // Constants
    const STORAGE_KEY = 'crochetBadges';
    
    // Badge definitions
    const badges = [
        { id: 'beginner-crocheter', name: 'Beginner Crocheter', description: 'Completed your first crochet project', icon: '🧶' },
        { id: 'intermediate-crocheter', name: 'Intermediate Crocheter', description: 'Mastered medium difficulty patterns', icon: '🧵' },
        { id: 'master-crocheter', name: 'Master Crocheter', description: 'Conquered advanced crochet techniques', icon: '👑' },
        { id: 'nybook_complete', name: 'Story Enthusiast', description: 'Completed Needle & Yarn book', icon: '📖' },
        { id: 'cmbook_complete', name: 'Crochet Scholar', description: 'Completed Crochet Mastery guide', icon: '🎓' },
        { id: 'stitch_match_easy', name: 'Pattern Apprentice', description: 'Completed Stitch Match on Easy', icon: '🔍' },
        { id: 'stitch_match_medium', name: 'Pattern Designer', description: 'Completed Stitch Match on Medium', icon: '🏆' },
        { id: 'stitch_match_hard', name: 'Pattern Master', description: 'Completed Stitch Match on Hard', icon: '👑' },
        { id: 'award_ny_prologue', name: 'Story Listener', description: 'Began the Needle & Yarn journey', icon: '📚' },
        { id: 'award_cm_intro', name: 'Tool Explorer', description: 'Learned about crochet tools', icon: '🧶' },
        { id: 'award_quiz_cm_tools', name: 'Tool Quiz Whiz', description: 'Mastered knowledge of crochet tools', icon: '🧰' },
        { id: 'award_welcome', name: 'Welcome Crocheter', description: 'Started your crochet adventure', icon: '🎉' }
    ];
    
    // Private methods
    function getAllBadges() {
        return badges;
    }
    
    function getEarnedBadgeIds() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }
    
    function getEarnedBadges() {
        const earnedIds = getEarnedBadgeIds();
        return badges.filter(badge => earnedIds.includes(badge.id));
    }
    
    function getBadgeById(id) {
        return badges.find(badge => badge.id === id);
    }
    
    function awardBadge(id) {
        console.log("BadgeManager: Awarding badge", id);
        const badge = getBadgeById(id);
        if (!badge) {
            console.warn("BadgeManager: Badge not found", id);
            return false;
        }
        
        const earnedBadges = getEarnedBadgeIds();
        if (earnedBadges.includes(id)) {
            console.log("BadgeManager: Badge already earned", id);
            return true; // Already earned
        }
        
        console.log("BadgeManager: Adding new badge to earned badges", id);
        earnedBadges.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(earnedBadges));
        
        // Trigger event for UI to respond
        const event = new CustomEvent('badgeEarned', { detail: badge });
        document.dispatchEvent(event);
        console.log("BadgeManager: Dispatched badgeEarned event");
        
        // Automatically show popup notification without requiring user interaction
        showBadgePopup(badge);
        
        // Update any badge containers on the page
        const containers = ['game-badges-container', 'badges-container', 'homepage-badges-container'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                console.log("BadgeManager: Updating badges in container", containerId);
                displayBadges(containerId);
                
                // Hide any "no badges" messages
                const noBadgesMsg = document.getElementById(`no-${containerId.replace('-container', '')}`);
                if (noBadgesMsg) {
                    noBadgesMsg.style.display = 'none';
                }
            }
        });
        
        return true;
    }
    
    function hasBadge(id) {
        const earnedBadges = getEarnedBadgeIds();
        return earnedBadges.includes(id);
    }
    
    function clearAllBadges() {
        localStorage.removeItem(STORAGE_KEY);
    }
    
    // Display badges in a container element
    function displayBadges(containerId) {
        console.log("BadgeManager: Displaying badges in container", containerId);
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn("BadgeManager: Container not found", containerId);
            return;
        }
        
        const earnedBadges = getEarnedBadges();
        console.log("BadgeManager: Earned badges", earnedBadges);
        
        container.innerHTML = '';
        
        if (earnedBadges.length === 0) {
            console.log("BadgeManager: No badges earned yet");
            container.innerHTML = '<p class="no-badges">You haven\'t earned any badges yet. Keep learning!</p>';
            return;
        }
        
        // Hide any "no badges" messages in the container or with a related ID
        const noBadgesId = `no-${containerId.replace('-container', '')}`;
        const noBadgesMsg = document.getElementById(noBadgesId);
        if (noBadgesMsg) {
            console.log("BadgeManager: Hiding no badges message", noBadgesId);
            noBadgesMsg.style.display = 'none';
        }
        
        // Find and hide any paragraph with "no-badges" class inside the container
        const noBadgesInContainer = container.querySelector('.no-badges');
        if (noBadgesInContainer) {
            console.log("BadgeManager: Hiding no badges message inside container");
            noBadgesInContainer.style.display = 'none';
        }
        
        earnedBadges.forEach(badge => {
            console.log("BadgeManager: Adding badge to display", badge.id);
            const badgeElement = document.createElement('div');
            badgeElement.className = 'badge-item';
            badgeElement.innerHTML = `
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-info">
                    <h3>${badge.name}</h3>
                    <p>${badge.description}</p>
                </div>
            `;
            container.appendChild(badgeElement);
        });
    }
    
    // Show animated badge popup (auto-shown when badge is earned)
    function showBadgePopup(badge) {
        // Create animated popup if it doesn't exist
        let popup = document.getElementById('badge-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'badge-popup';
            popup.className = 'badge-popup hidden';
            document.body.appendChild(popup);
            
            // Add popup styles if they don't exist
            if (!document.getElementById('badge-popup-style')) {
                const style = document.createElement('style');
                style.id = 'badge-popup-style';
                style.textContent = `
                    .badge-popup {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) scale(0.5);
                        background-color: #FAF3E0;
                        border: 3px solid #FF7F50;
                        padding: 25px;
                        border-radius: 15px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        z-index: 2000;
                        text-align: center;
                        opacity: 0;
                        transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                                    opacity 0.5s ease;
                        max-width: 90%;
                        width: 350px;
                    }
                    .badge-popup.visible {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    .badge-popup.hidden {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.5);
                        pointer-events: none;
                    }
                    .badge-popup-icon {
                        font-size: 4rem;
                        margin-bottom: 15px;
                        animation: badgePulse 1.5s infinite alternate;
                    }
                    .badge-popup-title {
                        color: #8B4513;
                        font-size: 1.5rem;
                        margin-bottom: 10px;
                        font-weight: bold;
                    }
                    .badge-popup-desc {
                        color: #666;
                        margin-bottom: 20px;
                    }
                    .badge-popup-continue {
                        background-color: #8B4513;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 30px;
                        cursor: pointer;
                        font-size: 1rem;
                        transition: background-color 0.3s;
                        margin-top: 10px;
                    }
                    .badge-popup-continue:hover {
                        background-color: #FF7F50;
                    }
                    @keyframes badgePulse {
                        0% { transform: scale(1); }
                        100% { transform: scale(1.2); }
                    }
                    .badge-confetti {
                        position: absolute;
                        width: 10px;
                        height: 10px;
                        background-color: #FF7F50;
                        opacity: 0.8;
                        z-index: 1999;
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // Create and show confetti effect
        createConfetti();
        
        // Show the badge popup
        popup.innerHTML = `
            <div class="badge-popup-icon">${badge.icon}</div>
            <div class="badge-popup-title">You've Achieved This Badge!</div>
            <div class="badge-popup-desc">${badge.name}: ${badge.description}</div>
            <button class="badge-popup-continue">Keep Going</button>
        `;
        
        // Play success sound if available
        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(`Congratulations! You've earned the ${badge.name} badge!`);
            window.speechSynthesis.speak(utterance);
        }
        
        // Show the popup
        popup.classList.remove('hidden');
        popup.classList.add('visible');
        
        // Add click event to continue button
        const continueButton = popup.querySelector('.badge-popup-continue');
        continueButton.addEventListener('click', function() {
            popup.classList.remove('visible');
            popup.classList.add('hidden');
            
            // Auto-hide after clicking
            setTimeout(() => {
                popup.style.display = 'none';
            }, 500);
        });
        
        // Auto-dismiss after 8 seconds if user doesn't click
        setTimeout(() => {
            if (popup.classList.contains('visible')) {
                popup.classList.remove('visible');
                popup.classList.add('hidden');
                
                setTimeout(() => {
                    popup.style.display = 'none';
                }, 500);
            }
        }, 8000);
    }
    
    // Create confetti effect
    function createConfetti() {
        const confettiCount = 100;
        const colors = ['#FF7F50', '#DAA06D', '#8B4513', '#FFD700', '#FFA07A'];
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'badge-confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = -10 + 'px';
            confetti.style.width = (Math.random() * 10 + 5) + 'px';
            confetti.style.height = (Math.random() * 10 + 5) + 'px';
            confetti.style.opacity = Math.random();
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            document.body.appendChild(confetti);
            
            // Animate falling
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 2;
            confetti.animate([
                { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
                { transform: `translateY(100vh) rotate(${Math.random() * 360}deg)`, opacity: 0 }
            ], {
                duration: duration * 1000,
                delay: delay * 1000,
                fill: 'forwards'
            });
            
            // Remove after animation
            setTimeout(() => {
                confetti.remove();
            }, (duration + delay) * 1000);
        }
    }
    
    // Show notification when badge is earned
    function initBadgeNotifications() {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('badge-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'badge-notification';
            notification.className = 'badge-notification hidden';
            document.body.appendChild(notification);
            
            // Add styles if they don't exist
            if (!document.getElementById('badge-notification-style')) {
                const style = document.createElement('style');
                style.id = 'badge-notification-style';
                style.textContent = `
                    .badge-notification {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        background-color: #FAF3E0;
                        border-left: 4px solid #FF7F50;
                        padding: 15px;
                        border-radius: 5px;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                        z-index: 1000;
                        display: flex;
                        align-items: center;
                        transition: transform 0.3s, opacity 0.3s;
                    }
                    .badge-notification.hidden {
                        transform: translateY(100px);
                        opacity: 0;
                        pointer-events: none;
                    }
                    .badge-notification-icon {
                        font-size: 2rem;
                        margin-right: 15px;
                    }
                    .badge-notification-content h4 {
                        margin: 0 0 5px 0;
                        color: #8B4513;
                    }
                    .badge-notification-content p {
                        margin: 0;
                        color: #666;
                    }
                    
                    /* Style for badge item display */
                    .badge-item {
                        display: flex;
                        align-items: center;
                        padding: 15px;
                        background-color: #FFF8E8;
                        border-radius: 10px;
                        margin-bottom: 15px;
                        box-shadow: 0 4px 10px rgba(139, 69, 19, 0.1);
                        transition: transform 0.3s ease;
                    }
                    
                    .badge-item:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 6px 15px rgba(139, 69, 19, 0.15);
                    }
                    
                    .badge-icon {
                        font-size: 2.5rem;
                        margin-right: 15px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 60px;
                        height: 60px;
                        background-color: rgba(255, 127, 80, 0.1);
                        border-radius: 50%;
                    }
                    
                    .badge-info h3 {
                        margin: 0 0 5px 0;
                        color: #8B4513;
                        font-size: 1.1rem;
                    }
                    
                    .badge-info p {
                        margin: 0;
                        color: #666;
                        font-size: 0.9rem;
                    }
                    
                    /* Special styling for the badges grid in games section */
                    .badges-grid .badge-item {
                        flex-direction: column;
                        text-align: center;
                        padding: 20px 10px;
                    }
                    
                    .badges-grid .badge-icon {
                        margin-right: 0;
                        margin-bottom: 10px;
                        width: 70px;
                        height: 70px;
                        font-size: 2.8rem;
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // Listen for badge earned events
        document.addEventListener('badgeEarned', function(e) {
            const badge = e.detail;
            
            notification.innerHTML = `
                <div class="badge-notification-icon">${badge.icon}</div>
                <div class="badge-notification-content">
                    <h4>New Badge Earned!</h4>
                    <p>${badge.name}: ${badge.description}</p>
                </div>
            `;
            
            notification.classList.remove('hidden');
            
            // Hide after 5 seconds
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 5000);
        });
    }
    
    // Public API
    return {
        getAllBadges,
        getEarnedBadges,
        getBadgeById,
        awardBadge,
        hasBadge,
        clearAllBadges,
        displayBadges,
        initBadgeNotifications,
        showBadgePopup
    };
})();

// Initialize notifications when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    BadgeManager.initBadgeNotifications();
    
    // Check for badge display containers and show badges if they exist
    const containerIds = ['game-badges-container', 'badges-container', 'homepage-badges-container'];
    containerIds.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            BadgeManager.displayBadges(containerId);
        }
    });
});

// Export for global usage
window.badgeSystem = BadgeManager;