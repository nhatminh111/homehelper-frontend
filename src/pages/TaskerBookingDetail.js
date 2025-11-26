import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from "react-bootstrap";
import NegotiatePriceButton from "../components/negotiation/NegotiatePriceButton";
import api from "../services/api";

const parseChecklist = (rawChecklist) => {
  if (!rawChecklist) return [];

  if (Array.isArray(rawChecklist)) {
    return rawChecklist;
  }

  if (typeof rawChecklist === "string") {
    try {
      const parsed = JSON.parse(rawChecklist);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
    } catch (err) {
      // ignore JSON parse error
    }

    let normalized = String(rawChecklist);
    normalized = normalized.replace(/\r\n/g, "\n").replace(/\\n/g, "\n");
    normalized = normalized.replace(/^\s+/, "");

    const hyphenMatches = normalized.match(/-\s*[^-\n]+/g);
    if (hyphenMatches && hyphenMatches.length) {
      return hyphenMatches.map((item) => item.replace(/^-\s*/, "").trim()).filter(Boolean);
    }

    const bulletRegex = /(?:^|\n)\s*[-•]\s*(.+?)(?=(?:\n\s*[-•])|\n*$)/g;
    const bullets = [];
    let match;
    while ((match = bulletRegex.exec(normalized)) !== null) {
      const value = match[1].trim();
      if (value) bullets.push(value);
    }
    if (bullets.length) return bullets;

    const lines = normalized
      .split("\n")
      .map((line) => line.replace(/^\s*[-•]\s*/, "").trim())
      .filter(Boolean);
    if (lines.length) return lines;
  }

  return [];
};

export default function TaskerBookingDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // ví dụ: /tasker/bookings/:id

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCancelTask = async () => {
    try {
      const token = api.getStoredToken();

      const res = await fetch(
        `http://localhost:3001/api/bookings/${booking_id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancelledBy: "tasker",
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Bạn đã hủy công việc thành công!");
        navigate("/tasker/bookings");
      } else {
        alert(data.message || "Không thể hủy booking");
      }

    } catch (err) {
      console.error("❌ Lỗi khi hủy booking:", err);
      alert("Đã xảy ra lỗi khi hủy booking");
    }
  };

  useEffect(() => {
    if (!booking && id) {
      const fetchBooking = async () => {
        try {
          setLoading(true);
          setError(null);
          const res = await api.get(`/bookings/${id}`, {
            headers: { "Cache-Control": "no-cache" },
          });

          const payload = res?.data;
          const bookingData =
            (payload && (payload.booking || payload.data)) || payload;

          if (bookingData && bookingData.booking_id) {
            setBooking(bookingData);
          } else {
            throw new Error("Không tìm thấy thông tin booking");
          }
        } catch (err) {
          console.error("❌ Lỗi fetch booking:", err);
          setError("Không thể tải thông tin booking. Vui lòng thử lại sau.");
        } finally {
          setLoading(false);
        }
      };

      fetchBooking();
    }
  }, [id, booking]);

  // Đang tải
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Đang tải thông tin công việc...</p>
      </Container>
    );
  }

  // Lỗi khi tải
  if (error) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>
      </Container>
    );
  }

  //Không có dữ liệu
  if (!booking) {
    return (
      <Container className="py-5 text-center">
        <p className="text-muted">Không có dữ liệu booking để hiển thị.</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>
      </Container>
    );
  }

  // 🧾 Giải nén dữ liệu booking
  const {
    booking_id,
    task_description,
    task_checklist,
    expected_price,
    final_price,
    photos = [],
    status = "Chờ xử lý",
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    location: bookingAddress,
    start_time,
    end_time,
    service_name,
    variant_name,
  } = booking;

  const checklistItems = parseChecklist(task_checklist);

  const formatPrice = (price) => {
    if (!price) return "Chưa có giá";
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const endsWithZ = /z$/i.test(String(dateString)); // ISO UTC like 2025-09-20T12:07:00Z
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    // If the input is explicitly UTC (ends with 'Z'), format in UTC to avoid +7h shift
    if (endsWithZ) {
      return new Intl.DateTimeFormat('vi-VN', { ...options, timeZone: 'UTC' }).format(date);
    }
    // Otherwise, render with default locale settings
    return new Intl.DateTimeFormat('vi-VN', options).format(date);
  };

  const canStartJob = () => {
    if (!start_time) return true;
  
    let start = new Date(start_time);
  
    // Nếu chuỗi không có "Z" và không có timezone, xem như giờ local VN
    const hasTimezone = /[zZ]|[+\-]\d{2}:?\d{2}$/.test(start_time);
    if (!hasTimezone) {
      // Tạo date ở múi giờ VN (UTC+7)
      const [datePart, timePart] = start_time.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, second] = timePart.split(":").map(Number);
      start = new Date(year, month - 1, day, hour, minute, second);
    }
  
    return Date.now() >= start.getTime();
  };
  

  const handleStatusUpdate = async (newStatus) => {
    try {
      const token = api.getStoredToken();
      const response = await fetch(
        `http://localhost:3001/api/bookings/${booking_id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
              }
            : prev
        );

        if (newStatus === "Đang tiến hành") {
          navigate(`/tasker/bookings/${booking_id}/progress`, {
            replace: true,
            state: {
              booking: {
                ...booking,
                status: newStatus,
              },
            },
          });
          return;
        }

        if (newStatus === "Đã chấp nhận") {
          alert("Đã chấp nhận booking thành công! Bạn có thể bắt đầu công việc ngay.");
          return;
        }

        navigate("/tasker/bookings", { replace: true });
      } else {
        alert("Có lỗi xảy ra khi cập nhật trạng thái");
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      alert("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  return (
    <Container className="py-5">
      {/* Tiêu đề */}
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
                          : "secondary"
            }
            className="px-3 py-2 fs-6"
          >
            {status === "Chờ xử lý"
              ? "⏳"
              : status === "Đã chấp nhận"
                ? "✅"
                : status === "Đã thanh toán"
                  ? "💰"
                  : status === "Đang tiến hành"
                    ? "🔄"
                    : status === "Hoàn thành"
                      ? "🎉"
                      : status === "Hủy"
                        ? "❌"
                        : "❓"}{" "}
            {status}
          </Badge>
        </div>
      </div>

      {/* Nội dung chi tiết */}
      <Row className="g-4 align-items-stretch">
        {/* Thông tin khách hàng */}
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
              {checklistItems.length > 0 ? (
                <ul className="text-muted ps-4 mb-3">
                  {checklistItems.map((item, index) => (
                    <li key={index}>
                      {typeof item === "string" ? item : item?.label || `Công việc ${index + 1}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mb-3">Không có mô tả.</p>
              )}

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
      <div className="d-flex justify-content-center gap-4 mt-5 flex-wrap">
        {status === "Chờ xử lý" && (
          <>
            <Button
              variant="danger"
              size="lg"
              className="px-5 fw-semibold"
              style={{ borderRadius: "10px", minWidth: "160px" }}
              onClick={() => handleStatusUpdate("Hủy")}
            >
              ❌ Từ chối công việc
            </Button>

            <Button
              variant="success"
              size="lg"
              className="px-5 fw-semibold"
              style={{ borderRadius: "10px", minWidth: "160px" }}
              onClick={() => handleStatusUpdate("Đã chấp nhận")}
            >
              ✅ Chấp nhận công việc
            </Button>
          </>
        )}

        {status === "Đã chấp nhận" && (
          <div className="d-flex flex-column gap-2 align-items-center">
            <Button
              variant="info"
              size="lg"
              className="px-5 fw-semibold"
              style={{ borderRadius: "10px", minWidth: "160px" }}
              onClick={() => handleStatusUpdate("Đang tiến hành")}
            >
              ▶ Bắt đầu công việc
            </Button>
            {/* { 
              <small className="text-muted text-center">
                Bạn chỉ có thể bắt đầu sau {formatDate(start_time)}
              </small>
            } */}
          </div>
        )}

        {status === "Đang tiến hành" && (
          <>
            <Button
              variant="outline-primary"
              size="lg"
              className="px-4 fw-semibold"
              style={{ borderRadius: "10px", minWidth: "160px" }}
              onClick={() =>
                navigate(`/tasker/bookings/${booking_id}/progress`, {
                  state: { booking },
                })
              }
            >
              📋 Theo dõi công việc
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="px-5 fw-semibold"
              style={{ borderRadius: "10px", minWidth: "160px" }}
              onClick={() => handleStatusUpdate("Hoàn thành")}
            >
              ✅ Hoàn thành
            </Button>
          </>
        )}

        {status === "Chờ xử lý" && (
          <NegotiatePriceButton
            peerId={customer_id}
            bookingId={booking_id}
            label="Thương lượng giá"
            size="md"
            onClick={() => {
              window.location.href = `/chat?bookingId=${booking_id}&negotiation=1&peer=${customer_id}`;
            }}
          />
        )}
      </div>
    </Container>
  );
}
