import React, { useState, useEffect } from "react"; // thêm useState
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  ListGroup,
  Image,
  Modal // import Modal
} from "react-bootstrap";
import { FaCheckCircle } from "react-icons/fa";
import api from "../../services/api";

const TaskerJobDone = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();


  const [booking, setBooking] = useState(location.state?.booking || null);
  const [tasks, setTasks] = useState(location.state?.tasks || []);
  const [timers, setTimers] = useState({});
  const [notes, setNotes] = useState(location.state?.notes || "");
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);

  const loadStoredTasks = (bookingId) => {
    try {
      const raw = localStorage.getItem(`task-${bookingId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.tasks || [];
      }
    } catch { }
    return null;
  };

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        console.log("📡 Fetching booking from BE:", bookingId);

        const res = await api.get(`/bookings/info/${bookingId}`, {
          headers: { "Cache-Control": "no-cache" }
        });

        console.log("🟦 [API RAW RESPONSE]:", res.data);

        const b = res.data;

        console.log("🟩 [Parsed Booking]:", b);

        console.log("⏱️ RAW checklist_timers từ BE:", b.checklist_timers);
        console.log("⏱️ typeof checklist_timers:", typeof b.checklist_timers);

        if (!b.checklist_timers) {
          console.warn("⚠️ checklist_timers từ BE = null hoặc empty!");
        } else {
          Object.keys(b.checklist_timers).forEach((k) => {
            console.log(`⏱️ timer[${k}] =`, b.checklist_timers[k]);
          });
        }

        setBooking(b);
        setNotes(b.notes || "");
        setBeforePhotos(b.before_photos || []);
        setAfterPhotos(b.after_photos || []);
        setTimers(b?.checklist_timers || {});
        console.log("🧩 setTimers() CALLED với:", b.checklist_timers);

        // Load tasks từ localStorage nếu có
        const stored = loadStoredTasks(b.booking_id);
        if (stored && stored.length > 0) {
          console.log("🟦 [Stored tasks found]:", stored);
          setTasks(
            stored.map((t) => (typeof t === "string" ? t : t?.label || t?.id || ""))
          );
        } else {
          // fallback từ booking.job_description hoặc checklist
          const list = String(b.task_checklist || "")
            .replace(/\r\n/g, "\n")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);

          console.log("🟦 [Checklist tasks]:", list);
          setTasks(list);
        }

      } catch (e) {
        console.error("❌ ERROR loading booking:", e);
      }
    };

    const loadTimersFromLocal = () => {
      try {
        console.log("🕒 [JobDone] Loading timers from localStorage...");

        const raw = localStorage.getItem(`tasker_daily_sessions_${bookingId}`);
        if (!raw) {
          console.warn("⚠️ [JobDone] No session timer found for booking", bookingId);
          return;
        }

        const sessions = JSON.parse(raw);
        const dayKey = Object.keys(sessions)[0];
        const timerBlock = sessions[dayKey]?.timers || {};

        console.log("⏱️ [JobDone] Loaded timers:", timerBlock);

        setTimers(timerBlock);
      } catch (e) {
        console.error("❌ [JobDone] Failed to parse timers:", e);
      }
    };

    fetchBooking();
    loadTimersFromLocal();

  }, [bookingId]);

  const formatTime = (ms) => {
    if (!ms) return "0m 0s";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  };

  const expected_price = booking?.expected_price ?? 0;
  const final_price = booking?.final_price ?? 0;

  console.log("🟦 [JobDone] booking:", booking);
  console.log("🟦 [JobDone] tasks:", tasks);
  console.log("🟦 [JobDone] notes:", notes);
  console.log("🟦 [JobDone] beforePhotos:", beforePhotos);
  console.log("🟦 [JobDone] afterPhotos:", afterPhotos);

  const allImages = [...beforePhotos, ...afterPhotos].filter(Boolean);

  console.log("📸 [JobDone] allImages:", allImages);
  console.log("📸 [JobDone] Total images:", allImages.length);

  // ---- STATE CHO MODAL ----
  const [showModal, setShowModal] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openModal = (index) => {
    setCurrentImageIndex(index);
    setActiveImage(allImages[index]);
    setShowModal(true);
  };

  const handlePrev = () => {
    const newIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
    setCurrentImageIndex(newIndex);
    setActiveImage(allImages[newIndex]);
  };

  const handleNext = () => {
    const newIndex = (currentImageIndex + 1) % allImages.length;
    setCurrentImageIndex(newIndex);
    setActiveImage(allImages[newIndex]);
  };

  const rawPrice = Number(
    final_price && Number(final_price) !== 0
      ? final_price
      : expected_price
  );

  // Hệ thống chỉ lấy 10%
  const fee = Math.round(rawPrice * 0.10);

  // Earnings cho tasker
  const earnings = rawPrice - fee;

  const formatMoney = (v) =>
    Number(v).toLocaleString("vi-VN") + "đ";

  return (
    <Container className="py-4">
      <style>{`
      .modal-backdrop {
        z-index: 1040 !important;
      }

      .modal {
        z-index: 1050 !important;
      }

      .modal-dialog {
        z-index: 1060 !important;
      }
      .tasker-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2500;
        animation: fadeIn 0.25s ease;
      }

      .tasker-modal-content {
        position: relative;
        max-width: 90%;
        max-height: 90%;
        border-radius: 12px;
        overflow: hidden;
        animation: scaleIn 0.25s ease;
      }

      .tasker-modal-image {
        width: 100%;
        height: auto;
        display: block;
        border-radius: 12px;
      }

      .tasker-modal-close {
        position: absolute;
        top: 10px;
        right: 14px;
        background: rgba(0,0,0,0.6);
        border: none;
        color: white;
        font-size: 22px;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        cursor: pointer;
        transition: 0.2s;
      }
      .tasker-modal-close:hover {
        background: rgba(0,0,0,0.8);
      }

      .tasker-modal-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        font-size: 38px;
        background: rgba(0,0,0,0.4);
        color: white;
        border: none;
        border-radius: 50%;
        width: 52px;
        height: 52px;
        cursor: pointer;
        transition: 0.2s;
      }
      .tasker-modal-nav:hover {
        background: rgba(0,0,0,0.7);
      }

      .tasker-modal-nav.left {
        left: 10px;
      }

      .tasker-modal-nav.right {
        right: 10px;
      }

      @keyframes fadeIn {
        from { opacity: 0 }
        to { opacity: 1 }
      }

      @keyframes scaleIn {
        from { transform: scale(0.95); opacity: 0.4 }
        to { transform: scale(1); opacity: 1 }
      }
        body.modal-open {
  overflow: hidden !important;
}
      `}</style>
      <Row>
        {/* LEFT COLUMN */}
        <Col md={8}>
          {/* Customer Info */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold">Customer Information</h5>
              <div className="d-flex align-items-center mt-3">
                <Image
                  src="https://ui-avatars.com/api/?name=Customer"
                  roundedCircle
                  width={60}
                  height={60}
                />
                <div className="ms-3">
                  <h6 className="mb-0">{booking?.customer_name || "Customer Name"}</h6>
                  <small className="text-muted">Premium Member</small>
                  <div className="mt-2">
                    <div>📞 {booking?.customer_phone}</div>
                    <div>📧 {booking?.customer_email}</div>
                    <div>📍 {booking?.location}</div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Completed Tasks */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold">Completed Tasks</h5>
              <ListGroup variant="flush" className="mt-3">
                {tasks?.map((task, index) => {
                  const taskId = `task-${index}`;
                  const elapsed = timers[taskId] ?? 0;

                  return (
                    <ListGroup.Item
                      key={taskId}
                      className="border rounded py-3 px-3 mb-2 d-flex justify-content-between align-items-center shadow-sm"
                      style={{ background: "#f9fafb" }}
                    >
                      <div className="d-flex align-items-center">
                        <FaCheckCircle className="text-success me-3 fs-5" />
                        <span className="fw-semibold" style={{ fontSize: "1rem" }}>
                          {task}
                        </span>
                      </div>

                      <span
                        className="fw-bold text-primary"
                        style={{ fontSize: "0.95rem", whiteSpace: "nowrap" }}
                      >
                        {formatTime(elapsed)}
                      </span>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Before & After Photos */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold">Before & After Photos</h5>

              {/* BEFORE SECTION */}
              <h6 className="mt-3 mb-3 fw-bold  text-center" style={{ fontSize: "1.6rem" }}>
                BEFORE
              </h6>
              <Row>
                {beforePhotos.length === 0 && (
                  <p className="text-muted">No before photos.</p>
                )}

                {beforePhotos.map((img, index) => (
                  <Col xs={6} md={4} key={index} className="mb-3">
                    <Card
                      className="shadow-sm"
                      onClick={() => openModal(index)}
                      style={{ cursor: "pointer" }}
                    >
                      <Card.Img
                        src={img}
                        style={{ height: 120, objectFit: "cover" }}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* AFTER SECTION */}
              <h6 className="mt-4 mb-3 fw-bold  text-center" style={{ fontSize: "1.6rem" }}>
                AFTER
              </h6>
              <Row>
                {afterPhotos.length === 0 && (
                  <p className="text-muted">No after photos.</p>
                )}

                {afterPhotos.map((img, index) => {
                  const globalIdx = beforePhotos.length + index;

                  return (
                    <Col xs={6} md={4} key={globalIdx} className="mb-3">
                      <Card
                        className="shadow-sm"
                        onClick={() => openModal(globalIdx)}
                        style={{ cursor: "pointer" }}
                      >
                        <Card.Img
                          src={img}
                          style={{ height: 120, objectFit: "cover" }}
                        />
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>

          <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg"
            enforceFocus={false}
          >
            <Modal.Body className="p-0 text-center">
              {activeImage && (
                <img
                  src={activeImage}
                  className="img-fluid"
                  style={{ maxHeight: "90vh", objectFit: "contain" }}
                />
              )}
            </Modal.Body>

            {allImages.length > 1 && (
              <div className="d-flex justify-content-between p-3">
                <Button
                  variant="light"
                  onClick={() => {
                    const newIndex =
                      (currentImageIndex - 1 + allImages.length) % allImages.length;
                    setCurrentImageIndex(newIndex);
                    setActiveImage(allImages[newIndex]);
                  }}
                >
                  ← Prev
                </Button>

                <Button
                  variant="light"
                  onClick={() => {
                    const newIndex = (currentImageIndex + 1) % allImages.length;
                    setCurrentImageIndex(newIndex);
                    setActiveImage(allImages[newIndex]);
                  }}
                >
                  Next →
                </Button>
              </div>
            )}
          </Modal>

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

        {/* RIGHT COLUMN */}
        <Col md={4}>
          {/* Tasker Notes */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold">Tasker Notes</h5>
              <p className="mt-3" style={{ whiteSpace: "pre-line" }}>
                {notes || "No notes provided."}
              </p>
            </Card.Body>
          </Card>

          {/* Payment Info */}
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="fw-bold">Thông tin thanh toán</h5>
              <div className="mt-3">
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
                  <span className="fw-bold text-success">{formatMoney(earnings)}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container >
  );
};

export default TaskerJobDone;
