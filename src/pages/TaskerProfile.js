import React, { useEffect, useState, useCallback } from "react";
import "../css/TaskerProfile.css";
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
import { faClock as faClockRegular } from "@fortawesome/free-regular-svg-icons";
import TaskerCertificateRegister from '../components/TaskerCertificateRegister';
import { CustomToastContainer, showToast } from '../components/common/CustomToast';

// Certificate list section for the certification tab
const TaskerCertificateList = ({ taskerId }) => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Hàm lấy signed URL bằng cert_public_id
  const fetchSignedCertificateUrlByPublicId = useCallback(async (public_id) => {
    if (!public_id) return null;
    try {
      const url = `${API_BASE_URL}/tasker/certifications/signed-url?public_id=${encodeURIComponent(
        public_id
      )}`;
      const res = await fetch(url, {
        headers: {
          Authorization: localStorage.getItem("token")
            ? `Bearer ${localStorage.getItem("token")}`
            : "",
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Failed signed URL by public_id");
      return json.data?.url || null;
    } catch (e) {
      console.warn("fetchSignedCertificateUrlByPublicId error", e.message);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!taskerId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/taskers/${taskerId}/certifications`, {
      headers: {
        Authorization: localStorage.getItem("token")
          ? `Bearer ${localStorage.getItem("token")}`
          : "",
      },
    })
      .then((res) => res.json())
      .then(async (data) => {
        let certList = Array.isArray(data.data) ? data.data : [];
        // For certs with only cert_public_id, fetch signed URL
        const updatedCerts = await Promise.all(
          certList.map(async (cert) => {
            if (!cert.cert_file_url && cert.cert_public_id) {
              try {
                const url = await fetchSignedCertificateUrlByPublicId(
                  cert.cert_public_id
                );
                if (url) {
                  return { ...cert, cert_file_url: url };
                }
              } catch (e) {
                /* ignore */
              }
            }
            return cert;
          })
        );
        setCerts(updatedCerts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [taskerId, fetchSignedCertificateUrlByPublicId]);

  // Group by service and variant
  const grouped = {};
  certs.forEach((cert) => {
    const service = cert.service_name || cert.service_id;
    const variant = cert.variant_name || cert.variant_id;
    if (!grouped[service]) grouped[service] = {};
    if (!grouped[service][variant]) grouped[service][variant] = [];
    grouped[service][variant].push(cert);
  });

  if (loading) return <div>Đang tải danh sách chứng chỉ...</div>;
  if (certs.length === 0)
    return <div className="alert alert-info">Không có chứng chỉ nào.</div>;

  return (
    <div>
      <h5 className="mb-3">Danh sách chứng chỉ đã đăng ký</h5>

      <div className="row g-3">
        {Object.entries(grouped).map(([service, variants]) =>
          Object.entries(variants).map(([variant, certList]) =>
            certList.map((cert, idx) => (
              <div
                key={cert.cert_id || cert.cert_public_id || idx}
                className="col-12"
              >
                <div
                  className="card shadow-sm border-0 d-flex flex-column flex-md-row align-items-stretch position-relative"
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    minHeight: "160px",
                    transition: "transform 0.2s ease",
                  }}
                >
                  {/* Status góc phải trên */}
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 2,
                    }}
                  >
                    {cert.status && (
                      <span
                        className={`badge px-3 py-2 ${
                          cert.status === 'Approved'
                            ? 'bg-success'
                            : cert.status === 'pending'
                            ? 'bg-warning text-dark'
                            : 'bg-secondary'
                        }`}
                        style={{ fontSize: "0.9rem", fontWeight: 500 }}
                      >
                      {cert.status === 'Approved'
                        ? 'Đã duyệt'
                        : cert.status === 'pending'
                        ? 'Chờ duyệt'
                        : cert.status === 'rejected'
                        ? 'Bị từ chối'
                        : cert.status}
                      </span>
                    )}
                  </div>

                  {/* Ảnh chứng chỉ */}
                  <div
                    className="flex-shrink-0 bg-light d-flex align-items-center justify-content-center"
                    style={{
                      width: "100%",
                      maxWidth: "220px",
                      height: "auto",
                      aspectRatio: "4 / 3",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {cert.cert_file_url ? (
                      <img
                        src={cert.cert_file_url}
                        alt={cert.cert_name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain", // giúp giữ tỉ lệ hình
                          backgroundColor: "#f8f9fa",
                        }}
                      />
                    ) : (
                      <div className="text-muted small py-4">Không có ảnh</div>
                    )}
                  </div>

                  {/* Nội dung chứng chỉ */}
                  <div className="card-body d-flex flex-column justify-content-between p-3">
                    <div>
                      <h6 className="fw-semibold mb-1 text-truncate">
                        {cert.cert_name}
                      </h6>

                      {cert.parsed_certificate_code && (
                        <span className="badge bg-info text-dark mb-2">
                          Mã: {cert.parsed_certificate_code}
                        </span>
                      )}

                      <div className="mb-2">
                        <span className="badge bg-primary-subtle text-primary me-2">
                          {service}
                        </span>

                        {variant &&
                          ((Array.isArray(variant) && variant.length > 0 && (
                            <span className="badge bg-secondary-subtle text-secondary">
                              {variant.join(', ')}
                            </span>
                          )) ||
                            (typeof variant === 'string' && variant.trim() && (
                              <span className="badge bg-secondary-subtle text-secondary">
                                {variant}
                              </span>
                            )))}
                      </div>
                    </div>

                    <div className="text-muted small mt-auto">
                      <div>
                        <strong>Cấp bởi:</strong> {cert.issued_by || "—"}
                      </div>
                      <div>
                        <strong>Ngày cấp:</strong>{" "}
                        {cert.issued_date
                          ? new Date(cert.issued_date).toLocaleDateString(
                              "vi-VN"
                            )
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

const API_BASE_URL = "http://localhost:3001/api";

const createHeaders = (token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

const TaskerProfile = () => {
  const { id } = useParams();
  const {
    user,
    token,
    loading: authLoading,
    isAuthenticated,
    isStaff,
    isTasker,
  } = useAuth();
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
  const [inWishlist, setInWishlist] = useState(false);
  const [skipFetch, setSkipFetch] = useState(false);

  // Demo/static datasets to mirror the provided UI comps
  const specialties = [
    "Deep Cleaning",
    "Kitchen Cleaning",
    "Bathroom Sanitization",
    "Window Cleaning",
  ];
  const languages = ["English", "Spanish", "French"];
  const stats = [
    { label: "Response Time", value: "1hr" },
    { label: "Years Experience", value: "5+" },
    { label: "Awards Won", value: "5" },
  ];
  const featuredVideos = [
    {
      id: 1,
      title: "Deep Kitchen Cleaning - Complete Process",
      minutes: "8:32",
      views: 2340,
      likes: 98,
      when: "1 week ago",
      img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=60",
    },
    {
      id: 3,
      title: "Eco-Friendly Cleaning Solutions",
      minutes: "5:46",
      views: 3210,
      likes: 267,
      when: "2 weeks ago",
      img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=60",
    },
  ];
  const featuredArticles = [
    {
      id: 1,
      title: "How to Clean a Sofa Without Using Water",
      category: "Furniture Care",
      read: "9 min read",
      views: 1340,
      date: "Jun 12, 2024",
      img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=60",
    },
    {
      id: 2,
      title: "Bathroom Odor Elimination Guide",
      category: "Bathroom Care",
      read: "6 min read",
      views: 1650,
      date: "Jun 10, 2024",
      img: "https://images.unsplash.com/photo-1595433707802-6b2626ef1c86?auto=format&fit=crop&w=1200&q=60",
    },
  ];
  const moreArticles = [
    {
      id: 3,
      title: "Outdoor Cleaning and Maintenance",
      category: "Outdoor",
      read: "8 min read",
      views: 980,
      date: "Jun 8, 2024",
      img: "https://images.unsplash.com/photo-1523419409543-2f8a125d5dff?auto=format&fit=crop&w=1200&q=60",
    },
    {
      id: 4,
      title: "Natural Fridge Deodorizing with Lemon",
      category: "Kitchen Tips",
      read: "4 min read",
      views: 760,
      date: "Jun 6, 2024",
      img: "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=60",
    },
    {
      id: 5,
      title: "Professional Window Cleaning Techniques",
      category: "Windows",
      read: "7 min read",
      views: 1220,
      date: "Jun 4, 2024",
      img: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=60",
    },
    {
      id: 6,
      title: "Fabric Care and Laundry Sorting",
      category: "Laundry",
      read: "6 min read",
      views: 1040,
      date: "Jun 2, 2024",
      img: "https://images.unsplash.com/photo-1495433324511-bf8e92934d90?auto=format&fit=crop&w=1200&q=60",
    },
  ];
  // Badges state (achievements tab will use this instead of static demo achievements)
  const [badges, setBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [badgesError, setBadgesError] = useState(null);

  const demoTasker = {
    name: "Sarah Johnson",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=60",
    rating: 4.9,
    pricePerHour: 25,
    location: "Downtown, 2.3 km away",
    yearsExperience: 5,
    available: true,
  };

  // Load tasker profile (skip API if no id → use demo)
  useEffect(() => {
    if (!id) {
      setTasker(demoTasker);
      // seed demo reviews for overview
      setReviewsData({
        total: 4,
        average: 4.9,
        ratingsCount: { 5: 3, 4: 1 },
        reviews: [
          {
            id: "r1",
            name: "Emily Chen",
            rating: 5,
            text: "Apartment has never been cleaner. Professional and punctual!",
            date: new Date().toISOString(),
          },
          {
            id: "r2",
            name: "Michael Rodriguez",
            rating: 5,
            text: "Eco-friendly products as requested. Very professional.",
            date: new Date(Date.now() - 86400000 * 7).toISOString(),
          },
          {
            id: "r3",
            name: "Lisa Thompson",
            rating: 4,
            text: "Great work, a bit late but excellent quality.",
            date: new Date(Date.now() - 86400000 * 14).toISOString(),
          },
          {
            id: "r4",
            name: "David Park",
            rating: 5,
            text: "Kitchen looks brand new after a party. Highly recommend!",
            date: new Date(Date.now() - 86400000 * 21).toISOString(),
          },
        ],
      });
      return;
    }
    fetch(`${API_BASE_URL}/tasker-profile/${id}`)
      .then((res) => res.json())
      .then((data) => setTasker(data))
      .catch((err) => console.error(err));
  }, [id]);

  // Load badges for achievements tab
  useEffect(() => {
    if (!id) return;
    setBadgesLoading(true);
    setBadgesError(null);
    fetch(`${API_BASE_URL}/taskers/${id}/badges`, { headers: createHeaders(token) })
      .then(res => res.json())
      .then(json => {
        // Expect json.data as array; fallback to json if array
        const arr = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
        setBadges(arr || []);
        setBadgesLoading(false);
      })
      .catch(err => {
        setBadgesError(err.message || 'Không tải được huy hiệu');
        setBadgesLoading(false);
      });
  }, [id, token]);

  // Load reviews (only if an id exists)
  useEffect(() => {
    if (skipFetch) return;
    if (activeTab === "reviews" && id) {
      const userIdParam = user?.user_id ? `?userId=${user.user_id}` : "";
      fetch(`${API_BASE_URL}/ratings/${id}${userIdParam}`, {
        headers: createHeaders(token),
      })
        .then((res) => res.json())
        .then((data) => setReviewsData(data || { reviews: [] }))
        .catch((err) => console.error(err));
    }
  }, [activeTab, id, skipFetch, user, token]);

  // reset flag mỗi khi đổi tab
  useEffect(() => setSkipFetch(false), [activeTab]);

  useEffect(() => {
    if (id && isAuthenticated()) {
      fetch(`${API_BASE_URL}/bookings/${id}/can-rate`, {
        headers: createHeaders(token),
      })
        .then((res) => res.json())
        .then((data) => {
          setCanRate(data.canRate);
          setBookingId(data.bookingId);
        })
        .catch((err) => console.error(err));
    }
  }, [id, token, isAuthenticated]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE_URL}/wishlists/${user.user_id}`, {
      headers: createHeaders(token),
    })
      .then((res) => res.json())
      .then((data) => {
        // data.taskers là mảng các tasker_id trong wishlist
        setInWishlist(data.taskers?.some((t) => t.tasker_id === Number(id)));
      })
      .catch(() => setInWishlist(false));
  }, [user, id, token]);

  const removeTasker = async (taskerId) => {
    if (!window.confirm("Bạn có chắc muốn xóa tasker này khỏi wishlist?"))
      return;
    try {
      const res = await fetch(`http://localhost:3001/api/wishlists/remove`, {
        method: "POST",
        headers: createHeaders(token),
        body: JSON.stringify({ customer_id: user.user_id, taskerId }),
      });
      if (res.ok) {
        setInWishlist(false);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const submitReview = async () => {
    if (!newFeedback.trim()) return showToast.warning("Vui lòng nhập nội dung đánh giá.");
    if (!bookingId) return showToast.error("Thiếu thông tin booking.");

    try {
      const res = await fetch(`${API_BASE_URL}/ratings`, {
        method: "POST",
        headers: createHeaders(token),
        body: JSON.stringify({
          booking_id: bookingId,
          reviewee_id: id,
          rating: newRating,
          comment: newFeedback,
        }),
      });

      const data = await res.json();
      console.log("📦 Response from API:", data);

      const status = data.status ?? data.rating?.status;

      if (status === 1) {
        showToast.success(data.message || "Đánh giá đã được đăng thành công.");

        // 🟢 Sau khi submit thành công -> Fetch lại toàn bộ danh sách review từ server
        await fetch(`${API_BASE_URL}/ratings/${id}`)
          .then((res) => res.json())
          .then((updatedData) => setReviewsData(updatedData || { reviews: [] }))
          .catch((err) =>
            console.error("❌ Lỗi khi tải lại danh sách review:", err)
          );

        // Reset form
        setCanRate(false);
        setNewRating(5);
        setNewFeedback("");
      } else {
        showToast.warning(data.message || "Không xác định trạng thái đánh giá.");
      }
    } catch (error) {
      console.error("❌ Error submitting review:", error);
      showToast.error("Lỗi kết nối hoặc máy chủ. Vui lòng thử lại.");
    }
  };

  const handleAddWishlist = async () => {
    if (!user) return showToast.info("Vui lòng đăng nhập để thêm vào wishlist!");
    try {
      const res = await fetch(`${API_BASE_URL}/wishlists/`, {
        method: "POST",
        headers: createHeaders(token),
        body: JSON.stringify({
          customer_id: user.user_id,
          favorite_taskers: [id],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setInWishlist(true);
        showToast.success("Đã thêm vào wishlist!");
      } else {
        showToast.error(data.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      showToast.error("Có lỗi xảy ra khi thêm vào wishlist!");
      console.error(err);
    }
  };

  if (!tasker)
    return <div className="container py-5 text-center">Loading...</div>;

  const tabs = [
    { id: "overview", label: "Overview", icon: faEye },
    { id: "reviews", label: "Reviews", icon: faStar },
    { id: "videos", label: "Videos", icon: faEye },
    { id: "articles", label: "Articles", icon: faAward },
    // Only show Certification tab if user is viewing their own profile and is a tasker
    ...(isTasker && user?.user_id === Number(id)
      ? [{ id: "certification", label: "Certification", icon: faAward }]
      : []),
    { id: "achievements", label: "Achievements", icon: faCheckCircle },
  ];

  return (
    <div className="tp-page">
      {/* Hero */}
      <div className="tp-hero" />

      <div className="container tp-container">
        {/* Global toast container for this page */}
        <CustomToastContainer />
        {/* Header Card */}
        <div className="tp-card tp-header">
          <div className="row align-items-center gx-4">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <img
                  src={tasker.avatar || "/images/default-avatar.png"}
                  alt={tasker.name}
                  className="tp-avatar me-3"
                />
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h3 className="tp-name mb-0">
                      {tasker.name || "Tasker Name"}
                    </h3>
                    <span className="tp-verified">
                      <FontAwesomeIcon icon={faCheckCircle} /> Verified
                      Professional
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2 tp-rating">
                    <span className="tp-rating-score">
                      {tasker.rating || 4.9}
                    </span>
                    <FontAwesomeIcon icon={faStar} />
                    <span className="text-muted small">
                      Based on 124 reviews
                    </span>
                  </div>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2 mt-3">
                {/* Hide booking/chat buttons if tasker is viewing their own profile */}
                {!(isTasker && user?.user_id === Number(id)) && (
                  <>
                    <button className="btn btn-primary tp-btn-primary">
                      <FontAwesomeIcon
                        icon={faCalendarCheck}
                        className="me-1"
                      />
                      Book Now — ${tasker.pricePerHour || 25}/hr
                    </button>
                    <button className="btn btn-outline-secondary tp-btn-outline">
                      <FontAwesomeIcon icon={faComments} className="me-1" />
                      Start Chat
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <div className="text-muted mb-1">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                {tasker.location || "Downtown, 2.3 km away"}
              </div>
              <div className="text-muted mb-1">
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
        <div className="tp-card p-0 mt-4">
          <ul className="nav nav-pills tp-tabs mb-0 p-2">
            {tabs.map((tab) => (
              <li className="nav-item" key={tab.id}>
                <button
                  className={`nav-link tp-tab ${
                    activeTab === tab.id ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <FontAwesomeIcon icon={tab.icon} className="me-1" />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="p-3 p-md-4">
            {activeTab === "overview" && (
              <div>
                {/* Intro summary strip with badges */}
                <div className="row g-3 mb-3">
                  <div className="col-md-12">
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <span className="tp-badge">
                        <FontAwesomeIcon
                          icon={faMapMarkerAlt}
                          className="me-1"
                        />
                        {tasker.location || "Downtown, 2.3 km away"}
                      </span>
                      <span className="tp-badge">
                        {tasker.yearsExperience || 5} years experience
                      </span>
                      <span
                        className="tp-badge"
                        style={{
                          background: "#e6f7ef",
                          borderColor: "#b7e4cd",
                          color: "#0f766e",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="me-1"
                        />
                        Available Now
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-muted">
                  Professional house cleaner with 5+ years of experience. I
                  specialize in deep cleaning, kitchen sanitization, and
                  eco-friendly cleaning methods. I take pride in delivering
                  exceptional results and building long-term relationships with
                  my clients.
                </p>

                {/* Specializations & Languages */}
                <div className="row g-3 mb-4">
                  <div className="col-md-8">
                    <div className="mb-2 fw-semibold">Specializations</div>
                    <div className="d-flex flex-wrap gap-2">
                      {specialties.map((s) => (
                        <span
                          key={s}
                          className="badge bg-primary-subtle text-primary border"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-2 fw-semibold">Languages</div>
                    <div className="d-flex flex-wrap gap-2">
                      {languages.map((l) => (
                        <span
                          key={l}
                          className="badge bg-secondary-subtle text-secondary border"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats tiles */}
                <div className="row g-3 mb-4">
                  {stats.map((st) => (
                    <div key={st.label} className="col-12 col-md-4">
                      <div className="tp-tile">
                        <div className="fs-4 fw-bold">{st.value}</div>
                        <div className="text-muted">{st.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Availability & Reviews snapshot */}
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="tp-card">
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2">⚡</span>
                        <div className="fw-semibold">
                          Availability & Services
                        </div>
                      </div>
                      <div className="d-flex justify-content-between">
                        <div>
                          <div className="text-muted">Status</div>
                          <div className="badge bg-success">Available</div>
                        </div>
                        <div className="text-end">
                          <div className="text-muted">Next Slot</div>
                          <div className="badge bg-info text-dark">
                            Today 2PM
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="tp-card">
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2">💬</span>
                        <div className="fw-semibold">Recent Reviews</div>
                      </div>
                      <div className="small text-muted">
                        Customers love the eco-friendly methods and attention to
                        detail.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="row">
                {/* Rating Overview */}
                <div className="col-md-4 text-center">
                  <h1 className="display-4 fw-bold text-primary">
                    {reviewsData.average?.toFixed(1) || "0.0"}
                  </h1>
                  <div className="mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FontAwesomeIcon
                        key={star}
                        icon={faStar}
                        className={
                          star <= Math.round(reviewsData.average || 0)
                            ? "text-warning"
                            : "text-muted"
                        }
                      />
                    ))}
                  </div>
                  <p className="text-muted">{reviewsData.total} reviews</p>

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
                          ></div>
                        </div>
                        <span>{count}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Reviews + Form */}
                <div className="col-md-8">
                  {reviewsData?.reviews?.length > 0 ? (
                    reviewsData.reviews
                      .filter((review) => review) // loại null/undefined
                      .map((review) => (
                        <div
                          key={review.id || Math.random()}
                          className="card shadow-sm mb-3 p-3"
                        >
                          <div className="d-flex align-items-start">
                            {/* Avatar */}
                            <img
                              src={
                                review.avatar || "/images/default-avatar.png"
                              }
                              alt={review.name}
                              className="rounded-circle me-3"
                              style={{
                                width: "50px",
                                height: "50px",
                                objectFit: "cover",
                              }}
                            />

                            <div className="flex-grow-1">
                              {/* Header */}
                              <div className="d-flex align-items-center mb-1">
                                <strong className="me-2">
                                  {review?.name || "Ẩn danh"}
                                </strong>
                                <span className="badge bg-primary me-2">
                                  Verified
                                </span>
                              </div>

                              {/* Date */}
                              <small className="text-muted d-block mb-2">
                                {review.date ? review.date.split("T")[0] : ""}
                              </small>
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

                              {/* Comment */}
                              <p className="mb-2">
                                {review?.text || "Không có nhận xét."}
                              </p>
                              {/* Staff Reply */}
                              {review.staff_reply && (
                                <div className="mt-2 ms-4 p-2 bg-light border-start border-primary rounded">
                                  <strong>Phản hồi từ tasker:</strong>{" "}
                                  <span>{review.staff_reply}</span>
                                </div>
                              )}
                              {/* ✅ Nếu người dùng hiện tại chính là tasker (người được đánh giá) */}
                              {user?.user_id === review.reviewee_id &&
                                !review.staff_reply && (
                                  <div className="mt-3 ms-4 p-2 border rounded bg-light">
                                    <label className="form-label fw-semibold">
                                      Phản hồi:
                                    </label>
                                    <textarea
                                      className="form-control mb-2"
                                      rows="2"
                                      placeholder="Nhập phản hồi của bạn..."
                                      value={review.replyDraft || ""}
                                      onChange={(e) => {
                                        const updatedReviews =
                                          reviewsData.reviews.map((r) =>
                                            r.id === review.id
                                              ? {
                                                  ...r,
                                                  replyDraft: e.target.value,
                                                }
                                              : r
                                          );
                                        setReviewsData({
                                          ...reviewsData,
                                          reviews: updatedReviews,
                                        });
                                      }}
                                    />
                                    <button
                                      className="btn btn-sm btn-primary"
                                      onClick={async () => {
                                        try {
                                          const res = await fetch(
                                            `${API_BASE_URL}/ratings/${review.id}/reply`,
                                            {
                                              method: "POST",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                                Authorization: `Bearer ${token}`,
                                              },
                                              body: JSON.stringify({
                                                reply: review.replyDraft,
                                              }),
                                            }
                                          );

                                          if (res.ok) {
                                            showToast.success("Phản hồi đã được gửi!");

                                            // 🟢 Cập nhật trực tiếp vào state để hiển thị ngay lập tức
                                            const updatedReviews =
                                              reviewsData.reviews.map((r) =>
                                                r.id === review.id
                                                  ? {
                                                      ...r,
                                                      staff_reply:
                                                        review.replyDraft,
                                                    }
                                                  : r
                                              );

                                            setReviewsData({
                                              ...reviewsData,
                                              reviews: updatedReviews,
                                            });

                                            // (Tuỳ chọn) nếu muốn load lại từ server:
                                            // const refreshed = await fetch(`${API_BASE_URL}/ratings/${id}`);
                                            // const updated = await refreshed.json();
                                            // setReviewsData(updated || { reviews: [] });
                                          } else {
                                            const err = await res.json();
                                            showToast.error(
                                              `Không thể gửi phản hồi: ${
                                                err.message ||
                                                "Lỗi không xác định."
                                              }`
                                            );
                                          }
                                        } catch (error) {
                                          console.error(
                                            "❌ Lỗi khi gửi phản hồi:",
                                            error
                                          );
                                          showToast.error(
                                            "Lỗi kết nối hoặc máy chủ. Vui lòng thử lại."
                                          );
                                        }
                                      }}
                                    >
                                      Gửi phản hồi
                                    </button>
                                  </div>
                                )}

                              {/* Helpful button */}
                              {user?.user_id !== review.reviewer_id && (
                                <div className="mt-3 d-flex justify-content-start">
                                  <button
                                    className={`btn btn-sm ${
                                      review.userLiked
                                        ? "btn-success"
                                        : "btn-outline-secondary"
                                    }`}
                                    style={{
                                      borderRadius: "20px",
                                      padding: "4px 12px",
                                      marginTop: "6px",
                                    }}
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(
                                          `${API_BASE_URL}/ratings/${review.id}/helpful`,
                                          {
                                            method: "POST",
                                            headers: createHeaders(token),
                                          }
                                        );

                                        if (!res.ok) {
                                          const err = await res.json();
                                          showToast.error(
                                            err.message ||
                                              "Không thể cập nhật lượt hữu ích."
                                          );
                                          return;
                                        }

                                        const data = await res.json();

                                        // Update trực tiếp theo backend
                                        const updatedReviews =
                                          reviewsData.reviews.map((r) =>
                                            r.id === review.id
                                              ? {
                                                  ...r,
                                                  helpful: data.helpful,
                                                  userLiked: data.liked,
                                                }
                                              : r
                                          );

                                        setReviewsData({
                                          ...reviewsData,
                                          reviews: updatedReviews,
                                        });
                                      } catch (error) {
                                        console.error(
                                          "❌ Lỗi khi bấm hữu ích:",
                                          error
                                        );
                                        showToast.error("Lỗi kết nối hoặc máy chủ.");
                                      }
                                    }}
                                  >
                                    👍 Hữu ích ({review.helpful || 0})
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
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
                                star <= newRating
                                  ? "text-warning"
                                  : "text-muted"
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
                      <button
                        className="btn btn-primary"
                        onClick={submitReview}
                      >
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

            {activeTab === "videos" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="fw-bold">Featured Videos</div>
                  <div className="text-muted small">Recent Videos</div>
                </div>
                <div className="row g-3">
                  {featuredVideos.map((v) => (
                    <div key={v.id} className="col-md-4">
                      <div className="tp-card tp-media-card h-100">
                        <div className="thumb w-100">
                          <img src={v.img} alt={v.title} />
                        </div>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="time">{v.minutes}</div>
                            <div className="text-muted small">{v.when}</div>
                          </div>
                          <h6 className="fw-semibold mb-2">{v.title}</h6>
                          <div className="meta">
                            {v.views} views · {v.likes} like
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "articles" && (
              <div>
                <h5 className="mb-3">Cleaning Tips & Guides</h5>
                <div className="p-3 rounded border bg-white mb-4">
                  <div className="row g-2 align-items-center">
                    <div className="col-md-8">
                      <input
                        className="form-control"
                        placeholder="Search across, tips, or techniques..."
                      />
                    </div>
                    <div className="col-md-4 text-md-end">
                      <div className="d-inline-flex flex-wrap gap-2">
                        {[
                          "All Articles",
                          "Furniture Care",
                          "Kitchen Tips",
                          "Bathroom Care",
                          "Eco-Friendly",
                        ].map((f) => (
                          <span
                            key={f}
                            className="badge bg-light text-dark border"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="fw-semibold mb-2">Featured Articles</div>
                <div className="row g-3 mb-4">
                  {featuredArticles.map((a) => (
                    <div key={a.id} className="col-md-6">
                      <div className="tp-card tp-media-card h-100">
                        <div className="thumb w-100" style={{ height: 220 }}>
                          <img src={a.img} alt={a.title} />
                        </div>
                        <div className="card-body">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="badge bg-warning-subtle text-warning border">
                              Featured
                            </span>
                            <span className="badge bg-light text-dark border">
                              {a.category}
                            </span>
                          </div>
                          <h6 className="fw-semibold mb-2">{a.title}</h6>
                          <div className="meta">
                            {a.views} views • {a.read}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="fw-semibold mb-2">All Articles</div>
                <div className="row g-3">
                  {moreArticles.map((a) => (
                    <div key={a.id} className="col-md-3">
                      <div className="tp-card tp-media-card h-100">
                        <div className="thumb w-100" style={{ height: 140 }}>
                          <img src={a.img} alt={a.title} />
                        </div>
                        <div className="card-body">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="badge bg-light text-dark border">
                              {a.category}
                            </span>
                            <span className="text-muted small">{a.date}</span>
                          </div>
                          <div className="fw-semibold small mb-1">
                            {a.title}
                          </div>
                          <div className="meta">
                            {a.views} views • {a.read}
                          </div>
                        </div>
                        <div className="card-footer bg-white border-0 pt-0 pb-3">
                          <button className="btn btn-sm btn-primary w-100">
                            Read Full Article
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "certification" &&
              isTasker &&
              user?.user_id === Number(id) && (
                <div className="row g-3">
                  <div className="col-12">
                    <div className="p-4 rounded border bg-white h-100 shadow-sm">
                      <h4 className="fw-bold mb-3">Đăng kí dịch vụ</h4>
                      {/* List all certificates for the logged-in tasker */}
                      <TaskerCertificateList taskerId={id} />
                      <hr className="my-4" />
                      <CertificationRegisterSection />
                    </div>
                  </div>
                </div>
              )}
            {activeTab === "achievements" && (
              <div>
                <h5 className="mb-3">Huy hiệu đạt được</h5>
                {badgesLoading && <div>Đang tải huy hiệu...</div>}
                {badgesError && <div className="alert alert-danger small">{badgesError}</div>}
                {!badgesLoading && !badgesError && badges.length === 0 && (
                  <div className="alert alert-info">Chưa có huy hiệu nào.</div>
                )}
                <div className="row g-3">
                  {badges.map((b) => (
                    <div key={b.badge_id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                      <div className="p-3 rounded border bg-white h-100 shadow-sm d-flex flex-column">
                        <div className="d-flex align-items-center mb-2" style={{ minHeight: 54 }}>
                          {b.icon_url ? (
                            <img
                              src={b.icon_url}
                              alt={b.badge_name}
                              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '50%', border: '2px solid #eee', background: '#fff' }}
                            />
                          ) : (
                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width:48, height:48 }}>🏅</div>
                          )}
                          <div className="ms-2 flex-grow-1">
                            <div className="fw-semibold small mb-1" title={b.badge_name}>
                              {b.badge_name}
                            </div>

                            {b.earned_at && (
                              <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
                                <FontAwesomeIcon icon={faClockRegular} className="me-1" />
                                {new Date(b.earned_at).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                          </div>
                        </div>
                        {b.description && (
                          <div className="text-muted small flex-grow-1" style={{ minHeight: 40 }}>
                            {b.description.length > 110 ? b.description.slice(0, 107) + '…' : b.description}
                          </div>
                        )}
                        <div className="mt-auto pt-2 small d-flex justify-content-between align-items-center">
                          {b.criteria_key && (
                            <span className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: '0.65rem' }}>
                              {b.criteria_key}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CertificationRegisterSection = () => {
  const [showForm, setShowForm] = useState(false);
  const [excludeServiceIds, setExcludeServiceIds] = useState([]);
  const [excludeVariantIds, setExcludeVariantIds] = useState([]);
  const { id } = useParams();
  useEffect(() => {
    if (!id) return;
    // // Fetch registered service_ids
    // fetch(`${API_BASE_URL}/tasker/${id}/service-variants`)
    //   .then(res => res.json())
    //   .then(data => {
    //     if (Array.isArray(data)) setExcludeServiceIds(data.map(sid => String(sid)));
    //     else if (Array.isArray(data.data)) setExcludeServiceIds(data.data.map(sid => String(sid)));
    //   })
    //   .catch(() => setExcludeServiceIds([]));
    // Fetch registered variant_ids
    fetch(`${API_BASE_URL}/tasker/${id}/registered-variants`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data))
          setExcludeVariantIds(data.data.map((vid) => String(vid)));
        else if (Array.isArray(data))
          setExcludeVariantIds(data.map((vid) => String(vid)));
      })
      .catch(() => setExcludeVariantIds([]));
  }, [id]);

  // Gửi đăng ký và tạo bản ghi TaskerCertifications với status pending
  const handleSubmit = async (data) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      const payload = {
        service_id: Number(data.service_id),
        variant_ids: (data.variant_ids || data.variants || []).map(v => Number(v)),
        cert_ids: (data.certs || []).map(c => c.cert_public_id),
        certs: data.certs,
        status: 'pending'
      };
      // If service does NOT require certs and none provided, allow empty cert arrays
      if (data.no_cert_required && payload.cert_ids.length === 0) {
        payload.cert_ids = [];
        payload.certs = [];
      }
      const res = await fetch(`${API_BASE_URL}/tasker/certifications/pending`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast.success('Đăng ký thành công! Chờ duyệt.');
        // Đóng form sau khi đăng ký thành công
        setShowForm(false);
      } else {
        showToast.error('Không thể tạo đăng ký: ' + (json.message || 'Lỗi không xác định'));
      }
    } catch (e) {
      showToast.error('Lỗi khi tạo đăng ký: ' + e.message);
    }
  };

  return (
    <>
      {!showForm ? (
        <button
          className="btn btn-success mt-3"
          onClick={() => setShowForm(true)}
        >
          Đăng ký
        </button>
      ) : (
        <TaskerCertificateRegister
          onSubmit={handleSubmit}
          excludeServiceIds={excludeServiceIds}
          excludeVariantIds={excludeVariantIds}
        />
      )}
      {/* Kết quả và trạng thái được hiển thị qua toast, không cần block hiển thị chi tiết tại đây */}
    </>
  );
};

export default TaskerProfile;
