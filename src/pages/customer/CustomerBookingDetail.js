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
    Modal,
    Image
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
    const [timers, setTimers] = useState({});

    const photos = booking?.task_photos ? JSON.parse(booking.task_photos) : [];
    const [previewImages, setPreviewImages] = useState([]);

    const formatTime = (ms) => {
        if (!ms) return "0s";
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}m ${sec}s`;
    };

    useEffect(() => {
        if (photos.length > 0) setPreviewImages(photos);
    }, [booking]);

    // Fetch booking detail
    useEffect(() => {
        if (!id) return;

        const fetchBooking = async () => {
            try {
                setLoading(true);
                let res;

                // 1) Tạm load thông tin cơ bản để kiểm tra status
                const basic = await api.get(`/bookings/details/${id}`);
                const b = basic.data?.booking;

                if (!b) {
                    setError("Không tìm thấy booking");
                    return;
                }

                // 2) Nếu status = "Chờ xác nhận" → lấy JobDone của tasker
                if (b.status === "Chờ xác nhận") {
                    res = await api.get(`/bookings/info/${id}`);
                    setBooking(res.data);

                    setTimers(res.data?.checklist_timers || {});
                } else {
                    // 3) Các status khác → dùng dữ liệu booking ban đầu
                    setBooking(basic.data.booking);
                }
            } catch (err) {
                setError("Không thể tải thông tin booking");
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [id]);

    const beforePhotos = Array.isArray(booking?.before_photos)
        ? booking.before_photos
        : [];

    const afterPhotos = Array.isArray(booking?.after_photos)
        ? booking.after_photos
        : [];


    const [showModal, setShowModal] = useState(false);
    const [activeImage, setActiveImage] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showComplaintModal, setShowComplaintModal] = useState(false);

    const allImages = [...beforePhotos, ...afterPhotos].filter(Boolean);

    const openImageModal = (index) => {
        setCurrentImageIndex(index);
        setActiveImage(allImages[index]);
        setShowModal(true);
    };

    const closeImageModal = () => setShowModal(false);

    const handleConfirmComplete = async () => {
        try {
            await api.patch(`/bookings/${id}/confirm`);

            showToast.success("Đã xác nhận hoàn thành! Tasker sẽ nhận tiền.");

            window.location.reload();
        } catch (err) {
            console.error(err);
            showToast.error("Có lỗi xảy ra khi xác nhận hoàn thành.");
        }
    };

    const handleOpenComplaint = () => {
        setShowComplaintModal(true);
    };

    const [showPopup, setShowPopup] = useState(false);
    const [complaintType, setComplaintType] = useState("not_quality");
    const [complaintText, setComplaintText] = useState("");
    const [complaintImage, setComplaintImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmitComplaint = async () => {
        // VALIDATION
        if (!complaintText.trim()) {
            showToast.error("Vui lòng nhập mô tả vấn đề.");
            return;
        }

        if (complaintType === "not_quality" && !complaintImage) {
            showToast.error("Bạn cần upload ảnh minh chứng cho loại khiếu nại này.");
            return;
        }

        try {
            setSubmitting(true);

            const formData = new FormData();
            formData.append("type", complaintType);
            formData.append("description", complaintText);

            if (complaintImage) {
                formData.append("images", complaintImage);
            }

            await api.patch(`/bookings/${id}/complaint`, formData);

            showToast.success("Gửi khiếu nại thành công! Đơn đang chờ admin xử lý.");

            setShowPopup(false);

        } catch (err) {
            console.error(err);
            showToast.error("Gửi khiếu nại thất bại. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (showModal || showPopup) {
            document.body.classList.add("no-scroll");
        } else {
            document.body.classList.remove("no-scroll");
        }

        return () => {
            document.body.classList.remove("no-scroll");
        };
    }, [showModal, showPopup]);


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
        type,
        duration_hours,
        duration_days,
        customer_id,
        task_checklist,
    } = booking;

    const checklist = Array.isArray(booking?.task_checklist)
        ? booking.task_checklist
        : typeof booking?.task_checklist === "string"
            ? booking.task_checklist.split("\n").filter(Boolean)
            : [];

    const formatDate = (t) => {
        if (!t) return "";
        const d = new Date(t);

        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();

        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");

        return `Lúc ${hh}:${mi} ${dd} tháng ${mm},${yyyy}`;
    };

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
                navigate("/customer/bookings");
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
            .no-scroll {
    overflow: hidden !important;
    height: 100vh !important;
}
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
            {booking?.status === "Chờ xác nhận" ? (
                <Container className="py-4">

                    {/* ===================== TITLE ===================== */}
                    <div className="mb-4">
                        <h2 className="fw-bold text-dark" style={{ letterSpacing: "-0.5px" }}>
                            Xác nhận công việc Tasker đã hoàn thành
                        </h2>
                        <p className="text-muted mt-1" style={{ fontSize: "0.95rem" }}>
                            Vui lòng xem hình ảnh – checklist – ghi chú trước khi xác nhận.
                        </p>
                    </div>


                    <Row className="gy-4">

                        {/* ================= LEFT COLUMN ================= */}
                        <Col lg={8}>

                            {/* === CHECKLIST === */}
                            <Card className="shadow-sm border-0 rounded-4 p-2 mb-4">
                                <Card.Body>
                                    <h5 className="fw-bold mb-3">Công việc đã hoàn thành</h5>

                                    {checklist.length > 0 ? (
                                        <div className="mt-2">
                                            {checklist.map((item, index) => {
                                                const taskId = `task-${index}`;
                                                const elapsed = timers?.[taskId] || 0;

                                                const formatTime = (ms) => {
                                                    if (!ms) return "0s";
                                                    const sec = Math.floor(ms / 1000);
                                                    const m = Math.floor(sec / 60);
                                                    const s = sec % 60;
                                                    return `${m}m ${s}s`;
                                                };

                                                return (
                                                    <div
                                                        key={index}
                                                        className="d-flex justify-content-between align-items-center p-3 mb-2"
                                                        style={{
                                                            background: "#f9fafb",
                                                            borderRadius: "12px",
                                                            border: "1px solid #e5e7eb",
                                                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                                        }}
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <i className="bi bi-check-circle-fill text-success me-3 fs-5"></i>
                                                            <span className="fw-semibold" style={{ fontSize: "1rem" }}>
                                                                {item}
                                                            </span>
                                                        </div>

                                                        <span
                                                            className="fw-bold text-primary"
                                                            style={{ fontSize: "0.95rem", whiteSpace: "nowrap" }}
                                                        >
                                                            {formatTime(elapsed)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-muted mb-0">Không có checklist.</p>
                                    )}
                                </Card.Body>
                            </Card>


                            {/* === BEFORE & AFTER === */}
                            <Card className="shadow-sm border-0 rounded-4 p-2 mb-4">
                                <Card.Body>

                                    <h5 className="fw-bold mb-4">Before & After Photos</h5>

                                    {/* BEFORE SECTION */}
                                    <div className="text-center mb-3">
                                        <h6 className="fw-bold text-uppercase text-secondary" style={{ fontSize: "1.1rem" }}>
                                            Before
                                        </h6>
                                        <div className="border-bottom mb-3" style={{ opacity: 0.3 }}></div>
                                    </div>

                                    <Row className="g-3 justify-content-start">
                                        {beforePhotos.length === 0 && (
                                            <p className="text-muted mx-3">Không có ảnh trước khi làm.</p>
                                        )}

                                        {beforePhotos.map((img, index) => (
                                            <Col xs={6} md={4} lg={3} key={index}>
                                                <Card
                                                    className="shadow-sm border-0"
                                                    style={{ cursor: "pointer", borderRadius: "16px" }}
                                                    onClick={() => openImageModal(index)}
                                                >
                                                    <Card.Img
                                                        src={img}
                                                        style={{
                                                            height: "150px",
                                                            objectFit: "cover",
                                                            borderRadius: "16px"
                                                        }}
                                                    />
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>

                                    {/* AFTER SECTION */}
                                    <div className="text-center mt-4 mb-3">
                                        <h6 className="fw-bold text-uppercase text-secondary" style={{ fontSize: "1.1rem" }}>
                                            After
                                        </h6>
                                        <div className="border-bottom mb-3" style={{ opacity: 0.3 }}></div>
                                    </div>

                                    <Row className="g-3 justify-content-start">
                                        {afterPhotos.length === 0 && (
                                            <p className="text-muted mx-3">Không có ảnh sau khi làm.</p>
                                        )}

                                        {afterPhotos.map((img, index) => {
                                            const globalIdx = beforePhotos.length + index;

                                            return (
                                                <Col xs={6} md={4} lg={3} key={globalIdx}>
                                                    <Card
                                                        className="shadow-sm border-0"
                                                        style={{ cursor: "pointer", borderRadius: "16px" }}
                                                        onClick={() => openImageModal(globalIdx)}
                                                    >
                                                        <Card.Img
                                                            src={img}
                                                            style={{
                                                                height: "150px",
                                                                objectFit: "cover",
                                                                borderRadius: "16px"
                                                            }}
                                                        />
                                                    </Card>
                                                </Col>
                                            );
                                        })}
                                    </Row>

                                </Card.Body>
                            </Card>


                            {/* === ACTION BUTTONS === */}
                            <div className="d-flex gap-3 mt-3">
                                <Button
                                    variant="success"
                                    className="px-4 py-2 rounded-3"
                                    style={{ fontSize: "1.05rem", fontWeight: 600 }}
                                    onClick={handleConfirmComplete}
                                >
                                    ✔ Xác nhận hoàn thành
                                </Button>

                                <Button
                                    variant="outline-danger"
                                    className="px-4 py-2 rounded-3"
                                    style={{ fontSize: "1.05rem", fontWeight: 600 }}
                                    onClick={() => setShowPopup(true)}
                                >
                                    ❌ Báo cáo / Khiếu nại
                                </Button>
                            </div>

                        </Col>




                        {/* ================= RIGHT COLUMN ================= */}
                        <Col lg={4}>
                            <Card className="shadow-sm border-0 rounded-4 mb-4">
                                <Card.Body>

                                    <h5 className="fw-bold mb-3">Ghi chú của Tasker</h5>

                                    <div
                                        className="p-3 rounded-3"
                                        style={{
                                            background: "#f8f9fa",
                                            fontSize: "1rem",
                                            lineHeight: "1.5",
                                            whiteSpace: "pre-line",
                                            border: "1px solid #eee"
                                        }}
                                    >
                                        {booking.notes && booking.notes.trim() !== ""
                                            ? booking.notes
                                            : "Không có ghi chú từ tasker."}
                                    </div>

                                </Card.Body>
                            </Card>
                        </Col>

                    </Row>


                    {/* IMAGE MODAL */}
                    <Modal show={!!activeImage} onHide={closeImageModal} centered size="lg">
                        <Modal.Body className="p-0 text-center">
                            <img
                                src={activeImage}
                                className="img-fluid"
                                style={{ maxHeight: "90vh", borderRadius: "12px" }}
                            />
                        </Modal.Body>
                    </Modal>

                </Container>
            ) : (
                <>
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
                            <Card className="shadow-sm border-0" style={{ borderRadius: "14px" }}>
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

                                        {duration_hours ? (
                                            <div>
                                                <i className="bi bi-clock text-primary me-2"></i>
                                                Thời lượng: {duration_hours} giờ
                                            </div>
                                        ) : null}
                                        {duration_days ? (
                                            <div>
                                                <i className="bi bi-clock text-primary me-2"></i>
                                                Thời lượng: {duration_days} ngày
                                            </div>
                                        ) : null}
                                        {type ? (
                                            <div>
                                                <i className="bi bi-house-door text-primary me-2"></i>
                                                Loại: {type}
                                            </div>
                                        ) : null}

                                        {start_time && (
                                            <div>
                                                <i className="bi bi-clock text-primary me-2"></i>

                                                {end_time
                                                    ? `${formatDate(start_time)} → ${formatDate(end_time)}`
                                                    : `${formatDate(start_time)}`
                                                }
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
                                    <p className="text-muted" style={{ whiteSpace: "pre-line" }}>{task_checklist || "Không có mô tả."}</p>

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
                                        window.location.href = `/chat?bookingId=${booking_id}&peer=${booking.tasker_id}`;
                                    }}
                                >
                                    💬 Chat với người giúp việc
                                </Button>
                            )}

                            {status === "Hoàn thành" && (
                                <Button
                                    variant="warning"
                                    size="lg"
                                    className="px-5 fw-semibold text-dark"
                                    style={{ borderRadius: "10px", minWidth: "180px" }}
                                    onClick={() => navigate(`/customer/booking/${booking_id}/rating`)}
                                >
                                    ⭐ Đánh giá ngay
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
                </>
            )}
            {showModal && (
                <div className="cancel-overlay" onClick={closeImageModal}>
                    <div className="cancel-box p-0" style={{ maxWidth: "90%", width: "fit-content" }} onClick={(e) => e.stopPropagation()}>

                        {/* Ảnh */}
                        <div className="text-center">
                            {activeImage && (
                                <img
                                    src={activeImage}
                                    className="img-fluid"
                                    style={{ maxHeight: "90vh", objectFit: "contain", borderRadius: "12px" }}
                                />
                            )}
                        </div>

                        {/* Điều hướng ảnh */}
                        {allImages.length > 1 && (
                            <div className="d-flex justify-content-between p-3">
                                <Button
                                    variant="light"
                                    className="px-4 fw-semibold"
                                    onClick={() => {
                                        const newIndex =
                                            (currentImageIndex - 1 + allImages.length) % allImages.length;
                                        setCurrentImageIndex(newIndex);
                                        setActiveImage(allImages[newIndex]);
                                    }}
                                >
                                    ← Prev
                                </Button>

                                <Button
                                    variant="light"
                                    className="px-4 fw-semibold"
                                    onClick={() => {
                                        const newIndex = (currentImageIndex + 1) % allImages.length;
                                        setCurrentImageIndex(newIndex);
                                        setActiveImage(allImages[newIndex]);
                                    }}
                                >
                                    Next →
                                </Button>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {showPopup && (
                <div className="cancel-overlay" onClick={() => setShowPopup(false)}>
                    <div className="cancel-box" onClick={(e) => e.stopPropagation()}>

                        <h5 className="fw-bold mb-3">📣 Gửi khiếu nại</h5>

                        {/* Chọn loại */}
                        <label className="fw-semibold">Loại khiếu nại</label>
                        <select
                            className="form-select mb-3"
                            value={complaintType}
                            onChange={(e) => setComplaintType(e.target.value)}
                        >
                            <option value="not_quality">Công việc không đạt yêu cầu</option>
                            <option value="fake_time">Gian lận thời gian</option>
                            <option value="other">Khác</option>
                        </select>

                        {/* Mô tả */}
                        <label className="fw-semibold">Mô tả vấn đề</label>
                        <textarea
                            className="form-control mb-3"
                            placeholder="Hãy mô tả chi tiết vấn đề..."
                            rows={3}
                            value={complaintText}
                            onChange={(e) => setComplaintText(e.target.value)}
                        />

                        {/* Upload ảnh — logic theo loại */}
                        {(complaintType === "not_quality" || complaintType === "other") && (
                            <>
                                <label className="fw-semibold">
                                    Ảnh minh chứng {complaintType === "not_quality" && "(bắt buộc)"}
                                </label>
                                <input
                                    type="file"
                                    className="form-control mb-3"
                                    onChange={(e) => setComplaintImage(e.target.files[0])}
                                />
                            </>
                        )}

                        {/* Buttons */}
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowPopup(false)}>
                                Đóng
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleSubmitComplaint}
                                disabled={submitting}
                            >
                                {submitting ? "Đang gửi..." : "Gửi khiếu nại"}
                            </Button>
                        </div>

                    </div>
                </div>
            )}
        </Container>
    );
}
