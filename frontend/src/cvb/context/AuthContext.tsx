// @ts-nocheck
import React, { createContext, useContext, useState } from 'react';
import { api } from '../api/client';
import { dict } from '../i18n/translations';
import type { Lang } from '../i18n/translations';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  roleCode: string;
  roleName: string;
  companyId: number;
  companyName: string;
  language: string;
  permissions: string[];
}

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (perm: string) => boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

// Si CaféTrace ya hizo login, reutilizamos su token y leemos el usuario del JWT.
function userFromToken(token: string | null): AuthUser | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return {
      id: payload.uid, email: payload.sub, fullName: payload.name,
      roleCode: payload.role, roleName: payload.role,
      companyId: payload.cid, companyName: payload.cname,
      language: 'es', permissions: payload.perms || [],
    };
  } catch { return null; }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('cafetrace-token') ?? localStorage.getItem('cvb_token')
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('cvb_user');
    return raw ? JSON.parse(raw) : userFromToken(token);
  });
  const [lang, setLang] = useState<Lang>('es');

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('cvb_token', res.token);
    localStorage.setItem('cvb_user', JSON.stringify(res.user));
    sessionStorage.setItem('cafetrace-token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('cvb_token');
    localStorage.removeItem('cvb_user');
    sessionStorage.removeItem('cafetrace-token');
    setToken(null);
    setUser(null);
  };

  const can = (perm: string) => {
    if (!user) return false;
    return user.roleCode === 'GENERAL_ADMIN' || user.permissions.includes(perm);
  };

  const t = (key: string) => dict[lang][key] || key;

  return (
    <AuthContext.Provider value={{ user, token, lang, setLang, t, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
