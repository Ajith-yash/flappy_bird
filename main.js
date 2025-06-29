// main.js
// Game elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const currentScoreDisplay = document.querySelector('.current-score');
const gameOverScore = gameOverScreen.querySelector('.score-display');
const highScoreDisplay = gameOverScreen.querySelector('.high-score');

// Set canvas size
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
let frames = 0;

// Bird properties
const bird = {
    x: 50,
    y: canvas.height / 2 - 10,
    width: 34,
    height: 24,
    gravity: 0.5,
    velocity: 0,
    jump: -10,
    
    draw: function() {
        // Draw bird body
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw wing
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eye
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw beak
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y);
        ctx.lineTo(this.x + 30, this.y);
        ctx.lineTo(this.x + 15, this.y + 5);
        ctx.fill();
    },
    
    update: function() {
        // Ground collision
        if (this.y > canvas.height - this.height - ground.height) {
            this.y = canvas.height - this.height - ground.height;
            if (gameRunning) gameOver();
        }
        
        // Ceiling collision
        if (this.y < 0 + this.height) {
            this.y = 0 + this.height;
            this.velocity = 0;
        }
        
        // Apply gravity
        this.velocity += this.gravity;
        this.y += this.velocity;
    },
    
    flap: function() {
        this.velocity = this.jump;
    },
    
    reset: function() {
        this.y = canvas.height / 2 - 10;
        this.velocity = 0;
    }
};

// Ground
const ground = {
    height: 80,
    draw: function() {
        // Draw ground
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, canvas.height - this.height, canvas.width, this.height);
        
        // Draw grass
        ctx.fillStyle = '#7CFC00';
        ctx.fillRect(0, canvas.height - this.height, canvas.width, 10);
    }
};

// Pipes
const pipes = {
    position: [],
    gap: 180,
    maxYPos: -150,
    width: 60,
    
    draw: function() {
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            
            // Draw top pipe
            ctx.fillStyle = '#32CD32';
            ctx.fillRect(p.x, p.y, this.width, p.height);
            
            // Pipe cap
            ctx.fillStyle = '#228B22';
            ctx.fillRect(p.x - 5, p.y + p.height - 20, this.width + 10, 20);
            
            // Draw bottom pipe
            const bottomPipeY = p.y + p.height + this.gap;
            ctx.fillStyle = '#32CD32';
            ctx.fillRect(p.x, bottomPipeY, this.width, canvas.height - bottomPipeY - ground.height);
            
            // Pipe cap
            ctx.fillStyle = '#228B22';
            ctx.fillRect(p.x - 5, bottomPipeY, this.width + 10, 20);
        }
    },
    
    update: function() {
        // Generate new pipes
        if (frames % 100 === 0) {
            this.position.push({
                x: canvas.width,
                y: this.maxYPos * (Math.random() + 1),
                height: 200 + Math.random() * 100
            });
        }
        
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= 2;
            
            // Remove off-screen pipes and update score
            if (p.x + this.width <= 0) {
                this.position.shift();
                score++;
                currentScoreDisplay.textContent = score;
            }
            
            // Collision detection with top pipe
            if (
                bird.x + bird.width > p.x && 
                bird.x < p.x + this.width && 
                bird.y < p.y + p.height
            ) {
                gameOver();
            }
            
            // Collision detection with bottom pipe
            if (
                bird.x + bird.width > p.x && 
                bird.x < p.x + this.width && 
                bird.y + bird.height > p.y + p.height + this.gap
            ) {
                gameOver();
            }
        }
    },
    
    reset: function() {
        this.position = [];
    }
};

// Background elements
const background = {
    clouds: [],
    
    init: function() {
        // Create initial clouds
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * 200,
                width: 60 + Math.random() * 40,
                speed: 0.5 + Math.random()
            });
        }
    },
    
    draw: function() {
        // Draw sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#87CEEB");
        gradient.addColorStop(1, "#E0F7FA");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw sun
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(canvas.width - 60, 60, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let cloud of this.clouds) {
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.width/4, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width/4, cloud.y - cloud.width/8, cloud.width/3, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width/2, cloud.y, cloud.width/4, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    update: function() {
        // Update cloud positions
        for (let cloud of this.clouds) {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = canvas.width + cloud.width;
                cloud.y = Math.random() * 200;
            }
        }
    }
};

// Game functions
function startGame() {
    gameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    score = 0;
    currentScoreDisplay.textContent = score;
    bird.reset();
    pipes.reset();
    frames = 0;
    gameLoop();
}

function gameOver() {
    gameRunning = false;
    gameOverScreen.classList.remove('hidden');
    gameOverScore.textContent = score;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
    }
    
    highScoreDisplay.textContent = `High Score: ${highScore}`;
}

function draw() {
    // Draw all game elements
    background.draw();
    pipes.draw();
    ground.draw();
    bird.draw();
    
    // Draw current score on canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = '30px Arial';
    ctx.fillText(score, canvas.width / 2 - 15, 50);
}

function update() {
    // Update game state
    bird.update();
    pipes.update();
    background.update();
}

function gameLoop() {
    // Main game loop
    update();
    draw();
    frames++;
    
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && gameRunning) {
        bird.flap();
    } else if (e.key === 'r' && !gameRunning && !gameOverScreen.classList.contains('hidden')) {
        startGame();
    } else if (e.key === 'ArrowUp' && gameRunning) {
        bird.flap();
    }
});

canvas.addEventListener('click', function() {
    if (gameRunning) {
        bird.flap();
    }
});

// Initialize the game
background.init();
draw();