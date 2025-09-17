import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faCheckCircle,
  faEye,
  faAward,
  faTools,
  faMapMarkerAlt,
  faCalendarCheck,
  faComments,
} from "@fortawesome/free-solid-svg-icons";

const API_BASE_URL = "http://localhost:3001/api";

const createHeaders = (token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

const TaskerProfile = () => {
  const { id } = useParams();
  const { user, token, loading: authLoading, isAuthenticated } = useAuth();
  const [tasker, setTasker] = useState(null);
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    total: 0,
    average: 0,
    ratingsCount: {},
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [canRate, setCanRate] = useState(null);
  const [alreadyRated, setAlreadyRated] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [newRating, setNewRating] = useState(5);
  const [newFeedback, setNewFeedback] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  // Load tasker profile
  useEffect(() => {
    fetch(`${API_BASE_URL}/tasker-profile/${id}`)
      .then((res) => res.json())
      .then((data) => setTasker(data))
      .catch((err) => console.error(err));
  }, [id]);

  // Load reviews
  useEffect(() => {
    if (activeTab === "reviews") {
      fetch(`${API_BASE_URL}/ratings/${id}`)
        .then((res) => res.json())
        .then((data) => setReviewsData(data || { reviews: [] }))
        .catch((err) => console.error(err));
    }
  }, [activeTab, id]);

  useEffect(() => {
    if (isAuthenticated()) {
      fetch(`${API_BASE_URL}/bookings/${id}/can-rate`, {
        headers: createHeaders(token),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("can-rate response:", data);
          setCanRate(data.canRate);
          setBookingId(data.bookingId);
        })
        .catch((err) => console.error(err));
    }
  }, [id, token, isAuthenticated]);

  const submitReview = async () => {
    if (!newFeedback.trim()) return alert("Please enter your feedback");
    if (!bookingId) return alert("Cannot submit review: bookingId missing");

    try {
      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: "POST",
        headers: createHeaders(token),
        body: JSON.stringify({
          booking_id: bookingId,
          reviewee_id: id,
          rating: newRating,
          comment: newFeedback,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Có lỗi xảy ra");

      // Dữ liệu review trả về từ backend
      const newReview = {
        id: data.rating_id || Math.random(),
        name: user.name || "Bạn",
        rating: data.rating || newRating,
        text: data.comment || newFeedback,
        date: data.created_at || new Date().toISOString(), // đúng tên cột từ backend
      };

      // Cập nhật state
      setReviewsData((prev) => ({
        ...prev,
        reviews: [newReview, ...(prev?.reviews || [])],
        total: (prev?.total || 0) + 1,
        average:
          ((prev?.average || 0) * (prev?.total || 0) + newReview.rating) /
          ((prev?.total || 0) + 1),
        ratingsCount: {
          ...prev.ratingsCount,
          [newReview.rating]: (prev.ratingsCount?.[newReview.rating] || 0) + 1,
        },
      }));

      // Reset form
      setNewRating(5);
      setNewFeedback("");
      setCanRate(false); // tránh đánh giá lại cùng booking

      alert("Review submitted!");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(error.message);
    }
  };

  if (!tasker)
    return <div className="container py-5 text-center">Loading...</div>;

  const tabs = [
    { id: "overview", label: "Overview", icon: faEye },
    { id: "reviews", label: "Reviews", icon: faStar },
    { id: "videos", label: "Videos", icon: faEye },
    { id: "articles", label: "Articles", icon: faAward },
    { id: "achievements", label: "Achievements", icon: faCheckCircle },
  ];

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="card p-4 shadow-sm">
        <div className="row align-items-center gx-3">
          <div className="col-md-6 ps-md-4">
            <div className="d-flex align-items-center mb-3">
              <img
                src={tasker.avatar || "/images/default-avatar.png"}
                alt={tasker.name}
                className="rounded-circle border me-3"
                style={{ width: "60px", height: "60px", objectFit: "cover" }}
              />
              <h3 className="mb-0 fw-bold">{tasker.name || "Tasker Name"}</h3>
            </div>
            <div className="d-flex flex-wrap align-items-center mb-2">
              <strong className="fs-5 text-warning">
                {tasker.rating || 4.0}
              </strong>
              <FontAwesomeIcon icon={faStar} className="text-warning ms-2" />
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-primary">
                <FontAwesomeIcon icon={faCalendarCheck} className="me-1" />
                Book Now - ${tasker.pricePerHour || 25}/hr
              </button>
              <button className="btn btn-outline-secondary">
                <FontAwesomeIcon icon={faComments} className="me-1" />
                Start Chat
              </button>
            </div>
          </div>
          <div className="col-md-6 pe-md-4 text-center text-md-end pt-3 pt-md-0">
            <div className="mb-2 text-muted">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
              {tasker.location || "Downtown"}
            </div>
            <div className="mb-2 text-muted">
              <FontAwesomeIcon icon={faTools} className="me-1" />
              {tasker.yearsExperience || 5} years experience
            </div>
            {tasker.available && (
              <div className="text-success fw-semibold">
                <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                Available Now
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-3 mt-4">
        <ul className="nav nav-tabs mb-3">
          {tabs.map((tab) => (
            <li className="nav-item" key={tab.id}>
              <button
                className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <FontAwesomeIcon icon={tab.icon} className="me-1" />
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        <div>
          {activeTab === "overview" && <div>No overview content yet.</div>}

          {activeTab === "reviews" && (
            <div className="row">
              {/* Rating Overview */}
              <div className="col-md-4">
                <h5>Rating Overview</h5>
                {reviewsData ? (
                  <>
                    <h3 className="fw-bold">
                      {reviewsData.average?.toFixed(1)} / 5
                    </h3>
                    <p>{reviewsData.total} reviews</p>

                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviewsData.ratingsCount?.[star] || 0;
                      const percent = reviewsData.total
                        ? Math.round((count / reviewsData.total) * 100)
                        : 0;

                      return (
                        <div
                          key={star}
                          className="d-flex align-items-center mb-2"
                        >
                          <span style={{ width: 30 }}>{star}★</span>
                          <div
                            className="progress flex-grow-1 mx-2"
                            style={{ height: 10 }}
                          >
                            <div
                              className="progress-bar bg-warning"
                              role="progressbar"
                              style={{ width: `${percent}%` }}
                              aria-valuenow={percent}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <span>{count}</span>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <p>Loading ratings...</p>
                )}
              </div>

              {/* Reviews + Form */}
              <div className="col-md-8">
                {reviewsData?.reviews?.length > 0 ? (
                  reviewsData.reviews
                    .filter((review) => review) // bỏ các giá trị null/undefined
                    .map((review) => (
                      <div
                        key={review.id || Math.random()}
                        className="border-bottom pb-3 mb-3"
                      >
                        <strong>{review?.name || "Ẩn danh"}</strong>
                        <div>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FontAwesomeIcon
                              key={star}
                              icon={faStar}
                              className={
                                star <= (review?.rating || 0)
                                  ? "text-warning"
                                  : "text-muted"
                              }
                            />
                          ))}
                        </div>
                        <p>{review?.text || "Không có nhận xét."}</p>
                        <small className="text-muted">
                          {review.date ? review.date.split(".")[0] : ""}
                        </small>
                      </div>
                    ))
                ) : (
                  <p>No reviews yet.</p>
                )}

                {/* Review Form */}
                {!authLoading && isAuthenticated() && canRate && (
                  <div className="mt-4 p-3 border rounded">
                    <h5>Leave a Review</h5>
                    <div className="mb-2">
                      <label className="form-label">Rating:</label>
                      <div>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FontAwesomeIcon
                            key={star}
                            icon={faStar}
                            onClick={() => setNewRating(star)}
                            className={`me-1 cursor-pointer ${
                              star <= newRating ? "text-warning" : "text-muted"
                            }`}
                            style={{ cursor: "pointer", fontSize: "1.5rem" }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Feedback:</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={newFeedback}
                        onChange={(e) => setNewFeedback(e.target.value)}
                      />
                    </div>
                    <button className="btn btn-primary" onClick={submitReview}>
                      Submit
                    </button>
                  </div>
                )}

                {!authLoading && isAuthenticated() && !canRate && (
                  <p className="text-muted mt-2">
                    Bạn chỉ có thể đánh giá sau khi hoàn thành booking với
                    tasker này.
                  </p>
                )}

                {!authLoading && !isAuthenticated() && (
                  <p className="text-muted mt-2">
                    Vui lòng đăng nhập để đánh giá.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskerProfile;
