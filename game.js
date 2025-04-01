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
    constructor(x, y, radius, color, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speedX = speedX;
        this.speedY = speedY;
        this.isPopped = false;
        this.popProgress = 0;
    }

    update(deltaTime) {
        if (this.isPopped) {
            this.popProgress += deltaTime * 0.005;
            return this.popProgress >= 1;
        }

        this.x += this.speedX * deltaTime;
        this.y += this.speedY * deltaTime;

        if (this.x - this.radius < 0 || this.x + this.radius > window.innerWidth) {
            this.speedX = -this.speedX;
            this.x = Math.max(this.radius, Math.min(window.innerWidth - this.radius, this.x));
        }
        if (this.y - this.radius < 0 || this.y + this.radius > window.innerHeight) {
            this.speedY = -this.speedY;
            this.y = Math.max(this.radius, Math.min(window.innerHeight - this.radius, this.y));
        }

        return false;
    }

    draw(ctx) {
        ctx.beginPath();
        if (this.isPopped) {
            ctx.globalAlpha = 1 - this.popProgress;
            ctx.arc(this.x, this.y, this.radius * (1 + this.popProgress), 0, Math.PI * 2);
        } else {
            ctx.globalAlpha = 1;
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        }
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    contains(x, y) {
        const distance = Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
        return distance <= this.radius;
    }

    pop() {
        this.isPopped = true;
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
        this.isZenMode = true;
        this.bubbleColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];
        
        this.bubbleCount = 5;
        
        // Initialize game modes
        this.initializeGameModes();
        
        // Set up DOM elements and controls
        this.setupDOMElements();
        this.setupControls();
        this.setupEventListeners();
        
        // Initialize game environment
        this.createStarryBackground();
        this.resizeCanvas();
        
        // Set initial mode button state
        const zenButton = document.getElementById('zenMode');
        if (zenButton) {
            zenButton.classList.add('active');
        }
        
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
            zenButton.addEventListener('click', () => {
                this.setGameMode('zen');
                if (!this.isPlaying) this.startGame();
            });
            
            const fastButton = document.createElement('button');
            fastButton.textContent = 'Fast';
            fastButton.addEventListener('click', () => {
                this.setGameMode('fast');
                if (!this.isPlaying) this.startGame();
            });
            
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
        
        // Update button states
        const buttons = document.querySelectorAll('.mode-selector button');
        buttons.forEach(button => {
            const isActive = button.id === `${mode}Mode`;
            button.classList.toggle('active', isActive);
            button.style.background = isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.7)';
        });

        // Update bubble speeds
        this.bubbles.forEach(bubble => bubble.speedX = Math.cos(Math.random() * Math.PI * 2) * settings.baseSpeed);
        this.bubbles.forEach(bubble => bubble.speedY = Math.sin(Math.random() * Math.PI * 2) * settings.baseSpeed);
        
        // Start game if not playing
        if (!this.isPlaying) {
            this.startGame();
        }
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
        
        // Remove startButton reference since we're using mode buttons to start
        if (this.pauseButton) {
            this.pauseButton.addEventListener('click', () => this.togglePause());
        }
        
        // Prevent scrolling on mobile
        document.addEventListener('touchmove', (e) => {
            if (this.isPlaying) e.preventDefault();
        }, { passive: false });
    }

    createBubble() {
        const radius = Math.random() * (this.config.bubble.maxSize - this.config.bubble.minSize) + this.config.bubble.minSize;
        const x = Math.random() * (this.canvas.width - radius * 2) + radius;
        const y = this.canvas.height + radius;
        
        const speed = this.isZenMode ? 0.1 : 0.2;
        const angle = Math.random() * Math.PI * 2;
        const speedX = Math.cos(angle) * speed;
        const speedY = Math.sin(angle) * speed;
        
        const color = this.bubbleColors[Math.floor(Math.random() * this.bubbleColors.length)];
        
        return new Bubble(x, y, radius, color, speedX, speedY);
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
            bubble.update(deltaTime);
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
        
        // Show pause button
        if (this.pauseButton) {
            this.pauseButton.style.display = 'flex';
            this.pauseButton.classList.remove('paused');
        }
        
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