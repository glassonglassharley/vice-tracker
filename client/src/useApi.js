import { createContext, createElement, useContext, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const DemoAuthContext = createContext(null);
const USERNAME_AUTH_KEY = 'vt-username-auth';

export function sanitizeDemoUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

function readStoredUsernameAuth() {
  try {
    const raw = localStorage.getItem(USERNAME_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const username = sanitizeDemoUsername(parsed?.username);
    const token = String(parsed?.token || '').trim();
    return username && token ? { username, token } : null;
  } catch {
    return null;
  }
}

export function DemoAuthProvider({ children }) {
  const [account, setAccount] = useState(readStoredUsernameAuth);
  const demoUsername = account?.username || '';

  const value = useMemo(() => ({
    demoUsername,
    usernameToken: account?.token || '',
    isDemo: Boolean(account?.username && account?.token),
    async startDemo(username, token = '') {
      const clean = sanitizeDemoUsername(username);
      if (!clean) throw new Error('Enter a username.');

      const res = await fetch('/api/auth/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean, token: String(token || '').trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);

      const nextAccount = { username: body.username, token: body.token };
      localStorage.setItem(USERNAME_AUTH_KEY, JSON.stringify(nextAccount));
      localStorage.removeItem('vt-demo-username');
      setAccount(nextAccount);
      return body;
    },
    stopDemo() {
      localStorage.removeItem(USERNAME_AUTH_KEY);
      localStorage.removeItem('vt-demo-username');
      setAccount(null);
    },
  }), [account, demoUsername]);

  return createElement(DemoAuthContext.Provider, { value }, children);
}

export function useDemoAuth() {
  const ctx = useContext(DemoAuthContext);
  if (!ctx) throw new Error('useDemoAuth must be used inside DemoAuthProvider');
  return ctx;
}

export function useApi() {
  const { getToken } = useAuth();
  const { demoUsername, usernameToken } = useDemoAuth();

  return async (url, options = {}) => {
    const token = demoUsername ? null : await getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (demoUsername && usernameToken) {
      headers['X-Username-Auth'] = demoUsername;
      headers['X-Username-Token'] = usernameToken;
    }
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  };
}
