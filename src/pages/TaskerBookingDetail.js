import { useLocation } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";

export default function TaskerBookingDetail() {
  const location = useLocation();
  const booking = location.state || {};

  const {
    jobTitle,
    description,
    expectedPrice,
    photos = [],
    chosenVariants = [],
    selection = {},
    status = "Chờ xác nhận",
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

  return (
    <Container className="py-5">
      <h3 className="fw-bold mb-2">Chi tiết công việc</h3>
      <p className="text-muted mb-4">
        Xem thông tin khách hàng và yêu cầu công việc
      </p>

      <Row className="g-4 align-items-stretch">
        {/* CỘT TRÁI - Thông tin khách hàng */}
        <Col md={5}>
          <Card
            className="shadow-sm border-0 h-100"
            style={{ borderRadius: "14px" }}
          >
            <Card.Body>
              <h5 className="fw-bold mb-4">Thông tin khách hàng</h5>

              <div className="d-flex flex-column gap-3 text-secondary">
                <div>
                  <h6 className="fw-semibold mb-0 text-dark">Sarah Johnson</h6>
                  <small className="text-muted">
                    ⭐ 4.8 đánh giá • 12 công việc đã hoàn thành
                  </small>
                </div>

                <div>
                  <i className="bi bi-telephone text-primary me-2"></i>
                  +1 (555) 123-4567
                </div>

                <div>
                  <i className="bi bi-envelope text-primary me-2"></i>
                  sarah.johnson@email.com
                </div>

                <div>
                  <i className="bi bi-geo-alt text-primary me-2"></i>
                  1234 Oak Street, San Francisco, CA 94102
                </div>

                <div>
                  <i className="bi bi-clock text-primary me-2"></i>
                  {dateStr}, {timeStr}
                  <br />
                  <small className="text-muted">Thời gian đặt lịch</small>
                </div>
              </div>

              <hr className="mt-4 mb-3" />

              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-medium text-muted">Giá mong muốn</span>
                <span className="fw-bold text-success fs-5">
                  {expectedPrice
                    ? `${Number(expectedPrice * 1000).toLocaleString("vi-VN")}đ`
                    : "—"}
                </span>
              </div>
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
              <h5 className="fw-bold mb-2">{jobTitle || "Chưa có tiêu đề"}</h5>
              <h6 className="text-primary fw-semibold mb-2">
                <i className="bi bi-file-text me-2"></i>Tóm tắt công việc
              </h6>
              <p className="text-muted">{description || "Không có mô tả."}</p>

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
              {chosenVariants.length > 0 && (
                <>
                  <h5 className="fw-bold mb-2">
                    {chosenVariants[0].parent_service_name ||
                      "Dịch vụ"}{" "}
                    – {chosenVariants[0].variant_name || ""}
                  </h5>
                  <div className="text-muted mb-1">
                    Theo {chosenVariants[0].unit || "giờ"}
                  </div>
                  <div className="fw-bold text-primary fs-6">
                    {chosenVariants[0].price_min &&
                      chosenVariants[0].price_max &&
                      `${(
                        chosenVariants[0].price_min * 1000
                      ).toLocaleString("vi-VN")}đ – ${(
                        chosenVariants[0].price_max * 1000
                      ).toLocaleString("vi-VN")}đ/${
                        chosenVariants[0].unit || ""
                      }`}
                  </div>
                </>
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

        <Button
          variant="outline-primary"
          size="lg"
          className="px-5 fw-semibold"
          style={{ borderRadius: "10px", minWidth: "180px" }}
        >
          💬 Chat thương lượng
        </Button>
      </div>

      <div className="text-center mt-3">
        <Badge bg="secondary" className="px-3 py-2">
          {status}
        </Badge>
      </div>
    </Container>
  );
}
