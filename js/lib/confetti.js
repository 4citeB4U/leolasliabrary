/**
 * Simple confetti animation
 * Adapted for the Crochet Mastery application
 */
const confetti = {
    maxCount: 150,      // Maximum particles
    speed: 2,           // Particle speed
    frameInterval: 15,  // Frame update interval
    alpha: 1.0,         // Opacity
    gradient: false,    // Gradient effect
    start: null,        // Timestamp for start
    stop: null,         // Timestamp for stop
    toggle: null,       // Toggle function
    pause: null,        // Pause function
    resume: null,       // Resume function
    clear: null,        // Clear function
    isRunning: false,   // Running state
    
    particles: [],
    
    // Colors for particles
    colors: [
        [255, 89, 94],  // Red
        [255, 202, 58], // Yellow
        [138, 201, 38], // Green
        [25, 130, 196], // Blue
        [106, 76, 147]  // Purple
    ],
    
    // Draw particle
    drawParticle: function(context, particle) {
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(particle.x + particle.tilt + particle.diameter / 2, particle.y + particle.tilt);
        context.lineTo(particle.x + particle.tilt * 2 + particle.diameter / 2, particle.y + particle.tilt * 2);
        context.fillStyle = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${particle.alpha})`;
        context.fill();
    },
    
    // Update particles
    update: function() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        let particle;
        
        this.frameInterval = 15;
        
        // Reduce particle count on small screens
        if (width <= 768) {
            this.maxCount = 100;
        }
        if (width <= 480) {
            this.maxCount = 75;
        }
        
        this.start = this.start || Date.now();
        const now = Date.now();
        
        if (this.isRunning) {
            requestAnimationFrame(this.update.bind(this));
        }
        
        if (this.particles.length < this.maxCount && this.isRunning) {
            this.particles.push(this.createParticle(width, height));
        }
        
        context.clearRect(0, 0, width, height);
        
        for (let i = 0; i < this.particles.length; i++) {
            particle = this.particles[i];
            
            // Update particle position
            particle.tiltAngle += particle.tiltAngleIncrement;
            particle.y += (Math.cos(particle.angle) + 1 + particle.diameter / 2) * this.speed;
            particle.x += Math.sin(particle.angle) * this.speed;
            particle.tilt = Math.sin(particle.tiltAngle) * 12;
            
            // If particle is past the bottom of the screen, remove it
            if (particle.y > height) {
                if (i % 5 > 0 || i % 2 === 0) {
                    // Create a new particle at the top
                    this.particles[i] = this.createParticle(width, height, particle.x);
                } else {
                    // Remove this particle
                    this.particles.splice(i, 1);
                    i--;
                }
            }
            
            // Draw the particle
            if (particle.y < height) {
                this.drawParticle(context, particle);
            }
        }
    },
    
    // Create a new particle
    createParticle: function(width, height, x) {
        return {
            x: x || Math.random() * width,
            y: -20 - Math.random() * 100,
            diameter: Math.random() * 6 + 4,
            tilt: 0,
            tiltAngle: 0,
            tiltAngleIncrement: Math.random() * 0.1 + 0.05,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            angle: Math.random() * 6.28,
            alpha: 1
        };
    },
    
    // Initialize confetti
    init: function() {
        const canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '999';
        canvas.style.pointerEvents = 'none';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
        
        window.addEventListener('resize', function() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
        
        context = canvas.getContext('2d');
        
        this.start = Date.now();
        this.isRunning = false;
        this.particles = [];
        
        // Start function
        this.start = function() {
            if (!this.isRunning) {
                this.isRunning = true;
                this.particles = [];
                this.update();
            }
        }.bind(this);
        
        // Stop function
        this.stop = function() {
            this.isRunning = false;
        }.bind(this);
        
        // Toggle function
        this.toggle = function() {
            if (this.isRunning) {
                this.stop();
            } else {
                this.start();
            }
        }.bind(this);
        
        // Clear function
        this.clear = function() {
            this.stop();
            context.clearRect(0, 0, canvas.width, canvas.height);
            this.particles = [];
        }.bind(this);
        
        // Auto-stop after 8 seconds
        this.autoStop = function() {
            setTimeout(() => {
                this.stop();
                
                // Fade out particles gradually
                const fadeInterval = setInterval(() => {
                    let particlesExist = false;
                    
                    for (let i = 0; i < this.particles.length; i++) {
                        this.particles[i].alpha -= 0.02;
                        
                        if (this.particles[i].alpha <= 0) {
                            this.particles.splice(i, 1);
                            i--;
                        } else {
                            particlesExist = true;
                        }
                    }
                    
                    if (!particlesExist) {
                        clearInterval(fadeInterval);
                        context.clearRect(0, 0, canvas.width, canvas.height);
                    } else {
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        for (let i = 0; i < this.particles.length; i++) {
                            this.drawParticle(context, this.particles[i]);
                        }
                    }
                }, 50);
            }, 8000);
        }.bind(this);
        
        // Run celebration with auto-stop
        this.celebrate = function() {
            this.start();
            this.autoStop();
        }.bind(this);
        
        return this;
    }
};

// Initialize on load
let context;
document.addEventListener('DOMContentLoaded', function() {
    confetti.init();
});