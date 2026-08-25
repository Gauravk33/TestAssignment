import React, { useEffect, useState } from 'react';
import {
  FileText, Trello, MessageSquare, ChevronRight, ChevronDown,
  Plus, Trash2, Loader, Users,
} from 'lucide-react';
import { usePageStore, Page } from '../store/pageStore.js';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../lib/api.js';

interface SidebarProps {
  workspaceId: string;
}

const PAGE_ICONS: Record<string, string> = {
  doc: '📝',
  board: '📋',
  channel: '💬',
};

const PAGE_COLORS: Record<string, string> = {
  doc: 'var(--primary-light)',
  board: 'var(--accent-cyan)',
  channel: 'var(--accent-purple)',
};

const PageIcon: React.FC<{ type: string; icon?: string; size?: number }> = ({ type, icon, size = 15 }) => {
  if (icon && icon.length <= 2) return <span style={{ fontSize: size }}>{icon}</span>;
  if (type === 'board') return <Trello size={size} color={PAGE_COLORS.board} />;
  if (type === 'channel') return <MessageSquare size={size} color={PAGE_COLORS.channel} />;
  return <FileText size={size} color={PAGE_COLORS.doc} />;
};

const PageTreeItem: React.FC<{
  page: Page;
  depth: number;
  activePage: Page | null;
  onSelect: (page: Page) => void;
  onDelete: (pageId: string) => void;
}> = ({ page, depth, activePage, onSelect, onDelete }) => {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const hasChildren = page.children && page.children.length > 0;
  const isActive = activePage?._id === page._id || activePage?.id === page._id;

  return (
    <div>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          paddingLeft: `${8 + depth * 16}px`,
          borderRadius: '6px',
          cursor: 'pointer',
          background: isActive
            ? 'rgba(99, 102, 241, 0.15)'
            : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
          border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
          transition: 'all 0.15s',
          userSelect: 'none',
        }}
        onClick={() => onSelect(page)}
      >
        {hasChildren ? (
          <span
            onClick={(e) => { e.stopPropagation(); setExpanded(x => !x); }}
            style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        ) : (
          <span style={{ width: 13 }} />
        )}

        <PageIcon type={page.type} icon={page.icon} />

        <span style={{
          fontSize: '0.85rem',
          fontWeight: isActive ? 600 : 400,
          color: isActive ? '#ffffff' : 'var(--text-muted)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {page.title}
        </span>

        {hovered && (
          <span
            onClick={(e) => { e.stopPropagation(); onDelete(page._id || page.id); }}
            title="Delete page"
            style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', padding: '2px' }}
          >
            <Trash2 size={12} />
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {page.children!.map(child => (
            <PageTreeItem
              key={child._id || child.id}
              page={child}
              depth={depth + 1}
              activePage={activePage}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ workspaceId }) => {
  const { pageTree, isLoadingTree, fetchPageTree, activePage, setActivePage, createPage, deletePage } = usePageStore();
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useAuthStore();
  const [showNewPage, setShowNewPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageType, setNewPageType] = useState<'doc' | 'board' | 'channel'>('doc');
  const [members, setMembers] = useState<any[]>([]);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    fetchPageTree(workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    api.get(`/workspaces/${workspaceId}`)
      .then(r => setMembers(r.data?.data?.members || r.data?.members || []))
      .catch(() => {});
  }, [workspaceId]);

  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) return;
    const page = await createPage(workspaceId, { title: newPageTitle, type: newPageType });
    setNewPageTitle('');
    setShowNewPage(false);
    if (page) setActivePage(page);
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Delete this page and all its content?')) return;
    await deletePage(pageId);
  };

  const flatPages = (pages: Page[]): Page[] =>
    pages.flatMap(p => [p, ...(p.children ? flatPages(p.children) : [])]);

  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      borderRight: '1px solid var(--border-subtle)',
      background: 'rgba(13, 18, 30, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Workspace Switcher */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <select
          value={currentWorkspace?.id || ''}
          onChange={e => {
            const ws = workspaces.find(w => w.id === e.target.value);
            if (ws) setCurrentWorkspace(ws);
          }}
          style={{
            width: '100%',
            padding: '6px 8px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {workspaces.map(ws => (
            <option key={ws.id} value={ws.id} style={{ background: '#1a2235' }}>
              {ws.icon ? `${ws.icon} ` : ''}{ws.name}
            </option>
          ))}
        </select>
      </div>

      {/* Pages Section */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 8px 8px',
        }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Pages
          </span>
          <button
            onClick={() => setShowNewPage(x => !x)}
            title="New page"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-dim)', display: 'flex', alignItems: 'center',
              padding: '2px', borderRadius: '4px',
            }}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* New page form */}
        {showNewPage && (
          <div style={{ padding: '8px', marginBottom: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <input
              autoFocus
              value={newPageTitle}
              onChange={e => setNewPageTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreatePage()}
              placeholder="Page title..."
              style={{
                width: '100%', padding: '6px 8px', borderRadius: '6px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)', fontSize: '0.82rem', marginBottom: '8px',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              {(['doc', 'board', 'channel'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setNewPageType(t)}
                  style={{
                    flex: 1, padding: '4px', borderRadius: '6px', fontSize: '0.75rem',
                    cursor: 'pointer', fontWeight: newPageType === t ? 700 : 400,
                    background: newPageType === t ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    border: newPageType === t ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                    color: newPageType === t ? '#a5b4fc' : 'var(--text-dim)',
                  }}
                >
                  {PAGE_ICONS[t]} {t}
                </button>
              ))}
            </div>
            <button
              onClick={handleCreatePage}
              style={{
                width: '100%', padding: '6px', borderRadius: '6px',
                background: 'rgba(99,102,241,0.7)', border: 'none',
                color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Create Page
            </button>
          </div>
        )}

        {isLoadingTree ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <Loader size={16} color="var(--text-dim)" className="animate-spin" />
          </div>
        ) : pageTree.length === 0 ? (
          <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
            No pages yet. Click <strong>+</strong> to create one.
          </div>
        ) : (
          <div>
            {pageTree.map(page => (
              <PageTreeItem
                key={page._id || page.id}
                page={page}
                depth={0}
                activePage={activePage}
                onSelect={setActivePage}
                onDelete={handleDeletePage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Members Section */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '8px' }}>
        <button
          onClick={() => setShowMembers(x => !x)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
            padding: '7px 8px', background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-dim)', borderRadius: '6px',
            fontSize: '0.8rem',
          }}
        >
          <Users size={14} />
          <span style={{ flex: 1, textAlign: 'left' }}>Members ({members.length})</span>
          {showMembers ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {showMembers && (
          <div style={{ paddingLeft: '8px' }}>
            {members.map((m: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 4px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700, color: '#fff',
                }}>
                  {(m.user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1 }}>
                  {m.user?.name || 'Unknown'}
                </span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 600, padding: '1px 6px',
                  borderRadius: '999px', textTransform: 'uppercase',
                  background: m.role === 'owner' ? 'rgba(168,85,247,0.2)' : 'rgba(99,102,241,0.15)',
                  color: m.role === 'owner' ? '#c084fc' : '#a5b4fc',
                  border: m.role === 'owner' ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(99,102,241,0.25)',
                }}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
