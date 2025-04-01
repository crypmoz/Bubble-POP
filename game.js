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
        this.particles = [];
        this.lastBubbleTime = 0;
        
        // Basic game settings
        this.config = {
            bubble: {
                minSize: 20,
                maxSize: 40,
                spawnInterval: 1000,
                minSpawnInterval: 500,
                baseSpeed: 1.5
            },
            hitArea: {
                multiplier: 1.2
            }
        };
        
        // Get DOM elements
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.gameOverlay = document.getElementById('gameOverlay');
        
        // Initialize power-ups with labels
        this.powerUps = {
            shield: { 
                element: document.getElementById('shield'), 
                active: false,
                label: 'Shield (Blocks Negative Points)',
                icon: '🛡️'
            },
            slowMotion: { 
                element: document.getElementById('slowMotion'), 
                active: false,
                label: 'Slow Motion',
                icon: '⏱️'
            },
            doublePoints: { 
                element: document.getElementById('doublePoints'), 
                active: false,
                label: 'Double Points',
                icon: '2️⃣'
            }
        };
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Create starry background
        this.createStarryBackground();
        
        // Initial setup
        this.resizeCanvas();
        this.highScoreElement.textContent = this.highScore;
    }

    createStarryBackground() {
        const starsContainer = document.querySelector('.stars');
        if (!starsContainer) {
            const container = document.createElement('div');
            container.className = 'stars';
            document.body.insertBefore(container, document.body.firstChild);
            
            const numberOfStars = 100;
            for (let i = 0; i < numberOfStars; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = `${Math.random() * 100}%`;
                star.style.top = `${Math.random() * 100}%`;
                star.style.width = `${Math.random() * 2 + 1}px`;
                star.style.height = star.style.width;
                star.style.setProperty('--twinkle-duration', `${Math.random() * 3 + 2}s`);
                container.appendChild(star);
            }
        }
    }

    setupEventListeners() {
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            
            this.handleClick(x, y);
        }, { passive: false });

        // Mouse events
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            this.handleClick(x, y);
        });

        // Prevent scrolling while playing
        document.addEventListener('touchmove', (e) => {
            if (this.isPlaying) e.preventDefault();
        }, { passive: false });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        // Set up power-up click handlers with tooltips
        Object.entries(this.powerUps).forEach(([key, powerUp]) => {
            powerUp.element.setAttribute('data-tooltip', powerUp.label);
            powerUp.element.innerHTML = powerUp.icon;
            
            powerUp.element.addEventListener('click', (e) => {
                e.preventDefault();
                this.activatePowerUp(key);
            });

            // Mobile tooltip handling
            powerUp.element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const tooltip = powerUp.element.getAttribute('data-tooltip');
                powerUp.element.classList.add('tooltip-visible');
                
                setTimeout(() => {
                    powerUp.element.classList.remove('tooltip-visible');
                }, 2000);
            }, { passive: false });
        });

        // Game control buttons
        this.startButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());
    }

    handleClick(x, y) {
        if (!this.isPlaying || this.isPaused) return;

        let hitBubble = false;
        
        this.bubbles = this.bubbles.filter(bubble => {
            const dx = x - bubble.x;
            const dy = y - bubble.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= bubble.radius * this.config.hitArea.multiplier) {
                hitBubble = true;
                this.score += bubble.points;
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

    createBubble() {
        const minSize = this.config.bubble.minSize;
        const maxSize = this.config.bubble.maxSize;
        const radius = Math.random() * (maxSize - minSize) + minSize;
        
        const x = Math.random() * (this.canvas.width - radius * 2) + radius;
        const y = this.canvas.height + radius;
        
        const bubble = new Bubble(x, y, radius, this.getRandomColor());
        bubble.speed = this.config.bubble.baseSpeed;
        bubble.canvas = this.canvas;
        
        return bubble;
    }

    animate(currentTime) {
        if (!this.isPlaying || this.isPaused) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            particle.draw(this.ctx);
            return particle.life > 0;
        });

        // Update and draw bubbles
        this.bubbles = this.bubbles.filter(bubble => {
            if (bubble.y + bubble.radius < 0) return false;
            bubble.update();
            bubble.draw(this.ctx);
            return true;
        });

        // Spawn new bubbles
        if (currentTime - this.lastBubbleTime > this.config.bubble.spawnInterval) {
            this.bubbles.push(this.createBubble());
            this.lastBubbleTime = currentTime;
            
            // Increase difficulty
            this.config.bubble.spawnInterval = Math.max(
                this.config.bubble.minSpawnInterval,
                this.config.bubble.spawnInterval - 10
            );
        }

        this.animationFrameId = requestAnimationFrame((time) => this.animate(time));
    }

    createPopEffect(bubble) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(bubble.x, bubble.y, bubble.color));
        }
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    startGame() {
        this.isPlaying = true;
        this.score = 0;
        this.scoreElement.textContent = '0';
        this.bubbles = [];
        this.particles = [];
        this.isPaused = false;
        this.config.bubble.spawnInterval = 1000;
        
        this.startButton.style.display = 'none';
        this.pauseButton.style.display = 'inline-block';
        this.gameOverlay.style.display = 'none';
        
        this.animate(0);
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

    activatePowerUp(powerUp) {
        if (this.powerUps[powerUp].active) return;
        
        this.powerUps[powerUp].active = true;
        this.powerUps[powerUp].element.classList.add('active');
        
        setTimeout(() => {
            this.powerUps[powerUp].active = false;
            this.powerUps[powerUp].element.classList.remove('active');
        }, 10000);
    }

    getRandomColor() {
        const colors = [
            '#FF6B6B', // Red
            '#4ECDC4', // Cyan
            '#45B7D1', // Blue
            '#96CEB4', // Green
            '#FFEEAD', // Yellow
            '#FFD93D', // Orange
            '#FF9999', // Pink
            '#9B59B6'  // Purple
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Initialize game
const game = new Game(); 