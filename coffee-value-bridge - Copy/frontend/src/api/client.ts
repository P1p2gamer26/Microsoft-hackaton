const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('cvb_token');
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
    window.location.href = '/login';
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
