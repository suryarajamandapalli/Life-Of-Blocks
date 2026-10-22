// Adaptive Wallpaper Contrast Service for LIFE OF BLOCKS
// Dynamically samples the wallpaper pixels behind any specific UI element
// Automatically determines whether text should be dark/black or white/light.

class WallpaperContrastSampler {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.image = null;
    this.isReady = false;
    this.currentUrl = null;
    this.listeners = new Set();
  }

  // Load wallpaper into memory canvas
  loadWallpaper(url) {
    if (!url || url === this.currentUrl) return;
    this.currentUrl = url;
    this.isReady = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;

    img.onload = () => {
      // Use efficient sampling resolution (e.g. 640x360 maintains fidelity while fast)
      this.canvas.width = 640;
      this.canvas.height = Math.round(640 * (img.naturalHeight / img.naturalWidth)) || 360;
      this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      this.image = img;
      this.isReady = true;
      this.notify();
    };

    img.onerror = () => {
      // Fallback: If CORS blocks direct canvas read, try via proxy or default to dark
      this.isReady = false;
      this.notify();
    };
  }

  // Calculate perceived relative luminance at specific screen viewport rect
  getLuminanceAtRect(rect) {
    if (!this.isReady || !this.canvas || !rect) {
      return { luminance: 40, isLight: false }; // Safe default: dark background -> white text
    }

    try {
      const vpW = window.innerWidth || 1920;
      const vpH = window.innerHeight || 1080;
      const imgW = this.canvas.width;
      const imgH = this.canvas.height;

      // Calculate background-size: cover mapping
      const vpRatio = vpW / vpH;
      const imgRatio = imgW / imgH;

      let renderW, renderH, offsetX, offsetY;
      if (vpRatio > imgRatio) {
        renderW = vpW;
        renderH = vpW / imgRatio;
        offsetX = 0;
        offsetY = (vpH - renderH) / 2;
      } else {
        renderH = vpH;
        renderW = vpH * imgRatio;
        offsetX = (vpW - renderW) / 2;
        offsetY = 0;
      }

      // Map element's viewport rect into canvas coordinates
      const scaleX = imgW / renderW;
      const scaleY = imgH / renderH;

      const normLeft = rect.left - offsetX;
      const normTop = rect.top - offsetY;

      const startX = Math.max(0, Math.min(imgW - 1, Math.round(normLeft * scaleX)));
      const startY = Math.max(0, Math.min(imgH - 1, Math.round(normTop * scaleY)));
      const sampleW = Math.max(1, Math.min(imgW - startX, Math.round(rect.width * scaleX)));
      const sampleH = Math.max(1, Math.min(imgH - startY, Math.round(rect.height * scaleY)));

      const imgData = this.ctx.getImageData(startX, startY, sampleW, sampleH);
      const data = imgData.data;

      let totalLum = 0;
      let count = 0;
      // Step by 4 bytes (RGBA) with sampling step for performance
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Standard perceived relative luminance (ITU-R BT.601)
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLum += lum;
        count++;
      }

      const avgLum = count > 0 ? totalLum / count : 40;
      // Luminance > 138 indicates a bright background region (e.g. bright sky, snow, white clouds)
      const isLight = avgLum > 138;

      return {
        luminance: Math.round(avgLum),
        isLight
      };
    } catch (e) {
      // Security/taint fallback: fallback to dark
      return { luminance: 40, isLight: false };
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Error in contrast listener:', e);
      }
    });
  }
}

export const wallpaperSampler = new WallpaperContrastSampler();
