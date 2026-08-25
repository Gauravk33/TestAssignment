import { create } from 'zustand';
import { api } from '../lib/api.js';
import { User, WorkspaceSummary, RegisterPayload, LoginPayload } from '../types/auth.js';

interface AuthState {
  user: User | null;
  token: string | null;
  workspaces: WorkspaceSummary[];
  currentWorkspace: WorkspaceSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<string>; // returns default workspace ID
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setCurrentWorkspace: (workspace: WorkspaceSummary) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Listen for global logout events from axios interceptor
  if (typeof window !== 'undefined') {
    window.addEventListener('teamspace_logout', () => {
      set({
        user: null,
        token: null,
        workspaces: [],
        currentWorkspace: null,
        isAuthenticated: false,
        isLoading: false,
      });
    });
  }

  return {
    user: null,
    token: typeof localStorage !== 'undefined' ? localStorage.getItem('teamspace_token') : null,
    workspaces: [],
    currentWorkspace: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    clearError: () => set({ error: null }),

    login: async (payload: LoginPayload) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/login', payload);
        const { user, workspaces, accessToken } = response.data.data;

        localStorage.setItem('teamspace_token', accessToken);
        localStorage.setItem('teamspace_user', JSON.stringify(user));

        const activeWs = workspaces && workspaces.length > 0 ? workspaces[0] : null;

        set({
          user,
          token: accessToken,
          workspaces: workspaces || [],
          currentWorkspace: activeWs,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        const msg = err.response?.data?.error || err.message || 'Login failed';
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    },

    register: async (payload: RegisterPayload) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/register', payload);
        const { user, workspace, accessToken } = response.data.data;

        localStorage.setItem('teamspace_token', accessToken);
        localStorage.setItem('teamspace_user', JSON.stringify(user));

        const wsList = workspace ? [workspace] : [];

        set({
          user,
          token: accessToken,
          workspaces: wsList,
          currentWorkspace: workspace || null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return workspace ? workspace.id : '';
      } catch (err: any) {
        const msg = err.response?.data?.error || err.message || 'Registration failed';
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    },

    logout: async () => {
      try {
        await api.post('/auth/logout');
      } catch (e) {
        // Ignore logout errors
      } finally {
        localStorage.removeItem('teamspace_token');
        localStorage.removeItem('teamspace_user');
        set({
          user: null,
          token: null,
          workspaces: [],
          currentWorkspace: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    },

    checkAuth: async () => {
      set({ isLoading: true });
      const savedToken = localStorage.getItem('teamspace_token');

      // Attempt /auth/me or silent refresh
      try {
        if (!savedToken) {
          // Attempt silent refresh via cookie
          const refreshRes = await api.post('/auth/refresh', {});
          const newToken = refreshRes.data?.data?.accessToken;
          const refreshUser = refreshRes.data?.data?.user;
          if (newToken) {
            localStorage.setItem('teamspace_token', newToken);
            set({ token: newToken, user: refreshUser });
          }
        }

        const meRes = await api.get('/auth/me');
        const { user, workspaces } = meRes.data.data;
        const current = get().currentWorkspace || (workspaces?.length > 0 ? workspaces[0] : null);

        set({
          user,
          workspaces: workspaces || [],
          currentWorkspace: current,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err) {
        localStorage.removeItem('teamspace_token');
        localStorage.removeItem('teamspace_user');
        set({
          user: null,
          token: null,
          workspaces: [],
          currentWorkspace: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    },

    setCurrentWorkspace: (workspace: WorkspaceSummary) => {
      set({ currentWorkspace: workspace });
    },
  };
});
