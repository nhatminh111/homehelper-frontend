import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import NegotiatePriceButton from '../components/negotiation/NegotiatePriceButton';
import { useEffect, useState } from "react";
import bookingService from '../services/bookingService';

export default function TaskerBookingDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [booking, setBooking] = useState(location.state || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Nếu không có booking trong state, gọi API lấy theo id
    if (!booking && id) {
      setLoading(true);
      bookingService.getBookingDetails(id)
        .then(data => {
          setBooking(data);
          setError(null);
        })
        .catch(err => {
          setError(err.message || 'Không thể tải thông tin booking');
        })
        .finally(() => setLoading(false));
    }
  }, [id, booking]);

  if (loading) return <Container className="py-5 text-center"><div>Đang tải thông tin booking...</div></Container>;
  if (error) return <Container className="py-5 text-center text-danger"><div>{error}</div></Container>;
  if (!booking) return <Container className="py-5 text-center"><div>Không tìm thấy thông tin booking.</div></Container>;

  const {
    booking_id,
    customer_id,
    tasker_id,
    service_id,
    variant_id,
    booking_time,
    start_time,
    end_time,
    location: bookingAddress,
    status = "Chờ xác nhận",
    base_price,
    surcharge,
    final_price,
    tasker_status,
    tasker_rating,
    service_name,
    variant_name,
    pricing_type,
    unit,
    price_min,
    price_max,
    customer_name,
    customer_email,
    customer_phone,
    photos = [],
    chosenVariants = [],
    expected_price,
  } = booking;

  // Lấy thời gian hiện tại
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formatDateTime = (isoString) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return `${date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}, ${date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <Container className="py-5">
      <h3 className="fw-bold mb-2">Chi tiết công việc</h3>
      <p className="text-muted mb-4">
        Xem thông tin khách hàng và yêu cầu công việc
      </p>

      <Row className="g-4 align-items-stretch">
        {/* CỘT TRÁI - Thông tin khách hàng */}
        <Col md={5}>
          <Card className="shadow-sm border-0 h-100" style={{ borderRadius: "14px" }}>
            <Card.Body>
              <h5 className="fw-bold mb-4">Thông tin khách hàng</h5>

              <div className="d-flex flex-column gap-3 text-secondary">
                <div>
                  <h6 className="fw-semibold mb-0 text-dark">
                    {customer_name || "Khách hàng ẩn danh"}
                  </h6>
                  <small className="text-muted">
                    ⭐ 4.8 đánh giá • 12 công việc đã hoàn thành
                  </small>
                </div>

                {customer_phone && (
                  <div>
                    <i className="bi bi-telephone text-primary me-2"></i>
                    {customer_phone}
                  </div>
                )}

                {customer_email && (
                  <div>
                    <i className="bi bi-envelope text-primary me-2"></i>
                    {customer_email}
                  </div>
                )}

                {bookingAddress && (
                  <div>
                    <i className="bi bi-geo-alt text-primary me-2"></i>
                    {bookingAddress}
                  </div>
                )}

                {(start_time || end_time) && (
                  <div>
                    <i className="bi bi-clock text-primary me-2"></i>
                    {formatDateTime(start_time)} → {formatDateTime(end_time)}
                    <br />
                    <small className="text-muted">Thời gian đặt lịch</small>
                  </div>
                )}
              </div>

              <hr className="mt-4 mb-3" />

              <div>
                <span className="fw-medium text-muted">Giá mong muốn</span>
                <span
                  className={`fw-bold fs-5 ms-2 ${
                    final_price != null && final_price !== "" && Number(final_price) !== 0
                      ? "text-secondary"  
                      : "text-success"     
                  }`}
                >
                  {expected_price != null && expected_price !== ""
                    ? `${(Number(expected_price) * 1000).toLocaleString("vi-VN")}đ`
                    : "Chưa có giá"}
                </span>
              </div>

              {final_price != null && final_price !== "" && Number(final_price) !== 0 && (
                <div className="mt-2">
                  <span className="fw-medium text-muted">Giá sau khi thương lượng</span>
                  <span className="fw-bold text-primary fs-5 ms-2">
                    {`${(Number(final_price) * 1000).toLocaleString("vi-VN")}đ`}
                  </span>
                </div>
              )}

            </Card.Body>
          </Card>
        </Col>

        {/* CỘT PHẢI - Chi tiết công việc */}
        <Col md={7}>
          <Card
            className="shadow-sm border-0 h-100"
            style={{ borderRadius: "14px" }}
          >
            <Card.Body>
              {/* Tiêu đề & mô tả */}
              <h5 className="fw-bold mb-2">{service_name || "Chưa có tiêu đề"}</h5>
              <h6 className="text-primary fw-semibold mb-2">
                <i className="bi bi-file-text me-2"></i>Tóm tắt công việc
              </h6>
              <p className="text-muted">{variant_name || "Không có mô tả."}</p>

              {/* Ảnh đính kèm */}
              {photos.length > 0 && (
                <>
                  <h6 className="mt-4 mb-2">
                    <i className="bi bi-images me-2"></i>Ảnh đính kèm
                  </h6>
                  <div className="d-flex flex-wrap gap-3">
                    {photos.map((url, i) => (
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

              {/* Dịch vụ và giá */}
              {(Array.isArray(chosenVariants) && chosenVariants.length > 0)
                ? chosenVariants.map((variant, idx) => (
                    <div key={idx} className="mb-3">
                      <h5 className="fw-bold mb-2">
                        {service_name || "Dịch vụ"} – {variant.variant_name || ""}
                      </h5>
                      <div className="text-muted mb-1">
                        Theo {variant.unit || "giờ"}
                      </div>
                      <div className="fw-bold text-primary fs-6">
                        {variant.price_min && variant.price_max
                          ? `${(variant.price_min * 1000).toLocaleString("vi-VN")}đ – ${(variant.price_max * 1000).toLocaleString("vi-VN")}đ/${variant.unit || ""}`
                          : "—"}
                      </div>
                    </div>
                  ))
                : (
                  <div className="mb-3">
                    <h5 className="fw-bold mb-2">
                      {service_name || "Dịch vụ"} – {variant_name || ""}
                    </h5>
                    <div className="text-muted mb-1">
                      Theo {unit || "giờ"}
                    </div>
                    <div className="fw-bold text-primary fs-6">
                      {price_min && price_max
                        ? `${(price_min * 1000).toLocaleString("vi-VN")}đ – ${(price_max * 1000).toLocaleString("vi-VN")}đ/${unit || ""}`
                        : "—"}
                    </div>
                  </div>
                )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Các nút hành động */}
      <div className="d-flex justify-content-center gap-4 mt-5 flex-wrap">
        <Button
          variant="danger"
          size="lg"
          className="px-5 fw-semibold"
          style={{ borderRadius: "10px", minWidth: "160px" }}
        >
          ❌ Từ chối công việc
        </Button>

        <Button
          variant="success"
          size="lg"
          className="px-5 fw-semibold"
          style={{ borderRadius: "10px", minWidth: "160px" }}
        >
          ▶ Bắt đầu công việc
        </Button>
        
        <NegotiatePriceButton
          peerId={customer_id}
          bookingId={booking_id}
          label="Thương lượng giá"
          size="md"
          onClick={() => {
            window.location.href = `/chat?bookingId=${booking_id}&negotiation=1&peer=${customer_id}`;
          }}
        />
      </div>

      <div className="text-center mt-3">
        <Badge bg="secondary" className="px-3 py-2">
          {status}
        </Badge>
      </div>
    </Container>
  );
}
