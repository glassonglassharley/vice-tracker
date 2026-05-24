import { useAuth } from '@clerk/clerk-react';

export function useApi() {
  const { getToken } = useAuth();

  return async (url, options = {}) => {
    const token = await getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  };
}
