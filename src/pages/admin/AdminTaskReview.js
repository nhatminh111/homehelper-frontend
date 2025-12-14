import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import api from "../../services/api"
import { showToast } from "../../components/common/CustomToast"

export default function AdminReviewPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(null)
  const [complaint, setComplaint] = useState(null)
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState("")
  const [timers, setTimers] = useState({})

  const mapComplaintType = (t) => {
    switch (t) {
      case "not_quality":
        return "Công việc không đạt yêu cầu"
      case "fake_time":
        return "Gian lận thời gian / Ghi sai giờ"
      default:
        return "Khác"
    }
  }

  const handleResolveComplaint = async (action) => {
    if (!complaint) return

    try {
      const url =
        action === "approved"
          ? `/bookings/${complaint.booking_id}/admin-resolve`
          : `/bookings/${complaint.booking_id}/admin-resolve`

      const res = await api.patch(url, { decision: action })

      console.log("RESOLVE RESPONSE:", res)

      if (res.data?.success === true) {
        showToast.success(action === "approved" ? "Đã duyệt khiếu nại" : "Đã từ chối khiếu nại")
        fetchReview()
      } else {
        showToast.error(res.data?.message || "Xử lý thất bại")
      }
    } catch (err) {
      console.error("[Admin FE] Resolve complaint error:", err)
      showToast.error("Lỗi xử lý khiếu nại")
    }
  }

  const formatTime = (ms) => {
    if (!ms) return "0s"
    const sec = Math.floor(ms / 1000)
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}m ${s}s`
  }

  useEffect(() => {
    fetchReview()
  }, [id])

  async function fetchReview() {
    setLoading(true)
    try {
      console.log("[Admin FE] id:", id)
      const res = await api.get(`/bookings/${id}/admin-review`)
      console.log("📦 [AdminReview][RAW RESPONSE]:", res.data)

      if (!res.data) {
        console.log("❌ Không có res.data!")
      }
      if (!res.data.tasks) {
        console.log("❌ res.data.tasks KHÔNG tồn tại!")
      } else {
        console.log(`📝 Số lượng tasks nhận được: ${res.data.tasks.length}`)
        console.log("🔍 Task mẫu:", res.data.tasks[0])
      }

      setBooking(res.data.booking)
      setComplaint(res.data.complaint)
      setTasks(res.data.tasks)
    } catch (err) {
      console.log("[Admin FE] ERROR:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted fw-medium">Đang tải...</p>
          </div>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="alert alert-danger border-danger shadow-sm" role="alert" style={{ maxWidth: "500px" }}>
            <div className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-4"></i>
              <div className="text-danger fw-medium">{error}</div>
            </div>
          </div>
        </div>
      </div>
    )

  if (!booking)
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="alert alert-secondary border-secondary shadow-sm" role="alert" style={{ maxWidth: "500px" }}>
            <div className="text-center">
              <i className="bi bi-inbox fs-1 text-muted"></i>
              <p className="mt-3 mb-0 fw-medium text-muted">Không tìm thấy booking.</p>
            </div>
          </div>
        </div>
      </div>
    )

  return (
    <div className="bg-light min-vh-100 py-4">
      <div className="container" style={{ maxWidth: "1200px" }}>
        {/* Header Section */}
        <div className="mb-4">
          <h1 className="display-6 fw-bold text-dark mb-2">Admin Review</h1>
          <p className="text-muted mb-0">
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2">Booking #{id}</span>
          </p>
        </div>

        {/* Complaint Section */}
        {complaint ? (
          <div className="card shadow-sm mb-4 border-0 overflow-hidden">
            <div className="card-header border-0 bg-danger bg-gradient text-white py-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-white bg-opacity-25 rounded p-2">
                  <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                </div>
                <h4 className="mb-0 fw-semibold">Khiếu nại của khách hàng</h4>
              </div>
            </div>

            <div className="card-body p-4">
              <div className="row g-4 mb-3">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="text-muted small mb-1">Loại khiếu nại</label>
                    <p className="fw-semibold text-dark mb-0">{mapComplaintType(complaint.type)}</p>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="text-muted small mb-1">Trạng thái</label>
                    <div>
                      <span
                        className={`badge ${complaint.status === "pending"
                            ? "bg-warning"
                            : complaint.status === "approved"
                              ? "bg-success"
                              : "bg-secondary"
                          } px-3 py-2`}
                      >
                        {complaint.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="text-muted small mb-2">Mô tả chi tiết</label>
                <div className="bg-light rounded p-3 border">
                  <p className="mb-0 text-dark">{complaint.description}</p>
                </div>
              </div>

              {complaint.image_urls?.length > 0 && (
                <div className="mt-4">
                  <label className="text-dark fw-semibold mb-3">Ảnh khiếu nại ({complaint.image_urls.length})</label>
                  <div className="row g-3">
                    {complaint.image_urls.map((url, idx) => (
                      <div key={idx} className="col-6 col-sm-4 col-lg-3">
                        <div
                          className="position-relative rounded overflow-hidden border shadow-sm"
                          style={{ paddingBottom: "100%" }}
                        >
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Complaint ${idx + 1}`}
                            className="position-absolute top-0 start-0 w-100 h-100"
                            style={{ objectFit: "cover" }}
                          />
                          <div className="position-absolute top-0 start-0 m-2">
                            <span className="badge bg-dark bg-opacity-75">#{idx + 1}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="alert alert-info border-0 shadow-sm mb-4 d-flex align-items-center gap-3">
            <i className="bi bi-info-circle-fill fs-4"></i>
            <span className="fw-medium">Không có khiếu nại cho booking này</span>
          </div>
        )}

        {/* Job Done Section */}
        <div className="card shadow-sm mb-4 border-0 overflow-hidden">
          <div className="card-header border-0 bg-primary bg-gradient text-white py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white bg-opacity-25 rounded p-2">
                <i className="bi bi-clipboard-check-fill fs-5"></i>
              </div>
              <h4 className="mb-0 fw-semibold">Công việc Tasker đã thực hiện</h4>
            </div>
          </div>

          <div className="card-body p-4">
            {/* Before Photos */}
            <div className="mb-5">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="bg-warning bg-opacity-10 rounded p-2">
                  <i className="bi bi-camera-fill text-warning"></i>
                </div>
                <h5 className="mb-0 fw-semibold">Ảnh Before</h5>
              </div>

              {booking.before_photos?.length > 0 ? (
                <div className="row g-3">
                  {booking.before_photos.map((url, idx) => (
                    <div key={idx} className="col-6 col-sm-4 col-lg-3">
                      <div
                        className="position-relative rounded overflow-hidden border shadow-sm"
                        style={{ paddingBottom: "100%" }}
                      >
                        <img
                          src={url || "/placeholder.svg"}
                          alt={`Before ${idx + 1}`}
                          className="position-absolute top-0 start-0 w-100 h-100"
                          style={{ objectFit: "cover" }}
                        />
                        <div className="position-absolute top-0 start-0 m-2">
                          <span className="badge bg-dark bg-opacity-75">#{idx + 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-light border rounded p-5 text-center">
                  <i className="bi bi-image text-muted fs-1 mb-2 d-block"></i>
                  <p className="text-muted mb-0">Không có ảnh before</p>
                </div>
              )}
            </div>

            {/* After Photos */}
            <div className="mb-5">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="bg-success bg-opacity-10 rounded p-2">
                  <i className="bi bi-camera-fill text-success"></i>
                </div>
                <h5 className="mb-0 fw-semibold">Ảnh After</h5>
              </div>

              {booking.after_photos?.length > 0 ? (
                <div className="row g-3">
                  {booking.after_photos.map((url, idx) => (
                    <div key={idx} className="col-6 col-sm-4 col-lg-3">
                      <div
                        className="position-relative rounded overflow-hidden border shadow-sm"
                        style={{ paddingBottom: "100%" }}
                      >
                        <img
                          src={url || "/placeholder.svg"}
                          alt={`After ${idx + 1}`}
                          className="position-absolute top-0 start-0 w-100 h-100"
                          style={{ objectFit: "cover" }}
                        />
                        <div className="position-absolute top-0 start-0 m-2">
                          <span className="badge bg-dark bg-opacity-75">#{idx + 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-light border rounded p-5 text-center">
                  <i className="bi bi-image text-muted fs-1 mb-2 d-block"></i>
                  <p className="text-muted mb-0">Không có ảnh after</p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mb-5">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="bg-info bg-opacity-10 rounded p-2">
                  <i className="bi bi-pencil-square text-info"></i>
                </div>
                <h5 className="mb-0 fw-semibold">Ghi chú của Tasker</h5>
              </div>
              <div className="bg-info bg-opacity-10 border border-info border-opacity-25 rounded p-3">
                <p className="mb-0 text-dark">{booking.notes || "Không có ghi chú."}</p>
              </div>
            </div>

            {/* Checklist */}
            {tasks.length > 0 && (
              <div className="mt-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-primary bg-opacity-10 rounded p-2">
                    <i className="bi bi-list-check text-primary"></i>
                  </div>
                  <h5 className="mb-0 fw-semibold">Checklist & Thời gian thực hiện</h5>
                </div>

                {tasks.map((task, tIndex) => (
                  <div
                    key={task.task_id}
                    className="bg-light border border-dark border-opacity-25 rounded p-4 mb-3"
                  >
                    <h6 className="fw-semibold mb-3 text-dark">
                      Checklist #{tIndex + 1}
                    </h6>

                    <div className="d-flex flex-column gap-2">
                      {task.checklist?.map((item, cIndex) => {
                        const key = `task-${cIndex}`;
                        const elapsed = task.timers?.[key] ?? 0;

                        return (
                          <div
                            key={cIndex}
                            className="bg-white border rounded p-3 d-flex justify-content-between align-items-center shadow-sm"
                          >
                            {/* Left side */}
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "28px", height: "28px" }}
                              >
                                <i className="bi bi-check2 text-success fw-bold"></i>
                              </div>

                              <span className="text-dark fw-medium">{item}</span>
                            </div>

                            {/* Time badge (xài formatTime của Admin!) */}
                            <div className="d-flex align-items-center gap-2">
                              <i className="bi bi-clock text-muted small"></i>
                              <span className="badge bg-secondary bg-opacity-10 text-secondary fw-semibold px-3 py-2">
                                {formatTime(elapsed)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {complaint && complaint.status === "pending" && (
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h5 className="fw-semibold mb-3 text-dark">Xử lý khiếu nại</h5>
              <div className="d-flex flex-wrap gap-3">
                <button
                  className="btn btn-success btn-lg px-4 d-flex align-items-center gap-2 shadow-sm"
                  onClick={() => handleResolveComplaint("approved")}
                >
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Duyệt khiếu nại</span>
                </button>

                <button
                  className="btn btn-danger btn-lg px-4 d-flex align-items-center gap-2 shadow-sm"
                  onClick={() => handleResolveComplaint("rejected")}
                >
                  <i className="bi bi-x-circle-fill"></i>
                  <span>Từ chối khiếu nại</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
