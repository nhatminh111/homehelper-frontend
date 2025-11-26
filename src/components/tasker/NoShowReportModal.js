import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import api from "./../../services/api";

const NoShowReportModal = ({ show, onClose, bookingId }) => {
  const [houseNumber, setHouseNumber] = useState(null);
  const [callImage, setCallImage] = useState(null);
  const [gpsImage, setGpsImage] = useState(null);
  const [frontImage, setFrontImage] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e, setter) => {
    setter(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!houseNumber || !callImage || !gpsImage || !frontImage) {
      alert("Vui lòng upload đủ 4 ảnh trước khi gửi.");
      return;
    }

    setLoading(true);
    const token = api.getStoredToken();
    const formData = new FormData();

    formData.append("booking_id", bookingId);
    formData.append("house_number", houseNumber);
    formData.append("call_screenshot", callImage);
    formData.append("gps_screenshot", gpsImage);
    formData.append("house_front", frontImage);
    formData.append("note", note);

    try {
      const res = await fetch("http://localhost:3001/api/evidence/no-show", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("Đã gửi báo cáo cho admin xem xét.");
        onClose();
      } else {
        alert(data.message || "Không thể gửi báo cáo.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối server!");
    }

    setLoading(false);
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>📣 Báo cáo khách không có mặt</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="text-muted">
          Vui lòng upload 4 hình ảnh dưới đây để admin xác minh NO-SHOW.
        </p>

        <label>1. Ảnh số nhà *</label>
        <input type="file" accept="image/*" className="form-control"
          onChange={(e) => handleFileChange(e, setHouseNumber)} />

        <label className="mt-3">2. Ảnh cuộc gọi nhỡ *</label>
        <input type="file" accept="image/*" className="form-control"
          onChange={(e) => handleFileChange(e, setCallImage)} />

        <label className="mt-3">3. Ảnh GPS hiện tại *</label>
        <input type="file" accept="image/*" className="form-control"
          onChange={(e) => handleFileChange(e, setGpsImage)} />

        <label className="mt-3">4. Ảnh toàn cảnh cửa nhà *</label>
        <input type="file" accept="image/*" className="form-control"
          onChange={(e) => handleFileChange(e, setFrontImage)} />

        <label className="mt-3">Ghi chú (tuỳ chọn)</label>
        <textarea
          className="form-control"
          rows={3}
          placeholder="Ví dụ: Tôi đến đúng giờ nhưng gọi nhiều lần khách không nghe máy..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
        <Button variant="warning" onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang gửi..." : "📣 Gửi báo cáo"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NoShowReportModal;
