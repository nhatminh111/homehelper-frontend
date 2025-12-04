import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { showToast } from "../../components/common/CustomToast";

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

  // Modal xác nhận
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const pick = (e, set) => set(e.target.files?.[0] || null);

  // 🟡 Thay đổi: submit thật sự chỉ diễn ra sau khi nhấn "Xác nhận"
  const submitReport = async () => {
    if (!houseNumber || !callImage || !gpsImage || !frontImage) {
      showToast.warning("Vui lòng upload đủ 4 ảnh.");
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
        showToast.success("📤 Gửi báo cáo thành công!");
        navigate(-1);
      } else {
        showToast.error(res?.data?.message || "Không thể gửi báo cáo.");
      }
    } catch (e) {
      console.error(e);
      showToast.error("Lỗi kết nối server.");
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      <style>{`
      .cancel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.45);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
      }

      .cancel-box {
          background: white;
          padding: 24px;
          border-radius: 12px;
          max-width: 450px;
          width: 90%;
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          animation: fadeIn 0.25s ease;
      }

      @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
      }
      `}</style>

      <div className="container py-4 mt-4" style={{ maxWidth: 650 }}>
        <div className="text-center mb-4">
          <h3 className="fw-bold">📣 Báo cáo khách không có mặt</h3>
          <p className="text-muted mb-1">
            Cung cấp đầy đủ hình ảnh để đội ngũ admin xác minh nhanh nhất.
          </p>
          <p className="text-danger small">
            ⚠ Ảnh phải được chụp tại thời điểm bạn tới nhà khách.
          </p>
        </div>

        <div className="card shadow-sm border-0 p-4 rounded-4">
          {/* 1. Ảnh số nhà */}
          <div className="mb-4">
            <label className="fw-semibold mb-2">
              1) Ảnh số nhà <span className="text-danger">*</span>
            </label>
            <input
              className="form-control"
              type="file"
              disabled={loading}
              accept="image/*"
              onChange={(e) => pick(e, setHouseNumber)}
            />
            {houseNumber && (
              <img
                src={URL.createObjectURL(houseNumber)}
                className="mt-3 rounded-3"
                style={{ width: "100%", maxHeight: 250, objectFit: "cover" }}
              />
            )}
          </div>

          {/* 2. Ảnh cuộc gọi */}
          <div className="mb-4">
            <label className="fw-semibold mb-2">
              2) Ảnh cuộc gọi nhỡ <span className="text-danger">*</span>
            </label>
            <input
              className="form-control"
              type="file"
              disabled={loading}
              accept="image/*"
              onChange={(e) => pick(e, setCallImage)}
            />
            {callImage && (
              <img
                src={URL.createObjectURL(callImage)}
                className="mt-3 rounded-3"
                style={{ width: "100%", maxHeight: 250, objectFit: "cover" }}
              />
            )}
          </div>

          {/* 3. GPS */}
          <div className="mb-4">
            <label className="fw-semibold mb-2">
              3) Ảnh GPS <span className="text-danger">*</span>
            </label>
            <input
              className="form-control"
              type="file"
              disabled={loading}
              accept="image/*"
              onChange={(e) => pick(e, setGpsImage)}
            />
            {gpsImage && (
              <img
                src={URL.createObjectURL(gpsImage)}
                className="mt-3 rounded-3"
                style={{ width: "100%", maxHeight: 250, objectFit: "contain" }}
              />
            )}
          </div>

          {/* 4. Mặt tiền */}
          <div className="mb-4">
            <label className="fw-semibold mb-2">
              4) Ảnh mặt tiền nhà <span className="text-danger">*</span>
            </label>
            <input
              className="form-control"
              type="file"
              disabled={loading}
              accept="image/*"
              onChange={(e) => pick(e, setFrontImage)}
            />
            {frontImage && (
              <img
                src={URL.createObjectURL(frontImage)}
                className="mt-3 rounded-3"
                style={{ width: "100%", maxHeight: 250, objectFit: "cover" }}
              />
            )}
          </div>

          {/* Note */}
          <div className="mb-3">
            <label className="fw-semibold mb-2">Ghi chú (tuỳ chọn)</label>
            <textarea
              className="form-control rounded-3"
              rows={3}
              disabled={loading}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Tôi đã tới đúng giờ nhưng không ai mở cửa..."
            />
          </div>

          {/* Buttons */}
          <div className="d-flex justify-content-end gap-3 mt-4">
            <button
              className="btn btn-outline-secondary px-4 py-2 rounded-3"
              disabled={loading}
              onClick={() => navigate(-1)}
            >
              ⬅ Quay lại
            </button>

            <button
              className="btn btn-warning px-4 py-2 rounded-3 fw-semibold"
              disabled={loading}
              onClick={() => setShowConfirmModal(true)}
            >
              {loading ? "Đang gửi..." : "📣 Gửi báo cáo"}
            </button>
          </div>
        </div>
      </div>

      {/* 🟡 Modal XÁC NHẬN GỬI */}
      {showConfirmModal && (
        <div className="cancel-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="cancel-box" onClick={(e) => e.stopPropagation()}>
            <h5 className="fw-bold mb-3">📤 Xác nhận gửi báo cáo</h5>
            <div className="alert alert-danger rounded-3 mt-3">
              <strong>⚠ Cảnh báo quan trọng:</strong>
              <p className="mt-2 mb-0">
                Nếu báo cáo không trung thực, cố ý làm sai lệch thông tin, hoặc cung cấp hình ảnh
                không đúng thời điểm – hệ thống sẽ <strong>trừ ngay 30 điểm uy tín</strong> và
                ghi nhận vi phạm vào hồ sơ tài khoản. Vi phạm nhiều lần có thể dẫn đến
                <strong> khóa tài khoản tạm thời hoặc vĩnh viễn</strong>.
              </p>
            </div>

            <p className="text-muted">
              Vui lòng kiểm tra lại các ảnh và thông tin trước khi gửi.
            </p>

            <p className="fw-semibold text-danger">
              Bạn có chắc chắn muốn gửi báo cáo No-Show này không?
            </p>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                className="btn btn-light fw-semibold px-4 py-2"
                onClick={() => setShowConfirmModal(false)}
              >
                Đóng
              </button>

              <button
                className="btn btn-warning fw-semibold px-4 py-2"
                disabled={loading}
                onClick={submitReport}
              >
                {loading ? "Đang gửi..." : "Xác nhận gửi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
