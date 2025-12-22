import React, { useEffect, useState } from "react";
import { Container, Badge, Button, Spinner, Row, Col, Card } from "react-bootstrap";
import {
    Calendar,
    MapPin,
    Clock,
    Info,
    MessageCircle,
    ChevronRight,
    CreditCard,
    Star,
    FileText,
    XCircle,
    Search,
    Filter,
    ClipboardList,
    TrendingUp,
    CheckCircle2,
    Clock3,
    AlertCircle,
    History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NegotiatePriceButton from "../../components/negotiation/NegotiatePriceButton";
import { useNavigate } from "react-router-dom";
import { formatVND } from "../../utils/formatVND";
import { showToast } from "../../components/common/CustomToast";

const STATUS_OPTIONS = [
    { label: "Tất cả", value: "all", color: "#64748b", icon: Filter },
    { label: "Chờ xử lý", value: "Pending", color: "#f59e0b", icon: Clock3 },
    { label: "Đã chấp nhận", value: "Accepted", color: "#3b82f6", icon: CheckCircle2 },
    { label: "Đã thanh toán", value: "Paid", color: "#8b5cf6", icon: CreditCard },
    { label: "Đang tiến hành", value: "In Progress", color: "#06b6d4", icon: TrendingUp },
    { label: "Chờ xác nhận", value: "Pending Confirmation", color: "#f97316", icon: AlertCircle },
    { label: "Hoàn thành", value: "Completed", color: "#10b981", icon: Star },
    { label: "Hủy", value: "Cancelled", color: "#ef4444", icon: XCircle },
];

export default function BookingHistory() {
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:3001/api").replace(/\/api$/, "").replace(/\/$/, "");

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem("user"));
            const token = user?.token;
            if (!token) return;

            let url = `${API_BASE}/api/bookings/mybookings`;
            if (statusFilter !== "all") url += `?status=${statusFilter}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setBookings(data.data || []);
        } catch (err) {
            console.error("❌ Error fetching bookings:", err);
            showToast.error("Không thể tải danh sách đặt lịch.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    const openCancelModal = (booking) => {
        setSelectedBooking(booking);
        setShowCancelModal(true);
    };

    const closeCancelModal = () => {
        setSelectedBooking(null);
        setShowCancelModal(false);
    };

    const handleConfirmCancel = async () => {
        if (!selectedBooking) return;
        setIsCancelling(true);

        try {
            const user = JSON.parse(localStorage.getItem("user"));
            const res = await fetch(`${API_BASE}/api/bookings/${selectedBooking.booking_id}/cancel`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user?.token}`,
                },
                body: JSON.stringify({ cancelledBy: "customer" }),
            });

            const data = await res.json();
            if (data.success) {
                showToast.success(`Hủy thành công! Quy tắc: ${data.rule}. Hoàn: ${formatVND(data.refundAmount)}`);
                fetchBookings();
            } else {
                showToast.error(`Hủy thất bại: ${data.message}`);
            }
        } catch (err) {
            console.error("Cancel booking failed:", err);
            showToast.error("Lỗi khi gửi yêu cầu hủy!");
        } finally {
            setIsCancelling(false);
            closeCancelModal();
        }
    };

    const getStatusInfo = (status) => {
        const option = STATUS_OPTIONS.find(o => o.value === status || o.label === status);
        if (option) return option;

        // Fallback checks
        if (status?.includes("Hoàn")) return STATUS_OPTIONS.find(o => o.value === "Completed");
        if (status?.includes("Hủy")) return STATUS_OPTIONS.find(o => o.value === "Cancelled");
        if (status?.includes("Chờ xử lý")) return STATUS_OPTIONS.find(o => o.value === "Pending");
        if (status?.includes("Chấp")) return STATUS_OPTIONS.find(o => o.value === "Accepted");
        if (status?.includes("Thanh toán")) return STATUS_OPTIONS.find(o => o.value === "Paid");
        if (status?.includes("tiến hành")) return STATUS_OPTIONS.find(o => o.value === "In Progress");
        if (status?.includes("xác nhận")) return STATUS_OPTIONS.find(o => o.value === "Pending Confirmation");

        return { label: status, color: "#64748b", icon: Info };
    };

    const handleContract = (booking) => {
        window.location.href = `/contract/${booking.booking_id}`;
    };

    return (
        <Container className="py-5" style={{ background: '#f8fafc', minHeight: '100vh', borderRadius: '24px' }}>
            <style>{`
                .booking-history-container {
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }

                /* Page Header Styling */
                .page-header {
                    margin-bottom: 2.5rem;
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    padding: 3rem 2rem;
                    border-radius: 2rem;
                    color: white;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }

                .page-title {
                    font-size: 2.25rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.025em;
                }

                /* Tab Bar Styles */
                .status-tabs {
                    display: flex;
                    gap: 0.75rem;
                    overflow-x: auto;
                    padding: 0.5rem;
                    margin-bottom: 2.5rem;
                    scrollbar-width: none;
                    background: white;
                    padding: 1rem;
                    border-radius: 9999px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .status-tabs::-webkit-scrollbar { display: none; }

                .status-tab {
                    padding: 0.75rem 1.5rem;
                    border-radius: 9999px;
                    border: 1px solid transparent;
                    background: transparent;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 0.875rem;
                    white-space: nowrap;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .status-tab:hover {
                    color: #1e293b;
                    background: #f1f5f9;
                }

                .status-tab.active {
                    background: #1e293b;
                    color: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                /* Refined Booking Card */
                .booking-card {
                    background: white;
                    border-radius: 2rem;
                    border: 1px solid #eef2f6;
                    padding: 2.25rem;
                    margin-bottom: 1.5rem;
                    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
                    overflow: visible;
                }

                .booking-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 25px 40px -12px rgba(0, 0, 0, 0.08);
                    border-color: #e2e8f0;
                }


                .booking-id-tag {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.875rem;
                    color: #94a3b8;
                    margin-bottom: 0.5rem;
                    display: block;
                }

                .card-header-main {
                    margin-bottom: 1.75rem;
                    padding-right: 0; 
                }

                .service-display {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                }

                .service-icon-wrapper {
                    width: 60px;
                    height: 60px;
                    background: #f1f5f9;
                    border-radius: 1.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #475569;
                    flex-shrink: 0;
                }

                .service-details h3 {
                    font-size: 1.375rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 0.25rem;
                }

                .variant-pill {
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                    background: #f1f5f9;
                    padding: 0.25rem 0.75rem;
                    border-radius: 0.5rem;
                    display: inline-block;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                    padding: 1.5rem;
                    background: #f8fafc;
                    border-radius: 1.5rem;
                }

                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .info-icon-circle {
                    width: 36px;
                    height: 36px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .info-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #94a3b8;
                    text-transform: uppercase;
                    margin-bottom: 0.125rem;
                }

                .info-value {
                    font-size: 0.9375rem;
                    font-weight: 700;
                    color: #334155;
                }

                .price-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 2px dashed #f1f5f9;
                    padding-top: 1.5rem;
                    margin-top: 0.5rem;
                }

                .total-amount {
                    font-size: 1.75rem;
                    font-weight: 900;
                    color: #1e293b;
                    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .footer-actions {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 1.5rem;
                    flex-wrap: wrap;
                }

                .btn-modern {
                    padding: 0.75rem 1.5rem;
                    border-radius: 1rem;
                    font-weight: 700;
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    transition: all 0.3s;
                    border: none;
                }

                .btn-modern:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 15px rgba(0,0,0,0.1);
                }

                .btn-primary-modern { background: #1e293b; color: white; }
                .btn-outline-modern { background: #f1f5f9; color: #1e293b; }
                .btn-danger-modern { background: #fee2e2; color: #ef4444; }
                .btn-success-modern { background: #dcfce7; color: #16a34a; }
                .btn-warning-modern { background: #fef9c3; color: #ca8a04; }

                /* Modal Adjustments */
                .cancel-modal-content {
                    border: none;
                    border-radius: 2.5rem;
                }

                @media (max-width: 768px) {
                    .info-grid { grid-template-columns: 1fr; }
                    .card-header-main { padding-right: 0; margin-top: 1rem; }
                    .status-badge-container { margin-bottom: 1.5rem; }
                    .page-header { padding: 2rem 1rem; }
                    .total-amount { font-size: 1.5rem; }
                }
            `}</style>

            <div className="booking-history-container">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="page-header text-center"
                >
                    <h1 className="page-title">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                            <History size={32} strokeWidth={2.5} />
                            Lịch sử đặt lịch
                        </span>
                    </h1>
                    <p className="opacity-75 lead">Chào mừng trở lại! Bạn có thể xem lại toàn bộ hành trình trải nghiệm dịch vụ tại đây.</p>
                </motion.div>

                {/* Status Filter Tabs */}
                <div className="status-tabs">
                    {STATUS_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                            <motion.button
                                key={opt.value}
                                whileTap={{ scale: 0.95 }}
                                className={`status-tab ${statusFilter === opt.value ? 'active' : ''}`}
                                onClick={() => setStatusFilter(opt.value)}
                            >
                                <Icon size={16} />
                                {opt.label}
                            </motion.button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="d-flex flex-column align-items-center justify-content-center py-5">
                        <div className="spinner-grow text-dark mb-3" role="status"></div>
                        <p className="text-muted fw-bold">Đang tải dữ liệu...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-5 px-4 bg-white rounded-5 shadow-sm border-0"
                    >
                        <div className="mb-4 d-inline-flex p-5 bg-light rounded-circle">
                            <Search size={64} className="text-muted opacity-20" />
                        </div>
                        <h2 className="fw-black text-dark mb-3">Trống trơn rồi...</h2>
                        <p className="text-muted mb-4 fs-5">Hệ thống không tìm thấy đơn nào ở trạng thái này.</p>
                        <Button
                            variant="dark"
                            className="rounded-pill px-5 py-3 fw-bold shadow-lg"
                            onClick={() => setStatusFilter('all')}
                        >
                            Quay lại xem tất cả
                        </Button>
                    </motion.div>
                ) : (
                    <div className="booking-list">
                        <AnimatePresence mode="popLayout">
                            {bookings.map((b, idx) => {
                                const statusInfo = getStatusInfo(b.status);
                                const StatusIcon = statusInfo.icon;
                                return (
                                    <motion.div
                                        key={b.booking_id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.4, delay: idx * 0.08 }}
                                        className="booking-card shadow-sm"
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            width: '100%',
                                            paddingBottom: '1.25rem',
                                            borderBottom: '1px solid #f1f5f9',
                                            marginBottom: '1.5rem',
                                            flexWrap: 'wrap',
                                            gap: '0.75rem'
                                        }}>
                                            <span style={{
                                                fontSize: '0.875rem',
                                                fontWeight: 900,
                                                color: '#000000ff',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>Tình trạng:</span>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: statusInfo.color,
                                                fontSize: '1rem',
                                                fontWeight: 900,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>
                                                <StatusIcon size={20} strokeWidth={3} />
                                                {statusInfo.label}
                                            </div>
                                        </div>

                                        <div className="card-header-main">
                                            <span className="booking-id-tag">ID TRANSACTION: HH-{b.booking_id.toString().padStart(6, '0')}</span>
                                            <div className="service-display">
                                                <div className="service-icon-wrapper">
                                                    <ClipboardList size={28} strokeWidth={2.5} />
                                                </div>
                                                <div className="service-details">
                                                    <h3>{b.service_name}</h3>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="variant-pill">{b.variant_name || "Dịch vụ"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="info-grid shadow-inner">
                                            <div className="info-item">
                                                <div className="info-icon-circle">
                                                    <Calendar size={18} className="text-primary" />
                                                </div>
                                                <div>
                                                    <div className="info-label">Ngày đặt</div>
                                                    <div className="info-value">
                                                        {b.booking_time ? new Date(b.booking_time).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="info-item">
                                                <div className="info-icon-circle">
                                                    <TrendingUp size={18} className="text-success" />
                                                </div>
                                                <div>
                                                    <div className="info-label">Ngày thực hiện</div>
                                                    <div className="info-value">
                                                        {b.start_time ? new Date(b.start_time).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="info-item">
                                                <div className="info-icon-circle">
                                                    <MapPin size={18} className="text-danger" />
                                                </div>
                                                <div>
                                                    <div className="info-label">Vị trí thực hiện</div>
                                                    <div className="info-value text-truncate" style={{ maxWidth: '150px' }}>{b.location || "Chưa xác định"}</div>
                                                </div>
                                            </div>
                                            <div className="info-item">
                                                <div className="info-icon-circle">
                                                    <Info size={18} className="text-info" />
                                                </div>
                                                <div>
                                                    <div className="info-label">Loại dịch vụ</div>
                                                    <div className="info-value">{b.type || "Cơ bản"}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="price-section">
                                            <div className="d-flex flex-column">
                                                <span className="info-label">Số tiền thanh toán</span>
                                                <span className="total-amount">
                                                    {(() => {
                                                        if (b.paid_amount && Number(b.paid_amount) > 0) {
                                                            return formatVND(b.paid_amount);
                                                        }
                                                        const isFinalized = ["Đã chấp nhận", "Đã thanh toán", "Đang tiến hành", "Hoàn thành", "Chờ xác nhận"].includes(b.status);
                                                        const quantity = Number(b.quantity || 1);
                                                        const mult = (isFinalized && quantity > 1) ? quantity : 1;
                                                        const price = b.final_price && Number(b.final_price) > 0 ? Number(b.final_price) : Number(b.expected_price || 0);

                                                        return price > 0 ? formatVND(price * mult) : "-";
                                                    })()}
                                                </span>
                                            </div>
                                            <Button
                                                className="btn-modern btn-primary-modern shadow-lg"
                                                onClick={() => navigate(`/customer/booking/${b.booking_id}`, { state: { booking: b } })}
                                            >
                                                Chi tiết <ChevronRight size={18} />
                                            </Button>
                                        </div>

                                        <div className="footer-actions">
                                            {(() => {
                                                const isWeekOrMonth = b.pricing_type && ["week", "month", "tuần", "tháng"].some(k => b.pricing_type.toLowerCase().includes(k));

                                                return (
                                                    <>
                                                        {/* Nút Thanh toán */}
                                                        {(b.status === "Đã ký hợp đồng" || (b.status === "Đã chấp nhận" && !isWeekOrMonth)) && (
                                                            <Button className="btn-modern btn-primary-modern" onClick={() => navigate(`/payment/${b.booking_id}`)}>
                                                                <CreditCard size={18} /> Thanh toán
                                                            </Button>
                                                        )}

                                                        {/* Nút Ký hợp đồng */}
                                                        {b.status === "Đã chấp nhận" && isWeekOrMonth && (
                                                            <Button className="btn-modern btn-primary-modern" style={{ background: '#f59e0b' }} onClick={() => handleContract(b)}>
                                                                <FileText size={18} /> Ký hợp đồng
                                                            </Button>
                                                        )}
                                                    </>
                                                );
                                            })()}

                                            {b.status === "Hoàn thành" && (
                                                <Button className="btn-modern btn-warning-modern" onClick={() => navigate(`/customer/booking/${b.booking_id}/rating`, { state: { booking: b } })}>
                                                    <Star size={18} /> Gửi đánh giá
                                                </Button>
                                            )}

                                            {["Chờ xử lý", "Đã chấp nhận", "Đã thanh toán"].includes(b.status) && (
                                                <Button className="btn-modern btn-danger-modern" onClick={() => openCancelModal(b)}>
                                                    <XCircle size={18} /> Hủy yêu cầu
                                                </Button>
                                            )}

                                            {["Chờ xử lý", "Đã chấp nhận"].includes(b.status) && (
                                                <Button
                                                    className="btn-modern btn-success-modern"
                                                    onClick={() => navigate(`/chat?bookingId=${b.booking_id}&negotiation=1&peer=${b.tasker_id}`)}
                                                >
                                                    <MessageCircle size={18} /> Trò chuyện
                                                </Button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {showCancelModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="cancel-overlay"
                        onClick={closeCancelModal}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            className="cancel-box rounded-5 border-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-4">
                                <div className="d-inline-flex p-4 bg-danger bg-opacity-10 rounded-circle mb-4">
                                    <AlertCircle size={40} className="text-danger" />
                                </div>
                                <h2 className="fw-black text-dark mb-2">Quy định hủy đơn</h2>
                                <p className="text-muted fs-6">Hành động này có thể đi kèm phí dịch vụ.</p>
                            </div>

                            <Card className="bg-light border-0 rounded-4 mb-4">
                                <Card.Body className="p-4">
                                    <div className="d-flex gap-3 mb-3 pb-3 border-bottom border-secondary border-opacity-10">
                                        <Clock size={20} className="text-primary flex-shrink-0" />
                                        <span><strong>Trên 24h:</strong> Không mất phí, hoàn tiền 100% về ví.</span>
                                    </div>
                                    <div className="d-flex gap-3 mb-3 pb-3 border-bottom border-secondary border-opacity-10">
                                        <Clock size={20} className="text-warning flex-shrink-0" />
                                        <span><strong>12h - 24h:</strong> Phí dịch vụ 25%, hoàn lại 75%.</span>
                                    </div>
                                    <div className="d-flex gap-3 mb-3 pb-3 border-bottom border-secondary border-opacity-10">
                                        <Clock size={20} className="text-danger flex-shrink-0" />
                                        <span><strong>4h - 12h:</strong> Phí dịch vụ 50%, hoàn lại 50%.</span>
                                    </div>
                                    <div className="d-flex gap-3">
                                        <XCircle size={20} className="text-dark flex-shrink-0" />
                                        <span><strong>Dưới 4h:</strong> Rất tiếc, chúng tôi không hỗ trợ hoàn tiền.</span>
                                    </div>
                                </Card.Body>
                            </Card>

                            <div className="alert alert-info border-0 rounded-4 d-flex align-items-center mb-4 p-3">
                                <Info size={24} className="me-3 opacity-50" />
                                <small className="fw-bold">Yêu cầu hủy sẽ được Admin duyệt trong vòng 24h làm việc.</small>
                            </div>

                            <div className="d-grid gap-3">
                                <Button
                                    variant="danger"
                                    className="py-3 fw-black rounded-4 shadow-lg border-0"
                                    onClick={handleConfirmCancel}
                                    disabled={isCancelling}
                                >
                                    {isCancelling ? <Spinner size="sm" className="me-2" /> : null}
                                    {isCancelling ? "Đang hủy đơn..." : "Đồng ý và Hủy ngay"}
                                </Button>
                                <Button
                                    variant="light"
                                    className="py-3 fw-bold rounded-4 text-muted border-0"
                                    onClick={closeCancelModal}
                                >
                                    Tôi muốn giữ lại đơn
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </Container>
    );
}