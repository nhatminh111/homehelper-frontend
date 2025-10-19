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
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import React, { useState, useEffect } from "react";

const RatingComplaints = () => {
  const [activeTab, setActiveTab] = useState("ratings");
  const [selectedRating, setSelectedRating] = useState(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [newRating, setNewRating] = useState({
    booking_id: "",
    reviewer_id: "",
    reviewee_id: "",
    rating: 0,
    comment: "",
  });
  const userRole = localStorage.getItem("role");
  const isStaff = userRole === "Staff";

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FontAwesomeIcon
        key={index}
        icon={faStar}
        className={index < rating ? "text-warning" : "text-muted"}
      />
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
        return "danger";
      case "open":
        return "danger";
      case "in_progress":
        return "warning";
      case "resolved":
        return "success";
      default:
        return "secondary";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "secondary";
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const token = localStorage.getItem("token"); // token nếu có auth
      const res = await axios.get("http://localhost:3001/api/ratings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRatings(res.data); // data trả về là array ratings
    } catch (err) {
      console.error("Failed to fetch ratings:", err);
    }
  };

  const handleSubmitRating = async (newRating) => {
    const token = localStorage.getItem("token");
    await axios.post("http://localhost:3001/api/ratings", newRating, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // fetch lại dữ liệu sau khi submit
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

  return (
    <div className="rating-complaints-container">
      {/* Header */}
      <div className="page-header bg-white shadow-sm">
        <div className="container">
          <div className="row align-items-center py-4">
            <div className="col-md-6">
              <h1 className="mb-0">Ratings & Complaints</h1>
              <p className="text-muted mb-0">
                Manage ratings, reviews, and handle complaints
              </p>
            </div>
            <div className="col-md-6 text-right">
              <button
                className="btn btn-primary"
                onClick={() => setShowComplaintForm(true)}
              >
                <FontAwesomeIcon icon={faFlag} className="mr-2" />
                Submit Complaint
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-4">
        {/* Tabs */}
        <div className="tabs-section bg-white rounded shadow-sm mb-4">
          <ul className="nav nav-tabs" id="ratingTabs" role="tablist">
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "ratings" ? "active" : ""
                }`}
                onClick={() => setActiveTab("ratings")}
              >
                <FontAwesomeIcon icon={faStar} className="mr-2" />
                Ratings & Reviews
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "complaints" ? "active" : ""
                }`}
                onClick={() => setActiveTab("complaints")}
              >
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="mr-2"
                />
                Complaints
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "feedback" ? "active" : ""
                }`}
                onClick={() => setActiveTab("feedback")}
              >
                <FontAwesomeIcon icon={faComments} className="mr-2" />
                Feedback
              </button>
            </li>
          </ul>

          <div className="tab-content p-4">
            {/* Ratings Tab */}
            {activeTab === "ratings" && (
              <div className="ratings-content">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Ratings & Reviews</h5>
                  <button
                    className="btn btn-primary ml-2"
                    onClick={() => setShowRatingForm(true)}
                  >
                    <FontAwesomeIcon icon={faStar} className="mr-2" />
                    Submit Rating
                  </button>

                  <div className="d-flex">
                    <div
                      className="input-group mr-2"
                      style={{ width: "200px" }}
                    >
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search..."
                      />
                      <div className="input-group-append">
                        <button className="btn btn-outline-secondary">
                          <FontAwesomeIcon icon={faSearch} />
                        </button>
                      </div>
                    </div>
                    <button className="btn btn-outline-secondary">
                      <FontAwesomeIcon icon={faFilter} className="mr-1" />
                      Filter
                    </button>
                  </div>
                </div>

                <div className="ratings-list">
                  {ratings.map((rating) => (
                    <div key={rating.rating_id} className="rating-card">
                      <div className="row">
                        <div className="col-md-8">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1">{rating.reviewer_name}</h6>
                              <p className="text-muted mb-1">
                                {rating.service_name}
                              </p>
                              <small className="text-muted">
                                <FontAwesomeIcon
                                  icon={faCalendar}
                                  className="mr-1"
                                />
                                {new Date(
                                  rating.created_at
                                ).toLocaleDateString()}
                              </small>
                            </div>
                          </div>

                          <div className="rating-stars mb-2">
                            {renderStars(rating.rating)}
                            <span className="ml-2 font-weight-bold">
                              {rating.rating}/5
                            </span>
                          </div>

                          <div className="rating-comment mb-3">
                            <p className="mb-2">{rating.comment}</p>
                          </div>
                        </div>
                        {console.log(
                          "CHECK:",
                          rating.rating_id,
                          "status:",
                          rating.status,
                          "type:",
                          typeof rating.status,
                          "role:",
                          userRole
                        )}

                        <div className="col-md-4 text-right">
                          <div className="rating-actions">
                            <div className="d-flex align-items-center gap-2 mt-2">
                              {isStaff && (() => {
                                const statusNum = Number(rating.status);
                                if (statusNum === 0) {
                                  return <>
                                    <button
                                      className="btn btn-outline-success btn-sm"
                                      onClick={() => handleApprove(rating.rating_id)}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() => handleReject(rating.rating_id)}
                                    >
                                      Reject
                                    </button>
                                  </>;
                                } else if (statusNum === 1) {
                                  return <span className="badge bg-success d-flex align-items-center p-2">Approved</span>;
                                } else if (statusNum === 2) {
                                  return <span className="badge bg-danger d-flex align-items-center p-2">Rejected</span>;
                                } else {
                                  return <span className="badge bg-secondary d-flex align-items-center p-2">Pending</span>;
                                }
                              })()}

                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => setSelectedRating(rating)}
                              >
                                <FontAwesomeIcon
                                  icon={faEye}
                                  className="mr-1"
                                />
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Complaints Tab */}
            {activeTab === "complaints" && (
              <div className="complaints-content">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Complaints Management</h5>
                  <div className="d-flex">
                    <div
                      className="input-group mr-2"
                      style={{ width: "200px" }}
                    >
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search..."
                      />
                      <div className="input-group-append">
                        <button className="btn btn-outline-secondary">
                          <FontAwesomeIcon icon={faSearch} />
                        </button>
                      </div>
                    </div>
                    <button className="btn btn-outline-secondary">
                      <FontAwesomeIcon icon={faFilter} className="mr-1" />
                      Filter
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Subject</th>
                        <th>Tasker</th>
                        <th>Date</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((complaint) => (
                        <tr key={complaint.id}>
                          <td>
                            <span className="badge badge-secondary">
                              {complaint.type}
                            </span>
                          </td>
                          <td>
                            <strong>{complaint.subject}</strong>
                            <br />
                            <small className="text-muted">
                              {complaint.service}
                            </small>
                          </td>
                          <td>{complaint.tasker}</td>
                          <td>{complaint.date}</td>
                          <td>
                            <span
                              className={`badge badge-${getPriorityColor(
                                complaint.priority
                              )}`}
                            >
                              {complaint.priority.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge badge-${getStatusColor(
                                complaint.status
                              )}`}
                            >
                              {complaint.status.replace("_", " ").toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary mr-1">
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                            <button className="btn btn-sm btn-outline-success mr-1">
                              <FontAwesomeIcon icon={faReply} />
                            </button>
                            <button className="btn btn-sm btn-outline-warning">
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* rating Tab */}
            {showRatingForm && (
              <div className="modal-overlay">
                <div className="modal-content bg-white rounded shadow-lg p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5>Submit Rating</h5>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setShowRatingForm(false)}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await handleSubmitRating(newRating);
                      setShowRatingForm(false);
                      fetchRatings();
                    }}
                  >
                    <div className="form-group mb-3">
                      <label>Booking ID</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newRating.booking_id}
                        onChange={(e) =>
                          setNewRating({
                            ...newRating,
                            booking_id: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label>Reviewer ID</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newRating.reviewer_id}
                        onChange={(e) =>
                          setNewRating({
                            ...newRating,
                            reviewer_id: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label>Reviewee ID (Tasker)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newRating.reviewee_id}
                        onChange={(e) =>
                          setNewRating({
                            ...newRating,
                            reviewee_id: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label>Rating (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        className="form-control"
                        value={newRating.rating}
                        onChange={(e) =>
                          setNewRating({ ...newRating, rating: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label>Comment</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={newRating.comment}
                        onChange={(e) =>
                          setNewRating({
                            ...newRating,
                            comment: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        className="btn btn-secondary mr-2"
                        onClick={() => setShowRatingForm(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                        Submit Rating
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === "feedback" && (
              <div className="feedback-content">
                <h5 className="mb-3">System Feedback</h5>

                <div className="row">
                  <div className="col-md-6">
                    <div className="feedback-form bg-light rounded p-4">
                      <h6>Submit Feedback</h6>
                      <form>
                        <div className="form-group mb-3">
                          <label>Feedback Type</label>
                          <select className="form-control">
                            <option>General Feedback</option>
                            <option>Bug Report</option>
                            <option>Feature Request</option>
                            <option>Improvement Suggestion</option>
                          </select>
                        </div>
                        <div className="form-group mb-3">
                          <label>Subject</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Brief description"
                          />
                        </div>
                        <div className="form-group mb-3">
                          <label>Description</label>
                          <textarea
                            className="form-control"
                            rows="4"
                            placeholder="Detailed feedback..."
                          ></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary">
                          <FontAwesomeIcon
                            icon={faPaperPlane}
                            className="mr-2"
                          />
                          Submit Feedback
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="feedback-stats">
                      <h6>Feedback Statistics</h6>
                      <div className="stat-item d-flex justify-content-between align-items-center p-3 border-bottom">
                        <span>Total Feedback</span>
                        <strong>156</strong>
                      </div>
                      <div className="stat-item d-flex justify-content-between align-items-center p-3 border-bottom">
                        <span>Resolved</span>
                        <strong className="text-success">142</strong>
                      </div>
                      <div className="stat-item d-flex justify-content-between align-items-center p-3 border-bottom">
                        <span>Pending</span>
                        <strong className="text-warning">14</strong>
                      </div>
                      <div className="stat-item d-flex justify-content-between align-items-center p-3">
                        <span>Response Time</span>
                        <strong>2.3 days</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Detail Modal */}
      {selectedRating && (
        <div className="modal-overlay">
          <div className="modal-content bg-white rounded shadow-lg p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5>Rating Details</h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSelectedRating(null)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="rating-details">
              <div className="row mb-4">
                <div className="col-md-6">
                  <h6>Tasker Information</h6>
                  <p>
                    <strong>Name:</strong> {selectedRating.tasker}
                  </p>
                  <p>
                    <strong>Service:</strong> {selectedRating.service}
                  </p>
                  <p>
                    <strong>Date:</strong> {selectedRating.date}
                  </p>
                </div>
                <div className="col-md-6">
                  <h6>Rating Summary</h6>
                  <div className="overall-rating mb-2">
                    <span className="h4">
                      {renderStars(selectedRating.rating)}
                    </span>
                    <span className="ml-2 font-weight-bold">
                      {selectedRating.rating}/5
                    </span>
                  </div>
                  <div className="detailed-ratings">
                    <div className="rating-item d-flex justify-content-between mb-1">
                      <span>Quality:</span>
                      <span>{renderStars(selectedRating.quality)}</span>
                    </div>
                    <div className="rating-item d-flex justify-content-between mb-1">
                      <span>Attitude:</span>
                      <span>{renderStars(selectedRating.attitude)}</span>
                    </div>
                    <div className="rating-item d-flex justify-content-between">
                      <span>Punctuality:</span>
                      <span>{renderStars(selectedRating.punctuality)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rating-comment-section mb-4">
                <h6>Customer Comment</h6>
                <div className="bg-light p-3 rounded">
                  <p className="mb-0">{selectedRating.comment}</p>
                </div>
              </div>

              {selectedRating.taskerResponse && (
                <div className="tasker-response-section mb-4">
                  <h6>Tasker Response</h6>
                  <div className="bg-light p-3 rounded">
                    <p className="mb-0">{selectedRating.taskerResponse}</p>
                  </div>
                </div>
              )}

              <div className="rating-actions text-right">
                {selectedRating.status === "pending" && (
                  <>
                    <button className="btn btn-success mr-2">
                      <FontAwesomeIcon icon={faCheck} className="mr-1" />
                      Approve Rating
                    </button>
                    <button className="btn btn-danger mr-2">
                      <FontAwesomeIcon icon={faTimes} className="mr-1" />
                      Reject Rating
                    </button>
                  </>
                )}
                <button className="btn btn-outline-secondary">
                  <FontAwesomeIcon icon={faEdit} className="mr-1" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Form Modal */}
      {showComplaintForm && (
        <div className="modal-overlay">
          <div className="modal-content bg-white rounded shadow-lg p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5>Submit Complaint</h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowComplaintForm(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Complaint Type</label>
                    <select className="form-control">
                      <option>Service Quality</option>
                      <option>Behavior</option>
                      <option>Payment</option>
                      <option>Safety</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Priority</label>
                    <select className="form-control">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group mb-3">
                <label>Subject</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div className="form-group mb-3">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Please provide detailed information about your complaint..."
                ></textarea>
              </div>

              <div className="form-group mb-3">
                <label>Service Details</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Service type and date"
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  className="btn btn-secondary mr-2"
                  onClick={() => setShowComplaintForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .rating-complaints-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }

        .page-header {
          border-bottom: 1px solid #e9ecef;
        }

        .rating-card {
          transition: transform 0.2s;
        }

        .rating-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }

        .modal-content {
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .tasker-response {
          border-left: 4px solid #007bff;
        }

        .rating-stars {
          font-size: 1.1rem;
        }

        .detailed-ratings .rating-item {
          font-size: 0.9rem;
        }

        .stat-item {
          transition: background-color 0.2s;
        }

        .stat-item:hover {
          background-color: #f8f9fa;
        }

        .feedback-form {
          border: 2px dashed #dee2e6;
        }
      `}</style>
    </div>
  );
};

export default RatingComplaints;
