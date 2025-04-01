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
        
        // Set bubble type and points
        const random = Math.random();
        if (random < 0.05) {
            this.type = 'star';
            this.points = 10;
            this.specialColor = '#FFD700';
        } else if (random < 0.1) {
            this.type = 'bomb';
            this.points = -5;
            this.specialColor = '#FF0000';
        } else if (random < 0.15) {
            this.type = 'rainbow';
            this.points = 5;
            this.specialColor = null;
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
        const gradient = ctx.createRadialGradient(
            this.x + this.highlight.x,
            this.y + this.highlight.y,
            0,
            this.x,
            this.y,
            this.radius * 1.2
        );

        const rgb = this.color.startsWith('#') ? this.hexToRgb(this.color) : 
                    this.color.startsWith('hsl') ? this.hslToRgb(this.color) : 
                    { r: 100, g: 100, b: 255 };
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.glowIntensity})`);
        gradient.addColorStop(1, `rgba(${Math.max(0, rgb.r - 50)}, ${Math.max(0, rgb.g - 50)}, ${Math.max(0, rgb.b - 50)}, ${this.glowIntensity})`);

        // Draw special effects
        if (this.type === 'star') this.drawStarEffect(ctx);
        else if (this.type === 'bomb') this.drawBombEffect(ctx);
        else if (this.type === 'rainbow') this.drawRainbowEffect(ctx);

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
        ctx.arc(this.x + this.highlight.x, this.y + this.highlight.y, this.highlight.radius, 0, Math.PI * 2);
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
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = this.specialColor;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawBombEffect(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x + this.radius, this.y - this.radius * 0.5);
        ctx.lineTo(this.x + this.radius * 1.5, this.y - this.radius);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.stroke();
        
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
        return Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2)) <= this.radius;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.animationFrameId = null;
        this.bubbles = [];
        this.particles = [];
        this.lastBubbleTime = 0;
        this.gameStartTime = 0;
        this.lastBubbleIncreaseTime = 0;
        this.BUBBLE_INCREASE_INTERVAL = 10000; // 10 seconds
        this.lastFrameTime = 0;
        
        // Initialize game modes
        this.initializeGameModes();
        
        // Set up DOM elements and controls
        this.setupDOMElements();
        this.setupControls();
        this.setupEventListeners();
        
        // Initialize game environment
        this.createStarryBackground();
        this.resizeCanvas();
        
        // Start animation loop
        requestAnimationFrame(() => this.animate(0));
    }

    setupDOMElements() {
        // Create game container if it doesn't exist
        let container = document.querySelector('.game-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'game-container';
            document.body.appendChild(container);
        }

        // Create canvas if it doesn't exist
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'gameCanvas';
            container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d', { alpha: true });
        }

        // Create score container if it doesn't exist
        let scoreContainer = document.querySelector('.score-container');
        if (!scoreContainer) {
            scoreContainer = document.createElement('div');
            scoreContainer.className = 'score-container';
            scoreContainer.innerHTML = `
                <div>Score: <span id="score">0</span></div>
                <div>High Score: <span id="highScore">${this.highScore}</span></div>
            `;
            document.body.appendChild(scoreContainer);
        }

        // Get or create other necessary elements
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        
        if (!this.scoreElement || !this.highScoreElement) {
            console.error('Score elements not found');
            return;
        }

        // Update initial high score display
        this.highScoreElement.textContent = this.highScore;
    }

    setupControls() {
        // Create mode selector if it doesn't exist
        if (!this.modeSelector) {
            this.modeSelector = document.createElement('div');
            this.modeSelector.className = 'mode-selector';
            
            const zenButton = document.createElement('button');
            zenButton.textContent = 'Zen';
            zenButton.addEventListener('click', () => this.setGameMode('zen'));
            
            const fastButton = document.createElement('button');
            fastButton.textContent = 'Fast';
            fastButton.addEventListener('click', () => this.setGameMode('fast'));
            
            this.modeSelector.appendChild(zenButton);
            this.modeSelector.appendChild(fastButton);
            document.body.appendChild(this.modeSelector);
        }

        // Create pause button if it doesn't exist
        if (!this.pauseButton) {
            this.pauseButton = document.createElement('button');
            this.pauseButton.id = 'pauseButton';
            document.body.appendChild(this.pauseButton);
            this.pauseButton.style.display = 'none';
            this.pauseButton.addEventListener('click', () => this.togglePause());
        }

        // Create start button if it doesn't exist
        if (!this.startButton) {
            this.startButton = document.createElement('button');
            this.startButton.id = 'startButton';
            this.startButton.textContent = 'Start Game';
            document.body.appendChild(this.startButton);
            this.startButton.addEventListener('click', () => this.startGame());
        }
    }

    initializeGameModes() {
        this.modes = {
            zen: {
                spawnInterval: 1000,
                minSpawnInterval: 1000,
                baseSpeed: 1.05,
                maxSpeed: 1.05,
                negativeBubbleChance: 0.05,
                maxBubbles: 14,
                baseMaxBubbles: 14
            },
            fast: {
                spawnInterval: 1000,
                minSpawnInterval: 1000,
                baseSpeed: 2.75,
                maxSpeed: 2.75,
                negativeBubbleChance: 0.2,
                maxBubbles: 15,
                baseMaxBubbles: 15
            }
        };
        
        this.currentMode = 'zen';
        this.config = {
            bubble: {
                minSize: 20,
                maxSize: 40,
                spawnInterval: this.modes.zen.spawnInterval,
                minSpawnInterval: this.modes.zen.minSpawnInterval,
                baseSpeed: this.modes.zen.baseSpeed,
                maxSpeed: this.modes.zen.maxSpeed,
                negativeBubbleChance: this.modes.zen.negativeBubbleChance,
                maxBubbles: this.modes.zen.maxBubbles
            },
            hitArea: { multiplier: 1.2 }
        };
    }

    setGameMode(mode) {
        if (!this.modes[mode]) return;
        
        this.currentMode = mode;
        const settings = this.modes[mode];
        
        this.config.bubble.baseSpeed = settings.baseSpeed;
        this.config.bubble.maxSpeed = settings.maxSpeed;
        this.config.bubble.maxBubbles = settings.maxBubbles;
        
        document.querySelectorAll('.mode-button').forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-mode') === mode);
        });

        this.bubbles.forEach(bubble => bubble.speed = settings.baseSpeed);
    }

    setupEventListeners() {
        const handleInteraction = (e) => {
            if (!this.isPlaying || this.isPaused) return;
            
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            let x, y;
            if (e.type === 'touchstart') {
                x = (e.touches[0].clientX - rect.left) * scaleX;
                y = (e.touches[0].clientY - rect.top) * scaleY;
            } else {
                x = (e.clientX - rect.left) * scaleX;
                y = (e.clientY - rect.top) * scaleY;
            }
            
            this.handleClick(x, y);
        };

        this.canvas.addEventListener('touchstart', handleInteraction, { passive: false });
        this.canvas.addEventListener('click', handleInteraction);
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            // Reposition bubbles after resize
            this.bubbles.forEach(bubble => {
                if (bubble.x > this.canvas.width) {
                    bubble.x = this.canvas.width - bubble.radius;
                }
            });
        });
        
        this.startButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        
        // Prevent scrolling on mobile
        document.addEventListener('touchmove', (e) => {
            if (this.isPlaying) e.preventDefault();
        }, { passive: false });
    }

    createBubble() {
        const radius = Math.random() * (this.config.bubble.maxSize - this.config.bubble.minSize) + this.config.bubble.minSize;
        const x = Math.random() * (this.canvas.width - radius * 2) + radius;
        const y = this.canvas.height + radius;
        
        const bubble = new Bubble(x, y, radius, this.getRandomColor());
        bubble.speed = this.config.bubble.baseSpeed;
        bubble.canvas = this.canvas;
        
        if (Math.random() < this.config.bubble.negativeBubbleChance) {
            bubble.points = -5;
            bubble.color = '#FF0000';
        }
        
        return bubble;
    }

    animate(currentTime) {
        if (!this.isPlaying) return;
        if (this.isPaused) {
            // If paused, just keep requesting frames but don't update game state
            this.animationFrameId = requestAnimationFrame((time) => this.animate(time));
            return;
        }

        // Calculate delta time for smooth animations
        const deltaTime = this.lastFrameTime ? (currentTime - this.lastFrameTime) / 1000 : 0;
        this.lastFrameTime = currentTime;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const currentGameTime = Date.now();
        if (currentGameTime - this.lastBubbleIncreaseTime >= this.BUBBLE_INCREASE_INTERVAL) {
            this.increaseBubbleCount();
            this.lastBubbleIncreaseTime = currentGameTime;
        }

        // Update particles with delta time
        this.particles = this.particles.filter(particle => {
            particle.update();
            particle.draw(this.ctx);
            return particle.life > 0;
        });

        // Update bubbles with delta time
        this.bubbles = this.bubbles.filter(bubble => {
            if (bubble.y + bubble.radius < 0) return false;
            bubble.update();
            bubble.draw(this.ctx);
            return true;
        });

        if (currentTime - this.lastBubbleTime > this.config.bubble.spawnInterval && 
            this.bubbles.length < this.config.bubble.maxBubbles) {
            this.bubbles.push(this.createBubble());
            this.lastBubbleTime = currentTime;
        }

        this.animationFrameId = requestAnimationFrame((time) => this.animate(time));
    }

    increaseBubbleCount() {
        Object.keys(this.modes).forEach(mode => {
            this.modes[mode].maxBubbles = Math.floor(this.modes[mode].maxBubbles * 1.05);
        });
        this.config.bubble.maxBubbles = this.modes[this.currentMode].maxBubbles;
    }

    createStarryBackground() {
        const existingStars = document.querySelector('.stars');
        if (existingStars) existingStars.remove();

        const container = document.createElement('div');
        container.className = 'stars';
        document.body.insertBefore(container, document.body.firstChild);
        
        // Create game title if it doesn't exist
        let gameTitle = document.querySelector('.game-title');
        if (!gameTitle) {
            gameTitle = document.createElement('h1');
            gameTitle.className = 'game-title';
            gameTitle.textContent = 'Bubble Pop';
            document.querySelector('.game-container').appendChild(gameTitle);
        }
        
        // Reduced number of stars to 150 (50% of original 300)
        for (let i = 0; i < 150; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            
            // Smaller star sizes for more dot-like appearance
            const size = Math.random() * 2 + 1; // 1-3px instead of 2-6px
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            
            const duration = Math.random() * 4 + 6;
            const delay = Math.random() * 3;
            star.style.setProperty('--twinkle-duration', `${duration}s`);
            star.style.animationDelay = `${delay}s`;
            
            container.appendChild(star);
        }
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

    createPopEffect(bubble) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(bubble.x, bubble.y, bubble.color));
        }
    }

    resizeCanvas() {
        const container = document.querySelector('.game-container');
        const rect = container.getBoundingClientRect();
        
        // Set canvas size to match container
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Ensure stars are visible on mobile
        const stars = document.querySelector('.stars');
        if (stars) {
            stars.style.zIndex = '0';
            this.canvas.style.zIndex = '1';
        }
        
        // Clear and redraw
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.bubbles.forEach(bubble => bubble.draw(this.ctx));
        }
    }

    startGame() {
        this.isPlaying = true;
        this.isPaused = false;
        this.score = 0;
        this.scoreElement.textContent = '0';
        this.bubbles = [];
        this.particles = [];
        this.lastFrameTime = 0;
        this.gameStartTime = Date.now();
        this.lastBubbleIncreaseTime = this.gameStartTime;
        
        // Reset bubble counts
        Object.keys(this.modes).forEach(mode => {
            this.modes[mode].maxBubbles = this.modes[mode].baseMaxBubbles;
        });
        this.config.bubble.maxBubbles = this.modes[this.currentMode].maxBubbles;
        
        // Show/hide appropriate buttons
        if (this.startButton) this.startButton.style.display = 'none';
        if (this.pauseButton) {
            this.pauseButton.style.display = 'block';
            this.pauseButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            this.pauseButton.textContent = 'Pause';
        }
        if (this.gameOverlay) this.gameOverlay.style.display = 'none';
        
        // Start animation
        this.animate(performance.now());
    }

    togglePause() {
        if (!this.isPlaying) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.pauseButton) {
            this.pauseButton.classList.toggle('paused', this.isPaused);
            this.pauseButton.style.backgroundColor = this.isPaused ? 'rgba(0, 255, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)';
        }
        
        if (this.gameOverlay) {
            this.gameOverlay.style.display = this.isPaused ? 'flex' : 'none';
        }
        
        if (!this.isPaused) {
            this.lastFrameTime = 0;
            this.animate(performance.now());
        }
    }

    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEEAD', '#FFD93D', '#FF9999', '#9B59B6'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Initialize game
const game = new Game(); 