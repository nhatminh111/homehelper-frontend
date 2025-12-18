import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import {
  faStar,
  faCheckCircle,
  faMapMarkerAlt,
  faEye,
  faComments,
  faHeart as faHeartSolid,
  faSearch,
  faUsers,
  faBriefcase,
  faClock, faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { showToast, CustomToastContainer } from "../components/common/CustomToast";
import TaskerService from "../services/taskerService";
import blogService from "../services/blogService";
import VideoService from "../services/VideoService";
import '../css/Home.css';


const Home = () => {
  const [services, setServices] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [taskers, setTaskers] = useState([]);

  // Debug: Log taskers state changes
  useEffect(() => {
    console.log('🔄 Taskers state updated:', taskers);
    console.log('🔄 Taskers length:', taskers.length);
  }, [taskers]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const { user, token } = useAuth();
  const [wishlistTaskers, setWishlistTaskers] = useState([]);
  const navigate = useNavigate();

  const createHeaders = (token) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  // Load wishlist for current user
  useEffect(() => {
    if (user && token) {
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/wishlists/${user.user_id}`, {
        headers: createHeaders(token),
      })
        .then((res) => res.json())
        .then((data) => {
          setWishlistTaskers(data.taskers?.map((t) => t.tasker_id) || []);
        })
        .catch(() => setWishlistTaskers([]));
    } else {
      setWishlistTaskers([]);
    }
  }, [user, token]);

  const handleAddWishlist = async (taskerId) => {
    if (!user) {
      showToast.error("Vui lòng đăng nhập để thêm vào wishlist!");
      return;
    }
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/wishlists/`, {
        method: "POST",
        headers: createHeaders(token),
        body: JSON.stringify({
          customer_id: user.user_id,
          favorite_taskers: [taskerId],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setWishlistTaskers((prev) => [...prev, Number(taskerId)]);
        showToast.success("Đã thêm vào wishlist!");
      } else {
        showToast.error(data.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      showToast.error("Có lỗi xảy ra khi thêm vào wishlist!");
      console.error(err);
    }
  };

  const removeTasker = async (taskerId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/wishlists/remove`, {
        method: "POST",
        headers: createHeaders(token),
        body: JSON.stringify({ customer_id: user.user_id, taskerId }),
      });
      if (res.ok) {
        setWishlistTaskers((prev) =>
          prev.filter((id) => id !== Number(taskerId))
        );
        showToast.error("Đã xóa khỏi wishlist!");
      } else {
        showToast.error("Có lỗi xảy ra khi xóa khỏi wishlist!");
      }
    } catch (err) {
      showToast.error("Có lỗi xảy ra khi xóa khỏi wishlist!");
      console.error(err);
    }
  };

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/services/servicebasic`)
      .then((res) => res.json())
      .then((resData) => {
        setServices(resData.data || []);
      })
      .catch((err) => console.error("Error loading services:", err));
  }, []);

  const handleSearch = async () => {
    if (!searchName && !selectedService && !selectedCity) {
      showToast.warning("Vui lòng nhập tên, chọn dịch vụ hoặc chọn thành phố để tìm kiếm!");
      return;
    }

    setLoading(true);
    setError(null);
    setShowResults(true);

    try {
      const searchUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/tasker?search=${encodeURIComponent(searchName)}&serviceId=${selectedService}&city=${encodeURIComponent(selectedCity)}`;
      console.log('🔍 Search URL:', searchUrl);
      console.log('🔍 Search params:', { searchName, selectedService, selectedCity });

      const res = await fetch(searchUrl);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ API Error:', res.status, errorText);
        throw new Error(`Phản hồi mạng không ổn: ${res.status}`);
      }
      const result = await res.json();
      console.log('📦 API Response:', result);
      console.log('📦 Response type:', typeof result);
      console.log('📦 Is array?', Array.isArray(result));

      // Handle multiple response structures
      let taskersData = [];
      if (Array.isArray(result)) {
        // Response is directly an array
        taskersData = result;
      } else if (result && Array.isArray(result.data)) {
        // Response has data property with array
        taskersData = result.data;
      } else if (result && Array.isArray(result.users)) {
        // Response has users property with array
        taskersData = result.users;
      } else if (result && result.success && Array.isArray(result.data)) {
        // Response has success and data properties
        taskersData = result.data;
      } else {
        console.warn('⚠️ Unexpected response structure:', result);
        taskersData = [];
      }

      console.log('📋 Taskers Data:', taskersData);
      console.log('📊 Taskers Count:', taskersData.length);
      if (taskersData.length > 0) {
        console.log('📋 First tasker:', taskersData[0]);
      }

      if (!user || !token) {
        const mappedTaskers = taskersData.map(t => ({
          ...t,
          tasker_id: t.tasker_id || t.user_id,
          distance_km: null
        }));
        console.log('✅ Setting taskers (no user):', mappedTaskers);
        setTaskers(mappedTaskers);
        setLoading(false);
        return;
      }

      let distanceResult = [];
      try {
        distanceResult = await TaskerService.getTaskersWithDistance();
      } catch (distanceError) {
        console.warn('Không thể lấy dữ liệu khoảng cách:', distanceError);
        const mappedTaskers = taskersData.map(t => ({
          ...t,
          tasker_id: t.tasker_id || t.user_id,
          distance_km: null
        }));
        console.log('✅ Setting taskers (no distance):', mappedTaskers);
        setTaskers(mappedTaskers);
        setLoading(false);
        return;
      }

      const distanceMap = new Map(distanceResult.map(t => [t.user_id, t.distance_km]));
      const taskersWithDistance = taskersData.map(tasker => ({
        ...tasker,
        tasker_id: tasker.tasker_id || tasker.user_id,
        distance_km: distanceMap.get(tasker.tasker_id || tasker.user_id) || null
      }));

      console.log('✅ Setting taskers with distance:', taskersWithDistance);
      setTaskers(taskersWithDistance);
    } catch (err) {
      console.error("Lỗi khi tải danh sách Tasker:", err);
      setError("Không thể tải danh sách Tasker. Vui lòng thử lại.");
      setTaskers([]);
    } finally {
      setLoading(false);
    }
  };

  // Latest Blog Posts
  const [newsPosts, setNewsPosts] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  // Top-liked Videos for Cleaners Section replacement
  const [popularVideos, setPopularVideos] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setNewsLoading(true);
        const res = await blogService.getRecentPosts(3);
        const posts = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setNewsPosts(posts);
      } catch (e) {
        console.error("Error loading recent blogs:", e);
        setNewsError("Không thể tải tin mới nhất");
        setNewsPosts([]);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Fetch top-liked videos (3-4 items)
  useEffect(() => {
    const fetchPopular = async () => {
      setPopularLoading(true);
      setPopularError(null);
      try {
        // Try backend popular endpoint first
        let data = await VideoService.getPopularVideos(4);
        let vids = Array.isArray(data?.videos)
          ? data.videos
          : Array.isArray(data)
            ? data
            : [];

        // Fallback: compute from all videos if popular endpoint not available
        if (!vids.length) {
          const allRes = await VideoService.getAllVideos();
          const all = Array.isArray(allRes?.videos) ? allRes.videos : Array.isArray(allRes) ? allRes : [];
          vids = all
            .filter(v => v && (v.status ? String(v.status).toLowerCase() === 'approved' : true))
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            .slice(0, 4);
        }

        setPopularVideos(vids);
      } catch (e) {
        console.error('Error loading popular videos:', e);
        // As a last resort, attempt all videos and sort
        try {
          const allRes = await VideoService.getAllVideos();
          const all = Array.isArray(allRes?.videos) ? allRes.videos : Array.isArray(allRes) ? allRes : [];
          const top = all
            .filter(v => v && (v.status ? String(v.status).toLowerCase() === 'approved' : true))
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            .slice(0, 4);
          setPopularVideos(top);
        } catch (e2) {
          setPopularError('Không thể tải video phổ biến');
          setPopularVideos([]);
        }
      } finally {
        setPopularLoading(false);
      }
    };
    fetchPopular();
  }, []);

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return "";
    }
  };

  // Derive Cloudinary video thumbnail from video_url
  const getVideoThumbUrl = (v) => {
    const url = v?.video_url || '';
    if (!url) return '/images/work-1.jpg';
    try {
      // Insert transformation for first-second frame and jpeg format
      // Example: /video/upload/ -> /video/upload/so_1,q_auto,f_jpg/
      const withTransform = url.replace(/\/upload\//, '/upload/so_1,q_auto,f_jpg/');
      // Ensure jpg extension when URL ends with video extension
      const jpgUrl = withTransform.replace(/\.(mp4|mov|avi|mkv)(\?.*)?$/i, '.jpg$2');
      return jpgUrl;
    } catch {
      return '/images/work-1.jpg';
    }
  };


  // Function to sort and display all service variants
  const getDisplayedVariants = (taskerServices) => {
    if (!taskerServices || taskerServices.length === 0) return [];

    // Flatten variants and associate with service_id
    let allVariants = taskerServices.flatMap(service =>
      (service.variants || []).map(variant => ({
        ...variant,
        service_id: service.service_id
      }))
    );

    // Sort variants: prioritize those matching selectedService
    if (selectedService) {
      allVariants.sort((a, b) => {
        if (a.service_id === parseInt(selectedService)) return -1;
        if (b.service_id === parseInt(selectedService)) return 1;
        return 0;
      });
    }

    // Return all variants (no slicing)
    return allVariants;
  };

  // Animation variants for the card
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <>
      <CustomToastContainer />

      {/* Hero Section */}
      <section style={{ padding: '40px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 50%', padding: '20px' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                HomeHelper – Giúp việc dễ dàng, cuộc sống thảnh thơi.
              </h1>
              <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                Kết nối nhanh – Dịch vụ chuẩn – Ngôi nhà an tâm.
                <br />
                Dọn dẹp, chăm sóc, sửa chữa – Tất cả trong một chạm.
              </p>
              <a href="#search" style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '1.125rem' }}>
                Khám phá ngay
              </a>
            </div>
            <div style={{ flex: '1 1 50%', padding: '20px' }}>
              <img
                src="https://nld.mediacdn.vn/2016/img20160416011157172.jpg"
                alt="cleaners"
                style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section id="search" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)', padding: '40px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>
              <FontAwesomeIcon icon={faSearch} style={{ marginRight: '12px', color: '#3b82f6' }} />
              Tìm người giúp việc chuyên nghiệp
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#64748b', margin: '0' }}>
              Hơn 10,000+ người giúp việc đã được xác minh
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{ background: '#f8d7da', color: '#721c24', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faClock} style={{ marginRight: '8px' }} />
              {error}
              <button
                type="button"
                style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
                onClick={() => setError(null)}
              >
                ×
              </button>
            </div>
          )}

          {/* Search Form */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <div style={{ maxWidth: '960px', width: '100%' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(40px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  padding: '24px',
                  borderRadius: '16px 16px 0 0'
                }}>
                  <h3 style={{ margin: '0', fontWeight: 'bold' }}>
                    <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px' }} />
                    Tìm kiếm người giúp việc
                  </h3>
                  <small style={{ opacity: '0.75' }}>Nhập tên, chọn dịch vụ, chọn thành phố hoặc tìm kiếm nâng cao</small>
                </div>

                {/* Search Form */}
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                    {/* Tìm theo tên */}
                    <div style={{ flex: '1 1 100%' }}>
                      <div style={{ position: 'relative' }}>
                        <FontAwesomeIcon
                          icon={faSearch}
                          style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '1.25rem', zIndex: '10' }}
                        />
                        <input
                          style={{
                            width: '100%',
                            padding: '12px 12px 12px 48px',
                            fontSize: '1.125rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(20px)',
                            transition: 'all 0.3s ease'
                          }}
                          placeholder="Tìm theo tên người giúp việc..."
                          value={searchName}
                          onChange={(e) => setSearchName(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Chọn dịch vụ */}
                    <div style={{ flex: '1 1 calc(33.33% - 11px)' }}>
                      <select
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '1.125rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(20px)',
                          transition: 'all 0.3s ease'
                        }}
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                      >
                        <option value="">Chọn dịch vụ</option>
                        {services.map((s) => (
                          <option key={s.service_id} value={s.service_id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Chọn thành phố */}
                    <div style={{ flex: '1 1 calc(33.33% - 11px)' }}>
                      <select
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '1.125rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(20px)',
                          transition: 'all 0.3s ease'
                        }}
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                      >
                        <option value="">Chọn thành phố</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Hồ Chí Minh">TP Hồ Chí Minh</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Hải Phòng">Hải Phòng</option>
                        <option value="Cần Thơ">Cần Thơ</option>
                        <option value="Huế">Huế</option>
                        <option value="Nha Trang">Nha Trang</option>
                        <option value="Vũng Tàu">Vũng Tàu</option>
                        <option value="Đà Lạt">Đà Lạt</option>
                        <option value="Quy Nhơn">Quy Nhơn</option>
                      </select>
                    </div>

                    {/* Nút Tìm kiếm (chính) */}
                    <div style={{ flex: '1 1 calc(33.33% - 11px)' }}>
                      <button
                        style={{
                          width: '100%',
                          padding: '12px 24px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          height: '56px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                          transition: 'all 0.3s ease',
                          cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                        onClick={handleSearch}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span style={{
                              display: 'inline-block',
                              width: '18px',
                              height: '18px',
                              border: '2px solid #ffffff',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                              marginRight: '8px'
                            }}></span>
                            Đang tìm...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faSearch} style={{ marginRight: '8px' }} />
                            Tìm ngay
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* NÚT TÌM KIẾM NÂNG CAO */}
                  <div style={{
                    marginTop: '20px',
                    textAlign: 'center',
                    padding: '16px 0',
                    borderTop: '1px dashed rgba(0,0,0,0.1)'
                  }}>
                    <button
                      onClick={() => navigate('/tasker-search')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 28px',
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        boxShadow: '0 6px 20px rgba(249, 115, 22, 0.3)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 10px 25px rgba(249, 115, 22, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.3)';
                      }}
                    >
                      <FontAwesomeIcon icon={faFilter} style={{ fontSize: '1.1rem' }} />
                      Tìm kiếm nâng cao
                      <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '0.9rem', marginLeft: '4px' }} />
                    </button>
                    <div style={{
                      marginTop: '8px',
                      fontSize: '0.8rem',
                      color: '#6b7280'
                    }}>
                      Lọc theo khoảng cách, dịch vụ, đánh giá
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Results Header */}
          {showResults && (
            <div style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 66.66%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '24px', fontWeight: '600', display: 'flex', alignItems: 'center', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)' }}>
                      <FontAwesomeIcon icon={faUsers} style={{ marginRight: '4px' }} />
                      {taskers.length}
                    </div>
                    <div>
                      <h2 style={{ marginBottom: '4px', fontWeight: 'bold', color: '#1e293b' }}>
                        Kết quả phù hợp
                      </h2>
                      <small style={{ color: '#6b7280' }}>
                        {searchName && `"${searchName}"`} {selectedService && `• ${services.find(s => s.service_id === selectedService)?.name}`} {selectedCity && `• ${selectedCity}`}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tasker Cards Grid */}
          {showResults && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
                {loading ? (
                  <div style={{ width: '100%', maxWidth: '320px' }}>
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                      <div style={{ width: '100%', height: '380px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', margin: '0 auto', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div style={{ height: '140px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0f0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'loading 1.5s infinite', borderRadius: '12px 12px 0 0' }}></div>
                        <div style={{ padding: '24px' }}>
                          <div style={{ height: '20px', width: '80%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0f0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'loading 1.5s infinite', borderRadius: '6px', marginBottom: '12px' }}></div>
                          <div style={{ height: '16px', width: '60%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0f0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'loading 1.5s infinite', borderRadius: '6px', marginBottom: '12px' }}></div>
                          <div style={{ height: '12px', width: '40%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0f0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'loading 1.5s infinite', borderRadius: '6px', marginBottom: '16px' }}></div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: '1', height: '44px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0f0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'loading 1.5s infinite', borderRadius: '6px' }}></div>
                            <div style={{ width: '70px', height: '44px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0f0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'loading 1.5s infinite', borderRadius: '6px' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : taskers.length > 0 ? (
                  taskers.map((t) => {
                    const displayedVariants = getDisplayedVariants(t.services);

                    return (
                      <motion.div
                        key={t.tasker_id}
                        style={{ flex: '1 1 25%', maxWidth: '25%', minWidth: '280px' }}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <div className="tasker-card">
                          {/* Left: Avatar Section */}
                          <motion.div className="avatar-section" variants={childVariants}>
                            <div className="avatar-wrapper">
                              <img
                                src={t.avatar || "https://nld.mediacdn.vn/2016/img20160416011157172.jpg"}
                                alt={t.name}
                                className="avatar-image"
                              />
                              {t.verified && (
                                <div className="verified-badge">
                                  <FontAwesomeIcon icon={faCheckCircle} />
                                </div>
                              )}
                              {t.isOnline && (
                                <div className="status-badge">
                                  <div className="status-dot"></div>
                                  Online
                                </div>
                              )}
                            </div>
                          </motion.div>

                          {/* Right: Info and Actions Section */}
                          <motion.div className="info-section" variants={childVariants}>
                            <button
                              className="favorite-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                wishlistTaskers.includes(Number(t.tasker_id))
                                  ? removeTasker(t.tasker_id)
                                  : handleAddWishlist(t.tasker_id);
                              }}
                              title={
                                wishlistTaskers.includes(Number(t.tasker_id))
                                  ? "Xóa khỏi yêu thích"
                                  : "Thêm vào yêu thích"
                              }
                            >
                              <FontAwesomeIcon
                                icon={
                                  wishlistTaskers.includes(Number(t.tasker_id))
                                    ? faHeartSolid
                                    : faHeartRegular
                                }
                                className={`favorite-icon ${wishlistTaskers.includes(Number(t.tasker_id))
                                  ? 'text-danger'
                                  : 'text-gray'
                                  }`}
                              />
                            </button>

                            <h4 className="tasker-name">{t.name}</h4>
                            <div className="rating-container">
                              <div className="stars-container">
                                {[...Array(5)].map((_, i) => (
                                  <FontAwesomeIcon
                                    key={i}
                                    icon={faStar}
                                    className={`star ${i < Math.round(t.rating || 0) ? 'filled' : ''}`}
                                  />
                                ))}
                              </div>
                              <span className="rating-score">
                                {t.rating?.toFixed(1)} ({t.reviewsCount || 0})
                              </span>
                            </div>

                            {t.distance_km !== null && (
                              <div className="distance-chip">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="icon" />
                                {t.distance_km.toFixed(1)}km
                              </div>
                            )}

                            <div className="stats-row">
                              {t.completedJobs !== undefined && (
                                <div className="stat-item">
                                  <div className="stat-number">{t.completedJobs}</div>
                                  <small>Công việc</small>
                                </div>
                              )}
                              {t.experience && (
                                <div className="stat-item">
                                  <div className="stat-number">{t.experience}</div>
                                  <small>Năm</small>
                                </div>
                              )}
                            </div>

                            {t.services?.length > 0 && (
                              <div className="services-preview">
                                <div className="services-header">
                                  <FontAwesomeIcon icon={faBriefcase} className="icon" />
                                  Dịch vụ
                                </div>
                                <div className="services-list">
                                  {displayedVariants.map((variant, idx) => (
                                    <div key={idx} className="service-chip">
                                      <div className="service-name">{variant.variant_name}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="action-buttons">
                              <Link
                                to={`/tasker-profile/${t.tasker_id}`}
                                className="btn-profile"
                              >
                                <FontAwesomeIcon icon={faEye} className="icon" />
                                Xem hồ sơ
                              </Link>
                              <div className="quick-actions">
                                <motion.button
                                  className="btn-chat"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <FontAwesomeIcon icon={faComments} />
                                </motion.button>
                                <motion.button
                                  className="btn-book"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    if (!user || !token) {
                                      showToast.error("Vui lòng đăng nhập để đặt dịch vụ!");
                                      return;
                                    }
                                    if (user.role !== "Customer") {
                                      showToast.error("Chỉ khách hàng mới có thể đặt lịch!");
                                      return;
                                    }
                                    window.location.href = `/booking/${t.tasker_id}`;
                                  }}
                                >
                                  Đặt ngay
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div style={{ width: '100%' }}>
                    <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', borderRadius: '24px', border: '2px dashed #cbd5e1', padding: '4rem 2rem', textAlign: 'center' }}>
                      <div style={{ width: '120px', height: '120px', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(226, 232, 240, 0.5)', borderRadius: '50%' }}>
                        <FontAwesomeIcon icon={faUsers} style={{ fontSize: '3rem', color: '#6b7280' }} />
                      </div>
                      <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#1e293b' }}>Không tìm thấy kết quả</h3>
                      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '1.25rem' }}>Thử thay đổi từ khóa hoặc chọn dịch vụ khác</p>
                      <button
                        style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', fontSize: '1.125rem', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
                        onClick={() => {
                          setSearchName("");
                          setSelectedService("");
                          setSelectedCity("");
                          setShowResults(false);
                        }}
                      >
                        Tìm kiếm mới
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section >

      {/* About Section */}
      < section style={{ padding: '40px 0' }
      }>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 50%', padding: '20px' }}>
              <img src="/images/about.jpg" alt="about" style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
            </div>
            <div style={{ flex: '1 1 50%', padding: '20px' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Hãy để bạn tươi mới hơn bao giờ hết</h2>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Đội ngũ vệ sinh chuyên nghiệp sử dụng sản phẩm thân thiện môi trường
                và kỹ thuật hiện đại để đảm bảo không gian của bạn luôn sạch bóng.
              </p>
              {/* <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: '#3b82f6', margin: '0' }}>45</h3>
                  <small style={{ color: '#6b7280' }}>Năm kinh nghiệm</small>
                </div>
                <div>
                  <h3 style={{ color: '#3b82f6', margin: '0' }}>2,342</h3>
                  <small style={{ color: '#6b7280' }}>Khách hàng hài lòng</small>
                </div>
                <div>
                  <h3 style={{ color: '#3b82f6', margin: '0' }}>30+</h3>
                  <small style={{ color: '#6b7280' }}>Khu vực dịch vụ</small>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </section >

      {/* News Section */}
      < section style={{ padding: '40px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '8px' }}>Tin mới nhất</h2>
          {newsError && (
            <p style={{ textAlign: 'center', color: '#ef4444', marginBottom: '16px' }}>{newsError}</p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
            {newsLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} style={{ flex: '1 1 33.33%', padding: '12px' }}>
                  <div style={{ height: '100%', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                    <div style={{ width: '100%', height: '180px', background: '#e5e7eb' }} />
                    <div style={{ padding: '16px' }}>
                      <div style={{ width: '80px', height: '24px', background: '#e5e7eb', borderRadius: '12px', marginBottom: '8px' }} />
                      <div style={{ width: '100%', height: '20px', background: '#e5e7eb', borderRadius: '6px', marginBottom: '8px' }} />
                      <div style={{ width: '60%', height: '16px', background: '#e5e7eb', borderRadius: '6px', marginBottom: '12px' }} />
                      <div style={{ width: '120px', height: '36px', background: '#e5e7eb', borderRadius: '8px' }} />
                    </div>
                  </div>
                </div>
              ))
            ) : newsPosts.length > 0 ? (
              newsPosts.map((p) => {
                const imgSrc = Array.isArray(p.photo_urls) && p.photo_urls.length > 0 ? p.photo_urls[0] : '/images/work-1.jpg';
                return (
                  <div key={p.post_id} style={{ flex: '1 1 33.33%', padding: '12px' }}>
                    <div style={{ height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={imgSrc} className="news-card-image" alt={p.title} />
                      <div style={{ padding: '16px' }}>
                        <span
                          style={{
                            background: '#eef2ff',
                            color: '#1b2a4b',
                            borderRadius: '20px',
                            padding: '6px 12px',
                            fontSize: '0.875rem',
                            marginBottom: '8px',
                            display: 'inline-block'
                          }}
                        >
                          Bài viết
                        </span>
                        <h5 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>{p.title}</h5>
                        <p style={{ color: '#6b7280', marginBottom: '16px' }}>{formatDate(p.post_date)}</p>
                        <Link to={`/blog/${p.post_id}`} style={{ padding: '8px 16px', border: '2px solid #3b82f6', color: '#3b82f6', background: 'none', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }}>
                          Đọc thêm
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ textAlign: 'center', width: '100%', color: '#6b7280' }}>Chưa có bài viết nào</p>
            )}
          </div>
        </div>
      </section >

      {/* CTA Section */}
      < section style={{ background: '#2b5cff', padding: '40px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: 'white' }}>
          <h2 style={{ marginBottom: '12px', fontSize: '2.5rem' }}>Cùng nhau khám phá những điều mới</h2>
          <p style={{ marginBottom: '24px', fontSize: '1.25rem' }}>
            Sẵn sàng trải nghiệm dịch vụ vệ sinh tốt nhất? Bắt đầu ngay hôm nay!
          </p>
          <button style={{ padding: '12px 24px', background: '#ffd84d', color: '#1b1c24', borderRadius: '8px', border: 'none', fontSize: '1.125rem' }}>Bắt đầu ngay</button>
        </div>
      </section >

      {/* Popular Videos Section (replacing Cleaners) */}
      < section style={{ background: '#f6f8ff', padding: '40px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '8px' }}>Video được yêu thích</h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '40px' }}>
            Top video có lượt thích cao nhất
          </p>
          {popularError && (
            <p style={{ textAlign: 'center', color: '#ef4444', marginBottom: '16px' }}>{popularError}</p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
            {popularLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} style={{ flex: '1 1 25%', minWidth: '260px', padding: '12px' }}>
                  <div style={{ height: '100%', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                    <div style={{ width: '100%', height: '260px', background: '#e5e7eb' }} />
                    <div style={{ padding: '16px' }}>
                      <div style={{ width: '60%', height: '20px', background: '#e5e7eb', borderRadius: '6px', marginBottom: '8px' }} />
                      <div style={{ width: '40%', height: '16px', background: '#e5e7eb', borderRadius: '6px', marginBottom: '12px' }} />
                      <div style={{ width: '120px', height: '36px', background: '#e5e7eb', borderRadius: '8px' }} />
                    </div>
                  </div>
                </div>
              ))
            ) : popularVideos.length > 0 ? (
              popularVideos.slice(0, 4).map((v) => (
                <div key={v.video_id} style={{ flex: '1 1 25%', minWidth: '260px', padding: '12px' }}>
                  <div style={{ height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={getVideoThumbUrl(v)}
                        alt={v.title}
                        style={{ width: '100%', height: '360px', objectFit: 'cover', display: 'block', background: '#000' }}
                        onError={(e) => { e.currentTarget.src = '/images/work-1.jpg'; }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: '#ffd84d',
                          color: '#1b1c24',
                          padding: '6px 10px',
                          borderRadius: '20px',
                          fontWeight: '600'
                        }}
                      >
                        Popular
                      </span>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h5 style={{ marginBottom: '8px', fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</h5>
                      <div style={{ color: '#6b7280', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faHeartSolid} style={{ color: '#ef4444' }} />
                        <span>{v.likes || 0} lượt thích</span>
                      </div>
                      <Link to={`/video/${v.video_id}`} style={{ padding: '8px 16px', border: '2px solid #3b82f6', color: '#3b82f6', background: 'none', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }}>
                        Xem video
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', width: '100%', color: '#6b7280' }}>Chưa có video nào</p>
            )}
          </div>
        </div>
      </section >


    </>
  );
};

export default Home;