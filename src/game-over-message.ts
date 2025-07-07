import { getAssetPath } from './utils';

export class GameOverMessage {
    private cupSprite: HTMLImageElement;
    private animationTime: number = 0;
    private fadeInDuration: number = 500; // ms
    private cupBounce: number = 0;

    constructor() {
        this.cupSprite = new Image();
        this.cupSprite.src = getAssetPath('/sprites/winners-cup.svg');
    }

    public render(
        ctx: CanvasRenderingContext2D, 
        canvasWidth: number, 
        canvasHeight: number, 
        distance: number,
        deltaTime: number
    ): void {
        this.animationTime += deltaTime;
        
        // Calculate fade-in opacity
        const opacity = Math.min(1, this.animationTime / this.fadeInDuration);
        
        // Create overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * opacity})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        if (opacity < 0.1) return; // Don't render content until fade starts
        
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        // Cup bounce animation
        this.cupBounce = Math.sin(this.animationTime * 0.003) * 5;
        
        // Draw winner's cup
        if (this.cupSprite.complete) {
            const cupSize = 80;
            const cupY = centerY - 120 + this.cupBounce;
            
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.drawImage(
                this.cupSprite,
                centerX - cupSize / 2,
                cupY,
                cupSize,
                cupSize * (4/3) // Maintain aspect ratio (80x106)
            );
            ctx.restore();
        }
        
        // Set text style with opacity
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        
        // Game Over title
        ctx.font = 'bold 48px Arial';
        ctx.fillText('GAME OVER', centerX, centerY + 20);
        
        // Distance achieved
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Distance Reached:', centerX, centerY + 60);
        
        // Distance value with highlight
        ctx.fillStyle = '#00FF88';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(`${Math.floor(distance / 10)}m`, centerX, centerY + 100);
        
        // Achievement message
        ctx.fillStyle = '#FFDD44';
        ctx.font = '18px Arial';
        const achievement = this.getAchievementMessage(distance);
        ctx.fillText(achievement, centerX, centerY + 140);
        
        // Restart instruction with pulsing effect
        const pulseAlpha = 0.7 + 0.3 * Math.sin(this.animationTime * 0.005);
        ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Press ENTER to restart', centerX, centerY + 180);
        
        // Decorative elements
        this.drawStars(ctx, centerX, centerY, opacity);
        
        ctx.restore();
    }
    
    private getAchievementMessage(distance: number): string {
        const meters = Math.floor(distance / 10);
        
        if (meters < 50) return "Keep practicing!";
        if (meters < 100) return "Getting warmed up!";
        if (meters < 200) return "Nice run!";
        if (meters < 300) return "Great distance!";
        if (meters < 500) return "Excellent performance!";
        if (meters < 750) return "Outstanding run!";
        if (meters < 1000) return "Amazing achievement!";
        if (meters < 1500) return "Legendary distance!";
        return "SONIC SPEED MASTER!";
    }
    
    private drawStars(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, opacity: number): void {
        ctx.save();
        ctx.globalAlpha = opacity * 0.6;
        ctx.fillStyle = '#FFD700';
        
        const stars = [
            { x: centerX - 150, y: centerY - 80, size: 3 },
            { x: centerX + 140, y: centerY - 60, size: 2 },
            { x: centerX - 180, y: centerY + 20, size: 2.5 },
            { x: centerX + 170, y: centerY + 40, size: 3 },
            { x: centerX - 120, y: centerY + 100, size: 2 },
            { x: centerX + 130, y: centerY + 120, size: 2.5 }
        ];
        
        stars.forEach((star, index) => {
            const twinkle = Math.sin(this.animationTime * 0.004 + index) * 0.5 + 0.5;
            const currentSize = star.size * (0.7 + 0.3 * twinkle);
            
            this.drawStar(ctx, star.x, star.y, currentSize);
        });
        
        ctx.restore();
    }
    
    private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5;
            const x1 = x + Math.cos(angle) * size;
            const y1 = y + Math.sin(angle) * size;
            
            if (i === 0) {
                ctx.moveTo(x1, y1);
            } else {
                ctx.lineTo(x1, y1);
            }
        }
        ctx.closePath();
        ctx.fill();
    }
    
    public reset(): void {
        this.animationTime = 0;
        this.cupBounce = 0;
    }
}