import { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Container, Row, Col, Card, Button, Badge, Tabs, Tab, Spinner, Alert, Image } from "react-bootstrap"
import api from "../../services/api"
import { showToast } from "../../components/common/CustomToast"
import { formatVND } from "../../utils/formatVND"

export default function AdminReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(null)
  const [complaint, setComplaint] = useState(null)
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("")

  const mapComplaintType = (t) => {
    switch (t) {
      case "not_quality":
        return "Công việc không đạt yêu cầu"
      case "fake_time":
        return "Gian lận thời gian / Ghi sai giờ"
      default:
        return "Khác"
    }
  }

  const handleResolveComplaint = async (action) => {
    if (!complaint) return

    try {
      const url = `/bookings/${complaint.booking_id}/admin-resolve`
      const res = await api.patch(url, { decision: action })

      if (res.data?.success === true) {
        showToast.success(action === "approved" ? "Đã duyệt khiếu nại" : "Đã từ chối khiếu nại")
        fetchReview()
      } else {
        showToast.error(res.data?.message || "Xử lý thất bại")
      }
    } catch (err) {
      console.error("[Admin FE] Resolve complaint error:", err)
      showToast.error("Lỗi xử lý khiếu nại")
    }
  }

  const formatTime = (ms) => {
    if (!ms) return "0s"
    const sec = Math.floor(ms / 1000)
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
  }

  const formatTimeHHMM = (timestamp) => {
    if (!timestamp) return "—"
    const date = new Date(timestamp)
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  }

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

  // Helper to parse dates safely
  const safeParseDate = (value) => {
    if (!value) return null
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }

  const startDate = useMemo(() => safeParseDate(booking?.start_time), [booking?.start_time])
  const endDate = useMemo(() => safeParseDate(booking?.end_time), [booking?.end_time])

  const isMultiDay = useMemo(() => {
    if (!booking) return false
    return (booking.total_sessions && Number(booking.total_sessions) > 1) || tasks.length > 1
  }, [booking, tasks])

  const daysList = useMemo(() => {
    if (!tasks || tasks.length === 0) return []
    return tasks.map((t, idx) => {
      const date = t.session_date ? new Date(t.session_date) : null
      const dayKey = t.session_date ? new Date(t.session_date).toISOString().split("T")[0] : `session-${idx}`
      return {
        dayKey,
        label: date
          ? date.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })
          : `Session ${t.session_number || idx + 1}`,
        session: t,
      }
    })
  }, [tasks])

  useEffect(() => {
    fetchReview()
  }, [id])

  useEffect(() => {
    if (daysList.length > 0 && !activeTab) {
      setActiveTab(daysList[0].dayKey)
    }
  }, [daysList, activeTab])

  async function fetchReview() {
    setLoading(true)
    try {
      const res = await api.get(`/bookings/${id}/admin-review`)
      if (res.data?.success) {
        setBooking(res.data.booking)
        setComplaint(res.data.complaint)
        setTasks(res.data.tasks || [])
      } else {
        setError(res.data?.message || "Không thể tải dữ liệu review")
      }
    } catch (err) {
      console.error("[Admin FE] ERROR:", err)
      setError("Lỗi khi tải thông tin review.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Đang tải dữ liệu review...</p>
      </Container>
    )
  }

  if (error || !booking) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">{error || "Không tìm thấy thông tin booking"}</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <style>{`
        .custom-scroll-tabs {
          flex-wrap: nowrap;
          overflow-x: auto;
          overflow-y: hidden;
          white-space: nowrap;
          scrollbar-width: thin;
        }
        .custom-scroll-tabs .nav-link {
          white-space: nowrap;
        }
        .session-card {
          border-radius: 16px;
          border: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
      `}</style>

      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Admin Review - Đơn hàng #{id}</h2>
        <p className="text-muted">
          {booking.service_name} • {booking.variant_name} • {booking.location}
        </p>
      </div>

      <Row className="g-4">
        <Col lg={8}>
          {/* Complaint Section if exists */}
          {complaint && (
            <Card className="border-0 shadow-sm mb-4 overflow-hidden border-start border-danger border-4">
              <Card.Header className="bg-danger bg-opacity-10 py-3 border-0">
                <div className="d-flex align-items-center gap-2 text-danger">
                  <i className="bi bi-exclamation-octagon-fill fs-5"></i>
                  <h5 className="mb-0 fw-bold">KHÁCH HÀNG KHIẾU NẠI</h5>
                  <Badge bg={complaint.status === "pending" ? "warning" : complaint.status === "approved" ? "success" : "secondary"} className="ms-auto text-uppercase">
                    {complaint.status}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-3">
                  <label className="text-muted small fw-bold text-uppercase mb-1">Loại khiếu nại</label>
                  <p className="fw-semibold text-dark">{mapComplaintType(complaint.type)}</p>
                </div>
                <div className="mb-3">
                  <label className="text-muted small fw-bold text-uppercase mb-1">Mô tả của khách</label>
                  <p className="mb-0 bg-light p-3 rounded" style={{ whiteSpace: "pre-wrap" }}>
                    {complaint.description}
                  </p>
                </div>
                {complaint.image_urls?.length > 0 && (
                  <div>
                    <label className="text-muted small fw-bold text-uppercase mb-2">Ảnh minh chứng từ khách</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {complaint.image_urls.map((url, idx) => (
                        <Image key={idx} src={url} style={{ height: 120, width: 120, objectFit: "cover", borderRadius: 8 }} />
                      ))}
                    </div>
                  </div>
                )}

                {complaint.status === "pending" && (
                  <div className="mt-4 pt-3 border-top d-flex gap-2">
                    <Button variant="success" className="px-4" onClick={() => handleResolveComplaint("approved")}>
                      Duyệt khiếu nại (Hoàn tiền cho khách)
                    </Button>
                    <Button variant="outline-danger" className="px-4" onClick={() => handleResolveComplaint("rejected")}>
                      Từ chối khiếu nại (Trả tiền cho Tasker)
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Session Tabs */}
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4">Kết quả công việc theo từng phiên</h5>
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 custom-scroll-tabs" variant="pills">
                {daysList.map((day) => (
                  <Tab eventKey={day.dayKey} title={day.label} key={day.dayKey}>
                    <div className="mt-2">
                      {/* Session Info card */}
                      <Card className="bg-light border-0 mb-4 rounded-3">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold fs-5 mb-1">{day.label}</div>
                            <div className="d-flex gap-4 text-muted small">
                              <span>
                                <i className="bi bi-box-arrow-in-right me-1"></i> Check-in: <strong>{formatTimeHHMM(day.session.checkin_time)}</strong>
                              </span>
                              <span>
                                <i className="bi bi-box-arrow-left me-1"></i> Check-out: <strong>{formatTimeHHMM(day.session.checkout_time)}</strong>
                              </span>
                            </div>
                          </div>
                          <Badge bg="success" className="px-3 py-2">
                            {day.session.status || "Đã xong"}
                          </Badge>
                        </Card.Body>
                      </Card>

                      {/* Checklist */}
                      <div className="mb-4">
                        <h6 className="fw-bold text-muted text-uppercase mb-3">Checklist & Thời gian</h6>
                        <div className="d-flex flex-column gap-2">
                          {day.session.checklist?.map((item, idx) => {
                            const label = typeof item === "string" ? item : item.label
                            const id = typeof item === "string" ? `task-${idx}` : item.id
                            const elapsed = day.session.timers?.[id]?.elapsedMs || 0

                            return (
                              <div key={idx} className="p-3 border rounded bg-white shadow-sm d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                  <i className="bi bi-check-circle-fill text-success"></i>
                                  <span className="fw-medium">{label}</span>
                                </div>
                                <Badge bg="light" className="text-primary border border-primary border-opacity-25 px-3 py-2">
                                  ⏱ {formatTime(elapsed)}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Session Notes */}
                      <div className="mb-4">
                        <h6 className="fw-bold text-muted text-uppercase mb-2">Ghi chú của Tasker</h6>
                        <div className="bg-light p-3 rounded" style={{ whiteSpace: "pre-line" }}>
                          {day.session.notes || "Không có ghi chú"}
                        </div>
                      </div>

                      {/* Photos */}
                      {day.session.photos && (day.session.photos.before?.length > 0 || day.session.photos.after?.length > 0) && (
                        <div>
                          <h6 className="fw-bold text-muted text-uppercase mb-3">Hình ảnh thực hiện</h6>
                          {day.session.photos.before?.length > 0 && (
                            <div className="mb-3">
                              <small className="text-muted fw-bold d-block mb-2">BEFORE</small>
                              <div className="d-flex gap-2" style={{ overflowX: "auto", paddingBottom: "10px" }}>
                                {day.session.photos.before.map((url, i) => (
                                  <Image key={i} src={url} style={{ height: 160, width: 220, objectFit: "cover", borderRadius: 8 }} />
                                ))}
                              </div>
                            </div>
                          )}
                          {day.session.photos.after?.length > 0 && (
                            <div>
                              <small className="text-muted fw-bold d-block mb-2">AFTER</small>
                              <div className="d-flex gap-2" style={{ overflowX: "auto", paddingBottom: "10px" }}>
                                {day.session.photos.after.map((url, i) => (
                                  <Image key={i} src={url} style={{ height: 160, width: 220, objectFit: "cover", borderRadius: 8 }} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Tab>
                ))}
              </Tabs>
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          <div className="sticky-top" style={{ top: "2rem" }}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3">Tóm tắt đơn hàng</h5>
                <hr />

                <div className="mb-3">
                  <label className="text-muted small mb-1">Trạng thái booking</label>
                  <div>
                    <Badge bg="info" className="px-3 py-2 text-uppercase">
                      {booking.status}
                    </Badge>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-muted small fw-bold text-uppercase mb-1">Vị trí công việc</label>
                  <p className="mb-0 small fw-medium">{booking.location}</p>
                </div>

                <div className="mb-3">
                  <label className="text-muted small fw-bold text-uppercase mb-1">Thời gian dự kiến</label>
                  <p className="mb-0 small fw-medium">
                    {booking.start_time ? (
                      <>
                        <i className="bi bi-clock me-1"></i>
                        {new Date(booking.start_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        <br />
                        <span className="text-muted">
                          <i className="bi bi-calendar-event me-1"></i>
                          {isMultiDay ? (
                            <>
                              {new Date(booking.start_time).toLocaleDateString("vi-VN")} - {new Date(booking.end_time).toLocaleDateString("vi-VN")}
                              <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.7rem' }}>
                                {booking.total_sessions} ngày
                              </Badge>
                            </>
                          ) : (
                            new Date(booking.start_time).toLocaleDateString("vi-VN")
                          )}
                        </span>
                      </>
                    ) : "—"}
                  </p>
                </div>

                {booking.total_sessions > 1 && (
                  <div className="mb-3">
                    <label className="text-muted small fw-bold text-uppercase mb-1">Tổng số phiên</label>
                    <p className="mb-0 small fw-medium">{booking.total_sessions} phiên</p>
                  </div>
                )}

                {booking.description && (
                  <div className="mb-3">
                    <label className="text-muted small fw-bold text-uppercase mb-1">Mô tả công việc</label>
                    <p className="mb-0 small text-muted" style={{ fontSize: '0.85rem' }}>{booking.description}</p>
                  </div>
                )}

                <hr />
                <h6 className="fw-bold mb-3">Chi tiết thanh toán</h6>
                <div className="bg-light p-3 rounded-3 shadow-sm border">
                  {/* Logic tính toán tương tự PaymentPage */}
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
                          <span className="fw-bold text-uppercase small">Giá cuối cùng:</span>
                          <span className="fs-4 fw-bold text-danger">
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

                <hr />
                <div className="mb-0">
                  <label className="text-muted small mb-1">Thời gian đặt đơn</label>
                  <p className="mb-0 small text-muted">
                    {booking.booking_time ? new Date(booking.booking_time).toLocaleString("vi-VN") : "—"}
                  </p>
                </div>
              </Card.Body>
            </Card>

            <Button variant="outline-secondary" className="w-100 py-3 rounded-3 fw-bold shadow-sm" onClick={() => navigate(-1)}>
              ← Quay lại danh sách
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  )
}
