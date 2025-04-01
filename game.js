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
    constructor(canvas) {
        this.canvas = canvas;
        this.radius = Math.random() * 30 + 20;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        this.speed = Math.random() * 2 + 1;
        this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        
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
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        
        switch(this.type) {
            case 'special':
                ctx.fillText('⭐', this.x, this.y + 7);
                break;
            case 'bomb':
                ctx.fillText('💣', this.x, this.y + 7);
                break;
            case 'rainbow':
                ctx.fillText('🌈', this.x, this.y + 7);
                break;
        }
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
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        this.bubbles = [];
        this.particles = [];
        this.isPlaying = false;
        this.isPaused = false;
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.combo = 0;
        this.comboTimeout = null;
        this.lastPopTime = 0;
        
        // Power-ups
        this.powerUps = {
            shield: { active: false, duration: 10000, cooldown: 30000 },
            slowMotion: { active: false, duration: 8000, cooldown: 25000 },
            doublePoints: { active: false, duration: 12000, cooldown: 35000 }
        };
        
        // Load sound effects
        this.popSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 
            '...'); // Base64 encoded pop sound
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.startButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        
        // Power-up event listeners
        Object.keys(this.powerUps).forEach(powerUp => {
            document.getElementById(powerUp).addEventListener('click', () => this.activatePowerUp(powerUp));
        });
        
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
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
            this.resizeCanvas();
            // Recalculate bubble positions if game is running
            if (this.isPlaying) {
                this.bubbles.forEach(bubble => {
                    bubble.x = Math.min(bubble.x, this.canvas.width - bubble.radius);
                    bubble.y = Math.min(bubble.y, this.canvas.height - bubble.radius);
                });
            }
        });

        // Prevent default touch behaviors
        document.addEventListener('touchmove', (e) => {
            if (this.isPlaying) {
                e.preventDefault();
            }
        }, { passive: false });

        // Update high score display
        this.highScoreElement.textContent = this.highScore;
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Adjust bubble sizes based on screen size
        const baseSize = Math.min(this.canvas.width, this.canvas.height) * 0.05;
        this.bubbles.forEach(bubble => {
            bubble.radius = Math.max(baseSize, Math.min(baseSize * 2, bubble.radius));
        });
    }

    startGame() {
        this.score = 0;
        this.combo = 0;
        this.scoreElement.textContent = this.score;
        this.bubbles = [];
        this.particles = [];
        this.isPlaying = true;
        this.isPaused = false;
        this.startButton.style.display = 'none';
        this.pauseButton.style.display = 'block';
        
        // Reset power-ups
        Object.keys(this.powerUps).forEach(powerUp => {
            this.powerUps[powerUp].active = false;
            document.getElementById(powerUp).classList.remove('active');
        });
        
        // Create initial bubbles
        for (let i = 0; i < 10; i++) {
            this.bubbles.push(new Bubble(this.canvas));
        }
        
        this.gameLoop();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
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

    createParticles(x, y, color) {
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    showComboText() {
        const comboText = document.createElement('div');
        comboText.className = 'combo-text';
        comboText.textContent = `${this.combo}x Combo!`;
        document.querySelector('.game-container').appendChild(comboText);
        
        setTimeout(() => comboText.remove(), 1000);
    }

    handleClick(e) {
        if (!this.isPlaying || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.bubbles.forEach((bubble, index) => {
            if (bubble.isClicked(x, y)) {
                // Handle combo system
                const now = Date.now();
                if (now - this.lastPopTime < 1000) {
                    this.combo++;
                    if (this.combo % 5 === 0) {
                        this.showComboText();
                    }
                } else {
                    this.combo = 1;
                }
                this.lastPopTime = now;

                // Update score with combo multiplier and power-ups
                let points = bubble.points;
                if (this.powerUps.doublePoints.active) points *= 2;
                points *= (1 + this.combo * 0.1);
                this.score += points;
                this.scoreElement.textContent = Math.floor(this.score);

                // Update high score
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    this.highScoreElement.textContent = this.highScore;
                    localStorage.setItem('highScore', this.highScore);
                }

                // Create particles
                this.createParticles(x, y, bubble.color);

                // Play pop sound
                this.popSound.currentTime = 0;
                this.popSound.play().catch(() => {});

                // Remove popped bubble and add new one
                this.bubbles.splice(index, 1);
                this.bubbles.push(new Bubble(this.canvas));

                // Clear combo timeout
                if (this.comboTimeout) {
                    clearTimeout(this.comboTimeout);
                }
                this.comboTimeout = setTimeout(() => {
                    this.combo = 0;
                }, 1000);
            }
        });
    }

    gameLoop() {
        if (!this.isPlaying || this.isPaused) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.update();
            particle.draw(this.ctx);
            return particle.life > 0;
        });
        
        // Update and draw bubbles
        this.bubbles.forEach(bubble => {
            bubble.update();
            bubble.draw(this.ctx);
        });

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 