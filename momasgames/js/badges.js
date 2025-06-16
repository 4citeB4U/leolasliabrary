/**
 * Badge system for Crochet Mastery
 * Tracks user progress and awards badges for completed patterns
 */
const badgeSystem = {
    badges: {
        easy: {
            id: 'easy-badge',
            name: 'Beginner Stitcher',
            description: 'Completed an Easy pattern',
            icon: '🟢',
            class: 'easy-badge'
        },
        medium: {
            id: 'medium-badge',
            name: 'Intermediate Crocheter',
            description: 'Completed a Medium pattern',
            icon: '🟡',
            class: 'medium-badge'
        },
        hard: {
            id: 'hard-badge',
            name: 'Expert Yarn Master',
            description: 'Completed a Hard pattern',
            icon: '🔴',
            class: 'hard-badge'
        },
        all: {
            id: 'all-badge',
            name: 'Crochet Champion',
            description: 'Completed all difficulty levels',
            icon: '🏆',
            class: 'all-badge'
        }
    },
    
    // Initialize badge system
    init: function() {
        // Create badge notification element
        const badgeNotification = document.createElement('div');
        badgeNotification.id = 'badge-notification';
        badgeNotification.className = 'badge-notification';
        document.body.appendChild(badgeNotification);
        
        // Create badges container in the header
        this.createBadgesContainer();
        
        // Load earned badges from localStorage
        this.loadEarnedBadges();
        
        return this;
    },
    
    // Create badges container
    createBadgesContainer: function() {
        const headerContainer = document.querySelector('header .container');
        
        if (headerContainer) {
            const badgesContainer = document.createElement('div');
            badgesContainer.className = 'badges-container';
            badgesContainer.innerHTML = '<h3>Your Badges:</h3><div id="earned-badges" class="earned-badges"></div>';
            headerContainer.appendChild(badgesContainer);
            
            // Add CSS for badges
            const style = document.createElement('style');
            style.textContent = `
                .badges-container {
                    margin-top: 15px;
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    padding: 10px;
                    text-align: center;
                }
                
                .badges-container h3 {
                    font-size: 1rem;
                    margin-bottom: 8px;
                    opacity: 0.9;
                }
                
                .earned-badges {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                
                .badge {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background-color: rgba(255, 255, 255, 0.9);
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    justify-content: center;
                    position: relative;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
                
                .badge:hover {
                    transform: scale(1.2);
                }
                
                .badge-icon {
                    font-size: 1.5rem;
                }
                
                .badge.easy-badge {
                    background: linear-gradient(135deg, #4CAF50, #8BC34A);
                }
                
                .badge.medium-badge {
                    background: linear-gradient(135deg, #FFC107, #FF9800);
                }
                
                .badge.hard-badge {
                    background: linear-gradient(135deg, #F44336, #E91E63);
                }
                
                .badge.all-badge {
                    background: linear-gradient(135deg, #9C27B0, #3F51B5);
                }
                
                .badge-tooltip {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 0.8rem;
                    white-space: nowrap;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 100;
                }
                
                .badge:hover .badge-tooltip {
                    opacity: 1;
                }
                
                .badge-notification {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 10px;
                    z-index: 1000;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.5s ease, transform 0.5s ease;
                }
                
                .badge-notification.show {
                    opacity: 1;
                    transform: translate(-50%, 10px);
                }
                
                .badge-notification-icon {
                    font-size: 2rem;
                    margin-right: 15px;
                }
                
                .badge-notification-text h4 {
                    font-size: 1.2rem;
                    margin-bottom: 5px;
                }
                
                .badge-notification-text p {
                    font-size: 0.9rem;
                    opacity: 0.9;
                }
                
                @media screen and (max-width: 768px) {
                    .badge {
                        width: 40px;
                        height: 40px;
                    }
                    
                    .badge-icon {
                        font-size: 1.2rem;
                    }
                    
                    .badge-notification {
                        width: 90%;
                        padding: 12px 15px;
                    }
                    
                    .badge-notification-icon {
                        font-size: 1.8rem;
                        margin-right: 10px;
                    }
                    
                    .badge-notification-text h4 {
                        font-size: 1rem;
                    }
                    
                    .badge-notification-text p {
                        font-size: 0.8rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // Load earned badges from localStorage
    loadEarnedBadges: function() {
        try {
            const earnedBadges = JSON.parse(localStorage.getItem('crochetBadges')) || [];
            const badgesContainer = document.getElementById('earned-badges');
            
            if (badgesContainer) {
                badgesContainer.innerHTML = '';
                
                if (earnedBadges.length === 0) {
                    badgesContainer.innerHTML = '<p class="no-badges">Complete patterns to earn badges!</p>';
                } else {
                    earnedBadges.forEach(badgeId => {
                        const badge = this.getBadgeById(badgeId);
                        if (badge) {
                            this.renderBadge(badge, badgesContainer);
                        }
                    });
                }
            }
        } catch (e) {
            console.error('Error loading badges:', e);
        }
    },
    
    // Get badge by ID
    getBadgeById: function(badgeId) {
        return Object.values(this.badges).find(badge => badge.id === badgeId);
    },
    
    // Render a badge in the container
    renderBadge: function(badge, container) {
        const badgeElement = document.createElement('div');
        badgeElement.className = `badge ${badge.class}`;
        badgeElement.innerHTML = `
            <span class="badge-icon">${badge.icon}</span>
            <div class="badge-tooltip">
                <strong>${badge.name}</strong><br>
                ${badge.description}
            </div>
        `;
        container.appendChild(badgeElement);
    },
    
    // Award a badge for completing a pattern
    awardBadge: function(difficulty) {
        try {
            let earnedBadges = JSON.parse(localStorage.getItem('crochetBadges')) || [];
            const badge = this.badges[difficulty];
            
            // Check if badge is already earned
            if (badge && !earnedBadges.includes(badge.id)) {
                // Add badge to earned badges
                earnedBadges.push(badge.id);
                localStorage.setItem('crochetBadges', JSON.stringify(earnedBadges));
                
                // Check for "all" badge
                const allDifficulties = ['easy', 'medium', 'hard'];
                const earnedDifficulties = allDifficulties.filter(diff => 
                    earnedBadges.includes(this.badges[diff].id)
                );
                
                // Award "all" badge if all difficulties are completed
                if (earnedDifficulties.length === allDifficulties.length && 
                    !earnedBadges.includes(this.badges.all.id)) {
                    earnedBadges.push(this.badges.all.id);
                    localStorage.setItem('crochetBadges', JSON.stringify(earnedBadges));
                    
                    // Show notification for all badge after a delay
                    setTimeout(() => {
                        this.showBadgeNotification(this.badges.all);
                    }, 3000);
                }
                
                // Refresh badges display
                this.loadEarnedBadges();
                
                // Show notification
                this.showBadgeNotification(badge);
                
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error awarding badge:', e);
            return false;
        }
    },
    
    // Show badge notification
    showBadgeNotification: function(badge) {
        const notification = document.getElementById('badge-notification');
        
        if (notification) {
            notification.innerHTML = `
                <div class="badge-notification-icon">${badge.icon}</div>
                <div class="badge-notification-text">
                    <h4>New Badge Earned!</h4>
                    <p>${badge.name}: ${badge.description}</p>
                </div>
            `;
            
            notification.classList.add('show');
            
            // Hide notification after 5 seconds
            setTimeout(() => {
                notification.classList.remove('show');
            }, 5000);
        }
    }
};

// Initialize badge system on load
document.addEventListener('DOMContentLoaded', function() {
    badgeSystem.init();
});