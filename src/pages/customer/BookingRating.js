import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Container,
    Card,
    Row,
    Col,
    Spinner,
    Button,
    Alert,
    Form
} from "react-bootstrap";
import api from "../../services/api";
import { showToast } from "../../components/common/CustomToast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

export default function RatingPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);
    const [ratingLoading, setRatingLoading] = useState(true);

    // Rating states
    const [existingRating, setExistingRating] = useState(null);
    const [stars, setStars] = useState(0);
    const [comment, setComment] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // ============================
    // 1) Fetch Booking
    // ============================
    useEffect(() => {
        const loadBooking = async () => {
            try {
                const res = await api.get(`/bookings/details/${bookingId}`);
                if (!res.data?.booking) {
                    showToast.error("Không tìm thấy booking!");
                    return navigate("/bookings");
                }
                setBooking(res.data.booking);
            } catch (err) {
                showToast.error("Không tải được booking!");
            } finally {
                setLoading(false);
            }
        };

        loadBooking();
    }, [bookingId, navigate]);

    // ============================
    // 2) Fetch Rating
    // ============================
    useEffect(() => {
        if (!booking) return;

        const loadRating = async () => {
            try {
                setRatingLoading(true);
                const res = await api.get(`/ratings/find-by-booking/${booking.booking_id}`);
                setExistingRating(res.data?.rating || null);
            } catch (err) {
                console.log("Không tải được rating.");
            } finally {
                setRatingLoading(false);
            }
        };

        loadRating();
    }, [booking]);

    // ============================
    // 3) Submit rating
    // ============================
    const submitRating = async () => {
        if (!stars) return showToast.error("Vui lòng chọn số sao!");
        if (!comment.trim()) return showToast.error("Vui lòng nhập bình luận!");

        setErrorMessage(""); // clear previous error

        try {
            const res = await api.post(`/ratings/booking`, {
                booking_id: booking.booking_id,
                rating: stars,
                comment,
            });

            showToast.success("Đánh giá thành công!");

            setExistingRating(
                res.data?.rating || {
                    rating: stars,
                    comment,
                }
            );
        } catch (err) {
            const msg = err.message || "Gửi đánh giá thất bại";
            // Check for profanity keywords
            if (msg.includes("không phù hợp") || msg.includes("vi phạm")) {
                // User request: "hiển thị rating của bạn đã vi phạm" in toast
                showToast.error("Đánh giá của bạn đã vi phạm tiêu chuẩn cộng đồng!");

                // User request: inline red text
                setErrorMessage("Bình luận chứa từ ngữ không phù hợp. Không thể đăng đánh giá. Vui lòng chỉnh sửa lại.");
            } else {
                showToast.error(msg);
            }
        }
    };

    // ============================
    // UI RENDER
    // ============================
    if (loading)
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );

    if (!booking)
        return (
            <Container className="mt-5">
                <Alert variant="danger">Không tìm thấy thông tin booking!</Alert>
            </Container>
        );

    return (
        <div className="bg-light min-vh-100 py-5">
            <Container>
                <Row className="justify-content-center">
                    <Col md={8} lg={6}>
                        <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
                            <div className="bg-primary p-4 text-center text-white">
                                <h3 className="fw-bold mb-0">Đánh giá dịch vụ</h3>
                                <p className="mb-0 opacity-75">Chia sẻ trải nghiệm của bạn</p>
                            </div>

                            <Card.Body className="p-4 p-md-5">
                                {/* Booking info */}
                                <div className="text-center mb-4 pb-4 border-bottom">
                                    <h5 className="fw-bold text-dark mb-1">{booking.service_name}</h5>
                                    <div className="text-muted small mb-2">Mã đơn: #{booking.booking_id}</div>
                                    <span className={`badge ${booking.status === 'Hoàn thành' ? 'bg-success' : 'bg-secondary'} rounded-pill px-3 py-2`}>
                                        {booking.status}
                                    </span>
                                </div>

                                {/* Nếu chưa hoàn thành */}
                                {booking.status !== "Hoàn thành" && (
                                    <Alert variant="warning" className="text-center border-0 bg-warning bg-opacity-10 text-warning-emphasis">
                                        <i className="bi bi-exclamation-circle me-2"></i>
                                        Bạn chỉ có thể đánh giá sau khi booking hoàn thành.
                                    </Alert>
                                )}

                                {/* Đang tải rating */}
                                {ratingLoading ? (
                                    <div className="text-center py-5">
                                        <Spinner animation="border" variant="secondary" />
                                        <p className="text-muted mt-2">Đang tải dữ liệu...</p>
                                    </div>
                                ) : existingRating ? (
                                    // ============================
                                    // HIỂN THỊ RATING ĐÃ TỒN TẠI
                                    // ============================
                                    <div className="text-center">
                                        <div className="mb-3">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-success display-1 mb-3" />
                                            <h4 className="fw-bold text-success">Cảm ơn đánh giá của bạn!</h4>
                                        </div>

                                        <div className="bg-light rounded-3 p-4 mb-3">
                                            <div className="mb-3 text-warning fs-3">
                                                {[...Array(5)].map((_, i) => (
                                                    <FontAwesomeIcon
                                                        key={i}
                                                        icon={faStar}
                                                        className={i < existingRating.rating ? "text-warning" : "text-muted opacity-25"}
                                                    />
                                                ))}
                                            </div>
                                            <p className="fst-italic text-secondary mb-0">"{existingRating.comment}"</p>
                                        </div>
                                        <p className="text-muted small">Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ tốt hơn.</p>

                                        <div className="d-grid mt-4">
                                            <Button variant="outline-secondary" onClick={() => navigate('/customer/bookings')}>
                                                Quay lại lịch sử
                                            </Button>
                                        </div>
                                    </div>
                                ) : booking.status === "Hoàn thành" ? (
                                    // ============================
                                    // FORM GỬI RATING
                                    // ============================
                                    <div className="text-center">
                                        <p className="text-muted mb-4">Bạn cảm thấy dịch vụ thế nào?</p>

                                        {/* Stars */}
                                        <div className="mb-4 d-flex justify-content-center gap-3">
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <FontAwesomeIcon
                                                    key={n}
                                                    icon={faStar}
                                                    className={`transition-all ${n <= stars ? "text-warning" : "text-muted opacity-25"}`}
                                                    style={{
                                                        cursor: "pointer",
                                                        fontSize: "2.5rem",
                                                        transform: n <= stars ? "scale(1.1)" : "scale(1)",
                                                        transition: "all 0.2s"
                                                    }}
                                                    onClick={() => setStars(n)}
                                                    onMouseEnter={() => { /* Optional: add hover effect logic here */ }}
                                                />
                                            ))}
                                        </div>

                                        {/* Comment */}
                                        <Form.Group className="mb-4 text-start">
                                            <Form.Label className="fw-semibold text-secondary small text-uppercase">Nội dung đánh giá</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                placeholder="Tasker làm việc có tốt không? Hãy chia sẻ chi tiết nhé..."
                                                rows={4}
                                                className={`bg-light border-0 p-3 ${errorMessage ? 'is-invalid' : ''}`}
                                                value={comment}
                                                onChange={(e) => {
                                                    setComment(e.target.value);
                                                    if (errorMessage) setErrorMessage("");
                                                }}
                                                style={{ resize: "none" }}
                                            />

                                            {/* Error Message Display */}
                                            {errorMessage && (
                                                <div className="text-danger mt-2 small fw-bold d-flex align-items-center animate__animated animate__shakeX">
                                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                                    {errorMessage}
                                                </div>
                                            )}
                                        </Form.Group>

                                        <div className="d-grid gap-2">
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                onClick={submitRating}
                                                className="fw-bold shadow-sm"
                                                disabled={!stars || !comment.trim()}
                                            >
                                                Gửi đánh giá
                                            </Button>
                                            <Button variant="link" className="text-decoration-none text-muted" onClick={() => navigate(-1)}>
                                                Bỏ qua
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
