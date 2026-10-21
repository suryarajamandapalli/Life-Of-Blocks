import React, { useState, useRef } from 'react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

export interface WebAppItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export const DEFAULT_WEB_APPS: WebAppItem[] = [
  { id: 'app-insta', title: 'Instagram', url: 'https://instagram.com' },
  { id: 'app-linkedin', title: 'LinkedIn', url: 'https://linkedin.com' },
  { id: 'app-github', title: 'GitHub', url: 'https://github.com' },
  { id: 'app-reddit', title: 'Reddit', url: 'https://reddit.com' },
  { id: 'app-youtube', title: 'YouTube', url: 'https://youtube.com' },
  { id: 'app-facebook', title: 'Facebook', url: 'https://facebook.com' },
  { id: 'app-x', title: 'X (Twitter)', url: 'https://x.com' },
  { id: 'app-discord', title: 'Discord', url: 'https://discord.com' },
  { id: 'app-spotify', title: 'Spotify', url: 'https://open.spotify.com' },
  { id: 'app-chatgpt', title: 'ChatGPT', url: 'https://chatgpt.com' },
  { id: 'app-notion', title: 'Notion', url: 'https://notion.so' },
  { id: 'app-gmail', title: 'Gmail', url: 'https://mail.google.com' },
];

export const getDomain = (url: string): string => {
  try {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '').trim();
  }
};

export const getAppIconUrl = (url: string, customIcon?: string): string => {
  if (customIcon && customIcon.trim().length > 0) return customIcon;
  const domain = getDomain(url);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
};

interface AppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps: WebAppItem[];
  onAddApp: (app: WebAppItem) => void;
  onDeleteApp: (id: string) => void;
  onReorderApps?: (apps: WebAppItem[]) => void;
}

export const AppLauncherModal: React.FC<AppLauncherModalProps> = ({
  isOpen,
  onClose,
  apps,
  onAddApp,
  onDeleteApp,
  onReorderApps,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const touchDraggedId = useRef<string | null>(null);

  if (!isOpen) return null;

  const filteredApps = apps.filter(
    (app) =>
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const previewDomain = newUrl ? getDomain(newUrl) : '';
  const previewIconUrl = previewDomain ? getAppIconUrl(newUrl) : '';

  const reorderApp = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const fromIndex = apps.findIndex((a) => a.id === sourceId);
    const toIndex = apps.findIndex((a) => a.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...apps];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    onReorderApps?.(next);
    soundService.playDrop();
    hapticsService.light();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = newTitle.trim();
    let cleanUrl = newUrl.trim();
    if (!cleanTitle || !cleanUrl) return;

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    soundService.playWoodPop();
    hapticsService.medium();

    const newApp: WebAppItem = {
      id: 'app-' + Date.now(),
      title: cleanTitle,
      url: cleanUrl,
    };

    onAddApp(newApp);
    setNewTitle('');
    setNewUrl('');
    setIsAdding(false);
  };

  const handleLaunch = (url: string) => {
    soundService.playTap();
    hapticsService.light();
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal apps-modal glass"
        style={{
          width: 'min(580px, 94vw)',
          maxHeight: '84vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '19px',
                fontWeight: 600,
                color: 'var(--c-content)',
                letterSpacing: '-0.3px',
              }}
            >
              Apps & Shortcuts
            </h2>
            <span style={{ fontSize: '11.5px', color: 'var(--c-muted)', fontWeight: 400 }}>
              · Drag to reorder
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                soundService.playTap();
                hapticsService.light();
                setIsAdding(!isAdding);
              }}
              style={{
                borderRadius: '999px',
                padding: '6px 14px',
                border: '1px solid var(--line)',
                background: isAdding ? 'var(--c-content)' : 'color-mix(in srgb, var(--c-light) 6%, transparent)',
                color: isAdding ? 'var(--c-bg)' : 'var(--c-content)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {isAdding ? 'Done' : '+ Add App'}
            </button>
            <button
              type="button"
              onClick={() => {
                soundService.playDismiss();
                onClose();
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid var(--line)',
                background: 'transparent',
                color: 'var(--c-muted)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Add App Inline Form */}
        {isAdding && (
          <form
            onSubmit={handleCreate}
            style={{
              padding: '16px',
              borderRadius: '18px',
              background: 'color-mix(in srgb, var(--c-light) 6%, transparent)',
              border: '1px solid var(--line)',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-content)' }}>
              Add New Shortcut
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'color-mix(in srgb, var(--c-light) 8%, transparent)',
                  border: '1px solid var(--line)',
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {previewIconUrl ? (
                  <img
                    src={previewIconUrl}
                    alt="Preview"
                    style={{ width: '28px', height: '28px', borderRadius: '6px' }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '16px', color: 'var(--c-muted)' }}>🌐</span>
                )}
              </div>
              <input
                className="input"
                placeholder="Title (e.g. Figma, LeetCode)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', fontSize: '13px' }}
                required
              />
            </div>
            <div>
              <input
                className="input"
                placeholder="URL (e.g. figma.com)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                required
              />
              {previewDomain && (
                <div style={{ fontSize: '11px', color: 'var(--c-muted)', marginTop: '4px', paddingLeft: '2px' }}>
                  Icon source: <strong style={{ color: 'var(--c-content)' }}>{previewDomain}</strong>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button
                type="button"
                className="cancel"
                onClick={() => setIsAdding(false)}
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="create"
                style={{ padding: '6px 18px', fontSize: '12px' }}
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Search Bar */}
        <div style={{ marginBottom: '14px' }}>
          <input
            className="input"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '10px 16px',
              fontSize: '13.5px',
              borderRadius: '999px',
              background: 'color-mix(in srgb, var(--c-light) 4%, transparent)',
            }}
          />
        </div>

        {/* Apps Grid - Clean, spacious, NO FRAME around icons, DRAG & REORDER */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
            gap: '12px 6px',
            padding: '6px 2px 14px',
          }}
        >
          {filteredApps.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '36px 10px',
                color: 'var(--c-muted)',
                fontSize: '13px',
              }}
            >
              No matching apps found.
            </div>
          ) : (
            filteredApps.map((app) => {
              const domain = getDomain(app.url);
              const iconUrl = getAppIconUrl(app.url, app.icon);
              const isDragging = draggedId === app.id;
              const isOver = dragOverId === app.id && draggedId !== app.id;

              return (
                <div
                  key={app.id}
                  data-app-id={app.id}
                  draggable={!isAdding}
                  onDragStart={(e) => {
                    setDraggedId(app.id);
                    isDraggingRef.current = true;
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', app.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverId !== app.id) {
                      setDragOverId(app.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverId === app.id) {
                      setDragOverId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const sourceId = e.dataTransfer.getData('text/plain') || draggedId;
                    if (sourceId && sourceId !== app.id) {
                      reorderApp(sourceId, app.id);
                    }
                    setDraggedId(null);
                    setDragOverId(null);
                    setTimeout(() => {
                      isDraggingRef.current = false;
                    }, 80);
                  }}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDragOverId(null);
                    setTimeout(() => {
                      isDraggingRef.current = false;
                    }, 80);
                  }}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
                    touchDraggedId.current = app.id;
                  }}
                  onTouchMove={(e) => {
                    if (!touchStartPos.current || !touchDraggedId.current) return;
                    const touch = e.touches[0];
                    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
                    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
                    if (dx > 8 || dy > 8) {
                      isDraggingRef.current = true;
                      setDraggedId(touchDraggedId.current);
                      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
                      const appElem = elem?.closest('[data-app-id]') as HTMLElement;
                      if (appElem) {
                        const overId = appElem.getAttribute('data-app-id');
                        if (overId && overId !== touchDraggedId.current) {
                          setDragOverId(overId);
                        }
                      }
                    }
                  }}
                  onTouchEnd={() => {
                    if (isDraggingRef.current && touchDraggedId.current && dragOverId) {
                      reorderApp(touchDraggedId.current, dragOverId);
                    }
                    touchStartPos.current = null;
                    touchDraggedId.current = null;
                    setDraggedId(null);
                    setDragOverId(null);
                    setTimeout(() => {
                      isDraggingRef.current = false;
                    }, 80);
                  }}
                  onClick={() => {
                    if (isDraggingRef.current) return;
                    handleLaunch(app.url);
                  }}
                  style={{
                    position: 'relative',
                    padding: '10px 4px',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    opacity: isDragging ? 0.3 : 1,
                    transform: isOver ? 'scale(1.08)' : isDragging ? 'scale(0.95)' : 'none',
                    outline: isOver ? '2px dashed rgba(255, 255, 255, 0.5)' : 'none',
                    background: isOver ? 'color-mix(in srgb, var(--c-light) 10%, transparent)' : 'transparent',
                    transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.15s ease, background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isDraggingRef.current) {
                      e.currentTarget.style.background = 'color-mix(in srgb, var(--c-light) 5%, transparent)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      const del = e.currentTarget.querySelector('.app-del-btn') as HTMLElement;
                      if (del) del.style.opacity = '0.75';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDraggingRef.current && !isOver) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'none';
                      const del = e.currentTarget.querySelector('.app-del-btn') as HTMLElement;
                      if (del) del.style.opacity = '0';
                    }
                  }}
                >
                  {/* Delete button (quiet, visible on hover) */}
                  <button
                    type="button"
                    className="app-del-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundService.playDismiss();
                      hapticsService.light();
                      onDeleteApp(app.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '8px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '0',
                      background: 'rgba(0,0,0,0.65)',
                      color: '#fff',
                      fontSize: '12px',
                      lineHeight: 1,
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      opacity: 0,
                      transition: 'opacity 0.15s ease',
                      zIndex: 3,
                    }}
                    title="Remove app"
                    aria-label="Remove app"
                  >
                    ×
                  </button>

                  {/* App Icon - NO FRAME BOX */}
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      display: 'grid',
                      placeItems: 'center',
                      marginBottom: '7px',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={iconUrl}
                      alt={app.title}
                      draggable={false}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.32))',
                        transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        pointerEvents: 'none',
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('icon.horse')) {
                          target.src = `https://icon.horse/icon/${domain}`;
                        } else {
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `<div style="width: 46px; height: 46px; border-radius: 12px; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(8px); display: grid; place-items: center; font-weight: 700; font-size: 19px; color: var(--c-content); box-shadow: 0 4px 12px rgba(0,0,0,0.25);">${app.title.slice(0, 1).toUpperCase()}</div>`;
                        }
                      }}
                    />
                  </div>

                  {/* App Title */}
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--c-content)',
                      maxWidth: '88px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      opacity: 0.9,
                    }}
                  >
                    {app.title}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
