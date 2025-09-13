// Simple GIF player for canvas
class GifPlayer {
    constructor(canvas, gifUrl) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gifUrl = gifUrl;
        this.frames = [];
        this.currentFrame = 0;
        this.isPlaying = false;
        this.frameDelay = 100; // Default delay between frames
        this.lastFrameTime = 0;
        
        this.loadGif();
    }
    
    async loadGif() {
        try {
            // Create an image element to load the GIF
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // For now, we'll simulate frame extraction by creating multiple copies
                // This is a simplified approach - real GIF parsing would be more complex
                this.frames = [img]; // Just use the static image for now
                this.isPlaying = true;
                this.animate();
            };
            
            img.src = this.gifUrl;
        } catch (error) {
            console.error('Failed to load GIF:', error);
        }
    }
    
    animate() {
        if (!this.isPlaying) return;
        
        const now = Date.now();
        if (now - this.lastFrameTime >= this.frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
            this.lastFrameTime = now;
        }
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawFrame(x, y, width, height) {
        if (this.frames.length > 0) {
            this.ctx.drawImage(this.frames[this.currentFrame], x, y, width, height);
        }
    }
}
