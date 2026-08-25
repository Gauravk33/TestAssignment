import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Loader, ArrowUp } from 'lucide-react';
import { usePageStore, Message } from '../store/pageStore.js';
import { getSocket } from '../lib/socket.js';
import { useAuthStore } from '../store/authStore.js';

interface ChannelViewProps {
  pageId: string;
  pageTitle: string;
}

const MessageBubble: React.FC<{ msg: Message; isOwn: boolean }> = ({ msg, isOwn }) => {
  const user = msg.userId;
  const name = typeof user === 'object' ? (user.name || 'Unknown') : 'Unknown';
  const initial = name.charAt(0).toUpperCase();
  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      padding: '8px 0',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
        background: isOwn
          ? 'linear-gradient(135deg, #6366f1, #a855f7)'
          : 'linear-gradient(135deg, #06b6d4, #10b981)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
      }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: isOwn ? 'var(--primary)' : 'var(--text-heading)' }}>
            {name}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{time}</span>
        </div>
        <p style={{
          margin: '3px 0 0', fontSize: '0.9rem', color: 'var(--text-main)',
          lineHeight: '1.5', wordBreak: 'break-word',
        }}>
          {msg.content}
        </p>
      </div>
    </div>
  );
};

export const ChannelView: React.FC<ChannelViewProps> = ({ pageId, pageTitle }) => {
  const { messages, isLoadingMessages, hasMoreMessages, messageCursor, fetchMessages, sendMessage, appendMessageLocal } = usePageStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    fetchMessages(pageId);
    isInitialLoad.current = true;

    // Socket.io: listen for channel:message from other users
    const socket = getSocket();
    const handler = (data: any) => {
      const msg = data.message || data;
      const msgPageId = (msg.pageId?.toString() || msg.pageId);
      if (!msgPageId || msgPageId === pageId.toString()) {
        const msgUserId = typeof msg.userId === 'object' ? (msg.userId._id?.toString() || msg.userId.id?.toString()) : msg.userId?.toString();
        if (msgUserId !== user?.id?.toString()) {
          appendMessageLocal(msg);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      }
    };
    socket.on('channel:message', handler);
    return () => { socket.off('channel:message', handler); };
  }, [pageId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
      isInitialLoad.current = false;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    const optimisticMsg: Message = {
      _id: `temp-${Date.now()}`,
      id: `temp-${Date.now()}`,
      pageId,
      userId: { _id: user?.id, name: user?.name, email: user?.email },
      content,
      createdAt: new Date().toISOString(),
    };
    appendMessageLocal(optimisticMsg);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      await sendMessage(pageId, content);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isLoadingMessages || !hasMoreMessages) return;
    if (el.scrollTop < 60) {
      const prevHeight = el.scrollHeight;
      fetchMessages(pageId, messageCursor || undefined).then(() => {
        requestAnimationFrame(() => {
          if (el) el.scrollTop = el.scrollHeight - prevHeight;
        });
      });
    }
  }, [isLoadingMessages, hasMoreMessages, messageCursor, pageId]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Channel header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-header)' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
          💬 #{pageTitle}
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '2px' }}>
          Real-time chat • Scroll up to load older messages
        </p>
      </div>

      {/* Messages list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: 'auto', padding: '16px 24px',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Load more indicator */}
        {isLoadingMessages && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', gap: '8px' }}>
            <Loader size={14} color="var(--text-dim)" className="animate-spin" />
            <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Loading older messages...</span>
          </div>
        )}

        {!isLoadingMessages && hasMoreMessages && messages.length > 0 && (
          <button
            onClick={() => fetchMessages(pageId, messageCursor || undefined)}
            style={{
              alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '999px', marginBottom: '12px',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-dim)', fontSize: '0.78rem', cursor: 'pointer',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <ArrowUp size={12} /> Load older messages
          </button>
        )}

        {messages.length === 0 && !isLoadingMessages && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '12px',
          }}>
            <span style={{ fontSize: '2.5rem' }}>💬</span>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {messages.map((msg) => (
          <MessageBubble
            key={msg._id || msg.id}
            msg={msg}
            isOwn={(typeof msg.userId === 'object' ? msg.userId._id : msg.userId) === user?.id}
          />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Message input */}
      <div style={{
        padding: '12px 24px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-input-bar)',
      }}>
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'center',
          padding: '8px 12px', borderRadius: '10px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={`Message #${pageTitle}...`}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-main)', fontSize: '0.9rem',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: input.trim() ? 'var(--primary)' : 'var(--bg-card)',
              border: 'none', cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <Send size={15} color={input.trim() ? '#fff' : 'var(--text-dim)'} />
          </button>
        </div>
      </div>
    </div>
  );
};
