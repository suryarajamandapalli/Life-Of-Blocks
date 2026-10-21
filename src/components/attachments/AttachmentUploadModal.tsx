import React, { useState, useRef } from 'react';
import { Attachment, AttachmentType } from '../../types';
import { categorizeMimeType } from '../../storage/db';
import { GlassButton } from '../ui/GlassButton';
import {
  UploadCloud,
  X,
  FileText,
  FileImage,
  FileCode,
  Music,
  Video,
  CheckCircle,
} from 'lucide-react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

interface AttachmentUploadModalProps {
  isOpen: boolean;
  blockId: string;
  onClose: () => void;
  onUpload: (attachment: Attachment) => void;
}

export const AttachmentUploadModal: React.FC<AttachmentUploadModalProps> = ({
  isOpen,
  blockId,
  onClose,
  onUpload,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      soundService.playTaskComplete();
      hapticsService.success();

      const type: AttachmentType = categorizeMimeType(
        selectedFile.type,
        selectedFile.name
      );

      const attachment: Attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        blockId,
        name: selectedFile.name,
        size: selectedFile.size,
        type,
        mimeType: selectedFile.type || 'application/octet-stream',
        dataUrl: filePreview || undefined,
        createdAt: Date.now(),
      };

      onUpload(attachment);
      onClose();
    } catch (err) {
      console.error('File upload failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
        onClick={() => {
          soundService.playDismiss();
          onClose();
        }}
      />

      {/* Modal Card */}
      <div className="liquid-glass relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-fade-in">
        {/* Specular Inner Rim */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Attach Resource</h3>
            <p className="text-xs text-white/50">
              Documents, PDFs, Images, Videos, Audio tracks, or Code files
            </p>
          </div>

          <button
            onClick={() => {
              soundService.playDismiss();
              onClose();
            }}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dropzone Area */}
        <div className="mt-6">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInput}
          />

          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] ${
                isDragging
                  ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
                  : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/30'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-sky-400 shadow-glass-sm mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h4 className="text-sm font-semibold text-white">
                Drag & drop any file here, or{' '}
                <span className="text-sky-400 underline underline-offset-4">browse</span>
              </h4>

              <p className="text-xs text-white/40 mt-1 max-w-xs">
                Supports Images, PDF documents, Video, Audio, Markdown, Source Code & more.
              </p>

              {/* Supported Badges */}
              <div className="flex items-center gap-2 mt-5 text-[11px] text-white/40 flex-wrap justify-center">
                <span className="flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/10">
                  <FileImage className="w-3 h-3 text-sky-400" /> Images
                </span>
                <span className="flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/10">
                  <FileText className="w-3 h-3 text-rose-400" /> PDF & Docs
                </span>
                <span className="flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/10">
                  <Video className="w-3 h-3 text-purple-400" /> Video
                </span>
                <span className="flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/10">
                  <Music className="w-3 h-3 text-emerald-400" /> Audio
                </span>
                <span className="flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/10">
                  <FileCode className="w-3 h-3 text-cyan-400" /> Code
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/20 bg-white/[0.04] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 flex-shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {selectedFile.name}
                    </h4>
                    <p className="text-xs text-white/50 font-mono">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'File'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thumbnail preview if image */}
              {filePreview && selectedFile.type.startsWith('image/') && (
                <div className="mt-4 rounded-xl overflow-hidden max-h-48 border border-white/10 bg-black/50">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <GlassButton variant="ghost" onClick={onClose}>
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleSave}
            disabled={!selectedFile || isProcessing}
            glow
          >
            {isProcessing ? 'Processing...' : 'Attach to Block'}
          </GlassButton>
        </div>
      </div>
    </div>
  );
};
