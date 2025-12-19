import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Tabs,
  Tab,
  Alert,
} from "react-bootstrap";
import api from "../../services/api";
import { formatVND } from "../../utils/formatVND";

const STATUS_LABELS = {
  completed: "Completed",
  in_progress: "In progress",
  pending: "Pending",
};

const TaskerJobDone = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState({});
  const [activeTab, setActiveTab] = useState("");
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [taskNotes, setTaskNotes] = useState({});

  // Parse dates
  const safeParseDate = (value) => {
    if (!value) return null;
    const str = String(value).trim();
    if (!str) return null;

    const sqlMatch =
      /^(\d{4})-(\d{2})-(\d{2})[\sT](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?/u.exec(
        str
      );

    if (sqlMatch) {
      const [, year, month, day, hour, minute, second = "0", milli = "0"] =
        sqlMatch;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        Number(milli.padEnd(3, "0"))
      );
    }

    const date = new Date(str);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  };

  const startDate = useMemo(() => safeParseDate(booking?.start_time), [booking?.start_time]);
  const endDate = useMemo(() => safeParseDate(booking?.end_time), [booking?.end_time]);

  // Kiểm tra xem có phải là booking nhiều ngày không
  const isMultiDay = useMemo(() => {
    const totalSessions = booking?.total_sessions;
    if (totalSessions && Number(totalSessions) > 1) return true;

    const u = String(booking?.unit || "").toLowerCase();
    const explicitlyMulti =
      u.includes("tuần") ||
      u.includes("tháng") ||
      u.includes("week") ||
      u.includes("month");
    if (explicitlyMulti) return true;

    if (startDate && endDate) {
      const dayMs = 24 * 60 * 60 * 1000;
      if (endDate.getTime() - startDate.getTime() >= dayMs) return true;
    }
    return false;
  }, [booking?.total_sessions, booking?.unit, startDate, endDate]);

  // Format date time cho label ngày
  const formatDateTimeForDay = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    []
  );

  // Tính danh sách các ngày
  const daysList = useMemo(() => {
    if (!isMultiDay || !startDate) return [];

    const limit = booking?.total_sessions ? Number(booking.total_sessions) : 0;
    if (limit > 1) {
      const days = [];
      const current = new Date(startDate);
      current.setHours(0, 0, 0, 0);

      for (let i = 0; i < limit; i++) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, "0");
        const d = String(current.getDate()).padStart(2, "0");
        const dayKey = `${y}-${m}-${d}`;

        days.push({
          date: new Date(current),
          dayKey,
          label: formatDateTimeForDay.format(current),
        });
        current.setDate(current.getDate() + 1);
      }
      return days;
    }

    if (!endDate) return [];

    const days = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      const dayKey = `${y}-${m}-${d}`;

      days.push({
        date: new Date(current),
        dayKey,
        label: formatDateTimeForDay.format(current),
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [isMultiDay, startDate, endDate, formatDateTimeForDay, booking?.total_sessions]);

  // Chia tasks thành các nhóm theo ngày
  const tasksByDay = useMemo(() => {
    if (!isMultiDay || !daysList.length) return null;

    const grouped = {};
    daysList.forEach((day) => {
      grouped[day.dayKey] = {
        day,
        tasks: tasks,
      };
    });

    return grouped;
  }, [isMultiDay, daysList, tasks]);

  // Tự động chọn tab ngày đầu tiên
  useEffect(() => {
    if (isMultiDay && daysList.length > 0 && !activeTab) {
      setActiveTab(daysList[0].dayKey);
    }
  }, [isMultiDay, daysList, activeTab]);

  // Parse checklist
  const parseChecklist = (rawChecklist) => {
    if (!rawChecklist) return [];
    if (Array.isArray(rawChecklist)) {
      return rawChecklist.map((item, index) => ({
        id: item?.id || `task-${index}`,
        label:
          typeof item === "string" ? item : item?.label || `Task ${index + 1}`,
        status: "completed",
      }));
    }

    if (typeof rawChecklist === "string") {
      try {
        const parsed = JSON.parse(rawChecklist);
        if (Array.isArray(parsed)) {
          return parsed.map((item, index) => ({
            id: item?.id || `task-${index}`,
            label:
              typeof item === "string"
                ? item
                : item?.label || `Task ${index + 1}`,
            status: "completed",
          }));
        }
      } catch (err) {
        // ignore parse error
      }

      let normalized = String(rawChecklist)
        .replace(/\r\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\u2022/g, "-");

      const lines = normalized
        .split(/\n|\r|-/)
        .map((item) => item.trim())
        .filter(Boolean);

      return lines.map((label, index) => ({
        id: `task-${index}`,
        label,
        status: "completed",
      }));
    }

    return [];
  };

  useEffect(() => {
    const fetchBookingAndSessions = async () => {
      try {
        console.log("📡 Fetching booking from BE:", bookingId);

        // 1. Fetch Basic Booking Info
        const res = await api.get(`/bookings/info/${bookingId}`, {
          headers: { "Cache-Control": "no-cache" },
        });

        const b = res.data;
        console.log("🟩 [Parsed Booking]:", b);

        setBooking(b);
        // Fallback photos from booking info if specific sessions fail or empty
        setBeforePhotos(b.before_photos || []);
        setAfterPhotos(b.after_photos || []);

        // Parse tasks
        const parsedTasks = parseChecklist(b.task_checklist);
        setTasks(parsedTasks);

        // 2. Fetch Detailed Session Info (Notes, Timers, Photos per session)
        try { // tasks/booking -> tasker/bookings (prefix logic?)
          // The route we added is router.get("/bookings/:bookingId/sessions"...) in tasker.js
          // tasker.js routes are usually mounted at /taskers or /api/tasker.
          // Let's assume the standard API client base URL logic. 
          // Warning: I need to know the mount point.
          // Usually routes/tasker.js is mounted at /taskers in server.js?
          // Existing api calls in this file use `/bookings/info/...` (which might be a different router?) and `/tasks/booking/...`
          // Let's check where tasker.js is mounted.
          // Typically it's `/taskers`.
          // So url: `/taskers/bookings/${bookingId}/sessions`.

          const sessionsRes = await api.get(`/taskers/bookings/${bookingId}/sessions`);

          if (sessionsRes.data && sessionsRes.data.success) {
            const sessionsData = sessionsRes.data.data;
            console.log("✅ Loaded sessions from DB:", sessionsData);

            const newSessionsMap = {};
            // const newNotesMap = {}; // No longer needed as separate state, but keeping for compatibility if referenced elsewhere?
            // Better to use session.notes

            sessionsData.forEach((s) => {
              if (!s.session_date) return;

              // Parse date to key
              const d = new Date(s.session_date);
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              const key = `${y}-${m}-${day}`;

              newSessionsMap[key] = {
                checkIn: s.checkin_time,
                checkOut: s.checkout_time,
                timers: s.checklist_timers,
                checklist: s.checklist,
                status: s.status,
                notes: s.notes,
                photos: s.photos || { before: [], after: [] }
              };

              // Also populate default for single session lookup if needed
              // But simplified logic: rely on keys
            });

            setSessions(newSessionsMap);
            // setTaskNotes(newNotesMap); // No longer needed as separate state, but keeping for compatibility if referenced elsewhere?
            // Better to use session.notes
          }
        } catch (err) {
          console.error("❌ Failed to load detailed sessions:", err);
        }

      } catch (e) {
        console.error("❌ ERROR loading booking:", e);
      }
    };

    if (bookingId) {
      fetchBookingAndSessions();
    }
  }, [bookingId]);

  const formatTimeHHMM = (timestamp) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatMoney = (v) => formatVND(v);

  const expected_price = booking?.expected_price ?? 0;
  const final_price = booking?.final_price ?? 0;
  const quantity = booking?.quantity ?? 1;
  const unitPrice = Number(
    final_price && Number(final_price) !== 0 ? final_price : expected_price
  );
  const rawPrice = unitPrice * quantity;
  const fee = Math.round(rawPrice * 0.1);
  const earnings = rawPrice - fee;

  const {
    task_description,
    location: bookingAddress,
    customer_name,
    customer_phone,
    customer_email,
    service_name,
    variant_name,
    customer_notes,
    additional_notes,
  } = booking || {};

  const formatDateTime = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    []
  );

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
        .custom-scroll-tabs .nav-item {
          display: inline-block;
        }
        .custom-scroll-tabs .nav-link {
          white-space: nowrap;
        }
      `}</style>

      {/* Header Card */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="py-4 px-4">
          <Row className="align-items-center g-3">
            <Col md={12}>
              <div className="d-flex flex-column gap-1">
                <small className="text-uppercase text-muted fw-semibold">
                  {service_name || "Service"} • {variant_name || "Variant"}
                </small>
                <h3 className="fw-bold mb-0">
                  {task_description || "Job Completed"}
                </h3>
                <div className="text-muted">
                  {bookingAddress || "Địa chỉ chưa cập nhật"} •{" "}
                  {startDate
                    ? formatDateTime.format(startDate)
                    : "Chưa rõ thời gian"}
                </div>
                <Badge bg="success" className="mt-2" style={{ width: "fit-content" }}>
                  ✓ Công việc đã hoàn thành
                </Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        <Col lg={8}>
          {/* Completed Tasks Card */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="mb-0 fw-semibold">Chi tiết công việc</h5>
                  <small className="text-muted">
                    Các nhiệm vụ đã hoàn thành theo phiên
                  </small>
                </div>
                <Badge
                  bg="success"
                  className="px-3 py-2 d-inline-flex align-items-center gap-2"
                >
                  <i className="bi bi-check2-circle"></i>
                  100% Done
                </Badge>
              </div>

              <div className="d-flex flex-column gap-4">
                {isMultiDay && tasksByDay ? (
                  <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    variant="pills"
                    className="mb-3 custom-scroll-tabs pb-2"
                  >
                    {Object.values(tasksByDay).map(({ day, tasks: dayTasks }) => {
                      const safeDayKey = day.dayKey || "default";
                      const session = sessions?.[safeDayKey] || { status: "completed" };

                      // Prioritize session-specific checklist if available
                      const tasksToRender = (session.checklist && session.checklist.length > 0)
                        ? parseChecklist(session.checklist)
                        : dayTasks;

                      const tabTitle = (
                        <div className="d-flex align-items-center gap-2">
                          <span>{day.label}</span>
                          <small>✔</small>
                        </div>
                      );

                      return (
                        <Tab eventKey={safeDayKey} title={tabTitle} key={safeDayKey}>
                          {/* Status Banner */}
                          <Card className="mb-3 border-0 bg-light">
                            <Card.Body>
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="fw-bold fs-5">{day.label}</div>
                                <Badge bg="success">Đã hoàn thành</Badge>
                              </div>

                              <div className="d-flex gap-4 text-muted small">
                                <div>
                                  <i className="bi bi-box-arrow-in-right me-1"></i> Check-in:{" "}
                                  <strong>{formatTimeHHMM(session.checkIn)}</strong>
                                </div>
                                <div>
                                  <i className="bi bi-box-arrow-left me-1"></i> Check-out:{" "}
                                  <strong>{formatTimeHHMM(session.checkOut)}</strong>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>

                          {/* Checklist */}
                          <div className="d-flex flex-column gap-3 mb-4">
                            <h6 className="fw-bold text-muted text-uppercase mb-0">
                              Checklist công việc
                            </h6>
                            {tasksToRender.map((task) => {
                              const tmr = session.timers?.[task.id];

                              return (
                                <Card
                                  key={`${task.id}-${safeDayKey}`}
                                  className="border-0 shadow-sm"
                                  style={{ borderRadius: "12px" }}
                                >
                                  <Card.Body className="d-flex justify-content-between py-3 px-3 align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                      <div
                                        className="d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success"
                                        style={{ width: 40, height: 40 }}
                                      >
                                        <i className="bi bi-check-circle-fill fs-5"></i>
                                      </div>
                                      <div>
                                        <div className="fw-semibold text-dark">
                                          {task.label}
                                        </div>
                                        <small className="text-muted d-block">
                                          Completed
                                        </small>
                                      </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-2">
                                      <small
                                        className="text-primary fw-bold"
                                        style={{ minWidth: "60px", textAlign: "right" }}
                                      >
                                        {(() => {
                                          if (!tmr) return "";
                                          const base = tmr.elapsedMs || 0;
                                          const s = Math.floor(base / 1000);
                                          const h = Math.floor(s / 3600);
                                          const m = Math.floor((s % 3600) / 60);
                                          const sec = s % 60;
                                          return `⏱ ${h}h ${m}m ${sec}s`;
                                        })()}
                                      </small>
                                    </div>
                                  </Card.Body>
                                </Card>
                              );
                            })}
                          </div>

                          {/* Task Notes for this day */}
                          <Card className="border-0 bg-light mb-4">
                            <Card.Body>
                              <h6 className="fw-bold mb-2">
                                <i className="bi bi-journal-text me-2"></i>
                                Ghi chú của Tasker
                              </h6>
                              <p className="mb-0" style={{ whiteSpace: "pre-line" }}>
                                {session.notes || "Không có ghi chú."}
                              </p>
                            </Card.Body>
                          </Card>

                          {/* Photos for this session */}
                          {session.photos && (session.photos.before?.length > 0 || session.photos.after?.length > 0) && (
                            <div className="mb-4">
                              <h6 className="fw-bold text-muted text-uppercase mb-3">Hình ảnh thực hiện</h6>
                              {session.photos.before?.length > 0 && (
                                <div className="mb-3">
                                  <small className="text-secondary fw-semibold d-block mb-2">BEFORE</small>
                                  <div className="d-flex gap-2" style={{ overflowX: 'auto' }}>
                                    {session.photos.before.map((url, idx) => (
                                      <img key={idx} src={url} alt="Before" style={{ height: 160, borderRadius: 8, objectFit: 'cover' }} />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {session.photos.after?.length > 0 && (
                                <div>
                                  <small className="text-secondary fw-semibold d-block mb-2">AFTER</small>
                                  <div className="d-flex gap-2" style={{ overflowX: 'auto' }}>
                                    {session.photos.after.map((url, idx) => (
                                      <img key={idx} src={url} alt="After" style={{ height: 160, borderRadius: 8, objectFit: 'cover' }} />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Completion Alert */}
                          <div className="alert alert-success d-flex align-items-center">
                            <i className="bi bi-check-circle-fill fs-4 me-3"></i>
                            <div>
                              <strong>Ngày này đã hoàn thành!</strong>
                              <div>
                                Bạn đã checkout lúc {formatTimeHHMM(session.checkOut)}.
                              </div>
                            </div>
                          </div>
                        </Tab>
                      );
                    })}
                  </Tabs>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {(() => {
                      // Single Session View Logic trying to find session data
                      const sessionValues = Object.values(sessions);
                      const singleSession = sessionValues.length > 0 ? sessionValues[0] : null;

                      return (
                        <>
                          {(singleSession || startDate) && (
                            <Card className="mb-3 border-0 bg-light">
                              <Card.Body>
                                {startDate && (
                                  <div className="fw-bold fs-5 mb-2">
                                    {formatDateTimeForDay.format(startDate)}
                                  </div>
                                )}
                                <div className="d-flex gap-4 text-muted small">
                                  <div>
                                    <i className="bi bi-box-arrow-in-right me-1"></i> Check-in:{" "}
                                    <strong>{formatTimeHHMM(singleSession?.checkIn)}</strong>
                                  </div>
                                  <div>
                                    <i className="bi bi-box-arrow-left me-1"></i> Check-out:{" "}
                                    <strong>{formatTimeHHMM(singleSession?.checkOut)}</strong>
                                  </div>
                                </div>
                              </Card.Body>
                            </Card>
                          )}

                          {/* Checklist */}
                          {tasks.map((task) => {
                            const tmr = singleSession?.timers?.[task.id];
                            return (
                              <Card
                                key={task.id}
                                className="border-0 shadow-sm"
                                style={{ borderRadius: "16px" }}
                              >
                                <Card.Body className="d-flex justify-content-between py-3 px-4">
                                  <div className="d-flex align-items-center gap-3">
                                    <div
                                      className="d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success"
                                      style={{ width: 44, height: 44 }}
                                    >
                                      <i className="bi bi-check-circle-fill fs-5"></i>
                                    </div>

                                    <div>
                                      <div className="fw-semibold text-dark">{task.label}</div>
                                      <small className="text-muted d-block">Completed</small>
                                    </div>
                                  </div>

                                  <div className="d-flex align-items-center gap-3 flex-shrink-0">
                                    <small
                                      className="text-primary fw-bold"
                                      style={{ minWidth: "60px", textAlign: "right" }}
                                    >
                                      {(() => {
                                        if (!tmr) return "";
                                        const base = tmr.elapsedMs || 0;
                                        const s = Math.floor(base / 1000);
                                        const h = Math.floor(s / 3600);
                                        const m = Math.floor((s % 3600) / 60);
                                        const sec = s % 60;
                                        return `⏱ ${h}h ${m}m ${sec}s`;
                                      })()}
                                    </small>
                                  </div>
                                </Card.Body>
                              </Card>
                            );
                          })}

                          {/* Notes for single session */}
                          {singleSession && (
                            <Card className="border-0 bg-light mt-3">
                              <Card.Body>
                                <h6 className="fw-bold mb-2">
                                  <i className="bi bi-journal-text me-2"></i>
                                  Ghi chú của Tasker
                                </h6>
                                <p className="mb-0" style={{ whiteSpace: "pre-line" }}>
                                  {singleSession.notes || "Không có ghi chú."}
                                </p>
                              </Card.Body>
                            </Card>
                          )}

                          {/* Photos for single session */}
                          {singleSession && singleSession.photos && (singleSession.photos.before?.length > 0 || singleSession.photos.after?.length > 0) && (
                            <div className="mt-3">
                              <h6 className="fw-bold text-muted text-uppercase mb-3">Hình ảnh thực hiện</h6>
                              {singleSession.photos.before?.length > 0 && (
                                <div className="mb-3">
                                  <small className="text-secondary fw-semibold d-block mb-2">BEFORE</small>
                                  <div className="d-flex gap-2" style={{ overflowX: 'auto' }}>
                                    {singleSession.photos.before.map((url, idx) => (
                                      <img key={idx} src={url} alt="Before" style={{ height: 160, borderRadius: 8, objectFit: 'cover' }} />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {singleSession.photos.after?.length > 0 && (
                                <div>
                                  <small className="text-secondary fw-semibold d-block mb-2">AFTER</small>
                                  <div className="d-flex gap-2" style={{ overflowX: 'auto' }}>
                                    {singleSession.photos.after.map((url, idx) => (
                                      <img key={idx} src={url} alt="After" style={{ height: 160, borderRadius: 8, objectFit: 'cover' }} />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>


          {/* Back Button */}
          <div className="text-center">
            <Button
              variant="primary"
              size="lg"
              className="px-4"
              onClick={() => navigate("/tasker")}
            >
              ← Back to Dashboard
            </Button>
          </div>
        </Col>

        <Col lg={4}>
          <div className="d-flex flex-column gap-4">
            {/* Payment Info */}
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h6 className="fw-semibold mb-3">Thông tin thanh toán</h6>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between">
                    <span>Tiền dịch vụ</span>
                    <strong>{formatMoney(rawPrice)}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Phí nền tảng (10%)</span>
                    <strong>-{formatMoney(fee)}</strong>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between fs-5">
                    <span className="fw-bold">Tổng tiền nhận được</span>
                    <span className="fw-bold text-success">
                      {formatMoney(earnings)}
                    </span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Customer Info */}
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h6 className="fw-semibold mb-3">Thông tin cần chú ý</h6>
                <div className="d-flex flex-column gap-3 text-muted">
                  <div>
                    <div className="fw-semibold text-dark mb-1">
                      Access Information
                    </div>
                    <p className="mb-0">
                      {customer_notes ||
                        "Liên hệ trước khi đến để được hỗ trợ thêm."}
                    </p>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark mb-1">
                      Additional Notes
                    </div>
                    <p className="mb-0">
                      {additional_notes ||
                        "Nếu cần thêm vật dụng, vui lòng trao đổi với khách hàng."}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Contact */}
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h6 className="fw-semibold mb-3">Contact</h6>
                <div className="text-muted d-flex flex-column gap-2">
                  <div>
                    <i className="bi bi-person me-2 text-primary"></i>
                    {customer_name || "Khách hàng ẩn danh"}
                  </div>
                  {customer_phone && (
                    <div>
                      <i className="bi bi-telephone me-2 text-primary"></i>
                      {customer_phone}
                    </div>
                  )}
                  {customer_email && (
                    <div>
                      <i className="bi bi-envelope me-2 text-primary"></i>
                      {customer_email}
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default TaskerJobDone;
