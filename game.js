class Particle {
    constructor(x, y, color) {
        this.reset(x, y, color);
    }
    
    reset(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 1;
        return this;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.02;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Bubble {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = Math.random() * 2 + 1;
        this.baseColor = this.color;
        this.glowIntensity = Math.random() * 0.3 + 0.7;
        this.highlight = {
            x: -this.radius * 0.3,
            y: -this.radius * 0.3,
            radius: this.radius * 0.4
        };
        this.shadow = {
            x: this.radius * 0.2,
            y: this.radius * 0.2,
            radius: this.radius * 0.8
        };
        
        // Different bubble types with adjusted probabilities
        const random = Math.random();
        if (random < 0.05) { // 5% chance for star bubble
            this.type = 'star';
            this.points = 10;
            this.specialColor = '#FFD700'; // Gold color for star
        } else if (random < 0.1) { // 5% chance for bomb bubble
            this.type = 'bomb';
            this.points = -5;
            this.specialColor = '#FF0000'; // Red color for bomb
        } else if (random < 0.15) { // 5% chance for rainbow bubble
            this.type = 'rainbow';
            this.points = 5;
            this.specialColor = null; // Rainbow effect handled separately
        } else {
            this.type = 'normal';
            this.points = 1;
            this.specialColor = null;
        }
    }

    update() {
        this.y -= this.speed;
        if (this.type === 'rainbow') {
            this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        }
        if (this.y + this.radius < 0) {
            this.y = this.canvas.height + this.radius;
            this.x = Math.random() * (this.canvas.width - this.radius * 2) + this.radius;
        }
    }

    draw(ctx) {
        // Create gradient for 3D effect
        const gradient = ctx.createRadialGradient(
            this.x + this.highlight.x,
            this.y + this.highlight.y,
            0,
            this.x,
            this.y,
            this.radius * 1.2
        );

        // Get RGB values based on color format
        let rgb;
        if (this.color.startsWith('#')) {
            rgb = this.hexToRgb(this.color);
        } else if (this.color.startsWith('hsl')) {
            rgb = this.hslToRgb(this.color);
        } else {
            // Default color if parsing fails
            rgb = { r: 100, g: 100, b: 255 };
        }
        
        // Create highlight and shadow colors
        const highlightColor = `rgba(255, 255, 255, 0.8)`;
        const mainColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.glowIntensity})`;
        const shadowColor = `rgba(${Math.max(0, rgb.r - 50)}, ${Math.max(0, rgb.g - 50)}, ${Math.max(0, rgb.b - 50)}, ${this.glowIntensity})`;

        gradient.addColorStop(0, highlightColor);
        gradient.addColorStop(0.4, mainColor);
        gradient.addColorStop(1, shadowColor);

        // Draw special bubble effects
        if (this.type === 'star') {
            this.drawStarEffect(ctx);
        } else if (this.type === 'bomb') {
            this.drawBombEffect(ctx);
        } else if (this.type === 'rainbow') {
            this.drawRainbowEffect(ctx);
        }

        // Draw main bubble
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add shine effect
        const shineGradient = ctx.createRadialGradient(
            this.x + this.highlight.x,
            this.y + this.highlight.y,
            0,
            this.x + this.highlight.x,
            this.y + this.highlight.y,
            this.highlight.radius
        );
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.arc(
            this.x + this.highlight.x,
            this.y + this.highlight.y,
            this.highlight.radius,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = shineGradient;
        ctx.fill();
    }

    drawStarEffect(ctx) {
        const spikes = 5;
        const outerRadius = this.radius * 1.2;
        const innerRadius = this.radius * 0.8;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = this.x + Math.cos(angle) * radius;
            const y = this.y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fillStyle = this.specialColor;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawBombEffect(ctx) {
        // Draw fuse
        ctx.beginPath();
        ctx.moveTo(this.x + this.radius, this.y - this.radius * 0.5);
        ctx.lineTo(this.x + this.radius * 1.5, this.y - this.radius);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw spark
        if (Math.random() < 0.3) {
            ctx.beginPath();
            ctx.arc(this.x + this.radius * 1.5, this.y - this.radius, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#FFA500';
            ctx.fill();
        }
    }

    drawRainbowEffect(ctx) {
        const gradient = ctx.createLinearGradient(
            this.x - this.radius,
            this.y - this.radius,
            this.x + this.radius,
            this.y + this.radius
        );
        
        gradient.addColorStop(0, '#FF0000');
        gradient.addColorStop(0.2, '#FFA500');
        gradient.addColorStop(0.4, '#FFFF00');
        gradient.addColorStop(0.6, '#00FF00');
        gradient.addColorStop(0.8, '#0000FF');
        gradient.addColorStop(1, '#800080');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.1, 0, Math.PI * 2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    hslToRgb(hsl) {
        const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) return { r: 100, g: 100, b: 255 };

        let h = parseInt(match[1]) / 360;
        let s = parseInt(match[2]) / 100;
        let l = parseInt(match[3]) / 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    isClicked(x, y) {
        const distance = Math.sqrt(
            Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2)
        );
        return distance <= this.radius;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.animationFrameId = null;
        this.bubbles = [];
        this.lastBubbleTime = 0;
        this.bubbleInterval = 1000;
        this.particles = [];
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Get DOM elements
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.gameOverlay = document.getElementById('gameOverlay');
        
        // Initialize event listeners
        this.startButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        
        // Add frame rate control
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / 60; // Target 60 FPS
        
        // Optimize particle system
        this.maxParticles = 100;
        
        // Game balance settings
        this.powerUpDurations = {
            shield: 10000,
            slowMotion: 8000,
            doublePoints: 12000
        };
        
        this.bubbleSpeed = {
            min: 1,
            max: 3,
            increaseRate: 0.1 // Speed increase per 100 points
        };
        
        // Initialize power-ups with new durations
        this.powerUps = {
            shield: { element: document.getElementById('shield'), active: false, duration: this.powerUpDurations.shield },
            slowMotion: { element: document.getElementById('slowMotion'), active: false, duration: this.powerUpDurations.slowMotion },
            doublePoints: { element: document.getElementById('doublePoints'), active: false, duration: this.powerUpDurations.doublePoints }
        };
        
        // Set up power-up click handlers
        Object.entries(this.powerUps).forEach(([key, powerUp]) => {
            const handlePowerUp = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.activatePowerUp(key);
            };
            
            powerUp.element.addEventListener('click', handlePowerUp);
            powerUp.element.addEventListener('touchstart', handlePowerUp, { passive: false });
            
            // Mobile tooltip handling
            let tooltipTimeout;
            powerUp.element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                clearTimeout(tooltipTimeout);
                
                Object.values(this.powerUps).forEach(p => 
                    p.element.classList.remove('tooltip-visible')
                );
                
                powerUp.element.classList.add('tooltip-visible');
                
                tooltipTimeout = setTimeout(() => {
                    powerUp.element.classList.remove('tooltip-visible');
                }, 2000);
            }, { passive: false });
        });

        // Handle touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            const x = ((touch.clientX - rect.left) * dpr);
            const y = ((touch.clientY - rect.top) * dpr);
            
            this.handleClick(x, y);
        }, { passive: false });

        // Handle mouse events
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            const x = (e.clientX - rect.left) * dpr;
            const y = (e.clientY - rect.top) * dpr;
            
            this.handleClick(x, y);
        });

        // Prevent scrolling while playing
        document.body.addEventListener('touchmove', (e) => {
            if (this.isPlaying) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.resizeCanvas();
                if (this.isPlaying) {
                    this.adjustBubblePositions();
                }
            }, 100);
        });
        
        // Initial setup
        this.createStarryBackground();
        this.resizeCanvas();
        this.highScoreElement.textContent = this.highScore;
        this.gameOverlay.style.display = 'flex';

        // Add special bubble settings
        this.specialBubbleSettings = {
            star: {
                probability: 0.05,
                points: 10,
                color: '#FFD700'
            },
            bomb: {
                probability: 0.05,
                points: -5,
                color: '#FF0000'
            },
            rainbow: {
                probability: 0.05,
                points: 5,
                color: null
            }
        };

        // Add object pooling
        this.particlePool = [];
        this.maxParticlePoolSize = 200;
        this.popupPool = [];
        this.maxPopupPoolSize = 50;
        
        // Game balance settings
        this.gameSettings = {
            powerUpCooldowns: {
                shield: 30000,    // 30 seconds
                slowMotion: 25000, // 25 seconds
                doublePoints: 35000 // 35 seconds
            },
            difficulty: {
                initialSpeed: 1,
                maxSpeed: 4,
                speedIncrease: 0.1,
                speedIncreaseInterval: 1000, // Every 1000 points
                bubbleInterval: {
                    initial: 1000,
                    min: 500
                }
            },
            scoring: {
                comboMultiplier: {
                    threshold: 5,
                    maxMultiplier: 3
                }
            }
        };
        
        // Game state
        this.combo = 0;
        this.lastBubblePopTime = 0;
        this.comboTimeout = 2000; // 2 seconds to maintain combo
    }
    
    getParticle() {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        return null;
    }
    
    recycleParticle(particle) {
        if (this.particlePool.length < this.maxParticlePoolSize) {
            this.particlePool.push(particle);
        }
    }
    
    getPopup() {
        if (this.popupPool.length > 0) {
            return this.popupPool.pop();
        }
        return document.createElement('div');
    }
    
    recyclePopup(popup) {
        if (this.popupPool.length < this.maxPopupPoolSize) {
            popup.remove();
            this.popupPool.push(popup);
        }
    }
    
    startGame() {
        this.isPlaying = true;
        this.score = 0;
        this.scoreElement.textContent = '0';
        this.bubbles = [];
        this.particles = [];
        this.isPaused = false;
        this.lastFrameTime = 0;
        
        this.startButton.style.display = 'none';
        this.pauseButton.style.display = 'inline-block';
        this.gameOverlay.style.display = 'none';
        
        // Reset any active power-ups
        Object.values(this.powerUps).forEach(powerUp => {
            powerUp.active = false;
            powerUp.element.classList.remove('active');
        });
        
        this.animate(0);
    }
    
    createBubble() {
        const screenSize = Math.min(this.canvas.width, this.canvas.height);
        const minSize = screenSize * (this.isMobile ? 0.04 : 0.03);
        const maxSize = minSize * 1.5;
        const radius = Math.random() * (maxSize - minSize) + minSize;
        
        // Use 80% of canvas width for bubble spawning
        const usableWidth = this.canvas.width * 0.8;
        const margin = (this.canvas.width - usableWidth) / 2;
        
        const x = margin + Math.random() * usableWidth;
        const y = this.canvas.height + radius;
        
        const colors = [
            'hsl(0, 80%, 60%)',    // Red
            'hsl(30, 80%, 60%)',   // Orange
            'hsl(60, 80%, 60%)',   // Yellow
            'hsl(120, 80%, 60%)',  // Green
            'hsl(180, 80%, 60%)',  // Cyan
            'hsl(240, 80%, 60%)',  // Blue
            'hsl(300, 80%, 60%)',  // Purple
            'hsl(330, 80%, 60%)'   // Pink
        ];
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const bubble = new Bubble(x, y, radius, color);
        bubble.canvas = this.canvas;
        return bubble;
    }
    
    animate(currentTime) {
        if (!this.isPlaying || this.isPaused) return;
        
        // Frame rate control
        if (currentTime - this.lastFrameTime < this.frameInterval) {
            this.animationFrameId = requestAnimationFrame((time) => this.animate(time));
            return;
        }
        this.lastFrameTime = currentTime;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            particle.draw(this.ctx);
            if (particle.life <= 0) {
                this.recycleParticle(particle);
                return false;
            }
            return true;
        });
        
        // Update and draw bubbles
        this.bubbles = this.bubbles.filter(bubble => {
            if (bubble.y + bubble.radius < 0) {
                return false;
            }
            bubble.update();
            bubble.draw(this.ctx);
            return true;
        });
        
        // Adjust game difficulty based on score
        const speedMultiplier = 1 + (Math.floor(this.score / this.gameSettings.difficulty.speedIncreaseInterval) * 
            this.gameSettings.difficulty.speedIncrease);
        
        this.bubbles.forEach(bubble => {
            bubble.speed = Math.min(
                this.gameSettings.difficulty.maxSpeed,
                this.gameSettings.difficulty.initialSpeed * speedMultiplier
            );
        });
        
        // Adjust bubble spawn interval
        const spawnInterval = Math.max(
            this.gameSettings.difficulty.bubbleInterval.min,
            this.gameSettings.difficulty.bubbleInterval.initial - 
            (Math.floor(this.score / this.gameSettings.difficulty.speedIncreaseInterval) * 50)
        );
        
        if (currentTime - this.lastBubbleTime > spawnInterval) {
            this.bubbles.push(this.createBubble());
            this.lastBubbleTime = currentTime;
        }
        
        this.animationFrameId = requestAnimationFrame((time) => this.animate(time));
    }
    
    handleClick(x, y) {
        if (!this.isPlaying || this.isPaused) return;
        
        let hitBubble = false;
        const currentTime = Date.now();
        
        // Update combo
        if (currentTime - this.lastBubblePopTime > this.comboTimeout) {
            this.combo = 0;
        }
        this.combo++;
        this.lastBubblePopTime = currentTime;
        
        // Calculate combo multiplier
        const comboMultiplier = Math.min(
            this.gameSettings.scoring.comboMultiplier.maxMultiplier,
            Math.floor(this.combo / this.gameSettings.scoring.comboMultiplier.threshold) + 1
        );
        
        // Add visual feedback for touch
        if (this.isMobile) {
            this.createTouchFeedback(x, y);
        }
        
        this.bubbles = this.bubbles.filter(bubble => {
            if (!bubble || typeof bubble.x !== 'number' || typeof bubble.y !== 'number') return false;
            
            const dx = x - bubble.x;
            const dy = y - bubble.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const hitRadius = this.isMobile ? bubble.radius * 2.5 : bubble.radius * 1.5;
            
            if (distance <= hitRadius) {
                hitBubble = true;
                const basePoints = this.powerUps.doublePoints.active ? bubble.points * 2 : bubble.points;
                const finalPoints = basePoints * comboMultiplier;
                this.score += finalPoints;
                this.scoreElement.textContent = this.score;
                
                this.showPointsPopup(bubble.x, bubble.y, finalPoints);
                
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    this.highScoreElement.textContent = this.highScore;
                    localStorage.setItem('highScore', this.highScore);
                }
                
                this.createPopEffect(bubble);
                return false;
            }
            return true;
        });
        
        if (hitBubble && navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    createTouchFeedback(x, y) {
        const feedback = document.createElement('div');
        feedback.className = 'touch-feedback';
        feedback.style.left = `${x}px`;
        feedback.style.top = `${y}px`;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 500);
    }
    
    createPopEffect(bubble) {
        const particleCount = Math.min(8, this.maxParticles - this.particles.length);
        for (let i = 0; i < particleCount; i++) {
            let particle = this.getParticle();
            if (!particle) {
                particle = new Particle(bubble.x, bubble.y, bubble.color);
            } else {
                particle.reset(bubble.x, bubble.y, bubble.color);
            }
            this.particles.push(particle);
        }
    }
    
    showPointsPopup(x, y, points) {
        const popup = this.getPopup();
        popup.className = 'points-popup';
        popup.textContent = points > 0 ? `+${points}` : points;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        document.body.appendChild(popup);
        
        setTimeout(() => {
            this.recyclePopup(popup);
        }, 1000);
    }
    
    togglePause() {
        if (!this.isPlaying) return;
        
        this.isPaused = !this.isPaused;
        this.pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
        
        if (this.isPaused) {
            cancelAnimationFrame(this.animationFrameId);
            this.gameOverlay.style.display = 'flex';
        } else {
            this.gameOverlay.style.display = 'none';
            this.animate(0);
        }
    }
    
    endGame() {
        this.isPlaying = false;
        this.isPaused = false;
        this.startButton.style.display = 'inline-block';
        this.pauseButton.style.display = 'none';
        this.gameOverlay.style.display = 'flex';
        cancelAnimationFrame(this.animationFrameId);
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Scale context for retina displays
        this.ctx.scale(dpr, dpr);
        
        // Clear any existing bubbles and reset
        if (this.isPlaying) {
            this.bubbles = [];
            this.lastBubbleTime = Date.now();
        }
    }
    
    adjustBubblePositions() {
        const usableWidth = this.canvas.width * 0.6;
        const margin = (this.canvas.width - usableWidth) / 2;
        
        this.bubbles.forEach(bubble => {
            if (bubble.x < margin) {
                bubble.x = margin + bubble.radius;
            } else if (bubble.x > this.canvas.width - margin) {
                bubble.x = this.canvas.width - margin - bubble.radius;
            }
        });
    }
    
    createStarryBackground() {
        const starsContainer = document.querySelector('.stars');
        const numberOfStars = 100;
        
        for (let i = 0; i < numberOfStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.width = `${Math.random() * 2 + 1}px`;
            star.style.height = star.style.width;
            star.style.setProperty('--twinkle-duration', `${Math.random() * 3 + 2}s`);
            starsContainer.appendChild(star);
        }
    }

    activatePowerUp(powerUp) {
        if (this.powerUps[powerUp].active) return;
        
        this.powerUps[powerUp].active = true;
        this.powerUps[powerUp].element.classList.add('active');
        
        // Apply power-up effects
        switch(powerUp) {
            case 'shield':
                // Shield effect (visual only for now)
                break;
            case 'slowMotion':
                this.bubbles.forEach(bubble => bubble.speed *= 0.5);
                break;
            case 'doublePoints':
                // Points multiplier is handled in handleClick
                break;
        }
        
        // Reset power-up after duration
        setTimeout(() => {
            this.powerUps[powerUp].active = false;
            this.powerUps[powerUp].element.classList.remove('active');
            
            if (powerUp === 'slowMotion') {
                this.bubbles.forEach(bubble => bubble.speed *= 2);
            }
            
            // Add cooldown
            this.powerUps[powerUp].element.classList.add('cooldown');
            setTimeout(() => {
                this.powerUps[powerUp].element.classList.remove('cooldown');
            }, this.gameSettings.powerUpCooldowns[powerUp]);
        }, this.powerUpDurations[powerUp]);
    }
}

// Initialize game
const game = new Game(); 