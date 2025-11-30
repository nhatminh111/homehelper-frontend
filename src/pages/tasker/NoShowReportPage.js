import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function NoShowReportPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const taskerId = user?.user_id;

  const [houseNumber, setHouseNumber] = useState(null);
  const [callImage, setCallImage] = useState(null);
  const [gpsImage, setGpsImage] = useState(null);
  const [frontImage, setFrontImage] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const pick = (e, set) => set(e.target.files?.[0] || null);

  const handleSubmit = async () => {
    if (!houseNumber || !callImage || !gpsImage || !frontImage) {
      alert("Vui lòng upload đủ 4 ảnh.");
      return;
    }

    if (!bookingId) {
      alert("Thiếu booking_id — URL sai hoặc điều hướng sai.");
      return;
    }

    if (!taskerId) {
      alert("Không tìm thấy tasker_id — bạn chưa đăng nhập?");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("booking_id", bookingId);
      form.append("tasker_id", taskerId);
      form.append("house_number", houseNumber);
      form.append("call_screenshot", callImage);
      form.append("gps_screenshot", gpsImage);
      form.append("house_front", frontImage);
      form.append("note", note);

      const res = await api.post("/evidence/no-show", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res?.data?.success) {
        alert("Gửi báo cáo thành công!");
        navigate(-1); // quay lại trang trước
      } else {
        alert(res?.data?.message || "Không thể gửi báo cáo.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 600 }}>
      <h3 className="fw-bold mb-3">📣 Báo cáo khách không có mặt</h3>
      <p className="text-muted">
        Vui lòng upload đầy đủ hình ảnh để admin xác minh.
      </p>

      <label className="form-label mt-3">1) Ảnh số nhà *</label>
      <input className="form-control" type="file" disabled={loading}
             accept="image/*" onChange={(e) => pick(e, setHouseNumber)} />

      <label className="form-label mt-3">2) Ảnh cuộc gọi nhỡ *</label>
      <input className="form-control" type="file" disabled={loading}
             accept="image/*" onChange={(e) => pick(e, setCallImage)} />

      <label className="form-label mt-3">3) Ảnh GPS *</label>
      <input className="form-control" type="file" disabled={loading}
             accept="image/*" onChange={(e) => pick(e, setGpsImage)} />

      <label className="form-label mt-3">4) Ảnh mặt tiền nhà *</label>
      <input className="form-control" type="file" disabled={loading}
             accept="image/*" onChange={(e) => pick(e, setFrontImage)} />

      <label className="form-label mt-3">Ghi chú (tuỳ chọn)</label>
      <textarea
        className="form-control"
        rows={3}
        disabled={loading}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="d-flex gap-2 mt-4">
        <button
          className="btn btn-secondary"
          disabled={loading}
          onClick={() => navigate(-1)}
        >
          Quay lại
        </button>

        <button
          className="btn btn-warning"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? "Đang gửi..." : "📣 Gửi báo cáo"}
        </button>
      </div>
    </div>
  );
}
