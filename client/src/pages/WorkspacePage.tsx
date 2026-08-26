import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { usePageStore } from '../store/pageStore.js';
import { Sidebar } from '../components/Sidebar.js';
import { DocView } from '../components/DocView.js';
import { BoardView } from '../components/BoardView.js';
import { ChannelView } from '../components/ChannelView.js';
import { CommentsPanel } from '../components/CommentsPanel.js';
import { ErrorBoundary } from '../components/ErrorBoundary.js';
import { DarkModeToggle } from '../components/DarkModeToggle.js';
import { SearchModal } from '../components/SearchModal.js';
import { AnalyticsModal } from '../components/AnalyticsModal.js';
import { AuditLogModal } from '../components/AuditLogModal.js';
import { InviteModal } from '../components/InviteModal.js';
import { connectSocket, disconnectSocket, joinWorkspace, joinPage } from '../lib/socket.js';
import {
  Layers,
  LogOut,
  MessageCircle,
  WifiOff,
  Search,
  BarChart3,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, workspaces, currentWorkspace, setCurrentWorkspace, logout, token } = useAuthStore();
  const { activePage, isOffline } = usePageStore();
  const [showComments, setShowComments] = useState(false);

  // Modals
  const [showSearch, setShowSearch] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (id && workspaces.length > 0) {
      const match = workspaces.find((w) => w.id === id);
      if (match) {
        setCurrentWorkspace(match);
      }
    }
    if (id && activePage && activePage.workspaceId && activePage.workspaceId !== id) {
      usePageStore.getState().setActivePage(null as any);
    }
  }, [id, workspaces, setCurrentWorkspace, activePage]);

  // Connect Socket.io when workspace loads
  useEffect(() => {
    if (token && id) {
      const socket = connectSocket(token);
      socket.on('connect', () => {
        console.log('[Socket] Connected, joining workspace:', id);
        joinWorkspace(id);
      });
    }
    return () => {
      disconnectSocket();
    };
  }, [token, id]);

  // Join page room when active page changes
  useEffect(() => {
    if (activePage) {
      const pid = activePage._id || activePage.id;
      joinPage(pid);
    }
  }, [activePage]);

  const handleLogout = async () => {
    disconnectSocket();
    await logout();
    navigate('/login', { replace: true });
  };

  const userRole = currentWorkspace?.role || 'owner';
  const workspaceId = id || currentWorkspace?.id || '';

  const renderPageView = () => {
    if (!activePage) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: '16px',
        }}>
          <div style={{ fontSize: '3rem' }}>📄</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
            Select a page
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '320px' }}>
            Choose a page from the sidebar, or create a new doc, board, or channel to get started.
          </p>
        </div>
      );
    }

    const pid = activePage._id || activePage.id;
    const ptitle = activePage.title;

    switch (activePage.type) {
      case 'doc':
        return <DocView pageId={pid} pageTitle={ptitle} />;
      case 'board':
        return <BoardView pageId={pid} pageTitle={ptitle} />;
      case 'channel':
        return <ChannelView pageId={pid} pageTitle={ptitle} />;
      default:
        return <DocView pageId={pid} pageTitle={ptitle} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-main)' }}>
      {/* Offline banner */}
      {isOffline && (
        <div style={{
          background: 'rgba(234,179,8,0.15)', borderBottom: '1px solid rgba(234,179,8,0.3)',
          padding: '6px 24px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <WifiOff size={14} color="#eab308" />
          <span style={{ fontSize: '0.8rem', color: '#eab308', fontWeight: 600 }}>
            Offline — showing cached data
          </span>
        </div>
      )}

      {/* Top Navbar */}
      <header style={{
        height: '52px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-header)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 10,
      }}>
        {/* Brand & Workspace Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '30px', height: '30px', borderRadius: '7px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            boxShadow: '0 0 10px var(--primary-glow)',
          }}>
            <Layers size={16} color="#ffffff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-heading)' }}>
            {currentWorkspace?.name || 'TeamSpace'}
          </span>
          <span className={`badge badge-${userRole}`} style={{
            fontSize: '0.65rem', padding: '1px 8px', borderRadius: '999px', fontWeight: 600,
          }}>
            {userRole}
          </span>
        </div>

        {/* Global Search Bar (Ctrl+K) */}
        <button
          onClick={() => setShowSearch(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            padding: '5px 14px', borderRadius: '8px', cursor: 'pointer',
            minWidth: '220px', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
            <Search size={14} />
            <span>Search workspace...</span>
          </div>
          <kbd style={{
            fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px',
            background: 'var(--bg-sidebar)', color: 'var(--text-dim)',
            border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)',
          }}>
            Ctrl K
          </kbd>
        </button>

        {/* Power Tools Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Analytics Modal Button */}
          <button
            onClick={() => setShowAnalytics(true)}
            title="Workspace Analytics ($facet)"
            style={{
              padding: '6px 10px', borderRadius: '7px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              color: 'var(--text-heading)', fontSize: '0.8rem', fontWeight: 500,
            }}
          >
            <BarChart3 size={14} color="var(--primary)" />
            <span>Analytics</span>
          </button>

          {/* Audit Logs Modal Button */}
          <button
            onClick={() => setShowAuditLogs(true)}
            title="Audit Trail Logs"
            style={{
              padding: '6px 10px', borderRadius: '7px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              color: 'var(--text-heading)', fontSize: '0.8rem', fontWeight: 500,
            }}
          >
            <ShieldCheck size={14} color="var(--accent-emerald)" />
            <span>Audit</span>
          </button>

          {/* Invite Member Button */}
          {(userRole === 'owner' || userRole === 'admin') && (
            <button
              onClick={() => setShowInvite(true)}
              title="Invite Team Member (RBAC)"
              style={{
                padding: '6px 10px', borderRadius: '7px',
                border: '1px solid var(--border-active)',
                background: 'rgba(99, 102, 241, 0.1)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px',
                color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600,
              }}
            >
              <UserPlus size={14} />
              <span>Invite</span>
            </button>
          )}

          {/* Comments toggle */}
          {activePage && (
            <button
              onClick={() => setShowComments((c) => !c)}
              title="Toggle comments"
              style={{
                width: '32px', height: '32px', borderRadius: '7px',
                border: `1px solid ${showComments ? 'var(--border-active)' : 'var(--border-subtle)'}`,
                background: showComments ? 'var(--bg-item-active)' : 'var(--bg-card)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: showComments ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <MessageCircle size={15} />
            </button>
          )}

          <DarkModeToggle />

          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: '0.75rem', color: '#ffffff',
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              width: '32px', height: '32px', borderRadius: '7px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sidebar workspaceId={workspaceId} />

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
          <ErrorBoundary>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {renderPageView()}
            </div>
          </ErrorBoundary>
        </main>

        {/* Comments Panel */}
        {showComments && activePage && (
          <CommentsPanel
            targetType="page"
            targetId={activePage._id || activePage.id}
            workspaceId={workspaceId}
            onClose={() => setShowComments(false)}
          />
        )}
      </div>

      {/* 4 Interactive Power Modals */}
      <SearchModal
        workspaceId={workspaceId}
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />

      <AnalyticsModal
        workspaceId={workspaceId}
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />

      <AuditLogModal
        workspaceId={workspaceId}
        isOpen={showAuditLogs}
        onClose={() => setShowAuditLogs(false)}
      />

      <InviteModal
        workspaceId={workspaceId}
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
      />
    </div>
  );
};
