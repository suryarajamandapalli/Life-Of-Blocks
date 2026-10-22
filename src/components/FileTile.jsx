import React, { useState, useEffect } from 'react';
import { getFileObjectUrl, getFileContent } from '../services/storage';
import { 
  Play, 
  Music, 
  FileSpreadsheet, 
  File, 
  Download, 
  Trash2,
  Maximize2
} from 'lucide-react';

export default function FileTile({
  file,
  onOpenViewer,
  onDownload,
  onRequestDelete,
  isLightMode = false
}) {
  const [thumbUrl, setThumbUrl] = useState(null);
  const [textSnippet, setTextSnippet] = useState(null);

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mime = (file.mimeType || '').toLowerCase();

  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext) || mime.startsWith('image/');
  const isVideo = ['mp4', 'webm', 'mov', 'mkv'].includes(ext) || mime.startsWith('video/');
  const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext) || mime.startsWith('audio/');
  const isPdf = ext === 'pdf' || mime.includes('pdf');
  const isSpreadsheet = ['csv', 'tsv', 'xlsx', 'xls', 'ods'].includes(ext) || mime.includes('spreadsheet') || mime.includes('csv');
  const isText = ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'py', 'css', 'html', 'log'].includes(ext) || mime.startsWith('text/');

  useEffect(() => {
    let active = true;
    let url = null;

    if (isImage || isVideo) {
      getFileObjectUrl(file.id).then((resUrl) => {
        if (active && resUrl) {
          url = resUrl;
          setThumbUrl(resUrl);
        }
      });
    } else if (isText) {
      getFileContent(file.id, 'text').then((content) => {
        if (active && content) {
          setTextSnippet(content.slice(0, 140));
        }
      });
    }

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file.id, isImage, isVideo, isText]);

  // Render purely the visual representation without ugly permanent text labels
  const renderVisualContent = () => {
    if (isImage && thumbUrl) {
      return (
        <img
          src={thumbUrl}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      );
    }

    if (isVideo) {
      return (
        <div className="relative w-full h-full bg-black/60 flex items-center justify-center overflow-hidden">
          {thumbUrl ? (
            <video src={thumbUrl} className="w-full h-full object-cover opacity-75" />
          ) : null}
          {/* Floating translucent play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="w-10 h-10 rounded-full bg-black/40 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            </span>
          </div>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className={`w-full h-full p-3 flex flex-col justify-between relative overflow-hidden transition-colors ${
          isLightMode ? 'bg-white/60' : 'bg-zinc-900/60'
        }`}>
          {/* Stylized PDF Document Sheet */}
          <div className={`w-full h-full rounded-xl p-3 flex flex-col justify-between ${
            isLightMode 
              ? 'bg-black/[0.04] border border-black/10' 
              : 'bg-white/[0.08] border border-white/10'
          }`}>
            <div className="flex flex-col gap-1.5 opacity-40">
              <div className={`w-10 h-1 rounded-full ${isLightMode ? 'bg-zinc-800' : 'bg-white'}`} />
              <div className={`w-full h-0.5 rounded-full ${isLightMode ? 'bg-zinc-700/60' : 'bg-white/60'}`} />
              <div className={`w-4/5 h-0.5 rounded-full ${isLightMode ? 'bg-zinc-700/60' : 'bg-white/60'}`} />
              <div className={`w-3/4 h-0.5 rounded-full ${isLightMode ? 'bg-zinc-700/60' : 'bg-white/60'}`} />
            </div>
            <div className="flex items-center justify-between opacity-70">
              <span className="text-[10px] font-mono tracking-widest text-rose-500 font-bold">PDF</span>
              <div className={`w-4 h-0.5 rounded-full ${isLightMode ? 'bg-black/40' : 'bg-white/40'}`} />
            </div>
          </div>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center p-4 transition-colors ${
          isLightMode ? 'bg-white/60' : 'bg-zinc-900/60'
        }`}>
          <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mb-2 shadow-inner group-hover:scale-105 transition-transform">
            <Music className="w-5 h-5 text-amber-500" />
          </div>
          {/* Subtle Equalizer bars */}
          <div className="flex items-end gap-1 h-3 opacity-60">
            <span className="w-1 h-2 bg-amber-500 rounded-full" />
            <span className="w-1 h-3.5 bg-amber-500 rounded-full" />
            <span className="w-1 h-2.5 bg-amber-500 rounded-full" />
            <span className="w-1 h-1.5 bg-amber-500 rounded-full" />
          </div>
        </div>
      );
    }

    if (isSpreadsheet) {
      return (
        <div className={`w-full h-full p-3 flex flex-col justify-between transition-colors ${
          isLightMode ? 'bg-white/60' : 'bg-zinc-900/60'
        }`}>
          <div className={`w-full h-full rounded-xl p-2.5 flex flex-col justify-between ${
            isLightMode 
              ? 'bg-emerald-500/[0.12] border border-emerald-500/25' 
              : 'bg-emerald-500/[0.08] border border-emerald-500/20'
          }`}>
            <div className="grid grid-cols-3 gap-1 opacity-50">
              <div className="h-2 bg-emerald-500/50 rounded-xs" />
              <div className="h-2 bg-emerald-500/50 rounded-xs" />
              <div className="h-2 bg-emerald-500/50 rounded-xs" />
              <div className="h-2 bg-emerald-500/30 rounded-xs" />
              <div className="h-2 bg-emerald-500/30 rounded-xs" />
              <div className="h-2 bg-emerald-500/30 rounded-xs" />
            </div>
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 opacity-80" />
          </div>
        </div>
      );
    }

    if (isText && textSnippet) {
      return (
        <div className={`w-full h-full p-3 flex flex-col transition-colors ${
          isLightMode ? 'bg-white/60' : 'bg-zinc-900/60'
        }`}>
          <div className={`w-full h-full rounded-xl p-2.5 font-mono text-[8px] leading-relaxed overflow-hidden select-none break-all ${
            isLightMode
              ? 'bg-sky-500/[0.12] border border-sky-500/25 text-sky-950 font-medium'
              : 'bg-sky-500/[0.06] border border-sky-500/15 text-sky-200/60'
          }`}>
            {textSnippet}
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full h-full flex items-center justify-center p-4 transition-colors ${
        isLightMode ? 'bg-white/60' : 'bg-zinc-900/60'
      }`}>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform ${
          isLightMode 
            ? 'bg-black/[0.06] border border-black/10 text-zinc-800' 
            : 'bg-white/[0.06] border border-white/10 text-white/50'
        }`}>
          <File className="w-5 h-5" />
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={() => onOpenViewer(file)}
      className={`group relative aspect-[16/11] sm:aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-2xl ${
        isLightMode 
          ? 'border border-black/10 hover:border-black/25' 
          : 'border border-white/10 hover:border-white/25'
      }`}
      style={{
        background: isLightMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 17, 23, 0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      {/* 1. Pure Visual Preview Layer */}
      <div className="absolute inset-0">
        {renderVisualContent()}
      </div>

      {/* 2. Hover Interaction Scrim & Controls (Revealed strictly on hover) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 pointer-events-none">
        {/* Top bar: Actions (Download & Delete) */}
        <div className="flex items-center justify-between pointer-events-auto">
          <span className="p-1.5 rounded-lg bg-black/40 text-white/70 backdrop-blur-md">
            <Maximize2 className="w-3.5 h-3.5" />
          </span>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onDownload(file)}
              title="Download"
              className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-white/70 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onRequestDelete(file)}
              title="Delete"
              className="p-1.5 rounded-lg bg-black/40 hover:bg-rose-500/80 text-white/70 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom: Clean Filename (revealed strictly on hover) */}
        <div className="pointer-events-none">
          <p className="text-xs font-medium text-white truncate drop-shadow-md">
            {file.name}
          </p>
        </div>
      </div>
    </div>
  );
}