import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import api from "../../services/api";
import { showToast } from "../../components/common/CustomToast";
import MediaUpload from "../../components/MediaUpload";

// const NO_PHOTO_SERVICES = [
//   "Chăm sóc người già và bệnh nhân",
//   "Chăm sóc trẻ em",
// ];

const DEFAULT_TASKS = [
  {
    id: "default-1",
    label: "Clean all kitchen surfaces and countertops",
    status: "completed",
  },
  {
    id: "default-2",
    label: "Deep clean appliances (oven, microwave, refrigerator)",
    status: "completed",
  },
  { id: "default-3", label: "Sanitize sink and faucet", status: "completed" },
  {
    id: "default-4",
    label: "Clean and organize cabinets",
    status: "completed",
  },
  { id: "default-5", label: "Mop and vacuum floors", status: "completed" },
];

const parseChecklist = (rawChecklist) => {
  if (!rawChecklist) return [];
  if (Array.isArray(rawChecklist)) {
    return rawChecklist.map((item, index) => ({
      id: item?.id || `task-${index}`,
      label:
        typeof item === "string" ? item : item?.label || `Task ${index + 1}`,
      status: item?.status || "completed",
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
          status: item?.status || "completed",
        }));
      }
      if (parsed && Array.isArray(parsed.items)) {
        return parsed.items.map((item, index) => ({
          id: item?.id || `task-${index}`,
          label:
            typeof item === "string"
              ? item
              : item?.label || `Task ${index + 1}`,
          status: item?.status || "completed",
        }));
      }
    } catch (err) {
      // ignore parse error
    }

    const normalized = String(rawChecklist)
      .replace(/\r\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\u2022/g, "-");

    return normalized
      .split(/\n|-/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((label, index) => ({
        id: `task-${index}`,
        label,
        status: "completed",
      }));
  }

  return [];
};

const createPreviewObjects = (files) =>
  Array.from(files || []).map((file) => ({
    file,
    preview: URL.createObjectURL(file),
  }));

export default function TaskerJobCompletion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [tasks, setTasks] = useState(
    () => location.state?.tasks || DEFAULT_TASKS
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState("");
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);

  // const [disablePhoto, setDisablePhoto] = useState(false);
  const bookingData = booking || location.state?.booking || {};

  useEffect(() => {
    return () => {
      beforePhotos.forEach(({ preview }) => URL.revokeObjectURL(preview));
      afterPhotos.forEach(({ preview }) => URL.revokeObjectURL(preview));
    };
  }, [beforePhotos, afterPhotos]);

  useEffect(() => {
    if (!booking && id) {
      const fetchBooking = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/bookings/${id}`, {
            headers: { "Cache-Control": "no-cache" },
          });

          const payload = response?.data;
          const bookingData =
            (payload && (payload.booking || payload.data)) || payload;

          if (bookingData && bookingData.booking_id) {
            setBooking(bookingData);
            const parsedTasks = parseChecklist(bookingData.task_checklist);
            if (parsedTasks.length) {
              setTasks(parsedTasks);
            }
          } else {
            throw new Error("Không tìm thấy thông tin booking");
          }
        } catch (err) {
          console.error("❌ Lỗi tải booking:", err);
          setError("Không thể tải thông tin công việc. Vui lòng thử lại sau.");
        } finally {
          setLoading(false);
        }
      };

      fetchBooking();
    }
  }, [booking, id]);

  /*
  useEffect(() => {
    if (bookingData?.service_name) {
      setDisablePhoto(NO_PHOTO_SERVICES.includes(bookingData.service_name));
    }
  }, [bookingData?.service_name]);
  */

  // Sync session statuses if available (from multi-day navigation)
  useEffect(() => {
    const sessionData = location.state?.sessionData;
    if (sessionData?.taskStatuses) {
      console.log("🔄 Syncing tasks with session status:", sessionData.taskStatuses);
      setTasks((prev) =>
        prev.map((t) => {
          const newStatus = sessionData.taskStatuses[t.id];
          return newStatus ? { ...t, status: newStatus } : t;
        })
      );
    }
  }, [location.state?.sessionData]);

  const completionStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    return { total, completed };
  }, [tasks]);

  const handleBeforePhotosChange = (event) => {
    const files = event.target.files;
    setBeforePhotos((prev) => [...prev, ...createPreviewObjects(files)]);
  };

  const handleAfterPhotosChange = (event) => {
    const files = event.target.files;
    setAfterPhotos((prev) => [...prev, ...createPreviewObjects(files)]);
  };

  const removePhoto = (type, index) => {
    if (type === "before") {
      setBeforePhotos((prev) => {
        const clone = [...prev];
        const [removed] = clone.splice(index, 1);
        if (removed) URL.revokeObjectURL(removed.preview);
        return clone;
      });
    } else {
      setAfterPhotos((prev) => {
        const clone = [...prev];
        const [removed] = clone.splice(index, 1);
        if (removed) URL.revokeObjectURL(removed.preview);
        return clone;
      });
    }
  };

  const uploadPhotos = async (type) => {

    const files = type === "before" ? beforePhotos : afterPhotos;
    if (!files.length) return [];

    const formData = new FormData();
    files.forEach((f) => formData.append("photos", f.file));

    const bookingId = booking.booking_id;
    if (!bookingId) throw new Error("Missing booking_id");

    // Backend: /uploads/task-photos/before/:bookingId
    const endpoint = `/uploads/task-photos/${type}/${bookingId}`;

    console.log("🔵 Uploading type:", type, "FILES:", files);

    try {
      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("🟢 Upload response:", response.data);

      // Trả về danh sách file (SQL insert sẽ chạy trong backend)
      return response.data.data || [];
    } catch (err) {
      console.error(`Error uploading ${type} photos:`, err);
      throw new Error(err?.response?.data?.message || "Upload failed");
    }
  };

  const loadTimersFromProgress = (bookingId) => {
    try {
      console.log("⏱️ [Completion] Loading timers for booking:", bookingId);

      const raw = localStorage.getItem(`tasker_daily_sessions_${bookingId}`);
      if (!raw) {
        console.warn("⚠️ [Completion] No timer data found in localStorage");
        return {};
      }

      const sessions = JSON.parse(raw);
      const dayKey = Object.keys(sessions)[0];
      const timers = sessions[dayKey]?.timers || {};

      const result = {};
      Object.keys(timers).forEach(k => {
        result[k] = timers[k].elapsedMs || 0;
      });

      console.log("⏱️ [Completion] Parsed timers:", result);
      return result;

    } catch (err) {
      console.error("❌ [Completion] Failed to parse timers:", err);
      return {};
    }
  };

  const handleCompleteSubmission = async () => {
    // 0. Validate (Always require photos now)
    if (beforePhotos.length === 0 || afterPhotos.length === 0) {
      showToast.warning("Vui lòng tải lên đủ ảnh trước và sau khi làm việc");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🔥 STEP 0 — START SUBMISSION PROCESS");

      let uploadedBeforePhotos = [];
      let uploadedAfterPhotos = [];

      // Upload photos nếu có và lưu URLs
      // uploadedBeforePhotos and uploadedAfterPhotos are already declared above

      console.log("STEP 1 — Before photos:", beforePhotos);
      console.log("STEP 2 — After photos:", afterPhotos);

      const extractUrl = (obj) => {
        console.log("DEBUG — object từ backend:", obj);
        return (
          obj.secure_url ||
          obj.url ||
          obj.photo_url ||
          obj.secureUrl ||
          obj.photoUrl ||
          obj.location ||
          obj.path ||
          ""
        );
      };

      // ✅ Luôn thực hiện upload
      if (beforePhotos.length > 0) {
        console.log("STEP 3 — Uploading BEFORE...");
        const beforeResult = await uploadPhotos("before");
        console.log("STEP 4 — Upload BEFORE result (RAW):", beforeResult);

        uploadedBeforePhotos = Array.isArray(beforeResult)
          ? beforeResult.map(extractUrl)
          : [];
        console.log("STEP 4 — Parsed BEFORE photos:", uploadedBeforePhotos);
      }

      if (afterPhotos.length > 0) {
        console.log("STEP 5 — Uploading AFTER...");
        const afterResult = await uploadPhotos("after");
        uploadedAfterPhotos = Array.isArray(afterResult)
          ? afterResult.map(extractUrl)
          : [];
        console.log("STEP 6 — Upload AFTER result:", uploadedAfterPhotos);
      }

      // Note: we send 'notes' in the complete payload below, so no need for separate patch.
      /*
      try {
        if (notes.trim()) {
          console.log("STEP 7 — Saving notes:", notes);
          await api.patch(`/bookings/${booking.booking_id}/notes`, { notes });
        }
      } catch (e) {
        console.warn("Non-fatal: failed to save notes", e);
      }
      */

      const checklistTimers = location.state?.checklistTimers || (location.state?.sessionData?.timers) || {};
      const dayKey = location.state?.dayKey;
      const isSessionCompletion = location.state?.isSessionCompletion;
      const checkInTime = location.state?.sessionData?.checkIn;

      const submitPayload = {
        booking_id: booking.booking_id,
        notes,
        before_photos: uploadedBeforePhotos,
        after_photos: uploadedAfterPhotos,
        checklist_timers: checklistTimers,
        session_date: dayKey,
        check_in_time: checkInTime, // Pass check-in time
        check_out_time: new Date().toISOString() // Pass current checkout time
      };

      console.log("📤 SUBMITTING COMPLETION:", submitPayload);
      const res = await api.patch(`/bookings/${booking.booking_id}/complete`, submitPayload);
      const { allDone } = res.data || {};

      console.log("📤 API RESPONSE - ALL DONE?:", allDone);

      if (isSessionCompletion && !allDone) {
        // CASE: Single Session completed, multi-day job continues
        // Update LocalStorage to mark session as done
        try {
          const sessionsKey = `tasker_daily_sessions_${booking.booking_id}`;
          const raw = localStorage.getItem(sessionsKey);
          let sessions = raw ? JSON.parse(raw) : {};

          if (sessions[dayKey]) {
            sessions[dayKey].status = 'completed';
            sessions[dayKey].done = true;
            sessions[dayKey].checkOut = new Date().toISOString();
          } else {
            sessions[dayKey] = { status: 'completed', done: true, checkOut: new Date().toISOString() };
          }

          localStorage.setItem(sessionsKey, JSON.stringify(sessions));
        } catch (e) { console.error("LS update error", e); }

        showToast.success(`Đã hoàn thành ngày ${dayKey}`);

        // Return to progress page
        navigate(`/tasker/bookings/${booking.booking_id}/progress`, {
          replace: true,
          state: {
            booking: booking,
            refresh: Date.now()
          }
        });

      } else {
        // CASE: All Done (Regular or Last Session)
        // Ensure even the last session checkout is recorded locally
        try {
          const sessionsKey = `tasker_daily_sessions_${booking.booking_id}`;
          const raw = localStorage.getItem(sessionsKey);
          let sessions = raw ? JSON.parse(raw) : {};
          if (dayKey && sessions[dayKey]) {
            sessions[dayKey].status = 'completed';
            sessions[dayKey].done = true;
            sessions[dayKey].checkOut = submitPayload.check_out_time;
            localStorage.setItem(sessionsKey, JSON.stringify(sessions));
          }
        } catch (e) { }

        navigate(`/tasker/bookings/${booking.booking_id}/jobdone`, {
          state: {
            booking,
            tasks: tasks.map((t) => t.label || t),
            notes,
            beforePhotos: uploadedBeforePhotos,
            afterPhotos: uploadedAfterPhotos,
            checklistTimers,
          },
        });
      }

    } catch (err) {
      console.error("Error completing submission:", err);
      const errorMessage =
        err?.response?.data?.message || err?.message || "Submit failed";
      setError(errorMessage);
      showToast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const safeBack = () => {
    const bookingId = location.state?.booking?.booking_id || id;

    if (location.state?.fromProgress && bookingId) {
      navigate(`/tasker/bookings/${bookingId}/progress`);
    } else if (bookingId) {
      // fallback nếu reload nhưng vẫn còn id trong URL
      navigate(`/tasker/bookings/${bookingId}/progress`);
    } else {
      navigate("/tasker/bookings");
    }
  };

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
        <Button variant="secondary" onClick={safeBack}>
          ← Quay lại
        </Button>
      </Container>
    );
  }

  if (!booking) {
    return (
      <Container className="py-5 text-center">
        <p className="text-muted">Không tìm thấy thông tin công việc.</p>
        <Button variant="secondary" onClick={safeBack}>
          ← Quay lại
        </Button>
      </Container>
    );
  }

  const getTaskStyle = (status) => {
    if (status === "completed") {
      return {
        container: "bg-success bg-opacity-10",
        iconClass: "bi-check-lg",
        iconColor: "text-success",
        badgeVariant: "success",
        badgeText: "Completed",
      };
    }
    if (status === "in_progress") {
      return {
        container: "bg-primary bg-opacity-10",
        iconClass: "bi-hourglass-split",
        iconColor: "text-primary",
        badgeVariant: "primary",
        badgeText: "In Progress",
      };
    }
    return {
      container: "bg-light",
      iconClass: "bi-circle",
      iconColor: "text-secondary",
      badgeVariant: "secondary",
      badgeText: "Pending",
    };
  };

  return (
    <Container className="py-4">
      <Row className="align-items-center mb-4">
        <Col>
          <div>
            <span className="text-uppercase text-muted small fw-semibold">
              Task detail
            </span>
            <h3 className="fw-bold mb-1">
              Task #{booking.booking_id} –{" "}
              {booking.task_description || "Công việc đã hoàn thành"}
            </h3>
            <div className="text-muted">
              {booking.service_name || "Dịch vụ"} •{" "}
              {booking.variant_name || "Gói"} •{" "}
              {booking.location || "Địa chỉ chưa cập nhật"}
            </div>
          </div>
        </Col>
        <Col md="auto">
          <Badge bg="success" className="px-3 py-2">
            Hoàn thành {completionStats.completed}/{completionStats.total}
          </Badge>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <h5 className="fw-semibold mb-3">Task Completion Checklist</h5>
          <div className="d-flex flex-column gap-3">
            {tasks.map((task) => {
              const styles = getTaskStyle(task.status);
              return (
                <div
                  key={task.id}
                  className={`d-flex align-items-center justify-content-between rounded-3 px-3 py-3 ${styles.container}`}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className={`rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm ${styles.iconColor}`}
                      style={{ width: 32, height: 32 }}
                    >
                      <i className={`bi ${styles.iconClass}`}></i>
                    </div>
                    <span className="fw-semibold text-dark">{task.label}</span>
                  </div>
                  <Badge bg={styles.badgeVariant} className="px-3 py-2">
                    {styles.badgeText}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <h5 className="fw-semibold mb-3">Job Notes</h5>
          <Form.Group controlId="jobNotes">
            <Form.Control
              as="textarea"
              rows={5}
              placeholder="Add notes about this job..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Always Show Media Upload */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <h5 className="fw-semibold mb-3">Media Upload</h5>
          <Row className="g-4">
            <Col md={6}>
              <MediaUpload
                label="Before Photos"
                photos={beforePhotos}
                setPhotos={setBeforePhotos}
              />
            </Col>
            <Col md={6}>
              <MediaUpload
                label="After Photos"
                photos={afterPhotos}
                setPhotos={setAfterPhotos}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
        <Button
          variant="outline-secondary"
          onClick={safeBack}
        >
          ← Quay lại danh sách
        </Button>
        <Button
          variant="success"
          size="lg"
          className="px-5"
          onClick={handleCompleteSubmission}
        >
          <i className="bi bi-check-circle-fill me-2"></i>
          Hoàn thành
        </Button>
      </div>
    </Container>
  );
}
