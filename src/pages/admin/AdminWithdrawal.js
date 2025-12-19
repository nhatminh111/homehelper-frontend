import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHistory, faCheckCircle, faTimesCircle, faClock,
    faWallet, faUser, faEnvelope, faCommentDots, faArrowRight,
    faUniversity, faCreditCard, faUserTag
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { formatVND } from '../../utils/formatVND';
import { showToast } from '../../components/common/CustomToast';

const AdminWithdrawal = () => {
    const { token } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ id: null, decision: '', note: '' });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/wallet/withdraw/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setRequests(data.data);
            } else {
                showToast.error(data.message || 'Lỗi tải danh sách yêu cầu');
            }
        } catch (err) {
            showToast.error('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    }, [token, API_URL]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const openModal = (requestId, decision) => {
        setModalData({ id: requestId, decision, note: '' });
        setShowModal(true);
    };

    const handleConfirmAction = async () => {
        const { id, decision, note } = modalData;

        try {
            setProcessingId(id);
            const res = await fetch(`${API_URL}/wallet/withdraw/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    request_id: id,
                    decision,
                    admin_note: note
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast.success(data.message);
                setShowModal(false);
                fetchRequests();
            } else {
                showToast.error(data.message || 'Thao tác thất bại');
            }
        } catch (err) {
            showToast.error('Lỗi kết nối server');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span className="badge bg-warning-subtle text-warning px-3 py-2 rounded-pill fw-bold"><FontAwesomeIcon icon={faClock} className="me-1" /> Chờ duyệt</span>;
            case 'completed': return <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-bold"><FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Thành công</span>;
            case 'rejected': return <span className="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill fw-bold"><FontAwesomeIcon icon={faTimesCircle} className="me-1" /> Đã từ chối</span>;
            default: return null;
        }
    };

    return (
        <div className="container-fluid py-4 min-vh-100" style={{ backgroundColor: '#f4f7fe' }}>
            <header className="mb-5 d-flex justify-content-between align-items-center bg-white p-4 rounded-4 shadow-sm">
                <div>
                    <h2 className="fw-bold mb-1 text-dark d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3">
                            <FontAwesomeIcon icon={faWallet} className="text-primary" />
                        </div>
                        Quản trị Rút tiền
                    </h2>
                    <p className="text-muted mb-0">Xem và xử lý các yêu cầu rút tiền từ ví của Tasker/Khách hàng.</p>
                </div>
                <button className="btn btn-outline-primary rounded-3 px-4 py-2 fw-semibold" onClick={fetchRequests} disabled={loading}>
                    <FontAwesomeIcon icon={faHistory} className={`me-2 ${loading ? 'fa-spin' : ''}`} />
                    Làm mới danh sách
                </button>
            </header>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-muted small text-uppercase">
                            <tr>
                                <th className="ps-4 py-3">Người yêu cầu</th>
                                <th className="py-3 text-center">Số tiền</th>
                                <th className="py-3" style={{ width: '300px' }}>Thông tin Ngân hàng</th>
                                <th className="py-3">Thời gian gửi</th>
                                <th className="py-3 text-center">Trạng thái</th>
                                <th className="text-end pe-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="border-top-0">
                            {loading && requests.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p className="mt-2 text-muted mb-0">Đang tải dữ liệu...</p>
                                </td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-5 text-muted">Không có yêu cầu rút tiền nào cần xử lý.</td></tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.request_id} className="request-row border-bottom">
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className="avatar-square me-3 text-primary fw-bold">
                                                    {req.user_name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{req.user_name}</div>
                                                    <div className="small text-muted">{req.user_email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div className="fw-bolder text-primary fs-5">{formatVND(req.amount)}</div>
                                        </td>
                                        <td>
                                            <div className="bank-card p-3 rounded-4 bg-white border">
                                                <div className="small fw-bold text-dark-emphasis mb-2">
                                                    <FontAwesomeIcon icon={faUniversity} className="me-2 text-primary opacity-50" />
                                                    {req.bank_name}
                                                </div>
                                                <div className="small font-monospace fw-bold text-primary mb-1">
                                                    {req.bank_number}
                                                </div>
                                                <div className="small text-uppercase fw-medium text-muted" style={{ fontSize: '0.7rem' }}>
                                                    {req.account_holder}
                                                </div>
                                            </div>
                                            {req.note && (
                                                <div className="mt-2 small text-muted text-truncate" style={{ maxWidth: '280px' }}>
                                                    <FontAwesomeIcon icon={faCommentDots} className="me-1 opacity-50" />
                                                    "{req.note}"
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="small text-dark fw-medium">
                                                {new Date(req.created_at).toLocaleDateString('vi-VN')}
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                {new Date(req.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="text-center">{getStatusBadge(req.status)}</td>
                                        <td className="text-end pe-4">
                                            {req.status === 'pending' ? (
                                                <div className="d-flex justify-content-end gap-2">
                                                    <button
                                                        className="btn btn-success btn-sm rounded-3 px-3 fw-bold"
                                                        onClick={() => openModal(req.request_id, 'completed')}
                                                        disabled={processingId === req.request_id}
                                                    >
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm rounded-3 px-3 fw-medium"
                                                        onClick={() => openModal(req.request_id, 'rejected')}
                                                        disabled={processingId === req.request_id}
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-muted small fw-medium">
                                                    {req.status === 'completed' ? (
                                                        <span className="text-success"><FontAwesomeIcon icon={faArrowRight} className="me-1" /> Đã giải ngân</span>
                                                    ) : 'Đã đóng'}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Custom Modal with AnimatePresence */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="custom-modal p-4 rounded-4 shadow-lg bg-white"
                        >
                            <div className="text-center mb-4">
                                <div className={`modal-icon mb-3 bg-${modalData.decision === 'completed' ? 'success' : 'danger'} bg-opacity-10 text-${modalData.decision === 'completed' ? 'success' : 'danger'}`}>
                                    <FontAwesomeIcon icon={modalData.decision === 'completed' ? faCheckCircle : faTimesCircle} size="2xl" />
                                </div>
                                <h4 className="fw-bold text-dark">
                                    {modalData.decision === 'completed' ? 'Xác nhận duyệt chi' : 'Từ chối yêu cầu'}
                                </h4>
                                <p className="text-muted">
                                    {modalData.decision === 'completed'
                                        ? 'Bạn có chắc chắn muốn duyệt đơn này? Tiền sẽ được trừ khỏi ví người dùng ngay lập tức.'
                                        : 'Vui lòng nhập lý do từ chối để thông báo cho người dùng.'}
                                </p>
                            </div>

                            {modalData.decision === 'rejected' && (
                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-muted">Lý do từ chối</label>
                                    <textarea
                                        className="form-control rounded-3 border-light bg-light"
                                        rows="3"
                                        placeholder="Ví dụ: Thông tin ngân hàng không chính xác..."
                                        value={modalData.note}
                                        onChange={(e) => setModalData({ ...modalData, note: e.target.value })}
                                    ></textarea>
                                </div>
                            )}

                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-light rounded-pill flex-grow-1 py-2 fw-bold"
                                    onClick={() => setShowModal(false)}
                                    disabled={processingId}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    className={`btn btn-${modalData.decision === 'completed' ? 'success' : 'danger'} rounded-pill flex-grow-1 py-2 fw-bold`}
                                    onClick={handleConfirmAction}
                                    disabled={processingId || (modalData.decision === 'rejected' && !modalData.note.trim())}
                                >
                                    {processingId ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                    Xác nhận
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .avatar-square {
                    width: 40px;
                    height: 40px;
                    background: #eef2ff;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .bank-card {
                    background-color: #f8fafc;
                    transition: all 0.2s;
                    border: 1px solid #e2e8f0;
                }
                .request-row:hover .bank-card {
                    background-color: #fff;
                    border-color: #3b82f6;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 20px;
                }
                .custom-modal {
                    max-width: 450px;
                    width: 100%;
                }
                .modal-icon {
                    width: 70px;
                    height: 70px;
                    margin: 0 auto;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .request-row {
                    transition: background-color 0.2s;
                }
            `}</style>
        </div>
    );
};

export default AdminWithdrawal;
