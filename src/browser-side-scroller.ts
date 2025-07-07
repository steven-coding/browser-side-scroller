import { Level } from './level';
import { GameOverMessage } from './game-over-message';
import { getAssetPath } from './utils';

export class BrowserSideScroller {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameRunning: boolean = false;
    private lastTime: number = 0;
    private keys: { [key: string]: boolean } = {};
    private playerSprite: HTMLImageElement;
    private level: Level;
    private cameraX: number = 0;
    private gameSpeed: number = 2;
    private playerSpritePath: string = '/sprites/sonic-player.svg';
    private gameOverMessage: GameOverMessage;
    private player: {
        x: number;
        y: number;
        width: number;
        height: number;
        color: string;
        velocityY: number;
        isJumping: boolean;
        jumpPower: number;
        gravity: number;
    };

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        this.setupCanvas();
        
        this.player = {
            x: 50,
            y: this.canvas.height - 130,
            width: 80,
            height: 80,
            color: '#00ff00',
            velocityY: 0,
            isJumping: false,
            jumpPower: 21.2,
            gravity: 0.25
        };

        this.playerSprite = new Image();
        this.loadPlayerSprite();

        this.level = new Level(this.canvas.height);
        this.gameOverMessage = new GameOverMessage();
        this.setupEventListeners();
    }

    private loadPlayerSprite(spritePath?: string): void {
        if (spritePath) {
            this.playerSpritePath = spritePath;
        }
        this.playerSprite.src = getAssetPath(this.playerSpritePath);
    }

    public setPlayerSprite(spritePath: string): void {
        this.loadPlayerSprite(spritePath);
    }

    private setupCanvas(): void {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    private resizeCanvas(): void {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Update player position relative to new canvas height
        if (this.player) {
            this.player.y = this.canvas.height - 130;
        }
        
        // Recreate level with new canvas height
        if (this.level) {
            this.level = new Level(this.canvas.height);
        }
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', (e) => {
            console.log('Key pressed:', e.key, 'Game running:', this.gameRunning);
            this.keys[e.key] = true;
            
            // Restart game on Enter when game is over
            if (e.key === 'Enter' && !this.gameRunning) {
                console.log('Attempting to restart game...');
                this.restartGame();
                e.preventDefault();
                return;
            }
            
            // Prevent scrolling on space bar and arrow keys
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            e.preventDefault();
        });
    }

    private gameLoop = (): void => {
        if (!this.gameRunning) return;

        this.update();
        this.render();

        requestAnimationFrame(this.gameLoop);
    }

    private update(): void {

        // Jump
        if (this.keys[' '] && !this.player.isJumping) {
            this.player.velocityY = -this.player.jumpPower;
            this.player.isJumping = true;
        }

        // Apply gravity
        this.player.velocityY += this.player.gravity;
        this.player.y += this.player.velocityY;

        // Ground collision
        const groundY = this.canvas.height - 50;
        if (this.player.y + this.player.height >= groundY) {
            this.player.y = groundY - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }

        // Move camera (side-scrolling)
        this.cameraX += this.gameSpeed;
        
        // Check collision with obstacles
        const playerWorldX = this.player.x + this.cameraX;
        if (this.level.checkCollision(playerWorldX, this.player.y, this.player.width, this.player.height)) {
            this.gameRunning = false;
            this.gameOverMessage.reset();
            console.log('Game Over! Hit an obstacle.');
        }
    }

    private render(): void {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw level (background, ground, obstacles)
        this.level.render(this.ctx, this.cameraX);

        // Draw player sprite (always at fixed position on screen)
        if (this.playerSprite.complete) {
            this.ctx.drawImage(
                this.playerSprite,
                this.player.x,
                this.player.y,
                this.player.width,
                this.player.height
            );
        } else {
            // Fallback rectangle while sprite loads
            this.ctx.fillStyle = this.player.color;
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }

        // Draw UI
        if (this.gameRunning) {
            this.ctx.fillStyle = '#000';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Press SPACE to jump', 10, 30);
            this.ctx.fillText(`Distance: ${Math.floor(this.cameraX / 10)}m`, 10, 50);
        } else {
            // Draw game over screen with animations
            const distance = this.cameraX;
            const deltaTime = Date.now() - this.lastTime;
            this.gameOverMessage.render(this.ctx, this.canvas.width, this.canvas.height, distance, deltaTime);
        }
    }

    public run(): void {
        console.log('Starting browser side scroller...');
        this.gameRunning = true;
        requestAnimationFrame(this.gameLoop);
    }

    public stop(): void {
        this.gameRunning = false;
    }

    private restartGame(): void {
        console.log('Restarting game...');
        
        // Reset player position and state
        this.player.x = 50;
        this.player.y = this.canvas.height - 130;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        
        // Reset camera and game state
        this.cameraX = 0;
        this.gameRunning = true;
        
        // Reset level and game over message
        this.level = new Level(this.canvas.height);
        this.gameOverMessage.reset();
        
        // Clear any held keys
        this.keys = {};
        
        // Restart the game loop
        requestAnimationFrame(this.gameLoop);
        
        console.log('Game restarted successfully!');
    }
}