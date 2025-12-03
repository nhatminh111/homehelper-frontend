import React, { useState } from "react"; // thêm useState
import { useLocation, useNavigate } from "react-router-dom";
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

const TaskerJobDone = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    booking,
    tasks,
    notes,
    beforePhotos = [],
    afterPhotos = []
  } = location.state || {};

  // ---- STATE CHO MODAL ----
  const [showModal, setShowModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const allImages = [...beforePhotos, ...afterPhotos];

  const openModal = (index) => {
    setCurrentImageIndex(index);
    setShowModal(true);
  };

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  return (
    <Container className="py-4">
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
                    <div>📍 {booking?.address}</div>
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
                {tasks?.map((task, index) => (
                  <ListGroup.Item key={index} className="border-0 ps-0">
                    <FaCheckCircle className="text-success me-2" />
                    {task}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Before & After Photos */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <h5 className="fw-bold">Before & After Photos</h5>
                <Button variant="link" onClick={() => setShowModal(true)}>View all</Button>
              </div>
              <Row className="mt-3">
                {allImages.map((img, i) => (
                  <Col xs={6} md={4} key={i} className="mb-3">
                    <Card
                      className="shadow-sm"
                      onClick={() => openModal(i)}
                      style={{ cursor: "pointer" }}
                    >
                      <Card.Img src={img} style={{ height: 120, objectFit: "cover" }} />
                      <Card.Footer className="text-center small fw-bold">
                        {i < beforePhotos.length ? "Before" : "After"}
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
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

          {/* MODAL XEM ẢNH */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
            <Modal.Body className="text-center p-0">
              {allImages.length > 0 && (
                <img src={allImages[currentImageIndex]} style={{ width: "100%", height: "auto" }} />
              )}
            </Modal.Body>
            <div className="d-flex justify-content-between p-2">
              <Button variant="light" onClick={handlePrev}>← Trước</Button>
              <Button variant="light" onClick={handleNext}>Tiếp →</Button>
            </div>
          </Modal>
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
              <h5 className="fw-bold">Payment Information</h5>
              <div className="mt-3">
                <div className="d-flex justify-content-between">
                  <span>Service Fee</span>
                  <strong>{booking?.service_fee || "0"} đ</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Platform Fee</span>
                  <strong>{booking?.platform_fee || "0"} đ</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Tip</span>
                  <strong>{booking?.tip || "0"} đ</strong>
                </div>
                <hr />
                <div className="d-flex justify-content-between fs-5">
                  <span className="fw-bold">Total Earnings</span>
                  <span className="fw-bold text-success">{booking?.total || "0"} đ</span>
                </div>
                <div className="mt-3">
                  <span className="badge bg-warning text-dark">● Payment Pending</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TaskerJobDone;
