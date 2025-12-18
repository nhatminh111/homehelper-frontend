import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet, faTicketAlt, faExchangeAlt, faArrowUp, faArrowDown,
  faHistory, faSearch, faFilter, faFileInvoiceDollar, faCheckCircle,
  faTimesCircle, faClock, faUniversity, faCreditCard, faUser, faShieldAlt,
  faChevronLeft, faChevronRight, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import adminStatsAPI from '../services/adminStats';
import { showToast } from '../components/common/CustomToast';
import { formatVND } from '../utils/formatVND';

const ITEMS_PER_PAGE = 10;

const SystemManagement = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('cashflow'); // cashflow | vouchers
  const [data, setData] = useState({
    walletTransactions: [],
    momoTransactions: [],
    vouchers: [],
    withdrawRequests: []
  });
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [pageWallet, setPageWallet] = useState(1);
  const [pageMomo, setPageMomo] = useState(1);
  const [pageWithdraw, setPageWithdraw] = useState(1);
  const [pageVoucher, setPageVoucher] = useState(1);

  // Filter states
  const [searchTerm, setSearchTerm] = useState(''); // Search voucher by user name
  const [voucherStatus, setVoucherStatus] = useState('all'); // all | active | used | expired
  const [filterDate, setFilterDate] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminStatsAPI.getFinancialDetails(token);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      showToast.error('Lỗi tải dữ liệu tài chính & voucher');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const StatusBadge = ({ status }) => {
    const s = status?.toLowerCase();
    if (['completed', 'success', 'đã ký', 'đã thanh toán', 'đã xác minh', 'approved'].includes(s)) {
      return <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-bold"><FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Thành công</span>;
    }
    if (['pending', 'chờ ký', 'chờ xử lý'].includes(s)) {
      return <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-pill fw-bold"><FontAwesomeIcon icon={faClock} className="me-1" /> Đang chờ</span>;
    }
    if (['rejected', 'hủy', 'bị từ chối', 'failed'].includes(s)) {
      return <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill fw-bold"><FontAwesomeIcon icon={faTimesCircle} className="me-1" /> Thất bại</span>;
    }
    return <span className="badge bg-secondary-subtle text-secondary px-3 py-2 rounded-pill fw-bold">{status}</span>;
  };

  // --- Filtered Data ---
  const filteredWallet = useMemo(() => {
    return data.walletTransactions.filter(tx => {
      if (!filterDate) return true;
      const d = new Date(tx.created_at).toLocaleDateString('en-CA');
      return d === filterDate;
    });
  }, [data.walletTransactions, filterDate]);

  const filteredMomo = useMemo(() => {
    return data.momoTransactions.filter(tx => {
      if (!filterDate) return true;
      const d = new Date(tx.created_at).toLocaleDateString('en-CA');
      return d === filterDate;
    });
  }, [data.momoTransactions, filterDate]);

  const filteredWithdraw = useMemo(() => {
    return data.withdrawRequests.filter(tx => {
      if (!filterDate) return true;
      const d = new Date(tx.created_at).toLocaleDateString('en-CA');
      return d === filterDate;
    });
  }, [data.withdrawRequests, filterDate]);

  const filteredVouchers = useMemo(() => {
    return data.vouchers.filter(v => {
      const matchName = !searchTerm || v.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchName) return false;

      if (voucherStatus === 'all') return true;
      const now = new Date();
      const exp = new Date(v.expiry_date);
      if (voucherStatus === 'active') return !v.used && exp >= now;
      if (voucherStatus === 'used') return v.used;
      if (voucherStatus === 'expired') return !v.used && exp < now;
      return true;
    });
  }, [data.vouchers, searchTerm, voucherStatus]);

  // --- Paginated Data ---
  const paginatedWallet = filteredWallet.slice((pageWallet - 1) * ITEMS_PER_PAGE, pageWallet * ITEMS_PER_PAGE);
  const paginatedMomo = filteredMomo.slice((pageMomo - 1) * ITEMS_PER_PAGE, pageMomo * ITEMS_PER_PAGE);
  const paginatedWithdraw = filteredWithdraw.slice((pageWithdraw - 1) * ITEMS_PER_PAGE, pageWithdraw * ITEMS_PER_PAGE);
  const paginatedVoucher = filteredVouchers.slice((pageVoucher - 1) * ITEMS_PER_PAGE, pageVoucher * ITEMS_PER_PAGE);

  const Pagination = ({ current, total, onPageChange }) => {
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;
    return (
      <div className="d-flex justify-content-center align-items-center gap-3 p-3 bg-light border-top">
        <button
          className="btn btn-sm btn-outline-secondary rounded-circle"
          style={{ width: 32, height: 32 }}
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <span className="small fw-bold text-muted">Trang {current} / {totalPages}</span>
        <button
          className="btn btn-sm btn-outline-secondary rounded-circle"
          style={{ width: 32, height: 32 }}
          onClick={() => onPageChange(current + 1)}
          disabled={current === totalPages}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <div className="fw-bold text-muted mt-2">Đang tải dữ liệu kinh tế...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: '#f4f7fe' }}>
      <header className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center bg-white p-4 rounded-4 shadow-sm border-0">
        <div>
          <h2 className="fw-bold mb-1 text-dark d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3 text-primary">
              <FontAwesomeIcon icon={faShieldAlt} />
            </div>
            Chi tiết Thu nhập & Tài chính
          </h2>
          <p className="text-muted mb-0">Quản lý dòng tiền, giao dịch MoMo và hệ thống Voucher toàn sàn.</p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-3">
          <div className="d-inline-flex p-1 bg-light border rounded-pill">
            <button
              onClick={() => { setActiveTab('cashflow'); setPageWallet(1); setPageMomo(1); setPageWithdraw(1); }}
              className={`btn border-0 rounded-pill px-4 py-2 fw-bold transition-all ${activeTab === 'cashflow' ? 'bg-primary text-white shadow-sm' : 'text-muted'}`}
            >
              <FontAwesomeIcon icon={faExchangeAlt} className="me-2" /> Dòng tiền
            </button>
            <button
              onClick={() => { setActiveTab('vouchers'); setPageVoucher(1); }}
              className={`btn border-0 rounded-pill px-4 py-2 fw-bold transition-all ${activeTab === 'vouchers' ? 'bg-primary text-white shadow-sm' : 'text-muted'}`}
            >
              <FontAwesomeIcon icon={faTicketAlt} className="me-2" /> Voucher
            </button>
          </div>
          <button className="btn btn-white border shadow-sm rounded-pill px-4" onClick={fetchData}>
            <FontAwesomeIcon icon={faHistory} className="me-2" /> Tải lại
          </button>
        </div>
      </header>

      {/* Global Filters */}
      <div className="mb-4 row g-3">
        {activeTab === 'cashflow' ? (
          <>
            <div className="col-md-4">
              <div className="input-group input-group-sm bg-white rounded-pill shadow-xs overflow-hidden border">
                <span className="input-group-text bg-white border-0 text-muted ps-3"><FontAwesomeIcon icon={faCalendarAlt} /> Lọc theo ngày:</span>
                <input type="date" className="form-control border-0 bg-transparent" value={filterDate} onChange={e => { setFilterDate(e.target.value); setPageWallet(1); setPageMomo(1); setPageWithdraw(1); }} />
                {filterDate && (
                  <button className="btn btn-sm text-danger border-0 px-3" onClick={() => { setFilterDate(''); setPageWallet(1); setPageMomo(1); setPageWithdraw(1); }}>Xóa lọc</button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="col-md-3">
              <div className="input-group input-group-sm bg-white rounded-pill shadow-xs overflow-hidden border">
                <span className="input-group-text bg-white border-0 text-muted ps-3"><FontAwesomeIcon icon={faSearch} /></span>
                <input type="text" className="form-control border-0 bg-transparent" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPageVoucher(1); }} placeholder="Tìm tên người dùng..." />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-sm rounded-pill border shadow-xs" value={voucherStatus} onChange={e => { setVoucherStatus(e.target.value); setPageVoucher(1); }}>
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang kích hoạt</option>
                <option value="used">Đã sử dụng</option>
                <option value="expired">Đã hết hạn</option>
              </select>
            </div>
          </>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'cashflow' ? (
          <motion.div
            key="cashflow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="row g-4"
          >
            {/* Wallet Transactions Table */}
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0 text-primary">Biến động số dư (Wallet)</h5>
                  <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill font-monospace">{filteredWallet.length} bản ghi</span>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light text-muted small text-uppercase font-weight-bold">
                      <tr>
                        <th className="ps-4">ID</th>
                        <th>Khách hàng</th>
                        <th>Mục đích</th>
                        <th className="text-center">Số tiền</th>
                        <th className="text-center">Thời gian</th>
                        <th className="pe-4">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedWallet.map((tx) => (
                        <tr key={tx.id}>
                          <td className="ps-4 text-muted small font-monospace">#{tx.id}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar-sm bg-info bg-opacity-10 text-info fw-bold me-2 rounded-2 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                                {tx.user_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <div className="fw-bold small">{tx.user_name || 'Hệ thống'}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{tx.user_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="small fw-medium text-dark-emphasis">{getPurposeLabel(tx.purpose)}</td>
                          <td className={`text-center fw-bolder ${tx.type === 'credit' ? 'text-success' : 'text-danger'}`}>
                            {tx.type === 'credit' ? '+' : '-'}{formatVND(tx.amount)}
                          </td>
                          <td className="small text-muted text-center">
                            {new Date(tx.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="pe-4 small text-muted text-truncate" style={{ maxWidth: 200 }}>{tx.note}</td>
                        </tr>
                      ))}
                      {paginatedWallet.length === 0 && (
                        <tr><td colSpan="6" className="text-center py-5 text-muted">Không tìm thấy dữ liệu giao dịch phù hợp</td></tr>
                      )}
                    </tbody>
                  </table>
                  <Pagination current={pageWallet} total={filteredWallet.length} onPageChange={setPageWallet} />
                </div>
              </div>
            </div>

            {/* MoMo Transactions */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                <div className="card-header bg-white p-4 border-0 d-flex justify-content-between">
                  <h5 className="fw-bold mb-0 text-dark">Giao dịch MoMo</h5>
                  <span className="badge bg-light text-dark rounded-pill">{filteredMomo.length}</span>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light text-muted small text-uppercase">
                      <tr>
                        <th className="ps-4">Mã đơn</th>
                        <th>Trạng thái</th>
                        <th className="text-end pe-4">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMomo.map((m) => (
                        <tr key={m.id}>
                          <td className="ps-4 small font-monospace">
                            <div className="fw-bold text-dark">{m.order_id}</div>
                            <div className="text-muted" style={{ fontSize: '0.65rem' }}>{new Date(m.created_at).toLocaleString('vi-VN')}</div>
                          </td>
                          <td><StatusBadge status={m.status} /></td>
                          <td className="text-end pe-4 fw-bold text-dark">{formatVND(m.amount)}</td>
                        </tr>
                      ))}
                      {paginatedMomo.length === 0 && (
                        <tr><td colSpan="3" className="text-center py-5 text-muted">Không tìm thấy giao dịch MoMo phù hợp</td></tr>
                      )}
                    </tbody>
                  </table>
                  <Pagination current={pageMomo} total={filteredMomo.length} onPageChange={setPageMomo} />
                </div>
              </div>
            </div>

            {/* Withdrawals */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                <div className="card-header bg-white p-4 border-0 d-flex justify-content-between">
                  <h5 className="fw-bold mb-0 text-dark">Yêu cầu rút tiền</h5>
                  <span className="badge bg-light text-dark rounded-pill">{filteredWithdraw.length}</span>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light text-muted small text-uppercase">
                      <tr>
                        <th className="ps-4">Người yêu cầu</th>
                        <th>Trạng thái</th>
                        <th className="text-end pe-4">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedWithdraw.map((wr) => (
                        <tr key={wr.request_id}>
                          <td className="ps-4">
                            <div className="fw-bold small">{wr.user_name}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Bank: {wr.bank_name}</div>
                          </td>
                          <td><StatusBadge status={wr.status} /></td>
                          <td className="text-end pe-4 fw-bold text-primary">{formatVND(wr.amount)}</td>
                        </tr>
                      ))}
                      {paginatedWithdraw.length === 0 && (
                        <tr><td colSpan="3" className="text-center py-5 text-muted">Không tìm thấy yêu cầu rút tiền phù hợp</td></tr>
                      )}
                    </tbody>
                  </table>
                  <Pagination current={pageWithdraw} total={filteredWithdraw.length} onPageChange={setPageWithdraw} />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="vouchers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="row g-4"
          >
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">Quản lý Voucher sàn</h5>
                  <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill font-monospace">{filteredVouchers.length} kết quả</span>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light text-muted small text-uppercase">
                      <tr>
                        <th className="ps-4">Mã</th>
                        <th>Chủ sở hữu</th>
                        <th>Loại</th>
                        <th className="text-center">Chiết khấu</th>
                        <th className="text-center">Trạng thái</th>
                        <th>Ngày hết hạn</th>
                        <th className="pe-4">Nguồn gốc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedVoucher.map(v => (
                        <tr key={v.voucher_id}>
                          <td className="ps-4 font-monospace fw-bold text-primary">#VC{v.voucher_id}</td>
                          <td>
                            <div className="fw-bold small">{v.user_name || 'Hệ thống'}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>User ID: {v.user_id}</div>
                          </td>
                          <td>
                            <span className={`badge ${v.type === 'percent' ? 'bg-primary' : 'bg-dark'} rounded-pill`}>
                              {v.type === 'percent' ? 'Phần trăm' : 'Cố định'}
                            </span>
                          </td>
                          <td className="text-center fw-bold text-danger">
                            {v.type === 'percent' ? `${v.discount * 100}%` : formatVND(v.discount)}
                          </td>
                          <td className="text-center">
                            {v.used ? (
                              <span className="badge bg-secondary rounded-pill px-3 fw-bold">Đã dùng</span>
                            ) : new Date(v.expiry_date) < new Date() ? (
                              <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 border border-danger-subtle fw-bold">Hết hạn</span>
                            ) : (
                              <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 border border-success-subtle fw-bold">Kích hoạt</span>
                            )}
                          </td>
                          <td className="small text-muted">{new Date(v.expiry_date).toLocaleDateString('vi-VN')}</td>
                          <td className="pe-4 small text-muted">
                            {v.source_booking_id ? `Đơn hàng #${v.source_booking_id}` : 'Hệ thống cấp'}
                          </td>
                        </tr>
                      ))}
                      {paginatedVoucher.length === 0 && (
                        <tr><td colSpan="7" className="text-center py-5 text-muted">Không tìm thấy voucher phù hợp</td></tr>
                      )}
                    </tbody>
                  </table>
                  <Pagination current={pageVoucher} total={filteredVouchers.length} onPageChange={setPageVoucher} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .btn-white { background: #fff; color: #475569; }
        .btn-white:hover { background: #f8fafc; color: #1e293b; }
        .avatar-sm { font-size: 0.8rem; }
        .transition-all { transition: all 0.2s ease; }
        .cursor-pointer { cursor: pointer; }
        .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .form-select-sm { padding-top: 0.35rem; padding-bottom: 0.35rem; }
      `}</style>
    </div>
  );
};

export default SystemManagement;
