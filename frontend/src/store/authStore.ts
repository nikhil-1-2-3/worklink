import { create } from 'zustand';

interface AuthState {
  user: any | null;
  token: string | null;
  setAuth: (user: any, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: localStorage.getItem('worklink_user') ? JSON.parse(localStorage.getItem('worklink_user')!) : null,
  token: localStorage.getItem('worklink_token') || null,
  setAuth: (user, token) => {
    localStorage.setItem('worklink_user', JSON.stringify(user));
    localStorage.setItem('worklink_token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('worklink_user');
    localStorage.removeItem('worklink_token');
    set({ user: null, token: null });
  }
}));
