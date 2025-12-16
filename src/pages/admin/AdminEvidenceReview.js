"use client"

import { useEffect, useState } from "react"
import { Table, Button, Spinner, Badge } from "react-bootstrap"
import api from "./../../services/api"
import { showToast } from "../../components/common/CustomToast"
import "../../components/common/CustomToast.css"

export default function AdminEvidenceReview() {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState([])
  const [selected, setSelected] = useState(null)

  const fetchData = async () => {
    setLoading(true)

    try {
      const res = await api.get("/evidence/pending")
      if (res.data.success) {
        setList(res.data.data)
      }
    } catch (err) {
      showToast.error("Không thể tải danh sách báo cáo.")
      console.error("Fetch pending evidence:", err)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f8f9fa" }}>
      <div className="container py-5" style={{ maxWidth: "1200px" }}>
        {/* Header Section */}
        <div className="mb-5">
          <div className="d-flex align-items-center mb-3">
            <div
              className="d-flex align-items-center justify-content-center me-3"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#0d6efd",
                color: "white",
              }}
            >
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
              </svg>
            </div>
            <div>
              <h1 className="mb-1" style={{ fontSize: "28px", fontWeight: "700", color: "#212529" }}>
                Báo cáo NO-SHOW
              </h1>
              <p className="mb-0" style={{ fontSize: "15px", color: "#6c757d" }}>
                Kiểm tra và xác nhận khách có thực sự không có mặt
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div
          className="card border-0 shadow-sm"
          style={{
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5" style={{ padding: "80px 20px" }}>
                <Spinner animation="border" variant="primary" style={{ width: "48px", height: "48px" }} />
                <p className="mt-4 mb-0" style={{ fontSize: "15px", color: "#6c757d", fontWeight: "500" }}>
                  Đang tải dữ liệu...
                </p>
              </div>
            ) : list.length === 0 ? (
              <div className="text-center py-5" style={{ padding: "80px 20px" }}>
                <div
                  className="d-inline-flex align-items-center justify-content-center mb-4"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <svg width="40" height="40" fill="#adb5bd" viewBox="0 0 16 16">
                    <path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3zm-8.322.12C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139z" />
                  </svg>
                </div>
                <h5 className="mb-2" style={{ fontSize: "18px", fontWeight: "600", color: "#212529" }}>
                  Không có báo cáo nào
                </h5>
                <p className="mb-0" style={{ fontSize: "14px", color: "#6c757d" }}>
                  Hiện tại không có báo cáo nào đang chờ duyệt
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle mb-0" style={{ fontSize: "14px" }}>
                  <thead style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
                    <tr>
                      <th
                        className="text-muted fw-semibold"
                        style={{
                          width: "60px",
                          padding: "16px 20px",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        #
                      </th>
                      <th
                        className="text-muted fw-semibold"
                        style={{
                          padding: "16px 20px",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Mã Booking
                      </th>
                      <th
                        className="text-muted fw-semibold"
                        style={{
                          padding: "16px 20px",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Tasker
                      </th>
                      <th
                        className="text-muted fw-semibold"
                        style={{
                          padding: "16px 20px",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Ngày gửi
                      </th>
                      <th
                        className="text-muted fw-semibold"
                        style={{
                          padding: "16px 20px",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Trạng thái
                      </th>
                      <th
                        className="text-muted fw-semibold"
                        style={{
                          width: "160px",
                          padding: "16px 20px",
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      ></th>
                    </tr>
                  </thead>

                  <tbody>
                    {list.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="text-muted" style={{ padding: "20px" }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: "20px" }}>
                          <span
                            className="fw-semibold"
                            style={{
                              color: "#0d6efd",
                              fontSize: "14px",
                            }}
                          >
                            {item.booking_id}
                          </span>
                        </td>
                        <td style={{ padding: "20px", color: "#495057" }}>{item.tasker_id}</td>
                        <td className="text-muted" style={{ padding: "20px", fontSize: "13px" }}>
                          {new Date(item.created_at).toLocaleString("vi-VN")}
                        </td>
                        <td style={{ padding: "20px" }}>
                          <Badge
                            bg="warning"
                            text="dark"
                            style={{
                              padding: "6px 14px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            Chờ duyệt
                          </Badge>
                        </td>
                        <td style={{ padding: "20px" }}>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelected(item)}
                            style={{
                              padding: "8px 20px",
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: "600",
                            }}
                          >
                            Xem chi tiết
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <EvidenceDetailModal
          review={selected}
          onClose={() => {
            setSelected(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function EvidenceDetailModal({ review, onClose }) {
  const approve = async () => {
    try {
      const res = await api.post(`/evidence/${review.id}/approve`)
      if (res.data.success) {
        showToast.success("Duyệt NO-SHOW thành công!")
      } else {
        showToast.error(res.data.message || "Không thể duyệt báo cáo.")
      }
    } catch (e) {
      showToast.error("Lỗi khi duyệt báo cáo.")
    }
    onClose()
  }

  const reject = async () => {
    try {
      const res = await api.post(`/evidence/${review.id}/reject`)
      if (res.data.success) {
        showToast.warning("Đã từ chối báo cáo.")
      } else {
        showToast.error(res.data.message || "Không thể từ chối báo cáo.")
      }
    } catch (e) {
      showToast.error("Lỗi khi từ chối báo cáo.")
    }
    onClose()
  }

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "900px" }}
      >
        <div
          className="modal-content border-0 shadow-lg"
          style={{
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          {/* Modal Header */}
          <div
            className="modal-header border-0"
            style={{
              padding: "24px 32px",
              backgroundColor: "white",
              borderBottom: "1px solid #e9ecef",
            }}
          >
            <div>
              <h5 className="modal-title mb-1" style={{ fontSize: "20px", fontWeight: "700", color: "#212529" }}>
                Chi tiết báo cáo NO-SHOW
              </h5>
              <p className="mb-0" style={{ fontSize: "13px", color: "#6c757d" }}>
                Xem xét bằng chứng và đưa ra quyết định
              </p>
            </div>
            <button
              className="btn-close"
              onClick={onClose}
              style={{
                fontSize: "12px",
              }}
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body" style={{ padding: "32px", backgroundColor: "#f8f9fa" }}>
            {/* Info Card */}
            <div
              className="card border-0 shadow-sm mb-4"
              style={{
                borderRadius: "12px",
                backgroundColor: "white",
              }}
            >
              <div className="card-body" style={{ padding: "24px" }}>
                <div className="row g-4">
                  <div className="col-md-4">
                    <div className="d-flex flex-column">
                      <span
                        className="text-muted mb-2"
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Mã Booking
                      </span>
                      <span style={{ fontSize: "15px", fontWeight: "600", color: "#212529" }}>{review.booking_id}</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex flex-column">
                      <span
                        className="text-muted mb-2"
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Tasker
                      </span>
                      <span style={{ fontSize: "15px", fontWeight: "600", color: "#212529" }}>{review.tasker_id}</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex flex-column">
                      <span
                        className="text-muted mb-2"
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Thời gian gửi
                      </span>
                      <span style={{ fontSize: "15px", fontWeight: "600", color: "#212529" }}>
                        {new Date(review.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Section */}
            <div className="mb-4">
              <h6
                className="mb-3"
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#212529",
                }}
              >
                Ảnh bằng chứng
              </h6>

              <div className="row g-3">
                <div className="col-md-6">
                  <div
                    className="card border-0 shadow-sm h-100"
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      backgroundColor: "white",
                    }}
                  >
                    <div className="card-body p-0">
                      <div
                        style={{
                          padding: "12px 16px",
                          backgroundColor: "#f8f9fa",
                          borderBottom: "1px solid #e9ecef",
                        }}
                      >
                        <p className="mb-0" style={{ fontSize: "13px", fontWeight: "600", color: "#495057" }}>
                          📍 Ảnh số nhà
                        </p>
                      </div>
                      <div style={{ padding: "12px" }}>
                        <img
                          src={review.house_number_img || "/placeholder.svg"}
                          alt="Ảnh số nhà"
                          className="img-fluid"
                          style={{
                            width: "100%",
                            height: "240px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            backgroundColor: "#f8f9fa",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div
                    className="card border-0 shadow-sm h-100"
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      backgroundColor: "white",
                    }}
                  >
                    <div className="card-body p-0">
                      <div
                        style={{
                          padding: "12px 16px",
                          backgroundColor: "#f8f9fa",
                          borderBottom: "1px solid #e9ecef",
                        }}
                      >
                        <p className="mb-0" style={{ fontSize: "13px", fontWeight: "600", color: "#495057" }}>
                          📞 Cuộc gọi nhỡ
                        </p>
                      </div>
                      <div style={{ padding: "12px" }}>
                        <img
                          src={review.call_screenshot_img || "/placeholder.svg"}
                          alt="Cuộc gọi nhỡ"
                          className="img-fluid"
                          style={{
                            width: "100%",
                            height: "240px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            backgroundColor: "#f8f9fa",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div
                    className="card border-0 shadow-sm h-100"
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      backgroundColor: "white",
                    }}
                  >
                    <div className="card-body p-0">
                      <div
                        style={{
                          padding: "12px 16px",
                          backgroundColor: "#f8f9fa",
                          borderBottom: "1px solid #e9ecef",
                        }}
                      >
                        <p className="mb-0" style={{ fontSize: "13px", fontWeight: "600", color: "#495057" }}>
                          🗺️ Ảnh GPS
                        </p>
                      </div>
                      <div style={{ padding: "12px" }}>
                        <img
                          src={review.gps_screenshot_img || "/placeholder.svg"}
                          alt="Ảnh GPS"
                          className="img-fluid"
                          style={{
                            width: "100%",
                            height: "240px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            backgroundColor: "#f8f9fa",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div
                    className="card border-0 shadow-sm h-100"
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      backgroundColor: "white",
                    }}
                  >
                    <div className="card-body p-0">
                      <div
                        style={{
                          padding: "12px 16px",
                          backgroundColor: "#f8f9fa",
                          borderBottom: "1px solid #e9ecef",
                        }}
                      >
                        <p className="mb-0" style={{ fontSize: "13px", fontWeight: "600", color: "#495057" }}>
                          🏠 Ảnh mặt tiền
                        </p>
                      </div>
                      <div style={{ padding: "12px" }}>
                        <img
                          src={review.house_front_img || "/placeholder.svg"}
                          alt="Ảnh mặt tiền"
                          className="img-fluid"
                          style={{
                            width: "100%",
                            height: "240px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            backgroundColor: "#f8f9fa",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {review.note && (
              <div>
                <h6
                  className="mb-3"
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#212529",
                  }}
                >
                  Ghi chú thêm
                </h6>
                <div
                  className="card border-0 shadow-sm"
                  style={{
                    borderRadius: "12px",
                    backgroundColor: "white",
                  }}
                >
                  <div className="card-body" style={{ padding: "20px" }}>
                    <p className="mb-0" style={{ fontSize: "14px", color: "#495057", lineHeight: "1.6" }}>
                      {review.note}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            className="modal-footer border-0"
            style={{
              padding: "20px 32px",
              backgroundColor: "white",
              borderTop: "1px solid #e9ecef",
              gap: "12px",
            }}
          >
            <Button
              variant="outline-secondary"
              onClick={onClose}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                border: "2px solid #dee2e6",
              }}
            >
              Đóng
            </Button>
            <Button
              variant="danger"
              onClick={reject}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Từ chối
            </Button>
            <Button
              variant="primary"
              onClick={approve}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Duyệt
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
