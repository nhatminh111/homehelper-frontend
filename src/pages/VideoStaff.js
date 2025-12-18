import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Badge, Button, Modal, Alert } from 'react-bootstrap';
import { FiSearch, FiFilter, FiCheck, FiX, FiTrash2, FiVideo } from 'react-icons/fi';
import VideoService from '../services/VideoService';
import { showToast } from '../components/common/CustomToast';
import '../css/VideoApproval.css'; // Reusing the CSS file

const VideoStaff = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('Pending'); // Default to Pending
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for actions
    const [showModal, setShowModal] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'delete'
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchVideos();
    }, [filterStatus]);

    const fetchVideos = async () => {
        setLoading(true);
        try {
            // If we are filtering by status, we might need a specific API or filter client-side
            // VideoService.getPendingVideos() fetches pending ones.
            // VideoService.getAllVideos() fetches all (for admin/staff usually).

            let fetchedVideos = [];
            if (filterStatus === 'Pending') {
                const result = await VideoService.getPendingVideos();
                fetchedVideos = result.videos || [];
            } else {
                const result = await VideoService.getAllVideos();
                fetchedVideos = result.videos || [];
                if (filterStatus !== 'All') {
                    fetchedVideos = fetchedVideos.filter(v => v.status === filterStatus);
                }
            }
            setVideos(fetchedVideos);
        } catch (error) {
            showToast.error("Lỗi khi tải danh sách video: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (video, type) => {
        setSelectedVideo(video);
        setActionType(type);
        setRejectionReason('');
        setShowModal(true);
    };

    const confirmAction = async () => {
        if (!selectedVideo) return;

        setLoading(true);
        try {
            if (actionType === 'approve') {
                await VideoService.updateVideoStatus(selectedVideo.video_id, 'Approved');
                showToast.success('Đã duyệt video thành công');
            } else if (actionType === 'reject') {
                // Note: updateVideoStatus might need a reason field if backend supports it, 
                // but looking at VideoService.updateVideoStatus(id, status), it only takes status.
                // If backend doesn't support reason yet, we just reject.
                // Checking VideoService.js: async updateVideoStatus(videoId, status)
                // It seems it doesn't take a reason. I'll just send status for now.
                await VideoService.updateVideoStatus(selectedVideo.video_id, 'Rejected');
                showToast.success('Đã từ chối video');
            } else if (actionType === 'delete') {
                await VideoService.deleteVideoByStaff(selectedVideo.video_id);
                showToast.success('Đã xóa video vĩnh viễn');
            }

            setShowModal(false);
            fetchVideos(); // Refresh list
        } catch (error) {
            showToast.error('Lỗi: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter videos by search query
    const filteredVideos = videos.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="video-approval-container">
            <h2 className="video-approval-title">
                <FiVideo className="me-2" />
                Kiểm duyệt Video
            </h2>
            <p className="video-approval-description">
                Xem xét và quản lý các video được tải lên bởi Tasker.
            </p>

            {/* Statistics / Quick Filters */}
            <div className="video-stats">
                <span
                    className={`stat-pending ${filterStatus === 'Pending' ? 'active-stat' : ''}`}
                    onClick={() => setFilterStatus('Pending')}
                    style={{ cursor: 'pointer', border: filterStatus === 'Pending' ? '2px solid #d97706' : 'none' }}
                >
                    Chờ duyệt
                </span>
                <span
                    className={`stat-approved ${filterStatus === 'Approved' ? 'active-stat' : ''}`}
                    onClick={() => setFilterStatus('Approved')}
                    style={{ cursor: 'pointer', border: filterStatus === 'Approved' ? '2px solid #059669' : 'none' }}
                >
                    Đã duyệt
                </span>
                <span
                    className={`stat-rejected ${filterStatus === 'Rejected' ? 'active-stat' : ''}`}
                    onClick={() => setFilterStatus('Rejected')}
                    style={{ cursor: 'pointer', border: filterStatus === 'Rejected' ? '2px solid #dc2626' : 'none' }}
                >
                    Từ chối
                </span>
                <span
                    className={`stat-all ${filterStatus === 'All' ? 'active-stat' : ''}`}
                    onClick={() => setFilterStatus('All')}
                    style={{ cursor: 'pointer', border: filterStatus === 'All' ? '2px solid #2563eb' : 'none' }}
                >
                    Tất cả
                </span>
            </div>

            {/* Controls */}
            <div className="controls-container">
                <div className="control-group">
                    <label className="control-label">Tìm kiếm</label>
                    <div className="input-wrapper">
                        <FiSearch className="input-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Tìm theo tiêu đề, mô tả..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Video Grid */}
            {loading ? (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p className="mt-2">Đang tải dữ liệu...</p>
                </div>
            ) : filteredVideos.length === 0 ? (
                <div className="no-videos">
                    Không tìm thấy video nào phù hợp.
                </div>
            ) : (
                <div className="video-grid">
                    {filteredVideos.map(video => (
                        <div key={video.video_id} className="video-card">
                            <div className="video-wrapper">
                                <video controls className="video-player">
                                    <source src={video.video_url} type="video/mp4" />
                                    Trình duyệt không hỗ trợ thẻ video.
                                </video>
                                <div className="position-absolute top-0 end-0 p-2">
                                    <Badge bg={
                                        video.status === 'Approved' ? 'success' :
                                            video.status === 'Rejected' ? 'danger' : 'warning'
                                    }>
                                        {video.status === 'Pending' ? 'Chờ duyệt' :
                                            video.status === 'Approved' ? 'Đã duyệt' : 'Từ chối'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-3">
                                <h5 className="video-title" title={video.title}>{video.title}</h5>
                                <p className="video-meta text-truncate">
                                    Tasker: {video.User?.name || 'Unknown'} <br />
                                    Ngày đăng: {new Date(video.uploaded_at).toLocaleDateString('vi-VN')}
                                </p>
                                {video.description && (
                                    <p className="small text-muted mb-2 text-truncate">
                                        {video.description}
                                    </p>
                                )}

                                {/* Moderation Warning */}
                                {video.text_moderation_status === 'BAD' && (
                                    <Alert variant="danger" className="py-1 px-2 small mb-2" style={{ fontSize: '0.75rem' }}>
                                        Nội dung có thể vi phạm: {video.text_moderation_reason}
                                    </Alert>
                                )}

                                <div className="video-actions mt-3 pt-2 border-top">
                                    {video.status === 'Pending' && (
                                        <>
                                            <button
                                                className="approve-button me-2"
                                                title="Duyệt"
                                                onClick={() => handleAction(video, 'approve')}
                                            >
                                                <FiCheck />
                                            </button>
                                            <button
                                                className="reject-button me-auto"
                                                title="Từ chối"
                                                onClick={() => handleAction(video, 'reject')}
                                            >
                                                <FiX />
                                            </button>
                                        </>
                                    )}

                                    <button
                                        className="delete-button ms-auto"
                                        title="Xóa vĩnh viễn"
                                        onClick={() => handleAction(video, 'delete')}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {actionType === 'approve' ? 'Xác nhận duyệt' :
                            actionType === 'reject' ? 'Xác nhận từ chối' : 'Xác nhận xóa'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Bạn có chắc chắn muốn
                        {actionType === 'approve' ? ' <strong>DUYỆT</strong> ' :
                            actionType === 'reject' ? ' <strong>TỪ CHỐI</strong> ' : ' <strong>XÓA</strong> '}
                        video "<strong>{selectedVideo?.title}</strong>" không?
                    </p>

                    {actionType === 'delete' && (
                        <Alert variant="danger">
                            Hành động này không thể hoàn tác! Video sẽ bị xóa khỏi hệ thống.
                        </Alert>
                    )}

                    {actionType === 'reject' && (
                        <Form.Group className="mt-3">
                            <Form.Label>Lý do từ chối (Tùy chọn - feature pending)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Nhập lý do..."
                            />
                        </Form.Group>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Hủy bỏ
                    </Button>
                    <Button
                        variant={
                            actionType === 'approve' ? 'success' :
                                actionType === 'reject' ? 'warning' : 'danger'
                        }
                        onClick={confirmAction}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default VideoStaff;
