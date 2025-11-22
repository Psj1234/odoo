'use client';

import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  phone: string;
  name?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  requestOTP: (phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || 'null')) : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  loading: false,
  error: null,

  login: async (phone: string, code: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/verify-otp', { phone, code });
      const { token, user } = response.data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      set({ user, token, loading: false });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  requestOTP: async (phone: string) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/request-otp', { phone });
      set({ loading: false });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to send OTP';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ user: null, token: null });
  },

  updateUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user });
  },
}));

export default useAuthStore;

