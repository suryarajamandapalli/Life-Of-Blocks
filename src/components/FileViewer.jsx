import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getFileObjectUrl, getFileContent } from '../services/storage';
import * as XLSX from 'xlsx';
import { 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Play, 
  Pause, 
  Volume2, 
  FileSpreadsheet, 
  FileText, 
  File, 
  Loader2 
} from 'lucide-react';

/* ----------------------------------------------------
   SUB-VIEWER: IMAGE (with Smooth Zoom & Pan)
   ---------------------------------------------------- */
function ImageViewer({ src, alt }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(z => Math.min(3.5, z + 0.35));
  const handleZoomOut = () => {
    setZoom(z => {
      const next = Math.max(1, z - 0.35);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={(e) => {
        if (e.deltaY < 0) handleZoomIn();
        else handleZoomOut();
      }}
      style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
    >
      <img
        src={src}
        alt={alt}
        className="max-h-[85vh] max-w-[92vw] object-contain rounded-xl shadow-2xl transition-transform duration-100 ease-out pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      />

      {/* Floating Zoom HUD Controls */}
      <div 
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          className="p-1 rounded-full text-white/70 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-mono text-white/80 px-1">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3.5}
          className="p-1 rounded-full text-white/70 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        {zoom > 1 && (
          <button
            onClick={handleResetZoom}
            className="p-1 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer ml-1"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   SUB-VIEWER: PDF (Native Browser Viewport Occupancy)
   ---------------------------------------------------- */
function PdfViewer({ src, title }) {
  return (
    <div className="w-full h-full max-w-6xl max-h-[88vh] rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black flex flex-col">
      <iframe
        src={`${src}#toolbar=1`}
        title={title}
        className="w-full h-full rounded-2xl border-none"
      />
    </div>
  );
}

/* ----------------------------------------------------
   SUB-VIEWER: VIDEO
   ---------------------------------------------------- */
function VideoViewer({ src }) {
  return (
    <div className="max-w-5xl max-h-[85vh] flex items-center justify-center p-2">
      <video
        src={src}
        controls
        autoPlay
        className="max-h-[84vh] max-w-[92vw] rounded-2xl shadow-2xl border border-white/15 bg-black"
      />
    </div>
  );
}

/* ----------------------------------------------------
   SUB-VIEWER: AUDIO
   ---------------------------------------------------- */
function AudioViewer({ src, file }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl smoked-modal flex flex-col items-center text-center shadow-2xl border border-white/15">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mb-6 shadow-inner text-amber-300">
        <Volume2 className="w-8 h-8" />
      </div>

      <h4 className="text-base font-medium text-white mb-6 truncate max-w-xs">
        {file.name}
      </h4>

      <div className="w-full mb-3">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
        />
        <div className="flex justify-between text-[11px] text-white/40 mt-1.5 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center mt-2">
        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-1" />
          )}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   SUB-VIEWER: TEXT / CODE / MARKDOWN
   ---------------------------------------------------- */
function TextViewer({ content }) {
  return (
    <div className="w-full h-full max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden border border-white/15 smoked-modal flex flex-col shadow-2xl">
      <div className="flex-1 overflow-auto p-6 font-mono text-xs sm:text-[13px] text-white/90 leading-relaxed whitespace-pre-wrap select-text">
        {content}
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   SUB-VIEWER: SPREADSHEET
   ---------------------------------------------------- */
function SpreadsheetViewer({ data }) {
  return (
    <div className="w-full h-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden border border-white/15 smoked-modal flex flex-col shadow-2xl">
      <div className="flex-1 overflow-auto p-2">
        <table className="w-full text-left text-xs border-collapse">
          <tbody>
            {data.rows.map((row, rIdx) => (
              <tr 
                key={rIdx} 
                className={`border-b border-white/5 ${rIdx === 0 ? 'bg-white/10 font-semibold text-white' : 'text-white/80 hover:bg-white/5'}`}
              >
                <td className="p-2 text-[10px] text-white/30 border-r border-white/5 w-10 text-center select-none font-mono">
                  {rIdx + 1}
                </td>
                {Array.isArray(row) ? row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2 border-r border-white/5 whitespace-nowrap max-w-xs truncate">
                    {String(cell ?? '')}
                  </td>
                )) : (
                  <td className="p-2 text-white/60">{String(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   MAIN FULLSCREEN FILE VIEWER (Section 6, 7, 8)
   ---------------------------------------------------- */
export default function FileViewer({ file, allFiles = [], onClose, onDownload, onSelectFile }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [sheetData, setSheetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentIndex = allFiles.findIndex(f => f.id === file?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allFiles.length - 1;

  const ext = file?.name?.split('.').pop()?.toLowerCase() || '';
  const mime = (file?.mimeType || '').toLowerCase();

  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext) || mime.startsWith('image/');
  const isVideo = ['mp4', 'webm', 'mov', 'mkv', 'ogv'].includes(ext) || mime.startsWith('video/');
  const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext) || mime.startsWith('audio/');
  const isPdf = ext === 'pdf' || mime.includes('pdf');
  const isSpreadsheet = ['csv', 'tsv', 'xlsx', 'xls', 'ods'].includes(ext) || mime.includes('spreadsheet') || mime.includes('csv');
  const isText = ['txt', 'md', 'markdown', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'c', 'cpp', 'rs', 'sh', 'yaml', 'yml', 'xml', 'log'].includes(ext) || mime.startsWith('text/');

  // Keyboard navigation: ESC to close, ArrowLeft / ArrowRight for previous / next
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        onSelectFile?.(allFiles[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        onSelectFile?.(allFiles[currentIndex + 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, currentIndex, hasPrev, hasNext, allFiles, onSelectFile]);

  // Load content
  useEffect(() => {
    if (!file) return;
    let active = true;
    let createdUrl = null;

    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isSpreadsheet) {
          const buffer = await getFileContent(file.id, 'arrayBuffer');
          if (!active) return;
          if (buffer) {
            const workbook = XLSX.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0] || 'Sheet1';
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            setSheetData({
              sheetNames: workbook.SheetNames,
              activeSheet: sheetName,
              rows: rows.slice(0, 500)
            });
          }
        } else if (isText) {
          const text = await getFileContent(file.id, 'text');
          if (!active) return;
          setTextContent(text || '');
        } else {
          const url = file.downloadURL || await getFileObjectUrl(file.id);
          if (!active) return;
          if (!file.downloadURL) createdUrl = url;
          setObjectUrl(url);
        }
      } catch (err) {
        console.error('Failed to load file preview:', err);
        if (active) setError('Could not load preview.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadContent();

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [file?.id, isSpreadsheet, isText]);

  if (!file) return null;

  const modalContent = (
    <div 
      className="file-viewer-active fixed inset-0 z-[99999] flex flex-col bg-black/95 backdrop-blur-3xl select-none animate-modal-in"
      onClick={onClose}
    >
      {/* Discrete Floating Top Header Bar — Guaranteed above all controls */}
      <div 
        className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 z-20 flex-shrink-0 border-b border-white/10 bg-black/40 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm font-medium text-white/90 truncate max-w-[180px] sm:max-w-md drop-shadow-md">
          {file.name}
        </span>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onDownload(file)}
            title="Download file"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-semibold text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white/80 hover:text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-md"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 relative flex items-center justify-center p-2 sm:p-6 w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Navigation Button */}
        {hasPrev && (
          <button
            onClick={() => onSelectFile?.(allFiles[currentIndex - 1])}
            title="Previous file (Left arrow)"
            className="absolute left-4 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 text-white/80 hover:text-white backdrop-blur-md transition-all cursor-pointer shadow-xl hidden sm:flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Next Navigation Button */}
        {hasNext && (
          <button
            onClick={() => onSelectFile?.(allFiles[currentIndex + 1])}
            title="Next file (Right arrow)"
            className="absolute right-4 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 text-white/80 hover:text-white backdrop-blur-md transition-all cursor-pointer shadow-xl hidden sm:flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {loading ? (
          <div className="flex flex-col items-center gap-3 text-white/50 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-white/70" />
            <span>Loading...</span>
          </div>
        ) : error ? (
          <div className="text-center p-8 max-w-sm rounded-2xl smoked-modal border border-white/10">
            <p className="text-sm text-red-300 mb-4">{error}</p>
            <button
              onClick={() => onDownload(file)}
              className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold cursor-pointer"
            >
              Download File
            </button>
          </div>
        ) : isImage && objectUrl ? (
          <ImageViewer src={objectUrl} alt={file.name} />
        ) : isPdf && objectUrl ? (
          <PdfViewer src={objectUrl} title={file.name} />
        ) : isVideo && objectUrl ? (
          <VideoViewer src={objectUrl} />
        ) : isAudio && objectUrl ? (
          <AudioViewer src={objectUrl} file={file} />
        ) : isSpreadsheet && sheetData ? (
          <SpreadsheetViewer data={sheetData} />
        ) : isText && textContent !== null ? (
          <TextViewer content={textContent} />
        ) : (
          <div className="max-w-sm p-8 rounded-3xl smoked-modal text-center shadow-2xl border border-white/15">
            <File className="w-10 h-10 text-white/60 mx-auto mb-4" />
            <h4 className="text-sm font-medium text-white mb-4 truncate">{file.name}</h4>
            <button
              onClick={() => onDownload(file)}
              className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all cursor-pointer shadow-lg"
            >
              Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
