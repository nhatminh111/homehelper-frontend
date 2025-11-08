import React, { useState, useEffect } from 'react';
import VideoService from '../services/VideoService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/VideoApproval.css';

const VideoApproval = () => {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [videosPerPage] = useState(8);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, videoId: null, action: null });

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const response = await VideoService.getPendingVideos({
          page: currentPage,
          limit: videosPerPage,
        });
        setVideos(response.videos || []);
      } catch (err) {
        setError(err.message);
        toast.error(err.message, {
          position: 'top-right',
          autoClose: 3000,
          className: 'minimal-toast',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [currentPage, videosPerPage]);

  // Đếm số lượng video theo trạng thái
  const videoCounts = {
    All: videos.length,
    Pending: videos.filter((v) => v.status === 'Pending').length,
    Approved: videos.filter((v) => v.status === 'Approved').length,
    Rejected: videos.filter((v) => v.status === 'Rejected').length,
  };

  // Xử lý tìm kiếm và lọc trạng thái
  const filteredVideos = videos.filter(
    (video) =>
      (statusFilter === 'All' || video.status === statusFilter) &&
      (video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.expert.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Xử lý sắp xếp
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    const dateA = new Date(a.uploaded_at);
    const dateB = new Date(b.uploaded_at);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Xử lý phân trang
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = sortedVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(sortedVideos.length / videosPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleOpenModal = (videoId, action) => {
    setModal({ show: true, videoId, action });
  };

  const handleCloseModal = () => {
    setModal({ show: false, videoId: null, action: null });
  };

  const handleConfirmAction = async () => {
    const { videoId, action } = modal;
    try {
      if (action === 'Delete') {
      await VideoService.deleteVideoByStaff(videoId); 
      setVideos(videos.filter((video) => video.video_id !== videoId));
        toast.success('Xóa nội dung thành công!', {
          position: 'top-right',
          autoClose: 3000,
          className: 'minimal-toast',
        });
      } else {
        await VideoService.updateVideoStatus(videoId, action);
        setVideos(videos.filter((video) => video.video_id !== videoId));
        toast.success(`Nội dung đã được ${action === 'Approved' ? 'chấp thuận' : 'loại bỏ'} thành công!`, {
          position: 'top-right',
          autoClose: 3000,
          className: 'minimal-toast',
        });
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, {
        position: 'top-right',
        autoClose: 3000,
        className: 'minimal-toast',
      });
    } finally {
      handleCloseModal();
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (e) => {
    setSortOrder(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="video-approval-container">
      <ToastContainer />
      <h2 className="video-approval-title">Quản Lý Nội Dung Sáng Tạo</h2>
      <p className="video-approval-description">
        Xem, phê duyệt hoặc xóa các video sáng tạo từ cộng đồng với giao diện tối ưu để quản lý hiệu quả.
      </p>

      {error && <p className="error-message">{error}</p>}

      {/* Thống kê số lượng video */}
      <div className="video-stats">
        <span className="stat-all">Tất cả: {videoCounts.All}</span>
        <span className="stat-pending">Đang chờ: {videoCounts.Pending}</span>
        <span className="stat-approved">Đã duyệt: {videoCounts.Approved}</span>
        <span className="stat-rejected">Bị từ chối: {videoCounts.Rejected}</span>
      </div>

      {/* Thanh tìm kiếm, lọc và sắp xếp */}
      <div className="controls-container">
        <div className="control-group">
          <label htmlFor="search-input" className="control-label">Tìm kiếm</label>
          <div className="input-wrapper">
            <span className="input-icon">🔍</span>
            <input
              id="search-input"
              type="text"
              placeholder="Tiêu đề hoặc tác giả..."
              value={searchQuery}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>
        <div className="control-group">
          <label htmlFor="status-filter" className="control-label">Trạng thái</label>
          <div className="input-wrapper">
            <span className="input-icon">📌</span>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={handleStatusFilter}
              className="status-filter"
            >
              <option value="All">Tất cả</option>
              <option value="Pending">Đang chờ</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Rejected">Bị từ chối</option>
            </select>
          </div>
        </div>
        <div className="control-group">
          <label htmlFor="sort-select" className="control-label">Sắp xếp</label>
          <div className="input-wrapper">
            <span className="input-icon">↕️</span>
            <select
              id="sort-select"
              value={sortOrder}
              onChange={handleSort}
              className="sort-select"
            >
              <option value="desc">Mới nhất trước</option>
              <option value="asc">Cũ nhất trước</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải nội dung...</p>
        </div>
      )}

      {/* Danh sách video dạng lưới */}
      <div className="video-grid">
        {currentVideos.length === 0 && !loading && (
          <p className="no-videos">Không có nội dung nào để hiển thị.</p>
        )}
        {currentVideos.map((video, index) => (
          <div
            key={video.video_id}
            className="video-card"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="video-card-header">
              <h3 className="video-title">{video.title}</h3>
              <span className={`video-status status-${video.status.toLowerCase()}`}>
                {video.status}
              </span>
            </div>
            <p className="video-meta">
              Tác giả: {video.expert} | {new Date(video.uploaded_at).toLocaleDateString()}
            </p>
            <div className="video-wrapper">
              <video
                src={video.video_url}
                controls
                className="video-player"
              />
            </div>
            <div className="video-actions">
              {video.status === 'Pending' && (
                <>
                  <button
                    onClick={() => handleOpenModal(video.video_id, 'Approved')}
                    className="approve-button"
                    title="Chấp thuận"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => handleOpenModal(video.video_id, 'Rejected')}
                    className="reject-button"
                    title="Loại bỏ"
                  >
                    ✗
                  </button>
                </>
              )}
              <button
                onClick={() => handleOpenModal(video.video_id, 'Delete')}
                className="delete-button"
                title="Xóa"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button"
            title="Trang trước"
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => paginate(page)}
              className={`pagination-button ${currentPage === page ? 'active' : ''}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button"
            title="Trang sau"
          >
            →
          </button>
        </div>
      )}

      {/* Modal xác nhận */}
      {modal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              Xác nhận {modal.action === 'Approved' ? 'Chấp thuận' : modal.action === 'Rejected' ? 'Loại bỏ' : 'Xóa'} Nội dung
            </h3>
            <p className="modal-message">
              Bạn có chắc chắn muốn {modal.action === 'Approved' ? 'chấp thuận' : modal.action === 'Rejected' ? 'loại bỏ' : 'xóa'} nội dung này?
            </p>
            <div className="modal-actions">
              <button onClick={handleConfirmAction} className="modal-confirm-button">
                Xác nhận
              </button>
              <button onClick={handleCloseModal} className="modal-cancel-button">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoApproval;