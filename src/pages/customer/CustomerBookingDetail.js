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
    Image,
    Tabs,
    Tab
} from "react-bootstrap";
import { formatVND } from "../../utils/formatVND";
import api from "../../services/api";
import { showToast } from "../../components/common/CustomToast";

// Popup hủy đơn lấy 100% từ BookingHistory

export default function CustomerBookingDetail() {
    const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:3001/api").replace(/\/api$/, "").replace(/\/$/, "");

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

    // New State for Sessions logic
    const [sessions, setSessions] = useState({});
    const [activeTab, setActiveTab] = useState("");

    // Helper to parse dates safely (copied from TaskerJobDone)
    const safeParseDate = (value) => {
        if (!value) return null;
        const str = String(value).trim();
        if (!str) return null;
        const sqlMatch = /^(\d{4})-(\d{2})-(\d{2})[\sT](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?/u.exec(str);
        if (sqlMatch) {
            const [, year, month, day, hour, minute, second = "0", milli = "0"] = sqlMatch;
            return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), Number(milli.padEnd(3, "0")));
        }
        const date = new Date(str);
        if (Number.isNaN(date.getTime())) return null;
        return date;
    };

    const startDate = booking?.start_time ? safeParseDate(booking.start_time) : null;
    const endDate = booking?.end_time ? safeParseDate(booking.end_time) : null;

    const isMultiDay = booking && (
        (booking.total_sessions && Number(booking.total_sessions) > 1) ||
        (String(booking.unit || "").toLowerCase().match(/tuần|tháng|week|month/)) ||
        (startDate && endDate && (endDate.getTime() - startDate.getTime() >= 24 * 60 * 60 * 1000))
    );

    const formatDateTimeForDay = new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });

    const daysList = (() => {
        if (!isMultiDay || !startDate) return [];
        const limit = booking?.total_sessions ? Number(booking.total_sessions) : 0;
        const days = [];
        const current = new Date(startDate);
        current.setHours(0, 0, 0, 0);

        if (limit > 1) {
            for (let i = 0; i < limit; i++) {
                const y = current.getFullYear();
                const m = String(current.getMonth() + 1).padStart(2, "0");
                const d = String(current.getDate()).padStart(2, "0");
                const dayKey = `${y}-${m}-${d}`;
                days.push({ date: new Date(current), dayKey, label: formatDateTimeForDay.format(current) });
                current.setDate(current.getDate() + 1);
            }
        } else if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            while (current <= end) {
                const y = current.getFullYear();
                const m = String(current.getMonth() + 1).padStart(2, "0");
                const d = String(current.getDate()).padStart(2, "0");
                const dayKey = `${y}-${m}-${d}`;
                days.push({ date: new Date(current), dayKey, label: formatDateTimeForDay.format(current) });
                current.setDate(current.getDate() + 1);
            }
        }
        return days;
    })();

    // Parse main checklist to be used as default
    const parseChecklist = (rawChecklist) => {
        if (!rawChecklist) return [];
        if (Array.isArray(rawChecklist)) {
            return rawChecklist.map((item, index) => ({
                id: item?.id || `task-${index}`,
                label: typeof item === "string" ? item : item?.label || `Task ${index + 1}`,
                status: "completed",
            }));
        }
        if (typeof rawChecklist === "string") {
            try {
                const parsed = JSON.parse(rawChecklist);
                if (Array.isArray(parsed)) return parsed.map((item, index) => ({ id: item?.id || `task-${index}`, label: typeof item === "string" ? item : item?.label || `Task ${index + 1}`, status: "completed" }));
            } catch (e) { }
            return rawChecklist.split(/\n|\r|\./).map(s => s.trim()).filter(Boolean).map((l, i) => ({ id: `task-${i}`, label: l, status: "completed" }));
        }
        return [];
    };

    // We can memorize this, but for now simple variable is fine as it depends on booking
    const defaultTasks = parseChecklist(booking?.task_checklist);

    const tasksByDay = (() => {
        if (!isMultiDay || !daysList.length) return null;
        const grouped = {};
        daysList.forEach((day) => {
            grouped[day.dayKey] = { day, tasks: defaultTasks };
        });
        return grouped;
    })();

    useEffect(() => {
        if (isMultiDay && daysList.length > 0 && !activeTab) {
            setActiveTab(daysList[0].dayKey);
        }
    }, [isMultiDay, daysList]);

    const formatTimeHHMM = (timestamp) => {
        if (!timestamp) return "—";
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    };

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

    // Fetch sessions
    useEffect(() => {
        if (!id) return;
        const fetchSessions = async () => {
            try {
                // Use the new endpoint we exposed
                const res = await api.get(`/bookings/${id}/sessions`);
                if (res.data && res.data.success) {
                    const sessionData = res.data.data;
                    const newSessionsMap = {};
                    sessionData.forEach(s => {
                        if (!s.session_date) return;
                        const d = new Date(s.session_date);
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, "0");
                        const day = String(d.getDate()).padStart(2, "0");
                        const key = `${y}-${m}-${day}`;

                        newSessionsMap[key] = {
                            checkIn: s.checkin_time,
                            checkOut: s.checkout_time,
                            timers: s.checklist_timers,
                            checklist: s.checklist,
                            status: s.status,
                            notes: s.notes,
                            photos: s.photos || { before: [], after: [] }
                        };
                    });
                    setSessions(newSessionsMap);
                }
            } catch (err) {
                console.error("Failed to load sessions", err);
            }
        };
        fetchSessions();
    }, [id]);

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
        quantity,
        unit,
        paid_amount,
    } = booking;

    const getDisplayUnit = (u) => {
        if (!u) return "Lượt";
        const lower = u.toLowerCase();
        if (lower.includes("m2") || lower.includes("m²") || lower.includes("mét")) return "Mét vuông";
        if (lower.includes("giờ") || lower.includes("hour")) return "Giờ";
        if (lower.includes("ngày") || lower.includes("day")) return "Ngày";
        if (lower.includes("tuần") || lower.includes("week")) return "Tuần";
        if (lower.includes("tháng") || lower.includes("month")) return "Tháng";
        if (lower.includes("buổi")) return "Buổi";
        if (lower.includes("chiếc") || lower.includes("item")) return "Chiếc";
        return u;
    };

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

    const formatPrice = (p) => (p ? formatVND(p) : "—");

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
                    `Hủy thành công. Hoàn: ${formatVND(data.refundAmount)} (Rule: ${data.rule})`
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
        .custom-scroll-tabs {
          flex-wrap: nowrap;
          overflow-x: auto;
          overflow-y: hidden;
          white-space: nowrap;
          scrollbar-width: thin;
        }
        .custom-scroll-tabs .nav-item {
          display: inline-block;
        }
        .custom-scroll-tabs .nav-link {
          white-space: nowrap;
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
            {(booking?.status === "Chờ xác nhận" || booking?.status === "Đang tiến hành") ? (
                <Container className="py-4">

                    {/* ===================== TITLE ===================== */}
                    <div className="mb-4">
                        <h2 className="fw-bold text-dark" style={{ letterSpacing: "-0.5px" }}>
                            {booking?.status === "Chờ xác nhận" ? "Xác nhận công việc hoàn thành" : "Tiến độ công việc thực tế"}
                        </h2>
                        <p className="text-muted mt-1" style={{ fontSize: "0.95rem" }}>
                            {booking?.status === "Chờ xác nhận"
                                ? "Vui lòng xem hình ảnh – checklist – ghi chú trước khi xác nhận."
                                : "Theo dõi sát sao tiến độ làm việc của người giúp việc theo từng mốc thời gian."}
                        </p>
                    </div>


                    <Row className="g-4">
                        <Col lg={8}>
                            {/* === WORK DETAIL CARD === */}
                            <Card className="shadow-sm border-0 rounded-4 mb-4">
                                <Card.Body className="p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <div>
                                            <h5 className="mb-0 fw-bold">Chi tiết công việc</h5>
                                            <small className="text-muted">Các nhiệm vụ đã hoàn thành theo phiên</small>
                                        </div>
                                        <Badge bg="success" className="px-3 py-2 d-inline-flex align-items-center gap-2">
                                            <i className="bi bi-check2-circle"></i> 100% Done
                                        </Badge>
                                    </div>

                                    <div className="d-flex flex-column gap-4">
                                        {isMultiDay && tasksByDay ? (
                                            <Tabs
                                                activeKey={activeTab}
                                                onSelect={(k) => setActiveTab(k)}
                                                variant="pills"
                                                className="mb-3 custom-scroll-tabs pb-2"
                                            >
                                                {Object.values(tasksByDay).map(({ day, tasks: dayTasks }) => {
                                                    const safeDayKey = day.dayKey || "default";
                                                    const session = sessions?.[safeDayKey] || { status: "completed" };
                                                    const tasksToRender = (session.checklist && session.checklist.length > 0) ? parseChecklist(session.checklist) : dayTasks;

                                                    const tabTitle = (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span>{day.label}</span>
                                                            <small>✔</small>
                                                        </div>
                                                    );

                                                    return (
                                                        <Tab eventKey={safeDayKey} title={tabTitle} key={safeDayKey}>
                                                            <Card className="mb-3 border-0 bg-light">
                                                                <Card.Body>
                                                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                                                        <div className="fw-bold fs-5">{day.label}</div>
                                                                        <Badge bg="success">Đã hoàn thành</Badge>
                                                                    </div>
                                                                    <div className="d-flex gap-4 text-muted small">
                                                                        <div><i className="bi bi-box-arrow-in-right me-1"></i> Check-in: <strong>{formatTimeHHMM(session?.checkIn)}</strong></div>
                                                                        <div><i className="bi bi-box-arrow-left me-1"></i> Check-out: <strong>{formatTimeHHMM(session?.checkOut)}</strong></div>
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>

                                                            {/* CHECKLIST */}
                                                            <div className="d-flex flex-column gap-3 mb-4">
                                                                <h6 className="fw-bold text-muted text-uppercase mb-0">Checklist công việc</h6>
                                                                {tasksToRender.map((task, idx) => {
                                                                    const tmr = session.timers?.[task.id];
                                                                    // Format elapsed time
                                                                    let timeStr = "";
                                                                    if (tmr) {
                                                                        const sec = Math.floor((tmr.elapsedMs || 0) / 1000);
                                                                        const h = Math.floor(sec / 3600);
                                                                        const m = Math.floor((sec % 3600) / 60);
                                                                        const s = sec % 60;
                                                                        timeStr = `⏱ ${h}h ${m}m ${s}s`;
                                                                    }
                                                                    return (
                                                                        <div key={idx} className="d-flex justify-content-between align-items-center p-3 border rounded-3 bg-white shadow-sm">
                                                                            <div className="d-flex align-items-center gap-3">
                                                                                <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                                                                <span className="fw-semibold">{task.label}</span>
                                                                            </div>
                                                                            <small className="text-primary fw-bold">{timeStr}</small>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* NOTES */}
                                                            <Card className="border-0 bg-light mb-4">
                                                                <Card.Body>
                                                                    <h6 className="fw-bold mb-2"><i className="bi bi-journal-text me-2"></i> Ghi chú của Tasker</h6>
                                                                    <p className="mb-0" style={{ whiteSpace: "pre-line" }}>{session.notes || "Không có ghi chú."}</p>
                                                                </Card.Body>
                                                            </Card>

                                                            {/* PHOTOS */}
                                                            {(session.photos?.before?.length > 0 || session.photos?.after?.length > 0) && (
                                                                <div className="mb-4">
                                                                    <h6 className="fw-bold text-muted text-uppercase mb-3">Hình ảnh thực hiện</h6>
                                                                    {session.photos.before?.length > 0 && (
                                                                        <div className="mb-3">
                                                                            <small className="text-secondary fw-semibold d-block mb-2">BEFORE</small>
                                                                            <div className="d-flex gap-2" style={{ overflowX: 'auto' }}>
                                                                                {session.photos.before.map((url, i) => (
                                                                                    <Image key={i} src={url} style={{ height: 160, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }} onClick={() => { setActiveImage(url); setShowModal(true); }} />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {session.photos.after?.length > 0 && (
                                                                        <div>
                                                                            <small className="text-secondary fw-semibold d-block mb-2">AFTER</small>
                                                                            <div className="d-flex gap-2" style={{ overflowX: 'auto' }}>
                                                                                {session.photos.after.map((url, i) => (
                                                                                    <Image key={i} src={url} style={{ height: 160, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }} onClick={() => { setActiveImage(url); setShowModal(true); }} />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Tab>
                                                    );
                                                })}
                                            </Tabs>
                                        ) : (
                                            // SINGLE DAY
                                            (() => {
                                                const sessionValues = Object.values(sessions);
                                                const singleSession = sessionValues.length > 0 ? sessionValues[0] : null;
                                                // Fallback to booking data if session not found (rare)

                                                return (
                                                    <div>
                                                        {(singleSession || startDate) && (
                                                            <Card className="mb-3 border-0 bg-light">
                                                                <Card.Body>
                                                                    {startDate && (
                                                                        <div className="fw-bold fs-5 mb-2">
                                                                            {formatDateTimeForDay.format(startDate)}
                                                                        </div>
                                                                    )}
                                                                    <div className="d-flex gap-4 text-muted small">
                                                                        <div><i className="bi bi-box-arrow-in-right me-1"></i> Check-in: <strong>{formatTimeHHMM(singleSession?.checkIn)}</strong></div>
                                                                        <div><i className="bi bi-box-arrow-left me-1"></i> Check-out: <strong>{formatTimeHHMM(singleSession?.checkOut)}</strong></div>
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        )}

                                                        <div className="d-flex flex-column gap-3 mb-4">
                                                            {checklist.map((item, idx) => {
                                                                const taskId = item.id || `task-${idx}`;
                                                                const tmr = singleSession?.timers?.[taskId] || timers?.[taskId]; // Fallback to timers state
                                                                let timeStr = "";
                                                                if (tmr) {
                                                                    const val = typeof tmr === 'object' ? tmr.elapsedMs : tmr;
                                                                    const sec = Math.floor((val || 0) / 1000);
                                                                    const h = Math.floor(sec / 3600);
                                                                    const m = Math.floor((sec % 3600) / 60);
                                                                    const s = sec % 60;
                                                                    timeStr = `⏱ ${h}h ${m}m ${s}s`;
                                                                }

                                                                const label = typeof item === 'string' ? item : item.label;

                                                                return (
                                                                    <div key={idx} className="d-flex justify-content-between align-items-center p-3 border rounded-3 bg-white shadow-sm">
                                                                        <div className="d-flex align-items-center gap-3">
                                                                            <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                                                            <span className="fw-semibold">{label}</span>
                                                                        </div>
                                                                        <small className="text-primary fw-bold">{timeStr}</small>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* NOTES */}
                                                        <Card className="border-0 bg-light mb-4">
                                                            <Card.Body>
                                                                <h6 className="fw-bold mb-2"><i className="bi bi-journal-text me-2"></i> Ghi chú của Tasker</h6>
                                                                <p className="mb-0" style={{ whiteSpace: "pre-line" }}>{(singleSession?.notes || booking.notes) || "Không có ghi chú."}</p>
                                                            </Card.Body>
                                                        </Card>

                                                        {/* PHOTOS */}
                                                        {((singleSession?.photos?.before?.length > 0) || (beforePhotos.length > 0)) && (
                                                            <div className="mb-3">
                                                                <h6 className="fw-bold text-secondary text-uppercase mb-2">Before</h6>
                                                                <div className="d-flex gap-2" style={{ overflowX: 'auto' }}>
                                                                    {(singleSession?.photos?.before?.length > 0 ? singleSession.photos.before : beforePhotos).map((url, i) => (
                                                                        <Image key={i} src={url} style={{ height: 160, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }} onClick={() => { setActiveImage(url); setShowModal(true); }} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {((singleSession?.photos?.after?.length > 0) || (afterPhotos.length > 0)) && (
                                                            <div className="mb-3">
                                                                <h6 className="fw-bold text-secondary text-uppercase mb-2">After</h6>
                                                                <div className="d-flex gap-2" style={{ overflowX: 'auto' }}>
                                                                    {(singleSession?.photos?.after?.length > 0 ? singleSession.photos.after : afterPhotos).map((url, i) => (
                                                                        <Image key={i} src={url} style={{ height: 160, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }} onClick={() => { setActiveImage(url); setShowModal(true); }} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        )}
                                    </div>

                                    {/* === ACTION BUTTONS (Only for Confirmation) === */}
                                    {booking?.status === "Chờ xác nhận" && (
                                        <div className="d-flex justify-content-center gap-3 mt-5">
                                            <Button variant="success" size="lg" className="px-5 rounded-pill fw-bold" onClick={handleConfirmComplete}>
                                                ✔ Xác nhận hoàn thành
                                            </Button>
                                            <Button variant="outline-danger" size="lg" className="px-5 rounded-pill fw-bold" onClick={() => setShowPopup(true)}>
                                                ❌ Báo cáo / Khiếu nại
                                            </Button>
                                        </div>
                                    )}

                                    {booking?.status === "Đang tiến hành" && (
                                        <div className="d-flex justify-content-center gap-3 mt-5">
                                            <Button variant="outline-danger" size="lg" className="px-5 rounded-pill fw-bold" onClick={() => setShowPopup(true)}>
                                                ❌ Báo cáo / Khiếu nại
                                            </Button>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* === SIDEBAR (Like Admin) === */}
                        <Col lg={4}>
                            <div className="sticky-top" style={{ top: "2rem" }}>
                                <Card className="border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
                                    <Card.Body className="p-4">
                                        <h5 className="fw-bold mb-3">Tóm tắt đơn hàng</h5>
                                        <hr />

                                        <div className="mb-3">
                                            <label className="text-muted small mb-1">Trạng thái booking</label>
                                            <div>
                                                <Badge bg={status === "Đang tiến hành" ? "primary" : "success"} className="px-3 py-2 text-uppercase">
                                                    {status}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="text-muted small fw-bold text-uppercase mb-1 border-start border-primary border-3 ps-2">Vị trí công việc</label>
                                            <p className="mb-0 small fw-medium mt-1">{booking.location}</p>
                                        </div>

                                        <div className="mb-3">
                                            <label className="text-muted small fw-bold text-uppercase mb-1 border-start border-primary border-3 ps-2">Thời gian dự kiến</label>
                                            <div className="mt-1">
                                                {startDate ? (
                                                    <div className="small fw-medium">
                                                        <div className="d-flex align-items-center gap-2 mb-1">
                                                            <i className="bi bi-clock text-primary"></i>
                                                            {startDate.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} - {endDate ? endDate.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2 text-muted">
                                                            <i className="bi bi-calendar-event"></i>
                                                            {isMultiDay ? (
                                                                <>
                                                                    {startDate.toLocaleDateString("vi-VN")} - {endDate ? endDate.toLocaleDateString("vi-VN") : "—"}
                                                                    <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.7rem' }}>
                                                                        {booking.total_sessions} ngày
                                                                    </Badge>
                                                                </>
                                                            ) : (
                                                                startDate.toLocaleDateString("vi-VN")
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : "—"}
                                            </div>
                                        </div>

                                        {booking.description && (
                                            <div className="mb-3">
                                                <label className="text-muted small fw-bold text-uppercase mb-1 border-start border-primary border-3 ps-2">Ghi chú từ bạn</label>
                                                <p className="mb-0 small text-muted mt-1" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{booking.description}</p>
                                            </div>
                                        )}

                                        <hr />
                                        <h6 className="fw-bold mb-3">Chi tiết thanh toán</h6>
                                        <div className="bg-light p-3 rounded-3 shadow-sm border">
                                            {(() => {
                                                const qty = Number(booking?.quantity || 1);
                                                let unitPrice = 0;
                                                let rawTotal = 0;

                                                if (booking?.final_price && Number(booking.final_price) > 0) {
                                                    unitPrice = Number(booking.final_price);
                                                } else {
                                                    unitPrice = Number(booking?.expected_price || 0);
                                                }
                                                rawTotal = unitPrice * qty;

                                                return (
                                                    <>
                                                        <div className="mb-2">
                                                            <div className="d-flex justify-content-between small text-muted mb-1">
                                                                <span>Đơn giá:</span>
                                                                <span>{formatVND(unitPrice)} / {getDisplayUnit(booking?.unit)}</span>
                                                            </div>
                                                            {qty > 1 && (
                                                                <div className="d-flex justify-content-between small text-muted mb-1">
                                                                    <span>Số lượng:</span>
                                                                    <span>{qty} {getDisplayUnit(booking?.unit)}</span>
                                                                </div>
                                                            )}
                                                            <div className="d-flex justify-content-between small fw-bold text-dark mb-1">
                                                                <span>Tổng tiền:</span>
                                                                <span>{formatVND(rawTotal)}</span>
                                                            </div>
                                                        </div>

                                                        {booking.paid_amount < rawTotal && booking.paid_amount > 0 && (
                                                            <div className="d-flex justify-content-between small text-success mb-1">
                                                                <span>Đã giảm giá:</span>
                                                                <span>-{formatVND(rawTotal - booking.paid_amount)}</span>
                                                            </div>
                                                        )}

                                                        <hr className="my-2" />
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <span className="fw-bold text-uppercase small" style={{ fontSize: '0.7rem' }}>Giá cuối cùng:</span>
                                                            <span className="fs-5 fw-bold text-danger">
                                                                {formatVND(booking.paid_amount || rawTotal)}
                                                            </span>
                                                        </div>

                                                        {booking.paid_amount > 0 && (
                                                            <div className="text-end mt-1">
                                                                <Badge bg="success" className="px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                                                    <i className="bi bi-check-circle-fill me-1"></i> ĐÃ THANH TOÁN
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Button
                                    variant="outline-secondary"
                                    className="w-100 py-3 rounded-4 fw-bold shadow-sm bg-white"
                                    onClick={() => navigate("/customer/bookings")}
                                >
                                    ← Quay lại danh sách
                                </Button>
                            </div>
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
                                                                            : status === "Đã ký hợp đồng"
                                                                                ? "info"
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

                                        {/* ⭐ HIỂN THỊ QUANTITY */}
                                        {quantity && quantity > 1 && (
                                            <div>
                                                <i className="bi bi-boxes text-primary me-2"></i>
                                                Số lượng: <strong>{quantity} {getDisplayUnit(unit)}</strong>
                                            </div>
                                        )}

                                        {type ? (
                                            <div>
                                                <i className="bi bi-house-door text-primary me-2"></i>
                                                Loại: {type}
                                            </div>
                                        ) : null}

                                        {booking.description && (
                                            <div>
                                                <i className="bi bi-info-circle text-primary me-2"></i>
                                                Lưu ý: <strong>{booking.description}</strong>
                                            </div>
                                        )}

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
                                        <span className="fw-medium text-muted">
                                            {status !== "Chờ xử lý" && quantity > 1 ? "Tổng tiền" : "Giá mong muốn"}
                                        </span>
                                        <span className="fw-bold text-success fs-5 ms-2">
                                            {(() => {
                                                // Nếu đã thanh toán (có paid_amount), hiển thị số tiền thực trả (đã trừ voucher)
                                                if (paid_amount && Number(paid_amount) > 0) {
                                                    return formatPrice(paid_amount);
                                                }

                                                // Các trạng thái được xem là "đã chốt" giá cuối
                                                const isFinalized = ["Đã chấp nhận", "Đã thanh toán", "Đang tiến hành", "Hoàn thành", "Chờ xác nhận", "Chờ duyệt báo cáo", "Báo cáo được duyệt", "Báo cáo bị từ chối"].includes(status);
                                                const mult = (isFinalized && quantity > 1) ? Number(quantity) : 1;
                                                const priceToShow = (expected_price || final_price);
                                                return formatPrice(priceToShow * mult);
                                            })()}
                                        </span>
                                    </div>

                                    {final_price != null &&
                                        final_price !== "" &&
                                        Number(final_price) !== 0 && (
                                            <div className="mt-2">
                                                <span className="fw-medium text-muted">
                                                    {status !== "Chờ xử lý" && quantity > 1 ? "Tổng giá sau thương lượng" : "Giá sau thương lượng"}
                                                </span>
                                                <span className="fw-bold text-primary fs-5 ms-2">
                                                    {(() => {
                                                        if (paid_amount && Number(paid_amount) > 0) {
                                                            return formatPrice(paid_amount);
                                                        }

                                                        const isFinalized = ["Đã chấp nhận", "Đã thanh toán", "Đang tiến hành", "Hoàn thành", "Chờ xác nhận", "Chờ duyệt báo cáo", "Báo cáo được duyệt", "Báo cáo bị từ chối"].includes(status);
                                                        const mult = (isFinalized && quantity > 1) ? Number(quantity) : 1;
                                                        return formatVND(Number(final_price) * mult);
                                                    })()}
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
                            {(status === "Chờ xử lý" || status === "Đã chấp nhận" || status === "Đã thanh toán" || status === "Đã ký hợp đồng") && (
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

                                    {(() => {
                                        const isWeekOrMonth = unit && ["tuần", "tháng", "week", "month"].some(k => unit.toLowerCase().includes(k));

                                        // Nút Thanh toán
                                        if (status === "Đã ký hợp đồng" || (status === "Đã chấp nhận" && !isWeekOrMonth)) {
                                            return (
                                                <Button
                                                    variant="success"
                                                    size="lg"
                                                    className="px-4"
                                                    onClick={() => navigate(`/payment/${booking_id}`)}
                                                >
                                                    💳 Thanh toán
                                                </Button>
                                            );
                                        }

                                        // Nút Ký hợp đồng
                                        if (status === "Đã chấp nhận" && isWeekOrMonth) {
                                            return (
                                                <Button
                                                    variant="warning"
                                                    size="lg"
                                                    className="px-4 text-dark fw-bold"
                                                    onClick={() => navigate(`/contract/${booking_id}`)}
                                                >
                                                    📄 Ký hợp đồng
                                                </Button>
                                            );
                                        }

                                        return null;
                                    })()}

                                </>
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
