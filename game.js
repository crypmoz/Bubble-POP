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
        this.speed = 1;
        this.points = 1;
        
        // Random chance for negative bubble
        if (Math.random() < 0.1) {
            this.points = -5;
            this.color = '#FF0000';
        }
    }

    update() {
        this.y -= this.speed;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Create gradient for 3D effect
        const gradient = ctx.createRadialGradient(
            this.x - this.radius * 0.3,
            this.y - this.radius * 0.3,
            0,
            this.x,
            this.y,
            this.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, this.color);
        
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    isClicked(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
        return distance <= this.radius * 1.2;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.bubbles = [];
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        this.isPaused = false;
        this.isPlaying = false;
        this.lastFrameTime = 0;
        this.bubbleColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FFD93D'];
        
        this.BUBBLE_INCREASE_INTERVAL = 10000; // 10 seconds
        this.lastBubbleIncrease = 0;
        this.bubbleCount = 5;
        
        this.resizeCanvas();
        this.setupEventListeners();
        this.initializeStars();
        this.initializeButtons();
    }

    initializeButtons() {
        const zenButton = document.getElementById('zenMode');
        const fastButton = document.getElementById('fastMode');
        const pauseButton = document.getElementById('pauseButton');

        zenButton.classList.add('active');
        pauseButton.style.display = 'none';

        zenButton.addEventListener('click', () => this.setGameMode('zen'));
        fastButton.addEventListener('click', () => this.setGameMode('fast'));
        pauseButton.addEventListener('click', () => this.togglePause());
    }

    setGameMode(mode) {
        this.isZenMode = mode === 'zen';
        document.querySelectorAll('.mode-selector button').forEach(button => {
            button.classList.remove('active');
            if ((button.id === 'zenMode' && mode === 'zen') ||
                (button.id === 'fastMode' && mode === 'fast')) {
                button.classList.add('active');
            }
        });

        if (!this.isPlaying) {
            this.startGame();
        }
    }

    startGame() {
        this.isPlaying = true;
        this.isPaused = false;
        this.score = 0;
        this.bubbles = [];
        this.updateScore();
        this.bubbleCount = 5;
        document.getElementById('pauseButton').style.display = 'flex';
        requestAnimationFrame(this.animate.bind(this));
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
        
        return new Bubble(x, y, radius, color);
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