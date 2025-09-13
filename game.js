class CapyDinoGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameOverScreen = document.getElementById('game-over');
        this.startScreen = document.getElementById('start-screen');
        this.currentScoreElement = document.getElementById('current-score');
        this.hiScoreElement = document.getElementById('hi-score');
        this.restartBtn = document.getElementById('restart-btn');

        // Create visible GIF element positioned over canvas
        this.gifImg = document.createElement('img');
        this.gifImg.src = './capybara.gif';
        this.gifImg.style.position = 'absolute';
        this.gifImg.style.width = '44px';
        this.gifImg.style.height = '47px';
        this.gifImg.style.zIndex = '10';
        this.gifImg.style.pointerEvents = 'none';
        this.gifImg.crossOrigin = 'anonymous';
        document.body.appendChild(this.gifImg);
        this.imageLoaded = false;
        
        this.gifImg.onload = () => {
            this.imageLoaded = true;
            console.log('GIF loaded and animating!');
        };
        
        this.gifImg.onerror = () => {
            console.error('Failed to load GIF file - falling back to placeholder');
            this.imageLoaded = false;
        };

        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.gameSpeed = 1.5; // Slower starting speed
        this.gravity = 0.08; // Reduced gravity for slower falling
        this.score = 0;
        this.hiScore = localStorage.getItem('capyDinoHiScore') || 0;
        this.lastSpeedIncreaseScore = 0; // Track when speed was last increased
        
        // Player (Capybara)
        this.player = {
            x: 25,
            y: 0,
            width: 44,
            height: 47,
            // Smaller hitbox for more realistic collision
            hitboxWidth: 35,
            hitboxHeight: 40,
            hitboxOffsetX: 5,
            hitboxOffsetY: 4,
            dy: 0,
            jumpPower: 4.25, // Reduced jump height by half
            grounded: false,
            ducking: false,
            color: '#8B4513' // Placeholder color for capybara
        };

        // Ground
        this.groundHeight = 30;
        this.groundY = this.canvas.height - this.groundHeight;
        this.player.y = this.groundY - this.player.height + 5; // Adjust to touch ground properly

        // Obstacles
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.obstacleInterval = 200; // frames between obstacles - increased spacing
        this.minObstacleInterval = 180; // minimum distance much farther
        this.maxObstacleInterval = 350; // maximum distance for variety

        // Clouds
        this.clouds = [];
        this.cloudTimer = 0;

        // Ground elements
        this.groundElements = [];

        // Animation frame
        this.animationId = null;

        this.init();
    }

    init() {
        this.updateScore();
        this.hiScoreElement.textContent = this.formatScore(this.hiScore);
        this.setupEventListeners();
        this.generateInitialClouds();
        this.generateInitialGroundElements();
        this.gameLoop();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.handleJump();
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                this.handleDuck(true);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowDown') {
                e.preventDefault();
                this.handleDuck(false);
            }
        });

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleJump();
        });

        // Mobile touch controls
        const jumpBtn = document.getElementById('jump-btn');
        const duckBtn = document.getElementById('duck-btn');
        
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleJump();
            });
            jumpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleJump();
            });
        }
        
        if (duckBtn) {
            duckBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleDuck(true);
            });
            duckBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleDuck(false);
            });
            duckBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleDuck(true);
            });
            duckBtn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.handleDuck(false);
            });
        }

        // Restart button
        this.restartBtn.addEventListener('click', () => {
            this.restart();
        });

        // Buy Capy button
        const buyCapyBtn = document.getElementById('buy-capy-btn');
        if (buyCapyBtn) {
            buyCapyBtn.addEventListener('click', () => {
                window.open('https://dexscreener.com/solana/9grdkuzggltsapbdcmsfbpqgzb3ip4zisdaiqeew9d3r', '_blank');
            });
        }
    }

    handleJump() {
        if (this.gameState === 'start') {
            this.startGame();
        } else if (this.gameState === 'playing' && this.player.grounded && !this.player.ducking) {
            this.player.dy = -this.player.jumpPower;
            this.player.grounded = false;
        } else if (this.gameState === 'gameOver') {
            this.restart();
        }
    }

    handleDuck(isDucking) {
        if (this.gameState === 'playing' && this.player.grounded) {
            this.player.ducking = isDucking;
            if (isDucking) {
                this.player.height = 26;
                this.player.y = this.groundY - this.player.height + 5;
            } else {
                this.player.height = 47;
                this.player.y = this.groundY - this.player.height + 5;
            }
        }
    }

    startGame() {
        this.gameState = 'playing';
        this.startScreen.style.display = 'none';
    }

    restart() {
        this.gameState = 'playing';
        this.gameOverScreen.style.display = 'none';
        this.score = 0;
        this.gameSpeed = 1.5; // Reset to slower starting speed
        this.lastSpeedIncreaseScore = 0; // Reset speed increase tracker
        this.obstacles = [];
        this.obstacleTimer = 0;
        this.player.y = this.groundY - this.player.height + 5;
        this.player.dy = 0;
        this.player.grounded = true;
        this.updateScore();
    }

    update() {
        if (this.gameState !== 'playing') return;

        // Update score
        this.score += 0.025;
        const currentHundreds = Math.floor(this.score / 100);
        const lastHundreds = Math.floor(this.lastSpeedIncreaseScore / 100);
        
        if (currentHundreds > lastHundreds && this.score > 0) {
            this.gameSpeed *= 1.05; // Increase speed by 5% every 100 points
            this.lastSpeedIncreaseScore = this.score;
        }
        this.updateScore();

        // Update player physics
        this.updatePlayer();

        // Update obstacles
        this.updateObstacles();

        // Update clouds
        this.updateClouds();

        // Update ground elements
        this.updateGroundElements();

        // Check collisions
        this.checkCollisions();
    }

    updatePlayer() {
        // Apply gravity
        this.player.dy += this.gravity;
        this.player.y += this.player.dy;

        // Ground collision
        if (this.player.y >= this.groundY - this.player.height + 5) {
            this.player.y = this.groundY - this.player.height + 5;
            this.player.dy = 0;
            this.player.grounded = true;
        }
    }

    updateObstacles() {
        // Generate new obstacles
        this.obstacleTimer++;
        if (this.obstacleTimer >= this.obstacleInterval) {
            this.generateObstacle();
            this.obstacleTimer = 0;
            // Randomize next obstacle timing
            this.obstacleInterval = this.minObstacleInterval + Math.random() * (this.maxObstacleInterval - this.minObstacleInterval);
        }

        // Move and remove obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.gameSpeed;

            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
    }

    generateObstacle() {
        const types = ['cactus_small', 'cactus_large', 'cactus_group', 'bird'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let obstacle = {
            type: type,
            x: this.canvas.width,
            color: '#228B22'
        };

        if (type === 'cactus_small') {
            obstacle.width = 17;
            obstacle.height = 35;
            obstacle.y = this.groundY - obstacle.height;
        } else if (type === 'cactus_large') {
            obstacle.width = 25;
            obstacle.height = 50;
            obstacle.y = this.groundY - obstacle.height;
        } else if (type === 'cactus_group') {
            obstacle.width = 40;
            obstacle.height = 35;
            obstacle.y = this.groundY - obstacle.height;
        } else if (type === 'bird') {
            obstacle.width = 46;
            obstacle.height = 40;
            // Birds fly at different heights
            const heights = [75, 95, 115];
            obstacle.y = this.groundY - heights[Math.floor(Math.random() * heights.length)];
        }

        this.obstacles.push(obstacle);
    }

    updateClouds() {
        this.cloudTimer++;
        if (this.cloudTimer >= 200) {
            this.generateCloud();
            this.cloudTimer = 0;
        }

        // Move clouds
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            cloud.x -= this.gameSpeed * 0.2;

            if (cloud.x + cloud.width < 0) {
                this.clouds.splice(i, 1);
            }
        }
    }

    generateCloud() {
        this.clouds.push({
            x: this.canvas.width,
            y: 20 + Math.random() * 40,
            width: 40 + Math.random() * 20,
            height: 20
        });
    }

    generateInitialClouds() {
        for (let i = 0; i < 3; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: 20 + Math.random() * 40,
                width: 40 + Math.random() * 20,
                height: 20
            });
        }
    }

    updateGroundElements() {
        // Move ground elements
        for (let i = this.groundElements.length - 1; i >= 0; i--) {
            const element = this.groundElements[i];
            element.x -= this.gameSpeed;

            if (element.x + element.width < 0) {
                this.groundElements.splice(i, 1);
            }
        }

        // Generate new ground elements
        if (Math.random() < 0.02) {
            this.groundElements.push({
                x: this.canvas.width,
                y: this.groundY - 5,
                width: 10 + Math.random() * 10,
                height: 5
            });
        }
    }

    generateInitialGroundElements() {
        for (let i = 0; i < 5; i++) {
            this.groundElements.push({
                x: Math.random() * this.canvas.width,
                y: this.groundY - 5,
                width: 10 + Math.random() * 10,
                height: 5
            });
        }
    }

    checkCollisions() {
        for (const obstacle of this.obstacles) {
            if (this.isColliding(this.player, obstacle)) {
                this.gameOver();
                break;
            }
        }
    }

    isColliding(rect1, rect2) {
        // Use smaller hitbox for more realistic collision
        const hitboxX = rect1.x + rect1.hitboxOffsetX;
        const hitboxY = rect1.y + rect1.hitboxOffsetY;
        const hitboxWidth = rect1.hitboxWidth;
        const hitboxHeight = rect1.hitboxHeight;
        
        return hitboxX < rect2.x + rect2.width &&
               hitboxX + hitboxWidth > rect2.x &&
               hitboxY < rect2.y + rect2.height &&
               hitboxY + hitboxHeight > rect2.y;
    }

    gameOver() {
        this.gameState = 'gameOver';
        
        // Update high score
        if (Math.floor(this.score) > this.hiScore) {
            this.hiScore = Math.floor(this.score);
            localStorage.setItem('capyDinoHiScore', this.hiScore);
            this.hiScoreElement.textContent = this.formatScore(this.hiScore);
        }

        this.gameOverScreen.style.display = 'block';
    }

    render() {
        // Clear canvas with blue sky background
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sun
        this.drawSun();

        // Draw clouds
        this.ctx.fillStyle = '#FFFFFF';
        for (const cloud of this.clouds) {
            this.drawCloud(cloud.x, cloud.y, cloud.width, cloud.height);
        }

        // Draw green grass ground
        this.ctx.fillStyle = '#32CD32';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.groundHeight);

        // Draw grass texture
        this.drawGrassTexture();

        // Draw ground line
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.stroke();

        // Draw ground elements as small grass patches
        this.ctx.fillStyle = '#228B22';
        for (const element of this.groundElements) {
            this.drawGrassPatch(element.x, element.y, element.width, element.height);
        }

        // Position the animated GIF element over the canvas
        this.updateGifPosition();
    }

    updateGifPosition() {
        if (this.gifImg && this.imageLoaded) {
            const canvasRect = this.canvas.getBoundingClientRect();
            const scale = canvasRect.width / this.canvas.width;
            
            // Scale the GIF size and position for mobile
            const scaledWidth = this.player.width * scale;
            const scaledHeight = this.player.height * scale;
            
            this.gifImg.style.width = scaledWidth + 'px';
            this.gifImg.style.height = scaledHeight + 'px';
            this.gifImg.style.left = (canvasRect.left + (this.player.x * scale)) + 'px';
            this.gifImg.style.top = (canvasRect.top + ((this.canvas.height - this.player.y - this.player.height) * scale)) + 'px';
            this.gifImg.style.display = 'block';
        } else {
            // Fallback to rectangle if image not loaded
            this.ctx.fillStyle = this.player.color;
            if (this.player.ducking) {
                this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(this.player.x + 25, this.player.y + 5, 3, 3);
                this.ctx.fillRect(this.player.x + 30, this.player.y + 5, 3, 3);
            } else {
                this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(this.player.x + 25, this.player.y + 8, 3, 3);
                this.ctx.fillRect(this.player.x + 30, this.player.y + 8, 3, 3);
            }
        }

        // Draw obstacles
        for (const obstacle of this.obstacles) {
            this.ctx.fillStyle = obstacle.color;
            if (obstacle.type.includes('cactus')) {
                this.drawCactus(obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.type);
            } else if (obstacle.type === 'bird') {
                this.drawBird(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        }
    }

    drawSun() {
        // Draw sun in upper right corner
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 80, 60, 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw sun rays
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const startX = this.canvas.width - 80 + Math.cos(angle) * 35;
            const startY = 60 + Math.sin(angle) * 35;
            const endX = this.canvas.width - 80 + Math.cos(angle) * 45;
            const endY = 60 + Math.sin(angle) * 45;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }

    drawCloud(x, y, width, height) {
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.2, y + height * 0.5, height * 0.3, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.4, y + height * 0.3, height * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.6, y + height * 0.3, height * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + width * 0.8, y + height * 0.5, height * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawGrassTexture() {
        // Draw grass blades across the ground
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.canvas.width; x += 8) {
            for (let i = 0; i < 3; i++) {
                const grassX = x + Math.random() * 6;
                const grassHeight = 3 + Math.random() * 4;
                
                this.ctx.beginPath();
                this.ctx.moveTo(grassX, this.groundY);
                this.ctx.lineTo(grassX + Math.random() * 2 - 1, this.groundY - grassHeight);
                this.ctx.stroke();
            }
        }
    }

    drawGrassPatch(x, y, width, height) {
        // Draw small grass patches instead of rectangles
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < width / 2; i++) {
            const grassX = x + i * 2 + Math.random() * 2;
            const grassHeight = height + Math.random() * 3;
            
            this.ctx.beginPath();
            this.ctx.moveTo(grassX, y + height);
            this.ctx.lineTo(grassX + Math.random() * 2 - 1, y + height - grassHeight);
            this.ctx.stroke();
        }
    }

    drawCactus(x, y, width, height, type) {
        if (type === 'cactus_small') {
            // Small single cactus
            this.ctx.fillRect(x + width * 0.3, y, width * 0.4, height);
        } else if (type === 'cactus_large') {
            // Large single cactus with arms
            this.ctx.fillRect(x + width * 0.3, y, width * 0.4, height);
            // Left arm
            this.ctx.fillRect(x, y + height * 0.3, width * 0.5, width * 0.2);
            this.ctx.fillRect(x, y + height * 0.3, width * 0.15, height * 0.4);
            // Right arm
            this.ctx.fillRect(x + width * 0.5, y + height * 0.5, width * 0.5, width * 0.2);
            this.ctx.fillRect(x + width * 0.85, y + height * 0.5, width * 0.15, height * 0.3);
        } else if (type === 'cactus_group') {
            // Group of small cacti
            this.ctx.fillRect(x + width * 0.1, y, width * 0.2, height);
            this.ctx.fillRect(x + width * 0.4, y + height * 0.2, width * 0.2, height * 0.8);
            this.ctx.fillRect(x + width * 0.7, y + height * 0.1, width * 0.2, height * 0.9);
        }
    }

    drawBird(x, y, width, height) {
        // Simple bird shape
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width * 0.5, y + height * 0.5, width * 0.4, height * 0.3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Wings
        this.ctx.beginPath();
        this.ctx.ellipse(x + width * 0.3, y + height * 0.4, width * 0.2, height * 0.2, -0.5, 0, Math.PI * 2);
        this.ctx.ellipse(x + width * 0.7, y + height * 0.4, width * 0.2, height * 0.2, 0.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    updateScore() {
        this.currentScoreElement.textContent = this.formatScore(Math.floor(this.score));
    }

    formatScore(score) {
        return score.toString().padStart(5, '0');
    }

    gameLoop() {
        this.update();
        this.render();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new CapyDinoGame();
});
