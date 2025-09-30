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

const VideoManager = () => {
  const [videos, setVideos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !videoFile) {
      setError('Vui lòng cung cấp tiêu đề và file video');
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
      const response = await VideoService.uploadVideo(videoData);
      setSuccess('Upload video thành công!');
      setTitle('');
      setDescription('');
      setVideoFile(null);
      fetchVideos();
    } catch (err) {
      setError('Lỗi khi upload video: ' + err.message);
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
      setError('Lỗi khi xóa video: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-4">
      {/* CSS tùy chỉnh */}
      <style>{videoCardStyles}</style>

      <h2>Quản lý Video</h2>

      {/* Form Upload */}
      <Form onSubmit={handleUpload} className="upload-form">
        <Form.Group controlId="title">
          <Form.Label>Tiêu đề</Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Nhập tiêu đề video"
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
          )}
        </Button>
      </Form>

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
      )}
    </Container>
  );
};

export default VideoManager;