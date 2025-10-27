import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import api from '../services/api';

export default function TaskerBookingDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state?.booking || {};

  console.log("🧾 booking nhận được:", booking);

  const {
    booking_id,
    task_description,
    task_checklist,
    expected_price,
    final_price,
    photos = [],
    status = "Chờ xử lý",
    customer_name,
    customer_email,
    customer_phone,
    location: bookingAddress,
    start_time,
    end_time,
    service_name,
    variant_name,
    booking_time
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

  const formatPrice = (price) => {
    if (!price) return "Chưa có giá";
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const token = api.getStoredToken();
      const response = await fetch(`http://localhost:3001/api/bookings/${booking_id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Đã ${newStatus === 'Đã chấp nhận' ? 'chấp nhận' : 'từ chối'} booking thành công!`);
        navigate('/tasker/bookings');
      } else {
        alert('Có lỗi xảy ra khi cập nhật trạng thái');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-2">Chi tiết công việc</h3>
          <p className="text-muted mb-0">
            Xem thông tin khách hàng và yêu cầu công việc
          </p>
        </div>
        <div className="text-end">
          <Badge 
            bg={
              status === 'Chờ xử lý' ? 'warning' :
              status === 'Đã chấp nhận' ? 'info' :
              status === 'Đang tiến hành' ? 'primary' :
              status === 'Hoàn thành' ? 'success' :
              status === 'Hủy' ? 'danger' : 'secondary'
            } 
            className="px-3 py-2 fs-6"
          >
            {status === 'Chờ xử lý' ? '⏳' :
             status === 'Đã chấp nhận' ? '✅' :
             status === 'Đang tiến hành' ? '🔄' :
             status === 'Hoàn thành' ? '🎉' :
             status === 'Hủy' ? '❌' : '❓'} {status}
          </Badge>
        </div>
      </div>

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
                <span className="fw-bold text-success fs-5">
                  {formatPrice(expected_price || final_price)}
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
              <h5 className="fw-bold mb-2">{task_description || "Chưa có tiêu đề"}</h5>
              <h6 className="text-primary fw-semibold mb-2">
                <i className="bi bi-file-text me-2"></i>Tóm tắt công việc
              </h6>
              <p className="text-muted">{task_checklist || "Không có mô tả."}</p>

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
              {(service_name || variant_name) && (
                <>
                  <h5 className="fw-bold mb-2">
                    {service_name || "Dịch vụ"} – {variant_name || ""}
                  </h5>
                  <div className="text-muted mb-1">
                    Dịch vụ đã chọn
                  </div>
                  <div className="fw-bold text-primary fs-6">
                    {formatPrice(expected_price || final_price)}
                  </div>
                  </>
                )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Các nút hành động */}
      <div className="d-flex justify-content-center gap-4 mt-5 flex-wrap">
        {status === 'Chờ xử lý' && (
          <>
            <Button
              variant="danger"
              size="lg"
              className="px-5 fw-semibold"
              style={{ borderRadius: "10px", minWidth: "160px" }}
              onClick={() => handleStatusUpdate('Hủy')}
            >
              ❌ Từ chối công việc
            </Button>

            <Button
              variant="success"
              size="lg"
              className="px-5 fw-semibold"
              style={{ borderRadius: "10px", minWidth: "160px" }}
              onClick={() => handleStatusUpdate('Đã chấp nhận')}
            >
              ✅ Chấp nhận công việc
            </Button>
          </>
        )}

        {status === 'Đã chấp nhận' && (
          <Button
            variant="info"
            size="lg"
            className="px-5 fw-semibold"
            style={{ borderRadius: "10px", minWidth: "160px" }}
            onClick={() => handleStatusUpdate('Đang tiến hành')}
          >
            ▶ Bắt đầu công việc
          </Button>
        )}

        {status === 'Đang tiến hành' && (
          <Button
            variant="primary"
            size="lg"
            className="px-5 fw-semibold"
            style={{ borderRadius: "10px", minWidth: "160px" }}
            onClick={() => handleStatusUpdate('Hoàn thành')}
          >
            ✅ Hoàn thành
          </Button>
        )}

        {status !== 'Hủy' && status !== 'Hoàn thành' && (
          <Button
            variant="outline-primary"
            size="lg"
            className="px-5 fw-semibold"
            style={{ borderRadius: "10px", minWidth: "180px" }}
            onClick={() => navigate("/chat")}
          >
            💬 Chat thương lượng
          </Button>
        )}
      </div>
    </Container>
  );
}
