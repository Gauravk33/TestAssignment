import React, { useEffect, useRef, useState } from 'react';
import { Plus, Type, Heading1, Heading2, Heading3, CheckSquare, List, Code, Trash2, Loader } from 'lucide-react';
import { usePageStore, Block } from '../store/pageStore.js';
import { getSocket } from '../lib/socket.js';

const BLOCK_TYPE_ICONS: Record<string, React.ReactNode> = {
  heading1: <Heading1 size={14} />,
  heading2: <Heading2 size={14} />,
  heading3: <Heading3 size={14} />,
  todo: <CheckSquare size={14} />,
  bullet: <List size={14} />,
  code: <Code size={14} />,
  text: <Type size={14} />,
  callout: <span style={{ fontSize: 12 }}>💡</span>,
  image: <span style={{ fontSize: 12 }}>🖼️</span>,
};

const BLOCK_TYPES = ['text', 'heading1', 'heading2', 'heading3', 'todo', 'bullet', 'code', 'callout'];

const BlockEditor: React.FC<{
  block: Block;
  onUpdate: (id: string, content: any) => void;
  onDelete: (id: string) => void;
}> = ({ block, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(block.content?.text || '');
  const [checked, setChecked] = useState(block.content?.checked || false);
  const [hovered, setHovered] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setText(block.content?.text || '');
    setChecked(block.content?.checked || false);
  }, [block]);

  const handleChange = (val: string) => {
    setText(val);
    onUpdate(block._id || block.id, { text: val }); // optimistic
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      usePageStore.getState().updateBlock(block._id || block.id, { text: val });
    }, 800);
  };

  const handleCheck = (val: boolean) => {
    setChecked(val);
    onUpdate(block._id || block.id, { checked: val });
    usePageStore.getState().updateBlock(block._id || block.id, { text, checked: val });
  };

  const getStyle = (): React.CSSProperties => {
    switch (block.type) {
      case 'heading1': return { fontSize: '1.8rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 };
      case 'heading2': return { fontSize: '1.35rem', fontWeight: 700, color: '#e5e7eb', lineHeight: 1.3 };
      case 'heading3': return { fontSize: '1.1rem', fontWeight: 600, color: '#d1d5db', lineHeight: 1.4 };
      case 'code': return {
        fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#86efac',
        background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
      };
      case 'callout': return {
        padding: '12px 16px', background: 'rgba(99,102,241,0.1)',
        borderRadius: '8px', border: '1px solid rgba(99,102,241,0.25)',
        color: '#a5b4fc', fontSize: '0.9rem',
      };
      case 'bullet': return { color: 'var(--text-muted)', fontSize: '0.95rem' };
      default: return { color: 'var(--text-muted)', fontSize: '0.95rem' };
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px', position: 'relative' }}
    >
      {/* Bullet prefix */}
      {block.type === 'bullet' && (
        <span style={{ color: 'var(--primary-light)', marginTop: '3px', minWidth: '16px' }}>•</span>
      )}

      {/* Todo checkbox */}
      {block.type === 'todo' && (
        <input
          type="checkbox"
          checked={checked}
          onChange={e => handleCheck(e.target.checked)}
          style={{ marginTop: '4px', minWidth: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
        />
      )}

      {/* Editable content */}
      <div style={{ flex: 1 }}>
        {editing ? (
          <textarea
            autoFocus
            value={text}
            onChange={e => handleChange(e.target.value)}
            onBlur={() => setEditing(false)}
            placeholder={`${block.type}...`}
            rows={block.type === 'code' ? 4 : 2}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.4)',
              borderRadius: '6px',
              padding: '6px 10px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              ...getStyle(),
            }}
          />
        ) : (
          <div
            onClick={() => setEditing(true)}
            style={{
              cursor: 'text',
              padding: '3px 6px',
              borderRadius: '6px',
              minHeight: '28px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              textDecoration: (block.type === 'todo' && checked) ? 'line-through' : 'none',
              opacity: (block.type === 'todo' && checked) ? 0.5 : 1,
              ...getStyle(),
            }}
          >
            {text || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontWeight: 400, fontSize: '0.9rem' }}>
              Click to edit...
            </span>}
          </div>
        )}
      </div>

      {/* Delete button */}
      {hovered && (
        <button
          onClick={() => onDelete(block._id || block.id)}
          title="Delete block"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#f87171', padding: '4px', borderRadius: '4px',
            display: 'flex', alignItems: 'center', marginTop: '2px',
            opacity: 0.7,
          }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
};

interface DocViewProps {
  pageId: string;
  pageTitle: string;
}

export const DocView: React.FC<DocViewProps> = ({ pageId, pageTitle }) => {
  const { blocks, isLoadingBlocks, fetchBlocks, updateBlockLocal, createBlock, deleteBlock } = usePageStore();
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  useEffect(() => {
    fetchBlocks(pageId);

    // Socket.io: listen for block real-time events from other users
    const socket = getSocket();
    const handleSync = (data: any) => {
      const targetPageId = (data?.block?.pageId || data?.pageId)?.toString();
      if (!targetPageId || targetPageId === pageId.toString()) {
        fetchBlocks(pageId);
      }
    };

    socket.on('block:updated', handleSync);
    socket.on('block:created', handleSync);
    socket.on('block:deleted', handleSync);
    socket.on('block:reordered', handleSync);

    return () => {
      socket.off('block:updated', handleSync);
      socket.off('block:created', handleSync);
      socket.off('block:deleted', handleSync);
      socket.off('block:reordered', handleSync);
    };
  }, [pageId]);

  const handleAddBlock = async (type: string) => {
    await createBlock(pageId, type, { text: '' });
    setShowTypeMenu(false);
  };

  if (isLoadingBlocks) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
        <Loader size={20} color="var(--text-dim)" className="animate-spin" />
        <span style={{ color: 'var(--text-dim)' }}>Loading document...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px', height: '100%' }}>
      {/* Page title */}
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
        📝 {pageTitle}
      </h1>

      {/* Blocks */}
      <div style={{ marginBottom: '24px' }}>
        {blocks.length === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.9rem' }}>
            No blocks yet. Click "Add Block" to start writing.
          </p>
        ) : (
          blocks
            .slice()
            .sort((a, b) => a.position - b.position)
            .map(block => (
              <BlockEditor
                key={block._id || block.id}
                block={block}
                onUpdate={updateBlockLocal}
                onDelete={deleteBlock}
              />
            ))
        )}
      </div>

      {/* Add block button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowTypeMenu(x => !x)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px dashed var(--border-subtle)',
            color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.85rem',
          }}
        >
          <Plus size={15} /> Add Block
        </button>

        {showTypeMenu && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 50,
            background: '#1a2235', border: '1px solid var(--border-subtle)',
            borderRadius: '10px', padding: '6px', minWidth: '200px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', marginTop: '4px',
          }}>
            {BLOCK_TYPES.map(type => (
              <button
                key={type}
                onClick={() => handleAddBlock(type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '8px 12px', borderRadius: '6px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {BLOCK_TYPE_ICONS[type] || <Type size={14} />}
                <span style={{ textTransform: 'capitalize' }}>{type}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
