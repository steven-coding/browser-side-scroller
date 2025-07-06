interface Obstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    sprite: HTMLImageElement;
    type: string;
}

interface ThemeConfig {
    name: string;
    spritePath: string;
    background: {
        skyGradient: { top: string; bottom: string };
        mountains: {
            color: string;
            parallaxSpeed: number;
            points: Array<{ x: number; y: number }>;
        };
    };
    ground: {
        color: string;
        textureColor: string;
        height: number;
        textureSize: number;
        textureDensity: number;
    };
    obstacles: {
        types: Array<{
            name: string;
            width: number;
            height: number;
            weight: number;
        }>;
        generation: {
            count: number;
            minDistance: number;
            maxDistance: number;
            startDistance: number;
            safeZoneDistance: number;
            doubleObstacleChance: number;
            doubleObstacleSpacing: number;
        };
        fallbackColor: string;
    };
    world: {
        width: number;
    };
}

export class Level {
    private obstacles: Obstacle[] = [];
    private sprites: { [key: string]: HTMLImageElement } = {};
    private theme: ThemeConfig;
    private canvasHeight: number;
    private cameraX: number = 0;
    private lastObstacleX: number = 0;

    constructor(canvasHeight: number, themePath: string = '/themes/desert-theme.json') {
        this.canvasHeight = canvasHeight;
        this.loadTheme(themePath);
    }

    private async loadTheme(themePath: string): Promise<void> {
        try {
            const response = await fetch(themePath);
            this.theme = await response.json();
            this.loadSprites();
            this.generateInitialObstacles();
        } catch (error) {
            console.error('Failed to load theme:', error);
            this.loadDefaultTheme();
        }
    }

    private loadDefaultTheme(): void {
        this.theme = {
            name: 'Desert',
            spritePath: 'sprites/world/desert',
            background: {
                skyGradient: { top: '#FFE4B5', bottom: '#DEB887' },
                mountains: {
                    color: '#CD853F',
                    parallaxSpeed: 0.3,
                    points: [
                        { x: 0, y: 150 },
                        { x: 200, y: 200 },
                        { x: 400, y: 180 },
                        { x: 600, y: 220 },
                        { x: 800, y: 160 },
                        { x: 1000, y: 150 }
                    ]
                }
            },
            ground: {
                color: '#F4A460',
                textureColor: '#DEB887',
                height: 50,
                textureSize: 20,
                textureDensity: 0.7
            },
            obstacles: {
                types: [
                    { name: 'cactus', width: 60, height: 120, weight: 1.0 },
                    { name: 'rock', width: 80, height: 50, weight: 1.0 },
                    { name: 'tumbleweed', width: 70, height: 70, weight: 1.0 }
                ],
                generation: {
                    count: 15,
                    minDistance: 400,
                    maxDistance: 800,
                    startDistance: 200,
                    safeZoneDistance: 1000,
                    doubleObstacleChance: 0.3,
                    doubleObstacleSpacing: 10
                },
                fallbackColor: '#8B4513'
            },
            world: { width: 2000 }
        };
        this.loadSprites();
        this.generateInitialObstacles();
    }

    private loadSprites(): void {
        if (!this.theme) return;
        
        this.theme.obstacles.types.forEach(obstacleType => {
            const img = new Image();
            img.src = `/${this.theme.spritePath}/${obstacleType.name}.svg`;
            this.sprites[obstacleType.name] = img;
        });
    }

    private generateInitialObstacles(): void {
        if (!this.theme) return;
        
        const config = this.theme.obstacles;
        let currentX = config.generation.startDistance + config.generation.safeZoneDistance;
        
        for (let i = 0; i < config.generation.count; i++) {
            currentX = this.generateObstacleAtPosition(currentX);
        }
        
        this.lastObstacleX = currentX;
    }

    private generateObstacleAtPosition(currentX: number): number {
        if (!this.theme) return currentX;
        
        const config = this.theme.obstacles;
        const obstacleType = config.types[Math.floor(Math.random() * config.types.length)];
        
        const y = this.canvasHeight - this.theme.ground.height - obstacleType.height;
        
        // Generate first obstacle
        this.obstacles.push({
            x: currentX,
            y: y,
            width: obstacleType.width,
            height: obstacleType.height,
            sprite: this.sprites[obstacleType.name],
            type: obstacleType.name
        });
        
        let nextX = currentX;
        
        // Check if we should generate a double obstacle
        if (Math.random() < config.generation.doubleObstacleChance) {
            const secondObstacleType = config.types[Math.floor(Math.random() * config.types.length)];
            const secondY = this.canvasHeight - this.theme.ground.height - secondObstacleType.height;
            
            nextX = currentX + obstacleType.width + config.generation.doubleObstacleSpacing;
            
            // Generate second obstacle close behind the first
            this.obstacles.push({
                x: nextX,
                y: secondY,
                width: secondObstacleType.width,
                height: secondObstacleType.height,
                sprite: this.sprites[secondObstacleType.name],
                type: secondObstacleType.name
            });
            
            nextX += secondObstacleType.width;
        } else {
            nextX += obstacleType.width;
        }
        
        return nextX + config.generation.minDistance + 
               Math.random() * (config.generation.maxDistance - config.generation.minDistance);
    }

    private generateNewObstacles(): void {
        if (!this.theme) return;
        
        const config = this.theme.obstacles;
        const generateAheadDistance = 1500; // Generate obstacles 1500px ahead of camera
        
        while (this.lastObstacleX < this.cameraX + generateAheadDistance) {
            this.lastObstacleX = this.generateObstacleAtPosition(this.lastObstacleX);
        }
        
        // Clean up obstacles that are far behind the camera
        const cleanupDistance = 500;
        this.obstacles = this.obstacles.filter(obstacle => 
            obstacle.x > this.cameraX - cleanupDistance
        );
    }

    public render(ctx: CanvasRenderingContext2D, cameraX: number): void {
        this.cameraX = cameraX;
        
        // Generate new obstacles as needed
        this.generateNewObstacles();
        
        // Draw desert background
        this.drawBackground(ctx);
        
        // Draw ground
        this.drawGround(ctx);
        
        // Draw obstacles
        this.drawObstacles(ctx);
    }

    private drawBackground(ctx: CanvasRenderingContext2D): void {
        if (!this.theme) return;
        
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        gradient.addColorStop(0, this.theme.background.skyGradient.top);
        gradient.addColorStop(1, this.theme.background.skyGradient.bottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, this.canvasHeight);
        
        // Mountains in background
        ctx.fillStyle = this.theme.background.mountains.color;
        ctx.beginPath();
        
        const parallaxOffset = -this.cameraX * this.theme.background.mountains.parallaxSpeed;
        const points = this.theme.background.mountains.points;
        
        ctx.moveTo(parallaxOffset + points[0].x, this.canvasHeight - points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(parallaxOffset + points[i].x, this.canvasHeight - points[i].y);
        }
        
        ctx.lineTo(ctx.canvas.width, this.canvasHeight - points[points.length - 1].y);
        ctx.lineTo(ctx.canvas.width, this.canvasHeight);
        ctx.lineTo(0, this.canvasHeight);
        ctx.closePath();
        ctx.fill();
    }

    private drawGround(ctx: CanvasRenderingContext2D): void {
        if (!this.theme) return;
        
        const ground = this.theme.ground;
        
        // Ground base
        ctx.fillStyle = ground.color;
        ctx.fillRect(0, this.canvasHeight - ground.height, ctx.canvas.width, ground.height);
        
        // Ground texture
        ctx.fillStyle = ground.textureColor;
        for (let x = 0; x < ctx.canvas.width; x += ground.textureSize) {
            for (let y = this.canvasHeight - ground.height; y < this.canvasHeight; y += 10) {
                if (Math.random() > ground.textureDensity) {
                    ctx.fillRect(x + (this.cameraX % ground.textureSize), y, 2, 2);
                }
            }
        }
    }

    private drawObstacles(ctx: CanvasRenderingContext2D): void {
        if (!this.theme) return;
        
        this.obstacles.forEach(obstacle => {
            const screenX = obstacle.x - this.cameraX;
            
            // Only draw if obstacle is visible on screen
            if (screenX > -obstacle.width && screenX < ctx.canvas.width) {
                if (obstacle.sprite && obstacle.sprite.complete) {
                    ctx.drawImage(
                        obstacle.sprite,
                        screenX,
                        obstacle.y,
                        obstacle.width,
                        obstacle.height
                    );
                } else {
                    // Fallback rectangle while sprite loads
                    ctx.fillStyle = this.theme.obstacles.fallbackColor;
                    ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
                }
            }
        });
    }

    public checkCollision(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
        for (const obstacle of this.obstacles) {
            if (playerX < obstacle.x + obstacle.width &&
                playerX + playerWidth > obstacle.x &&
                playerY < obstacle.y + obstacle.height &&
                playerY + playerHeight > obstacle.y) {
                return true;
            }
        }
        return false;
    }

    public getWorldWidth(): number {
        return this.theme ? this.theme.world.width : 2000;
    }
}