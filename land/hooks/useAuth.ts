'use client';

import { useState, useEffect } from 'react';
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
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      setState((prev) => ({ ...prev, user, token }));
    }
  }, []);

  const requestOTP = async (phone: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await api.post('/auth/request-otp', { phone });
      setState((prev) => ({ ...prev, loading: false }));
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to send OTP';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const login = async (phone: string, code: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api.post('/auth/verify-otp', { phone, code });
      const { token, user } = response.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }

      setState({ user, token, loading: false, error: null });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setState({ user: null, token: null, loading: false, error: null });
  };

  return {
    ...state,
    requestOTP,
    login,
    logout,
  };
}

