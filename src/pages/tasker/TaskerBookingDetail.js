import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from "react-bootstrap";
import NegotiatePriceButton from "../../components/negotiation/NegotiatePriceButton";
import api from "../../services/api";
import { showToast } from "../../components/common/CustomToast";

export default function TaskerBookingDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); 

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [cancelType, setCancelType] = useState(null); // "normal" hoặc "late"

  // 🧾 Giải nén dữ liệu booking
  // Safely destructure with a fallback when booking is null (e.g., direct URL navigation)
  const safeBooking = booking || {};
  const {
    booking_id,
    task_description,
    task_checklist,
    expected_price,
    final_price,
    status = "Chờ xử lý",
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    location: bookingAddress,
    type,
    duration_hours,
    duration_days,
    start_time,
    end_time,
    service_name,
    variant_name,
    task_photos,
  } = safeBooking;

  const photos = task_photos ? JSON.parse(task_photos) : [];

  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    if (photos.length > 0) {
      setPreviewImages(photos);
    }
  }, [booking]);

  const [alreadyTaken, setAlreadyTaken] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/bookings/${id}`, {
          headers: { "Cache-Control": "no-cache" },
        });

        console.log("📦 API trả về:", res.data);

        // Chỉ setBooking 1 lần duy nhất
        if (res.data && res.data.booking) {
          setBooking(res.data.booking);
        } else {
          setError("Không tìm thấy thông tin booking");
        }

      } catch (err) {
        console.error("❌ Lỗi fetch booking:", err);
        setError("Không thể tải thông tin booking. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

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

  const handleStatusUpdate = async (newStatus) => {
    try {
      const token = api.getStoredToken();

      // For SOS jobs being accepted, check availability first
      if (newStatus === "Đã chấp nhận" && type === 'SOS') {
        try {
          console.log(`🔍 Checking SOS availability for booking ${booking_id}...`);
          const checkRes = await fetch(
            `http://localhost:3001/api/bookings/${booking_id}/sos-check`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          const checkData = await checkRes.json();

          console.log('SOS check result:', checkData);

          if (!checkData.available) {
            // SOS already taken by someone else
            setAlreadyTaken(true);
            showToast.error(checkData.message);
            return;
          }
        } catch (checkErr) {
          console.error('Lỗi kiểm tra SOS availability:', checkErr);
          showToast.error("Lỗi khi kiểm tra tính khả dụng của SOS");
          return;
        }
      }

      // If check passed or not SOS, proceed with accepting
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
        let message = "";

        switch (newStatus) {
          case "Đã chấp nhận":
            message = "Đã chấp nhận booking thành công!";
            break;
          case "Hủy":
            message = "Đã từ chối booking!";
            break;
          case "Đang tiến hành":
            message = "Đã bắt đầu công việc!";
            break;
          case "Hoàn thành":
            message = "Đã hoàn thành công việc!";
            break;
          default:
            message = `Cập nhật trạng thái: ${newStatus}`;
        }

        showToast.success(message);
        navigate("/tasker/bookings");
      } else {
        showToast.error("Có lỗi xảy ra khi cập nhật trạng thái");
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      showToast.error("Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  const now = new Date();
  const start = new Date(start_time);
  const diffHours = (start - now) / (1000 * 60 * 60);

  const handleCancelLate = async () => {
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
          body: JSON.stringify({ cancelledBy: "tasker_late" }),
        }
      );
      const data = await res.json();
      if (data.success) {
        showToast.warning("Hủy sát giờ thành công! Bạn bị -20 điểm uy tín.");
        navigate("/tasker/bookings");
      } else {
        showToast.error(data.message || "Không thể hủy booking");
      }
    } catch (err) {
      console.error("❌ Lỗi khi hủy sát giờ:", err);
      showToast.error("Đã xảy ra lỗi khi hủy sát giờ");
    }
  };

  const handleCancelTask = async () => {
    try {
      const token = api.getStoredToken();

      const res = await fetch(
        `http://localhost:3001/api/bookings/${booking.booking_id}/cancel`,
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
        showToast.success("Bạn đã hủy công việc thành công!");
        navigate("/tasker/bookings");
      } else {
        showToast.error(data.message || "Không thể hủy booking");
      }
    } catch (err) {
      console.error("❌ Lỗi khi hủy booking:", err);
      showToast.error("Đã xảy ra lỗi khi hủy booking");
    }
  };

  const handleCancelFreeConfirm = async () => {
    try {
      const token = api.getStoredToken();

      const res = await fetch(
        `http://localhost:3001/api/bookings/${booking.booking_id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cancelledBy: "free" }),
        }
      );

      const data = await res.json();

      if (data.success) {
        showToast.success("Bạn đã hủy công việc thành công (không trừ điểm).");
        navigate("/tasker/bookings");
      } else {
        showToast.error(data.message || "Không thể hủy booking");
      }
    } catch (err) {
      console.error("❌ Lỗi khi hủy free-confirm:", err);
      showToast.error("Đã xảy ra lỗi khi hủy công việc");
    }
  };

  return (
    <Container className="py-5">
      <style>{`
      .cancel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.45);
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
          animation: fadeIn 0.25s ease;
      }

      @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
      }
      `}</style>
      {/* Tiêu đề */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-2">Chi tiết công việc</h3>
          <p className="text-muted mb-0">
            Xem thông tin khách hàng và yêu cầu công việc
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
              <p className="text-muted">{task_checklist || "Không có mô tả."}</p>

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
        {/* Show alert if SOS is already taken */}
        {alreadyTaken && (
          <Alert variant="danger" className="w-100 text-center">
            <i className="bi bi-exclamation-circle me-2"></i>
            <strong>❌ Đơn SOS này đã được người khác nhận rồi!</strong>
          </Alert>
        )}

        <div className="d-flex justify-content-center gap-4 flex-wrap">
          {status === "Chờ xử lý" && !alreadyTaken && (
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
            <>
              {/* KHÁCH CHƯA THANH TOÁN */}
              <Button
                variant="danger"
                size="lg"
                className="px-5 fw-semibold"
                style={{ borderRadius: "10px", minWidth: "200px" }}
                onClick={() => {
                  setCancelType("free-confirm");
                  setShowCancelWarning(true);
                }}
              >
                ❌ Hủy công việc (Không trừ điểm)
              </Button>
            </>
          )}

          {status === "Đã thanh toán" && (
            <>
              {/* BẮT ĐẦU CÔNG VIỆC */}
              <Button
                variant="info"
                size="lg"
                className="px-5 fw-semibold"
                style={{ borderRadius: "10px", minWidth: "160px" }}
                onClick={() => handleStatusUpdate("Đang tiến hành")}
              >
                ▶ Bắt đầu công việc
              </Button>

              {/* >2h: hủy bình thường */}
              {diffHours > 2 ? (
                <Button
                  variant="danger"
                  size="lg"
                  className="px-5 fw-semibold"
                  style={{ borderRadius: "10px", minWidth: "160px", marginLeft: "20px" }}
                  onClick={() => {
                    setCancelType("normal");
                    setShowCancelWarning(true);
                  }}
                >
                  ❌ Hủy công việc (–10)
                </Button>
              ) : (
                <>
                  {/* <2h: hủy sát giờ */}
                  <Button
                    variant="danger"
                    size="lg"
                    className="px-5 fw-semibold"
                    style={{
                      borderRadius: "10px",
                      minWidth: "180px",
                      marginLeft: "20px",
                    }}
                    onClick={() => {
                      setCancelType("late");
                      setShowCancelWarning(true);
                    }}
                  >
                    ❌ Hủy (sát giờ –20)
                  </Button>

                  {/* Báo cáo khách no-show */}
                  <Button
                    variant="warning"
                    size="lg"
                    className="px-5 fw-semibold text-dark"
                    style={{ borderRadius: "10px", minWidth: "240px" }}
                    onClick={() => navigate(`/tasker/no-show-report/${booking_id}`)}
                  >
                    📣 Báo cáo khách vắng mặt
                  </Button>
                </>
              )}
            </>
          )}

          {status === "Đang tiến hành" && (
            <Button
              variant="primary"
              size="lg"
              className="px-5 fw-semibold"
              style={{ borderRadius: "10px", minWidth: "160px" }}
              onClick={() => handleStatusUpdate("Hoàn thành")}
            >
              ✅ Hoàn thành
            </Button>
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

          {type === 'SOS' && (
            <Button
              variant="primary"
              size="lg"
              className="px-5 fw-semibold"
              style={{ borderRadius: "10px", minWidth: "160px" }}
              onClick={() => {
                window.location.href = `/chat?peer=${customer_id}`;
              }}
            >
              💬 Chat với khách hàng
            </Button>
          )}
        </div>
      </div>

      {showCancelWarning && (
        <div className="cancel-overlay" onClick={() => setShowCancelWarning(false)}>
          <div className="cancel-box" onClick={(e) => e.stopPropagation()}>
            <h5 className="fw-bold text-danger">
              ⚠ CẢNH BÁO HỦY CÔNG VIỆC
            </h5>

            {cancelType === "normal" && (
              <p className="mt-3">
                Bạn đang chuẩn bị hủy công việc <strong>trước giờ làm hơn 2 tiếng</strong>.
                <br />
                <span className="text-danger fw-semibold">
                  → Hủy loại này sẽ bị trừ 10 điểm uy tín.
                </span>
                <br />
                Điểm uy tín thấp sẽ ảnh hưởng trực tiếp đến khả năng nhận việc
                và xếp hạng của bạn trên hệ thống.
              </p>
            )}

            {cancelType === "late" && (
              <p className="mt-3">
                Bạn đang hủy <strong>sát giờ (&lt; 2 tiếng trước giờ làm)</strong>.
                <br />
                <span className="text-danger fw-bold">
                  → Bạn sẽ bị trừ 20 điểm uy tín và không nhận được bất kỳ khoản thanh toán nào.
                </span>
                <br />
                Đây là vi phạm nghiêm trọng và ảnh hưởng rất lớn đến hồ sơ của bạn.
              </p>
            )}

            {cancelType === "free-confirm" && (
              <p className="mt-3">
                Khách hàng hiện <strong>chưa thanh toán</strong> cho công việc này.
                <br />
                Bạn có chắc chắn muốn hủy công việc không?
                <br />
                <span className="text-muted small">Hủy trường hợp này sẽ không bị trừ điểm uy tín.</span>
              </p>
            )}

            {cancelType === "late" || cancelType === "normal" && (
              <p className="mt-3 text-muted small">
                Việc hủy công việc sẽ khiến khách hàng gặp khó khăn,
                đồng thời làm giảm độ tin cậy của bạn trong hệ thống.
              </p>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowCancelWarning(false)}>
                Đóng
              </Button>

              {cancelType === "normal" && (
                <Button variant="danger" onClick={handleCancelTask}>
                  Xác nhận hủy (–10)
                </Button>
              )}

              {cancelType === "late" && (
                <Button variant="danger" onClick={handleCancelLate}>
                  Xác nhận hủy sát giờ (–20)
                </Button>
              )}

              {cancelType === "free-confirm" && (
                <Button variant="danger" onClick={handleCancelFreeConfirm}>
                  Xác nhận hủy
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
