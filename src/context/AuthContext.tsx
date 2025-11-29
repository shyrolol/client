import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

import { API_URL } from '../config';

interface User {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  status: string;
  customStatus?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    axios
      .get(`${API_URL}/auth/me`, { withCredentials: true })
      .then((res) => {
        if (!isMounted) return;
        setUser(res.data);
        // apply user preferences immediately so settings are active when landing on Echo
        try {
          const u = res.data as any;
          if (u.theme) document.documentElement.setAttribute('data-theme', u.theme);
          if (u.accentColor) document.documentElement.style.setProperty('--accent', u.accentColor);
          if (u.fontSize) {
            const size = u.fontSize === 'small' ? '14px' : u.fontSize === 'large' ? '18px' : '16px';
            document.documentElement.style.setProperty('--font-size-base', size);
            document.documentElement.style.fontSize = size;
          }
          if (u.compactMode !== undefined) {
            if (u.compactMode) document.body.classList.add('compact-mode');
            else document.body.classList.remove('compact-mode');
          }
          // persist to localStorage so hooks using local settings see them
          const persisted = JSON.parse(localStorage.getItem('userSettings') || '{}');
          const merged = { ...persisted, theme: u.theme || persisted.theme, accentColor: u.accentColor || persisted.accentColor, fontSize: u.fontSize || persisted.fontSize, compactMode: u.compactMode ?? persisted.compactMode };
          localStorage.setItem('userSettings', JSON.stringify(merged));
        } catch (e) {
          // ignore
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        // If 403 (beta access required/expired), store error and keep user null
        if (err.response?.status === 403) {
          const message = err.response?.data?.error || 'Beta access required';
          localStorage.setItem('betaError', message);
        }
        // For all errors (401, 403, etc.), keep user null and let Home.tsx redirect to /login
        setUser(null);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = async () => {
    await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
