import React from 'react';
import useWalletBalance from '../hooks/useWalletBalance';
import { formatVND } from '../utils/formatVND';

export default function WalletBadge() {
  const { balance, loading, error, refresh } = useWalletBalance({ autoRefreshMs: 15000 });
  console.log(">>> BALANCE HOOK:", balance);

  if (error) return <span className="badge-wallet error" title={error}>Ví: lỗi</span>;

  return (
    <span className="badge-wallet" onClick={refresh} title="Bấm để làm mới">
      Ví: {loading ? '...' : formatVND(balance)}
    </span>
  );
}