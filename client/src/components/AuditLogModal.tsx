import React, { useEffect, useState } from 'react';
import { ShieldCheck, X, Loader, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api.js';

interface AuditLogModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ workspaceId, isOpen, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async (p: number) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/audit-logs?workspaceId=${workspaceId}&page=${p}&limit=10`);
      const data = res.data.data || res.data;
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(p);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchLogs(1);
    }
  }, [isOpen, workspaceId]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: '680px',
        background: 'var(--bg-card)', border: '1px solid var(--border-active)',
        borderRadius: '12px', boxShadow: 'var(--shadow-card)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        maxHeight: '85vh',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-header)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
              Audit Trail (MongoDB Atomic Transactions)
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px' }}>
              <Loader size={20} color="var(--primary)" className="animate-spin" />
              <span style={{ color: 'var(--text-dim)' }}>Loading audit records...</span>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              No audit logs recorded yet. Drag cards or modify pages to record transactional audit events!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.map((log) => {
                const actorName = log.actorId?.name || 'System User';
                const timeStr = new Date(log.createdAt).toLocaleString();
                return (
                  <div key={log._id} style={{
                    padding: '12px 14px', borderRadius: '8px',
                    background: 'var(--bg-sidebar)', border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px',
                          borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)',
                        }}>
                          {log.action}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                          {actorName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <Clock size={12} />
                        <span>{timeStr}</span>
                      </div>
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre style={{
                        margin: '6px 0 0', padding: '6px 10px', borderRadius: '4px',
                        background: 'var(--bg-input)', fontSize: '0.75rem', color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)', overflowX: 'auto',
                      }}>
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '12px 20px', borderTop: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--bg-header)',
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1 || isLoading}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
