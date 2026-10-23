import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getFileObjectUrl, getFileContent } from './storage';

// Configure worker for Vite production & development
try {
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }
} catch (e) {
  console.warn('[PDF.js Worker Setup Error]:', e);
}

// In-memory cache for rendered thumbnails to avoid re-rendering
const thumbnailMemoryCache = new Map();

/**
 * Render the first page of a PDF as a JPEG Data URL
 * @param {string|ArrayBuffer|Uint8Array} source - URL, DataURL, or ArrayBuffer of the PDF
 * @param {number} maxWidth - Maximum width of the thumbnail (default: 360px)
 * @returns {Promise<string|null>} Data URL of the first page image
 */
export async function renderPdfFirstPage(source, maxWidth = 360) {
  if (!source) return null;

  try {
    let loadingTask;
    if (typeof source === 'string') {
      loadingTask = pdfjsLib.getDocument({
        url: source,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/cmaps/',
        cMapPacked: true
      });
    } else {
      loadingTask = pdfjsLib.getDocument({
        data: source,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/cmaps/',
        cMapPacked: true
      });
    }

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2, maxWidth / unscaledViewport.width);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) return null;

    // Fill white background for transparent PDF pages
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    return dataUrl;
  } catch (err) {
    console.warn('[PDF Thumbnail Render Warning]:', err?.message || err);
    return null;
  }
}

/**
 * Get or generate a thumbnail for a PDF file object
 * @param {object} file - File metadata object
 * @returns {Promise<string|null>}
 */
export async function getPdfThumbnail(file) {
  if (!file) return null;
  const fileId = file.id || file.fileId;

  // 1. Check if metadata already has a thumbnail
  if (file.thumbnailURL) {
    return file.thumbnailURL;
  }

  // 2. Check memory cache
  if (thumbnailMemoryCache.has(fileId)) {
    return thumbnailMemoryCache.get(fileId);
  }

  try {
    let source = null;

    // 3. If file has a base64 data URL
    if (file.downloadURL && file.downloadURL.startsWith('data:application/pdf')) {
      source = file.downloadURL;
    } else if (file.downloadURL && file.downloadURL.startsWith('http')) {
      source = file.downloadURL;
    } else {
      // Try IndexedDB buffer or object URL
      const buffer = await getFileContent(fileId, 'arrayBuffer').catch(() => null);
      if (buffer) {
        source = new Uint8Array(buffer);
      } else {
        const objUrl = await getFileObjectUrl(fileId).catch(() => null);
        if (objUrl) source = objUrl;
      }
    }

    if (!source) return null;

    const thumb = await renderPdfFirstPage(source, 360);
    if (thumb) {
      thumbnailMemoryCache.set(fileId, thumb);
      return thumb;
    }
  } catch (err) {
    console.warn('[PDF Thumbnail Generation Failed]:', err);
  }

  return null;
}
