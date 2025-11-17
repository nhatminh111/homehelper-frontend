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

const DEFAULT_TASKS = [
  { id: "default-1", label: "Clean all kitchen surfaces and countertops", status: "completed" },
  { id: "default-2", label: "Deep clean appliances (oven, microwave, refrigerator)", status: "completed" },
  { id: "default-3", label: "Sanitize sink and faucet", status: "completed" },
  { id: "default-4", label: "Clean and organize cabinets", status: "completed" },
  { id: "default-5", label: "Mop and vacuum floors", status: "completed" },
];

const parseChecklist = (rawChecklist) => {
  if (!rawChecklist) return [];
  if (Array.isArray(rawChecklist)) {
    return rawChecklist.map((item, index) => ({
      id: item?.id || `task-${index}`,
      label: typeof item === "string" ? item : item?.label || `Task ${index + 1}`,
      status: item?.status || "completed",
    }));
  }

  if (typeof rawChecklist === "string") {
    try {
      const parsed = JSON.parse(rawChecklist);
      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => ({
          id: item?.id || `task-${index}`,
          label: typeof item === "string" ? item : item?.label || `Task ${index + 1}`,
          status: item?.status || "completed",
        }));
      }
      if (parsed && Array.isArray(parsed.items)) {
        return parsed.items.map((item, index) => ({
          id: item?.id || `task-${index}`,
          label: typeof item === "string" ? item : item?.label || `Task ${index + 1}`,
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
  const [tasks, setTasks] = useState(() => location.state?.tasks || DEFAULT_TASKS);
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
          const bookingData = (payload && (payload.booking || payload.data)) || payload;

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
    const completed = tasks.filter((task) => task.status === "completed").length;
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

  const handleCompleteSubmission = () => {
    navigate("/tasker/bookings");
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
        <Button variant="secondary" onClick={() => navigate("/tasker/bookings")}>
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
            <span className="text-uppercase text-muted small fw-semibold">Task detail</span>
            <h3 className="fw-bold mb-1">
              Task #{booking.booking_id} – {booking.task_description || "Công việc đã hoàn thành"}
            </h3>
            <div className="text-muted">
              {booking.service_name || "Dịch vụ"} • {booking.variant_name || "Gói"} •{" "}
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
              <h6 className="text-muted mb-3">Before Photos</h6>
              <label
                className="d-flex flex-column align-items-center justify-content-center border border-dashed rounded-3 py-5 text-center text-muted"
                style={{ cursor: "pointer", borderColor: "#d8dbe0" }}
              >
                <i className="bi bi-cloud-arrow-up fs-1 mb-2"></i>
                <span className="fw-semibold">Drag & drop photos here</span>
                <small className="text-muted">or click to browse</small>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleBeforePhotosChange}
                  className="d-none"
                />
              </label>
              <div className="d-flex flex-wrap gap-3 mt-3">
                {beforePhotos.map((item, index) => (
                  <div
                    key={`${item.preview}-${index}`}
                    className="position-relative rounded overflow-hidden"
                    style={{ width: 120, height: 90 }}
                  >
                    <img
                      src={item.preview}
                      alt="Before"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <Button
                      variant="light"
                      size="sm"
                      className="position-absolute top-0 end-0 m-1 p-1"
                      onClick={() => removePhoto("before", index)}
                    >
                      <i className="bi bi-x-lg"></i>
                    </Button>
                  </div>
                ))}
              </div>
            </Col>
            <Col md={6}>
              <h6 className="text-muted mb-3">After Photos</h6>
              <label
                className="d-flex flex-column align-items-center justify-content-center border border-dashed rounded-3 py-5 text-center text-muted"
                style={{ cursor: "pointer", borderColor: "#d8dbe0" }}
              >
                <i className="bi bi-cloud-arrow-up fs-1 mb-2"></i>
                <span className="fw-semibold">Drag & drop photos here</span>
                <small className="text-muted">or click to browse</small>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleAfterPhotosChange}
                  className="d-none"
                />
              </label>
              <div className="d-flex flex-wrap gap-3 mt-3">
                {afterPhotos.map((item, index) => (
                  <div
                    key={`${item.preview}-${index}`}
                    className="position-relative rounded overflow-hidden"
                    style={{ width: 120, height: 90 }}
                  >
                    <img
                      src={item.preview}
                      alt="After"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <Button
                      variant="light"
                      size="sm"
                      className="position-absolute top-0 end-0 m-1 p-1"
                      onClick={() => removePhoto("after", index)}
                    >
                      <i className="bi bi-x-lg"></i>
                    </Button>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
        <Button variant="outline-secondary" onClick={() => navigate("/tasker/bookings")}>
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

