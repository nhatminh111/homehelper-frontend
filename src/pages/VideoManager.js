<<<<<<< Updated upstream
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import VideoService from '../services/VideoService';

// CSS tùy chỉnh để cố định kích thước video và card
const videoCardStyles = `
  .video-card {
    height: 400px; /* Chiều cao cố định cho card */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    overflow: hidden;
  }

  .video-card video {
    width: 100%;
    height: 200px; /* Chiều cao cố định cho video */
    object-fit: cover; /* Đảm bảo video lấp đầy khung mà không bị méo */
    background: #000; /* Màu nền đen cho video */
  }

  .video-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 15px;
  }

  .video-card-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis; /* Cắt ngắn tiêu đề nếu quá dài */
  }

  .video-card-text {
    font-size: 0.9rem;
    color: #6c757d;
    margin-bottom: 10px;
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* Giới hạn mô tả tối đa 2 dòng */
    -webkit-box-orient: vertical;
  }

  .video-card-meta {
    font-size: 0.85rem;
    color: #6c757d;
    margin-bottom: 10px;
  }

  .video-card .btn-danger {
    align-self: flex-end;
    font-size: 0.9rem;
    padding: 5px 10px;
  }

  .upload-form {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;
  }
`;
=======
// src/pages/VideoManager.js
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, Card, Dropdown, Pagination, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import VideoService from '../services/VideoService';
import { showToast } from '../components/common/CustomToast';
import { FiSearch, FiFilter, FiCalendar } from 'react-icons/fi';
import '../css/VideoManager.css';
>>>>>>> Stashed changes

const VideoManager = () => {
  const [videos, setVideos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
<<<<<<< Updated upstream
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
=======
  const [editVideoId, setEditVideoId] = useState(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const formRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateSort, setDateSort] = useState('desc');
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 4;
>>>>>>> Stashed changes

  useEffect(() => {
    fetchVideos();
  }, []);

<<<<<<< Updated upstream
=======
  useEffect(() => {
    let result = [...videos];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (video) =>
          video.title.toLowerCase().includes(query) ||
          (video.description && video.description.toLowerCase().includes(query))
      );
    }

    if (statusFilter) {
      result = result.filter((video) => video.status === statusFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.uploaded_at);
      const dateB = new Date(b.uploaded_at);
      return dateSort === 'desc' ? dateB - dateA : dateA - dateB;
    });

    setFilteredVideos(result);
    setCurrentPage(1);
  }, [videos, searchQuery, statusFilter, dateSort]);

>>>>>>> Stashed changes
  const fetchVideos = async () => {
    setLoading(true);
    try {
      const { videos: videoList } = await VideoService.getUserVideos();
      setVideos(videoList || []);
    } catch (err) {
      showToast.error('Lỗi khi tải danh sách video: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
<<<<<<< Updated upstream
    if (!title || !videoFile) {
      setError('Vui lòng cung cấp tiêu đề và file video');
=======
    if (!title) {
      showToast.error('Vui lòng cung cấp tiêu đề');
>>>>>>> Stashed changes
      return;
    }

    setLoading(true);
    try {
<<<<<<< Updated upstream
      const videoData = {
        title,
        description,
        video: videoFile,
      };
      const response = await VideoService.uploadVideo(videoData);
      setSuccess('Upload video thành công!');
=======
      const videoData = { title, description, video: videoFile };

      if (editVideoId) {
        await VideoService.updateVideo(editVideoId, videoData);
        showToast.success('Cập nhật video thành công!');
      } else {
        if (!videoFile) {
          showToast.error('Vui lòng cung cấp file video');
          setLoading(false);
          return;
        }
        await VideoService.uploadVideo(videoData);
        showToast.success('Upload video thành công!');
      }

>>>>>>> Stashed changes
      setTitle('');
      setDescription('');
      setVideoFile(null);
      fetchVideos();
    } catch (err) {
<<<<<<< Updated upstream
      setError('Lỗi khi upload video: ' + err.message);
=======
      showToast.error(err.message || 'Lỗi khi xử lý video');
>>>>>>> Stashed changes
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa video này?')) return;

    setLoading(true);
    try {
      await VideoService.deleteVideo(videoId);
      showToast.success('Xóa video thành công!');
      fetchVideos();
    } catch (err) {
<<<<<<< Updated upstream
      setError('Lỗi khi xóa video: ' + err.message);
=======
      showToast.error(err.message || 'Lỗi khi xóa video');
>>>>>>> Stashed changes
    } finally {
      setLoading(false);
    }
  };

<<<<<<< Updated upstream
  return (
    <Container className="my-4">
      {/* CSS tùy chỉnh */}
      <style>{videoCardStyles}</style>

      <h2>Quản lý Video</h2>

      {/* Form Upload */}
      <Form onSubmit={handleUpload} className="upload-form">
        <Form.Group controlId="title">
          <Form.Label>Tiêu đề</Form.Label>
=======
  const handleEdit = (video) => {
    setEditVideoId(video.video_id);
    setTitle(video.title);
    setDescription(video.description || '');
    setVideoFile(null);
    setCurrentVideoUrl(video.video_url);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelEdit = () => {
    setEditVideoId(null);
    setTitle('');
    setDescription('');
    setVideoFile(null);
    setCurrentVideoUrl(null);
  };

  const getStatusBadge = (status) => {
    const config = {
      Pending: { variant: 'warning', text: 'Đang chờ duyệt' },
      Approved: { variant: 'success', text: 'Đã duyệt' },
      Rejected: { variant: 'danger', text: 'Bị từ chối' },
    }[status] || { variant: 'secondary', text: status };

    return <span className={`badge bg-${config.variant}`}>{config.text}</span>;
  };

  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const renderPagination = () => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pageItems = [];
    for (let i = startPage; i <= endPage; i++) {
      pageItems.push(
        <Pagination.Item key={i} active={i === currentPage} onClick={() => handlePageChange(i)}>
          {i}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="pagination-container">
        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
        {startPage > 1 && <Pagination.Ellipsis />}
        {pageItems}
        {endPage < totalPages && <Pagination.Ellipsis />}
        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
      </Pagination>
    );
  };

  return (
    <Container fluid className="video-manager-container py-4">
      <h2 className="video-manager-title mb-4">Quản lý Video</h2>

      {/* FORM UPLOAD / EDIT */}
      <Form onSubmit={handleSubmit} className="upload-form p-4 rounded shadow-sm bg-white mb-5" ref={formRef}>
        <h5 className="mb-3">{editVideoId ? 'Sửa Video' : 'Tải lên Video mới'}</h5>

        {editVideoId && currentVideoUrl && (
          <div className="current-video-preview mb-3">
            <p className="mb-1 fw-bold">Video hiện tại:</p>
            <video controls className="w-100 rounded shadow-sm" style={{ maxHeight: '200px' }}>
              <source src={currentVideoUrl} type="video/mp4" />
              Trình duyệt không hỗ trợ video.
            </video>
          </div>
        )}

        <Form.Group controlId="title" className="mb-3">
          <Form.Label>Tiêu đề <span className="text-danger">*</span></Form.Label>
>>>>>>> Stashed changes
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề video"
<<<<<<< Updated upstream
          />
        </Form.Group>
        <Form.Group controlId="description" className="mt-3">
=======
            maxLength={200}
            required
            className="shadow-sm"
          />
        </Form.Group>

        <Form.Group controlId="description" className="mb-3">
>>>>>>> Stashed changes
          <Form.Label>Mô tả</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả (tùy chọn)"
<<<<<<< Updated upstream
          />
        </Form.Group>
        <Form.Group controlId="videoFile" className="mt-3">
          <Form.Label>File Video</Form.Label>
          <Form.Control
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit" className="mt-3" disabled={loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" /> Đang upload...
            </>
          ) : (
            'Upload Video'
=======
            maxLength={500}
            className="shadow-sm"
          />
        </Form.Group>

        {!editVideoId && (
          <Form.Group controlId="videoFile" className="mb-3">
            <Form.Label>File Video <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              required
              className="shadow-sm"
            />
            <Form.Text className="text-muted">
              MP4, AVI, MOV... Tối đa 100MB.
            </Form.Text>
          </Form.Group>
        )}

        <div className="d-flex gap-2">
          <Button variant="primary" type="submit" disabled={loading} className="px-4">
            {loading ? 'Đang xử lý...' : editVideoId ? 'Cập nhật' : 'Upload'}
          </Button>
          {editVideoId && (
            <Button variant="secondary" onClick={handleCancelEdit} disabled={loading}>
              Hủy
            </Button>
>>>>>>> Stashed changes
          )}
        </Button>
      </Form>

<<<<<<< Updated upstream
      {/* Thông báo */}
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Danh sách Video */}
      <h3>Danh sách Video</h3>
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : videos.length === 0 ? (
        <p>Chưa có video nào.</p>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {videos.map((video) => (
            <Col key={video.video_id}>
              <Card className="video-card">
                <video controls>
                  <source src={video.video_url} type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
                <Card.Body className="video-card-body">
                  <Card.Title className="video-card-title">{video.title}</Card.Title>
                  <Card.Text className="video-card-text">{video.description || 'Không có mô tả'}</Card.Text>
                  <div className="video-card-meta">
                    <div>Lượt thích: {video.likes || 0}</div>
                    <div>Ngày upload: {new Date(video.uploaded_at).toLocaleDateString()}</div>
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(video.video_id)}
                    disabled={loading}
                  >
                    Xóa
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
=======
      {/* === FILTER FORM === */}
<Form className="filter-form">
  <Row className="g-3 align-items-end">
    {/* TÌM KIẾM */}
    <Col md={5}>
      <Form.Group>
        <Form.Label className="filter-label">
          <FiSearch className="me-1" /> Tìm kiếm 
        </Form.Label>
        <div className="input-group filter-input-group">
          
          <Form.Control
            type="text"
            placeholder="Tìm theo tiêu đề hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-control"
          />
        </div>
      </Form.Group>
    </Col>

    {/* TRẠNG THÁI */}
    <Col md={3}>
      <Form.Group>
        <Form.Label className="filter-label">
          <FiFilter className="me-1" /> Trạng thái
        </Form.Label>
        <Form.Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-control"
        >
          <option value="">Tất cả</option>
          <option value="Pending">Đang chờ duyệt</option>
          <option value="Approved">Đã duyệt</option>
          <option value="Rejected">Bị từ chối</option>
        </Form.Select>
      </Form.Group>
    </Col>

    {/* SẮP XẾP */}
    <Col md={4}>
      <Form.Group>
        <Form.Label className="filter-label">
          <FiCalendar className="me-1" /> Sắp xếp
        </Form.Label>
        <Dropdown>
          <Dropdown.Toggle
            variant="outline-primary"
            className="w-100 filter-dropdown-toggle d-flex justify-content-between align-items-center"
          >
            <span>{dateSort === 'desc' ? 'Mới nhất trước' : 'Cũ nhất trước'}</span>
          </Dropdown.Toggle>
          <Dropdown.Menu className="filter-dropdown-menu">
            <Dropdown.Item
              onClick={() => setDateSort('desc')}
              className="d-flex align-items-center gap-2"
            >
              Mới nhất trước
            </Dropdown.Item>
            <Dropdown.Item
              onClick={() => setDateSort('asc')}
              className="d-flex align-items-center gap-2"
            >
              Cũ nhất trước
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Form.Group>
    </Col>
  </Row>
</Form>
      {/* DANH SÁCH VIDEO */}
      <h3 className="mb-3">Danh sách Video ({filteredVideos.length})</h3>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <Alert variant="info" className="text-center py-5">
          <p className="mb-0">Chưa có video nào.</p>
          <small>Hãy tải lên hoặc thay đổi bộ lọc!</small>
        </Alert>
      ) : (
        <>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {currentVideos.map((video) => (
              <Col key={video.video_id}>
                <Card className="video-card h-100 shadow-sm border-0 overflow-hidden">
                  <div className="position-relative">
                    <video
                      controls
                      className="w-100 card-img-top"
                      style={{ height: '380px', objectFit: 'cover' }}
                    >
                      <source src={video.video_url} type="video/mp4" />
                      Trình duyệt không hỗ trợ video.
                    </video>
                    <div className="position-absolute top-0 start-0 p-2">
                      {getStatusBadge(video.status)}
                    </div>
                  </div>

                  <Card.Body className="d-flex flex-column p-3">
                    {/* CHỈ APPROVED MỚI CÓ LINK */}
                    <Card.Title className="fw-bold mb-2">
                      {video.status === 'Approved' ? (
                        <Link
                          to={`/video/${video.video_id}`}
                          className="text-decoration-none text-dark stretched-link"
                        >
                          {video.title}
                        </Link>
                      ) : (
                        <span className="text-muted">{video.title}</span>
                      )}
                    </Card.Title>

                    <Card.Text className="text-muted small flex-grow-1 mb-3">
                      {video.description || 'Không có mô tả'}
                    </Card.Text>

                    <div className="small text-muted mb-3">
                      <div>Likes {video.likes || 0} lượt thích</div>
                      <div>Date {new Date(video.uploaded_at).toLocaleDateString('vi-VN')}</div>
                    </div>

                    {/* LÝ DO VI PHẠM */}
                    {video.text_moderation_status === 'BAD' && (
                      <Alert variant="warning" className="p-2 small mb-2">
                        <strong>Tiêu đề/mô tả vi phạm:</strong><br />
                        <small className="text-danger">{video.text_moderation_reason || 'Nội dung không phù hợp'}</small>
                      </Alert>
                    )}

                    {video.status === 'Rejected' && video.rejection_reason && (
                      <Alert variant="danger" className="p-2 small mb-2">
                        <strong>Lý do từ chối:</strong><br />
                        <small>{video.rejection_reason}</small>
                      </Alert>
                    )}

                    <div className="mt-auto d-flex gap-1">
                      {video.status === 'Pending' && (
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => handleEdit(video)}
                          disabled={loading}
                          className="flex-fill"
                        >
                          Sửa
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(video.video_id)}
                        disabled={loading}
                        className="flex-fill"
                      >
                        Xóa
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              {renderPagination()}
            </div>
          )}
        </>
>>>>>>> Stashed changes
      )}
    </Container>
  );
};

export default VideoManager;