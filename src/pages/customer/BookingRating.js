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
} from "react-bootstrap";
import api from "../../services/api";
import { showToast } from "../../components/common/CustomToast";

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
            showToast.error(err.response?.data?.message || "Gửi đánh giá thất bại");
        }
    };

    // ============================
    // UI RENDER
    // ============================
    if (loading)
        return (
            <div className="d-flex justify-content-center mt-5">
                <Spinner animation="border" />
            </div>
        );

    if (!booking)
        return (
            <Container className="mt-4">
                <Alert variant="danger">Không tìm thấy booking!</Alert>
            </Container>
        );

    return (
        <Container className="mt-4">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <h4 className="fw-bold mb-3">Đánh giá Tasker</h4>

                            {/* Booking info */}
                            <div className="mb-4 bg-light p-3 rounded">
                                <div className="fw-semibold">
                                    Mã Booking: #{booking.booking_id}
                                </div>
                                <div>Dịch vụ: {booking.service_name}</div>
                                <div>Trạng thái: {booking.status}</div>
                            </div>

                            {/* Nếu chưa hoàn thành */}
                            {booking.status !== "Hoàn thành" && (
                                <Alert variant="info">
                                    Bạn chỉ có thể đánh giá sau khi booking hoàn thành.
                                </Alert>
                            )}

                            {/* Đang tải rating */}
                            {ratingLoading ? (
                                <div className="d-flex gap-2 align-items-center text-muted">
                                    <Spinner size="sm" animation="border" />
                                    Đang tải đánh giá...
                                </div>
                            ) : existingRating ? (
                                // ============================
                                // HIỂN THỊ RATING ĐÃ TỒN TẠI
                                // ============================
                                <>
                                    <div className="fs-3 text-warning mb-2">
                                        {"★".repeat(existingRating.rating)}
                                        {"☆".repeat(5 - existingRating.rating)}
                                    </div>

                                    <div className="p-3 bg-light rounded border">
                                        {existingRating.comment}
                                    </div>

                                    <div className="mt-3 text-success fw-semibold">
                                        Bạn đã đánh giá booking này.
                                    </div>
                                </>
                            ) : booking.status === "Hoàn thành" ? (
                                // ============================
                                // FORM GỬI RATING
                                // ============================
                                <>
                                    {/* Stars */}
                                    <div className="mb-3">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <span
                                                key={n}
                                                style={{
                                                    cursor: "pointer",
                                                    fontSize: "32px",
                                                    color:
                                                        n <= stars ? "#FFD700" : "#ccc",
                                                }}
                                                onClick={() => setStars(n)}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>

                                    {/* Comment */}
                                    <textarea
                                        className="form-control"
                                        placeholder="Chia sẻ trải nghiệm..."
                                        rows={4}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />

                                    <Button
                                        className="mt-3 px-4"
                                        onClick={submitRating}
                                    >
                                        Gửi đánh giá
                                    </Button>
                                </>
                            ) : null}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
