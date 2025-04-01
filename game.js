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

        // Parse the base color to RGB components
        const baseRGB = this.hexToRgb(this.baseColor);
        
        // Create highlight and shadow colors
        const highlightColor = `rgba(255, 255, 255, 0.8)`;
        const mainColor = `rgba(${baseRGB.r}, ${baseRGB.g}, ${baseRGB.b}, ${this.glowIntensity})`;
        const shadowColor = `rgba(${Math.max(0, baseRGB.r - 50)}, ${Math.max(0, baseRGB.g - 50)}, ${Math.max(0, baseRGB.b - 50)}, ${this.glowIntensity})`;

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
        
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.gameOverlay = document.getElementById('gameOverlay');
        
        this.startButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        
        // Initialize power-ups
        this.powerUps = {
            shield: document.getElementById('shield'),
            slowMotion: document.getElementById('slowMotion'),
            doublePoints: document.getElementById('doublePoints')
        };
        
        Object.entries(this.powerUps).forEach(([key, element]) => {
            element.addEventListener('click', () => this.activatePowerUp(key));
        });
        
        // Set up touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            this.handleClick({
                clientX: (touch.clientX - rect.left) * scaleX,
                clientY: (touch.clientY - rect.top) * scaleY
            });
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
        
        // Create starry background
        this.createStarryBackground();
        
        // Initial setup
        this.resizeCanvas();
        this.highScoreElement.textContent = this.highScore;
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
        
        this.animate();
    }
    
    createBubble() {
        const minSize = Math.min(this.canvas.width, this.canvas.height) * 0.05;
        const maxSize = minSize * 2;
        const radius = Math.random() * (maxSize - minSize) + minSize;
        
        const x = Math.random() * (this.canvas.width - radius * 2) + radius;
        const y = this.canvas.height + radius;
        
        const hue = Math.random() * 360;
        const color = `hsl(${hue}, 70%, 50%)`;
        
        return new Bubble(x, y, radius, color);
    }
    
    animate() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        
        const currentTime = Date.now();
        if (currentTime - this.lastBubbleTime > this.bubbleInterval) {
            this.bubbles.push(this.createBubble());
            this.lastBubbleTime = currentTime;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.bubbles = this.bubbles.filter(bubble => {
            bubble.y -= bubble.speed;
            bubble.draw(this.ctx);
            return bubble.y + bubble.radius > 0;
        });
        
        if (this.bubbles.length === 0) {
            this.endGame();
        }
    }
    
    handleClick(event) {
        if (!this.isPlaying || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        this.bubbles = this.bubbles.filter(bubble => {
            const dx = x - bubble.x;
            const dy = y - bubble.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < bubble.radius) {
                this.score++;
                this.scoreElement.textContent = this.score;
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    this.highScoreElement.textContent = this.highScore;
                    localStorage.setItem('highScore', this.highScore);
                }
                return false;
            }
            return true;
        });
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
        
        this.ctx.scale(dpr, dpr);
    }
    
    adjustBubblePositions() {
        this.bubbles.forEach(bubble => {
            bubble.x = Math.min(bubble.x, this.canvas.width - bubble.radius);
            bubble.y = Math.min(bubble.y, this.canvas.height - bubble.radius);
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
        document.getElementById(powerUp).classList.add('active');
        
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
            document.getElementById(powerUp).classList.remove('active');
            
            if (powerUp === 'slowMotion') {
                this.bubbles.forEach(bubble => bubble.speed *= 2);
            }
        }, this.powerUps[powerUp].duration);
    }
}

// Initialize game
const game = new Game(); 