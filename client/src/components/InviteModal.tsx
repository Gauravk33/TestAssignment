import React, { useState } from 'react';
import { UserPlus, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api.js';

interface InviteModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ workspaceId, isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      await api.post(`/workspaces/${workspaceId}/invite`, {
        email: email.trim(),
        role,
      });
      setResult({ success: true, message: `Successfully invited ${email} as ${role}!` });
      setEmail('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setResult({
        success: false,
        message: err.response?.data?.error || err.message || 'Failed to invite user',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: '480px',
        background: 'var(--bg-card)', border: '1px solid var(--border-active)',
        borderRadius: '12px', boxShadow: 'var(--shadow-card)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-header)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
              Invite Team Member (RBAC)
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleInvite} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '6px' }}>
              Colleague's Registered Email
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. colleague@teamspace.dev"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '6px',
                background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '6px' }}>
              RBAC Role Permission
            </label>
            <select
              value={role}
              onChange={(e: any) => setRole(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '6px',
                background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
              }}
            >
              <option value="admin">Admin (Invite members, edit workspace)</option>
              <option value="editor">Editor (Create docs, cards, chat)</option>
              <option value="viewer">Viewer (Read-only access)</option>
            </select>
          </div>

          {result && (
            <div style={{
              padding: '10px 14px', borderRadius: '6px', marginBottom: '16px',
              background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              border: `1px solid ${result.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              {result.success ? <CheckCircle2 size={16} color="#34d399" /> : <AlertCircle size={16} color="#f43f5e" />}
              <span style={{ fontSize: '0.82rem', color: result.success ? '#34d399' : '#f43f5e', fontWeight: 500 }}>
                {result.message}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="btn-primary"
              style={{ padding: '8px 20px', fontSize: '0.85rem' }}
            >
              {isSubmitting ? 'Inviting...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
