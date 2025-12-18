"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../../services/api"
import { showToast } from "../../components/common/CustomToast"

export default function NoShowReportPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem("user"))
  const taskerId = user?.user_id

  const [houseNumber, setHouseNumber] = useState(null)
  const [callImage, setCallImage] = useState(null)
  const [gpsImage, setGpsImage] = useState(null)
  const [frontImage, setFrontImage] = useState(null)
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)

  // Modal xác nhận
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const pick = (e, set) => set(e.target.files?.[0] || null)

  // 🟡 Thay đổi: submit thật sự chỉ diễn ra sau khi nhấn "Xác nhận"
  const submitReport = async () => {
    if (!houseNumber || !callImage || !gpsImage || !frontImage) {
      showToast.warning("Vui lòng upload đủ 4 ảnh.")
      return
    }

    try {
      setLoading(true)

      const form = new FormData()
      form.append("booking_id", bookingId)
      form.append("tasker_id", taskerId)
      form.append("house_number", houseNumber)
      form.append("call_screenshot", callImage)
      form.append("gps_screenshot", gpsImage)
      form.append("house_front", frontImage)
      form.append("note", note)

      const res = await api.post("/evidence/no-show", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (res?.data?.success) {
        showToast.success("📤 Gửi báo cáo thành công!")
        navigate(-1)
      } else {
        showToast.error(res?.data?.message || "Không thể gửi báo cáo.")
      }
    } catch (e) {
      console.error(e)
      showToast.error("Lỗi kết nối server.")
    } finally {
      setLoading(false)
      setShowConfirmModal(false)
    }
  }

  return (
    <>
      <style>{`
      .cancel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
      }

      .cancel-box {
          background: white;
          padding: 28px;
          border-radius: 12px;
          max-width: 480px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          animation: slideIn 0.25s ease;
      }

      @keyframes slideIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
      }
      `}</style>

      <div className="container py-4 mt-3" style={{ maxWidth: 680 }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
            }}
          >
            <span style={{ fontSize: 28 }}>📣</span>
          </div>
          <h3 className="fw-bold mb-2" style={{ color: "#1f2937" }}>
            Báo cáo khách không có mặt
          </h3>
          <p className="text-muted mb-2">Cung cấp đầy đủ hình ảnh để đội ngũ admin xác minh nhanh nhất</p>
          <div className="alert alert-warning py-2 d-inline-block" style={{ fontSize: "0.9rem", borderRadius: 8 }}>
            ⚠ Ảnh phải được chụp tại thời điểm bạn tới nhà khách
          </div>
        </div>

        <div className="card shadow border-0" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <div className="mb-4 pb-3" style={{ borderBottom: "1px solid #f3f4f6" }}>
              <label className="d-flex align-items-center gap-2 mb-3 fw-semibold" style={{ color: "#374151" }}>
                <span className="badge bg-primary" style={{ borderRadius: 6 }}>
                  1
                </span>
                <span>Ảnh số nhà</span>
                <span className="text-danger">*</span>
              </label>
              <input
                className="form-control shadow-sm"
                style={{ borderRadius: 8, border: "2px solid #e5e7eb" }}
                type="file"
                disabled={loading}
                accept="image/*"
                onChange={(e) => pick(e, setHouseNumber)}
              />
              {houseNumber && (
                <div className="mt-3" style={{ borderRadius: 10, overflow: "hidden", border: "2px solid #10b981" }}>
                  <img
                    src={URL.createObjectURL(houseNumber) || "/placeholder.svg"}
                    alt="House number preview"
                    style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                  />
                </div>
              )}
            </div>

            <div className="mb-4 pb-3" style={{ borderBottom: "1px solid #f3f4f6" }}>
              <label className="d-flex align-items-center gap-2 mb-3 fw-semibold" style={{ color: "#374151" }}>
                <span className="badge bg-primary" style={{ borderRadius: 6 }}>
                  2
                </span>
                <span>Ảnh cuộc gọi nhỡ</span>
                <span className="text-danger">*</span>
              </label>
              <input
                className="form-control shadow-sm"
                style={{ borderRadius: 8, border: "2px solid #e5e7eb" }}
                type="file"
                disabled={loading}
                accept="image/*"
                onChange={(e) => pick(e, setCallImage)}
              />
              {callImage && (
                <div className="mt-3" style={{ borderRadius: 10, overflow: "hidden", border: "2px solid #10b981" }}>
                  <img
                    src={URL.createObjectURL(callImage) || "/placeholder.svg"}
                    alt="Call screenshot preview"
                    style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                  />
                </div>
              )}
            </div>

            <div className="mb-4 pb-3" style={{ borderBottom: "1px solid #f3f4f6" }}>
              <label className="d-flex align-items-center gap-2 mb-3 fw-semibold" style={{ color: "#374151" }}>
                <span className="badge bg-primary" style={{ borderRadius: 6 }}>
                  3
                </span>
                <span>Ảnh GPS</span>
                <span className="text-danger">*</span>
              </label>
              <input
                className="form-control shadow-sm"
                style={{ borderRadius: 8, border: "2px solid #e5e7eb" }}
                type="file"
                disabled={loading}
                accept="image/*"
                onChange={(e) => pick(e, setGpsImage)}
              />
              {gpsImage && (
                <div
                  className="mt-3 bg-light"
                  style={{ borderRadius: 10, overflow: "hidden", border: "2px solid #10b981" }}
                >
                  <img
                    src={URL.createObjectURL(gpsImage) || "/placeholder.svg"}
                    alt="GPS screenshot preview"
                    style={{ width: "100%", height: 200, objectFit: "contain", display: "block" }}
                  />
                </div>
              )}
            </div>

            <div className="mb-4 pb-3" style={{ borderBottom: "1px solid #f3f4f6" }}>
              <label className="d-flex align-items-center gap-2 mb-3 fw-semibold" style={{ color: "#374151" }}>
                <span className="badge bg-primary" style={{ borderRadius: 6 }}>
                  4
                </span>
                <span>Ảnh mặt tiền nhà</span>
                <span className="text-danger">*</span>
              </label>
              <input
                className="form-control shadow-sm"
                style={{ borderRadius: 8, border: "2px solid #e5e7eb" }}
                type="file"
                disabled={loading}
                accept="image/*"
                onChange={(e) => pick(e, setFrontImage)}
              />
              {frontImage && (
                <div className="mt-3" style={{ borderRadius: 10, overflow: "hidden", border: "2px solid #10b981" }}>
                  <img
                    src={URL.createObjectURL(frontImage) || "/placeholder.svg"}
                    alt="House front preview"
                    style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                  />
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="d-flex align-items-center gap-2 mb-3 fw-semibold" style={{ color: "#374151" }}>
                <span>📝</span>
                <span>Ghi chú (tuỳ chọn)</span>
              </label>
              <textarea
                className="form-control shadow-sm"
                style={{ borderRadius: 10, border: "2px solid #e5e7eb", resize: "none" }}
                rows={3}
                disabled={loading}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Tôi đã tới đúng giờ nhưng không ai mở cửa..."
              />
            </div>

            <div className="d-flex justify-content-end gap-3 mt-4 pt-3" style={{ borderTop: "2px solid #f3f4f6" }}>
              <button
                className="btn btn-outline-secondary px-4 py-2 fw-semibold"
                style={{ borderRadius: 10, borderWidth: 2 }}
                disabled={loading}
                onClick={() => navigate(-1)}
              >
                ⬅ Quay lại
              </button>

              <button
                className="btn btn-warning px-4 py-2 fw-semibold shadow-sm"
                style={{ borderRadius: 10 }}
                disabled={loading}
                onClick={() => setShowConfirmModal(true)}
              >
                {loading ? "Đang gửi..." : "📣 Gửi báo cáo"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🟡 Modal XÁC NHẬN GỬI */}
      {showConfirmModal && (
        <div className="cancel-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="cancel-box" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-3">
              <div
                className="d-inline-flex align-items-center justify-content-center mb-2"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                }}
              >
                <span style={{ fontSize: 28 }}>📤</span>
              </div>
              <h5 className="fw-bold mb-0">Xác nhận gửi báo cáo</h5>
            </div>

            <div className="alert alert-danger mb-3" style={{ borderRadius: 10, borderLeft: "4px solid #dc3545" }}>
              <strong>⚠ Cảnh báo quan trọng:</strong>
              <p className="mt-2 mb-0 small">
                Nếu báo cáo không trung thực, cố ý làm sai lệch thông tin, hoặc cung cấp hình ảnh không đúng thời điểm –
                hệ thống sẽ <strong>trừ ngay 30 điểm uy tín</strong> và ghi nhận vi phạm vào hồ sơ tài khoản. Vi phạm
                nhiều lần có thể dẫn đến
                <strong> khóa tài khoản tạm thời hoặc vĩnh viễn</strong>.
              </p>
            </div>

            <p className="text-muted small mb-2">Vui lòng kiểm tra lại các ảnh và thông tin trước khi gửi.</p>

            <p className="fw-semibold text-danger text-center mb-4">
              Bạn có chắc chắn muốn gửi báo cáo này không?
            </p>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-light fw-semibold px-4 py-2"
                style={{ borderRadius: 8 }}
                onClick={() => setShowConfirmModal(false)}
              >
                Đóng
              </button>

              <button
                className="btn btn-warning fw-semibold px-4 py-2 shadow-sm"
                style={{ borderRadius: 8 }}
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
  )
}
