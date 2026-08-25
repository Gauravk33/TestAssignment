import { create } from 'zustand';
import { api } from '../lib/api.js';

export interface Page {
  _id: string;
  id: string;
  workspaceId: string;
  title: string;
  type: 'doc' | 'board' | 'channel';
  icon?: string;
  parentId?: string | null;
  position: number;
  children?: Page[];
}

export interface Block {
  _id: string;
  id: string;
  pageId: string;
  type: string;
  content: Record<string, any>;
  position: number;
}

export interface BoardList {
  _id: string;
  id: string;
  pageId: string;
  title: string;
  position: number;
}

export interface Card {
  _id: string;
  id: string;
  listId: string;
  pageId: string;
  title: string;
  description?: string;
  labels?: string[];
  position: number;
}

export interface Message {
  _id: string;
  id: string;
  pageId: string;
  userId: any;
  content: string;
  createdAt: string;
}

interface PageStore {
  // Page tree
  pageTree: Page[];
  activePage: Page | null;
  isLoadingTree: boolean;

  // Blocks
  blocks: Block[];
  isLoadingBlocks: boolean;

  // Board
  lists: BoardList[];
  cards: Card[];
  isLoadingBoard: boolean;

  // Messages
  messages: Message[];
  messageCursor: string | null;
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;

  // Offline cache
  isOffline: boolean;

  // Actions
  fetchPageTree: (workspaceId: string) => Promise<void>;
  setActivePage: (page: Page) => void;
  createPage: (workspaceId: string, data: Partial<Page>) => Promise<Page>;
  deletePage: (pageId: string) => Promise<void>;

  fetchBlocks: (pageId: string) => Promise<void>;
  updateBlock: (blockId: string, content: any) => Promise<void>;
  createBlock: (pageId: string, type: string, content: any) => Promise<Block>;
  deleteBlock: (blockId: string) => Promise<void>;
  updateBlockLocal: (blockId: string, content: any) => void;

  fetchBoard: (pageId: string) => Promise<void>;
  moveCard: (cardId: string, targetListId: string, targetPosition: number) => Promise<void>;
  moveCardLocal: (cardId: string, targetListId: string, targetPosition: number) => void;
  rollbackCards: (prev: Card[]) => void;
  createCard: (pageId: string, listId: string, title: string) => Promise<void>;
  createList: (pageId: string, title: string) => Promise<void>;

  fetchMessages: (pageId: string, cursor?: string) => Promise<void>;
  sendMessage: (pageId: string, content: string) => Promise<void>;
  appendMessageLocal: (msg: Message) => void;
}

const CACHE_KEY = (id: string) => `ts_cache_${id}`;

export const usePageStore = create<PageStore>((set, get) => ({
  pageTree: [],
  activePage: null,
  isLoadingTree: false,
  blocks: [],
  isLoadingBlocks: false,
  lists: [],
  cards: [],
  isLoadingBoard: false,
  messages: [],
  messageCursor: null,
  hasMoreMessages: true,
  isLoadingMessages: false,
  isOffline: false,

  fetchPageTree: async (workspaceId) => {
    set({ isLoadingTree: true });
    try {
      const res = await api.get(`/pages/tree?workspaceId=${workspaceId}`);
      const tree = res.data.data || res.data;
      set({ pageTree: tree, isLoadingTree: false, isOffline: false });
    } catch {
      const cached = localStorage.getItem(CACHE_KEY(`tree_${workspaceId}`));
      if (cached) set({ pageTree: JSON.parse(cached), isLoadingTree: false, isOffline: true });
      else set({ isLoadingTree: false, isOffline: true });
    }
  },

  setActivePage: (page) => set({ activePage: page, blocks: [], lists: [], cards: [], messages: [], messageCursor: null, hasMoreMessages: true }),

  createPage: async (workspaceId, data) => {
    const res = await api.post('/pages', { workspaceId, ...data });
    const page = res.data.data || res.data;
    await get().fetchPageTree(workspaceId);
    return page;
  },

  deletePage: async (pageId) => {
    await api.delete(`/pages/${pageId}`);
    const { activePage, pageTree } = get();
    if (activePage?._id === pageId) set({ activePage: null });
    // Re-fetch tree from parent
    const workspaceId = activePage?.workspaceId || pageTree[0]?.workspaceId;
    if (workspaceId) await get().fetchPageTree(workspaceId);
  },

  fetchBlocks: async (pageId) => {
    set({ isLoadingBlocks: true });
    try {
      const res = await api.get(`/blocks?pageId=${pageId}`);
      const blocks = res.data.data || res.data;
      set({ blocks, isLoadingBlocks: false, isOffline: false });
      localStorage.setItem(CACHE_KEY(`blocks_${pageId}`), JSON.stringify(blocks));
    } catch {
      const cached = localStorage.getItem(CACHE_KEY(`blocks_${pageId}`));
      if (cached) set({ blocks: JSON.parse(cached), isLoadingBlocks: false, isOffline: true });
      else set({ isLoadingBlocks: false, isOffline: true });
    }
  },

  updateBlockLocal: (blockId, content) => {
    set(state => ({
      blocks: state.blocks.map(b =>
        (b._id === blockId || b.id === blockId) ? { ...b, content: { ...b.content, ...content } } : b
      ),
    }));
  },

  updateBlock: async (blockId, content) => {
    await api.patch(`/blocks/${blockId}`, { content });
  },

  createBlock: async (pageId, type, content) => {
    const { blocks } = get();
    const res = await api.post('/blocks', { pageId, type, content, position: blocks.length });
    const block = res.data.data || res.data;
    set(state => ({ blocks: [...state.blocks, block] }));
    return block;
  },

  deleteBlock: async (blockId) => {
    set(state => ({ blocks: state.blocks.filter(b => b._id !== blockId && b.id !== blockId) }));
    await api.delete(`/blocks/${blockId}`);
  },

  fetchBoard: async (pageId) => {
    set({ isLoadingBoard: true });
    try {
      const [listsRes, cardsRes] = await Promise.all([
        api.get(`/lists?pageId=${pageId}`),
        api.get(`/cards?pageId=${pageId}`),
      ]);
      const lists = listsRes.data.data || listsRes.data;
      const cards = cardsRes.data.data || cardsRes.data;
      set({ lists, cards, isLoadingBoard: false, isOffline: false });
    } catch {
      set({ isLoadingBoard: false, isOffline: true });
    }
  },

  moveCardLocal: (cardId, targetListId, targetPosition) => {
    set(state => ({
      cards: state.cards.map(c =>
        (c._id === cardId || c.id === cardId) ? { ...c, listId: targetListId, position: targetPosition } : c
      ),
    }));
  },

  rollbackCards: (prev) => set({ cards: prev }),

  moveCard: async (cardId, targetListId, targetPosition) => {
    await api.patch(`/cards/${cardId}/move`, { targetListId, targetPosition });
  },

  createCard: async (pageId, listId, title) => {
    const { cards } = get();
    const listCards = cards.filter(c => c.listId === listId);
    const res = await api.post('/cards', { pageId, listId, title, position: listCards.length });
    const card = res.data.data || res.data;
    set(state => ({ cards: [...state.cards, card] }));
  },

  createList: async (pageId, title) => {
    const { lists } = get();
    const res = await api.post('/lists', { pageId, title, position: lists.length });
    const list = res.data.data || res.data;
    set(state => ({ lists: [...state.lists, list] }));
  },

  fetchMessages: async (pageId, cursor) => {
    const { isLoadingMessages, hasMoreMessages } = get();
    if (isLoadingMessages || (!cursor && !hasMoreMessages)) return;
    set({ isLoadingMessages: true });
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (cursor) params.set('cursor', cursor);
      const res = await api.get(`/pages/${pageId}/messages?${params}`);
      const { messages: newMsgs, nextCursor } = res.data.data || res.data;
      const msgs = newMsgs || res.data.data || [];
      if (cursor) {
        // Loading older — prepend
        set(state => ({
          messages: [...msgs, ...state.messages],
          messageCursor: nextCursor || null,
          hasMoreMessages: !!nextCursor,
          isLoadingMessages: false,
          isOffline: false,
        }));
      } else {
        set({
          messages: msgs,
          messageCursor: nextCursor || null,
          hasMoreMessages: !!nextCursor,
          isLoadingMessages: false,
          isOffline: false,
        });
        localStorage.setItem(CACHE_KEY(`msgs_${pageId}`), JSON.stringify(msgs));
      }
    } catch {
      const cached = localStorage.getItem(CACHE_KEY(`msgs_${pageId}`));
      if (cached) set({ messages: JSON.parse(cached), isLoadingMessages: false, isOffline: true });
      else set({ isLoadingMessages: false, isOffline: true });
    }
  },

  sendMessage: async (pageId, content) => {
    const res = await api.post(`/pages/${pageId}/messages`, { content });
    return res.data.data || res.data;
  },

  appendMessageLocal: (msg) => {
    set(state => ({ messages: [...state.messages, msg] }));
  },
}));
