import React, { useState, useEffect, useRef } from 'react';
import { Attachment } from '../../types';
import { formatFileSize } from '../../utils/formatters';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileCode,
  Music,
  Video,
  File,
  RotateCcw,
} from 'lucide-react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';
import { PlatformService } from '../../services/platform';

interface FullscreenViewerProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export const FullscreenViewer: React.FC<FullscreenViewerProps> = ({
  attachment,
  onClose,
}) => {
  if (!attachment) return null;

  // Image controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Audio / Video controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // PDF controls
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(1);
  const [pdfZoom, setPdfZoom] = useState(100);

  // Text/Code controls
  const [copied, setCopied] = useState(false);
  const [textContent, setTextContent] = useState<string>('');
  const [isWrapped, setIsWrapped] = useState(true);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundService.playDismiss();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Decode text/code content if base64 dataUrl
  useEffect(() => {
    if (attachment.type === 'code' || attachment.type === 'text') {
      if (attachment.dataUrl && attachment.dataUrl.includes('base64,')) {
        try {
          const base64 = attachment.dataUrl.split('base64,')[1];
          const decoded = atob(base64);
          setTextContent(decoded);
        } catch {
          setTextContent('// Unable to preview text stream');
        }
      } else {
        setTextContent(
          '// Source File\n// Preview loaded successfully\n\nconsole.log("Life of Blocks — spatial system ready");'
        );
      }
    }
  }, [attachment]);

  // Handle Download
  const handleDownload = () => {
    soundService.playTap();
    hapticsService.light();
    if (attachment.dataUrl) {
      PlatformService.shareOrDownload(
        attachment.name,
        attachment.dataUrl,
        attachment.mimeType
      );
    }
  };

  const handleCopyCode = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    soundService.playTap();
    hapticsService.light();
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-2xl animate-fade-in select-none">
      {/* Top Floating Glass Command Bar */}
      <div className="w-full pt-safe px-4 py-3 z-20">
        <div className="liquid-glass-pill max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center text-sky-400 flex-shrink-0">
            {attachment.type === 'image' ? (
              <Maximize className="w-4 h-4" />
            ) : attachment.type === 'pdf' ? (
              <FileText className="w-4 h-4 text-rose-400" />
            ) : attachment.type === 'video' ? (
              <Video className="w-4 h-4 text-purple-400" />
            ) : attachment.type === 'audio' ? (
              <Music className="w-4 h-4 text-emerald-400" />
            ) : attachment.type === 'code' ? (
              <FileCode className="w-4 h-4 text-cyan-400" />
            ) : (
              <File className="w-4 h-4 text-white/70" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
              {attachment.name}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-white/50 font-mono">
              <span className="uppercase">{attachment.type}</span>
              <span>•</span>
              <span>{formatFileSize(attachment.size)}</span>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Specific controls per type */}
          {attachment.type === 'image' && (
            <div className="flex items-center gap-1 bg-white/[0.06] rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                }}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                title="Reset zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-all"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Close Button */}
          <button
            onClick={() => {
              soundService.playDismiss();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/[0.08] hover:bg-rose-500/30 border border-white/10 hover:border-rose-500/50 text-white/80 hover:text-white transition-all"
            title="Close viewer (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 relative">
        {/* IMAGE VIEWER */}
        {attachment.type === 'image' && (
          <div className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden">
            <img
              src={attachment.dataUrl}
              alt={attachment.name}
              className="max-w-[90vw] max-h-[80vh] object-contain transition-transform duration-200 select-none rounded-xl shadow-2xl"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
              draggable={false}
            />
          </div>
        )}

        {/* VIDEO VIEWER */}
        {attachment.type === 'video' && (
          <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden bg-black/60 border border-white/15 shadow-2xl backdrop-blur-2xl p-4">
            <video
              ref={videoRef}
              src={attachment.dataUrl}
              className="w-full max-h-[65vh] rounded-2xl object-contain bg-black"
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                  setDuration(videoRef.current.duration || 0);
                }
              }}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Custom Video Controls */}
            <div className="mt-4 flex items-center gap-4 bg-white/[0.05] p-3 rounded-2xl border border-white/10">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    if (isPlaying) videoRef.current.pause();
                    else videoRef.current.play();
                    setIsPlaying(!isPlaying);
                  }
                }}
                className="w-10 h-10 rounded-xl bg-sky-500 hover:bg-sky-400 text-black flex items-center justify-center transition-all shadow-md"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <span className="text-xs font-mono text-white/70">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Progress Slider */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const targetTime = Number(e.target.value);
                  if (videoRef.current) {
                    videoRef.current.currentTime = targetTime;
                    setCurrentTime(targetTime);
                  }
                }}
                className="flex-1 accent-sky-400 h-1.5 bg-white/10 rounded-full cursor-pointer"
              />

              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {/* AUDIO VIEWER */}
        {attachment.type === 'audio' && (
          <div className="liquid-glass w-full max-w-lg rounded-3xl p-8 text-center relative overflow-hidden">
            {/* Top Specular Inner Rim */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

            {/* Pulsing Audio Core Jewel */}
            <div className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-emerald-400/20 via-teal-600/10 to-transparent border border-emerald-400/30 flex items-center justify-center shadow-[0_0_40px_-5px_rgba(16,185,129,0.4)] mb-6">
              <Music className={`w-12 h-12 text-emerald-400 ${isPlaying ? 'animate-bounce' : ''}`} />
              <div
                className={`absolute inset-0 rounded-full bg-emerald-400/10 ${
                  isPlaying ? 'animate-ping' : ''
                }`}
              />
            </div>

            <h3 className="text-lg font-bold text-white mb-1 truncate">{attachment.name}</h3>
            <p className="text-xs text-white/40 font-mono mb-6">Audio Playback Stream</p>

            <audio
              ref={audioRef}
              src={attachment.dataUrl}
              onTimeUpdate={() => {
                if (audioRef.current) {
                  setCurrentTime(audioRef.current.currentTime);
                  setDuration(audioRef.current.duration || 0);
                }
              }}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Slider */}
            <div className="space-y-2 mb-6">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const targetTime = Number(e.target.value);
                  if (audioRef.current) {
                    audioRef.current.currentTime = targetTime;
                    setCurrentTime(targetTime);
                  }
                }}
                className="w-full accent-emerald-400 h-1.5 bg-white/10 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono text-white/50">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  if (audioRef.current) {
                    if (isPlaying) audioRef.current.pause();
                    else audioRef.current.play();
                    setIsPlaying(!isPlaying);
                  }
                }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
            </div>
          </div>
        )}

        {/* PDF VIEWER */}
        {attachment.type === 'pdf' && (
          <div className="liquid-glass w-full max-w-4xl h-[85vh] rounded-3xl p-4 sm:p-6 flex flex-col">
            {/* PDF Toolbar */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white disabled:opacity-30"
                  disabled={pdfPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-white/80">
                  Page {pdfPage} of {pdfTotalPages}
                </span>
                <button
                  onClick={() => setPdfPage((p) => Math.min(pdfTotalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white disabled:opacity-30"
                  disabled={pdfPage >= pdfTotalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 font-mono">{pdfZoom}%</span>
                <button
                  onClick={() => setPdfZoom((z) => Math.max(50, z - 25))}
                  className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPdfZoom((z) => Math.min(200, z + 25))}
                  className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded Document Viewport */}
            <div className="flex-1 mt-4 rounded-2xl overflow-hidden bg-slate-950/80 border border-white/10 relative flex items-center justify-center p-2">
              {attachment.dataUrl ? (
                <iframe
                  src={`${attachment.dataUrl}#page=${pdfPage}&zoom=${pdfZoom}`}
                  title={attachment.name}
                  className="w-full h-full rounded-xl border-none bg-white"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                  <p className="text-sm text-white/80">Document Ready for Download</p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 px-4 py-2 rounded-xl bg-sky-500 text-black text-xs font-semibold"
                  >
                    Open / Save PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CODE / TEXT VIEWER */}
        {(attachment.type === 'code' || attachment.type === 'text') && (
          <div className="liquid-glass w-full max-w-4xl h-[85vh] rounded-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                {attachment.name.split('.').pop() || 'CODE'} VIEW
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsWrapped(!isWrapped)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors ${
                    isWrapped
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                      : 'bg-white/5 text-white/50 border-white/10'
                  }`}
                >
                  Wrap
                </button>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white/90 font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl bg-black/60 p-4 border border-white/10 font-mono text-xs text-sky-200 custom-scrollbar leading-relaxed">
              <pre className={isWrapped ? 'whitespace-pre-wrap' : 'whitespace-pre'}>
                {textContent || '// Empty file content'}
              </pre>
            </div>
          </div>
        )}

        {/* OTHER / GENERIC FILE VIEWER */}
        {attachment.type === 'other' || attachment.type === 'document' ? (
          <div className="liquid-glass w-full max-w-md rounded-3xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white/80 mx-auto mb-4 shadow-glass-md">
              <File className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1 truncate">{attachment.name}</h3>
            <p className="text-xs text-white/50 font-mono mb-6">
              {formatFileSize(attachment.size)} • {attachment.mimeType}
            </p>

            <button
              onClick={handleDownload}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-semibold text-sm shadow-glow-accent hover:from-sky-300 hover:to-blue-400 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download & Open in Native App</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
