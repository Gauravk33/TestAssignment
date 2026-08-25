import React, { useEffect, useState } from 'react';
import { MessageCircle, Send, X, Loader } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';

interface Comment {
  _id: string;
  content: string;
  userId: any;
  parentId?: string | null;
  createdAt: string;
}

interface CommentsPanelProps {
  targetType: 'page' | 'block' | 'card';
  targetId: string;
  workspaceId: string;
  onClose: () => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ targetType, targetId, workspaceId, onClose }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments?targetId=${targetId}&targetType=${targetType}`);
      setComments(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [targetId, targetType]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await api.post('/comments', {
        targetType,
        targetId,
        workspaceId,
        content: input.trim(),
      });
      setInput('');
      await fetchComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      width: '300px', minWidth: '300px',
      borderLeft: '1px solid var(--border-subtle)',
      background: 'rgba(13,18,30,0.8)',
      display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageCircle size={16} color="var(--primary-light)" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Comments</span>
          <span style={{
            fontSize: '0.7rem', fontWeight: 600, padding: '1px 6px',
            borderRadius: '999px', background: 'rgba(99,102,241,0.2)',
            color: '#a5b4fc',
          }}>
            {comments.length}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-dim)', display: 'flex', padding: '4px',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Comments list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '8px' }}>
            <Loader size={14} color="var(--text-dim)" className="animate-spin" />
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Loading...</span>
          </div>
        ) : comments.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
            No comments yet.
          </div>
        ) : (
          comments.map(comment => {
            const commenter = typeof comment.userId === 'object' ? comment.userId : null;
            const name = commenter?.name || 'Unknown';
            const time = new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const date = new Date(comment.createdAt).toLocaleDateString();
            const isOwn = commenter?._id === user?.id;

            return (
              <div key={comment._id} style={{
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: isOwn
                      ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                      : 'linear-gradient(135deg, #06b6d4, #10b981)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', fontWeight: 700, color: '#fff',
                  }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isOwn ? '#a5b4fc' : '#67e8f9' }}>
                    {name}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{date} {time}</span>
                </div>
                <p style={{
                  margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)',
                  lineHeight: '1.4', paddingLeft: '30px',
                }}>
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'center',
          padding: '6px 10px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border-subtle)',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Write a comment..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-main)', fontSize: '0.82rem',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: input.trim() ? 'var(--primary)' : 'transparent',
              border: 'none', cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Send size={13} color={input.trim() ? '#fff' : 'var(--text-dim)'} />
          </button>
        </div>
      </div>
    </div>
  );
};
