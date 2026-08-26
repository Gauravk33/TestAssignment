import React, { useEffect, useState } from 'react';
import { BarChart3, X, Loader, Play, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api.js';

interface AnalyticsModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ workspaceId, isOpen, onClose }) => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggeringDigest, setIsTriggeringDigest] = useState(false);
  const [digestSuccess, setDigestSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !workspaceId) return;
    setIsLoading(true);
    api.get(`/workspaces/${workspaceId}/stats`)
      .then((res) => setStats(res.data.data || res.data))
      .catch((err) => console.error('Failed to fetch workspace stats:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen, workspaceId]);

  if (!isOpen) return null;

  const handleRunDigestJob = async () => {
    setIsTriggeringDigest(true);
    setDigestSuccess(null);
    try {
      const res = await api.post('/jobs/weekly-digest', { workspaceId });
      setDigestSuccess(`Job enqueued in BullMQ (Job ID: ${res.data.data?.jobId || 'digest-job'})`);
    } catch (err: any) {
      console.error('Digest trigger error:', err);
    } finally {
      setIsTriggeringDigest(false);
    }
  };

  const cardsByList = stats?.cardsByList || [];
  const blocksByType = stats?.blocksByType || [];
  const membersByRole = stats?.membersByRole || [];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: '640px',
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
            <BarChart3 size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
              Workspace Analytics & Aggregation ($facet)
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px' }}>
              <Loader size={20} color="var(--primary)" className="animate-spin" />
              <span style={{ color: 'var(--text-dim)' }}>Aggregating metrics with MongoDB $facet...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Total Cards</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    {cardsByList.reduce((acc: number, cur: any) => acc + cur.count, 0)}
                  </div>
                </div>
                <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Total Blocks</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)', marginTop: '4px' }}>
                    {blocksByType.reduce((acc: number, cur: any) => acc + cur.count, 0)}
                  </div>
                </div>
                <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Team Members</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                    {membersByRole.reduce((acc: number, cur: any) => acc + cur.count, 0)}
                  </div>
                </div>
              </div>

              {/* Cards By List breakdown */}
              {cardsByList.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                    Cards per List (Kanban)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {cardsByList.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-sidebar)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{item.listTitle || `List ${item._id}`}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.count} cards</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blocks by type */}
              {blocksByType.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                    Blocks by Content Type
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {blocksByType.map((item: any, i: number) => (
                      <div key={i} style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{item._id}:</span> {item.count}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BullMQ Trigger Action */}
              <div style={{
                padding: '16px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid var(--border-active)', display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                      BullMQ Background Digest Queue
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      Trigger Redis BullMQ worker to generate and log a weekly summary
                    </div>
                  </div>
                  <button
                    onClick={handleRunDigestJob}
                    disabled={isTriggeringDigest}
                    className="btn-primary"
                    style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                  >
                    <Play size={13} />
                    <span>{isTriggeringDigest ? 'Enqueuing...' : 'Trigger Job'}</span>
                  </button>
                </div>

                {digestSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
                    <CheckCircle2 size={14} />
                    <span>{digestSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
