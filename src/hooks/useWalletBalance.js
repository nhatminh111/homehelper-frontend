// src/hooks/useWalletBalance.js
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Use the same base as services/api.js
const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

const getStoredToken = () => {
  try { return localStorage.getItem('token') || ''; } catch { return ''; }
};

export default function useWalletBalance({ autoRefreshMs = 0 } = {}) {
  const { token: authToken } = (function () {
    try { return require('../contexts/AuthContext'); } catch { return {}; }
  })?.useAuth?.() || { token: null };
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBalance = useCallback(async () => {
    const url = `${API_BASE}/wallet/balance`;
    const token = authToken || getStoredToken();
    console.log("=== FE DEBUG ===");
    console.log("User FE đang dùng token:", token);
    console.log("User FE decode JWT:", JSON.parse(atob(token.split('.')[1])));
    console.log("================");

    try {
      setError('');
      console.log('[WalletBalance] API_BASE =', API_BASE);
      console.log('[WalletBalance] GET', url);
      console.log('[WalletBalance] hasToken =', !!token);

      const headers = { Authorization: `Bearer ${token}` };
      const r = await fetch(url, { headers });
      const contentType = r.headers.get('content-type') || '';
      const raw = await r.text();

      console.log('[WalletBalance] status =', r.status, 'content-type =', contentType);
      console.log('[WalletBalance] raw =', raw.slice(0, 500));

      let data;
      try { data = JSON.parse(raw); }
      catch { data = { _raw: raw }; }

      // xuất debug global để bạn mở console gõ __walletDebug xem nhanh
      window.__walletDebug = { url, status: r.status, contentType, data };

      if (!r.ok) {
        const code = `HTTP_${r.status}`;
        const msg = (data && (data.error || data.message)) || code;
        throw new Error(msg);
      }

      const value = Number(data.balance || 0);
      console.log('[WalletBalance] parsed balance =', value);
      setBalance(value);
    } catch (e) {
      console.error('[WalletBalance] ERROR:', e);
      setError(e.message || 'fetch_balance_failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    if (autoRefreshMs > 0) {
      const itv = setInterval(fetchBalance, autoRefreshMs);
      return () => clearInterval(itv);
    }
  }, [fetchBalance, autoRefreshMs]);

  return { balance, loading, error, refresh: fetchBalance };
}
