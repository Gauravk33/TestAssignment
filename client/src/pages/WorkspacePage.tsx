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
import { connectSocket, disconnectSocket, joinWorkspace, joinPage } from '../lib/socket.js';
import {
  Layers,
  LogOut,
  MessageCircle,
  WifiOff,
} from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, workspaces, currentWorkspace, setCurrentWorkspace, logout, token } = useAuthStore();
  const { activePage, isOffline } = usePageStore();
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (id && workspaces.length > 0) {
      const match = workspaces.find((w) => w.id === id);
      if (match) {
        setCurrentWorkspace(match);
      }
    }
  }, [id, workspaces, setCurrentWorkspace]);

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
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Select a page
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '300px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
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
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 10,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '30px', height: '30px', borderRadius: '7px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            boxShadow: '0 0 10px var(--primary-glow)',
          }}>
            <Layers size={16} color="#ffffff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
            {currentWorkspace?.name || 'TeamSpace'}
          </span>
          <span className={`badge badge-${userRole}`} style={{
            fontSize: '0.65rem', padding: '1px 8px', borderRadius: '999px', fontWeight: 600,
          }}>
            {userRole}
          </span>
        </div>

        {/* Page title indicator */}
        {activePage && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.04)',
            padding: '4px 12px', borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
          }}>
            <span style={{ fontSize: '0.8rem' }}>
              {activePage.icon || (activePage.type === 'doc' ? '📝' : activePage.type === 'board' ? '📋' : '💬')}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              {activePage.title}
            </span>
            <span style={{
              fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
              padding: '1px 6px', borderRadius: '4px',
              background: activePage.type === 'doc' ? 'rgba(99,102,241,0.15)' : activePage.type === 'board' ? 'rgba(6,182,212,0.15)' : 'rgba(168,85,247,0.15)',
              color: activePage.type === 'doc' ? '#a5b4fc' : activePage.type === 'board' ? '#67e8f9' : '#c084fc',
            }}>
              {activePage.type}
            </span>
          </div>
        )}

        {/* User + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Comments toggle */}
          {activePage && (
            <button
              onClick={() => setShowComments(c => !c)}
              title="Toggle comments"
              style={{
                width: '34px', height: '34px', borderRadius: '8px',
                border: `1px solid ${showComments ? 'rgba(99,102,241,0.4)' : 'var(--border-subtle)'}`,
                background: showComments ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: showComments ? '#a5b4fc' : 'var(--text-dim)',
              }}
            >
              <MessageCircle size={15} />
            </button>
          )}

          <DarkModeToggle />

          {/* User avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: '0.8rem', color: '#ffffff',
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              {user?.name || 'User'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              width: '34px', height: '34px', borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(255,255,255,0.05)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-dim)',
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sidebar workspaceId={workspaceId} />

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
    </div>
  );
};
