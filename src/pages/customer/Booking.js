import React, { useMemo, useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Badge, Form, Button, Accordion, ProgressBar, Spinner, InputGroup } from "react-bootstrap";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { servicesAPI } from "../../services/api";
import api from "../../services/api";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import TaskerService from '../../services/taskerService';
import _ from "lodash";
import { formatVND } from "../../utils/formatVND";
import { motion, AnimatePresence } from "framer-motion";
import {
    Star,
    ShieldCheck,
    Award,
    User,
    Phone,
    Mail,
    MapPin,
    Trophy,
    CheckCircle2,
    MessageSquare,
    ChevronRight,
    Info
} from "lucide-react";

function normalizeDate(d) {
    if (!d) return null;
    if (typeof d === "string") return d; // đã đúng format
    // DayPicker trả Date object → convert
    return d.toISOString().split("T")[0];
}


function formatTimeForDisplay(time) {
    if (!time) return "—";
    const [hour, minute] = time.split(":");
    const h = parseInt(hour, 10);
    const suffix = h >= 12 ? "CH" : "SA";
    const displayHour = ((h + 11) % 12 + 1).toString().padStart(2, "0");
    return `${displayHour}:${minute} ${suffix}`;
}

export default function Booking() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const totalSteps = 4;
    const [touched, setTouched] = useState(false);

    const { taskerId } = useParams();

    const [taskers, setTaskers] = useState([]);
    const [tasker, setTasker] = useState(null);
    const [services, setServices] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState(null);
    const [previewImages, setPreviewImages] = useState([]);

    const [loadingServices, setLoadingServices] = useState(true);

    const age = useMemo(() => {
        if (!tasker?.date_of_birth) return null;
        const birthDate = new Date(tasker.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }, [tasker?.date_of_birth]);

    // Moved up: selection state must exist before any useEffect dependencies referencing it
    const defaultSelection = () => ({
        date: "",
        dates: [],
        startTime: "",
        endTime: "",
        quantity: 1,
        frequency: "",
        workHours: "",
        services: {},
    });
    const [selection, setSelection] = useState(defaultSelection());

    useEffect(() => {
        if (!selectedVariantId) return;
        TaskerService.getTaskersByVariant(selectedVariantId)
            .then((res) => setTaskers(res.data || []))
            .catch((err) => console.error('Lỗi lấy tasker theo variant:', err));
    }, [selectedVariantId]);

    useEffect(() => {
        console.log("🏁 Booking mounted. taskerId =", taskerId);

        if (!taskerId) {
            console.warn("⚠️ Không có taskerId, skip fetchTaskerData()");
            setLoadingServices(false); // ✅ ngắt loading ngay
            return;
        }

        const fetchTaskerData = async () => {
            setLoadingServices(true);
            try {
                const token = api.getStoredToken();
                const res = await servicesAPI.getServicesByTaskerId(taskerId, token);
                console.log("📦 [Booking] Data trả về từ API:", res);

                if (res?.success) {
                    setTasker(res.tasker);
                    setServices(res.variants || []);
                    const grouped = _.groupBy(res.variants || [], "service_id");
                    setVariantsByService(grouped);
                    console.log("🧩 [Booking] setServices data:", res.variants);
                } else {
                    console.warn("⚠️ API trả về không có success:", res);
                }
            } catch (err) {
                console.error("❌ Lỗi khi load Tasker:", err);
            } finally {
                console.log("✅ Done fetchTaskerData");
                setLoadingServices(false);
            }
        };

        if (taskerId) fetchTaskerData();
    }, [taskerId]);

    const location = useLocation();
    const bookingData = location.state;

    // nếu có state từ JobDescription thì khôi phục
    useEffect(() => {
        if (bookingData) {
            if (bookingData.selection) {
                setSelection((prev) => ({
                    ...prev,
                    ...bookingData.selection, // ✅ chỉ overwrite field nào có trong selection
                }));
            }

            if (bookingData.step !== undefined) {
                setStep(bookingData.step);
            }
        }
    }, [bookingData]);

    // Nếu đến từ trang báo giá (quotes) thì tự động chọn dịch vụ và bỏ qua bước 0
    useEffect(() => {
        if (!bookingData?.fromQuote) return;
        if (!services || services.length === 0) return;
        // Nếu đã có chọn rồi thì khỏi làm lại
        if (Object.keys(selection.services || {}).length > 0) return;

        // Tìm variant theo tên (vì quotes không gửi variant_id)
        const matched = services.find(v => v.variant_name === bookingData.variant_name);
        if (matched) {
            // Gắn giá khóa (lockedPrice) nếu báo giá đề xuất có giá riêng
            if (bookingData.lockedPrice) {
                setServices(prev => prev.map(v => v.variant_id === matched.variant_id ? { ...v, specific_price: bookingData.lockedPrice } : v));
            }
            // Chọn variant và chuyển sang bước lịch hẹn
            setSelection(prev => ({
                ...prev,
                services: { [matched.variant_id]: true }
            }));
            setStep(1); // bỏ qua chọn dịch vụ
        }
    }, [bookingData, services, selection.services]);

    // Fake user data (test UI)
    const [user, setUser] = useState(null);

    useEffect(() => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            if (storedUser) {
                setUser(storedUser);
                console.log("✅ [Booking] User đã đăng nhập:", storedUser);
            } else {
                console.warn("⚠️ [Booking] Không tìm thấy user trong localStorage.");
            }
        } catch (err) {
            console.error("❌ [Booking] Lỗi khi đọc user:", err);
        }
    }, []);

    // Progress có animation nhẹ mỗi khi Next
    const [progressKey, setProgressKey] = useState(0);
    const progress = Math.round(((step + 1) / totalSteps) * 100);

    // Lấy dịch vụ + variants từ API

    const [variantsByService, setVariantsByService] = useState({});

    const allVariants = useMemo(() => {
        const acc = [];
        Object.entries(variantsByService).forEach(([sid, arr]) => {
            (arr || []).forEach((v) =>
                acc.push({ ...v, service_id: Number(sid) })
            );
        });
        return acc;
    }, [variantsByService]);

    const chosenVariants = useMemo(
        () => allVariants.filter((v) => selection.services[v.variant_id]),
        [allVariants, selection.services]
    );

    const selectedCount = chosenVariants.length;

    const isValidTimeRange = (() => {
        if (chosenVariants[0]?.unit === "Giờ") {
            if (!selection.startTime || !selection.endTime) return false;
            return selection.startTime < selection.endTime; // bắt buộc giờ bắt đầu < giờ kết thúc
        }
        return true;
    })();

    const canNext =
        step === 0
            ? selectedCount > 0
            : step === 1
                ? Boolean(selection.date && isValidTimeRange && (selection.startTime || selection.dates?.length))
                : step === 2
                    ? Boolean(selection.address)
                    : true;

    const toggleVariant = (variantId) => {
        setSelection((prev) => {
            const isSame = !!prev.services[variantId];

            if (isSame) {
                // Bỏ chọn dịch vụ -> clear tất cả
                return {
                    ...defaultSelection(),
                    services: {},
                };
            } else {
                // Chọn dịch vụ mới -> reset ngày/giờ theo unit của variant
                const variant = allVariants.find((v) => v.variant_id === variantId);
                if (!variant) return prev;

                let resetFields = defaultSelection();

                if (variant.unit === "Ngày") {
                    resetFields = {
                        ...resetFields,
                        startTime: "07:00",
                        endTime: "21:00",
                        quantity: 1,
                    };
                } else if (variant.unit === "Giờ") {
                    resetFields = {
                        ...resetFields,
                        date: "",
                        startTime: "",
                        endTime: "",
                        quantity: 1,
                    };
                } else if (["Chiếc", "m2", "Mét vuông"].includes(variant.unit)) {
                    resetFields = {
                        ...resetFields,
                        date: "",
                        startTime: "07:00",
                        quantity: 1,
                    };
                } else if (variant.unit === "Tuần" || variant.unit === "Tháng") {
                    resetFields = {
                        ...resetFields,
                        frequency: variant.unit,
                        workHours: "",
                        startTime: "07:00",
                        endTime: "21:00",
                    };
                } else if (variant.unit === "Buổi") {
                    resetFields = {
                        ...resetFields,
                        date: "",
                        startTime: "07:00",
                    };
                }

                return {
                    ...resetFields,
                    services: { [variantId]: true },
                };
            }
        });
    };

    const goNext = () => {
        setTouched(true);
        if (step < totalSteps - 1) {
            setStep(step + 1);
            setProgressKey((k) => k + 1);
        }
    };

    const goPrev = () => {
        if (step === 0) {
            navigate("/"); // 🔹 Quay lại trang chủ khi đang ở bước đầu
        } else {
            setStep(step - 1); // 🔹 Bình thường thì lùi 1 bước
        }
    };

    // Icon theo service_id
    const iconMap = {
        1: "🍳", // Nấu ăn
        2: "🧹", // Dọn dẹp nhà cửa
        3: "📅", // Định kỳ
        4: "🧑‍🦳", // Chăm sóc người già
        5: "🧼", // Sofa, nệm
        6: "❄️", // Điều hoà
        7: "🏢", // Tổng vệ sinh
        8: "🧒", // Trông trẻ
    };

    const currentUnit = chosenVariants[0]?.unit || "";
    useEffect(() => {
        if (currentUnit === "Ngày") {
            setSelection((prev) => ({
                ...prev,
                startTime: prev.startTime || "07:00",
                endTime: prev.endTime || "21:00",
                quantity: prev.quantity || 1,
                // ⚡ Giữ nguyên prev.date và prev.dates nếu đã có
                date: prev.date,
                dates: prev.dates,
            }));
        }
    }, [currentUnit]);


    const [showCalendar, setShowCalendar] = useState(false);

    const formatDate = (d) => {
        const date = d instanceof Date ? d : new Date(d); // ép về Date
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${day}/${month}/${year}`;
    };
    useEffect(() => {
        if (currentUnit === "Tuần") {
            setSelection((prev) => ({ ...prev, frequency: "Tuần" }));
        } else if (currentUnit === "Tháng") {
            setSelection((prev) => ({ ...prev, frequency: "Tháng" }));
        }
    }, [currentUnit]);

    function renderStep1Summary() {
        if (!selection || !chosenVariants.length) return null;
        const unit = chosenVariants[0]?.unit;
        const serviceId = chosenVariants[0]?.service_id;

        if (unit === "Giờ") {
            return (
                <>
                    <div>• <strong>Thời lượng: </strong>
                        {selection.startTime && selection.endTime
                            ? (() => {
                                const start = new Date(`1970-01-01T${selection.startTime}:00`);
                                const end = new Date(`1970-01-01T${selection.endTime}:00`);
                                const hours = (end - start) / (1000 * 60 * 60);
                                return `${hours.toFixed(2)} giờ`;
                            })()
                            : "—"}
                    </div>
                    <div>
                        • <strong>Ngày bắt đầu:</strong>{" "}
                        {selection.date
                            ? new Date(selection.date).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })
                            : "—"}
                    </div>
                    <div>
                        • <strong>Giờ làm việc:</strong>{" "}
                        {selection.startTime && selection.endTime
                            ? `${selection.startTime} - ${selection.endTime}`
                            : "—"}
                    </div>
                </>
            );
        }

        if (unit === "Ngày") {
            return (
                <>
                    <div>
                        • <strong>Thời lượng: Ngày</strong>{" "}
                    </div>
                    <div>
                        •  <strong>Ngày đã chọn:</strong>{" "}
                        {selection.dates?.length
                            ? selection.dates
                                .map((d) =>
                                    new Date(d).toLocaleDateString("vi-VN", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })
                                )
                                .join(", ")
                            : "—"}
                    </div>
                    <div>
                        • <strong>Giờ:</strong>{" "}
                        {selection.startTime && selection.endTime
                            ? `${selection.startTime} - ${selection.endTime}`
                            : "—"}
                    </div>
                </>
            );
        }

        if (unit === "Tuần") {
            return (
                <>
                    <div>• <strong>Thời lượng: Tuần</strong></div>
                    <div>
                        • <strong>Thời gian:</strong>{" "}
                        {selection.dates?.length
                            ? `${new Date(selection.dates[0]).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })} - ${new Date(selection.dates[selection.dates.length - 1]).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })}`
                            : "—"}
                    </div>
                    {selection.workHours === "Bán thời gian" ? (
                        <div>• <strong>Giờ:</strong> 07:00 - 21:00</div>
                    ) : selection.workHours === "Toàn thời gian" ? (
                        <div>• <strong>Giờ:</strong> Qua đêm</div>
                    ) : (
                        <div>• <strong>Giờ:</strong> —</div>
                    )}
                </>
            );


        }

        if (unit === "Buổi") {
            if (serviceId === 1) {
                return (
                    <>
                        <div>• <strong>Thời lượng:</strong> Buổi</div>
                        <div>
                            • <strong>Ngày bắt đầu:</strong>{" "}
                            {selection.date
                                ? new Date(selection.date).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                })
                                : "—"}
                        </div>
                        <div>
                            • <strong>Giờ bắt đầu:</strong>{" "}
                            {selection.startTime || "—"}
                        </div>
                    </>
                );
            }
        }



        if (unit === "Tháng") {
            return (
                <>
                    <div>• <strong>Thời lượng: Tháng</strong></div>
                    <div>
                        • <strong>Thời gian:</strong>{" "}
                        {selection.dates?.length
                            ? `${new Date(selection.dates[0]).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })} - ${new Date(selection.dates[selection.dates.length - 1]).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })}`
                            : "—"}
                    </div>
                    {selection.workHours === "Bán thời gian" ? (
                        <div>• <strong>Giờ:</strong> 07:00 - 21:00</div>
                    ) : selection.workHours === "Toàn thời gian" ? (
                        <div>• <strong>Giờ:</strong> Qua đêm</div>
                    ) : (
                        <div>• <strong>Giờ:</strong> —</div>
                    )}
                </>
            );
        }

        if (["m2", "Mét vuông", "Chiếc"].includes(unit)) {
            return (
                <>
                    <div>• <strong>Thời lượng:</strong> Ngày</div>
                    <div>
                        • <strong>Ngày bắt đầu:</strong>{" "}
                        {selection.date
                            ? new Date(selection.date).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })
                            : "—"}
                    </div>
                    <div>
                        • <strong>Giờ bắt đầu:</strong>{" "}
                        {selection.startTime || "—"}
                    </div>
                    {selection.quantity && (
                        <div>
                            • <strong>
                                {["m2", "Mét vuông"].includes(unit) ? "Diện tích" : "Số lượng"}:
                            </strong>{" "}
                            {selection.quantity} {unit}
                        </div>
                    )}
                </>
            );
        }

        return null;
    }

    const serviceId = chosenVariants[0]?.service_id || "";

    const totalPrice = chosenVariants.reduce((sum, v) => {
        let basePrice =
            v?.specific_price != null
                ? v.specific_price
                : v?.price_min != null
                    ? v.price_min
                    : 0;

        const unit = v.unit;
        let subtotal = 0;

        if (unit === "Giờ") {
            if (selection.startTime && selection.endTime) {
                const start = new Date(`1970-01-01T${selection.startTime}:00`);
                const end = new Date(`1970-01-01T${selection.endTime}:00`);
                const hours = (end - start) / (1000 * 60 * 60);
                subtotal = basePrice * hours;
            }
        } else if (unit === "Ngày") {
            const days = selection.dates?.length || 0;
            subtotal = basePrice * days;
        } else if (unit === "Tuần") {
            subtotal = basePrice;
            if (selection.workHours === "Toàn thời gian") {
                subtotal += 500; // +500k khi làm full-time
            }
        } else if (unit === "Tháng") {
            subtotal = basePrice;
            if (selection.workHours === "Toàn thời gian") {
                subtotal += 500; // +500k khi làm full-time
            }
        } else if (["m2", "Mét vuông", "Chiếc"].includes(unit)) {
            subtotal = basePrice * (selection.quantity || 1);
        } else if (unit === "Buổi") {
            subtotal = basePrice * 1; // mỗi buổi = 1 lần
        }

        return sum + subtotal;
    }, 0);


    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                <Col lg={8}>
                    {/* Tasker Profile Hero Section */}
                    {tasker && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="shadow-sm border-0 mb-4 overflow-hidden" style={{ borderRadius: 24 }}>
                                <div style={{ height: 100, background: "linear-gradient(135deg, #169c98 0%, #007bff 100%)", opacity: 0.8 }}></div>
                                <Card.Body className="pt-0 px-4 pb-4">
                                    <div className="d-flex flex-column flex-md-row gap-4 align-items-start" style={{ marginTop: -40 }}>
                                        <div className="position-relative">
                                            <img
                                                src={tasker.avatar || "https://i.pravatar.cc/120"}
                                                alt={tasker.name}
                                                style={{
                                                    width: 120,
                                                    height: 120,
                                                    border: "5px solid white",
                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                                    objectFit: "cover"
                                                }}
                                                className="rounded-circle"
                                            />
                                            <div className="position-absolute bottom-0 right-0 p-1 bg-white rounded-circle shadow-sm" style={{ bottom: 10, right: 10 }}>
                                                <Badge bg="success" className="p-1 rounded-circle">
                                                    <CheckCircle2 size={12} color="white" />
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex-grow-1 pt-md-5">
                                            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                                                <h3 className="fw-bold mb-0 text-dark">{tasker.name}</h3>
                                                <Badge bg="primary" style={{ backgroundColor: "rgba(0, 123, 255, 0.1) !important", color: "#ffffffff", fontWeight: 600, padding: "6px 12px" }} className="rounded-pill d-flex align-items-center gap-1 border-0">
                                                    <ShieldCheck size={14} /> {tasker.cccd_status === 'Verified' ? 'Đã xác minh' : 'Xác thực'}
                                                </Badge>
                                                {tasker.reliability_score >= 90 && (
                                                    <Badge bg="success" style={{ backgroundColor: "rgba(40, 167, 69, 0.1) !important", color: "#ffffffff", fontWeight: 600, padding: "6px 12px" }} className="rounded-pill d-flex align-items-center gap-1 border-0">
                                                        <Trophy size={14} /> Uy tín cao
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="d-flex flex-wrap gap-2 text-muted mb-3 small">
                                                <div className="d-flex align-items-center gap-1 me-2">
                                                    <Mail size={14} className="text-primary" />
                                                    <span>{tasker.email}</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-1 me-2">
                                                    <Phone size={14} className="text-success" />
                                                    <span>{tasker.phone}</span>
                                                </div>
                                                {age && (
                                                    <div className="d-flex align-items-center gap-1 me-2">
                                                        <User size={14} className="text-info" />
                                                        <span>{age} tuổi</span>
                                                    </div>
                                                )}
                                                {tasker.points > 0 && (
                                                    <div className="d-flex align-items-center gap-1">
                                                        <Trophy size={14} className="text-warning" />
                                                        <span className="text-dark fw-bold">{tasker.points} điểm</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="d-flex flex-wrap gap-3 text-muted mb-3">
                                                <div className="d-flex align-items-center gap-1">
                                                    <Star size={16} fill="#ffc107" color="#ffc107" />
                                                    <span className="fw-bold text-dark">{tasker.rating || 0}</span>
                                                    <span>({tasker.reviewCount || 0} đánh giá)</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-1">
                                                    <Award size={16} color="#169c98" />
                                                    <span>{tasker.certifications || "Chưa cập nhật chứng chỉ"}</span>
                                                </div>
                                            </div>

                                            <div className="text-dark mb-3" style={{ maxWidth: 600, whiteSpace: "pre-line", fontSize: "0.95rem" }}>
                                                {tasker.Introduce || tasker.bio || "Rất hân hạnh được phục vụ quý khách!"}
                                            </div>

                                            {/* Quick Stats Grid */}
                                            {/* <Row className="g-2 mt-2">
                                                <Col xs={6} md={3}>
                                                    <div className="p-2 rounded-3 border bg-light text-center">
                                                        <small className="text-muted d-block">Tin cậy</small>
                                                        <span className="fw-bold text-primary">{tasker.reliability_score || 0}%</span>
                                                    </div>
                                                </Col>
                                                <Col xs={6} md={3}>
                                                    <div className="p-2 rounded-3 border bg-light text-center">
                                                        <small className="text-muted d-block">Hoàn thành</small>
                                                        <span className="fw-bold text-success">98%</span>
                                                    </div>
                                                </Col>
                                            </Row> */}
                                        </div>
                                    </div>

                                    {/* Detailed Reviews Expandable Section */}
                                    {/* {tasker.reviews && tasker.reviews.length > 0 && (
                                        <div className="mt-4 border-top pt-4">
                                            <Accordion flush className="review-accordion">
                                                <Accordion.Item eventKey="0" className="border-0">
                                                    <Accordion.Header className="px-0">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <MessageSquare size={18} className="text-primary" />
                                                            <span className="fw-bold">Xem các đánh giá từ khách hàng ({tasker.reviews.length})</span>
                                                        </div>
                                                    </Accordion.Header>
                                                    <Accordion.Body className="px-0 pt-3">
                                                        <div className="d-flex flex-column gap-3">
                                                            {tasker.reviews.map((rev, idx) => (
                                                                <div key={idx} className="p-3 rounded-4 border bg-white shadow-sm hover-shadow" style={{ transition: "all 0.2s" }}>
                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                                                                                {rev.name?.charAt(0) || 'K'}
                                                                            </div>
                                                                            <div>
                                                                                <div className="fw-bold small">{rev.name}</div>
                                                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                                                    {new Date(rev.date).toLocaleDateString('vi-VN')} • {rev.service}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="d-flex align-items-center gap-1 bg-warning bg-opacity-10 px-2 py-1 rounded-pill">
                                                                            <Star size={12} fill="#ffc107" color="#ffc107" />
                                                                            <span className="fw-bold text-dark" style={{ fontSize: '0.8rem' }}>{rev.rating}</span>
                                                                        </div>
                                                                    </div>
                                                                    <p className="mb-0 text-dark" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                                                                        {rev.text}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            </Accordion>
                                        </div>
                                    )} */}
                                </Card.Body>
                            </Card>
                        </motion.div>
                    )}

                    {/* Wizard Card (Toàn bộ chuyển sang tiếng Việt) */}
                    <Card className="border-0 shadow-sm" style={{ borderRadius: 16 }}>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="mb-0 fw-bold">Đặt dịch vụ giúp việc</h4>
                                <div className="text-muted small">Bước {step + 1} trên {totalSteps}</div>
                            </div>

                            <ProgressBar
                                key={progressKey}
                                now={progress}
                                animated
                                className="my-3"
                                style={{
                                    height: 8,
                                    backgroundColor: "#eef3f6",
                                    "--bs-progress-bar-bg": "#169c98",
                                    transition: "width .45s ease",
                                }}
                            />

                            {step === 0 && (
                                <div>
                                    <h4 className="mb-3 d-flex align-items-center gap-2 text-primary">
                                        <span>🧹 Chọn dịch vụ</span>
                                    </h4>

                                    {loadingServices ? (
                                        <div className="d-flex align-items-center gap-2 text-muted">
                                            <Spinner size="sm" /> Đang tải dịch vụ...
                                        </div>
                                    ) : (
                                        <Accordion defaultActiveKey="0" alwaysOpen className="service-accordion">
                                            {Object.entries(_.groupBy(services, "service_id")).map(([serviceId, variants], idx) => (
                                                <Accordion.Item key={serviceId} eventKey={String(idx)} className="mb-2 border-0">
                                                    <Accordion.Header>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="fs-5">{iconMap[serviceId] || "✨"}</span>
                                                            <div>
                                                                <div className="fw-semibold">{variants[0].service_name}</div>
                                                                <div className="text-muted small">{variants.length} gói dịch vụ</div>
                                                            </div>
                                                        </div>
                                                    </Accordion.Header>

                                                    <Accordion.Body
                                                        className="bg-light"
                                                        style={{ borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}
                                                    >
                                                        {variants.map((v) => (
                                                            <VariantCard
                                                                key={v.variant_id}
                                                                v={v}
                                                                checked={!!selection.services[v.variant_id]}
                                                                onToggle={() => toggleVariant(v.variant_id)}
                                                            />
                                                        ))}
                                                    </Accordion.Body>
                                                </Accordion.Item>
                                            ))}
                                        </Accordion>
                                    )}

                                    {!loadingServices && touched && selectedCount === 0 && (
                                        <div className="text-danger small mt-2">Vui lòng chọn ít nhất một dịch vụ để tiếp tục.</div>
                                    )}
                                </div>
                            )}

                            {step === 1 && (
                                <div className="booking-step1 py-2">
                                    {/* Header */}
                                    <h4 className="mb-3 d-flex align-items-center gap-2 text-primary">
                                        <span>📅 Cài đặt lịch hẹn dịch vụ</span>
                                    </h4>

                                    {/* Lấy unit từ DB */}
                                    {(() => {
                                        const currentUnit = chosenVariants[0]?.unit || "";
                                        const serviceId = chosenVariants[0]?.service_id || "";

                                        // ===== Giờ =====
                                        if (currentUnit === "Giờ") {
                                            return (
                                                <Row className="mb-4">
                                                    <Col md={4} className="mb-3">
                                                        <Form.Group>
                                                            <Form.Label className="fw-bold text-dark">Ngày bắt đầu</Form.Label>
                                                            <Form.Control
                                                                type="date"
                                                                className="fw-semibold text-dark"
                                                                value={selection.date}
                                                                min={new Date().toISOString().split("T")[0]}
                                                                onChange={(e) => setSelection({ ...selection, date: e.target.value })}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={4} className="mb-3">
                                                        <Form.Group>
                                                            <Form.Label className="fw-bold text-dark">Thời gian bắt đầu</Form.Label>
                                                            <Form.Control
                                                                type="time"
                                                                className="fw-semibold text-dark"
                                                                value={selection.startTime || "07:00"}   // ✅ luôn 24h format
                                                                min="07:00"
                                                                max={selection.endTime || "21:00"}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    if (value >= "07:00" && (!selection.endTime || value < selection.endTime)) {
                                                                        setSelection({ ...selection, startTime: value });
                                                                    }
                                                                }}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={4} className="mb-3">
                                                        <Form.Group>
                                                            <Form.Label className="fw-bold text-dark">Thời gian kết thúc</Form.Label>
                                                            <Form.Control
                                                                type="time"
                                                                className="fw-semibold text-dark"
                                                                value={selection.endTime || "09:00"}
                                                                min={selection.startTime || "07:00"} // 🔒 phải lớn hơn startTime
                                                                max="21:00"             // 🔒 ≤ 21:00
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    if (value <= "21:00" && (!selection.startTime || value > selection.startTime)) {
                                                                        setSelection({ ...selection, endTime: value });
                                                                    }
                                                                }}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>
                                            );
                                        }

                                        // ===== Ngày =====
                                        if (currentUnit === "Ngày") {
                                            return (
                                                <Row className="mb-4">
                                                    {/* Lịch chọn ngày */}
                                                    <Col md={4} className="mb-3">
                                                        <Form.Group>
                                                            <Form.Label className="fw-bold text-dark">Ngày bắt đầu</Form.Label>
                                                            <Form.Control
                                                                type="date"
                                                                className="fw-semibold text-dark"
                                                                value={selection.date}
                                                                min={new Date().toISOString().split("T")[0]}
                                                                onChange={(e) =>
                                                                    setSelection({
                                                                        ...selection,
                                                                        date: e.target.value,
                                                                        dates: [e.target.value],
                                                                        startTime: "07:00",
                                                                        endTime: "21:00"
                                                                    })
                                                                }
                                                            />
                                                        </Form.Group>
                                                    </Col>

                                                    {/* Thời gian bắt đầu (cố định) */}
                                                    <Col md={{ span: 3, offset: 1 }} className="mb-3">
                                                        <Form.Group>
                                                            <Form.Label className="fw-bold text-dark">Thời gian bắt đầu</Form.Label>
                                                            <Form.Control
                                                                type="time"
                                                                className="fw-semibold text-dark"
                                                                value="07:00"
                                                                disabled
                                                            />
                                                        </Form.Group>
                                                    </Col>

                                                    {/* Thời gian kết thúc (cố định) */}
                                                    <Col md={{ span: 3, offset: 1 }} className="mb-3">
                                                        <Form.Group>
                                                            <Form.Label className="fw-bold text-dark">Thời gian kết thúc</Form.Label>
                                                            <Form.Control
                                                                type="time"
                                                                className="fw-semibold text-dark"
                                                                value="21:00"
                                                                disabled
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>
                                            );
                                        }

                                        if (currentUnit === "Tuần") {
                                            // Hàm format ngày local YYYY-MM-DD
                                            const formatDate = (d) => {
                                                const date = d instanceof Date ? d : new Date(d);
                                                const year = date.getFullYear();
                                                const month = String(date.getMonth() + 1).padStart(2, "0");
                                                const day = String(date.getDate()).padStart(2, "0");
                                                return `${year}-${month}-${day}`;
                                            };

                                            if (serviceId === 4 || serviceId === 8) {
                                                return (
                                                    <Row className="mb-4">
                                                        {/* Ngày bắt đầu */}
                                                        <Col md={4} className="mb-3">
                                                            <Form.Group>
                                                                <Form.Label className="fw-bold text-dark">Ngày bắt đầu</Form.Label>
                                                                <InputGroup className="fw-semibold">
                                                                    <Form.Control
                                                                        readOnly
                                                                        value={
                                                                            selection.date
                                                                                ? new Date(selection.date).toLocaleDateString("vi-VN", {
                                                                                    day: "2-digit",
                                                                                    month: "2-digit",
                                                                                    year: "numeric",
                                                                                })
                                                                                : "Chưa chọn"
                                                                        }
                                                                        onClick={() => setShowCalendar(!showCalendar)}
                                                                    />
                                                                    <InputGroup.Text
                                                                        style={{ cursor: "pointer" }}
                                                                        onClick={() => setShowCalendar(!showCalendar)}
                                                                    >
                                                                        📅
                                                                    </InputGroup.Text>
                                                                </InputGroup>

                                                                {showCalendar && (
                                                                    <div className="mt-2">
                                                                        <DayPicker
                                                                            mode="multiple"
                                                                            selected={
                                                                                selection.dates
                                                                                    ? selection.dates.map((d) => new Date(d))
                                                                                    : []
                                                                            }
                                                                            onSelect={(day) => {
                                                                                if (!day) return;

                                                                                // Generate 7 ngày liên tiếp
                                                                                const days = Array.from({ length: 7 }, (_, i) => {
                                                                                    const date = new Date(day);
                                                                                    date.setDate(date.getDate() + i);
                                                                                    return formatDate(date); // string
                                                                                });

                                                                                setSelection({
                                                                                    ...selection,
                                                                                    date: formatDate(day), // ngày bắt đầu
                                                                                    dates: days,
                                                                                });
                                                                            }}
                                                                            modifiersClassNames={{
                                                                                selected: "custom-selected-day",
                                                                            }}
                                                                            disabled={{ before: new Date() }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </Form.Group>
                                                        </Col>

                                                        {/* Giờ bắt đầu */}
                                                        {selection.workHours === "Toàn thời gian" ? null : (
                                                            <>
                                                                <Col md={{ span: 3, offset: 1 }} className="mb-3">
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-bold text-dark">Thời gian bắt đầu</Form.Label>
                                                                        <Form.Control
                                                                            type="time"
                                                                            className="fw-semibold text-dark"
                                                                            value="07:00"
                                                                            disabled
                                                                        />
                                                                    </Form.Group>
                                                                </Col>

                                                                {/* Thời gian kết thúc (cố định) */}
                                                                <Col md={{ span: 3, offset: 1 }} className="mb-3">
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-bold text-dark">Thời gian kết thúc</Form.Label>
                                                                        <Form.Control
                                                                            type="time"
                                                                            className="fw-semibold text-dark"
                                                                            value="21:00"
                                                                            disabled
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </>
                                                        )}

                                                        <Card className="border-0 shadow-sm p-3 mb-3 booking-options-card" style={{ borderRadius: 12 }}>
                                                            <Card.Body>
                                                                <div className="service-info-header d-flex align-items-center gap-2 mb-3">
                                                                    <span className="service-info-icon">🔄</span>
                                                                    <h6 className="service-info-text mb-0">Thông tin dịch vụ</h6>
                                                                </div>

                                                                <div className="mb-4">
                                                                    <Form.Label>Tần suất</Form.Label>
                                                                    <div className="d-flex gap-3">
                                                                        <Button
                                                                            variant={currentUnit === "Tuần" ? "teal" : "outline-light"}
                                                                            className="flex-fill freq-btn"
                                                                            disabled
                                                                        >
                                                                            Theo tuần
                                                                        </Button>
                                                                        <Button
                                                                            variant={currentUnit === "Tháng" ? "teal" : "outline-light"}
                                                                            className="flex-fill freq-btn"
                                                                            disabled
                                                                        >
                                                                            Theo tháng
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                <div className="mb-4">
                                                                    <Form.Label>Tùy chọn ca làm cho người giúp việc:</Form.Label>
                                                                    <div className="d-flex gap-3">
                                                                        <Button
                                                                            variant={selection.workHours === "Bán thời gian" ? "teal" : "outline-light"}
                                                                            className="flex-fill"
                                                                            onClick={() => setSelection({ ...selection, workHours: "Bán thời gian" })}
                                                                        >
                                                                            Làm bán thời gian <br /> <small>(7h-21h)</small>
                                                                        </Button>
                                                                        <Button
                                                                            variant={selection.workHours === "Toàn thời gian" ? "teal" : "outline-light"}
                                                                            className="flex-fill"
                                                                            onClick={() => setSelection({ ...selection, workHours: "Toàn thời gian" })}
                                                                        >
                                                                            Làm toàn thời gian<br /> <small>(Qua đêm + 500k)</small>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    </Row>
                                                );
                                            }
                                        }

                                        if (currentUnit === "Tháng") {
                                            const formatDate = (d) => {
                                                const date = d instanceof Date ? d : new Date(d);
                                                const year = date.getFullYear();
                                                const month = String(date.getMonth() + 1).padStart(2, "0");
                                                const day = String(date.getDate()).padStart(2, "0");
                                                return `${year}-${month}-${day}`;
                                            };

                                            if (serviceId === 4 || serviceId === 8) {

                                                return (
                                                    <Row className="mb-4">
                                                        {/* Ngày bắt đầu */}
                                                        <Col md={4} className="mb-3">
                                                            <Form.Group>
                                                                <Form.Label className="fw-bold text-dark">Ngày bắt đầu</Form.Label>
                                                                <InputGroup className="fw-semibold">
                                                                    <Form.Control
                                                                        readOnly
                                                                        value={
                                                                            selection.date
                                                                                ? new Date(selection.date).toLocaleDateString("vi-VN", {
                                                                                    day: "2-digit",
                                                                                    month: "2-digit",
                                                                                    year: "numeric",
                                                                                })
                                                                                : "Chưa chọn"
                                                                        }
                                                                        onClick={() => setShowCalendar(!showCalendar)}
                                                                    />
                                                                    <InputGroup.Text
                                                                        style={{ cursor: "pointer" }}
                                                                        onClick={() => setShowCalendar(!showCalendar)}
                                                                    >
                                                                        📅
                                                                    </InputGroup.Text>
                                                                </InputGroup>

                                                                {showCalendar && (
                                                                    <div className="mt-2">
                                                                        <DayPicker
                                                                            mode="multiple"
                                                                            selected={
                                                                                selection.dates
                                                                                    ? selection.dates.map((d) => new Date(d))
                                                                                    : []
                                                                            }
                                                                            onSelect={(day) => {
                                                                                if (!day) return;

                                                                                const days = Array.from({ length: 30 }, (_, i) => {
                                                                                    const date = new Date(day);
                                                                                    date.setDate(date.getDate() + i);
                                                                                    return formatDate(date); // GIỮ DẠNG DATE
                                                                                });

                                                                                setSelection({
                                                                                    ...selection,
                                                                                    date: formatDate(day),
                                                                                    dates: days,
                                                                                });
                                                                            }}
                                                                            modifiersClassNames={{
                                                                                selected: "custom-selected-day",
                                                                            }}
                                                                            disabled={{ before: new Date() }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </Form.Group>
                                                        </Col>

                                                        {/* Giờ bắt đầu */}
                                                        {selection.workHours === "Toàn thời gian" ? null : (
                                                            <>
                                                                <Col md={{ span: 3, offset: 1 }} className="mb-3">
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-bold text-dark">Thời gian bắt đầu</Form.Label>
                                                                        <Form.Control
                                                                            type="time"
                                                                            className="fw-semibold text-dark"
                                                                            value="07:00"
                                                                            disabled
                                                                        />
                                                                    </Form.Group>
                                                                </Col>

                                                                {/* Thời gian kết thúc (cố định) */}
                                                                <Col md={{ span: 3, offset: 1 }} className="mb-3">
                                                                    <Form.Group>
                                                                        <Form.Label className="fw-bold text-dark">Thời gian kết thúc</Form.Label>
                                                                        <Form.Control
                                                                            type="time"
                                                                            className="fw-semibold text-dark"
                                                                            value="21:00"
                                                                            disabled
                                                                        />
                                                                    </Form.Group>
                                                                </Col>
                                                            </>
                                                        )}

                                                        <Card className="border-0 shadow-sm p-3 mb-3 booking-options-card" style={{ borderRadius: 12 }}>
                                                            <Card.Body>
                                                                <div className="service-info-header d-flex align-items-center gap-2 mb-3">
                                                                    <span className="service-info-icon">🔄</span>
                                                                    <h6 className="service-info-text mb-0">Thông tin dịch vụ</h6>
                                                                </div>

                                                                <div className="mb-4">
                                                                    <Form.Label>Tần suất</Form.Label>
                                                                    <div className="d-flex gap-3">
                                                                        <Button
                                                                            variant={currentUnit === "Tuần" ? "teal" : "outline-light"}
                                                                            className="flex-fill freq-btn"
                                                                            disabled
                                                                        >
                                                                            Theo tuần
                                                                        </Button>
                                                                        <Button
                                                                            variant={currentUnit === "Tháng" ? "teal" : "outline-light"}
                                                                            className="flex-fill freq-btn"
                                                                            disabled
                                                                        >
                                                                            Theo tháng
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                <div className="mb-4">
                                                                    <Form.Label>Tùy chọn ca làm cho người giúp việc:</Form.Label>
                                                                    <div className="d-flex gap-3">
                                                                        <Button
                                                                            variant={selection.workHours === "Bán thời gian" ? "teal" : "outline-light"}
                                                                            className="flex-fill"
                                                                            onClick={() => setSelection({ ...selection, workHours: "Bán thời gian" })}
                                                                        >
                                                                            Làm bán thời gian <br /> <small>(7h-21h)</small>
                                                                        </Button>
                                                                        <Button
                                                                            variant={selection.workHours === "Toàn thời gian" ? "teal" : "outline-light"}
                                                                            className="flex-fill"
                                                                            onClick={() => setSelection({ ...selection, workHours: "Toàn thời gian" })}
                                                                        >
                                                                            Làm qua đêm <br /> <small>(+ 500.000đ)</small>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    </Row>
                                                )
                                            };
                                        }

                                        // ===== Chiếc & m² =====
                                        if (["Chiếc", "m2", "Mét vuông"].includes(currentUnit)) {
                                            return (
                                                <>
                                                    <Row className="mb-4">
                                                        <Col md={6} className="mb-3">
                                                            <Form.Group>
                                                                <Form.Label className="fw-bold text-dark">Ngày bắt đầu</Form.Label>
                                                                <Form.Control
                                                                    type="date"
                                                                    className="fw-semibold text-dark"
                                                                    value={selection.date}
                                                                    min={new Date().toISOString().split("T")[0]}
                                                                    onChange={(e) =>
                                                                        setSelection({ ...selection, date: e.target.value })
                                                                    }
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={3} className="mb-3">
                                                            <Form.Group>
                                                                <Form.Label className="fw-bold text-dark">Thời gian bắt đầu</Form.Label>
                                                                <Form.Control
                                                                    type="time"
                                                                    className="fw-semibold text-dark"
                                                                    value={selection.startTime || "07:00"}
                                                                    min="07:00"
                                                                    max="21:00"
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        // chỉ chấp nhận giá trị trong khoảng 07:00 - 21:00
                                                                        if (value >= "07:00" && value <= "21:00") {
                                                                            setSelection({ ...selection, startTime: value });
                                                                        }
                                                                    }}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>

                                                    <Card className="border-0 shadow-sm p-3 mb-3 booking-options-card" style={{ borderRadius: 12 }}>
                                                        <Card.Body>
                                                            <div className="d-flex align-items-center gap-3">
                                                                {/* Label */}
                                                                <span className="fw-bold">
                                                                    {["m2", "Mét vuông"].includes(currentUnit) ? "Diện tích:" : "Số lượng:"}
                                                                </span>

                                                                {/* Ô nhập số + đơn vị */}
                                                                <InputGroup className="quantity-input" style={{ maxWidth: "200px" }}>
                                                                    <Form.Control
                                                                        type="number"
                                                                        min={1}
                                                                        value={selection.quantity || 1}
                                                                        onChange={(e) =>
                                                                            setSelection({
                                                                                ...selection,
                                                                                quantity: parseInt(e.target.value) || 1,
                                                                            })
                                                                        }
                                                                        className="text-center fw-bold"
                                                                    />
                                                                    <InputGroup.Text className="fw-semibold bg-light">
                                                                        {["m2", "Mét vuông"].includes(currentUnit) ? "m²" : "Chiếc"}
                                                                    </InputGroup.Text>
                                                                </InputGroup>
                                                            </div>
                                                        </Card.Body>
                                                    </Card>

                                                </>
                                            );
                                        }

                                        if (currentUnit === "Buổi") {
                                            if (serviceId === 1) {
                                                return (
                                                    <>
                                                        <Row className="mb-4">
                                                            <Col md={6} className="mb-3">
                                                                <Form.Group>
                                                                    <Form.Label className="fw-bold text-dark">Ngày bắt đầu</Form.Label>
                                                                    <Form.Control
                                                                        type="date"
                                                                        className="fw-semibold text-dark"
                                                                        value={selection.date}
                                                                        min={new Date().toISOString().split("T")[0]}
                                                                        onChange={(e) =>
                                                                            setSelection({ ...selection, date: e.target.value })
                                                                        }
                                                                    />
                                                                </Form.Group>
                                                            </Col>

                                                            <Col md={3} className="mb-3">
                                                                <Form.Group>
                                                                    <Form.Label className="fw-bold text-dark">Thời gian bắt đầu</Form.Label>
                                                                    <Form.Control
                                                                        type="time"
                                                                        className="fw-semibold text-dark"
                                                                        value={selection.startTime || "07:00"}
                                                                        min="07:00"
                                                                        max="21:00"
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (value >= "07:00" && value <= "21:00") {
                                                                                setSelection({ ...selection, startTime: value });
                                                                            }
                                                                        }}
                                                                    />
                                                                </Form.Group>
                                                            </Col>
                                                        </Row>
                                                    </>
                                                );
                                            }
                                        }
                                        return null;
                                    })()}

                                    {/* Bảng tóm tắt (luôn hiển thị) */}
                                    <Card className="summary-card border-0 mt-3">
                                        <Card.Body>
                                            <h6 className="fw-bold mb-3">Bảng tóm tắt</h6>
                                            <div className="text-muted small">
                                                {currentUnit === "Giờ" ? (
                                                    <>
                                                        <div>• <strong>Thời lượng: </strong>
                                                            {selection.startTime && selection.endTime
                                                                ? (() => {
                                                                    const start = new Date(`1970-01-01T${selection.startTime}:00`);
                                                                    const end = new Date(`1970-01-01T${selection.endTime}:00`);
                                                                    const hours = (end - start) / (1000 * 60 * 60);
                                                                    return `${hours.toFixed(2)} giờ`;
                                                                })()
                                                                : "—"}
                                                        </div>
                                                        <div>
                                                            • <strong>Ngày bắt đầu:</strong>{" "}
                                                            {selection.date
                                                                ? new Date(selection.date).toLocaleDateString("vi-VN", {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                })
                                                                : "—"}
                                                        </div>
                                                        <div>
                                                            • <strong>Giờ làm việc:</strong>{" "}
                                                            {selection.startTime && selection.endTime
                                                                ? `${selection.startTime} - ${selection.endTime}`
                                                                : "—"}
                                                        </div>
                                                    </>
                                                ) : currentUnit === "Ngày" ? (
                                                    <>
                                                        <div>
                                                            • <strong>Thời lượng: Ngày</strong>{" "}
                                                        </div>
                                                        <div>
                                                            • <strong>Ngày đã chọn:</strong>{" "}
                                                            {selection.dates?.length
                                                                ? selection.dates
                                                                    .map((d) =>
                                                                        new Date(d).toLocaleDateString("vi-VN", {
                                                                            day: "2-digit",
                                                                            month: "2-digit",
                                                                            year: "numeric",
                                                                        })
                                                                    )
                                                                    .join(", ")
                                                                : "—"}
                                                        </div>
                                                        <div>
                                                            • <strong>Giờ:</strong>{" "}
                                                            {selection.startTime && selection.endTime
                                                                ? `${selection.startTime} - ${selection.endTime}`
                                                                : "—"}
                                                        </div>
                                                    </>
                                                ) : currentUnit === "Tuần" ? (
                                                    <>
                                                        <div>
                                                            • <strong>Thời lượng: Tuần</strong>
                                                        </div>
                                                        <div>
                                                            • <strong>Thời gian:</strong>{" "}
                                                            {selection.dates?.length
                                                                ? `${new Date(selection.dates[0]).toLocaleDateString("vi-VN", {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                })} - ${new Date(selection.dates[selection.dates.length - 1]).toLocaleDateString("vi-VN", {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                })}`
                                                                : "—"}
                                                        </div>
                                                        {selection.workHours === "Bán thời gian" ? (
                                                            <div>
                                                                • <strong>Giờ:</strong> 07:00 - 21:00
                                                            </div>
                                                        ) : selection.workHours === "Toàn thời gian" ? null : (
                                                            <div>
                                                                • <strong>Giờ:</strong> —
                                                            </div>
                                                        )}
                                                    </>
                                                ) : currentUnit === "Tháng" ? (
                                                    <>
                                                        <div>
                                                            • <strong>Thời lượng: Tháng</strong>
                                                        </div>
                                                        <div>
                                                            • <strong>Thời gian:</strong>{" "}
                                                            {selection.dates?.length
                                                                ? `${new Date(selection.dates[0]).toLocaleDateString("vi-VN", {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                })} - ${new Date(selection.dates[selection.dates.length - 1]).toLocaleDateString("vi-VN", {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                })}`
                                                                : "—"}
                                                        </div>
                                                        {selection.workHours === "Bán thời gian" ? (
                                                            <div>
                                                                • <strong>Giờ:</strong> 07:00 - 21:00
                                                            </div>
                                                        ) : selection.workHours === "Toàn thời gian" ? null : (
                                                            <div>
                                                                • <strong>Giờ:</strong> —
                                                            </div>
                                                        )}
                                                    </>
                                                ) : ["m2", "Mét vuông", "Chiếc"].includes(currentUnit) ? (
                                                    <>
                                                        <div>
                                                            • <strong>Thời lượng:</strong> Ngày
                                                        </div>
                                                        <div>
                                                            • <strong>Ngày bắt đầu:</strong>{" "}
                                                            {selection.date
                                                                ? new Date(selection.date).toLocaleDateString("vi-VN", {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                })
                                                                : "—"}
                                                        </div>
                                                        <div>
                                                            • <strong>Giờ bắt đầu:</strong>{" "}
                                                            {selection.startTime ? selection.startTime : "—"}
                                                        </div>
                                                        {selection.quantity && (
                                                            <div>
                                                                • <strong>
                                                                    {["m2", "Mét vuông"].includes(chosenVariants[0]?.unit)
                                                                        ? "Diện tích"
                                                                        : "Số lượng"}
                                                                    :
                                                                </strong>{" "}
                                                                {selection.quantity} {chosenVariants[0]?.unit}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : currentUnit === "Buổi" && serviceId === 1 ? (
                                                    <>
                                                        <div>
                                                            • <strong>Thời lượng:</strong> Buổi
                                                        </div>
                                                        <div>
                                                            • <strong>Ngày bắt đầu:</strong>{" "}
                                                            {selection.date
                                                                ? new Date(selection.date).toLocaleDateString("vi-VN", {
                                                                    day: "2-digit",
                                                                    month: "2-digit",
                                                                    year: "numeric",
                                                                })
                                                                : "—"}
                                                        </div>
                                                        <div>
                                                            • <strong>Giờ bắt đầu:</strong>{" "}
                                                            {selection.startTime ? selection.startTime : "—"}
                                                        </div>
                                                    </>
                                                ) : null}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </div>
                            )}


                            {step === 2 && user && user.role === "Customer" && (
                                <div className="py-2">
                                    <h4 className="mb-3 d-flex align-items-center gap-2 text-primary">
                                        <span>📇 Thông tin liên hệ</span>
                                    </h4>

                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold text-dark">Họ và Tên</Form.Label>
                                                <Form.Control value={user.name} readOnly />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold text-dark">Số điện thoại</Form.Label>
                                                <Form.Control value={user.phone} readOnly />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col>
                                            <Form.Group>
                                                <Form.Label className="fw-bold text-dark">Email</Form.Label>
                                                <Form.Control value={user.email} readOnly />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col>
                                            <Form.Group>
                                                <Form.Label className="fw-bold text-dark">
                                                    Địa chỉ chi tiết <span className="text-danger">*</span>
                                                </Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2}
                                                    value={selection.address || ""}
                                                    onChange={(e) =>
                                                        setSelection({ ...selection, address: e.target.value })
                                                    }
                                                    placeholder="Nhập địa chỉ cụ thể..."
                                                    required
                                                />
                                            </Form.Group>
                                            {!selection.address && touched && (
                                                <div className="text-danger small mt-1">
                                                    Bạn cần nhập địa chỉ để tiếp tục.
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="py-2">
                                    <h4 className="mb-3 d-flex align-items-center gap-2 text-primary">
                                        <span>📋 Tổng kết đặt dịch vụ</span>
                                    </h4>

                                    <h5 className="fw-bold mb-2">Loại dịch vụ</h5>
                                    {/* Loại dịch vụ */}
                                    <Card className="mb-3 border-0 shadow-sm summary-section">
                                        <Card.Body>
                                            <div className="d-flex align-items-center">
                                                <span className="me-2">🔄</span>
                                                <span className="fw-semibold">
                                                    {chosenVariants[0]?.unit === "Giờ" && "Theo giờ"}
                                                    {chosenVariants[0]?.unit === "Ngày" && "Theo ngày"}
                                                    {chosenVariants[0]?.unit === "Tuần" && "Theo tuần"}
                                                    {chosenVariants[0]?.unit === "Tháng" && "Theo tháng"}
                                                    {chosenVariants[0]?.unit === "Chiếc" && "Theo số lượng"}
                                                    {chosenVariants[0]?.unit === "Buổi" && "Theo buổi"}
                                                    {["m2", "Mét vuông"].includes(chosenVariants[0]?.unit) && "Theo diện tích"}
                                                </span>
                                            </div>
                                        </Card.Body>
                                    </Card>

                                    {/* Dịch vụ đã chọn */}
                                    <h5 className="fw-bold mb-2">Dịch vụ đã chọn</h5>
                                    <Card className="mb-3 border-0 shadow-sm summary-section">
                                        <Card.Body>
                                            {chosenVariants.map((v) => (
                                                <div key={v.variant_id} className="mb-2">
                                                    <div className="fw-semibold">{v.variant_name}</div>
                                                    <small className="text-muted">
                                                        {v.parent_service_name
                                                            ? `Thuộc dịch vụ: ${v.parent_service_name}`
                                                            : ""}
                                                    </small>
                                                </div>
                                            ))}
                                        </Card.Body>
                                    </Card>


                                    <h5 className="fw-bold mb-2">Lịch hẹn</h5>
                                    {/* Lịch hẹn */}
                                    <Card className="mb-3 border-0 shadow-sm summary-section">
                                        <Card.Body>
                                            <div className="d-flex align-items-center mb-2">
                                                <span className="me-2">📅</span>
                                                <span>
                                                    {selection.date
                                                        ? new Date(selection.date).toLocaleDateString("vi-VN", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                        })
                                                        : "—"}
                                                </span>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <span className="me-2">⏰</span>
                                                <span>{selection.startTime || "—"}</span>
                                            </div>
                                        </Card.Body>
                                    </Card>

                                    <h5 className="fw-bold mb-2">Địa điểm</h5>
                                    {/* Địa điểm */}
                                    <Card className="mb-3 border-0 shadow-sm summary-section">
                                        <Card.Body>
                                            <div className="d-flex align-items-center">
                                                <span className="me-2">📍</span>
                                                <span>{selection.address || "—"}</span>
                                            </div>
                                        </Card.Body>
                                    </Card>

                                    <h5 className="fw-bold mb-2">Tóm tắt dịch vụ</h5>
                                    {/* Lịch lặp lại */}
                                    <Card className="mb-4 border-0 shadow-sm summary-section">
                                        <Card.Body>
                                            <div>{renderStep1Summary()}</div>
                                            <strong>
                                                • Đây là bản xem lại thông tin dịch vụ trước khi xác nhận.
                                            </strong>
                                        </Card.Body>
                                    </Card>

                                </div>
                            )}

                            {/* Footer Navigation */}
                            <div className="booking-footer mt-4">
                                <hr className="mb-3" />
                                <div className="d-flex justify-content-between align-items-center">
                                    <Button
                                        variant="outline-light"
                                        className="nav-btn"
                                        onClick={goPrev}
                                        disabled={false}
                                    >
                                        <span className="me-2">←</span> Quay lại
                                    </Button>

                                    {step < totalSteps - 1 ? (
                                        <Button
                                            variant="teal"
                                            className="nav-btn"
                                            onClick={goNext}
                                            disabled={!canNext}
                                        >
                                            Tiếp tục <span className="ms-2">→</span>
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="teal"
                                            className="nav-btn"
                                            onClick={() => {
                                                const normDate = normalizeDate(selection.date);
                                                const lastDate = (selection.dates && selection.dates.length > 0)
                                                    ? normalizeDate(selection.dates[selection.dates.length - 1])
                                                    : normDate;

                                                const startISO =
                                                    normDate && selection.startTime
                                                        ? new Date(`${normDate}T${selection.startTime}:00`).toISOString()
                                                        : null;

                                                const endISO =
                                                    lastDate && selection.endTime
                                                        ? new Date(`${lastDate}T${selection.endTime}:00`).toISOString()
                                                        : null;

                                                const unit = chosenVariants[0]?.unit || "";
                                                const serviceId = chosenVariants[0]?.service_id;

                                                let quantity = 1;
                                                let totalHours = 1;

                                                if (startISO && endISO) {
                                                    totalHours =
                                                        (new Date(endISO).getTime() - new Date(startISO).getTime()) /
                                                        (1000 * 60 * 60);
                                                }

                                                switch (unit) {
                                                    case "Giờ":
                                                        quantity = totalHours;
                                                        break;

                                                    case "Chiếc":
                                                        quantity = Number(selection.quantity) || 1;
                                                        break;

                                                    case "Mét vuông":
                                                        quantity = Number(selection.quantity) || 1;
                                                        break;

                                                    case "Ngày":
                                                        quantity = selection.dates?.length || 1;
                                                        break;

                                                    default:
                                                        quantity = 1;
                                                }

                                                console.log("🧮 [Booking] FINAL QUANTITY:", quantity);

                                                const payload = {
                                                    step,
                                                    selection: {
                                                        ...selection,
                                                        unit,
                                                        totalHours: unit === "Giờ" ? totalHours : undefined,
                                                        startISO,
                                                        endISO,
                                                        quantity, // 👈 GIÁ TRỊ QUAN TRỌNG NHẤT
                                                    },


                                                    chosenVariants,
                                                    allVariants,
                                                    total: totalPrice,
                                                    cleaner: tasker?.name || "Không rõ",
                                                    // 🔹 Dữ liệu thật từ user & tasker
                                                    customer_id: user?.id,
                                                    customer_name: user?.name,
                                                    customer_email: user?.email,
                                                    customer_phone: user?.phone,
                                                    tasker_id: taskerId,
                                                    tasker_name: tasker?.name,
                                                    service_id: chosenVariants[0]?.service_id,
                                                    service_name: chosenVariants[0]?.service_name,
                                                    variant_id: chosenVariants[0]?.variant_id,
                                                    variant_name: chosenVariants[0]?.name,
                                                    start_time: startISO,
                                                    end_time: endISO,
                                                    location: selection.address,
                                                    expected_price: totalPrice,
                                                    // Nếu đến từ báo giá: giữ giá đã chốt & id báo giá & post
                                                    fromQuote: bookingData?.fromQuote || false,
                                                    lockedPrice: bookingData?.lockedPrice || null,
                                                    quote_id: bookingData?.quote_id || null,
                                                    post_id: bookingData?.post_id || null,
                                                    // Truyền ảnh blog nếu có (giảm thêm 1 request ở JobDescription)
                                                    photo_urls: bookingData?.photo_urls || null,
                                                };

                                                let total_sessions = 1;

                                                switch (unit) {
                                                    case "Giờ":
                                                        total_sessions = 1;
                                                        break;
                                                    case "Ngày":
                                                        total_sessions = selection.dates?.length || 1;
                                                        break;
                                                    case "Tuần":
                                                        total_sessions = 7;
                                                        break;
                                                    case "Tháng":
                                                        total_sessions = 30;
                                                        break;
                                                    case "Chiếc":
                                                    case "Mét vuông":
                                                    case "m2":
                                                    case "Buổi":
                                                        total_sessions = 1;
                                                        break;
                                                }
                                                payload.total_sessions = total_sessions;

                                                console.log("📦 [Booking] Dữ liệu gửi sang JobDescription:", payload);

                                                console.log("🔢 [Booking] Số lượng user nhập:", selection.quantity);

                                                navigate("/job-description", { state: payload });
                                            }}
                                        >
                                            📋 Chuyển sang trang mô tả công việc
                                        </Button>
                                    )}
                                </div>
                            </div>

                        </Card.Body>
                    </Card>
                </Col>
            </Row >
        </Container >
    );
}

/* CSS inject: hover, gradient, card chọn… */
if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.innerHTML = `
/* ===========================
   Provider Card
   =========================== */
.provider-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
}

/* ===========================
   Accordion Dịch vụ
   =========================== */
.service-accordion .accordion-button {
  font-weight: 700;
  background: linear-gradient(90deg, #f0f7ff, #f9fff7);
  border-radius: 12px !important;
  color: #111827;
}
.service-accordion .accordion-button:not(.collapsed) {
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.08);
}
.service-accordion .accordion-item { border: none; }
.service-accordion .accordion-body {
  background: #fbfdff;
  border-radius: 12px;
}

/* ===========================
   Thẻ dịch vụ nhỏ (variant)
   =========================== */
.service-variant {
  position: relative;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  transition: transform .15s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
  cursor: pointer;
  margin-bottom: 12px;
  overflow: visible;
  isolation: isolate;
}
.service-variant .variant-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.service-variant:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,.08);
}
/* Khi chọn */
.service-variant--checked {
  background: #f0fdfa;
  border-color: #2081e2;
  box-shadow: none;
}
.service-variant--checked::after {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: 18px;
  box-shadow: 0 0 0 3px rgba(32,129,226,.14);
  pointer-events: none;
  z-index: -1;
}
.accordion-body .service-variant,
.accordion-body .service-variant--checked {
  border-radius: 16px !important;
}

/* ===========================
   Nội dung trong variant
   =========================== */
.variant-body { padding: 14px 16px; }
.variant-title {
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 2px;
}
.variant-desc {
  color: #6b7280;
  font-size: 0.9rem;
}
.variant-price {
  color: #2081e2;
  font-weight: 800;
}

/* ===========================
   Footer + Navigation
   =========================== */
.booking-footer hr {
  border-top: 2px solid #94a3b8;
}
.nav-btn {
  border-radius: 8px !important;
  font-weight: 600;
  padding: 8px 18px;
  min-width: 120px;
}

/* ===========================
   Buttons
   =========================== */
.btn-teal {
  background-color: #2081e2 !important;
  border-color: #2081e2 !important;
  color: #fff !important;
  border-radius: 8px !important;
  font-weight: 600;
  padding: 12px 24px;
  transition: all 0.2s ease;
}
.btn-teal:hover {
  background-color: #1e6fd1 !important;
  border-color: #1e6fd1 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(32, 129, 226, 0.3);
}
.btn-outline-light {
  background-color: #fff !important;
  border: 2px solid #2081e2 !important;
  color: #2081e2 !important;
  border-radius: 8px !important;
  font-weight: 600;
  padding: 12px 24px;
  transition: all 0.2s ease;
}
.btn-outline-light:hover {
  background-color: #f0f7ff !important;
}

.summary-section .card-body {
  padding-bottom: 0.5rem; /* giảm padding dưới */
}

/* ===========================
   Step 1 Custom Styles
   =========================== */
.booking-step1 .form-label {
  font-weight: 700;
  color: #111827;
}
.booking-step1 .form-control {
  font-weight: 600;
  color: #111827;
  font-size: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 14px;
  transition: border-color 0.2s ease;
}
.booking-step1 .form-control:focus {
  border-color: #2081e2;
  box-shadow: 0 0 0 3px rgba(32, 129, 226, 0.15);
}

/* Card bọc Tần suất + Ca + Tóm tắt */
.booking-options-card {
  background: linear-gradient(90deg, #f0f7ff, #f9fff7);
  border: 1px solid #e5e7eb;
  border-radius: 12px !important;
  padding: 16px;
}

/* Card tóm tắt */
.booking-step1 .summary-card {
  background: linear-gradient(135deg, #f0fdfa 0%, #f9fafb 100%);
  border: 1px solid #d1fae5;
  border-radius: 12px;
  padding: 12px;
}
.booking-step1 .summary-card h6 {
  font-weight: 700;
  font-size: 16px;
  color: #111827;
}
.booking-step1 .summary-card ul {
  list-style-type: none;
  padding: 0;
  margin: 0 0 8px 0;
}
.booking-step1 .summary-card li {
  margin-bottom: 6px;
  font-size: 14px;
  color: #374151;
}
.summary-card {
  background: linear-gradient(135deg, #f0fdfa 0%, #f9fafb 100%);
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 16px;
}

.summary-card h6 {
  font-size: 15px;
  color: #111827;
}

.summary-card div {
  margin-bottom: 6px;
  font-size: 14px;
}

/* Header Thông tin dịch vụ */
.service-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.service-info-icon {
  font-size: 22px;
  color: #2081e2;
}
.service-info-text {
  font-weight: 700;
  font-size: 18px;
  color: #111827;
}

/* ===========================
   Responsive
   =========================== */
@media (max-width: 768px) {
  .btn-teal, .btn-outline-light {
    width: 100%;
  }
}
.freq-btn {
  text-transform: none !important;
}
.quantity-input .form-control {
  max-width: 90px;       /* ô nhập nhỏ gọn */
}

.quantity-input .btn {
  min-width: 40px;
  font-weight: bold;
}

.quantity-input .input-group-text {
  min-width: 60px;
  justify-content: center;
}
.custom-selected-day {
  background-color: #0d6efd !important; /* màu xanh primary */
  color: #fff !important;
  border-radius: 50% !important; /* bo tròn */
  font-weight: bold;
}
.summary-section {
  background: #f9fafb;
  border: 2px solid #e5e7eb;   /* viền rõ hơn */
  border-radius: 14px;
  padding: 20px;
}

.summary-section h5 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
}

.summary-section .d-flex span {
  font-size: 1.05rem;  /* chữ và emoji to hơn */
  line-height: 1.6;
}

.summary-section .fw-semibold {
  font-size: 1.05rem;   /* tên dịch vụ to hơn */
}

.summary-section small {
  font-size: 1rem;     /* chữ chú thích cũng lớn hơn */
}

.summary-section .fw-bold {
  font-size: 1.25rem;  /* giá tiền nổi bật hơn */
}

.summary-section div {
  font-size: 1.05rem;
}
.input[type="time"]::-webkit-datetime-edit-ampm-field {
  display: none;
}

.input[type="time"] {
  position: relative;
}

.input[type="time"]::-webkit-calendar-picker-indicator {
  color: transparent;
  background: none;
}
    `;
        document.head.appendChild(style);
    });
}

/** Card hiển thị từng gói (variant) — click để toggle chọn */
function VariantCard({ v, checked, onToggle }) {
    // Map đơn vị từ DB → hiển thị gọn
    const unitMap = {
        "Giờ": "giờ",
        "Ngày": "ngày",
        "Tuần": "tuần",
        "Tháng": "tháng",
        "Chiếc": "chiếc",
        "Mét vuông": "mét vuông",
        "m2": "mét vuông",
        "Buổi": "buổi"
    };
    const unit = unitMap[v.unit] ?? "";
    const unitSuffix = unit ? `/${unit}` : "";

    // Build chuỗi giá: ưu tiên specific_price, sau đó min-max
    let priceStr = "";
    if (v?.specific_price != null) {
        priceStr = `${formatVND(v.specific_price)}${unitSuffix}`;
    } else if (v?.price_min != null && v?.price_max != null) {
        priceStr = `${formatVND(v.price_min)} – ${formatVND(v.price_max)}${unitSuffix}`;
    } else if (v?.price_min != null) {
        priceStr = `${formatVND(v.price_min)}${unitSuffix}`;
    } else if (v?.price_max != null) {
        priceStr = `${formatVND(v.price_max)}${unitSuffix}`;
    }

    // Thời lượng gợi ý
    const approxMap = { hour: "~1h", day: "~1d", week: "~1w", month: "~1mo" };
    const approx = approxMap[unit] ?? "";

    return (
        <Card className={`mb-3 service-variant ${checked ? "service-variant--checked" : ""}`} onClick={onToggle}>
            <Card.Body className="variant-body d-flex flex-column">
                <div className="variant-title">{v.variant_name}</div>
                <div className="variant-desc">{v.pricing_type}</div>
                <div className="d-flex gap-3 align-items-center mt-1">
                    <span className="variant-price">{priceStr}</span>
                    {approx && <span className="text-muted small">{approx}</span>}
                </div>
            </Card.Body>
        </Card>
    );
}

/** Xem lại lựa chọn trước khi xác nhận */
function Review({ selection, chosenVariants, iconMap }) {
    return (
        <div className="mt-2">
            <Card className="border-0 bg-light" style={{ borderRadius: 14 }}>
                <Card.Body>
                    <h6 className="mb-3">Dịch vụ đã chọn</h6>

                    {chosenVariants.length ? (
                        <ul className="mb-0">
                            {chosenVariants.map((v) => (
                                <li key={v.variant_id} className="mb-1">
                                    <span className="fw-semibold">{v.variant_name}</span>{" "}
                                    — <span className="text-primary">
                                        {v?.specific_price != null
                                            ? formatVND(v.specific_price)
                                            : v?.price_min != null && v?.price_max != null
                                                ? `${formatVND(v.price_min)} – ${formatVND(v.price_max)}`
                                                : v?.price_min != null
                                                    ? formatVND(v.price_min)
                                                    : v?.price_max != null
                                                        ? formatVND(v.price_max)
                                                        : ""}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-muted">Chưa chọn dịch vụ nào.</div>
                    )}

                    <hr />
                    <div className="row g-3">
                        <div className="col-md-4">
                            <strong>Ngày:</strong> {selection.date || "—"}
                        </div>
                        <div className="col-md-4">
                            <strong>Giờ:</strong> {selection.time || "—"}
                        </div>
                        <div className="col-md-4">
                            <strong>Địa chỉ:</strong> {selection.address || "—"}
                        </div>
                        <div className="col-12">
                            <strong>Ghi chú:</strong> {selection.notes || "—"}
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}


