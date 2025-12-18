import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faExclamationTriangle,
  faCheck,
  faTimes,
  faEye,
  faEdit,
  faFilter,
  faSearch,
  faCalendar,
  faComments,
  faFlag,
  faReply,
  faPaperPlane,
  faPlus,
  faTrashAlt,
  faInfoCircle,
  faUser,
  faClock,
  faChevronRight,
  faImages,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import React, { useState, useEffect } from "react";

const RatingComplaints = () => {
  const [activeTab, setActiveTab] = useState("ratings");
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newRating, setNewRating] = useState({
    booking_id: "",
    reviewer_id: "",
    reviewee_id: "",
    rating: 0,
    comment: "",
  });
  const userRole = localStorage.getItem("role");
  const isStaff = userRole === "Staff" || userRole === "Admin";

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FontAwesomeIcon
        key={index}
        icon={faStar}
        className={index < rating ? "star-active" : "star-inactive"}
      />
    ));
  };

  const getStatusBadge = (status, isComplaint = false) => {
    const isTasker = userRole === "Tasker";

    if (isComplaint && isTasker) {
      const taskerComplaintMap = {
        pending: { label: "Đang xử lý", class: "badge-pending" },
        approved: { label: "Đã vi phạm", class: "badge-rejected" }, // Vi phạm thì màu đỏ/Danger
        rejected: { label: "Không vi phạm", class: "badge-published" }, // Không vi phạm thì màu xanh
        open: { label: "Đang xử lý", class: "badge-open" },
        in_progress: { label: "Đang xử lý", class: "badge-progress" },
        0: { label: "Đang xử lý", class: "badge-pending" },
        1: { label: "Đã vi phạm", class: "badge-rejected" },
        2: { label: "Không vi phạm", class: "badge-published" },
        resolved: { label: "Đã xử lý", class: "badge-resolved" },
      };
      const config = taskerComplaintMap[status] || { label: status, class: "badge-secondary" };
      return <span className={`premium-badge ${config.class}`}>{config.label}</span>;
    }

    const statusMap = {
      published: { label: "Đã đăng", class: "badge-published" },
      pending: { label: "Chờ duyệt", class: "badge-pending" },
      rejected: { label: "Từ chối", class: "badge-rejected" },
      open: { label: "Mới tạo", class: "badge-open" },
      in_progress: { label: "Đang xử lý", class: "badge-progress" },
      resolved: { label: "Đã xử lý", class: "badge-resolved" },
      0: { label: "Chờ duyệt", class: "badge-pending" },
      1: { label: "Đã duyệt", class: "badge-published" },
      2: { label: "Từ chối", class: "badge-rejected" },
    };

    const config = statusMap[status] || { label: status, class: "badge-secondary" };
    return <span className={`premium-badge ${config.class}`}>{config.label}</span>;
  };

  const getComplaintTypeLabel = (type) => {
    const typeMap = {
      not_quality: "Công việc không đạt yêu cầu",
      fake_time: "Gian lận thời gian",
      other: "Khác",
    };
    return typeMap[type] || type;
  };

  useEffect(() => {
    fetchRatings();
    fetchComplaints();
  }, []);

  const fetchRatings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3001/api/ratings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRatings(res.data);
    } catch (err) {
      console.error("Failed to fetch ratings:", err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3001/api/complaints", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(res.data);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:3001/api/ratings/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRatings();
    } catch (err) {
      console.error("Approve failed:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:3001/api/ratings/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRatings();
    } catch (err) {
      console.error("Reject failed:", err);
    }
  };

  const handleComplaintStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:3001/api/complaints/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchComplaints();
      if (selectedComplaint && selectedComplaint.complaint_id === id) {
        setSelectedComplaint(prev => ({ ...prev, status }));
      }
    } catch (err) {
      console.error("Failed to update complaint status:", err);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:3001/api/ratings", newRating, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowRatingForm(false);
      fetchRatings();
    } catch (err) {
      console.error("Rating submission failed:", err);
    }
  };

  const filteredRatings = ratings.filter(r =>
    r.reviewer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.service_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredComplaints = complaints.filter(c =>
    c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="premium-page-container">
      {/* Header with Stats Overview */}
      <div className="premium-header">
        <div className="container">
          <div className="row align-items-end py-5">
            <div className="col-lg-7">
              <h1 className="display-4 fw-bold text-white mb-2">Quản lý Chất Lượng</h1>
              <p className="lead text-white-50 mb-0">
                Giám sát chất lượng dịch vụ, giải quyết khiếu nại và duy trì tiêu chuẩn.
              </p>
            </div>
            <div className="col-lg-5 text-lg-end mt-4 mt-lg-0">
              <div className="header-stats d-flex gap-4 justify-content-lg-end">
                <div className="stat-card">
                  <span className="stat-value">{ratings.length}</span>
                  <span className="stat-label">Đánh giá</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{complaints.length}</span>
                  <span className="stat-label">Khiếu nại</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-n5 position-relative z-index-1">
        <div className="glass-card shadow-lg border-0 overflow-hidden">
          {/* Navigation Tabs */}
          <div className="tab-navigation d-flex">
            <button
              className={`tab-btn ${activeTab === "ratings" ? "active" : ""}`}
              onClick={() => setActiveTab("ratings")}
            >
              <FontAwesomeIcon icon={faStar} className="me-2" />
              Đánh giá & Nhận xét
            </button>
            <button
              className={`tab-btn ${activeTab === "complaints" ? "active" : ""}`}
              onClick={() => setActiveTab("complaints")}
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              Khiếu nại Khách hàng
            </button>
          </div>

          <div className="p-4 p-lg-5">
            {/* Control Bar */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
              <div className="search-wrapper">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nội dung..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="d-flex gap-3">
                {/* <button className="btn-filter">
                  <FontAwesomeIcon icon={faFilter} className="me-2" />
                  Bộ lọc
                </button> */}
                {activeTab === "ratings" && (
                  <button className="btn-premium-primary" onClick={() => setShowRatingForm(true)}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Thêm Đánh giá
                  </button>
                )}
              </div>
            </div>

            {/* Content Display */}
            <div className="tab-content-wrapper">
              {activeTab === "ratings" ? (
                <div className="ratings-grid">
                  {filteredRatings.length > 0 ? (
                    filteredRatings.map((rating) => (
                      <div key={rating.rating_id} className="premium-review-card">
                        <div className="card-header-v2">
                          <div className="user-info">
                            <div className="avatar-placeholder">
                              {rating.reviewer_name?.charAt(0) || <FontAwesomeIcon icon={faUser} />}
                            </div>
                            <div>
                              <h5 className="mb-0">{rating.reviewer_name}</h5>
                              <span className="text-muted small">
                                {rating.service_name} • {new Date(rating.created_at).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          </div>
                          <div className="status-zone">
                            {getStatusBadge(rating.status)}
                          </div>
                        </div>

                        <div className="card-body-v2">
                          <div className="stars-wrapper mb-3">
                            {renderStars(rating.rating)}
                            <span className="rating-num ms-2">{rating.rating}.0</span>
                          </div>
                          <p className="review-text">{rating.comment}</p>
                        </div>

                        <div className="card-footer-v2">
                          {isStaff && Number(rating.status) === 0 && (
                            <div className="staff-actions">
                              <button className="btn-action approve" onClick={() => handleApprove(rating.rating_id)}>
                                <FontAwesomeIcon icon={faCheck} className="me-1" /> Duyệt
                              </button>
                              <button className="btn-action reject" onClick={() => handleReject(rating.rating_id)}>
                                <FontAwesomeIcon icon={faTimes} className="me-1" /> Từ chối
                              </button>

                            </div>
                          )}
                          <button className="btn-view-more" onClick={() => setSelectedRating(rating)}>
                            Chi tiết <FontAwesomeIcon icon={faChevronRight} className="ms-1" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-v2">
                      <div className="empty-icon-wrapper">
                        <FontAwesomeIcon icon={faComments} className="empty-icon" />
                      </div>
                      <h4>Không có dữ liệu đánh giá</h4>
                      <p>Hiện tại chưa có đánh giá nào phù hợp với tìm kiếm của bạn. Hãy thử thay đổi từ khóa hoặc quay lại sau.</p>
                      <button className="btn btn-outline-primary rounded-pill px-4 mt-2" onClick={() => setSearchTerm("")}>
                        Xóa tìm kiếm
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="complaints-list">
                  {filteredComplaints.length > 0 ? (
                    filteredComplaints.map((complaint) => (
                      <div key={complaint.complaint_id} className="complaint-item-v2" onClick={() => setSelectedComplaint(complaint)}>
                        <div className="complaint-meta">
                          <span className={`complaint-type-pill status-pill`}>
                            {getComplaintTypeLabel(complaint.type)}
                          </span>
                          <span className="timestamp">
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            {new Date(complaint.created_at).toLocaleString("vi-VN")}
                          </span>
                        </div>
                        <div className="complaint-main">
                          <div className="customer-info">
                            <strong>{complaint.customer_name}</strong>
                            <span className="text-muted d-block small">
                              Booking #{complaint.booking_id} • <strong>{complaint.variant_name}</strong> ({complaint.service_name})
                            </span>
                          </div>
                          <p className="complaint-desc text-truncate">{complaint.description}</p>
                        </div>
                        <div className="complaint-status-zone">
                          {getStatusBadge(complaint.status, true)}
                          <div className="complaint-indicators mt-2">
                            {complaint.image_urls && JSON.parse(complaint.image_urls).length > 0 && (
                              <span className="indicator-icon" title="Có hình ảnh">
                                <FontAwesomeIcon icon={faImages} />
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="complaint-entry-action">
                          <FontAwesomeIcon icon={faChevronRight} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-v2">
                      <div className="empty-icon-wrapper secondary">
                        <FontAwesomeIcon icon={faFlag} className="empty-icon" />
                      </div>
                      <h4>Chưa có khiếu nại nào</h4>
                      <p>Hệ thống không tìm thấy khiếu nại nào cần xử lý lúc này. Mọi thứ đều đang ổn định!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Forms */}
      {showRatingForm && (
        <div className="premium-modal-overlay" onClick={() => setShowRatingForm(false)}>
          <div className="premium-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-v2">
              <h3>Chia sẻ Trải nghiệm</h3>
              <button className="btn-close-v2" onClick={() => setShowRatingForm(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleSubmitRating} className="modal-body-v2">
              <div className="form-group mb-4">
                <label className="form-label">Chọn Mã Đặt Chỗ (Booking ID)</label>
                <div className="select-wrapper">
                  <input
                    type="number"
                    className="premium-input"
                    placeholder="Nhập mã booking"
                    required
                    value={newRating.booking_id}
                    onChange={e => setNewRating({ ...newRating, booking_id: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Bạn đánh giá dịch vụ thế nào?</label>
                <div className="star-rating-selector d-flex gap-3 justify-content-center py-3">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      type="button"
                      className={`star-select-btn ${newRating.rating >= val ? 'active' : ''}`}
                      onClick={() => setNewRating({ ...newRating, rating: val })}
                    >
                      <FontAwesomeIcon icon={faStar} />
                    </button>
                  ))}
                  {ratings.length === 0 && (
                    <div className="text-center py-5 text-muted">
                      <FontAwesomeIcon icon={faComments} size="3x" className="mb-3 opacity-50" />
                      <p>No ratings found.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Chi tiết nhận xét</label>
                <textarea
                  className="premium-input"
                  rows="4"
                  placeholder="Chia sẻ chi tiết về trải nghiệm của bạn..."
                  required
                  value={newRating.comment}
                  onChange={e => setNewRating({ ...newRating, comment: e.target.value })}
                ></textarea>
              </div>
              <button type="submit" className="btn-premium-primary w-100 py-3">
                <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                Gửi Đánh giá
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedRating && (
        <div className="premium-modal-overlay" onClick={() => setSelectedRating(null)}>
          <div className="premium-modal wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header-v2">
              <h3>Chi tiết Đánh giá</h3>
              <button className="btn-close-v2" onClick={() => setSelectedRating(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body-v2">
              <div className="row">
                <div className="col-md-6 border-end">
                  <h6 className="text-uppercase text-muted small fw-bold mb-3">Thông tin Dịch vụ</h6>
                  <div className="detail-item mb-2">
                    <span className="label text-muted">Khách hàng:</span>
                    <p className="fw-bold mb-1">{selectedRating.reviewer_name}</p>
                  </div>
                  <div className="detail-item mb-2">
                    <span className="label text-muted">Loại dịch vụ:</span>
                    <p className="fw-bold mb-1">{selectedRating.service_name}</p>
                  </div>
                  <div className="detail-item mb-2">
                    <span className="label text-muted">Ngày đánh giá:</span>
                    <p className="fw-bold mb-1">{new Date(selectedRating.created_at).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
                <div className="col-md-6 px-lg-4">
                  <h6 className="text-uppercase text-muted small fw-bold mb-3">Phản hồi của Khách hàng</h6>
                  <div className="stars-wrapper mb-2">
                    {renderStars(selectedRating.rating)}
                  </div>
                  <p className="review-full-text fst-italic">"{selectedRating.comment}"</p>
                  <div className="mt-4">
                    <h6 className="text-uppercase text-muted small fw-bold mb-2">Lịch sử Trạng thái</h6>
                    <div className="status-history">
                      <div className="history-step active">
                        <div className="dot"></div>
                        <div className="content">
                          <span className="title">Đã gửi</span>
                          <span className="time">{new Date(selectedRating.created_at).toLocaleString("vi-VN")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedComplaint && (
        <div className="premium-modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="premium-modal wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header-v2">
              <h3>Chi tiết Khiếu nại #{selectedComplaint.complaint_id}</h3>
              <button className="btn-close-v2" onClick={() => setSelectedComplaint(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body-v2">
              <div className="row">
                <div className="col-lg-7">
                  <div className="complaint-content-box p-4 bg-light rounded-4 mb-4">
                    <div className="mb-4">
                      <div className="mb-2">
                        <span className={`premium-badge badge-published tech-pill`}>{getComplaintTypeLabel(selectedComplaint.type)}</span>
                      </div>
                      <span className="text-muted small">Ngày tạo: {new Date(selectedComplaint.created_at).toLocaleString("vi-VN")}</span>
                    </div>
                    <h5>Mô tả sự cố</h5>
                    <p className="lead fs-6 mb-4">{selectedComplaint.description}</p>

                    {selectedComplaint.image_urls && (
                      <div className="evidence-section">
                        <h6 className="mb-3">Hình ảnh bằng chứng</h6>
                        <div className="d-flex flex-wrap gap-3">
                          {JSON.parse(selectedComplaint.image_urls).map((url, idx) => (
                            <img key={idx} src={url} alt="Bằng chứng" className="evidence-thumb shadow-sm" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-lg-5">
                  <div className="case-meta-panel p-4 border rounded-4">
                    <h6 className="fw-bold mb-4">Bối cảnh Sự cố</h6>
                    <div className="meta-row d-flex justify-content-between mb-3 pb-3 border-bottom">
                      <span className="text-muted">Khách hàng:</span>
                      <span className="fw-medium">{selectedComplaint.customer_name}</span>
                    </div>
                    <div className="meta-row d-flex justify-content-between mb-3 pb-3 border-bottom">
                      <span className="text-muted">Mã Đặt Chỗ:</span>
                      <span className="fw-medium">#{selectedComplaint.booking_id}</span>
                    </div>
                    <div className="meta-row d-flex justify-content-between mb-3 pb-3 border-bottom">
                      <span className="text-muted">Dịch vụ:</span>
                      <span className="fw-medium text-end">{selectedComplaint.variant_name} ({selectedComplaint.service_name})</span>
                    </div>
                    <div className="meta-row d-flex justify-content-between mb-4 pb-3 border-bottom">
                      <span className="text-muted">Trạng thái hiện tại:</span>
                      {getStatusBadge(selectedComplaint.status, true)}
                    </div>

                    {isStaff && (
                      <div className="mt-4">
                        <h6 className="fw-bold mb-3 small text-uppercase">Xử lý Khiếu nại</h6>
                        <select
                          className="form-select rounded-3 border-secondary-subtle"
                          value={selectedComplaint.status}
                          onChange={(e) => handleComplaintStatusChange(selectedComplaint.complaint_id, e.target.value)}
                        >
                          <option value="open">Mới tạo (Open)</option>
                          <option value="in_progress">Đang xử lý (In Progress)</option>
                          <option value="resolved">Đã giải quyết (Resolved)</option>
                          <option value="rejected">Từ chối (Rejected)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .premium-page-container {
          background-color: #f0f2f5;
          min-height: 100vh;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          padding-bottom: 5rem;
        }

        .premium-header {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          padding-top: 2rem;
          padding-bottom: 8rem;
          position: relative;
        }

        .header-stats .stat-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 1rem 2rem;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          text-align: center;
          min-width: 140px;
        }

        .stat-value {
          display: block;
          font-size: 1.8rem;
          font-weight: 800;
          color: white;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .mt-n5 {
          margin-top: -5rem !important;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important;
        }

        .tab-navigation {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 2rem;
        }

        .tab-btn {
          padding: 1.5rem 2rem;
          border: none;
          background: none;
          font-weight: 600;
          color: #64748b;
          position: relative;
          transition: all 0.3s ease;
          font-size: 1.05rem;
        }

        .tab-btn.active {
          color: #1e40af;
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: #3b82f6;
          border-radius: 4px 4px 0 0;
        }

        .tab-btn:hover:not(.active) {
          color: #334155;
          background: rgba(0, 0, 0, 0.02);
        }

        /* Control Bar Styles */
        .search-wrapper {
          position: relative;
          flex-grow: 1;
          max-width: 500px;
        }

        .search-icon {
          position: absolute;
          left: 1.2rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 3rem;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          background: #fff;
          transition: all 0.3s ease;
          outline: none;
        }

        .search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .btn-filter {
          padding: 0.8rem 1.5rem;
          border-radius: 1rem;
          background: #fff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-premium-primary {
          padding: 0.8rem 2rem;
          border-radius: 1rem;
          background: #2563eb;
          border: none;
          color: white;
          font-weight: 600;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
          transition: all 0.3s ease;
        }

        .btn-premium-primary:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        /* Grid Layouts */
        .ratings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 2rem;
        }

        @media (max-width: 768px) {
          .ratings-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Review Card V2 */
        .premium-review-card {
          background: white;
          border-radius: 1.5rem;
          border: 1px solid #f1f5f9;
          padding: 1.8rem;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .premium-review-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
          border-color: #e2e8f0;
        }

        .card-header-v2 {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #eff6ff;
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
        }

        .star-active { color: #fbbf24; }
        .star-inactive { color: #e2e8f0; }

        .rating-num {
          font-weight: 700;
          color: #334155;
        }

        .review-text {
          color: #475569;
          line-height: 1.6;
          flex-grow: 1;
        }

        .card-footer-v2 {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn-view-more {
          background: none;
          border: none;
          color: #3b82f6;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .btn-view-more:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        /* Action Buttons */
        .btn-action {
          padding: 0.5rem 1rem;
          border-radius: 0.8rem;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
          margin-right: 0.5rem;
          border: 1px solid transparent;
        }

        .btn-action.approve {
          background: #f0fdf4;
          color: #15803d;
        }

        .btn-action.approve:hover { background: #dcfce7; }

        .btn-action.reject {
          background: #fef2f2;
          color: #b91c1c;
        }

        .btn-action.reject:hover { background: #fee2e2; }

        /* Badges */
        .premium-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .badge-published { background: #dcfce7; color: #166534; }
        .badge-pending { background: #fef9c3; color: #854d0e; }
        .badge-rejected { background: #fee2e2; color: #991b1b; }
        .badge-open { background: #ffedd5; color: #9a3412; }
        .badge-progress { background: #e0f2fe; color: #075985; }
        .badge-resolved { background: #f0fdf4; color: #166534; }

        /* Complaints List */
        .complaints-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .complaint-item-v2 {
          background: white;
          padding: 1.5rem;
          border-radius: 1.2rem;
          border: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 2rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .complaint-item-v2:hover {
          background: #f8fafc;
          border-color: #3b82f6;
          transform: scale(1.005);
        }

        .complaint-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 200px;
        }

        .complaint-type-pill {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          text-align: center;
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fee2e2;
        }

        .timestamp {
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .complaint-main {
          flex-grow: 1;
        }

        .complaint-desc {
          font-size: 0.95rem;
          color: #64748b;
          margin-top: 0.5rem;
          max-width: 600px;
        }

        .complaint-status-zone {
          min-width: 120px;
          text-align: right;
        }

        /* Modal Overlays */
        .premium-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 2rem;
        }

        .premium-modal {
          background: white;
          border-radius: 2rem;
          width: 100%;
          max-width: 550px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: modalAppear 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .premium-modal.wide {
          max-width: 900px;
        }

        @keyframes modalAppear {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-header-v2 {
          padding: 2rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn-close-v2 {
          background: #f1f5f9;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: #64748b;
          transition: all 0.2s;
        }

        .btn-close-v2:hover { background: #e2e8f0; color: #0f172a; }

        .modal-body-v2 {
          padding: 2rem;
        }

        .premium-input {
          width: 100%;
          padding: 1rem;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          outline: none;
          transition: all 0.2s;
        }

        .premium-input:focus {
          border-color: #3b82f6;
          background: white;
        }

        .form-label {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.8rem;
          display: block;
        }

        .star-select-btn {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          width: 50px;
          height: 50px;
          border-radius: 12px;
          font-size: 1.5rem;
          color: #cbd5e1;
          transition: all 0.2s;
        }

        .star-select-btn.active {
          color: #fbbf24;
          background: #fffbeb;
          border-color: #fbbf24;
        }

        .evidence-thumb {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 1rem;
          border: 3px solid white;
        }

        .tech-pill {
          background: #f1f5f9;
          color: #475569;
          font-weight: 700;
          padding: 0.3rem 1rem;
        }

        /* Empty State V2 */
        .empty-state-v2 {
          text-align: center;
          padding: 5rem 2rem;
          background: white;
          border-radius: 2rem;
          border: 2px dashed #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          grid-column: 1 / -1;
        }

        .empty-icon-wrapper {
          width: 80px;
          height: 80px;
          background: #eff6ff;
          color: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          margin-bottom: 2rem;
          animation: float 3s ease-in-out infinite;
        }

        .empty-icon-wrapper.secondary {
          background: #fff7ed;
          color: #f97316;
        }

        .empty-state-v2 h4 {
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .empty-state-v2 p {
          color: #64748b;
          max-width: 400px;
          margin-bottom: 1.5rem;
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
};

export default RatingComplaints;
