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
import api from "../services/api";
import { showToast } from "../components/common/CustomToast";
import MediaUpload from "../components/MediaUpload";

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
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((f) => formData.append("photos", f.file));

    // Backend cần task_id từ bảng Tasks
    // Nếu không có task_id, có thể cần tạo task trước hoặc backend sẽ tự xử lý
    const taskId = booking.task_id || booking.booking_id;

    if (!taskId) {
      throw new Error("Không tìm thấy task_id hoặc booking_id");
    }

    // Backend routes: /task-photos/before/:taskId hoặc /task-photos/after/:taskId
    const endpoint = `/uploads/task-photos/${type}/${taskId}`;

    try {
      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      console.error(`Error uploading ${type} photos:`, error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        `Lỗi upload ${type} photos`;
      throw new Error(errorMessage);
    }
  };

  const handleCompleteSubmission = async () => {
    try {
      setLoading(true);
      setError(null);

      let uploadedBeforePhotos = [];
      let uploadedAfterPhotos = [];

      // Upload photos nếu có và lưu URLs
      if (beforePhotos.length > 0) {
        const beforeResult = await uploadPhotos("before");
        uploadedBeforePhotos = beforeResult?.files || [];
      }
      if (afterPhotos.length > 0) {
        const afterResult = await uploadPhotos("after");
        uploadedAfterPhotos = afterResult?.files || [];
      }

      // Thêm gửi notes nếu muốn (best-effort)
      try {
        if (notes.trim()) {
          await api.patch(`/bookings/${booking.booking_id}`, { notes });
        }
      } catch (e) {
        console.warn("Non-fatal: failed to save notes", e);
        showToast?.warning(
          "Ghi chú không lưu được — tiếp tục hoàn tất nhiệm vụ."
        );
      }

      // Use the shared status endpoint so route exists on backend
      try {
        await api.patch(`/bookings/${booking.booking_id}/status`, {
          status: "Hoàn thành",
        });
      } catch (e) {
        // If the status update fails, surface error but still attempt to navigate
        console.error("Failed to update booking status:", e);
        const msg = e?.message || "Không thể cập nhật trạng thái";
        showToast?.error(msg);
        // continue — we'll still navigate to the completion screen so tasker can proceed
      }

      // Format tasks để truyền sang TaskerJobDone (expect array of strings)
      const taskLabels = tasks.map((task) =>
        typeof task === "string" ? task : task.label || task.id
      );
      // Lưu checklist theo ngày
      localStorage.setItem(
        `task-${booking.booking_id}`,
        JSON.stringify({
          date: new Date().toDateString(),
          tasks,
        })
      );

      // Navigate đến TaskerJobDone với state
      navigate(`/tasker/bookings/${booking.booking_id}/jobdone`, {
        state: {
          booking,
          tasks: taskLabels,
          notes,
          beforePhotos: uploadedBeforePhotos,
          afterPhotos: uploadedAfterPhotos,
        },
      });
    } catch (err) {
      console.error("Error completing submission:", err);
      const errorMessage =
        err?.response?.data?.message || err?.message || "Upload photos failed";
      setError(errorMessage);
      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
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
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>
      </Container>
    );
  }

  if (!booking) {
    return (
      <Container className="py-5 text-center">
        <p className="text-muted">Không tìm thấy thông tin công việc.</p>
        <Button
          variant="secondary"
          onClick={() => navigate("/tasker/bookings")}
        >
          ← Quay lại danh sách
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
          onClick={() => navigate("/tasker/bookings")}
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
          Complete Task
        </Button>
      </div>
    </Container>
  );
}
