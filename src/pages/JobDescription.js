import { Container, Row, Col, Card, Button, Nav, Form } from "react-bootstrap";
import { useState } from "react";
import CompletionStatus from "../components/CompletionStatus"
import { useLocation, useNavigate } from "react-router-dom";

export default function JobDescription() {
  const [activeTab, setActiveTab] = useState("description");

  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state || {};
  const selection = bookingData.selection || {};

  // fallback fake nếu chưa có state

  const date = selection.date || "—";
  const startTime = selection.startTime || "—";
  const total = bookingData.total || 0;
  const cleaner = bookingData.cleaner || "Unknown";
  const chosenVariants = bookingData.chosenVariants || [];

  console.log("Đơn vị hiện tại:", selection.unit);

  const [jobTitle, setJobTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);

  const isComplete = jobTitle.trim() !== "" && description.trim() !== "" && photos.length > 0;

  return (
    <>
      {/* CSS nhúng */}
      <style>{`
        :root {
          --primary-color: #2196f3;
          --success-color: #4caf50;
          --light-bg: #f8faff;
        }

        body {
          background-color: var(--light-bg);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        }

        .custom-card {
          border: 1px solid #e6ebf5 !important;
          border-radius: 14px !important;
          background: #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
        }

        .custom-card .card-body {
          padding: 1.5rem;  /* chỉnh padding ở body cho cân với khung */
        }

        .custom-card h6 {
          font-size: 1rem;
        }

        .custom-card li span {
          line-height: 1.4;
        }

        .custom-btn {
          border-radius: 10px !important;
          font-weight: 500;
          padding: 0.75rem 1rem;
          box-shadow: 0 3px 6px rgba(33, 150, 243, 0.2);
        }

        .custom-btn:hover {
          box-shadow: 0 5px 12px rgba(33, 150, 243, 0.3);
        }

        .form-control {
          border-radius: 10px !important;
          border: 1px solid #d9e2ec !important;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .form-control:focus {
          border-color: var(--primary-color) !important;
          box-shadow: 0 0 0 0.25rem rgba(33, 150, 243, 0.2) !important;
        }

        .badge {
          border-radius: 6px !important;
          padding: 0.4rem 0.8rem;
          font-weight: 500;
        }

        .nav-pills .nav-link {
          border-radius: 8px !important;
          font-weight: 500;
        }

        .nav-pills .nav-link.active {
          background-color: var(--primary-color) !important;
        }

        .tab-card {
          min-height: 400px; /* tuỳ chỉnh theo UI mong muốn */
        }

        .image-wrapper {
          position: relative;
          width: 160px;
          height: 160px;
        }

        .image-wrapper button {
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .image-wrapper:hover button {
          opacity: 1; /* 👈 khi hover ảnh thì nút hiện ra */
        }

        .image-card {
          position: relative;
          width: 180px;
          height: 180px;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .image-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
        }

        .image-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .btn-delete {
          position: absolute;
          top: 6px;
          right: 6px;
          border: none;
          background: rgba(255, 0, 0, 0.6);
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          font-size: 14px;
          line-height: 24px;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s ease, background 0.2s ease;
        }

        .image-card:hover .btn-delete {
          opacity: 1;
        }

        .btn-delete:hover {
          background: rgba(255, 0, 0, 0.8);
        }

        .btn-add-photo {
          background: linear-gradient(90deg, #2196f3, #21cbf3);
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
          padding: 0.75rem 1.5rem;
          border-radius: 30px;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-add-photo i {
          font-size: 1.2rem;
        }

        .btn-add-photo:hover {
          background: linear-gradient(90deg, #1e88e5, #00bcd4);
          box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
          transform: translateY(-2px);
        }

        .btn-add-photo:active {
          transform: translateY(0);
          box-shadow: 0 3px 8px rgba(33, 150, 243, 0.2);
        }

      `}</style>

      {/* Header */}
      <header className="bg-white border-bottom sticky-top shadow-sm">
        <Container fluid className="py-3">
          <Row className="align-items-center">
            <Col xs={4}>
              <button
                onClick={() =>
                  navigate("/booking", {
                    state: {
                      ...bookingData,
                      selection,
                      step: bookingData.step || 3, // trả lại step cũ
                    },
                  })
                }
                className="btn btn-link text-dark text-decoration-none d-flex align-items-center p-0"
              >
                <i className="bi bi-arrow-left me-2"></i>
                <span>Quay lại đặt lịch</span>
              </button>
            </Col>
            <Col xs={4} className="text-center">
              <h2 className=" mb-0 fw-bold">Mô tả công việc</h2>
            </Col>
          </Row>
        </Container>
      </header>

      {/* Main */}
      <main className="bg-light pt-4 pb-2">
        <Container
          fluid className="mb-2"
        >
          <div
            style={{
              maxWidth: "1800px",
              margin: "0 auto",
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              padding: "1rem",
            }}
          >
            <Row className="g-4 align-items-stretch">
              {/* Cột trái */}
              <Col lg={8} className="d-flex flex-column">
                {/* Tóm tắt đặt lịch */}
                <Card className="custom-card mb-5 flex-fill">
                  <Card.Body>
                    <h4 className="text-primary mb-4 fw-bold">Tóm tắt đặt lịch</h4>
                    <Row className="gy-4 align-items-center">
                      <Col md={6} className="d-flex flex-column justify-content-center">
                        <div className="text-muted small">Người dọn dẹp</div>
                        <div className="fw-semibold">{cleaner}</div>
                      </Col>
                      <Col md={6} className="d-flex flex-column justify-content-center">
                        <div className="text-muted small">Dịch vụ</div>
                        <div className="fw-semibold">
                          {chosenVariants.length > 0
                            ? chosenVariants
                              .map(v => {
                                const parent = bookingData.allVariants?.find(
                                  av => Number(av.variant_id) === Number(v.variant_id)
                                );
                                return parent?.service_name
                                  ? `${parent.service_name} - ${v.variant_name}`
                                  : v.variant_name;
                              })
                              .join(", ")
                            : "Chưa chọn dịch vụ"}
                        </div>
                      </Col>
                      <Col md={6} className="d-flex flex-column justify-content-center">
                        <div className="text-muted small">Ngày & Giờ bắt đầu</div>
                        <div className="fw-semibold">
                          {selection.date
                            ? new Date(selection.date).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                            : "—"}{" "}
                          lúc {startTime}
                        </div>
                      </Col>
                      <Col md={6} className="d-flex flex-column justify-content-center">
                        <div className="text-muted small">Tổng cộng</div>
                        <div className="fw-bold text-primary">
                          {new Intl.NumberFormat("vi-VN").format(total * 1000)}đ
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Tabs */}
                <Nav
                  variant="pills"
                  className="mb-3"
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k || "description")}
                >
                  <Nav.Item>
                    <Nav.Link eventKey="description">
                      <i className="bi bi-file-text me-2"></i>Mô tả
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="photos">
                      <i className="bi bi-image me-2"></i>Ảnh ({photos.length})
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                {/* Nội dung Tab */}
                {activeTab === "description" ? (
                  <Card className="custom-card flex-fill tab-card d-flex flex-column justify-content-center">
                    <Card.Body>
                      <h5 className="text-primary mb-3 fw-semibold">Chi tiết công việc</h5>

                      {/* Tiêu đề công việc */}
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Tiêu đề công việc</Form.Label>
                        <Form.Control
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                        />
                      </Form.Group>

                      {/* Mô tả chi tiết */}
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          Mô tả chi tiết{" "}
                          <span className="text-muted small fw-normal">
                            ({description.length}/2000 ký tự)
                          </span>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={5}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>
                ) : (
                  <Card className="custom-card flex-fill tab-card d-flex flex-column">
                    <Card.Body className="d-flex flex-column">
                      {/* Tiêu đề ảnh */}
                      <h3
                        className="fw-bold text-center mb-4"
                        style={{
                          fontSize: "2rem",
                          marginTop: "0.5rem",
                          background: "linear-gradient(90deg, #2196f3, #21cbf3)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          letterSpacing: "0.5px",
                          paddingBottom: "0.5rem",
                        }}
                      >
                        📸 Ảnh của bạn
                      </h3>

                      {/* Nội dung ảnh */}
                      <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                        {photos.length > 0 ? (
                          <div className="d-flex flex-wrap justify-content-center gap-4">
                            {photos.map((url, i) => (
                              <div key={i} className="image-card">
                                <img src={url} alt="uploaded" />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                                  }
                                  className="btn-delete"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="d-flex flex-column justify-content-center align-items-center">
                            <i className="bi bi-image text-muted" style={{ fontSize: "3rem" }}></i>
                            <p className="text-muted mt-2">Chưa có ảnh nào</p>
                          </div>
                        )}
                      </div>

                      {/* Nút thêm ảnh */}
                      {photos.length < 5 && (
                        <div className="text-center mt-4">
                          <label className="btn btn-add-photo d-inline-flex align-items-center justify-content-center">
                            <i className="bi bi-plus-circle me-2"></i> Thêm ảnh
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;

                                // Giới hạn tối đa 5 ảnh
                                if (photos.length >= 5) {
                                  alert("Bạn chỉ có thể thêm tối đa 5 ảnh.");
                                  return;
                                }

                                const previewUrl = URL.createObjectURL(file);
                                setPhotos([...photos, previewUrl]);

                                const formData = new FormData();
                                formData.append("file", file);

                                try {
                                  const res = await fetch("http://localhost:5000/upload", {
                                    method: "POST",
                                    body: formData,
                                  });
                                  const data = await res.json();
                                  if (data.url) {
                                    setPhotos((prev) =>
                                      prev.map((p) => (p === previewUrl ? data.url : p))
                                    );
                                    URL.revokeObjectURL(previewUrl);
                                  }
                                } catch (err) {
                                  console.error("Upload error:", err);
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                )}
              </Col>

              {/* Cột phải */}
              <Col lg={4} className="d-flex flex-column">
                {/* Mẹo */}
                <Card className="custom-card mb-3 flex-fill">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <i className="bi bi-info-circle text-primary me-2" style={{ fontSize: "1.2rem" }}></i>
                      <h6 className="mb-0 fw-semibold text-primary">Mẹo để có kết quả tốt hơn</h6>
                    </div>

                    <ul className="list-unstyled mb-0">
                      <li className="mb-3 d-flex align-items-start">
                        <span className="fw-medium text-dark">
                          📷 Chụp ảnh rõ ràng khu vực cần dọn dẹp: Ví dụ như vết bẩn, khu vực nhiều bụi, hoặc nơi bạn muốn được làm kỹ.
                        </span>
                      </li>
                      <li className="mb-3 d-flex align-items-start">
                        <span className="fw-medium text-dark">
                          ⚠️ Thông báo nếu có dị ứng với sản phẩm tẩy rửa: Điều này giúp nhân viên chuẩn bị dung dịch thay thế an toàn.
                        </span>
                      </li>
                      <li className="mb-3 d-flex align-items-start">
                        <span className="fw-medium text-dark">
                          🔑 Cung cấp hướng dẫn ra vào: Ghi chú cách mở cửa, vị trí chìa khóa hoặc mã số để nhân viên có thể vào nhà dễ dàng.
                        </span>
                      </li>
                      <li className="d-flex align-items-start">
                        <span className="fw-medium text-dark">
                          💎 Chỉ rõ đồ vật dễ vỡ hoặc có giá trị: Để nhân viên cẩn thận hơn trong quá trình dọn dẹp, tránh hư hỏng.
                        </span>
                      </li>
                    </ul>
                  </Card.Body>
                </Card>

                {/* Trạng thái hoàn thành */}
                <CompletionStatus jobTitle={jobTitle} description={description} photos={photos} />

                {/* Hành động */}
                <Card className="custom-card mt-auto flex-fill">
                  <Card.Body className="text-center">
                    <Button
                      variant="outline-primary"
                      className="w-100 mb-2 custom-btn"
                      disabled
                    >
                      <i className="bi bi-eye me-2"></i>Xem trước mô tả
                    </Button>

                    {isComplete && (
                      <Button
                        variant="primary"
                        className="w-100 custom-btn"
                        onClick={() => {
                          console.log("Đơn vị hiện tại:", selection.unit);
                          const targetPage =
                            selection.unit === "Tuần" || selection.unit === "Tháng"
                              ? "/contract"
                              : "/payment";

                          navigate(targetPage, {
                            state: {
                              ...bookingData,
                              step: (bookingData.step || 3) + 1,
                              jobTitle,
                              description,
                              photos,
                            },
                          });
                        }}
                      >
                        <i className="bi bi-check-circle me-2"></i>
                        {selection.unit === "Tuần" || selection.unit === "Tháng"
                          ? "Tiếp theo: Ký hợp đồng"
                          : "Tiếp theo: Thanh toán"}
                      </Button>
                    )}

                    <small className="text-muted d-block mt-2">
                      Mô tả của bạn sẽ được gửi cho người dọn dẹp
                    </small>
                    <small className="text-muted d-block mt-2">
                      Vui lòng điền những thông tin cần thiết để tới trang tiếp theo
                    </small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        </Container>
      </main>

    </>
  );
}
