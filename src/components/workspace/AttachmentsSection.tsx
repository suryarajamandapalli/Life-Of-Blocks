import React, { useState } from 'react';
import { Attachment, AttachmentType, AccentColor } from '../../types';
import { AttachmentCard } from '../attachments/AttachmentCard';
import { GlassButton } from '../ui/GlassButton';
import { Plus, Paperclip, Sparkles } from 'lucide-react';
import { soundService } from '../../services/sound';
import { PlatformService } from '../../services/platform';

interface AttachmentsSectionProps {
  blockId: string;
  accent: AccentColor;
  attachments: Attachment[];
  onOpenUpload: () => void;
  onOpenFullscreen: (attachment: Attachment) => void;
  onDeleteAttachment: (attachmentId: string) => void;
}

export const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({
  blockId,
  accent,
  attachments,
  onOpenUpload,
  onOpenFullscreen,
  onDeleteAttachment,
}) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredAttachments = attachments.filter((att) => {
    if (filter === 'all') return true;
    if (filter === 'docs') return att.type === 'pdf' || att.type === 'document';
    return att.type === filter;
  });

  const handleDownload = (attachment: Attachment) => {
    if (attachment.dataUrl) {
      PlatformService.shareOrDownload(
        attachment.name,
        attachment.dataUrl,
        attachment.mimeType
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Attachments Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'docs', label: 'PDF & Docs' },
            { id: 'image', label: 'Images' },
            { id: 'video', label: 'Videos' },
            { id: 'audio', label: 'Audio' },
            { id: 'code', label: 'Code' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundService.playTap();
                setFilter(tab.id);
              }}
              className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Upload Trigger */}
        <GlassButton
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={onOpenUpload}
        >
          Add Attachment
        </GlassButton>
      </div>

      {/* Attachments Grid */}
      {filteredAttachments.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-white/[0.02] border border-dashed border-white/10 p-8">
          <Paperclip className="w-10 h-10 text-white/30 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">
            {filter === 'all'
              ? 'No Attachments in this Block'
              : `No ${filter} attachments found`}
          </h3>
          <p className="text-sm text-white/50 max-w-sm mx-auto mb-6">
            Attach PDFs, design assets, lecture notes, syllabus manuals, or audio recordings.
          </p>
          <GlassButton variant="primary" icon={<Plus className="w-4 h-4" />} onClick={onOpenUpload}>
            Attach First File
          </GlassButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAttachments.map((att) => (
            <AttachmentCard
              key={att.id}
              attachment={att}
              accent={accent}
              onOpenFullscreen={onOpenFullscreen}
              onDownload={handleDownload}
              onDelete={onDeleteAttachment}
            />
          ))}
        </div>
      )}
    </div>
  );
};
