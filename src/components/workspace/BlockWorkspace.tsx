import React, { useState } from 'react';
import { Block, Task, Attachment, Note } from '../../types';
import { WorkspaceHeader } from './WorkspaceHeader';
import { TasksSection } from './TasksSection';
import { AttachmentsSection } from './AttachmentsSection';
import { NotesSection } from './NotesSection';
import { OverviewSection } from './OverviewSection';
import { AttachmentUploadModal } from '../attachments/AttachmentUploadModal';
import { FullscreenViewer } from '../attachments/FullscreenViewer';
import { CheckSquare, Paperclip, BookOpen, BarChart3 } from 'lucide-react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

interface BlockWorkspaceProps {
  block: Block;
  tasks: Task[];
  attachments: Attachment[];
  notes: Note[];
  onBack: () => void;
  onEditBlock: (block: Block) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onSaveAttachment: (attachment: Attachment) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onSaveNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
}

export const BlockWorkspace: React.FC<BlockWorkspaceProps> = ({
  block,
  tasks,
  attachments,
  notes,
  onBack,
  onEditBlock,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onSaveAttachment,
  onDeleteAttachment,
  onSaveNote,
  onDeleteNote,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'files' | 'notes' | 'overview'>('tasks');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedAttachmentForViewer, setSelectedAttachmentForViewer] = useState<Attachment | null>(null);

  const tabs: {
    id: 'tasks' | 'files' | 'notes' | 'overview';
    label: string;
    icon: any;
    badge?: number;
  }[] = [
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      badge: tasks.length,
    },
    {
      id: 'files',
      label: 'Files & Media',
      icon: Paperclip,
      badge: attachments.length,
    },
    {
      id: 'notes',
      label: 'Notes & Briefs',
      icon: BookOpen,
      badge: notes.length,
    },
    {
      id: 'overview',
      label: 'Analytics',
      icon: BarChart3,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 animate-fade-in">
      {/* Workspace Header Room Banner */}
      <WorkspaceHeader
        block={block}
        tasks={tasks}
        onBack={onBack}
        onEditBlock={() => onEditBlock(block)}
        onQuickAddTask={() => {
          setActiveTab('tasks');
        }}
        onQuickAddAttachment={() => {
          setIsUploadOpen(true);
        }}
      />

      {/* Modern iOS 26 Liquid Glass Segmented Tabs */}
      <div className="flex items-center mb-8 overflow-x-auto pb-2 scrollbar-none">
        <div className="liquid-glass-pill inline-flex items-center p-1.5 gap-1.5 max-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundService.playTap();
                  hapticsService.light();
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2.5 px-4.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap select-none ${
                  isActive
                    ? 'liquid-glass-active text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-white/50'}`} />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                        : 'bg-white/[0.08] text-white/50'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'tasks' && (
          <TasksSection
            blockId={block.id}
            accent={block.accent}
            tasks={tasks}
            onAddTask={onAddTask}
            onToggleTask={onToggleTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
          />
        )}

        {activeTab === 'files' && (
          <AttachmentsSection
            blockId={block.id}
            accent={block.accent}
            attachments={attachments}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenFullscreen={(att) => setSelectedAttachmentForViewer(att)}
            onDeleteAttachment={onDeleteAttachment}
          />
        )}

        {activeTab === 'notes' && (
          <NotesSection
            blockId={block.id}
            accent={block.accent}
            notes={notes}
            onSaveNote={onSaveNote}
            onDeleteNote={onDeleteNote}
          />
        )}

        {activeTab === 'overview' && (
          <OverviewSection
            block={block}
            tasks={tasks}
            attachments={attachments}
            notes={notes}
            accent={block.accent}
          />
        )}
      </div>

      {/* Upload Modal */}
      <AttachmentUploadModal
        isOpen={isUploadOpen}
        blockId={block.id}
        onClose={() => setIsUploadOpen(false)}
        onUpload={(att) => {
          onSaveAttachment(att);
        }}
      />

      {/* Fullscreen Viewer */}
      <FullscreenViewer
        attachment={selectedAttachmentForViewer}
        onClose={() => setSelectedAttachmentForViewer(null)}
      />
    </div>
  );
};
