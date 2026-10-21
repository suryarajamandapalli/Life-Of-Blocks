import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Block, Task, Note, Attachment, AppSettings, AttachmentType } from '../types';

interface LifeOfBlocksDB extends DBSchema {
  blocks: {
    key: string;
    value: Block;
    indexes: { 'by-order': number };
  };
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-block': string; 'by-completed': number };
  };
  notes: {
    key: string;
    value: Note;
    indexes: { 'by-block': string };
  };
  attachments: {
    key: string;
    value: Attachment;
    indexes: { 'by-block': string };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'life_of_blocks_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<LifeOfBlocksDB>> | null = null;

export const getDB = async (): Promise<IDBPDatabase<LifeOfBlocksDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<LifeOfBlocksDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Blocks store
        if (!db.objectStoreNames.contains('blocks')) {
          const blockStore = db.createObjectStore('blocks', { keyPath: 'id' });
          blockStore.createIndex('by-order', 'order');
        }

        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('by-block', 'blockId');
          taskStore.createIndex('by-completed', 'completed');
        }

        // Notes store
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('by-block', 'blockId');
        }

        // Attachments store
        if (!db.objectStoreNames.contains('attachments')) {
          const attachStore = db.createObjectStore('attachments', { keyPath: 'id' });
          attachStore.createIndex('by-block', 'blockId');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
};

// Default Settings
export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'dark',
  wallpaper: 'nebula-aurora',
  animatedParticles: true,
  particleSpeed: 1,
  glassIntensity: 'medium',
  animations: 'full',
  soundEffects: true,
  hapticFeedback: true,
  defaultAccent: 'ice',
};

// Initial Seed Data for first run
export const SEED_BLOCKS: Block[] = [
  {
    id: 'block-gate-2027',
    name: 'GATE 2027',
    description: 'Master Computer Science core subjects and secure top 100 AIR rank.',
    icon: 'GraduationCap',
    accent: 'ice',
    order: 0,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'block-music',
    name: 'Music & Sound',
    description: 'Ambient synthesis, sound design, and experimental modular compositions.',
    icon: 'Headphones',
    accent: 'purple',
    order: 1,
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'block-coding',
    name: 'Projects & Systems',
    description: 'High-performance distributed systems, Rust internals, and spatial apps.',
    icon: 'Code2',
    accent: 'cyan',
    order: 2,
    createdAt: Date.now() - 86400000 * 21,
    updatedAt: Date.now() - 3600000 * 8,
  },
  {
    id: 'block-fitness',
    name: 'Fitness & Vitality',
    description: 'Daily strength routine, zone-2 endurance, and metabolic health.',
    icon: 'Flame',
    accent: 'emerald',
    order: 3,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 1,
  },
];

export const SEED_TASKS: Task[] = [
  // GATE 2027 tasks
  {
    id: 't-gate-1',
    blockId: 'block-gate-2027',
    title: 'Complete Data Structures & Algorithms revision',
    description: 'Focus on Balanced Trees, Graphs, and Dynamic Programming optimality.',
    completed: true,
    completedAt: Date.now() - 86400000 * 3,
    priority: 'high',
    dueDate: '2026-11-15',
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 't-gate-2',
    blockId: 'block-gate-2027',
    title: 'Study Operating Systems concurrency & memory management',
    description: 'Paging, virtual memory, semaphore deadlocks, and disk scheduling.',
    completed: true,
    completedAt: Date.now() - 86400000 * 2,
    priority: 'urgent',
    dueDate: '2026-11-20',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 't-gate-3',
    blockId: 'block-gate-2027',
    title: 'Solve previous 10 years question papers (PYQs)',
    description: 'Analyze tricky questions in TOC and Computer Architecture.',
    completed: false,
    priority: 'urgent',
    dueDate: '2026-12-01',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 't-gate-4',
    blockId: 'block-gate-2027',
    title: 'Attend full-length mock exam and diagnose weak topics',
    description: 'Practice time allocation: 65 questions in 180 minutes.',
    completed: false,
    priority: 'high',
    dueDate: '2026-12-10',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 't-gate-5',
    blockId: 'block-gate-2027',
    title: 'Review Engineering Mathematics & Discrete Probability',
    description: 'Graph theory chromatic numbers and Markov chains.',
    completed: true,
    completedAt: Date.now() - 86400000 * 1,
    priority: 'medium',
    dueDate: '2026-11-25',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 1,
  },

  // Music tasks
  {
    id: 't-music-1',
    blockId: 'block-music',
    title: 'Finish ambient cinematic soundscape intro',
    completed: true,
    completedAt: Date.now() - 86400000 * 4,
    priority: 'high',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 't-music-2',
    blockId: 'block-music',
    title: 'Master reverb decay & EQ low-end rumble',
    completed: true,
    completedAt: Date.now() - 86400000 * 2,
    priority: 'medium',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 't-music-3',
    blockId: 'block-music',
    title: 'Record analog synthesizer modular sequence',
    completed: false,
    priority: 'high',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },

  // Projects tasks
  {
    id: 't-proj-1',
    blockId: 'block-coding',
    title: 'Architect zero-copy memory ring buffer in Rust',
    completed: true,
    completedAt: Date.now() - 86400000 * 5,
    priority: 'high',
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 't-proj-2',
    blockId: 'block-coding',
    title: 'Benchmark multi-threaded event loop vs io_uring',
    completed: false,
    priority: 'urgent',
    dueDate: '2026-11-18',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 't-proj-3',
    blockId: 'block-coding',
    title: 'Write technical spec for spatial glass shader',
    completed: true,
    completedAt: Date.now() - 86400000 * 1,
    priority: 'medium',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 1,
  },

  // Fitness tasks
  {
    id: 't-fit-1',
    blockId: 'block-fitness',
    title: 'Morning 5km zone-2 cardio aerobic run',
    completed: true,
    completedAt: Date.now() - 86400000 * 1,
    priority: 'high',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 't-fit-2',
    blockId: 'block-fitness',
    title: 'Posterior chain hypertrophy: Deadlifts & Rows',
    completed: false,
    priority: 'medium',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
];

export const SEED_NOTES: Note[] = [
  {
    id: 'n-gate-1',
    blockId: 'block-gate-2027',
    title: 'High-Yield Formulae & Complexities',
    content: `# Key Asymptotic Recurrences\n\n- **Master Theorem Formula:**\n  $$T(n) = aT(n/b) + \\Theta(n^k \\log^p n)$$\n\n- **Graph Algorithms:**\n  - Dijkstra with Fibonacci Heap: $O(V \\log V + E)$\n  - Bellman-Ford: $O(VE)$\n  - Floyd-Warshall: $O(V^3)$\n\n### OS Paging Formula:\n$$EAT = (1 - p) \\times m + p \\times (\\text{fault service time})$$`,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'n-music-1',
    blockId: 'block-music',
    title: 'Atmospheric Production Notes',
    content: `## Sound Palette\n\n- Reverb decay: 4.8 seconds with 30ms pre-delay\n- Modulated chorus with stereo spread 120%\n- Sub-bass filtered strictly at 35Hz highpass to preserve spatial headroom`,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 2,
  },
];

// Helper to determine file attachment category
export const categorizeMimeType = (mime: string, filename: string): AttachmentType => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext)) {
    return 'image';
  }
  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
    return 'audio';
  }
  if (
    [
      'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs',
      'html', 'css', 'json', 'yaml', 'yml', 'xml', 'sql', 'sh', 'bash'
    ].includes(ext)
  ) {
    return 'code';
  }
  if (['txt', 'md', 'rtf', 'log', 'csv'].includes(ext) || mime.startsWith('text/')) {
    return 'text';
  }
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
    return 'document';
  }
  return 'other';
};

// Database CRUD Operations

// Blocks
export const dbGetAllBlocks = async (): Promise<Block[]> => {
  const db = await getDB();
  const blocks = await db.getAllFromIndex('blocks', 'by-order');
  if (blocks.length === 0) {
    // Check if seeded
    const count = await db.count('blocks');
    if (count === 0) {
      await dbSeedInitialData();
      return await db.getAllFromIndex('blocks', 'by-order');
    }
  }
  return blocks;
};

export const dbGetBlockById = async (id: string): Promise<Block | undefined> => {
  const db = await getDB();
  return db.get('blocks', id);
};

export const dbSaveBlock = async (block: Block): Promise<void> => {
  const db = await getDB();
  await db.put('blocks', block);
};

export const dbDeleteBlock = async (id: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['blocks', 'tasks', 'notes', 'attachments'], 'readwrite');
  
  // Delete block
  await tx.objectStore('blocks').delete(id);
  
  // Delete associated tasks
  const taskIndex = tx.objectStore('tasks').index('by-block');
  let taskCursor = await taskIndex.openCursor(IDBKeyRange.only(id));
  while (taskCursor) {
    await taskCursor.delete();
    taskCursor = await taskCursor.continue();
  }

  // Delete associated notes
  const notesIndex = tx.objectStore('notes').index('by-block');
  let noteCursor = await notesIndex.openCursor(IDBKeyRange.only(id));
  while (noteCursor) {
    await noteCursor.delete();
    noteCursor = await noteCursor.continue();
  }

  // Delete associated attachments
  const attachIndex = tx.objectStore('attachments').index('by-block');
  let attachCursor = await attachIndex.openCursor(IDBKeyRange.only(id));
  while (attachCursor) {
    await attachCursor.delete();
    attachCursor = await attachCursor.continue();
  }

  await tx.done;
};

// Tasks
export const dbGetTasksByBlock = async (blockId: string): Promise<Task[]> => {
  const db = await getDB();
  return db.getAllFromIndex('tasks', 'by-block', blockId);
};

export const dbGetAllTasks = async (): Promise<Task[]> => {
  const db = await getDB();
  return db.getAll('tasks');
};

export const dbSaveTask = async (task: Task): Promise<void> => {
  const db = await getDB();
  await db.put('tasks', task);
};

export const dbDeleteTask = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('tasks', id);
};

// Notes
export const dbGetNotesByBlock = async (blockId: string): Promise<Note[]> => {
  const db = await getDB();
  return db.getAllFromIndex('notes', 'by-block', blockId);
};

export const dbGetAllNotes = async (): Promise<Note[]> => {
  const db = await getDB();
  return db.getAll('notes');
};

export const dbSaveNote = async (note: Note): Promise<void> => {
  const db = await getDB();
  await db.put('notes', note);
};

export const dbDeleteNote = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('notes', id);
};

// Attachments
export const dbGetAttachmentsByBlock = async (blockId: string): Promise<Attachment[]> => {
  const db = await getDB();
  return db.getAllFromIndex('attachments', 'by-block', blockId);
};

export const dbGetAllAttachments = async (): Promise<Attachment[]> => {
  const db = await getDB();
  return db.getAll('attachments');
};

export const dbSaveAttachment = async (attachment: Attachment): Promise<void> => {
  const db = await getDB();
  await db.put('attachments', attachment);
};

export const dbDeleteAttachment = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('attachments', id);
};

// Settings
export const dbGetSettings = async (): Promise<AppSettings> => {
  const db = await getDB();
  const settings = await db.get('settings', 'app_settings');
  return settings ? { ...DEFAULT_SETTINGS, ...settings } : DEFAULT_SETTINGS;
};

export const dbSaveSettings = async (settings: AppSettings): Promise<void> => {
  const db = await getDB();
  await db.put('settings', settings, 'app_settings');
};

// Seed initial data
export const dbSeedInitialData = async (): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['blocks', 'tasks', 'notes', 'settings'], 'readwrite');

  for (const block of SEED_BLOCKS) {
    await tx.objectStore('blocks').put(block);
  }
  for (const task of SEED_TASKS) {
    await tx.objectStore('tasks').put(task);
  }
  for (const note of SEED_NOTES) {
    await tx.objectStore('notes').put(note);
  }
  await tx.objectStore('settings').put(DEFAULT_SETTINGS, 'app_settings');

  await tx.done;
};

// Backup and Restore (JSON Export / Import)
export interface ExportDataPayload {
  version: number;
  exportedAt: string;
  blocks: Block[];
  tasks: Task[];
  notes: Note[];
  attachments: {
    id: string;
    blockId: string;
    name: string;
    size: number;
    type: AttachmentType;
    mimeType: string;
    dataUrl?: string;
    createdAt: number;
  }[];
  settings: AppSettings;
}

export const dbExportAllData = async (): Promise<string> => {
  const db = await getDB();
  const blocks = await db.getAll('blocks');
  const tasks = await db.getAll('tasks');
  const notes = await db.getAll('notes');
  const attachments = await db.getAll('attachments');
  const settings = await dbGetSettings();

  const exportPayload: ExportDataPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    blocks,
    tasks,
    notes,
    attachments: attachments.map(att => ({
      id: att.id,
      blockId: att.blockId,
      name: att.name,
      size: att.size,
      type: att.type,
      mimeType: att.mimeType,
      dataUrl: att.dataUrl,
      createdAt: att.createdAt,
    })),
    settings,
  };

  return JSON.stringify(exportPayload, null, 2);
};

export const dbImportAllData = async (jsonString: string): Promise<{ success: boolean; message: string }> => {
  try {
    const payload: ExportDataPayload = JSON.parse(jsonString);

    if (!payload.blocks || !Array.isArray(payload.blocks)) {
      return { success: false, message: 'Invalid data format: Blocks array missing' };
    }

    const db = await getDB();
    const tx = db.transaction(['blocks', 'tasks', 'notes', 'attachments', 'settings'], 'readwrite');

    await tx.objectStore('blocks').clear();
    await tx.objectStore('tasks').clear();
    await tx.objectStore('notes').clear();
    await tx.objectStore('attachments').clear();

    for (const block of payload.blocks) {
      await tx.objectStore('blocks').put(block);
    }
    if (payload.tasks && Array.isArray(payload.tasks)) {
      for (const task of payload.tasks) {
        await tx.objectStore('tasks').put(task);
      }
    }
    if (payload.notes && Array.isArray(payload.notes)) {
      for (const note of payload.notes) {
        await tx.objectStore('notes').put(note);
      }
    }
    if (payload.attachments && Array.isArray(payload.attachments)) {
      for (const att of payload.attachments) {
        await tx.objectStore('attachments').put(att);
      }
    }
    if (payload.settings) {
      await tx.objectStore('settings').put(payload.settings, 'app_settings');
    }

    await tx.done;
    return { success: true, message: `Successfully restored ${payload.blocks.length} blocks, ${payload.tasks?.length || 0} tasks, and ${payload.attachments?.length || 0} attachments.` };
  } catch (err: any) {
    return { success: false, message: `Import error: ${err.message}` };
  }
};

export const dbClearAllData = async (): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['blocks', 'tasks', 'notes', 'attachments', 'settings'], 'readwrite');
  await tx.objectStore('blocks').clear();
  await tx.objectStore('tasks').clear();
  await tx.objectStore('notes').clear();
  await tx.objectStore('attachments').clear();
  await tx.done;
};
