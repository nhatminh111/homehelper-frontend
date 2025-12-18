import { Container, Row, Col, Card, Button, Tabs, Tab, Form } from "react-bootstrap";
import SignatureCanvas from "react-signature-canvas";
import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { showToast } from "../../components/common/CustomToast";
import { formatVND } from "../../utils/formatVND";
import { Spinner } from "react-bootstrap";

export default function ContractPage() {
    const { id: bookingId } = useParams();
    const navigate = useNavigate();
    const sigCanvas = useRef(null);
    const [signature, setSignature] = useState("");
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [signatureUrl, setSignatureUrl] = useState(null);
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const res = await api.get(`/bookings/details/${bookingId}`);
                if (res.data.success) {
                    setBooking(res.data.booking);
                }
            } catch (err) {
                console.error(err);
                showToast.error("Không thể tải thông tin hợp đồng");
            } finally {
                setLoading(false);
            }
        };
        if (bookingId) fetchBooking();
    }, [bookingId]);

    // Fix signature canvas scaling/offset issue
    useEffect(() => {
        const handleResize = () => {
            if (sigCanvas.current && !isConfirmed) {
                const canvas = sigCanvas.current.getCanvas();
                if (canvas) {
                    const container = canvas.parentElement;
                    if (container) {
                        canvas.width = container.offsetWidth;
                        sigCanvas.current.clear();
                    }
                }
            }
        };
        window.addEventListener('resize', handleResize);
        const timeout = setTimeout(handleResize, 500);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeout);
        };
    }, [isConfirmed]);

    const partnerSignature = {
        name: "Nguyen Van A",
        role: "ABC Company Representative",
        signedAt: "2025-08-24T10:30:00Z",
        signatureUrl: "https://static.vecteezy.com/system/resources/previews/025/866/351/original/fake-autograph-samples-hand-drawn-signatures-examples-of-documents-certificates-and-contracts-with-inked-and-handwritten-lettering-vector.jpg", // ảnh giả
    };

    const clearSignature = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear(); // Xóa canvas
            sigCanvas.current.on(); // Bật lại vẽ
        }
        setSignature("");        // Xóa signature preview
        setIsConfirmed(false);
        setSignatureUrl(null);
    };

    const handleConfirmSignature = async () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            showToast.error("Vui lòng vẽ chữ ký trước khi xác nhận");
            return;
        }

        // Use getCanvas() instead of getTrimmedCanvas() to avoid "trim_canvas is not a function" error
        // If trimming is needed, we might need to implement it manually or update the library.
        const canvas = sigCanvas.current.getCanvas();

        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const formData = new FormData();
            formData.append("signature", blob, "signature.png");

            setSubmitting(true);
            const res = await api.post("/uploads/signature", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.data.success) {
                setSignatureUrl(res.data.data.url);
                setIsConfirmed(true);
                sigCanvas.current.off(); // Tắt vẽ
                showToast.success("Đã xác nhận chữ ký!");
            }
        } catch (error) {
            console.error(error);
            showToast.error("Lỗi khi tải lên chữ ký");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8faff' }}>
                <Spinner animation="border" variant="primary" className="mb-3" />
                <p className="text-muted">Đang tải thông tin hợp đồng...</p>
            </div>
        );
    }

    return (
        <Container
            fluid
            className="py-4"
            style={{
                background: "#f8faff",
                padding: "2rem",        // khoảng cách bên trong
                minHeight: "100vh",     // full chiều cao để cân đối
            }}
        >
            <div
                style={{
                    maxWidth: "1200px",   // cố định chiều rộng tối đa
                    margin: "0 auto",     // căn giữa khung
                    borderRadius: "12px",
                    padding: "2rem",
                }}
            >
                <Row>
                    {/* LEFT COLUMN: CONTRACT */}
                    <Col lg={8}>
                        <Card
                            className="mb-4"
                            style={{
                                borderRadius: "16px",
                                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                            }}
                        >
                            <Card.Body>
                                {/* Header Box */}
                                <div
                                    className="d-flex justify-content-between align-items-center text-white p-3 rounded mb-4"
                                    style={{
                                        background: "linear-gradient(90deg, #2196f3, #21cbf3)",
                                        boxShadow: "0 4px 10px rgba(33,150,243,0.3)",
                                    }}
                                >
                                    {/* Nút Quay lại */}
                                    <Button
                                        variant="light"
                                        size="sm"
                                        onClick={() => window.history.back()}
                                        className="fw-semibold"
                                        style={{ borderRadius: "20px", padding: "0.25rem 1rem" }}
                                    >
                                        ⬅ Quay lại
                                    </Button>

                                    {/* Tiêu đề */}
                                    <h5 className="mb-0 fw-bold text-uppercase">Thông tin hợp đồng</h5>

                                    {/* Mã hợp đồng */}
                                    <small className="fw-semibold">Mã: #HD-{booking?.booking_id?.toString().padStart(5, '0')}</small>
                                </div>

                                <h4
                                    className="fw-bold text-center mb-2"
                                    style={{
                                        background: "linear-gradient(90deg, #2196f3, #21cbf3)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        fontSize: "1.8rem",
                                    }}
                                >
                                    HỢP ĐỒNG DỊCH VỤ {booking?.service_name?.toUpperCase()}
                                </h4>
                                <p className="text-center mb-4 text-muted">
                                    Giữa Tasker <strong>{booking?.tasker_name}</strong> và Khách hàng <strong>{booking?.customer_name}</strong>
                                </p>

                                {/* PARTY INFO */}
                                <Row className="mb-4">
                                    <Col md={6}>
                                        <Card className="p-3 bg-light border-0 shadow-sm rounded-3 h-100">
                                            <h6 className="fw-bold text-primary mb-2 border-bottom pb-1">
                                                BÊN A (Người giúp việc / Tasker)
                                            </h6>
                                            <p className="mb-1 fw-bold fs-5 text-dark">{booking?.tasker_name || "---"}</p>
                                            <div className="small">
                                                <p className="mb-1">📧 <strong>Email:</strong> {booking?.tasker_email || "N/A"}</p>
                                                <p className="mb-1">📞 <strong>Điện thoại:</strong> {booking?.tasker_phone || "N/A"}</p>
                                                <p className="mb-0 text-muted">Mã định danh: {booking?.tasker_id ? `HH-T${booking.tasker_id}` : "---"}</p>
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card className="p-3 bg-warning-subtle border-0 shadow-sm rounded-3 h-100">
                                            <h6 className="fw-bold text-primary mb-2 border-bottom pb-1">BÊN B (Khách hàng)</h6>
                                            <p className="mb-1 fw-bold fs-5 text-dark">{booking?.customer_name || "---"}</p>
                                            <div className="small">
                                                <p className="mb-1">📧 <strong>Email:</strong> {booking?.customer_email || "N/A"}</p>
                                                <p className="mb-1">📞 <strong>Điện thoại:</strong> {booking?.customer_phone || "N/A"}</p>
                                                <p className="mb-0">📍 <strong>Địa chỉ:</strong> {booking?.location || "---"}</p>
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* SERVICE INFO SUMMARY */}
                                <div className="p-3 mb-4 rounded border bg-white shadow-sm" style={{ borderLeft: '4px solid #2196f3' }}>
                                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">NỘI DUNG DỊCH VỤ THỎA THUẬN</h6>
                                    <Row className="small gy-2">
                                        <Col sm={6}>
                                            <span className="text-muted">Loại dịch vụ:</span> <strong className="text-dark">{booking?.service_name}</strong>
                                        </Col>
                                        <Col sm={6}>
                                            <span className="text-muted">Gói dịch vụ:</span> <strong className="text-dark">{booking?.variant_name}</strong>
                                        </Col>
                                        <Col sm={6}>
                                            <span className="text-muted">Ngày bắt đầu:</span> <strong className="text-dark">{booking?.start_time && new Date(booking.start_time).toLocaleDateString('vi-VN')}</strong>
                                        </Col>
                                        <Col sm={6}>
                                            <span className="text-muted">Tổng số buổi:</span> <strong className="text-dark">{booking?.total_sessions} buổi</strong>
                                        </Col>
                                        <Col sm={12} className="mt-3 border-top pt-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="text-muted fs-6">TỔNG GIÁ TRỊ HỢP ĐỒNG:</span>
                                                <strong className="fs-4 text-danger">
                                                    {formatVND((booking?.final_price || booking?.expected_price) * (booking?.quantity || 1))}
                                                </strong>
                                            </div>
                                            <p className="text-muted x-small mt-1 mb-0 italic">*(Giá đã bao gồm các loại phí dịch vụ và thuế nếu có)</p>
                                        </Col>
                                    </Row>
                                </div>

                                {/* CONTRACT TERMS */}
                                <h5 className="text-primary fw-bold mb-3 border-bottom pb-2">📑 Điều khoản hợp đồng & Cam kết dịch vụ</h5>
                                <div className="contract-terms-scroll ps-2" style={{ maxHeight: '400px', overflowY: 'auto', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    <ol className="ps-3">
                                        <li className="mb-3">
                                            <strong>Nghĩa vụ của Bên A (Tasker):</strong>
                                            <ul className="text-muted">
                                                <li>Thực hiện dịch vụ <strong>{booking?.service_name}</strong> đúng thời gian và địa điểm thỏa thuận.</li>
                                                <li>Đảm bảo chất lượng công việc theo tiêu chuẩn của HomeHelper.</li>
                                                <li>Tự trang bị dụng cụ và hóa chất an toàn (trừ khi có thỏa thuận khác).</li>
                                                <li>Tuyệt đối bảo mật thông tin cá nhân và tài sản của Bên B.</li>
                                                <li>Bồi thường 100% giá trị thiệt hại nếu gây ra hư hỏng, mất mát tài sản do lỗi trực tiếp của mình.</li>
                                            </ul>
                                        </li>
                                        <li className="mb-3">
                                            <strong>Nghĩa vụ của Bên B (Khách hàng):</strong>
                                            <ul className="text-muted">
                                                <li>Thanh toán đầy đủ số tiền <strong>{formatVND((booking?.final_price || booking?.expected_price) * (booking?.quantity || 1))}</strong> qua hệ thống.</li>
                                                <li>Cung cấp điều kiện làm việc an toàn và hướng dẫn cụ thể (nếu có).</li>
                                                <li>Khai báo các tài sản có giá trị lớn trước khi Tasker bắt đầu làm việc.</li>
                                                <li>Thông báo thay đổi lịch trình tối thiểu 04 tiếng trước giờ bắt đầu.</li>
                                            </ul>
                                        </li>
                                        <li className="mb-3">
                                            <strong>Chính sách bồi thường & Bảo hiểm:</strong>
                                            <p className="text-muted mb-1">Cần tuân thủ quy trình xử lý khiếu nại của HomeHelper:</p>
                                            <ul className="text-muted">
                                                <li>Mọi sự cố phải được báo cáo trong vòng 24h kể từ khi kết thúc ca làm.</li>
                                                <li>HomeHelper hỗ trợ giải quyết tranh chấp và bồi thường theo gói bảo hiểm dịch vụ (nếu có).</li>
                                            </ul>
                                        </li>
                                        <li className="mb-3">
                                            <strong>Điều khoản chung:</strong>
                                            <ul className="text-muted">
                                                <li>Hợp đồng điện tử này có giá trị pháp lý tương đương văn bản giấy.</li>
                                                <li>Mọi tranh chấp sẽ được ưu tiên giải quyết thông qua thương lượng trên nền tảng.</li>
                                            </ul>
                                        </li>
                                    </ol>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* RIGHT COLUMN: SIGNATURE */}
                    <Col lg={4}>
                        {/* Signature Preview */}
                        <Card
                            className="mb-4"
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                            }}
                        >
                            <Card.Body>
                                <h6 className="fw-bold text-dark mb-3">Chữ kí Tasker (Bên A)</h6>
                                <div
                                    style={{
                                        borderRadius: 8,
                                        border: "1px solid #d6f3df",
                                        background: "#f7fffb",
                                        padding: "0.8rem",
                                    }}
                                >
                                    <div className="d-flex justify-content-between mb-2">
                                        <div>
                                            <div className="fw-bold">{booking?.tasker_name || "Chưa có tên"}</div>
                                            <div className="text-muted small">Đại diện Bên A (Người lao động)</div>
                                        </div>
                                        <div className="text-success small text-end">
                                            {booking?.tasker_signature_url ? "✔️ Đã ký điện tử" : "⏳ Đang chờ hệ thống..."}
                                        </div>
                                    </div>
                                    <div className="border rounded p-2 text-center bg-white" style={{ minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', backgroundImage: 'linear-gradient(45deg, #f9f9f9 25%, transparent 25%, transparent 75%, #f9f9f9 75%, #f9f9f9), linear-gradient(45deg, #f9f9f9 25%, transparent 25%, transparent 75%, #f9f9f9 75%, #f9f9f9)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}>
                                        {booking?.tasker_signature_url ? (
                                            <img
                                                src={booking.tasker_signature_url}
                                                alt="Chữ ký Tasker"
                                                style={{ maxWidth: "100%", maxHeight: 100, objectFit: "contain", filter: "contrast(1.2)" }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'block';
                                                }}
                                            />
                                        ) : null}
                                        <span className="text-muted italic small" style={{ display: booking?.tasker_signature_url ? 'none' : 'block' }}>
                                            Chữ ký điện tử đã được xác thực <br /> qua hồ sơ cá nhân của Tasker
                                        </span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Signature Input */}
                        <Card
                            className="mb-3"
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                            }}
                        >
                            <Card.Body>
                                <h6 className="fw-bold mb-3">✍️ Chữ ký của bạn</h6>
                                <div className="border rounded bg-light mb-3" style={{ position: 'relative' }}>
                                    <SignatureCanvas
                                        ref={sigCanvas}
                                        penColor="black"
                                        canvasProps={{
                                            height: 150,
                                            className: `w-100 ${isConfirmed ? 'bg-secondary-subtle' : 'bg-white'}`,
                                            style: { display: 'block', width: '100%' }
                                        }}
                                        onBegin={() => !isConfirmed}
                                    />
                                    {isConfirmed && (
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: 'rgba(255,255,255,0.5)'
                                        }}>
                                            <div className="badge bg-success fs-6">✔️ Đã khóa</div>
                                        </div>
                                    )}
                                </div>

                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        onClick={clearSignature}
                                        disabled={submitting}
                                    >
                                        {isConfirmed ? "Ký lại" : "Xóa"}
                                    </Button>
                                    {!isConfirmed && (
                                        <Button
                                            variant="primary"
                                            onClick={handleConfirmSignature}
                                            disabled={submitting}
                                        >
                                            {submitting ? "Đang xử lý..." : "Xác nhận"}
                                        </Button>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Security */}
                        <Card
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                            }}
                        >
                            <Card.Body>
                                <h6 className="fw-bold text-success mb-3">🔒 Bảo mật & Xác thực</h6>
                                <ul className="list-unstyled mb-0 text-muted">
                                    <li>✔️ Mã hóa SSL 256-bit</li>
                                    <li>✔️ Xác thực danh tính</li>
                                    <li>✔️ Lưu trữ an toàn</li>
                                    <li>✔️ Tuân thủ GDPR</li>
                                </ul>
                            </Card.Body>
                        </Card>

                        {/* Checkbox Agreement */}
                        <div className="mb-3">
                            <Form.Check
                                type="checkbox"
                                id="agree-terms"
                                label="Tôi đồng ý với các điều khoản dịch vụ và hợp đồng điện tử này."
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="fw-semibold text-primary"
                            />
                        </div>

                        {/* Next Step: Sign & Payment */}
                        <div className="mt-3">
                            <Button
                                className="w-100 fw-semibold"
                                style={{
                                    background: "linear-gradient(90deg,#2196f3,#21cbf3)",
                                    border: "none",
                                    color: "white",
                                    padding: "0.75rem",
                                    borderRadius: "10px",
                                    boxShadow: "0 4px 10px rgba(33,150,243,0.3)",
                                    opacity: (!agreed || !isConfirmed) ? 0.6 : 1
                                }}
                                disabled={!agreed || !isConfirmed || submitting}
                                onClick={async () => {
                                    if (!bookingId) {
                                        showToast.error("Không tìm thấy mã booking.");
                                        return;
                                    }

                                    if (!signatureUrl) {
                                        showToast.error("Vui lòng xác nhận chữ ký trước.");
                                        return;
                                    }

                                    setSubmitting(true);
                                    try {
                                        // Gọi API xác nhận ký với URL chữ ký
                                        await api.post(`/bookings/${bookingId}/sign`, {
                                            signatureUrl
                                        });
                                        showToast.success("Đã ký hợp đồng thành công!");

                                        // Chuyển sang trang thanh toán
                                        navigate(`/payment/${bookingId}`);
                                    } catch (err) {
                                        console.error(err);
                                        const msg = err.response?.data?.message || err.message || "Lỗi khi ký hợp đồng. Vui lòng thử lại.";
                                        showToast.error(msg);
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }}
                            >
                                {submitting ? "Đang xử lý..." : "✔ Ký & Đến trang thanh toán ➡"}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}
