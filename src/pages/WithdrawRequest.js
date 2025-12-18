import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faWallet, faMoneyBillWave, faInfoCircle,
    faUniversity, faFileAlt, faCheckCircle, faBuilding, faUser
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { formatVND } from '../utils/formatVND';
import { showToast } from '../components/common/CustomToast';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '').replace(/\/api$/, '');
const token = () => localStorage.getItem('token') || '';

const WithdrawRequestPage = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        amount: '',
        bank_name: '',
        bank_number: '',
        account_holder: '',
        note: ''
    });

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/wallet/balance`, {
                    headers: { Authorization: `Bearer ${token()}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setBalance(Number(data.balance || 0));
                }
            } catch (err) {
                showToast.error('Không thể tải số dư ví');
            } finally {
                setLoading(false);
            }
        };
        fetchBalance();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const rawAmount = Number(formData.amount);

        if (rawAmount < 50) {
            showToast.error('Số tiền rút tối thiểu là 50 (tương đương 50.000 VNĐ)');
            return;
        }

        if (rawAmount > balance) {
            showToast.error('Số dư ví không đủ');
            return;
        }

        if (!formData.bank_name || !formData.bank_number || !formData.account_holder) {
            showToast.error('Vui lòng nhập đầy đủ thông tin ngân hàng');
            return;
        }

        try {
            setSubmitting(true);
            const res = await fetch(`${API_BASE}/api/wallet/withdraw/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                showToast.success('Yêu cầu rút tiền đã được gửi thành công!');
                setTimeout(() => navigate('/wallet'), 2000);
            } else {
                showToast.error(data.message || 'Gửi yêu cầu thất bại');
            }
        } catch (err) {
            showToast.error('Lỗi khi gửi yêu cầu');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="withdraw-page py-5" style={{ backgroundColor: '#f4f7fe', minHeight: '100vh' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-7 col-xl-6">
                        <Link to="/wallet" className="btn btn-link text-decoration-none text-secondary mb-4 p-0 hover-translate-x">
                            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Quay lại ví
                        </Link>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card border-0 shadow-lg rounded-4 overflow-hidden"
                        >
                            {/* Premium Header */}
                            <div className="premium-header p-5 text-white position-relative">
                                <div className="position-relative z-index-1">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="header-icon-box p-3 rounded-3 bg-white bg-opacity-20 me-3">
                                            <FontAwesomeIcon icon={faWallet} size="xl" />
                                        </div>
                                        <h2 className="mb-0 fw-bold">Rút tiền</h2>
                                    </div>
                                    <p className="mb-0 opacity-75">Gửi yêu cầu rút tiền về tài khoản ngân hàng của bạn một cách nhanh chóng và an toàn nhất.</p>
                                </div>
                                <div className="header-decoration"></div>
                            </div>

                            <div className="card-body p-4 p-md-5 mt-n4 position-relative z-index-2">
                                {/* Balance Card Section */}
                                <div className="balance-display card border-0 shadow-sm rounded-4 p-4 mb-5 text-center bg-white">
                                    <span className="text-muted small text-uppercase fw-bold letter-spacing-1 mb-2 d-block">Số dư khả dụng</span>
                                    <div className="display-5 fw-bold text-primary">
                                        {loading ? (
                                            <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                        ) : (
                                            formatVND(balance)
                                        )}
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    {/* Amount Input */}
                                    <div className="form-group mb-4 text-center">
                                        <label className="form-label fw-bold text-dark-800 d-block mb-3">Số tiền bạn muốn rút</label>
                                        <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden mx-auto" style={{ maxWidth: '320px' }}>
                                            <span className="input-group-text bg-white border-end-0 text-primary">
                                                <FontAwesomeIcon icon={faMoneyBillWave} />
                                            </span>
                                            <input
                                                type="number"
                                                name="amount"
                                                className="form-control border-end-0 border-start-0 ps-0 fw-bold text-end"
                                                placeholder="150"
                                                value={formData.amount}
                                                onChange={handleChange}
                                                required
                                            />
                                            <span className="input-group-text bg-white border-start-0 fw-bold text-muted pe-4">.000 VNĐ</span>
                                        </div>

                                        {/* Real-time validation message */}
                                        <div className="mt-2" style={{ minHeight: '24px' }}>
                                            {formData.amount && (
                                                Number(formData.amount) < 50 ? (
                                                    <div className="text-danger small fw-medium">
                                                        <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                                                        Số tiền rút tối thiểu là 50 (tương đương 50.000 VNĐ)
                                                    </div>
                                                ) : Number(formData.amount) > balance ? (
                                                    <div className="text-danger small fw-medium">
                                                        <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                                                        Số dư không đủ để rút {formatVND(formData.amount)}
                                                    </div>
                                                ) : (
                                                    <div className="text-success small fw-bold">
                                                        <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                                        Số tiền rút hợp lệ: <span className="text-decoration-underline">{formatVND(formData.amount)}</span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Bank Information Grid */}
                                    <div className="bank-info-container p-4 rounded-4 bg-light-blue border-blue-100 mb-4">
                                        <h6 className="fw-bold text-dark mb-4 d-flex align-items-center">
                                            <FontAwesomeIcon icon={faBuilding} className="me-2 text-primary" />
                                            Thông tin tài khoản nhận tiền
                                        </h6>
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <div className="form-floating mb-2">
                                                    <input
                                                        type="text"
                                                        name="bank_name"
                                                        className="form-control border-0 shadow-sm"
                                                        id="bankNameInput"
                                                        placeholder="Vietcombank, MB Bank..."
                                                        value={formData.bank_name}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                    <label htmlFor="bankNameInput" className="text-muted"><FontAwesomeIcon icon={faUniversity} className="me-2" />Ngân hàng nhận</label>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-floating">
                                                    <input
                                                        type="text"
                                                        name="bank_number"
                                                        className="form-control border-0 shadow-sm"
                                                        id="bankNumberInput"
                                                        placeholder="Số tài khoản"
                                                        value={formData.bank_number}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                    <label htmlFor="bankNumberInput" className="text-muted"><FontAwesomeIcon icon={faFileAlt} className="me-2" />Số tài khoản</label>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-floating">
                                                    <input
                                                        type="text"
                                                        name="account_holder"
                                                        className="form-control border-0 shadow-sm text-uppercase fw-bold"
                                                        id="accountHolderInput"
                                                        placeholder="NGUYEN VAN A"
                                                        value={formData.account_holder}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                    <label htmlFor="accountHolderInput" className="text-muted"><FontAwesomeIcon icon={faUser} className="me-2" />Chủ tài khoản</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Optional Note */}
                                    <div className="form-group mb-5">
                                        <label className="form-label fw-bold text-dark-800 small">Ghi chú kèm theo (Tùy chọn)</label>
                                        <textarea
                                            name="note"
                                            className="form-control premium-textarea"
                                            rows="2"
                                            placeholder="Lời nhắn cho Admin..."
                                            value={formData.note}
                                            onChange={handleChange}
                                        ></textarea>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-premium-action w-100 rounded-pill shadow-lg"
                                        disabled={submitting || loading}
                                    >
                                        {submitting ? (
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                        ) : (
                                            <>
                                                Gửi yêu cầu rút tiền <FontAwesomeIcon icon={faCheckCircle} className="ms-2" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <style>{`
        .premium-header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          min-height: 200px;
        }
        .header-decoration {
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
          bottom: -150px;
          right: -100px;
          border-radius: 50%;
        }
        .header-icon-box {
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .mt-n4 { margin-top: -1.5rem !important; }
        .z-index-1 { z-index: 1; }
        .z-index-2 { z-index: 2; }
        .bg-light-blue { background-color: #f0f7ff; }
        .border-blue-100 { border: 1px solid #e1effe; }
        .form-dark-800 { color: #1e293b; }
        .letter-spacing-1 { letter-spacing: 1px; }
        .fs-xs { font-size: 0.75rem; }
        
        .premium-input, .form-floating .form-control {
          background: #ffffff;
          padding-left: 3rem !important;
          border-radius: 12px;
          transition: all 0.3s;
        }
        .form-floating .form-control { padding-left: 1rem !important; }
        .input-with-icon { position: relative; }
        .input-icon-left {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          font-size: 1.2rem;
        }
        .input-unit {
          position: absolute;
          right: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
        }
        .premium-textarea {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        .premium-textarea:focus {
          background: #fff;
          border-color: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
        }
        .btn-premium-action {
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 700;
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
          border: none;
          transition: all 0.3s;
        }
        .btn-premium-action:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(79, 70, 229, 0.4);
        }
        .hover-translate-x:hover {
          transform: translateX(-5px);
          transition: 0.3s;
        }
      `}</style>
        </div>
    );
};

export default WithdrawRequestPage;
