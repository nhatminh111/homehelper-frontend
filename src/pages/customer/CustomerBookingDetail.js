import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Badge,
    Spinner,
    Alert,
} from "react-bootstrap";
import api from "../../services/api";
import { showToast } from "../../components/common/CustomToast";

// Popup hủy đơn lấy 100% từ BookingHistory

export default function CustomerBookingDetail() {
    const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3001";

    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    const [booking, setBooking] = useState(location.state?.booking || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const photos = booking?.task_photos ? JSON.parse(booking.task_photos) : [];
    const [previewImages, setPreviewImages] = useState([]);

    useEffect(() => {
        if (photos.length > 0) setPreviewImages(photos);
    }, [booking]);

    // Fetch booking detail
    useEffect(() => {
        if (!id) return;

        const fetchBooking = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/bookings/details/${id}`);

                if (res.data?.booking) setBooking(res.data.booking);
                else setError("Không tìm thấy booking");
            } catch (err) {
                setError("Không thể tải thông tin booking");
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [id]);

    if (loading)
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
                <p className="mt-3 text-muted">Đang tải thông tin công việc...</p>
            </Container>
        );

    if (error)
        return (
            <Container className="py-5 text-center">
                <Alert variant="danger">{error}</Alert>
                <Button onClick={() => navigate(-1)}>← Quay lại</Button>
            </Container>
        );

    if (!booking)
        return (
            <Container className="py-5 text-center">
                <p className="text-muted">Không có dữ liệu booking.</p>
                <Button onClick={() => navigate(-1)}>← Quay lại</Button>
            </Container>
        );

    // =====================================
    // Destructure booking
    // =====================================
    const {
        booking_id,
        tasker_name,
        tasker_phone,
        tasker_email,
        service_name,
        variant_name,
        task_description,
        expected_price,
        final_price,
        start_time,
        end_time,
        status,
        type,              // ← FIXED
        customer_id,
        task_checklist,
    } = booking;

    const formatDate = (t) =>
        new Date(t).toLocaleString("vi-VN", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

    const formatPrice = (p) =>
        p ? Number(p).toLocaleString("vi-VN") + "đ" : "—";

    const openCancelModal = (booking) => {
        setSelectedBooking(booking);
        setShowCancelModal(true);
    };

    const closeCancelModal = () => {
        setSelectedBooking(null);
        setShowCancelModal(false);
    };

    const handleConfirmCancel = async () => {
        setIsCancelling(true);
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            const res = await fetch(
                `${process.env.REACT_APP_API_BASE || "http://localhost:3001"}/api/bookings/${booking_id}/cancel`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user?.token}`,
                    },
                    body: JSON.stringify({ cancelledBy: "customer" }),
                }
            );

            const data = await res.json();
            if (data.success) {
                showToast.success(
                    `Hủy thành công. Hoàn: ${Number(data.refundAmount).toLocaleString("vi-VN")}₫ (Rule: ${data.rule})`
                );
                navigate("/customer/history");
            } else {
                showToast.error(`Hủy thất bại: ${data.message}`);
            }
        } catch (error) {
            showToast.error("Đã xảy ra lỗi khi hủy đơn");
        } finally {
            setIsCancelling(false);
            setShowCancelModal(false);
        }
    };

    // =====================================
    // UI Rendering
    // =====================================
    return (
        <Container className="py-5">
            <style>{`
      .history-header {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .history-header h3 {
          font-weight: 700;
          color: #0f4c75;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-select {
          border-radius: 12px;
          padding: 8px 16px;
          border: 1px solid #d0e2ff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }
        .filter-select:hover {
          border-color: #00b4d8;
        }
        .booking-row:hover {
          background-color: #f9fcff;
          transition: background-color 0.2s ease-in-out;
        }
        .table {
          border-radius: 12px;
          overflow: hidden;
        }
        button.btn {
          border-radius: 10px !important;
        }
        .action-buttons {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          flex-wrap: nowrap;
        }
          .cancel-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.4);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }

        .cancel-box {
            background: white;
            padding: 24px;
            border-radius: 12px;
            max-width: 480px;
            width: 90%;
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .cancel-box h5 {
            color: #d90429;
            font-weight: bold;
            margin-bottom: 12px;
        }

        .cancel-box ul {
            font-size: 14px;
            color: #555;
            margin-bottom: 16px;
        }
      `}</style>
            {/* Tiêu đề */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-2">Chi tiết công việc</h3>
                    <p className="text-muted mb-0">
                        Xem thông tin người giúp việc và yêu cầu công việc
                    </p>
                </div>
                <div className="text-end">
                    <div className="d-flex align-items-center justify-content-end gap-2">
                        {type === 'SOS' ? <Badge bg="danger" className="px-3 py-2">SOS</Badge> : null}
                        <Badge
                            bg={
                                status === "Chờ xử lý"
                                    ? "warning"
                                    : status === "Đã chấp nhận"
                                        ? "info"
                                        : status === "Đã thanh toán"
                                            ? "success"
                                            : status === "Đang tiến hành"
                                                ? "primary"
                                                : status === "Hoàn thành"
                                                    ? "success"
                                                    : status === "Hủy"
                                                        ? "danger"
                                                        : status === "Chờ duyệt báo cáo"
                                                            ? "warning"
                                                            : status === "Báo cáo được duyệt"
                                                                ? "info"
                                                                : status === "Báo cáo bị từ chối"
                                                                    ? "dark"
                                                                    : "secondary"
                            }
                            className="px-3 py-2 fs-6"
                        >
                            {status === "Chờ xử lý"
                                ? "⏳"
                                : status === "Đã chấp nhận"
                                    ? "🤝"
                                    : status === "Đã thanh toán"
                                        ? "💰"
                                        : status === "Đang tiến hành"
                                            ? "🔄"
                                            : status === "Hoàn thành"
                                                ? "🎉"
                                                : status === "Hủy"
                                                    ? "❌"
                                                    : status === "Chờ duyệt báo cáo"
                                                        ? "📝"
                                                        : status === "Báo cáo được duyệt"
                                                            ? "✔"
                                                            : status === "Báo cáo bị từ chối"
                                                                ? "✖"
                                                                : "❓"}{" "}
                            {status}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Nội dung chi tiết */}
            <Row className="g-4 align-items-stretch">
                {/* Thông tin khách hàng */}
                <Col md={5}>
                    <Card className="shadow-sm border-0 h-100" style={{ borderRadius: "14px" }}>
                        <Card.Body>
                            <h5 className="fw-bold mb-4">Thông tin người giúp viẹc</h5>

                            <div className="d-flex flex-column gap-3 text-secondary">
                                <div>
                                    <h6 className="fw-semibold mb-0 text-dark">
                                        {tasker_name}
                                    </h6>
                                    <small className="text-muted">
                                        ⭐ 4.8 đánh giá • 12 công việc đã hoàn thành
                                    </small>
                                </div>

                                {tasker_phone && (
                                    <div>
                                        <i className="bi bi-telephone text-primary me-2"></i>
                                        {tasker_phone}
                                    </div>
                                )}

                                {tasker_email && (
                                    <div>
                                        <i className="bi bi-envelope text-primary me-2"></i>
                                        {tasker_email}
                                    </div>
                                )}

                                {booking.location && (
                                    <div>
                                        <i className="bi bi-geo-alt text-primary me-2"></i>
                                        {booking.location}
                                    </div>
                                )}

                                {type ? (
                                    <div>
                                        <i className="bi bi-house-door text-primary me-2"></i>
                                        Loại: {type}
                                    </div>
                                ) : null}

                                {(start_time || end_time) && (
                                    <div>
                                        <i className="bi bi-clock text-primary me-2"></i>
                                        {formatDate(start_time)} → {formatDate(end_time)}
                                        <br />
                                    </div>
                                )}
                            </div>

                            <hr className="mt-4 mb-3" />

                            <div>
                                <span className="fw-medium text-muted">Giá mong muốn</span>
                                <span className="fw-bold text-success fs-5 ms-2">
                                    {formatPrice(expected_price || final_price)}
                                </span>
                            </div>

                            {final_price != null &&
                                final_price !== "" &&
                                Number(final_price) !== 0 && (
                                    <div className="mt-2">
                                        <span className="fw-medium text-muted">Giá sau thương lượng</span>
                                        <span className="fw-bold text-primary fs-5 ms-2">
                                            {`${(Number(final_price)).toLocaleString("vi-VN")}đ`}
                                        </span>
                                    </div>
                                )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Chi tiết công việc */}

                <Col md={7}>
                    <Card className="shadow-sm border-0 h-100" style={{ borderRadius: "14px" }}>
                        <Card.Body>
                            <h5 className="fw-bold mb-2">
                                {task_description || "Chưa có tiêu đề"}
                            </h5>
                            <h6 className="text-primary fw-semibold mb-2">
                                <i className="bi bi-file-text me-2"></i>Tóm tắt công việc :
                            </h6>
                            <p className="text-muted">{task_checklist || "Không có mô tả."}</p>

                            {previewImages.length > 0 && (
                                <>
                                    <h6 className="mt-4 mb-2">
                                        <i className="bi bi-images me-2"></i>Ảnh đính kèm
                                    </h6>
                                    <div className="d-flex flex-wrap gap-3">
                                        {previewImages.map((url, i) => (
                                            <img
                                                key={i}
                                                src={url}
                                                alt=""
                                                width={140}
                                                height={100}
                                                style={{
                                                    objectFit: "cover",
                                                    borderRadius: "10px",
                                                    boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <hr className="my-4" />
                                </>
                            )}

                            {(service_name || variant_name) && (
                                <>
                                    <div className="d-flex align-items-center mt-2">
                                        <p className="text-muted mb-0 me-2">Dịch vụ đã chọn:</p>
                                        <span className="fw-semibold text-dark">
                                            {service_name || "Dịch vụ"} – {variant_name || ""}
                                        </span>
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Nút hành động */}
            <div className="d-flex justify-content-center gap-4 mt-5 flex-wrap flex-column align-items-center">

                <div className="d-flex justify-content-center gap-4 flex-wrap">
                    {(status === "Chờ xử lý" || status === "Đã chấp nhận" || status === "Đã thanh toán") && (
                        <>
                            <Button
                                variant="danger"
                                size="lg"
                                className="px-5 fw-semibold"
                                style={{ borderRadius: "10px", minWidth: "160px" }}
                                onClick={() => openCancelModal(booking)}
                            >
                                ❌ Hủy công việc
                            </Button>

                            {status === "Đã chấp nhận" && (
                                <Button
                                    variant="success"
                                    size="lg"
                                    className="px-4"
                                    onClick={() => navigate(`/payment/${booking_id}`)}
                                >
                                    💳 Thanh toán
                                </Button>
                            )}

                        </>
                    )}

                    {(status === "Chờ xử lý" || status === "Đã chấp nhận" || type === "SOS") && (
                        <Button
                            variant="primary"
                            size="lg"
                            className="px-5 fw-semibold"
                            style={{ borderRadius: "10px", minWidth: "160px" }}
                            onClick={() => {
                                window.location.href = `/chat?bookingId=${booking_id}&peer=${customer_id}`;
                            }}
                        >
                            💬 Chat với người giúp việc
                        </Button>
                    )}
                </div>
            </div>

            {/* CANCEL POPUP */}
            {showCancelModal && (
                <div className="cancel-overlay" onClick={closeCancelModal}>
                    <div className="cancel-box" onClick={(e) => e.stopPropagation()}>
                        <h5>📜 Chính sách hủy & hoàn tiền</h5>
                        <ul>
                            <li>🕐 Trên 24h: Hoàn 100%</li>
                            <li>⏰ 12–24h: Hoàn 75% – trừ 25%</li>
                            <li>⌛ 4–12h: Hoàn 50% – đền 50%</li>
                            <li>🚫 Dưới 4h: Không hoàn tiền</li>
                            <li>🏠 Khách không có mặt: Không hoàn tiền (xác minh)</li>
                        </ul>
                        <p className="fw-semibold text-danger">Bạn có chắc chắn muốn hủy đơn này không?</p>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <Button
                                variant="secondary"
                                className="px-4 py-2 fw-semibold"
                                onClick={closeCancelModal}
                            >
                                Đóng
                            </Button>

                            <Button
                                variant="danger"
                                className="px-4 py-2 fw-semibold"
                                onClick={handleConfirmCancel}
                                disabled={isCancelling}
                            >
                                {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </Container>
    );
}
