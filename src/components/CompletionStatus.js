import { Card } from "react-bootstrap";

export default function CompletionStatus({ jobTitle, description, photos, expectedPrice  }) {
  // kiểm tra dữ liệu form
  const status = {
    jobTitle: jobTitle?.trim() !== "",
    description: description?.trim() !== "",
    photos: photos && photos.length > 0,
    expectedPrice: expectedPrice?.trim() !== "",
  };

  // render icon tick hoặc vòng tròn xám
  const renderStatusIcon = (done) => (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        border: `2px solid ${done ? "#4caf50" : "#ccc"}`,
        backgroundColor: done ? "#4caf50" : "transparent",
        flexShrink: 0,
        transition: "all 0.2s ease-in-out",
      }}
    >
      {done && (
        <i
          className="bi bi-check text-white"
          style={{ fontSize: "14px" }}
        ></i>
      )}
    </div>
  );

  return (
    <Card className="custom-card mb-3 flex-fill">
      <Card.Body>
        <h6 className="text-primary mb-3 fw-bold">Trạng thái hoàn thành</h6>
        <ul className="list-unstyled mb-0">
          <li className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-dark fw-medium">Tiêu đề công việc</span>
            {renderStatusIcon(status.jobTitle)}
          </li>
          <li className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-dark fw-medium">Mô tả</span>
            {renderStatusIcon(status.description)}
          </li>
          <li className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-dark fw-medium">Ảnh</span>
            {renderStatusIcon(status.photos)}
          </li>
          <li className="d-flex justify-content-between align-items-center">
            <span className="text-dark fw-medium">Giá mong muốn</span>
            {renderStatusIcon(status.expectedPrice)}
          </li>
        </ul>
      </Card.Body>
    </Card>
  );
}
