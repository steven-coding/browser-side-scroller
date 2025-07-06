import { Level } from './level';

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
            y: this.canvas.height - 90,
            width: 40,
            height: 40,
            color: '#00ff00',
            velocityY: 0,
            isJumping: false,
            jumpPower: 10.6,
            gravity: 0.2
        };

        this.playerSprite = new Image();
        this.loadPlayerSprite();

        this.level = new Level(this.canvas.height);
        this.setupEventListeners();
    }

    private loadPlayerSprite(spritePath?: string): void {
        if (spritePath) {
            this.playerSpritePath = spritePath;
        }
        this.playerSprite.src = this.playerSpritePath;
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
            this.player.y = this.canvas.height - 90;
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

    private gameLoop = (currentTime: number): void => {
        if (!this.gameRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop);
    }

    private update(deltaTime: number): void {
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
        this.ctx.fillStyle = '#000';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Press SPACE to jump', 10, 30);
        this.ctx.fillText(`Distance: ${Math.floor(this.cameraX / 10)}m`, 10, 50);
        
        if (!this.gameRunning) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('Press ENTER to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.textAlign = 'left';
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
        this.player.y = this.canvas.height - 90;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        
        // Reset camera and game state
        this.cameraX = 0;
        this.gameRunning = true;
        
        // Reset level
        this.level = new Level(this.canvas.height);
        
        // Clear any held keys
        this.keys = {};
        
        // Restart the game loop
        requestAnimationFrame(this.gameLoop);
        
        console.log('Game restarted successfully!');
    }
}