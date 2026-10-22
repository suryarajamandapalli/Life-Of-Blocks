import React, { useState, useEffect } from 'react';
import { getFileObjectUrl, getFileContent } from '../services/storage';
import { 
  FileSpreadsheet, 
  Play, 
  Music, 
  FileText, 
  File, 
  Download, 
  Trash2 
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function FileItem({ file, onOpenViewer, onDownload, onRequestDelete }) {
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
          setTextSnippet(content.slice(0, 120));
        }
      });
    }

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file.id, isImage, isVideo, isText]);

  const renderThumbnail = () => {
    if (isImage && thumbUrl) {
      return (
        <img
          src={thumbUrl}
          alt=""
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      );
    }

    if (isVideo) {
      return (
        <div className="relative w-full h-full bg-black/70 flex items-center justify-center overflow-hidden">
          {thumbUrl ? (
            <video src={thumbUrl} className="w-full h-full object-cover opacity-60" />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-3 h-3 fill-white text-white ml-0.5" />
            </span>
          </div>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-full bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center text-rose-300 p-1">
          <div className="w-5 h-2 bg-rose-500/30 rounded-xs mb-1" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-rose-300">PDF</span>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="w-full h-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-1 text-amber-300">
          <Music className="w-4 h-4 mr-0.5" />
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 h-2 bg-amber-400/60 rounded-full" />
            <span className="w-0.5 h-3 bg-amber-400/80 rounded-full" />
            <span className="w-0.5 h-1.5 bg-amber-400/60 rounded-full" />
          </div>
        </div>
      );
    }

    if (isSpreadsheet) {
      return (
        <div className="w-full h-full bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-emerald-300 p-1">
          <FileSpreadsheet className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-semibold tracking-wider text-emerald-300 uppercase">
            {ext === 'csv' ? 'CSV' : 'XLS'}
          </span>
        </div>
      );
    }

    if (isText && textSnippet) {
      return (
        <div className="w-full h-full bg-sky-500/10 border border-sky-500/20 p-1.5 overflow-hidden font-mono text-[7px] text-sky-200/70 leading-[1.15] select-none break-all">
          {textSnippet}
        </div>
      );
    }

    if (isText) {
      return (
        <div className="w-full h-full bg-sky-500/10 border border-sky-500/20 flex flex-col items-center justify-center text-sky-300">
          <FileText className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-semibold tracking-wider uppercase text-sky-300">TXT</span>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-white/5 border border-white/10 flex flex-col items-center justify-center text-white/50">
        <File className="w-4 h-4 mb-0.5" />
        <span className="text-[9px] font-medium tracking-wider uppercase text-white/40">
          {ext.slice(0, 4) || 'FILE'}
        </span>
      </div>
    );
  };

  return (
    <div
      onClick={() => onOpenViewer(file)}
      className="group relative flex items-center justify-between gap-3 sm:gap-4 p-3 sm:px-4 sm:py-3.5 rounded-[14px] smoked-container hover:border-white/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer select-none"
    >
      {/* Left: 72x52px Preview Box + Title & Meta */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-[72px] h-[52px] flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-black/40 border border-white/10 shadow-inner">
          {renderThumbnail()}
        </div>

        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[15px] font-medium text-white/95 group-hover:text-white truncate leading-snug">
            {file.name}
          </p>
          <p className="text-[12px] sm:text-[13px] text-white/45 tracking-wide mt-0.5">
            {formatBytes(file.size)} · {ext.toUpperCase() || 'FILE'}
          </p>
        </div>
      </div>

      {/* Right: Actions (Download & Delete) */}
      <div 
        className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onDownload(file)}
          title="Download file"
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 stroke-[2]" />
        </button>

        <button
          onClick={() => onRequestDelete(file)}
          title="Delete file"
          className="p-2 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4 stroke-[2]" />
        </button>
      </div>
    </div>
  );
}
