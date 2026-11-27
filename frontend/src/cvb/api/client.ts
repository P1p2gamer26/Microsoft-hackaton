// @ts-nocheck
const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = API_URL ? `${API_URL.replace(/\/$/, '')}/api/v1` : '/api/v1';

function getToken(): string | null {
  // La sesión de CaféTrace manda; si no hay, se usa la del módulo comercial.
  return sessionStorage.getItem('cafetrace-token') ?? localStorage.getItem('cvb_token');
}

export async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('cvb_token');
    localStorage.removeItem('cvb_user');
    sessionStorage.removeItem('cafetrace-token');
    window.location.hash = '#/cvb/login';
    throw new Error('Sesión expirada');
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.message || `Error HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  get: <T = any>(path: string) => apiRequest<T>(path, { method: 'GET' }),
  post: <T = any>(path: string, body?: any) =>
    apiRequest<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  patch: <T = any>(path: string, body?: any) =>
    apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
};
