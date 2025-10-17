import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, Card, Dropdown, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import VideoService from '../services/VideoService';
import '../css/VideoManager.css';

const VideoManager = () => {
  const [videos, setVideos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editVideoId, setEditVideoId] = useState(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const formRef = useRef(null); // Reference to the form for scrolling

  // State for search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateSort, setDateSort] = useState('desc');
  const [filteredVideos, setFilteredVideos] = useState([]);
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 4;

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    // Filter and sort videos
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

  useEffect(() => {
    if (error) {
      toast.error(error, { position: 'top-right', autoClose: 3000 });
    }
    if (success) {
      toast.success(success, { position: 'top-right', autoClose: 3000 });
    }
  }, [error, success]);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const { videos: videoList } = await VideoService.getUserVideos();
      setVideos(videoList || []);
    } catch (err) {
      setError('Lỗi khi tải danh sách video: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      setError('Vui lòng cung cấp tiêu đề');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const videoData = {
        title,
        description,
        video: videoFile,
      };

      if (editVideoId) {
        await VideoService.updateVideo(editVideoId, videoData);
        setSuccess('Cập nhật video thành công!');
      } else {
        if (!videoFile) {
          setError('Vui lòng cung cấp file video');
          setLoading(false);
          return;
        }
        await VideoService.uploadVideo(videoData);
        setSuccess('Upload video thành công!');
      }

      setTitle('');
      setDescription('');
      setVideoFile(null);
      setEditVideoId(null);
      setCurrentVideoUrl(null);
      fetchVideos();
    } catch (err) {
      setError(err.message || 'Lỗi khi xử lý video');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa video này?')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await VideoService.deleteVideo(videoId);
      setSuccess('Xóa video thành công!');
      fetchVideos();
    } catch (err) {
      setError(err.message || 'Lỗi khi xóa video');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (video) => {
    setEditVideoId(video.video_id);
    setTitle(video.title);
    setDescription(video.description || '');
    setVideoFile(null);
    setCurrentVideoUrl(video.video_url);
    // Scroll to the form smoothly
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCancelEdit = () => {
    setEditVideoId(null);
    setTitle('');
    setDescription('');
    setVideoFile(null);
    setCurrentVideoUrl(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { variant: 'warning', text: 'Đang chờ duyệt', className: 'status-pending' },
      Approved: { variant: 'success', text: 'Đã duyệt', className: 'status-approved' },
      Rejected: { variant: 'danger', text: 'Bị từ chối', className: 'status-rejected' },
    };

    const config = statusConfig[status] || { variant: 'secondary', text: status, className: '' };

    return (
      <span className={`status-badge ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getStatusBadgeRight = (status) => {
    const statusConfig = {
      Pending: { variant: 'warning', text: 'Đang chờ duyệt', className: 'status-pending' },
      Approved: { variant: 'success', text: 'Đã duyệt', className: 'status-approved' },
      Rejected: { variant: 'danger', text: 'Bị từ chối', className: 'status-rejected' },
    };

    const config = statusConfig[status] || { variant: 'secondary', text: status, className: '' };

    return (
      <span className={`status-badge-right ${config.className}`}>
        {config.text}
      </span>
    );
  };

  // Pagination logic
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => {
    const pageItems = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageItems.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="pagination-container">
        <Pagination.Prev
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        {startPage > 1 && <Pagination.Ellipsis />}
        {pageItems}
        {endPage < totalPages && <Pagination.Ellipsis />}
        <Pagination.Next
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  return (
    <Container fluid className="video-manager-container">
      <ToastContainer />
      <h2 className="video-manager-title">Quản lý Video</h2>

      {/* Form for both Upload and Edit */}
      <Form onSubmit={handleSubmit} className="upload-form" ref={formRef}>
        <h5 className="mb-3">{editVideoId ? 'Sửa Video' : 'Tải lên Video mới'}</h5>
        {editVideoId && currentVideoUrl && (
          <div className="current-video-preview">
            <p>Video hiện tại:</p>
            <video controls>
              <source src={currentVideoUrl} type="video/mp4" />
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          </div>
        )}
        <Form.Group controlId="title">
          <Form.Label>Tiêu đề <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Nhập tiêu đề video"
            maxLength={200}
          />
        </Form.Group>

        <Form.Group controlId="description" className="mt-3">
          <Form.Label>Mô tả</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả (tùy chọn)"
            maxLength={500}
          />
        </Form.Group>

        <Form.Group controlId="videoFile" className="mt-3">
          <Form.Label>File Video {editVideoId ? '(tùy chọn - thay thế video hiện tại)' : <span className="text-danger">*</span>}</Form.Label>
          <Form.Control
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            required={!editVideoId}
          />
          <Form.Text className="text-muted">
            {editVideoId
              ? 'Để trống nếu không muốn thay đổi video hiện tại.'
              : 'Chọn file video (MP4, AVI, MOV, v.v.). Kích thước tối đa 100MB.'}
          </Form.Text>
        </Form.Group>

        <div className="mt-3">
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : editVideoId ? 'Cập nhật Video' : 'Upload Video'}
          </Button>
          {editVideoId && (
            <Button
              variant="secondary"
              onClick={handleCancelEdit}
              className="ms-2"
              disabled={loading}
            >
              Hủy
            </Button>
          )}
        </div>
      </Form>

      {/* Filter & Search */}
      <Form className="filter-form">
        <div className="filter-group">
          <Form.Group controlId="searchQuery">
            <Form.Label>Tìm kiếm</Form.Label>
            <div className="input-group">
              <span className="input-group-icon"><i className="bi bi-search"></i></span>
              <Form.Control
                type="text"
                placeholder="Tìm theo tiêu đề hoặc mô tả"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </Form.Group>
        </div>

        <div className="filter-group">
          <Form.Group controlId="statusFilter">
            <Form.Label>Trạng thái</Form.Label>
            <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="Pending">Đang chờ duyệt</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Rejected">Bị từ chối</option>
            </Form.Select>
          </Form.Group>
        </div>

        <div className="filter-group">
          <Form.Group controlId="dateSort">
            <Form.Label>Sắp xếp theo ngày</Form.Label>
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" id="dropdown-date-sort">
                {dateSort === 'desc' ? 'Mới nhất trước' : 'Cũ nhất trước'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setDateSort('desc')}>Mới nhất trước</Dropdown.Item>
                <Dropdown.Item onClick={() => setDateSort('asc')}>Cũ nhất trước</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Form.Group>
        </div>
      </Form>

      {/* Video List */}
      <h3 className="mt-4 mb-3">Danh sách Video của bạn ({filteredVideos.length})</h3>
      {loading ? (
        <div className="text-center py-5"><p>Đang tải video...</p></div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">Chưa có video nào phù hợp.</p>
          <p>Hãy tải lên video hoặc thay đổi bộ lọc!</p>
        </div>
      ) : (
        <>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {currentVideos.map((video) => (
              <Col key={video.video_id}>
                <Card className="video-card h-100">
                  <div className="position-relative">
                    <video controls className="w-100">
                      <source src={video.video_url} type="video/mp4" />
                      Trình duyệt của bạn không hỗ trợ video.
                    </video>
                    <div className="position-absolute top-0 start-0 p-2">
                      {getStatusBadge(video.status)}
                    </div>
                    <div className="position-absolute top-0 end-0 p-2">
                      {getStatusBadgeRight(video.status)}
                    </div>
                  </div>

                  <Card.Body className="video-card-body">
                    <Card.Title className="video-card-title">
                      <Link to={`/video/${video.video_id}`}>{video.title}</Link>
                    </Card.Title>
                    <Card.Text className="video-card-text">
                      <Link to={`/video/${video.video_id}`}>
                        {video.description || 'Không có mô tả'}
                      </Link>
                    </Card.Text>

                    <div className="video-card-meta">
                      <div className="mb-1">
                        <i className="bi bi-heart-fill text-danger me-1"></i>
                        Lượt thích: {video.likes || 0}
                      </div>
                      <div className="mb-1">
                        <i className="bi bi-calendar3 me-1"></i>
                        Upload: {new Date(video.uploaded_at).toLocaleDateString('vi-VN')}
                      </div>
                      {video.expert && (
                        <div>
                          <i className="bi bi-person-circle me-1"></i>
                          Chuyên gia: {video.expert}
                        </div>
                      )}
                    </div>

                    <div className="btn-group-edit">
                      {video.status === 'Pending' && (
                        <Button
                          variant="warning"
                          onClick={() => handleEdit(video)}
                          disabled={loading}
                          size="sm"
                        >
                          <i className="bi bi-pencil me-1"></i>Chỉnh sửa
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(video.video_id)}
                        disabled={loading}
                        size="sm"
                      >
                        <i className="bi bi-trash me-1"></i>Xóa
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {renderPagination()}
        </>
      )}
    </Container>
  );
};

export default VideoManager;