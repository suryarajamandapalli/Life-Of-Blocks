import React, { useState, useEffect } from 'react';
import { getFileObjectUrl, getFileContent } from '../services/storage';
import { getPdfThumbnail } from '../services/pdfThumbnail';
import { 
  Play, 
  Music, 
  FileSpreadsheet, 
  FileText,
  Presentation,
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
  const [thumbUrl, setThumbUrl] = useState(() => file.downloadURL || null);
  const [textSnippet, setTextSnippet] = useState(null);
  const [pdfThumb, setPdfThumb] = useState(() => file.thumbnailURL || null);

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mime = (file.mimeType || '').toLowerCase();

  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'avif'].includes(ext) || mime.startsWith('image/');
  const isVideo = ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext) || mime.startsWith('video/');
  const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext) || mime.startsWith('audio/');
  const isPdf = ext === 'pdf' || mime.includes('pdf');
  const isSpreadsheet = ['csv', 'tsv', 'xlsx', 'xls', 'ods'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv');
  const isDocument = ['doc', 'docx', 'odt', 'rtf'].includes(ext) || mime.includes('word') || mime.includes('document');
  const isPresentation = ['ppt', 'pptx', 'odp'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint');
  const isText = ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'py', 'css', 'html', 'log', 'yaml', 'yml'].includes(ext) || mime.startsWith('text/');

  useEffect(() => {
    let active = true;
    let url = null;
    const fileId = file.id || file.fileId;

    if (file.downloadURL && (isImage || isVideo)) {
      setThumbUrl(file.downloadURL);
    } else if (isImage || isVideo) {
      getFileObjectUrl(fileId).then((resUrl) => {
        if (active && resUrl) {
          url = resUrl;
          setThumbUrl(resUrl);
        }
      });
    } else if (isText) {
      getFileContent(fileId, 'text').then((content) => {
        if (active && content) {
          setTextSnippet(content.slice(0, 160));
        }
      });
    }

    // PDF Thumbnail generation
    if (isPdf) {
      if (file.thumbnailURL) {
        setPdfThumb(file.thumbnailURL);
      } else {
        getPdfThumbnail(file).then((thumb) => {
          if (active && thumb) {
            setPdfThumb(thumb);
          }
        });
      }
    }

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file.id, file.fileId, file.downloadURL, file.thumbnailURL, isImage, isVideo, isText, isPdf]);

  // Render purely the visual representation without ugly permanent text labels
  const renderVisualContent = () => {
    // 1. Image Cover
    if (isImage && thumbUrl) {
      return (
        <img
          src={thumbUrl}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      );
    }

    // 2. Video Preview with Play badge
    if (isVideo) {
      return (
        <div className="relative w-full h-full bg-black/60 flex items-center justify-center overflow-hidden">
          {thumbUrl ? (
            <video src={thumbUrl} className="w-full h-full object-cover opacity-75" />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="w-10 h-10 rounded-full bg-black/40 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            </span>
          </div>
        </div>
      );
    }

    // 3. PDF Document Sheet with real page 1 thumbnail preview
    if (isPdf) {
      if (pdfThumb) {
        return (
          <div className="relative w-full h-full bg-white flex items-center justify-center overflow-hidden">
            <img
              src={pdfThumb}
              alt={file.name}
              className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
            />
            {/* Subtle elegant PDF badge overlay in top-left */}
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-rose-600/90 text-[10px] font-bold text-white tracking-wider shadow-md pointer-events-none backdrop-blur-sm">
              PDF
            </span>
          </div>
        );
      }

      // Clean fallback if rendering in progress or corrupted PDF
      return (
        <div className={`w-full h-full p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden transition-colors ${
          isLightMode ? 'bg-white/65' : 'bg-black/55'
        }`}>
          <div className={`w-full h-full rounded-xl p-3 flex flex-col justify-between ${
            isLightMode 
              ? 'bg-rose-500/[0.08] border border-rose-500/20' 
              : 'bg-rose-500/[0.12] border border-rose-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono tracking-widest text-rose-500 font-bold">PDF</span>
              <FileText className="w-4 h-4 text-rose-400 opacity-80" />
            </div>
            <p className={`text-xs font-medium truncate ${isLightMode ? 'text-zinc-800' : 'text-white/90'}`}>
              {file.name}
            </p>
          </div>
        </div>
      );
    }

    // 4. Word Document (DOC / DOCX)
    if (isDocument) {
      return (
        <div className={`w-full h-full p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden transition-colors ${
          isLightMode ? 'bg-white/55' : 'bg-black/45'
        }`}>
          <div className={`w-full h-full rounded-xl p-2.5 flex flex-col justify-between ${
            isLightMode 
              ? 'bg-blue-500/[0.06] border border-blue-500/15' 
              : 'bg-blue-500/[0.08] border border-blue-500/20'
          }`}>
            <div className="flex flex-col gap-1.5 opacity-40">
              <div className="w-8 h-1 rounded-full bg-blue-500" />
              <div className={`w-full h-0.5 rounded-full ${isLightMode ? 'bg-zinc-800/40' : 'bg-white/40'}`} />
              <div className={`w-5/6 h-0.5 rounded-full ${isLightMode ? 'bg-zinc-800/40' : 'bg-white/40'}`} />
              <div className={`w-2/3 h-0.5 rounded-full ${isLightMode ? 'bg-zinc-800/40' : 'bg-white/40'}`} />
            </div>
            <div className="flex items-center justify-between opacity-80">
              <span className="text-[10px] font-mono tracking-widest text-blue-500 font-bold">DOC</span>
              <FileText className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>
        </div>
      );
    }

    // 5. Presentation (PPT / PPTX)
    if (isPresentation) {
      return (
        <div className={`w-full h-full p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden transition-colors ${
          isLightMode ? 'bg-white/55' : 'bg-black/45'
        }`}>
          <div className={`w-full h-full rounded-xl p-2.5 flex flex-col justify-between ${
            isLightMode 
              ? 'bg-amber-500/[0.08] border border-amber-500/20' 
              : 'bg-amber-500/[0.08] border border-amber-500/20'
          }`}>
            <div className="flex flex-col gap-1.5 opacity-40">
              <div className="w-12 h-1 rounded-full bg-amber-500" />
              <div className="grid grid-cols-2 gap-1 mt-1">
                <div className={`h-4 rounded-sm ${isLightMode ? 'bg-amber-500/20' : 'bg-amber-500/20'}`} />
                <div className={`h-4 rounded-sm ${isLightMode ? 'bg-amber-500/10' : 'bg-amber-500/10'}`} />
              </div>
            </div>
            <div className="flex items-center justify-between opacity-80">
              <span className="text-[10px] font-mono tracking-widest text-amber-500 font-bold">PPT</span>
              <Presentation className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>
        </div>
      );
    }

    // 6. Audio Waveform
    if (isAudio) {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center p-3 transition-colors ${
          isLightMode ? 'bg-white/55' : 'bg-black/45'
        }`}>
          <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mb-2 shadow-inner group-hover:scale-105 transition-transform">
            <Music className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-end gap-1 h-3 opacity-60">
            <span className="w-1 h-2 bg-amber-500 rounded-full" />
            <span className="w-1 h-3.5 bg-amber-500 rounded-full" />
            <span className="w-1 h-2.5 bg-amber-500 rounded-full" />
            <span className="w-1 h-1.5 bg-amber-500 rounded-full" />
          </div>
        </div>
      );
    }

    // 7. Spreadsheet (XLS / XLSX / CSV)
    if (isSpreadsheet) {
      return (
        <div className={`w-full h-full p-2.5 sm:p-3 flex flex-col justify-between transition-colors ${
          isLightMode ? 'bg-white/55' : 'bg-black/45'
        }`}>
          <div className={`w-full h-full rounded-xl p-2.5 flex flex-col justify-between ${
            isLightMode 
              ? 'bg-emerald-500/[0.08] border border-emerald-500/20' 
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
            <div className="flex items-center justify-between opacity-80">
              <span className="text-[10px] font-mono tracking-widest text-emerald-500 font-bold">XLS</span>
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
        </div>
      );
    }

    // 8. Text / Code Snippet
    if (isText && textSnippet) {
      return (
        <div className={`w-full h-full p-2.5 sm:p-3 flex flex-col transition-colors ${
          isLightMode ? 'bg-white/55' : 'bg-black/45'
        }`}>
          <div className={`w-full h-full rounded-xl p-2 font-mono text-[7.5px] leading-relaxed overflow-hidden select-none break-all ${
            isLightMode
              ? 'bg-sky-500/[0.08] border border-sky-500/20 text-sky-950 font-medium'
              : 'bg-sky-500/[0.06] border border-sky-500/15 text-sky-200/60'
          }`}>
            {textSnippet}
          </div>
        </div>
      );
    }

    // 9. Generic File Glyph
    return (
      <div className={`w-full h-full flex items-center justify-center p-3 transition-colors ${
        isLightMode ? 'bg-white/55' : 'bg-black/45'
      }`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
          isLightMode 
            ? 'bg-black/[0.06] border border-black/10 text-zinc-800' 
            : 'bg-white/[0.06] border border-white/10 text-white/50'
        }`}>
          <File className="w-4 h-4" />
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={() => onOpenViewer(file)}
      className={`group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-xl ${
        isLightMode 
          ? 'border border-black/10 hover:border-black/25' 
          : 'border border-white/10 hover:border-white/25'
      }`}
      style={{
        background: isLightMode ? 'rgba(255, 255, 255, 0.40)' : 'rgba(15, 17, 23, 0.40)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      {/* 1. Pure Visual Preview Layer (Zero permanent text/labels) */}
      <div className="absolute inset-0">
        {renderVisualContent()}
      </div>

      {/* 2. Hover Interaction Scrim & Controls (Revealed strictly on hover) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2.5 sm:p-3 pointer-events-none">
        {/* Top Actions: Expand, Download & Delete */}
        <div className="flex items-center justify-between pointer-events-auto">
          <span className="p-1 rounded-md bg-black/40 text-white/70 backdrop-blur-md">
            <Maximize2 className="w-3 h-3" />
          </span>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onDownload(file)}
              title="Download"
              className="p-1.5 rounded-md bg-black/40 hover:bg-black/70 text-white/70 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
            </button>
            <button
              onClick={() => onRequestDelete(file)}
              title="Delete"
              className="p-1.5 rounded-md bg-black/40 hover:bg-rose-500/80 text-white/70 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Bottom Filename: Revealed strictly on hover */}
        <div className="pointer-events-none">
          <p className="text-[11.5px] font-medium text-white truncate drop-shadow-md">
            {file.name}
          </p>
        </div>
      </div>
    </div>
  );
}