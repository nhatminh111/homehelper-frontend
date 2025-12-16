import { Container, Row, Col, Card, Button, Tabs, Tab } from "react-bootstrap";
import SignatureCanvas from "react-signature-canvas";
import { useRef, useState } from "react";

export default function ContractPage() {
    const sigCanvas = useRef(null);
    const [signature, setSignature] = useState("");
    const [typedSignature, setTypedSignature] = useState("");
    const [uploadedSignature, setUploadedSignature] = useState(null);

    const partnerSignature = {
        name: "Nguyen Van A",
        role: "ABC Company Representative",
        signedAt: "2025-08-24T10:30:00Z",
        signatureUrl: "https://static.vecteezy.com/system/resources/previews/025/866/351/original/fake-autograph-samples-hand-drawn-signatures-examples-of-documents-certificates-and-contracts-with-inked-and-handwritten-lettering-vector.jpg", // ảnh giả
    };

    const clearSignature = () => {
        if (sigCanvas.current) sigCanvas.current.clear(); // Xóa canvas
        setSignature("");        // Xóa signature preview
        setTypedSignature("");   // Xóa chữ đã nhập
        setUploadedSignature(null); // Xóa ảnh đã upload
    };
    const saveSignature = () => {
        const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
        setSignature(dataUrl);
    };

    return (
        <Container
            fluid
            className="py-4"
            style={{
                background: "#f8faff",
                padding: "2rem",        // khoảng cách bên trong
                minHeight: "100vh",     // full chiều cao để cân đối
            }}
        >
            <div
                style={{
                    maxWidth: "1200px",   // cố định chiều rộng tối đa
                    margin: "0 auto",     // căn giữa khung
                    borderRadius: "12px",
                    padding: "2rem",
                }}
            >
                <Row>
                    {/* LEFT COLUMN: CONTRACT */}
                    <Col lg={8}>
                        <Card
                            className="mb-4"
                            style={{
                                borderRadius: "16px",
                                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                            }}
                        >
                            <Card.Body>
                                {/* Header Box */}
                                <div
                                    className="d-flex justify-content-between align-items-center text-white p-3 rounded mb-4"
                                    style={{
                                        background: "linear-gradient(90deg, #2196f3, #21cbf3)",
                                        boxShadow: "0 4px 10px rgba(33,150,243,0.3)",
                                    }}
                                >
                                    {/* Nút Quay lại */}
                                    <Button
                                        variant="light"
                                        size="sm"
                                        onClick={() => window.history.back()}
                                        className="fw-semibold"
                                        style={{ borderRadius: "20px", padding: "0.25rem 1rem" }}
                                    >
                                        ⬅ Quay lại
                                    </Button>

                                    {/* Tiêu đề */}
                                    <h5 className="mb-0 fw-bold text-uppercase">Thông tin hợp đồng</h5>

                                    {/* Mã hợp đồng */}
                                    <small className="fw-semibold">Mã: #HD-2024-001</small>
                                </div>

                                <h4
                                    className="fw-bold text-center mb-2"
                                    style={{
                                        background: "linear-gradient(90deg, #2196f3, #21cbf3)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        fontSize: "1.8rem",
                                    }}
                                >
                                    HỢP ĐỒNG DỊCH VỤ
                                </h4>
                                <p className="text-center mb-4 text-muted">
                                    Giữa Công ty ABC và Khách hàng
                                </p>

                                {/* PARTY INFO */}
                                <Row className="mb-4">
                                    <Col md={6}>
                                        <Card className="p-3 bg-light border-0 shadow-sm rounded-3">
                                            <h6 className="fw-bold text-primary mb-2">
                                                BÊN A (Nhà cung cấp dịch vụ)
                                            </h6>
                                            <p className="mb-1">ABC Company Limited</p>
                                            <p className="mb-1">Địa chỉ: 123 Nguyễn Văn A, Q1, HCMC</p>
                                            <p className="mb-1">Điện thoại: 028.1234.5678</p>
                                            <p className="mb-0">Email: contact@abc.com</p>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card className="p-3 bg-warning-subtle border-0 shadow-sm rounded-3">
                                            <h6 className="fw-bold text-primary mb-2">BÊN B (Khách hàng)</h6>
                                            <p className="mb-1">Nguyen Van B</p>
                                            <p className="mb-1">Địa chỉ: 456 Lê Văn C, Q3, HCMC</p>
                                            <p className="mb-1">Điện thoại: 0901.234.567</p>
                                            <p className="mb-0">Email: nguyen.b@email.com</p>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* CONTRACT TERMS */}
                                <h5 className="text-primary fw-bold mb-3">📑 Điều khoản hợp đồng</h5>
                                <ol className="ps-3">
                                    <li className="mb-3">
                                        <strong>Nghĩa vụ của bên A:</strong>
                                        <ul>
                                            <li>Thực hiện dịch vụ đúng thời gian, địa điểm</li>
                                            <li>Đảm bảo chất lượng dịch vụ theo cam kết</li>
                                            <li>Sử dụng dụng cụ & hóa chất an toàn</li>
                                            <li>Bảo mật thông tin khách hàng</li>
                                            <li>Thông báo trước nếu thay đổi lịch (tối thiểu 24h)</li>
                                        </ul>
                                    </li>
                                    <li className="mb-3">
                                        <strong>Nghĩa vụ của bên B:</strong>
                                        <ul>
                                            <li>Thanh toán đầy đủ & đúng hạn</li>
                                            <li>Cung cấp điều kiện cần thiết cho việc thực hiện</li>
                                            <li>Thông báo trước yêu cầu thay đổi</li>
                                            <li>Bảo quản tài sản giá trị trong quá trình làm việc</li>
                                        </ul>
                                    </li>
                                    <li className="mb-3">
                                        <strong>Thanh toán:</strong>
                                        <ul>
                                            <li>Phương thức: Chuyển khoản hoặc tiền mặt</li>
                                            <li>Kỳ hạn: Sau mỗi lần hoặc theo tuần</li>
                                            <li>Trễ hạn: Phạt 2%/tháng</li>
                                        </ul>
                                    </li>
                                    <li className="mb-3">
                                        <strong>Huỷ & thay đổi:</strong>
                                        <ul>
                                            <li>Báo trước 24h cho huỷ/thay đổi</li>
                                            <li>Huỷ phút chót có thể chịu phí 50%</li>
                                        </ul>
                                    </li>
                                    <li className="mb-3">
                                        <strong>Bảo hiểm & trách nhiệm:</strong>
                                        <ul>
                                            <li>Bên A có bảo hiểm trách nhiệm nghề nghiệp</li>
                                            <li>Bồi thường thiệt hại do lỗi của nhân viên</li>
                                            <li>Không chịu trách nhiệm với tài sản không khai báo</li>
                                        </ul>
                                    </li>
                                </ol>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* RIGHT COLUMN: SIGNATURE */}
                    <Col lg={4}>
                        {/* Signature Preview */}
                        <Card
                            className="mb-4"
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                            }}
                        >
                            <Card.Body>
                                <h6 className="fw-bold text-dark mb-3">Chữ kí đối tác</h6>
                                <div
                                    style={{
                                        borderRadius: 8,
                                        border: "1px solid #d6f3df",
                                        background: "#f7fffb",
                                        padding: "0.8rem",
                                    }}
                                >
                                    <div className="d-flex justify-content-between mb-2">
                                        <div>
                                            <div className="fw-bold">{partnerSignature.name}</div>
                                            <div className="text-muted small">{partnerSignature.role}</div>
                                        </div>
                                        <div className="text-success small text-end">
                                            ✔️ Đã ký:{" "}
                                            {new Date(partnerSignature.signedAt).toLocaleString("vi-VN")}
                                        </div>
                                    </div>
                                    <div className="border rounded p-2 text-center bg-white">
                                        <img
                                            src={partnerSignature.signatureUrl}
                                            alt="Partner Signature"
                                            style={{ maxWidth: "100%", maxHeight: 80, objectFit: "contain" }}
                                        />
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Signature Input */}
                        <Card
                            className="mb-3"
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                            }}
                        >
                            <Card.Body>
                                <h6 className="fw-bold mb-3">✍️ Chữ ký của bạn</h6>
                                <Tabs defaultActiveKey="draw" className="mb-4">
                                    <Tab eventKey="draw" title="✍️ Vẽ">
                                        <SignatureCanvas
                                            ref={sigCanvas}
                                            penColor="black"
                                            canvasProps={{
                                                width: 350,
                                                height: 150,
                                                className: "border rounded w-100 bg-light",
                                            }}
                                        />
                                    </Tab>
                                    <Tab eventKey="type" title="⌨️ Gõ">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Nhập chữ ký"
                                            value={typedSignature}
                                            onChange={(e) => setTypedSignature(e.target.value)}
                                        />
                                    </Tab>
                                    <Tab eventKey="upload" title="📂 Tải lên">
                                        <div className="d-flex flex-column align-items-center w-100">
                                            <label className="btn btn-outline-primary w-100">
                                                <i className="bi bi-upload me-2"></i> Chọn tệp
                                                <input
                                                    type="file"
                                                    hidden
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const preview = URL.createObjectURL(file);
                                                            setUploadedSignature(preview);
                                                        }
                                                    }}
                                                />
                                            </label>

                                            {/* Hiển thị tên file nếu có */}
                                            {uploadedSignature && (
                                                <div className="position-relative mt-3 border rounded bg-white shadow-sm" style={{ maxWidth: "100%" }}>
                                                    <img
                                                        src={uploadedSignature}
                                                        alt="Uploaded Signature"
                                                        style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain" }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setUploadedSignature("")}
                                                        style={{
                                                            position: "absolute",
                                                            top: "6px",
                                                            right: "6px",
                                                            border: "none",
                                                            background: "rgba(255, 0, 0, 0.7)",
                                                            color: "white",
                                                            borderRadius: "50%",
                                                            width: "24px",
                                                            height: "24px",
                                                            fontSize: "14px",
                                                            lineHeight: "20px",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </Tab>
                                </Tabs>

                                <div className="d-flex gap-2 mt-3">
                                    <Button variant="outline-secondary" onClick={clearSignature}>
                                        Xoá
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Security */}
                        <Card
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                            }}
                        >
                            <Card.Body>
                                <h6 className="fw-bold text-success mb-3">🔒 Bảo mật & Xác thực</h6>
                                <ul className="list-unstyled mb-0 text-muted">
                                    <li>✔️ Mã hóa SSL 256-bit</li>
                                    <li>✔️ Xác thực danh tính</li>
                                    <li>✔️ Lưu trữ an toàn</li>
                                    <li>✔️ Tuân thủ GDPR</li>
                                </ul>
                            </Card.Body>
                        </Card>

                        {/* Next Step: Payment */}
                        <div className="mt-3">
                            <Button
                                className="w-100 fw-semibold"
                                style={{
                                    background: "linear-gradient(90deg,#2196f3,#21cbf3)",
                                    border: "none",
                                    color: "white",
                                    padding: "0.75rem",
                                    borderRadius: "10px",
                                    boxShadow: "0 4px 10px rgba(33,150,243,0.3)",
                                }}
                                onClick={() => window.location.href = "/payment"}
                            >
                                Đến trang thanh toán ➡
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}
