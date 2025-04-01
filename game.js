class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 1;
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
        
        // Different bubble types
        const random = Math.random();
        if (random < 0.1) {
            this.type = 'special'; // Star bubble
            this.points = 10;
        } else if (random < 0.2) {
            this.type = 'bomb'; // Bomb bubble
            this.points = -5;
        } else if (random < 0.3) {
            this.type = 'rainbow'; // Rainbow bubble
            this.points = 5;
            this.color = 'rainbow';
        } else {
            this.type = 'normal';
            this.points = 1;
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
        
        // Initialize power-ups
        this.powerUps = {
            shield: { element: document.getElementById('shield'), active: false, duration: 8000 },
            slowMotion: { element: document.getElementById('slowMotion'), active: false, duration: 8000 },
            doublePoints: { element: document.getElementById('doublePoints'), active: false, duration: 8000 }
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
    }
    
    startGame() {
        this.isPlaying = true;
        this.score = 0;
        this.scoreElement.textContent = '0';
        this.bubbles = [];
        this.isPaused = false;
        
        this.startButton.style.display = 'none';
        this.pauseButton.style.display = 'inline-block';
        this.gameOverlay.style.display = 'none';
        
        // Reset any active power-ups
        Object.values(this.powerUps).forEach(powerUp => {
            powerUp.active = false;
            powerUp.element.classList.remove('active');
        });
        
        this.animate();
    }
    
    createBubble() {
        const screenSize = Math.min(this.canvas.width, this.canvas.height);
        const minSize = screenSize * (this.isMobile ? 0.05 : 0.04);
        const maxSize = minSize * 1.3;
        const radius = Math.random() * (maxSize - minSize) + minSize;
        
        // Use 60% of canvas width for bubble spawning
        const usableWidth = this.canvas.width * 0.6;
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
    
    animate() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw bubbles
        this.bubbles = this.bubbles.filter(bubble => {
            if (bubble.y + bubble.radius < 0) {
                return false; // Remove bubbles that are off screen
            }
            bubble.update();
            bubble.draw(this.ctx);
            return true;
        });
        
        const currentTime = Date.now();
        if (currentTime - this.lastBubbleTime > this.bubbleInterval) {
            this.bubbles.push(this.createBubble());
            this.lastBubbleTime = currentTime;
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
    
    handleClick(x, y) {
        if (!this.isPlaying || this.isPaused) return;
        
        let hitBubble = false;
        
        this.bubbles = this.bubbles.filter(bubble => {
            if (!bubble || typeof bubble.x !== 'number' || typeof bubble.y !== 'number') return false;
            
            const dx = x - bubble.x;
            const dy = y - bubble.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Increase hit area for mobile
            const hitRadius = this.isMobile ? bubble.radius * 2 : bubble.radius * 1.2;
            
            if (distance <= hitRadius) {
                hitBubble = true;
                const points = this.powerUps.doublePoints.active ? 2 : 1;
                this.score += points;
                this.scoreElement.textContent = this.score;
                
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
    
    createPopEffect(bubble) {
        // Create particles for pop effect
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(bubble.x, bubble.y, bubble.color));
        }
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
            this.animate();
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
        }, this.powerUps[powerUp].duration);
    }
}

// Initialize game
const game = new Game(); 