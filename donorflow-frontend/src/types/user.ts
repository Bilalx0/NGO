export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'STAFF' | 'DONOR';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  organizationId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}