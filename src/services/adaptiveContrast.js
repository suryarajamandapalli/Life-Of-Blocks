// Adaptive Wallpaper Contrast Service for LIFE OF BLOCKS
// Dynamically samples the exact wallpaper pixels behind any specific UI element.
// Each element independently adapts to either white (#FFFFFF) or black (#111111).

class WallpaperContrastSampler {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.image = null;
    this.isReady = false;
    this.currentUrl = null;
    this.cache = new Map(); // url -> { canvas, ctx, width, height }
    this.listeners = new Set();
  }

  // Load wallpaper into memory canvas with blob-fallback for CORS resilience
  loadWallpaper(url) {
    if (!url) return;
    if (url === this.currentUrl && this.isReady) return;

    this.currentUrl = url;

    // Check cache first for instant retrieval
    if (this.cache.has(url)) {
      const cached = this.cache.get(url);
      this.canvas = cached.canvas;
      this.ctx = cached.ctx;
      this.isReady = true;
      this.notify();
      return;
    }

    this.isReady = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        const cx = c.getContext('2d', { willReadFrequently: true });
        c.width = 640;
        c.height = Math.round(640 * (img.naturalHeight / (img.naturalWidth || 1))) || 360;
        cx.drawImage(img, 0, 0, c.width, c.height);

        // Test reading 1 pixel to verify canvas isn't tainted by CORS
        cx.getImageData(0, 0, 1, 1);

        this.canvas = c;
        this.ctx = cx;
        this.image = img;
        this.isReady = true;
        this.cache.set(url, { canvas: c, ctx: cx, width: c.width, height: c.height });
        this.notify();
      } catch (taintErr) {
        // Tainted canvas fallback: fetch as blob to create local object URL
        this.loadViaBlob(url);
      }
    };

    img.onerror = () => {
      this.loadViaBlob(url);
    };

    img.src = url;
  }

  // Fallback loader using fetch + createObjectURL (avoids cross-origin canvas taint)
  async loadViaBlob(url) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const blobImg = new Image();

      blobImg.onload = () => {
        const c = document.createElement('canvas');
        const cx = c.getContext('2d', { willReadFrequently: true });
        c.width = 640;
        c.height = Math.round(640 * (blobImg.naturalHeight / (blobImg.naturalWidth || 1))) || 360;
        cx.drawImage(blobImg, 0, 0, c.width, c.height);

        this.canvas = c;
        this.ctx = cx;
        this.image = blobImg;
        this.isReady = true;
        this.cache.set(url, { canvas: c, ctx: cx, width: c.width, height: c.height });
        URL.revokeObjectURL(blobUrl);
        this.notify();
      };

      blobImg.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        this.isReady = false;
        this.notify();
      };

      blobImg.src = blobUrl;
    } catch {
      this.isReady = false;
      this.notify();
    }
  }

  // Calculate perceived relative luminance & contrast at exact screen viewport rect
  getLuminanceAtRect(rect) {
    if (!this.isReady || !this.ctx || !this.canvas || !rect || rect.width <= 0 || rect.height <= 0) {
      return { luminance: 40, isLight: false, isHighVariance: false };
    }

    try {
      const vpW = window.innerWidth || 1920;
      const vpH = window.innerHeight || 1080;
      const imgW = this.canvas.width;
      const imgH = this.canvas.height;

      // Exact background-size: cover & background-position: center center mapping
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

      // Map element's viewport coordinates into canvas pixels
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
      const sampleValues = [];

      // Sample every 4th pixel (16 bytes) for blazing performance
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Perceived relative luminance formula (ITU-R BT.601)
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLum += lum;
        sampleValues.push(lum);
        count++;
      }

      const avgLum = count > 0 ? totalLum / count : 40;

      // Compute variance to detect textured or detailed regions
      let variance = 0;
      if (count > 1) {
        for (let i = 0; i < sampleValues.length; i++) {
          variance += Math.pow(sampleValues[i] - avgLum, 2);
        }
        variance /= count;
      }

      // Threshold: luminance > 132 indicates a light/bright region -> text must be #111111
      const isLight = avgLum > 132;
      const isHighVariance = variance > 450;

      return {
        luminance: Math.round(avgLum),
        isLight,
        isHighVariance
      };
    } catch {
      return { luminance: 40, isLight: false, isHighVariance: false };
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
