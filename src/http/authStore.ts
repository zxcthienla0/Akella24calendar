import { create } from 'zustand';
import AuthService from './authService';

interface IUser {
  id?: number;
  email: string;
}

interface AuthState {
  user: IUser | null;
  isAuth: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  logoutSync: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuth: false,
  isLoading: false,

  login: async (credentials) => {
    const response = await AuthService.login(credentials.email, credentials.password);
    localStorage.setItem('accessToken', response.data.accessToken);
    set({ user: response.data.user, isAuth: true });
  },

  register: async (credentials) => {
    const response = await AuthService.register(credentials.email, credentials.password);
    localStorage.setItem('accessToken', response.data.accessToken);
    set({ user: response.data.user, isAuth: true });
  },

  logout: async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.warn('Logout request failed, but clearing local state');
    } finally {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuth: false });
      window.location.hash = '#/';
    }
  },

  logoutSync: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, isAuth: false });
    if (!window.location.hash.includes('/login')) {
      window.location.hash = '#/login';
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await AuthService.refresh();
      localStorage.setItem('accessToken', response.data.accessToken);
      set({ user: response.data.user, isAuth: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuth: false, isLoading: false });
    }
  },
}));