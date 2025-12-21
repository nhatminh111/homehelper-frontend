import React, { useEffect, useState, useCallback, useMemo } from "react";
import "../../css/TaskerProfile.css";
import { useAuth } from "../../contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faCheckCircle,
  faEye,
  faAward,
  faCalendarCheck,
  faComments,
  faCopy,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import { faClock as faClockRegular } from "@fortawesome/free-regular-svg-icons";
import TaskerCertificateRegister from '../../components/TaskerCertificateRegister';
import { CustomToastContainer, showToast } from '../../components/common/CustomToast';

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
                        className={`badge px-3 py-2 ${cert.status === 'Approved'
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
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const {
    user,
    token,
    loading: authLoading,
    isAuthenticated,
    isTasker,
  } = useAuth();

  // Nếu không có id trong URL, sử dụng user_id của user hiện tại (dành cho tasker xem profile của chính mình)
  // Sử dụng useMemo để re-compute khi user thay đổi
  const id = useMemo(() => {
    if (paramId) return paramId;
    if (user?.user_id) return String(user.user_id);
    return null;
  }, [paramId, user?.user_id]);

  // Kiểm tra xem đây có phải profile của chính user đang đăng nhập không
  const isOwnProfile = useMemo(() => {
    if (!user?.user_id) return false;
    // Nếu không có paramId và user là tasker -> đang xem profile của chính mình
    if (!paramId && isTasker()) return true;
    // Nếu có paramId và trùng với user_id -> đang xem profile của chính mình
    if (paramId && String(user.user_id) === String(paramId)) return true;
    return false;
  }, [paramId, user?.user_id, isTasker]);

  const [tasker, setTasker] = useState(null);
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    total: 0,
    average: 0,
    ratingsCount: {},
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [canRate, setCanRate] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [newRating, setNewRating] = useState(5);
  const [newFeedback, setNewFeedback] = useState("");
  const [inWishlist, setInWishlist] = useState(false);
  const [skipFetch, setSkipFetch] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");

  // Videos state
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Articles state
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  // State cho edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    Introduce: ""
  });
  const [saving, setSaving] = useState(false);

  // Cập nhật editForm khi tasker data thay đổi
  useEffect(() => {
    if (tasker) {
      setEditForm({
        name: tasker.name || "",
        phone: tasker.phone || "",
        Introduce: tasker.Introduce || ""
      });
    }
  }, [tasker]);

  // Hàm lưu thông tin profile
  const handleSaveProfile = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tasker-profile/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTasker(data.data);
        setIsEditing(false);
        showToast.success("Cập nhật thông tin thành công!");
      } else {
        showToast.error(data.message || "Lỗi khi cập nhật thông tin");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      showToast.error("Lỗi kết nối server");
    }
    setSaving(false);
  };

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

  // Set profile URL khi xem profile của chính mình
  useEffect(() => {
    if (isOwnProfile && id) {
      const fullUrl = `${window.location.origin}/tasker-profile/${id}`;
      setProfileUrl(fullUrl);
    }
  }, [isOwnProfile, id]);

  // Load tasker profile - đợi auth load xong trước
  useEffect(() => {
    // Đợi auth loading xong
    if (authLoading) return;

    // Nếu không có id (và cũng không có user), hiển thị demo
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

    // Có id -> fetch từ API
    console.log("🔍 Fetching tasker profile for id:", id);
    fetch(`${API_BASE_URL}/tasker-profile/${id}`)
      .then((res) => {
        console.log("📡 API Response status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("📦 Tasker data received:", data);
        // Kiểm tra nếu API trả về error
        if (data.error || data.message) {
          console.error("❌ API Error:", data.message || data.error);
          setTasker(demoTasker);
          return;
        }
        // Kiểm tra có data hợp lệ không
        if (data && data.name) {
          setTasker(data);
        } else {
          console.warn("⚠️ Invalid tasker data, using demo");
          setTasker(demoTasker);
        }
      })
      .catch((err) => {
        console.error("❌ Fetch error:", err);
        setTasker(demoTasker);
      });
  }, [id, authLoading]);

  // Load badges for achievements tab
  useEffect(() => {
    if (authLoading || !id) return;
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
  }, [id, token, authLoading]);

  // Load videos when switching to videos tab
  useEffect(() => {
    if (activeTab === "videos" && id) {
      setLoadingVideos(true);
      fetch(`${API_BASE_URL}/videos/user/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.videos) {
            setVideos(data.videos);
          }
        })
        .catch((err) => console.error("Fetch videos error:", err))
        .finally(() => setLoadingVideos(false));
    }
  }, [activeTab, id]);

  // Load articles when switching to articles tab
  useEffect(() => {
    if (activeTab === "articles" && id) {
      setLoadingArticles(true);
      fetch(`${API_BASE_URL}/blogs?user_id=${id}&status=Approved`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setArticles(data.data);
          }
        })
        .catch((err) => console.error("Fetch articles error:", err))
        .finally(() => setLoadingArticles(false));
    }
  }, [activeTab, id]);

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
    // Không cần check can-rate khi xem profile của chính mình
    if (isOwnProfile) return;
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
  }, [id, token, isAuthenticated, isOwnProfile]);

  useEffect(() => {
    // Không cần check wishlist khi xem profile của chính mình
    if (isOwnProfile) return;
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
  }, [user, id, token, isOwnProfile]);

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

  // Hiển thị loading khi đang load auth hoặc chưa có data tasker
  if (authLoading)
    return <div className="container py-5 text-center">Loading...</div>;

  // Nếu không có tasker data và đang xem profile của chính mình
  if (!tasker && isOwnProfile) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning">
          <h4>Bạn chưa có hồ sơ Tasker!</h4>
          <p>Bạn cần đăng ký trở thành Tasker để có hồ sơ.</p>
          <a href="/become-tasker" className="btn btn-primary">
            Trở thành Tasker ngay
          </a>
        </div>
      </div>
    );
  }

  if (!tasker)
    return <div className="container py-5 text-center">Loading...</div>;

  const tabs = [
    { id: "overview", label: "Tổng quan", icon: faEye },
    { id: "reviews", label: "Đánh giá", icon: faStar },
    { id: "videos", label: "Video", icon: faEye },
    { id: "articles", label: "Bài viết", icon: faAward },
    // Only show Certification tab if user is viewing their own profile and is a tasker
    ...(isTasker() && user?.user_id === Number(id)
      ? [{ id: "certification", label: "Chứng chỉ", icon: faAward }]
      : []),
    { id: "achievements", label: "Thành tích", icon: faCheckCircle },
  ];

  return (
    <div className="tp-page">
      {/* Hero */}
      <div className="tp-hero" />

      <div className="container tp-container">
        {/* Global toast container for this page */}
        <CustomToastContainer />
        {/* Profile URL Banner - Hiển thị khi xem profile của chính mình */}
        {isOwnProfile && profileUrl && (
          <div className="tp-url-banner mb-4">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center"
                  style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                  <FontAwesomeIcon icon={faLink} style={{ fontSize: '20px' }} />
                </div>
                <div>
                  <div className="fw-bold" style={{ fontSize: '16px' }}>🔗 Link Profile của bạn</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>
                    Chia sẻ để khách hàng dễ dàng tìm thấy bạn
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '500px' }}>
                <input
                  type="text"
                  className="form-control tp-url-input"
                  value={profileUrl}
                  readOnly
                  onClick={(e) => e.target.select()}
                />
                <button
                  className="tp-copy-btn d-flex align-items-center gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(profileUrl);
                    showToast.success('🎉 Đã sao chép URL!');
                  }}
                >
                  <FontAwesomeIcon icon={faCopy} />
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header Card */}
        <div className="tp-card tp-header">
          <div className="row align-items-center gx-4">
            {/* Avatar & Info */}
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-4">
                {/* Avatar với upload */}
                <div className="position-relative">
                  <img
                    src={tasker.avatar_url || "/images/default-avatar.png"}
                    alt={tasker.name}
                    className="tp-avatar"
                    style={{ width: '120px', height: '120px' }}
                  />
                  {isOwnProfile && (
                    <label
                      className="position-absolute d-flex align-items-center justify-content-center"
                      style={{
                        bottom: '5px', right: '5px',
                        width: '36px', height: '36px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%', cursor: 'pointer',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                      title="Thay đổi ảnh đại diện"
                    >
                      <i className="bi bi-camera-fill text-white" style={{ fontSize: '14px' }}></i>
                      <input
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;

                          // Validate file size (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            showToast.error('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 5MB');
                            return;
                          }

                          // Show preview immediately
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setTasker({ ...tasker, avatar_url: ev.target.result });
                          };
                          reader.readAsDataURL(file);

                          // Upload to server
                          try {
                            showToast.info('Đang tải ảnh lên...');

                            const formData = new FormData();
                            formData.append('avatar', file);

                            const uploadRes = await fetch(`${API_BASE_URL}/uploads/avatar`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`
                              },
                              body: formData
                            });

                            const uploadData = await uploadRes.json();

                            if (!uploadRes.ok || !uploadData.success) {
                              throw new Error(uploadData.message || 'Upload thất bại');
                            }

                            // Save encrypted URL to database
                            const encryptedUrl = uploadData.data.encrypted_url;
                            const originalUrl = uploadData.data.url;
                            console.log('📸 Upload response:', { encryptedUrl, originalUrl });

                            const saveRes = await fetch(`${API_BASE_URL}/tasker-profile/${id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ avatar_url: encryptedUrl })
                            });

                            const saveData = await saveRes.json();

                            if (saveRes.ok && saveData.success) {
                              // Update UI with original URL for display
                              setTasker(prev => ({ ...prev, avatar_url: originalUrl }));
                              showToast.success('Cập nhật ảnh đại diện thành công!');
                            } else {
                              throw new Error(saveData.message || 'Lưu ảnh thất bại');
                            }
                          } catch (err) {
                            console.error('Avatar upload error:', err);
                            showToast.error(err.message || 'Lỗi khi tải ảnh lên');
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Info */}
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                    <h2 className="tp-name mb-0" style={{ fontSize: '1.75rem' }}>
                      {tasker.name || "Chưa cập nhật tên"}
                    </h2>
                    {tasker.status === 'Active' && (
                      <span className="tp-verified">
                        <FontAwesomeIcon icon={faCheckCircle} /> Đã xác minh
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="d-flex align-items-center gap-1">
                      <span className="tp-rating-score">
                        {tasker.rating ? Number(tasker.rating).toFixed(1) : "0.0"}
                      </span>
                      <FontAwesomeIcon icon={faStar} className="text-warning" />
                    </div>
                    <span className="text-muted">
                      ({tasker.reviewCount || 0} đánh giá)
                    </span>
                    {tasker.status === 'Active' && (
                      <span className="badge bg-success px-3 py-2" style={{ borderRadius: '20px' }}>
                        <i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i>
                        Đang hoạt động
                      </span>
                    )}
                  </div>

                  {/* Contact info */}
                  <div className="d-flex flex-wrap gap-3 text-muted" style={{ fontSize: '14px' }}>
                    {tasker.email && (
                      <span>
                        <i className="bi bi-envelope me-1" style={{ color: '#667eea' }}></i>
                        {tasker.email}
                      </span>
                    )}
                    {tasker.phone && (
                      <span>
                        <i className="bi bi-telephone me-1" style={{ color: '#667eea' }}></i>
                        {tasker.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="col-lg-4 mt-4 mt-lg-0">
              <div className="d-flex flex-column gap-2">
                {/* Hide booking/chat buttons if tasker is viewing their own profile */}
                {!isOwnProfile && (
                  <>
                    <button
                      className="btn tp-btn-primary w-100"
                      onClick={() => window.location.href = `/booking/${id}`}
                    >
                      <FontAwesomeIcon icon={faCalendarCheck} className="me-2" />
                      Đặt lịch ngay
                    </button>
                    <button
                      className="btn tp-btn-outline w-100"
                      onClick={() => window.location.href = `/chat?userId=${id}`}
                    >
                      <FontAwesomeIcon icon={faComments} className="me-2" />
                      Nhắn tin
                    </button>
                  </>
                )}
                {isOwnProfile && (
                  <div className="text-center p-3 rounded" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd' }}>
                    <i className="bi bi-info-circle me-2" style={{ color: '#0284c7' }}></i>
                    <span style={{ color: '#0369a1', fontSize: '14px' }}>
                      Đây là trang profile công khai của bạn
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tp-card p-0 mt-4">
          <ul className="nav nav-pills tp-tabs mb-0 p-2">
            {tabs.map((tab) => (
              <li className="nav-item" key={tab.id}>
                <button
                  className={`nav-link tp-tab ${activeTab === tab.id ? "active" : ""
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
                {/* Header với nút Edit khi xem profile của chính mình */}
                {isOwnProfile && (
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-3" style={{ borderBottom: '2px solid #f1f5f9' }}>
                    <div>
                      <h4 className="mb-1 fw-bold" style={{ color: '#1e293b' }}>
                        {isEditing ? '✏️ Chỉnh sửa thông tin' : '👤 Thông tin của bạn'}
                      </h4>
                      <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                        {isEditing ? 'Cập nhật thông tin cá nhân của bạn' : 'Quản lý thông tin hiển thị với khách hàng'}
                      </p>
                    </div>
                    {!isEditing ? (
                      <button
                        className="tp-edit-btn"
                        onClick={() => setIsEditing(true)}
                      >
                        <i className="bi bi-pencil-square"></i>
                        Chỉnh sửa
                      </button>
                    ) : (
                      <div className="d-flex gap-2">
                        <button
                          className="tp-save-btn"
                          onClick={handleSaveProfile}
                          disabled={saving}
                        >
                          <i className="bi bi-check2-circle me-1"></i>
                          {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                        <button
                          className="tp-cancel-btn"
                          onClick={() => {
                            setIsEditing(false);
                            setEditForm({
                              name: tasker.name || "",
                              phone: tasker.phone || "",
                              Introduce: tasker.Introduce || ""
                            });
                          }}
                        >
                          <i className="bi bi-x-circle me-1"></i>
                          Hủy bỏ
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Thông tin cơ bản */}
                <div className="tp-info-card mb-4">
                  <h5>
                    <i className="bi bi-person-circle"></i>
                    Thông tin cơ bản
                  </h5>

                  {isEditing ? (
                    // Form chỉnh sửa
                    <div className="row g-4">
                      <div className="col-md-6">
                        <label className="tp-info-label">Họ và tên</label>
                        <input
                          type="text"
                          className="form-control tp-form-control"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Nhập họ và tên"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="tp-info-label">Số điện thoại</label>
                        <input
                          type="tel"
                          className="form-control tp-form-control"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                      <div className="col-12">
                        <label className="tp-info-label">Email</label>
                        <input
                          type="email"
                          className="form-control tp-form-control"
                          value={tasker.email || ""}
                          disabled
                        />
                        <small className="text-muted mt-1 d-block">
                          <i className="bi bi-lock me-1"></i>Email không thể thay đổi
                        </small>
                      </div>
                      <div className="col-12">
                        <label className="tp-info-label">Giới thiệu bản thân</label>
                        <textarea
                          className="form-control tp-form-control"
                          rows="5"
                          value={editForm.Introduce}
                          onChange={(e) => setEditForm({ ...editForm, Introduce: e.target.value })}
                          placeholder="Mô tả về bản thân, kinh nghiệm làm việc, kỹ năng chuyên môn..."
                        />
                      </div>
                    </div>
                  ) : (
                    // Hiển thị thông tin
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="tp-info-label">Họ và tên</div>
                        <div className="tp-info-value">{tasker.name || "Chưa cập nhật"}</div>
                      </div>
                      <div className="col-md-6">
                        <div className="tp-info-label">Số điện thoại</div>
                        <div className="tp-info-value">
                          <i className="bi bi-telephone me-2" style={{ color: '#667eea' }}></i>
                          {tasker.phone || "Chưa cập nhật"}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="tp-info-label">Email</div>
                        <div className="tp-info-value">
                          <i className="bi bi-envelope me-2" style={{ color: '#667eea' }}></i>
                          {tasker.email || "Chưa cập nhật"}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="tp-info-label">Trạng thái tài khoản</div>
                        <span className={`badge px-3 py-2 ${tasker.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}
                          style={{ fontSize: '14px', borderRadius: '20px' }}>
                          <i className={`bi ${tasker.status === 'Active' ? 'bi-check-circle' : 'bi-pause-circle'} me-1`}></i>
                          {tasker.status === 'Active' ? 'Đang hoạt động' : tasker.status || 'Chưa xác định'}
                        </span>
                      </div>
                      <div className="col-12">
                        <div className="tp-info-label">Giới thiệu bản thân</div>
                        <div className="tp-bio">
                          {tasker.Introduce || (
                            <span className="text-muted fst-italic">
                              Chưa có thông tin giới thiệu.
                              {isOwnProfile && " Hãy thêm mô tả về bản thân để khách hàng hiểu hơn về bạn!"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Thống kê */}
                <div className="tp-info-card mb-4">
                  <h5>
                    <i className="bi bi-graph-up-arrow"></i>
                    Thống kê hoạt động
                  </h5>
                  <div className="row g-3">
                    <div className="col-6 col-md-3">
                      <div className="tp-stat-card">
                        <div className="tp-stat-value">
                          {tasker.rating ? Number(tasker.rating).toFixed(1) : "0.0"}
                        </div>
                        <div className="tp-stat-label">
                          <i className="bi bi-star-fill me-1" style={{ color: '#f59e0b' }}></i>
                          Đánh giá
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="tp-stat-card">
                        <div className="tp-stat-value success">
                          {tasker.reviewCount || 0}
                        </div>
                        <div className="tp-stat-label">
                          <i className="bi bi-chat-dots me-1" style={{ color: '#10b981' }}></i>
                          Lượt đánh giá
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="tp-stat-card">
                        <div className="tp-stat-value info">
                          {tasker.reliability_score || 100}%
                        </div>
                        <div className="tp-stat-label">
                          <i className="bi bi-shield-check me-1" style={{ color: '#06b6d4' }}></i>
                          Độ tin cậy
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="tp-stat-card">
                        <div className="tp-stat-value warning">
                          <FontAwesomeIcon icon={faStar} />
                        </div>
                        <div className="tp-stat-label">
                          {tasker.status === 'Active' ? (
                            <><i className="bi bi-lightning-charge me-1" style={{ color: '#f59e0b' }}></i>Hoạt động</>
                          ) : (
                            <><i className="bi bi-moon me-1"></i>Tạm nghỉ</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Status Cards */}
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="tp-status-card">
                      <div className="header">
                        <span className="icon">⚡</span>
                        <span className="title">Trạng thái làm việc</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="tp-info-label mb-1">Tình trạng</div>
                          <span className={`badge px-3 py-2 ${tasker.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}
                            style={{ borderRadius: '20px' }}>
                            {tasker.status === 'Active' ? '🟢 Sẵn sàng nhận việc' : '⏸️ Tạm nghỉ'}
                          </span>
                        </div>
                        <div className="text-end">
                          <div className="tp-info-label mb-1">Điểm tin cậy</div>
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <div className="progress" style={{ width: '80px', height: '8px', borderRadius: '10px' }}>
                              <div
                                className="progress-bar bg-info"
                                style={{ width: `${tasker.reliability_score || 100}%`, borderRadius: '10px' }}
                              ></div>
                            </div>
                            <span className="fw-bold" style={{ color: '#06b6d4' }}>
                              {tasker.reliability_score || 100}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="tp-status-card">
                      <div className="header">
                        <span className="icon">💬</span>
                        <span className="title">Đánh giá từ khách hàng</span>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center">
                          {[1, 2, 3, 4, 5].map(star => (
                            <FontAwesomeIcon
                              key={star}
                              icon={faStar}
                              className={star <= Math.round(tasker.rating || 0) ? "text-warning" : "text-muted"}
                              style={{ fontSize: '18px', marginRight: '2px' }}
                            />
                          ))}
                        </div>
                        <div>
                          <span className="fw-bold" style={{ fontSize: '18px' }}>
                            {tasker.rating ? Number(tasker.rating).toFixed(1) : "0.0"}
                          </span>
                          <span className="text-muted ms-1">/ 5.0</span>
                        </div>
                      </div>
                      <div className="text-muted mt-2" style={{ fontSize: '14px' }}>
                        {tasker.reviewCount > 0
                          ? `Dựa trên ${tasker.reviewCount} đánh giá từ khách hàng`
                          : "Chưa có đánh giá nào. Hoàn thành công việc tốt để nhận đánh giá!"
                        }
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
                  {/* Reviews List */}
                  {reviewsData?.reviews?.length > 0 ? (
                    reviewsData.reviews
                      .filter((review) => review) // loại null/undefined
                      .map((review) => (
                        <div
                          key={review.id || Math.random()}
                          className="card shadow-sm mb-4 border-0"
                          style={{ borderRadius: "12px", overflow: "hidden" }}
                        >
                          <div className="card-body p-4">
                            <div className="d-flex align-items-start gap-3">
                              {/* Avatar */}
                              <img
                                src={
                                  review.avatar || "/images/default-avatar.png"
                                }
                                alt={review.name}
                                className="rounded-circle shadow-sm"
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  objectFit: "cover",
                                  border: "2px solid #fff",
                                }}
                              />

                              <div className="flex-grow-1">
                                {/* Header: Name, Verified, Service Badge */}
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <div>
                                    <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                      {review?.name || "Khách hàng ẩn danh"}
                                      <span
                                        className="badge bg-success-subtle text-success d-flex align-items-center gap-1"
                                        style={{ fontSize: '0.75rem', padding: '0.35em 0.65em', borderRadius: '20px' }}
                                      >
                                        <FontAwesomeIcon icon={faCheckCircle} /> Verified Purchase
                                      </span>
                                    </h6>
                                    {review.service_name && (
                                      <span className="text-primary small fw-semibold">
                                        {review.service_name}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-muted small">
                                    {review.date ? new Date(review.date).toLocaleDateString('vi-VN') : ""}
                                  </span>
                                </div>

                                {/* Rating Stars */}
                                <div className="mb-3">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FontAwesomeIcon
                                      key={star}
                                      icon={faStar}
                                      className={
                                        star <= (review?.rating || 0)
                                          ? "text-warning"
                                          : "text-muted"
                                      }
                                      style={{ fontSize: "1rem", marginRight: '2px' }}
                                    />
                                  ))}
                                </div>

                                {/* Task Description & Content Wrapper */}
                                <div className="bg-light rounded p-3 mb-3">
                                  {/* Task Info Snippet */}
                                  {review.task_description && (
                                    <div className="mb-2 pb-2 border-bottom border-white">
                                      <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Chi tiết công việc:</small>
                                      <div className="text-secondary small fst-italic text-truncate" style={{ maxWidth: '100%' }}>
                                        "{review.task_description}"
                                      </div>
                                    </div>
                                  )}

                                  {/* User Review Text */}
                                  <p className="mb-0 text-dark" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    {review?.text || "Không có nhận xét."}
                                  </p>
                                </div>

                                {/* Booking Image (if available) */}
                                {review.booking_image && (
                                  <div className="mb-3">
                                    <div
                                      className="d-inline-block position-relative rounded overflow-hidden border"
                                      style={{ width: '200px', height: '150px', cursor: 'zoom-in' }}
                                      onClick={() => window.open(review.booking_image, '_blank')}
                                    >
                                      <img
                                        src={review.booking_image}
                                        alt="Kết quả công việc"
                                        className="w-100 h-100"
                                        style={{ objectFit: 'cover' }}
                                      />
                                      <div className="position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-50 text-white text-center py-1 small">
                                        Ảnh xác thực
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Staff Reply */}
                                {review.staff_reply && (
                                  <div className="mt-3 ps-3 border-start border-4 border-primary bg-primary-subtle p-3 rounded-end">
                                    <div className="fw-bold text-primary mb-1 small">Phản hồi từ Tasker:</div>
                                    <span className="text-dark small">{review.staff_reply}</span>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="d-flex align-items-center gap-3 mt-3">
                                  {/* Like Button */}
                                  {user?.user_id !== review.reviewer_id && (
                                    <button
                                      className={`btn btn-sm d-flex align-items-center gap-2 ${review.userLiked
                                        ? "btn-primary"
                                        : "btn-outline-secondary border-0 bg-light"
                                        }`}
                                      style={{
                                        borderRadius: "20px",
                                        padding: "6px 16px",
                                        transition: 'all 0.2s'
                                      }}
                                      onClick={async () => {
                                        // Logic like cũ
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
                                            showToast.error(err.message || "Lỗi cập nhật.");
                                            return;
                                          }

                                          const data = await res.json();
                                          const updatedReviews = reviewsData.reviews.map((r) =>
                                            r.id === review.id
                                              ? { ...r, helpful: data.helpful, userLiked: data.liked }
                                              : r
                                          );

                                          setReviewsData({ ...reviewsData, reviews: updatedReviews });
                                        } catch (error) {
                                          console.error("Like error:", error);
                                        }
                                      }}
                                    >
                                      <i className={`bi ${review.userLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}`}></i>
                                      <span>Hữu ích ({review.helpful || 0})</span>
                                    </button>
                                  )}
                                </div>

                                {/* Reply Form (Owner only) */}
                                {user?.user_id === review.reviewee_id && !review.staff_reply && (
                                  <div className="mt-3 p-3 bg-light rounded border">
                                    <label className="form-label fw-bold small text-muted">Trả lời đánh giá này:</label>
                                    <textarea
                                      className="form-control mb-2 form-control-sm"
                                      rows="2"
                                      placeholder="Nhập câu trả lời..."
                                      value={review.replyDraft || ""}
                                      onChange={(e) => {
                                        const updated = reviewsData.reviews.map((r) =>
                                          r.id === review.id ? { ...r, replyDraft: e.target.value } : r
                                        );
                                        setReviewsData({ ...reviewsData, reviews: updated });
                                      }}
                                    />
                                    <div className="text-end">
                                      <button
                                        className="btn btn-primary btn-sm rounded-pill px-3"
                                        onClick={async () => {
                                          // Logic reply cũ
                                          try {
                                            const res = await fetch(
                                              `${API_BASE_URL}/ratings/${review.id}/reply`,
                                              {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type": "application/json",
                                                  Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({ reply: review.replyDraft }),
                                              }
                                            );
                                            if (res.ok) {
                                              showToast.success("Đã gửi phản hồi!");
                                              const updated = reviewsData.reviews.map((r) =>
                                                r.id === review.id ? { ...r, staff_reply: review.replyDraft } : r
                                              );
                                              setReviewsData({ ...reviewsData, reviews: updated });
                                            } else {
                                              showToast.error("Gửi thất bại.");
                                            }
                                          } catch (e) {
                                            console.error(e);
                                          }
                                        }}
                                      >
                                        Gửi trả lời
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <FontAwesomeIcon icon={faComments} className="mb-3 display-4 opacity-25" />
                      <p>Chưa có đánh giá nào cho Tasker này.</p>
                    </div>
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
                              className={`me-1 cursor-pointer ${star <= newRating
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
                  <div className="fw-bold">Danh sách Video</div>
                </div>

                {loadingVideos ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <div className="mt-2 text-muted">Đang tải video...</div>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-5">
                    <FontAwesomeIcon icon={faEye} className="mb-3 display-4 opacity-25" />
                    <p className="text-muted">Tasker này chưa có video nào.</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {videos.map((v) => (
                      <div key={v.video_id} className="col-md-6 col-lg-4">
                        <div className="tp-card tp-media-card h-100 p-0 overflow-hidden border-0 shadow-sm">
                          <div
                            className="thumb w-100 bg-dark position-relative"
                            style={{ paddingTop: '56.25%', cursor: 'pointer' }}
                            onClick={() => navigate(`/video/${v.video_id}`)}
                          >
                            {/* 16:9 Aspect Ratio Container */}
                            <video
                              src={v.video_url}
                              // controls removed
                              preload="metadata"
                              className="position-absolute top-0 start-0 w-100 h-100"
                              style={{ objectFit: 'contain' }}
                              onMouseOver={(e) => e.target.play()}
                              onMouseOut={(e) => {
                                e.target.pause();
                                e.target.currentTime = 0;
                              }}
                              muted
                              loop
                            />
                          </div>
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="fw-semibold mb-0 text-truncate flex-grow-1 me-2" title={v.title}>
                                {v.title}
                              </h6>
                            </div>

                            {v.description && (
                              <p className="text-muted small text-truncate mb-2" style={{ maxWidth: '100%' }}>
                                {v.description}
                              </p>
                            )}

                            <div className="d-flex justify-content-between align-items-center mt-auto">
                              <div className="text-muted small" style={{ fontSize: '0.8rem' }}>
                                <FontAwesomeIcon icon={faCalendarCheck} className="me-1" />
                                {new Date(v.uploaded_at).toLocaleDateString('vi-VN')}
                              </div>
                              <div className="badge bg-light text-dark border">
                                <FontAwesomeIcon icon={faStar} className="text-warning me-1" />
                                {v.likes || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "articles" && (
              <div>
                <h5 className="mb-3">Bài viết & Chia sẻ kinh nghiệm</h5>

                {loadingArticles ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <div className="mt-2 text-muted">Đang tải bài viết...</div>
                  </div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-5">
                    <FontAwesomeIcon icon={faCopy} className="mb-3 display-4 opacity-25" />
                    <p className="text-muted">Tasker này chưa có bài viết nào.</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {articles.map((a) => {
                      // Parse photo_urls if it's a string (though it should be parsed by model, being safe)
                      let photos = [];
                      try {
                        photos = typeof a.photo_urls === 'string' ? JSON.parse(a.photo_urls) : (a.photo_urls || []);
                      } catch (e) { photos = []; }

                      const thumbnail = photos.length > 0 ? photos[0] : "/images/default-blog.jpg";

                      // Remove HTML tags for preview
                      const previewText = a.content ? a.content.replace(/<[^>]+>/g, '') : "";

                      return (
                        <div key={a.post_id} className="col-md-6 col-lg-4">
                          <div className="tp-card tp-media-card h-100 d-flex flex-column" style={{ overflow: 'hidden' }}>
                            <div
                              className="thumb w-100 position-relative"
                              style={{ height: 200, cursor: 'pointer' }}
                              onClick={() => navigate(`/blog/${a.post_id}`)}
                            >
                              <img
                                src={thumbnail}
                                alt={a.title}
                                className="w-100 h-100"
                                style={{ objectFit: 'cover' }}
                                onError={(e) => { e.target.src = "https://via.placeholder.com/400x200?text=No+Image" }}
                              />
                            </div>
                            <div className="card-body d-flex flex-column p-3">
                              <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted small">
                                  {new Date(a.post_date || a.created_at).toLocaleDateString('vi-VN')}
                                </span>
                                {a.likes > 0 && (
                                  <span className="text-primary small">
                                    <i className="bi bi-hand-thumbs-up-fill me-1"></i>{a.likes}
                                  </span>
                                )}
                              </div>
                              <h6
                                className="fw-semibold mb-2 text-truncate"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/blog/${a.post_id}`)}
                                title={a.title}
                              >
                                {a.title}
                              </h6>
                              <p className="text-muted small mb-3 flex-grow-1" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {previewText}
                              </p>

                              <button
                                className="btn btn-sm btn-outline-primary w-100 mt-auto"
                                onClick={() => navigate(`/blog/${a.post_id}`)}
                              >
                                Xem chi tiết
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "certification" &&
              isTasker() &&
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
                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>🏅</div>
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
        // mark as approved flow for backend processing
        payload.status = 'Approved';
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
        if (data.no_cert_required) {
          showToast.success('Đăng ký dịch vụ thành công!');
        } else {
          showToast.info('Đăng ký thành công. Vui lòng chờ duyệt chứng chỉ.');
        }
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
