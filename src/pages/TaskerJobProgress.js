import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
} from "react-bootstrap";
import ProgressBar from "react-bootstrap/ProgressBar";
import api from "../services/api";

const STATUS_COLORS = {
  completed: "success",
  in_progress: "primary",
  pending: "secondary",
};

const STATUS_LABELS = {
  completed: "Completed",
  in_progress: "In progress",
  pending: "Pending",
};

const STORAGE_KEY = "tasker_job_progress";
const isBrowser = typeof window !== "undefined";

const loadStoredTasks = (bookingId) => {
  if (!isBrowser || !bookingId) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    const saved = map?.[bookingId];
    if (!Array.isArray(saved)) return null;
    return saved;
  } catch (err) {
    console.warn("Không thể đọc tiến độ checklist đã lưu:", err);
    return null;
  }
};

const persistStoredTasks = (bookingId, tasks) => {
  if (!isBrowser || !bookingId) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[bookingId] = tasks;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn("Không thể lưu tiến độ checklist:", err);
  }
};

const clearStoredTasks = (bookingId) => {
  if (!isBrowser || !bookingId) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    if (map?.[bookingId]) {
      delete map[bookingId];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    }
  } catch (err) {
    console.warn("Không thể xóa tiến độ checklist:", err);
  }
};

const parseChecklist = (rawChecklist) => {
  if (!rawChecklist) return [];

  const tasks = [];

  const pushTask = (input, fallbackGroup = null) => {
    const label =
      typeof input === "string"
        ? input.trim()
        : input?.label
          ? String(input.label).trim()
          : "";
    if (!label) return;

    const taskGroup =
      typeof input === "object" && input?.group
        ? String(input.group).trim()
        : fallbackGroup
          ? String(fallbackGroup).trim()
          : null;

    tasks.push({
      label,
      group: taskGroup,
      status: typeof input === "object" && input?.status ? input.status : null,
    });
  };

  if (Array.isArray(rawChecklist)) {
    rawChecklist.forEach((entry) => {
      if (typeof entry === "string") {
        pushTask(entry);
      } else if (entry?.items && Array.isArray(entry.items)) {
        const groupName = entry.title || entry.group || entry.name || "";
        entry.items.forEach((item) => pushTask(item, groupName));
      } else {
        pushTask(entry);
      }
    });
    return tasks;
  }

  if (typeof rawChecklist === "string") {
    try {
      const parsedJson = JSON.parse(rawChecklist);
      if (Array.isArray(parsedJson)) {
        parsedJson.forEach((item) => pushTask(item));
        return tasks;
      }
      if (parsedJson && Array.isArray(parsedJson.items)) {
        const groupName = parsedJson.title || parsedJson.group || parsedJson.name || "";
        parsedJson.items.forEach((item) => pushTask(item, groupName));
        return tasks;
      }
    } catch (err) {
      // ignore parse error and try splitting heuristically
    }

    let normalized = String(rawChecklist);
    normalized = normalized.replace(/\r\n/g, "\n").replace(/\\n/g, "\n");
    normalized = normalized.replace(/\u2022/g, "-");
    if (!normalized.includes("\n") && normalized.includes("-")) {
      normalized = normalized.replace(/-\s*/g, "\n- ");
    }

    const lines = normalized
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length) {
      let currentGroup = null;
      const groupRegex = /^(?:ngày|day)\s*\d+/i;

      lines.forEach((line) => {
        const cleaned = line.replace(/^\s*[-•]\s*/, "").trim();
        if (!cleaned) return;

        if (groupRegex.test(cleaned)) {
          currentGroup = cleaned.replace(/[:\-]+$/, "").trim();
        } else {
          pushTask(cleaned, currentGroup);
        }
      });

      if (!tasks.length) {
        lines.forEach((line) => pushTask(line.replace(/^\s*[-•]\s*/, "")));
      }
    }
  }

  return tasks;
};

const normalizeTasks = (rawChecklist) => {
  const items = parseChecklist(rawChecklist);

  if (!items.length) {
    return [
      "Clean countertops and surfaces",
      "Deep-clean sink and faucet",
      "Clean stovetop and oven",
      "Clean refrigerator inside/out",
      "Organize cabinets and drawers",
      "Sweep and mop floors",
    ].map((label, index) => ({
      id: `default-${index}`,
      label,
      status: index < 2 ? "completed" : index === 2 ? "in_progress" : "pending",
      group: null,
    }));
  }

  return items.map((item, index) => ({
    id: `task-${index}`,
    label: item.label || `Task ${index + 1}`,
    status: item.status || (index === 0 ? "in_progress" : "pending"),
    group: item.group || null,
  }));
};

export default function TaskerJobProgress() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialBooking = location.state?.booking || null;
  const initialStoredTasks = initialBooking?.booking_id
    ? loadStoredTasks(initialBooking.booking_id)
    : null;

  const [booking, setBooking] = useState(initialBooking);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState(
    initialStoredTasks || normalizeTasks(initialBooking?.task_checklist)
  );
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef(null);
  const [hasLoadedStoredTasks, setHasLoadedStoredTasks] = useState(Boolean(initialStoredTasks));

  useEffect(() => {
    if (!booking && id) {
      const fetchBooking = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await api.get(`/bookings/${id}`, {
            headers: { "Cache-Control": "no-cache" },
          });

          const payload = response?.data;
          const bookingData = (payload && (payload.booking || payload.data)) || payload;

          if (bookingData && bookingData.booking_id) {
            setBooking(bookingData);
            const stored = loadStoredTasks(bookingData.booking_id);
            if (stored) {
              setTasks(stored);
              setHasLoadedStoredTasks(true);
            } else {
              setTasks(normalizeTasks(bookingData.task_checklist));
            }
          } else {
            throw new Error("Không tìm thấy thông tin công việc");
          }
        } catch (err) {
          console.error("❌ Lỗi tải thông tin công việc:", err);
          setError("Không thể tải thông tin công việc. Vui lòng thử lại sau.");
        } finally {
          setLoading(false);
        }
      };

      fetchBooking();
    }
  }, [booking, id]);

  useEffect(() => {
    if (location.state?.booking) {
      setBooking(location.state.booking);
      if (!hasLoadedStoredTasks) {
        const stored = loadStoredTasks(location.state.booking?.booking_id);
        if (stored) {
          setTasks(stored);
          setHasLoadedStoredTasks(true);
          return;
        }
      }
      setTasks(normalizeTasks(location.state.booking?.task_checklist));
    }
  }, [location.state?.booking, hasLoadedStoredTasks]);

  useEffect(() => {
    if (booking?.booking_id && !hasLoadedStoredTasks) {
      const stored = loadStoredTasks(booking.booking_id);
      if (stored) {
        setTasks(stored);
      }
      setHasLoadedStoredTasks(true);
    }
  }, [booking?.booking_id, hasLoadedStoredTasks]);

  useEffect(() => {
    if (booking?.booking_id) {
      persistStoredTasks(booking.booking_id, tasks);
    }
  }, [tasks, booking?.booking_id]);

  const safeParseDate = (value) => {
    if (!value) return null;
    const str = String(value).trim();
    if (!str) return null;

    const sqlMatch =
      /^(\d{4})-(\d{2})-(\d{2})[\sT](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?/u.exec(str);

    if (sqlMatch) {
      const [, year, month, day, hour, minute, second = "0", milli = "0"] = sqlMatch;
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

  const {
    task_description,
    location: bookingAddress,
    start_time: bookingStartTime,
    end_time: bookingEndTime,
    customer_name,
    customer_phone,
    customer_email,
    service_name,
    variant_name,
    customer_notes,
    special_instructions,
    additional_notes,
  } = booking || {};

  const startDate = useMemo(() => safeParseDate(bookingStartTime), [bookingStartTime]);
  const endDate = useMemo(() => safeParseDate(bookingEndTime), [bookingEndTime]);

  const computeElapsedMs = useCallback(() => {
    if (!startDate) return 0;
    const now = Date.now();
    const startMs = startDate.getTime();

    if (now < startMs) {
      return 0;
    }

    const cappedNow =
      endDate && now > endDate.getTime() ? endDate.getTime() : now;

    return Math.max(0, cappedNow - startMs);
  }, [startDate, endDate]);

  useEffect(() => {
    setElapsedMs(computeElapsedMs());
  }, [computeElapsedMs]);

  useEffect(() => {
    if (!startDate || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedMs(computeElapsedMs());
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [computeElapsedMs, isPaused, startDate]);

  const handleTaskStatus = (taskId) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;

        const nextStatus =
          task.status === "pending"
            ? "in_progress"
            : task.status === "in_progress"
              ? "completed"
              : "pending";

        return { ...task, status: nextStatus };
      }),
    );
  };

  const handleCompleteJob = async () => {
    if (!booking?.booking_id) return;

    if (!tasks.every((task) => task.status === "completed")) {
      alert("Vui lòng hoàn thành toàn bộ checklist trước khi kết thúc công việc.");
      return;
    }

    try {
      setLoading(true);
      const token = api.getStoredToken();
      const response = await fetch(
        `http://localhost:3001/api/bookings/${booking.booking_id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "Hoàn thành" }),
        },
      );
      const result = await response.json();

      if (result.success) {
        clearStoredTasks(booking.booking_id);
        const updatedBooking = {
          ...booking,
          status: "Hoàn thành",
        };
        alert("Công việc đã được đánh dấu hoàn thành!");
        navigate(`/tasker/bookings/${booking.booking_id}/complete`, {
          replace: true,
          state: {
            booking: updatedBooking,
            tasks,
          },
        });
      } else {
        alert("Không thể cập nhật trạng thái. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("❌ Lỗi cập nhật trạng thái:", err);
      alert("Có lỗi xảy ra khi cập nhật trạng thái.");
    } finally {
      setLoading(false);
    }
  };

  const handlePauseToggle = () => {
    setIsPaused((prev) => !prev);
  };

  const progress = useMemo(() => {
    if (!tasks.length) return 0;
    const completed = tasks.filter((task) => task.status === "completed").length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const summary = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const inProgress = tasks.filter((task) => task.status === "in_progress").length;
    return { total, completed, inProgress };
  }, [tasks]);

  const allTasksCompleted = useMemo(
    () => summary.completed === summary.total,
    [summary.completed, summary.total],
  );

  const groupedTasks = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      const key = task.group || "__default__";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(task);
    });
    return Array.from(map.entries()).map(([groupKey, items]) => ({
      group: groupKey === "__default__" ? null : groupKey,
      items,
    }));
  }, [tasks]);

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

  const formatTimeOnly = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    []
  );

  const formattedStart = useMemo(() => {
    if (!startDate) return "—";
    return formatDateTime.format(startDate);
  }, [formatDateTime, startDate]);

  const formattedEnd = useMemo(() => {
    if (!endDate) return "—";
    return formatDateTime.format(endDate);
  }, [formatDateTime, endDate]);

  const dueLabel = useMemo(() => {
    if (!endDate) return "No due time";
    const now = Date.now();
    if (now > endDate.getTime()) {
      return "Đã quá thời hạn";
    }
    return `Due ${formatTimeOnly.format(endDate)}`;
  }, [endDate, formatTimeOnly]);

  const startStatusLabel = useMemo(() => {
    if (!startDate) return null;
    const now = Date.now();
    if (now < startDate.getTime()) {
      const diff = startDate.getTime() - now;
      const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
      const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
      return `Bắt đầu sau ${hours}:${minutes}`;
    }
    return null;
  }, [startDate]);

  const formattedElapsed = useMemo(() => {
    if (elapsedMs <= 0) return "00:00:00";
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [elapsedMs]);

  if (loading && !booking) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
        <p className="text-muted mt-3">Đang tải thông tin công việc...</p>
      </Container>
    );
  }

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

  if (!booking) {
    return (
      <Container className="py-5 text-center">
        <p className="text-muted">Không tìm thấy dữ liệu công việc.</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="py-4 px-4">
          <Row className="align-items-center g-3">
            <Col md={6}>
              <div className="d-flex flex-column gap-1">
                <small className="text-uppercase text-muted fw-semibold">
                  {service_name || "Service"} • {variant_name || "Variant"}
                </small>
                <h3 className="fw-bold mb-0">
                  {task_description || "House Cleaning – 3 Bedrooms Apartment"}
                </h3>
                <div className="text-muted">
                  {bookingAddress || "Địa chỉ chưa cập nhật"} •{" "}
                  {startDate ? formatDateTime.format(startDate) : "Chưa rõ thời gian"}
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-md-center text-start">
                <div className="text-uppercase text-muted small fw-semibold">Progress</div>
                <div className="d-flex align-items-center gap-3 mt-2">
                  <ProgressBar
                    now={progress}
                    className="flex-grow-1"
                    style={{ height: "10px", borderRadius: "999px" }}
                  />
                  <span className="fw-bold text-dark">{progress}%</span>
                </div>
                <div className="mt-2 text-muted small">
                  {summary.completed} / {summary.total} tasks completed
                </div>
              </div>
            </Col>
            <Col md={3} className="text-md-end">
              <div className="text-uppercase text-muted small fw-semibold">Time Elapsed</div>
              <div className="display-6 fw-bold text-primary">{formattedElapsed}</div>
              {startStatusLabel && (
                <div className="text-muted small">{startStatusLabel}</div>
              )}
              <div className="text-muted small">{dueLabel}</div>
              <hr className="my-3" />
              <div className="text-muted small d-flex flex-column gap-1">
                <span>
                  <i className="bi bi-play-circle me-2 text-success"></i>
                  Bắt đầu: {formattedStart}
                </span>
                <span>
                  <i className="bi bi-flag me-2 text-danger"></i>
                  Kết thúc: {formattedEnd}
                </span>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        <Col lg={8}>
          <div>
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="mb-0 fw-semibold">Task Checklist</h5>
                    <small className="text-muted">
                      Complete all tasks to finish the job
                    </small>
                  </div>
                  <Badge
                    bg="primary"
                    className="px-3 py-2 d-inline-flex align-items-center gap-2"
                  >
                    <i className="bi bi-check2-circle"></i>
                    {progress}% Done
                  </Badge>
                </div>

                <div className="d-flex flex-column gap-4">
                  {groupedTasks.map(({ group, items }, groupIndex) => (
                    <div key={group || `group-${groupIndex}`} className="d-flex flex-column gap-3">
                      {group && (
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-secondary-subtle text-secondary fw-semibold px-3 py-2">
                            {group}
                          </span>
                          <span className="text-muted small">
                            {items.filter((item) => item.status === "completed").length} /{" "}
                            {items.length} tasks
                          </span>
                        </div>
                      )}
                      {items.map((task) => (
                        <Card
                          key={task.id}
                          className="border-0 shadow-sm"
                          style={{ borderRadius: "16px" }}
                        >
                          <Card.Body className="d-flex align-items-center justify-content-between py-3 px-4">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className={`d-flex align-items-center justify-content-center rounded-circle ${
                                  task.status === "completed"
                                    ? "bg-success bg-opacity-10 text-success"
                                    : task.status === "in_progress"
                                      ? "bg-primary bg-opacity-10 text-primary"
                                      : "bg-light text-secondary"
                                }`}
                                style={{ width: 44, height: 44 }}
                              >
                                {task.status === "completed" ? (
                                  <i className="bi bi-check-circle-fill fs-5"></i>
                                ) : task.status === "in_progress" ? (
                                  <i className="bi bi-hourglass-split fs-5"></i>
                                ) : (
                                  <i className="bi bi-circle fs-5"></i>
                                )}
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{task.label}</div>
                                <small className="text-muted">
                                  {STATUS_LABELS[task.status] || "Pending"}
                                </small>
                              </div>
                            </div>
                            <Button
                              variant={
                                task.status === "completed"
                                  ? "outline-success"
                                  : task.status === "in_progress"
                                    ? "primary"
                                    : "outline-secondary"
                              }
                              size="sm"
                              className="fw-semibold"
                              onClick={() => handleTaskStatus(task.id)}
                            >
                              {task.status === "completed"
                                ? "Completed"
                                : task.status === "in_progress"
                                  ? "Mark done"
                                  : "Start"}
                            </Button>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            <div className="d-flex gap-3 flex-wrap">
              <Button
                variant={isPaused ? "warning" : "outline-warning"}
                className="px-4 py-2 fw-semibold"
                onClick={handlePauseToggle}
              >
                <i className="bi bi-pause-circle me-2"></i>
                {isPaused ? "Resume Job" : "Pause Job"}
              </Button>
              <Button
                variant="danger"
                className="px-4 py-2 fw-semibold"
                disabled={loading || !allTasksCompleted}
                onClick={handleCompleteJob}
              >
                <i className="bi bi-stop-circle me-2"></i>
                End Job
              </Button>
            </div>
            {!allTasksCompleted && (
              <small className="text-muted d-block mt-2">
                Vui lòng hoàn thành tất cả mục trong checklist trước khi kết thúc công việc.
              </small>
            )}
          </div>
        </Col>

        <Col lg={4}>
          <div className="d-flex flex-column gap-4">
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h6 className="fw-semibold mb-3">Customer Notes</h6>
                <div className="d-flex flex-column gap-3 text-muted">
                  <div>
                    <div className="fw-semibold text-dark mb-1">Special Instructions</div>
                    <p className="mb-0">
                      {special_instructions ||
                        "Không có ghi chú đặc biệt. Vui lòng hoàn thành theo yêu cầu tiêu chuẩn."}
                    </p>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark mb-1">Access Information</div>
                    <p className="mb-0">
                      {customer_notes ||
                        "Khách hàng sẽ có mặt tại nhà. Liên hệ trước khi đến để được hỗ trợ thêm."}
                    </p>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark mb-1">Additional Notes</div>
                    <p className="mb-0">
                      {additional_notes ||
                        "Nếu cần thêm vật dụng, vui lòng trao đổi với khách hàng."}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>

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
                  {bookingEndTime && (
                    <div>
                      <i className="bi bi-clock-history me-2 text-primary"></i>
                      Dự kiến hoàn thành: {formattedEnd}
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
}

