import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRotateRight, faDownload, faChevronRight, faCircleCheck, faArrowUpRightFromSquare
} from '@fortawesome/free-solid-svg-icons';

const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(/\/+$/, '');
const token = () => localStorage.getItem('token') || '';
const vnd = (n) => (Number(n) || 0).toLocaleString('vi-VN') + '₫';

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
  // const currentUser = useCurrentUser();
  // const navigate = useNavigate();

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

  // === LỌC BẢNG THEO YÊU CẦU ===
  const filtered = history.filter(x =>
    filter === 'all' ? true : (filter === 'credit' ? x.type === 'credit' : x.type !== 'credit')
  );

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
              {useCurrentUser && (
                <p className="text-white-50 small mb-0">
                  Xin chào, <b>{(JSON.parse(localStorage.getItem('currentUser') || '{}').name) || (JSON.parse(localStorage.getItem('currentUser') || '{}').email) || 'bạn'}</b>
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
                    <td>Đã nạp (tổng cộng)</td>
                    <td className="text-right text-success">+{vnd(creditSum)}</td>
                  </tr>
                  <tr>
                    <td>Đã tiêu (tổng cộng)</td>
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
                    <th>Mục đích</th>
                    <th className="text-right">Số tiền</th>
                    <th>Liên quan</th>
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
                      const isCredit =
                        x.type === 'credit' ||
                        x.type === 'refund' ||
                        x.type === 'compensation';
                      return (
                        <tr key={`${x.id}-${x.created_at}`}>
                          <td>{new Date(x.created_at).toLocaleString('vi-VN')}</td>
                          <td>
                            <span className={`badge ${isCredit ? 'badge-success' : 'badge-danger'}`}>
                              {isCredit ? 'Cộng' : 'Trừ'}
                            </span>
                          </td>
                          <td>{x.purpose}</td>
                          <td className={`text-right ${isCredit ? 'text-success' : 'text-danger'}`}>
                            {isCredit ? '+' : '-'}{vnd(x.amount)}
                          </td>
                          <td>{x.related_id || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 d-flex justify-content-center">
              <button
                className="btn-light"
                onClick={loadMore}
                disabled={loading || reloading}
              >
                Tải thêm
              </button>
            </div>
          </div>

          <div className="glass card-top mt-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="card-title">Cần nạp ngay?</div>
                <div className="text-muted small">Thanh toán qua MoMo an toàn, cập nhật số dư tức thì.</div>
              </div>
              <Link to="/topUp" className="btn-gradient">
                Nạp ngay <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-1" />
              </Link>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
