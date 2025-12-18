import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faClock, faCheckCircle, faTimesCircle,
    faUniversity, faCreditCard, faUser, faInfoCircle, faHistory
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { formatVND } from '../utils/formatVND';
import { showToast } from '../components/common/CustomToast';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '').replace(/\/api$/, '');
const token = () => localStorage.getItem('token') || '';

const WithdrawHistory = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMyRequests = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/wallet/withdraw/my-requests`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            const data = await res.json();
            if (data.success) {
                setRequests(data.data);
            } else {
                showToast.error(data.message || 'Lỗi tải lịch sử rút tiền');
            }
        } catch (err) {
            showToast.error('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyRequests();
    }, [fetchMyRequests]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="badge bg-warning-subtle text-warning px-3 py-2 rounded-pill fw-bold border border-warning-subtle">Chờ duyệt</span>;
            case 'completed':
                return <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-bold border border-success-subtle">Thành công</span>;
            case 'rejected':
                return <span className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill fw-bold border border-danger-subtle">Bị từ chối</span>;
            default:
                return <span className="badge bg-secondary px-3 py-2 rounded-pill">{status}</span>;
        }
    };

    return (
        <div className="withdraw-history-page py-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <Link to="/wallet" className="btn btn-link text-decoration-none text-secondary p-0">
                                <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Quay lại ví
                            </Link>
                            <h4 className="mb-0 fw-bold text-dark">Lịch sử rút tiền</h4>
                        </div>

                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-3 text-muted">Đang tải lịch sử...</p>
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                                <div className="bg-light rounded-circle p-4 d-inline-block mb-4 mx-auto" style={{ width: '100px', height: '100px' }}>
                                    <FontAwesomeIcon icon={faHistory} size="2xl" className="text-muted" />
                                </div>
                                <h5>Bạn chưa có yêu cầu rút tiền nào</h5>
                                <p className="text-muted">Lịch sử các lần rút tiền của bạn sẽ xuất hiện tại đây.</p>
                                <button onClick={() => navigate('/withdraw-request')} className="btn btn-primary rounded-pill px-4 py-2 mt-2">
                                    Rút tiền ngay
                                </button>
                            </div>
                        ) : (
                            <div className="withdraw-list">
                                {requests.map((req, idx) => (
                                    <motion.div
                                        key={req.request_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden"
                                    >
                                        <div className="card-body p-4">
                                            <div className="row align-items-center">
                                                <div className="col-md-3">
                                                    <div className="small text-muted mb-1">Mã yêu cầu #{req.request_id}</div>
                                                    <div className="h5 fw-bold text-primary mb-0">{formatVND(req.amount)}</div>
                                                    <div className="small text-muted mt-1">
                                                        {new Date(req.created_at).toLocaleDateString('vi-VN')} {new Date(req.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>

                                                <div className="col-md-5">
                                                    <div className="bank-info-box p-3 rounded-3 bg-light border-0">
                                                        <div className="d-flex align-items-center mb-2">
                                                            <FontAwesomeIcon icon={faUniversity} className="text-primary me-2" />
                                                            <span className="fw-bold small">{req.bank_name}</span>
                                                        </div>
                                                        <div className="d-flex align-items-center mb-1">
                                                            <FontAwesomeIcon icon={faCreditCard} className="text-muted me-2 small" />
                                                            <span className="font-monospace small">{req.bank_number}</span>
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            <FontAwesomeIcon icon={faUser} className="text-muted me-2 small" />
                                                            <span className="small text-uppercase fw-medium">{req.account_holder}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-md-2 text-md-center my-3 my-md-0">
                                                    {getStatusBadge(req.status)}
                                                </div>

                                                {/* <div className="col-md-2 text-md-end">
                                                    <button
                                                        className="btn btn-outline-primary btn-sm rounded-pill px-4"
                                                        onClick={() => {
                                                            // Xem chi tiết hoặc hiện popup ghi chú
                                                            if (req.note) alert(`Ghi chú: ${req.note}`);
                                                            else showToast.info('Yêu cầu này không có ghi chú');
                                                        }}
                                                    >
                                                        Chi tiết
                                                    </button>
                                                </div> */}
                                            </div>

                                            {req.status === 'rejected' && req.note && (
                                                <div className="mt-3 p-3 bg-danger-subtle rounded-3 border border-danger-subtle small">
                                                    <FontAwesomeIcon icon={faInfoCircle} className="text-danger me-2" />
                                                    <span className="fw-bold">Lý do từ chối:</span> {req.note}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        .withdraw-history-page {
          font-family: 'Inter', sans-serif;
        }
        .bank-info-box {
          background-color: #f1f5f9;
          transition: background-color 0.3s;
        }
        .card:hover .bank-info-box {
          background-color: #e2e8f0;
        }
        .badge {
          font-size: 0.8rem;
          letter-spacing: 0.3px;
        }
        .letter-spacing-1 { letter-spacing: 1px; }
      `}</style>
        </div>
    );
};

export default WithdrawHistory;
