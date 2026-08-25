import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../lib/api.js';
import {
  Layers,
  LogOut,
  ShieldCheck,
  FileText,
  Trello,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Database,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, workspaces, currentWorkspace, setCurrentWorkspace, logout } = useAuthStore();
  const [rbacTestResult, setRbacTestResult] = useState<any>(null);
  const [isTestingRbac, setIsTestingRbac] = useState(false);
  const [healthInfo, setHealthInfo] = useState<any>(null);

  useEffect(() => {
    if (id && workspaces.length > 0) {
      const match = workspaces.find((w) => w.id === id);
      if (match) {
        setCurrentWorkspace(match);
      }
    }
  }, [id, workspaces, setCurrentWorkspace]);

  useEffect(() => {
    // Fetch system health
    api.get('/health')
      .then((res) => setHealthInfo(res.data))
      .catch((err) => console.error('Health fetch error:', err));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleTestRbac = async () => {
    if (!currentWorkspace?.id) return;
    setIsTestingRbac(true);
    try {
      const res = await api.get(`/workspaces/${currentWorkspace.id}/test-role`);
      setRbacTestResult({ success: true, data: res.data });
    } catch (err: any) {
      setRbacTestResult({
        success: false,
        error: err.response?.data?.error || err.message || 'RBAC verification failed',
      });
    } finally {
      setIsTestingRbac(false);
    }
  };

  const userRole = currentWorkspace?.role || 'owner';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Navbar */}
      <header style={{
        height: '60px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(11, 15, 25, 0.8)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 10,
      }}>
        {/* Workspace Brand & Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            boxShadow: '0 0 12px var(--primary-glow)',
          }}>
            <Layers size={18} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                {currentWorkspace?.name || 'My Workspace'}
              </span>
              <span className={`badge badge-${userRole}`}>
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* User Profile & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#ffffff',
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user?.name || 'User'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {user?.email}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            id="btn-logout"
            className="btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.82rem' }}
            title="Log out of TeamSpace"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Workspace Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <aside style={{
          width: '260px',
          borderRight: '1px solid var(--border-subtle)',
          background: 'rgba(15, 21, 34, 0.5)',
          padding: '20px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', paddingLeft: '8px' }}>
              Workspace Views (Day 1-2)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="glass-card" style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', cursor: 'default' }}>
                <FileText size={16} color="var(--primary-light)" />
                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Notion Docs</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-dim)' }}>Day 1</span>
              </div>

              <div className="glass-card" style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', cursor: 'default' }}>
                <Trello size={16} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Trello Boards</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-dim)' }}>Day 1</span>
              </div>

              <div className="glass-card" style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', cursor: 'default' }}>
                <MessageSquare size={16} color="var(--accent-purple)" />
                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Slack Channels</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-dim)' }}>Day 1</span>
              </div>
            </div>
          </div>

          {/* System Status Pill */}
          <div style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} className="animate-pulse" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399' }}>Auth & API Active</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              JWT Access + httpOnly Refresh Token active
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '36px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Day 0 Milestone Banner */}
            <div className="glass-panel glow-primary" style={{ padding: '32px', marginBottom: '28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '12px' }}>
                    <Sparkles size={14} color="#818cf8" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818cf8' }}>DAY 0 COMPLETE</span>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                    Setup & Authentication Skeleton Ready
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    You have successfully registered, obtained a short-lived JWT access token and rotated refresh token cookie, and booted the workspace environment.
                  </p>
                </div>
              </div>

              {/* Status Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
                marginTop: '24px',
              }}>
                <div className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', marginBottom: '6px' }}>
                    <KeyRound size={18} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>JWT Auth</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Verified & Bearer active</p>
                </div>

                <div className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-purple)', marginBottom: '6px' }}>
                    <RefreshCw size={18} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Silent Refresh</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>7-day httpOnly cookie</p>
                </div>

                <div className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                    <Database size={18} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Database</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {healthInfo?.services?.database?.status || 'Connected'}
                  </p>
                </div>

                <div className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', marginBottom: '6px' }}>
                    <ShieldCheck size={18} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>RBAC Model</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Role: {userRole}</p>
                </div>
              </div>
            </div>

            {/* RBAC Middleware Interactive Verifier */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>
                    RBAC Middleware Verification
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Test the backend <code>requireRole(['owner', 'admin'])</code> middleware for workspace <code>{currentWorkspace?.id}</code>
                  </p>
                </div>

                <button
                  onClick={handleTestRbac}
                  id="btn-test-rbac"
                  disabled={isTestingRbac}
                  className="btn-primary"
                  style={{ padding: '9px 16px', fontSize: '0.88rem' }}
                >
                  <ShieldCheck size={16} />
                  <span>{isTestingRbac ? 'Verifying...' : 'Test RBAC Middleware'}</span>
                </button>
              </div>

              {rbacTestResult && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: rbacTestResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                  border: `1px solid ${rbacTestResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {rbacTestResult.success ? (
                      <CheckCircle2 size={18} color="#34d399" />
                    ) : (
                      <ShieldCheck size={18} color="#f43f5e" />
                    )}
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: rbacTestResult.success ? '#34d399' : '#f43f5e' }}>
                      {rbacTestResult.success ? 'RBAC Check Passed (200 OK)' : 'RBAC Check Failed'}
                    </span>
                  </div>
                  <pre style={{
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    overflowX: 'auto',
                  }}>
                    {JSON.stringify(rbacTestResult.data || rbacTestResult.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
