import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faCircleCheck, faPhone } from '@fortawesome/free-solid-svg-icons';
import VideoService from '../services/VideoService';
import '../css/video.css';

const Video = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const { videos: videoList } = await VideoService.getAllVideos();
      const mappedVideos = videoList.map((video) => ({
        video_id: video.video_id,
        title: video.title,
        video_url: video.video_url,
        public_id: video.public_id,
        likes: video.likes || 0,
        uploaded_at: video.uploaded_at,
        expert: video.expert || `User ${video.user_id}`,
        rating: video.rating || 4.5,
        views: 'N/A', // Cần bảng riêng để lưu views
        timeAgo: calculateTimeAgo(video.uploaded_at),
        price: 'Liên hệ',
        expertAvatar: video.avatar_url || '/images/avatar-placeholder.jpg',
        verified: true,
      }));
      setVideos(mappedVideos);
    } catch (err) {
      setError('Lỗi khi tải danh sách video: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeAgo = (uploadedAt) => {
    const now = new Date();
    const uploaded = new Date(uploadedAt);
    const diffMs = now - uploaded;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero-wrap hero-wrap-2" style={{ backgroundImage: "url('/images/home.jpg')" }} data-stellar-background-ratio="0.5">
        <div className="overlay"></div>
        <div className="container">
          <div className="row no-gutters slider-text align-items-end">
            <div className="col-md-9 ftco-animate pb-5">
              <p className="breadcrumbs mb-2">
                <span className="mr-2">
                  <Link to="/">Home <FontAwesomeIcon icon={faChevronRight} /></Link>
                </span>
                <span>Video</span>
              </p>
              <h1 className="mb-0 bread">Video</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="ftco-section bg-light">
        <div className="container">
          <div className="row justify-content-center pb-5 mb-3">
            <div className="col-md-7 heading-section text-center ftco-animate">
              <h2 className="mb-4">Video Dịch Vụ Vệ Sinh Chuyên Nghiệp</h2>
            </div>
          </div>
          <div className="row align-items-center mb-4">
            <div className="col-md-6">
              <div className="input-group">
                <input type="text" className="form-control" placeholder="Tìm kiếm video..." />
              </div>
            </div>
            <div className="col-md-6 text-right">
              <button className="btn btn-outline-primary mr-2 btn-no-transform">Mới nhất</button>
              <button className="btn btn-outline-primary mr-2 btn-no-transform">Phổ biến nhất</button>
              <button className="btn btn-outline-primary btn-no-transform">Cũ nhất</button>
            </div>
          </div>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          ) : videos.length === 0 ? (
            <p>Chưa có video nào.</p>
          ) : (
            <div className="row">
              {videos.map((video) => (
                <div key={video.video_id} className="col-md-3 col-sm-6 mb-4 ftco-animate">
                  <div className="video-card">
                    <Link to={`/video/${video.video_id}`}>
                      <div className="thumbnail-wrap">
                        <video className="img-fluid">
                          <source src={video.video_url} type="video/mp4" />
                          Trình duyệt của bạn không hỗ trợ video.
                        </video>
                      </div>
                    </Link>
                    <Link to={`/video/${video.video_id}`}>
                      <h4 className="video-title">{video.title}</h4>
                    </Link>
                    <div className="expert-row">
                      <img src={video.expertAvatar} className="expert-avatar" alt={video.expert} />
                      <span className="expert-name">{video.expert}</span>
                      {video.verified && (
                        <FontAwesomeIcon icon={faCircleCheck} className="expert-verified" />
                      )}
                    </div>
                    <div className="stats-row">
                      <div>Ngày đăng: {new Date(video.uploaded_at).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <div className="rating-price-row">
                      <div className="rating">⭐ {video.rating}</div>
                      <div className="price">{video.price}</div>
                    </div>
                    <div className="action-row">
                      <span className="likes">❤️ {video.likes} lượt thích</span>
                      <a href="#" className="btn btn-outline-primary-1 btn-sm btn-no-transform">
                        <FontAwesomeIcon icon={faPhone} className="mr-2" />
                        Đặt ngay
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="row">
            <div className="col-md-12 text-center">
              <button className="btn btn-outline-primary btn-no-transform">Tải thêm video</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Video;