import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRotateRight, faDownload, faChevronRight, faCircleCheck, faArrowUpRightFromSquare
} from '@fortawesome/free-solid-svg-icons';

import { formatVND } from '../utils/formatVND';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '').replace(/\/api$/, '');
const token = () => localStorage.getItem('token') || '';
const vnd = (n) => formatVND(n);

function useCurrentUser() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (raw) setUser(JSON.parse(raw));
  }, []);
  return user;
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [limit, setLimit] = useState(10); // tải 10 dòng đầu, có nút "Tải thêm"
  const [reloading, setReloading] = useState(false);
  const [filter, setFilter] = useState('all'); // all | credit | debit
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchAll = useCallback(async (lim = limit) => {
    try {
      setErr('');
      setReloading(true);

      const balanceUrl = `${API_BASE}/api/wallet/balance`;
      const historyUrl = `${API_BASE}/api/wallet/history?limit=${lim}`;
      const auth = { Authorization: `Bearer ${token()}` };

      console.log('[WalletPage] GET', balanceUrl);
      console.log('[WalletPage] GET', historyUrl);

      const [br, hr] = await Promise.all([
        fetch(balanceUrl, { headers: auth }),
        fetch(historyUrl, { headers: auth }),
      ]);

      const bRaw = await br.text();
      const hRaw = await hr.text();

      console.log('[WalletPage] balance status', br.status, 'raw:', bRaw.slice(0, 300));
      console.log('[WalletPage] history status', hr.status, 'raw:', hRaw.slice(0, 300));

      let b, h;
      try { b = JSON.parse(bRaw); } catch { b = { _raw: bRaw }; }
      try { h = JSON.parse(hRaw); } catch { h = { _raw: hRaw }; }

      if (!br.ok) throw new Error(b.error || `BALANCE_${br.status}`);
      if (!hr.ok) throw new Error(h.error || `HISTORY_${hr.status}`);

      setBalance(Number(b.balance || 0));
      setHistory(Array.isArray(h.history) ? h.history : []);
    } catch (e) {
      console.error('[WalletPage] ERROR:', e);
      setErr(e.message || 'Không tải được dữ liệu ví');
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }, [limit]);

  useEffect(() => { fetchAll(limit); }, [fetchAll, limit]);

  // Nghe sự kiện global để refresh ngay khi nạp xong (PaymentResult bắn event)
  useEffect(() => {
    const h = () => fetchAll(limit);
    window.addEventListener('wallet:refresh', h);
    return () => window.removeEventListener('wallet:refresh', h);
  }, [fetchAll, limit]);

  const loadMore = () => setLimit((x) => x + 10);
  const refresh = () => fetchAll(limit);

  const downloadCsv = () => {
    const rows = [
      ['created_at', 'type', 'purpose', 'amount', 'related_id', 'note'],
      ...history.map(x => [
        new Date(x.created_at).toISOString(),
        x.type, x.purpose, x.amount, x.related_id || '', x.note || ''
      ])
    ];
    const csv = rows.map(r => r.map(cell => {
      const s = String(cell ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `wallet-history-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // === TÍNH TỔNG NẠP / TỔNG TIÊU ===
  const creditSum = history
    .filter(x => x.type === 'credit')
    .reduce((s, x) => s + Number(x.amount || 0), 0);

  const debitSum = history
    .filter(x => x.type !== 'credit')
    .reduce((s, x) => s + Number(x.amount || 0), 0);

  const isCreditType = (type) => ['credit', 'refund', 'compensation'].includes(type);

  // === LỌC BẢNG THEO YÊU CẦU ===
  const filtered = history.filter(x => {
    if (filter === 'all') return true;
    const isCredit = isCreditType(x.type);
    return filter === 'credit' ? isCredit : !isCredit;
  });

  const getPurposeLabel = (p) => {
    const map = {
      'booking_cancel': 'Khách hủy dịch vụ',
      'booking_payment': 'Thanh toán dịch vụ',
      'complaint_approved': 'Duyệt khiếu nại',
      'complaint_rejected': 'Từ chối khiếu nại',
      'demo_topup': 'Nạp tiền',
      'topup': 'Nạp tiền',
      'evidence_approved': 'Bằng chứng hợp lệ',
      'evidence_rejected': 'Bằng chứng không hợp lệ',
      'tasker_cancel': 'Tasker hủy dịch vụ',
      'tasker_payout': 'Tasker hoàn thành',
      'withdrawal': 'Rút tiền',
      'refund': 'Hoàn tiền',
      'compensation': 'Bồi thường',
      'no_show': 'Khách không có mặt',
      'system_cancel': 'Hệ thống tự động hủy'
    };
    return map[p] || p;
  };

  return (
    <>
      {/* Hero */}
      <section className="hero-wrap hero-wrap-2" style={{ backgroundImage: "url('/images/home.jpg')" }} data-stellar-background-ratio="0.5">
        <div className="overlay"></div>
        <div className="container">
          <div className="row no-gutters slider-text align-items-end">
            <div className="col-md-9 ftco-animate pb-5">
              <p className="breadcrumbs mb-2">
                <span className="mr-2"><Link to="/">Home <FontAwesomeIcon icon={faChevronRight} /></Link></span>
                <span>Ví của bạn</span>
              </p>
              <h1 className="mb-0 bread">Xem số dư & giao dịch ví</h1>
              {currentUser && (
                <p className="text-white-50 small mb-0">
                  Xin chào, <b>{currentUser.name || currentUser.email || 'bạn'}</b>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="topup-body one-column">
        <div className="shell single-col">

          {/* Balance card (không có nút Nạp tiền theo yêu cầu) */}
          <div className="glass card-top mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="card-title">Số dư hiện tại</div>
                <div style={{ fontSize: 32, fontWeight: 800 }} className={loading ? 'skeleton' : ''}>
                  {loading ? '…' : vnd(balance)}
                </div>
              </div>
              <div className="d-flex">
                <button className="btn-icon mr-2" onClick={refresh} disabled={reloading} title="Làm mới">
                  <FontAwesomeIcon icon={faRotateRight} className={reloading ? 'fa-spin' : ''} />
                </button>
                <button className="btn-icon" onClick={downloadCsv} disabled={!history.length} title="Tải CSV">
                  <FontAwesomeIcon icon={faDownload} />
                </button>
              </div>
            </div>
            <div className="mt-3">
              <button
                className="btn btn-outline-primary btn-sm rounded-pill px-4 me-2"
                onClick={() => navigate('/withdraw-request')}
                disabled={balance <= 0}
              >
                Rút tiền
              </button>
              <button
                className="btn btn-outline-secondary btn-sm rounded-pill px-4"
                onClick={() => navigate('/withdraw-history')}
              >
                Lịch sử yêu cầu
              </button>
            </div>
          </div>

          {/* BẢNG TỔNG KẾT: ĐÃ NẠP / ĐÃ TIÊU */}
          <div className="glass card-top mb-4">
            <div className="card-title">Tổng kết</div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Chỉ số</th>
                    <th className="text-right">Giá trị</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Đã cộng (tổng cộng)</td>
                    <td className="text-right text-success">+{vnd(creditSum)}</td>
                  </tr>
                  <tr>
                    <td>Đã trừ (tổng cộng)</td>
                    <td className="text-right text-danger">-{vnd(debitSum)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* History + Filter chung một card */}
          <div className="glass">
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <strong>Giao dịch gần đây</strong>
              <div className="filters d-flex">
                <div className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả</div>
                <div className={`pill ${filter === 'credit' ? 'active' : ''}`} onClick={() => setFilter('credit')}>Chỉ cộng</div>
                <div className={`pill ${filter === 'debit' ? 'active' : ''}`} onClick={() => setFilter('debit')}>Chỉ trừ</div>
              </div>
            </div>

            {err && <div className="alert error m-3">Lỗi: {err}</div>}

            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Loại</th>
                    <th style={{ minWidth: '200px' }}>Mục đích</th>
                    <th>Ghi chú</th>
                    <th className="text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="text-center p-4">Đang tải…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center p-4">
                        <FontAwesomeIcon icon={faCircleCheck} /> Không có giao dịch phù hợp
                      </td>
                    </tr>
                  ) : (
                    filtered.map(x => {
                      const isCredit = isCreditType(x.type);
                      return (
                        <tr key={`${x.id}-${x.created_at}`}>
                          <td>{new Date(x.created_at).toLocaleString('vi-VN')}</td>
                          <td>
                            <span className={`badge ${isCredit ? 'badge-success' : 'badge-danger'}`}>
                              {isCredit ? 'Cộng' : 'Trừ'}
                            </span>
                          </td>
                          <td className="fw-medium">{getPurposeLabel(x.purpose)}</td>
                          <td>
                            <span className="small text-muted">{x.note || '—'}</span>
                          </td>
                          <td className={`text-right ${isCredit ? 'text-success' : 'text-danger'}`}>
                            {isCredit ? '+' : '-'}{vnd(x.amount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 d-flex justify-content-center">
              <button
                className="btn-load-more"
                onClick={loadMore}
                disabled={loading || reloading}
              >
                {reloading ? (
                  <>
                    <FontAwesomeIcon icon={faRotateRight} className="fa-spin mr-2" />
                    Đang tải dữ liệu...
                  </>
                ) : (
                  <>
                    Xem thêm giao dịch
                    <FontAwesomeIcon icon={faChevronRight} className="ml-2 small opacity-50" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="glass card-top mt-4 mb-5">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="card-title text-primary">Cần nạp thêm tiền?</div>
                <div className="text-muted small">Nạp tiền qua MoMo hoặc Chuyển khoản ngân hàng để tiếp tục sử dụng dịch vụ.</div>
              </div>
              <Link to="/topUp" className="btn-gradient">
                Nạp ngay <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-2" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      <style>{`
        .btn-load-more {
          background: #fff;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 10px 30px;
          border-radius: 99px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .btn-load-more:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
        }

        .btn-load-more:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-load-more:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f1f5f9;
        }

        .table-responsive {
          border-radius: 0 0 15px 15px;
        }

        .table thead th {
          background: #f8fafc;
          border-top: none;
          color: #64748b;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 15px 20px;
        }

        .table tbody tr {
          transition: background 0.2s;
        }

        .table tbody tr:hover {
          background-color: #f1f5f9;
        }

        .table td {
          padding: 15px 20px;
          vertical-align: middle;
          border-top: 1px solid #f1f5f9;
        }

        .badge-success {
          background-color: #ecfdf5;
          color: #059669;
          border: 1.5px solid #10b981;
        }

        .badge-danger {
          background-color: #fef2f2;
          color: #dc2626;
          border: 1.5px solid #ef4444;
        }

        .btn-gradient {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white !important;
          padding: 12px 25px;
          border-radius: 12px;
          font-weight: 700;
          transition: all 0.3s ease;
          border: none;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .btn-gradient:hover {
          transform: scale(1.03);
          box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3);
        }
      `}</style>
    </>
  );
}
