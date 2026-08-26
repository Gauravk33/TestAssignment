import React, { useEffect, useState, useRef } from 'react';
import { Search, FileText, Trello, MessageSquare, X, Loader } from 'lucide-react';
import { api } from '../lib/api.js';
import { usePageStore } from '../store/pageStore.js';

interface SearchModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ workspaceId, isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setActivePage, pageTree } = usePageStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}&workspaceId=${workspaceId}`);
        setResults(res.data.data || res.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [query, workspaceId]);

  if (!isOpen) return null;

  const handleSelectPage = (pageId: string) => {
    // Find page in tree
    const findPage = (pages: any[]): any => {
      for (const p of pages) {
        if (p._id === pageId || p.id === pageId) return p;
        if (p.children) {
          const found = findPage(p.children);
          if (found) return found;
        }
      }
      return null;
    };
    const target = findPage(pageTree);
    if (target) {
      setActivePage(target);
      onClose();
    }
  };

  const pagesCount = results?.pages?.length || 0;
  const cardsCount = results?.cards?.length || 0;
  const messagesCount = results?.messages?.length || 0;
  const blocksCount = results?.blocks?.length || 0;
  const totalCount = pagesCount + cardsCount + messagesCount + blocksCount;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '80px',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: '580px',
        background: 'var(--bg-card)', border: '1px solid var(--border-active)',
        borderRadius: '12px', boxShadow: 'var(--shadow-card)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        maxHeight: '75vh',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-header)',
        }}>
          <Search size={18} color="var(--primary)" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs, cards, messages, or blocks... (Ctrl+K)"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-heading)', fontSize: '0.95rem',
            }}
          />
          {isLoading && <Loader size={16} color="var(--text-dim)" className="animate-spin" />}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Results Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {!query.trim() ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
              Type a search query to search across the entire workspace...
            </div>
          ) : isLoading ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
              Searching workspace...
            </div>
          ) : totalCount === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
              No results found for "{query}"
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Pages */}
              {pagesCount > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', paddingLeft: '6px' }}>
                    Pages ({pagesCount})
                  </div>
                  {results.pages.map((p: any) => (
                    <div key={p._id} onClick={() => handleSelectPage(p._id)} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                      borderRadius: '6px', cursor: 'pointer', background: 'var(--bg-item-hover)', marginBottom: '4px',
                    }}>
                      <FileText size={15} color="var(--primary)" />
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-heading)' }}>{p.title}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: 'auto', textTransform: 'uppercase' }}>{p.type}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cards */}
              {cardsCount > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', paddingLeft: '6px' }}>
                    Cards ({cardsCount})
                  </div>
                  {results.cards.map((c: any) => (
                    <div key={c._id} onClick={() => handleSelectPage(c.pageId)} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                      borderRadius: '6px', cursor: 'pointer', background: 'var(--bg-item-hover)', marginBottom: '4px',
                    }}>
                      <Trello size={15} color="var(--accent-cyan)" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-heading)' }}>{c.title}</div>
                        {c.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{c.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Messages */}
              {messagesCount > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', paddingLeft: '6px' }}>
                    Messages ({messagesCount})
                  </div>
                  {results.messages.map((m: any) => (
                    <div key={m._id} onClick={() => handleSelectPage(m.pageId)} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                      borderRadius: '6px', cursor: 'pointer', background: 'var(--bg-item-hover)', marginBottom: '4px',
                    }}>
                      <MessageSquare size={15} color="var(--accent-purple)" />
                      <div style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
