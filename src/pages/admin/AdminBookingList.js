"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "./../../services/api"

export default function AdminBookingsList() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const getStatusColor = (status) => {
    switch (status) {
      case "Đang tiến hành":
        return { bg: "#fff3cd", text: "#856404" } // vàng nhạt

      case "Chờ xử lý":
        return { bg: "#e2e3e5", text: "#6c757d" } // xám

      case "Đã chấp nhận":
        return { bg: "#d1ecf1", text: "#0c5460" } // xanh dương nhạt

      case "Hoàn thành":
        return { bg: "#d4edda", text: "#155724" } // xanh lá

      case "Đã thanh toán":
        return { bg: "#c3e6cb", text: "#155724" } // xanh lá đậm

      case "Hủy":
        return { bg: "#f8d7da", text: "#721c24" } // đỏ

      case "Chờ duyệt báo cáo":
        return { bg: "#fff3cd", text: "#856404" } // vàng

      case "Báo cáo được duyệt":
        return { bg: "#d4edda", text: "#155724" } // xanh lá

      case "Báo cáo bị từ chối":
        return { bg: "#f8d7da", text: "#721c24" } // đỏ

      case "Chờ xác nhận":
        return { bg: "#e2e3e5", text: "#6c757d" } // xám nhạt

      case "Xử lí khiếu nại của khách":
        return { bg: "#fff3cd", text: "#856404" } // vàng cam

      case "Khiếu nại được duyệt":
        return { bg: "#d4edda", text: "#155724" } // xanh lá

      case "Khiếu nại bị từ chối":
        return { bg: "#f8d7da", text: "#721c24" } // đỏ

      default:
        return { bg: "#e2e3e5", text: "#6c757d" } // fallback: xám
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        console.log("[Admin FE] Fetch admin booking list")
        const res = await api.get("/bookings/admin-list")
        setBookings(res.data.data || [])
      } catch (err) {
        console.error("[Admin FE] ERROR:", err)
        setError("Không thể tải danh sách booking")
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="text-muted fs-5">Đang tải danh sách booking...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger d-flex align-items-center shadow-sm" role="alert">
          <svg className="bi flex-shrink-0 me-3" width="24" height="24" fill="currentColor">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
          </svg>
          <div>
            <strong>Lỗi!</strong> {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-2" style={{ color: "#1a1a1a" }}>
          Danh sách Booking
        </h2>
        <p className="text-muted mb-0">Quản lý và theo dõi tất cả các booking trong hệ thống</p>
      </div>

      <div className="card shadow-sm border-0" style={{ borderRadius: "12px", overflow: "hidden" }}>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
                <tr>
                  <th
                    className="py-3 px-4 fw-semibold text-muted"
                    style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    ID
                  </th>
                  <th
                    className="py-3 px-4 fw-semibold text-muted"
                    style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Khách
                  </th>
                  <th
                    className="py-3 px-4 fw-semibold text-muted"
                    style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Tasker
                  </th>
                  <th
                    className="py-3 px-4 fw-semibold text-muted"
                    style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Dịch vụ
                  </th>
                  <th
                    className="py-3 px-4 fw-semibold text-muted"
                    style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Thời gian
                  </th>
                  <th
                    className="py-3 px-4 fw-semibold text-muted"
                    style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Trạng thái
                  </th>
                  <th
                    className="py-3 px-4 fw-semibold text-muted text-end"
                    style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >

                  </th>
                </tr>
              </thead>

              <tbody>
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="d-flex flex-column align-items-center">
                        <svg width="64" height="64" fill="#dee2e6" className="mb-3" viewBox="0 0 16 16">
                          <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                          <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
                        </svg>
                        <p className="text-muted fs-5 mb-0">Không có booking nào</p>
                        <p className="text-muted small">Danh sách booking sẽ hiển thị tại đây</p>
                      </div>
                    </td>
                  </tr>
                )}

                {bookings.map((b) => (
                  <tr key={b.booking_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td className="px-4 py-3">
                      <span
                        className="badge bg-light text-dark border"
                        style={{ fontSize: "0.85rem", fontWeight: "600" }}
                      >
                        #{b.booking_id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center">
                        <div
                          className="me-2"
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "#e3f2fd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#1976d2",
                          }}
                        >
                          {(b.customer_name || b.customer_id)?.charAt(0).toUpperCase()}
                        </div>
                        <span className="fw-medium">{b.customer_name || b.customer_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center">
                        <div
                          className="me-2"
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "#f3e5f5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#7b1fa2",
                          }}
                        >
                          {(b.tasker_name || b.tasker_id)?.charAt(0).toUpperCase()}
                        </div>
                        <span className="fw-medium">{b.tasker_name || b.tasker_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted">{b.service_name || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                        {b.booking_time?.slice(0, 16).replace("T", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: getStatusColor(b.status).bg,
                          color: getStatusColor(b.status).text,
                          padding: "6px 12px",
                          fontSize: "0.8rem",
                          fontWeight: "500",
                          borderRadius: "6px",
                        }}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        className="btn btn-primary btn-sm shadow-sm"
                        style={{
                          borderRadius: "6px",
                          padding: "6px 16px",
                          fontWeight: "500",
                          fontSize: "0.875rem",
                        }}
                        onClick={() => navigate(`/admin/admin-review/${b.booking_id}`)}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
