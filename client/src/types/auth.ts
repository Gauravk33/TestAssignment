export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  role: WorkspaceRole;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    workspace?: WorkspaceSummary;
    workspaces?: WorkspaceSummary[];
    accessToken: string;
  };
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  workspaceName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
