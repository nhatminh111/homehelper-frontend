import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faStar, faHeart, faPhone, faShare, faFlag, faEllipsisH, faCircleCheck, faChevronRight, faComment, faEdit, faTrash
} from '@fortawesome/free-solid-svg-icons';
import VideoService from '../services/VideoService';
import { authAPI, getStoredToken } from '../services/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/videoDetail.css';

const VideoDetail = () => {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMenu, setShowMenu] = useState(null); // New state for dropdown menu
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getStoredToken();
        if (token) {
          try {
            const userResponse = await authAPI.getCurrentUser(token);
            setUserId(userResponse.user.user_id);
            setIsAuthenticated(true);
          } catch (authError) {
            console.error('Authentication check failed:', authError);
            setIsAuthenticated(false);
            localStorage.removeItem('token');
            localStorage.removeItem('user_id');
          }
        }

        const videoResponse = await VideoService.getVideoById(videoId);
        const videoData = videoResponse.video;

        const mappedVideo = {
          video_id: videoData.video_id,
          title: videoData.title,
          video_url: videoData.video_url,
          description: videoData.description || 'Không có mô tả',
          timeAgo: calculateTimeAgo(videoData.uploaded_at),
          author: videoData.expert || `Người dùng ${videoData.user_id}`,
          rating: videoData.rating || 4.5,
          views: videoData.views || 'N/A',
          tips: videoData.tips || [
            'Khăn sợi nhỏ chất lượng cao',
            'Dung dịch tẩy rửa đa năng thân thiện với môi trường',
            'Hộp lưu trữ phân loại màu',
            'Máy hút bụi công suất cao & hệ thống lau nhà thông minh',
          ],
          tags: videoData.tags || ['Dọn dẹp', 'Tổ chức nhà cửa', 'Mẹo chuyên nghiệp', 'Phong cách sống'],
        };
        setVideo(mappedVideo);

        const allVideosResponse = await VideoService.getAllVideos();
        const mappedRelatedVideos = (allVideosResponse.videos || [])
          .filter((v) => v.video_id !== videoData.video_id)
          .map((v) => ({
            video_id: v.video_id,
            title: v.title,
            video_url: v.video_url,
            views: `${v.likes || 0} lượt thích`,
          }));
        setRelatedVideos(mappedRelatedVideos);

        try {
          const commentsResponse = await VideoService.getVideoCommentTree(videoId, { limit: 50 });
          setComments(commentsResponse.comments || []);
        } catch (commentError) {
          console.error('Failed to fetch comment tree:', commentError);
          toast.error('Không thể tải bình luận. Vui lòng thử lại sau.');
          setComments([]);
        }
      } catch (err) {
        console.error('Error fetching video details:', err);
        toast.error('Lỗi khi tải chi tiết video: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [videoId]);

 const calculateTimeAgo = (uploadedAt) => {
  const now = new Date();
  const uploaded = new Date(uploadedAt);
  const diffMs = now - uploaded;
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffWeeks < 4) return `${diffWeeks} tuần trước`;
  return `${diffMonths} tháng trước`;
};
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handlePlayEvent = () => {
    setIsPlaying(true);
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error('Nội dung bình luận không được để trống');
      return;
    }
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để bình luận');
      return;
    }

    try {
      const commentData = { content: newComment, video_id: videoId };
      const response = await VideoService.createVideoComment(videoId, commentData);
      setComments((prev) => [...prev, response.comment]);
      setNewComment('');
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
      } else if (err.message.includes('Nội dung comment không phù hợp')) {
        toast.error('Nội dung bình luận không phù hợp, chứa những từ không cho phép');
      } else {
        toast.error('Lỗi khi tạo bình luận: ' + err.message);
      }
    }
  };

  const handleCreateReply = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      toast.error('Nội dung trả lời không được để trống');
      return;
    }
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để trả lời');
      return;
    }

    try {
      const commentData = {
        content: replyContent,
        video_id: videoId,
        parent_comment_id: parentCommentId,
      };
      const response = await VideoService.createVideoComment(videoId, commentData);

      setComments((prev) => {
        const updatedComments = prev.map((comment) => {
          if (comment.comment_id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), response.comment],
            };
          }
          return comment;
        });
        return updatedComments;
      });

      setReplyContent('');
      setReplyingCommentId(null);
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
      } else if (err.message.includes('Nội dung comment không phù hợp')) {
        toast.error('Nội dung trả lời không phù hợp, chứa những từ không cho phép');
      } else {
        toast.error('Lỗi khi gửi trả lời: ' + err.message);
      }
    }
  };

  const updateCommentInTree = (comments, commentId, updatedComment) => {
    return comments.map((comment) => {
      if (comment.comment_id === commentId) {
        return { ...comment, ...updatedComment };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, updatedComment),
        };
      }
      return comment;
    });
  };

  const handleUpdateComment = async (e, commentId) => {
    e.preventDefault();
    if (!editingContent.trim()) {
      toast.error('Nội dung bình luận không được để trống');
      return;
    }

    try {
      const response = await VideoService.updateVideoComment(commentId, editingContent);
      setComments((prev) => updateCommentInTree(prev, commentId, response.comment));
      setEditingCommentId(null);
      setEditingContent('');
      setShowMenu(null); // Close menu after update
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
      } else if (err.message.includes('Nội dung comment không phù hợp')) {
        toast.error('Nội dung bình luận không phù hợp, chứa những từ không cho phép');
      } else {
        toast.error('Lỗi khi cập nhật bình luận: ' + err.message);
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await VideoService.deleteVideoComment(commentId);
      setComments((prev) => prev.filter((c) => c.comment_id !== commentId));
      setShowMenu(null); // Close menu after delete
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
      } else {
        toast.error('Lỗi khi xóa bình luận: ' + err.message);
      }
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.comment_id);
    setEditingContent(comment.content);
    setShowMenu(null); // Close menu when editing
  };

  const handleMoreClick = (commentId) => {
    setShowMenu(showMenu === commentId ? null : commentId);
  };

  const renderComments = (comments, level = 0) => {
    if (!comments || !Array.isArray(comments)) {
      console.warn('Invalid comments data:', comments);
      return null;
    }
    return comments.map((comment) => {
      if (!comment || !comment.comment_id) {
        console.warn('Invalid comment object:', comment);
        return null;
      }
      return (
        <div key={comment.comment_id} className="comment-item" style={{ marginLeft: `${level * 20}px` }}>
          <img src="/images/avatar-placeholder.jpg" alt="Avatar" className="avatar circle" />
          <div className="cmt-body">
            <div className="cmt-head">
              <span className="name">{comment.author_name || `Người dùng ${comment.user_id || 'ẩn danh'}`}</span>
              <span className="time">{calculateTimeAgo(comment.created_at)}</span>
            </div>
            {editingCommentId === comment.comment_id ? (
              <form onSubmit={(e) => handleUpdateComment(e, comment.comment_id)} className="comment-edit-form">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="form-control"
                />
                <div className="input-actions">
                  <span className="note">Bình luận sẽ được kiểm duyệt</span>
                  <div className="btns">
                    <button type="button" className="btn-cancel" onClick={() => setEditingCommentId(null)}>
                      Hủy
                    </button>
                    <button type="submit" className="btn-comment">
                      Cập nhật
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                <p className="cmt-text">{comment.content || 'Không có nội dung'}</p>
                <div className="cmt-actions">
                  {isAuthenticated && (
                    <button
                      className="reply-btn"
                      onClick={() => setReplyingCommentId(comment.comment_id)}
                    >
                      <FontAwesomeIcon icon={faComment} className="reply-icon" /> Trả lời
                    </button>
                  )}
                  {isAuthenticated && comment.user_id === parseInt(userId) && (
                    <div className="comment-actions-wrapper">
                      <button className="comment-more-btn" onClick={() => handleMoreClick(comment.comment_id)}>
                        <FontAwesomeIcon icon={faEllipsisH} />
                      </button>
                      <div className={`comment-actions-menu ${showMenu === comment.comment_id ? 'active' : ''}`}>
                        <button className="edit-btn" onClick={() => handleEditComment(comment)}>
                          <FontAwesomeIcon icon={faEdit} /> Sửa
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteComment(comment.comment_id)}>
                          <FontAwesomeIcon icon={faTrash} /> Xóa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {replyingCommentId === comment.comment_id && isAuthenticated && (
              <form
                onSubmit={(e) => handleCreateReply(e, comment.comment_id)}
                className="comment-reply-form"
                style={{ marginLeft: `${(level + 1) * 20}px` }}
              >
                <div className="comment-top">
                  <img src="/images/avatar-placeholder.jpg" alt="Avatar" className="avatar circle" />
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Viết câu trả lời..."
                    className="form-control"
                  />
                </div>
                <div className="input-actions">
                  <span className="note">Trả lời sẽ được kiểm duyệt</span>
                  <div className="btns">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        setReplyingCommentId(null);
                        setReplyContent('');
                      }}
                    >
                      Hủy
                    </button>
                    <button type="submit" className="btn-comment">
                      Gửi trả lời
                    </button>
                  </div>
                </div>
              </form>
            )}
            {comment.replies && comment.replies.length > 0 && (
              <div className="comment-replies">
                {renderComments(comment.replies, level + 1)}
              </div>
            )}
          </div>
        </div>
      );
    }).filter((comment) => comment !== null);
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="alert alert-danger" role="alert">
        {error || 'Video không tồn tại'}
        <button
          className="btn btn-link"
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="video-detail-page">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      <section className="hero-wrap hero-wrap-2" style={{ backgroundImage: "url('/images/bg_2.jpg')" }} data-stellar-background-ratio="0.5">
        <div className="overlay"></div>
        <div className="container">
          <div className="row no-gutters slider-text align-items-end">
            <div className="col-md-9 ftco-animate pb-5">
              <p className="breadcrumbs mb-2">
                <span className="mr-2">
                  <Link to="/">Trang chủ <FontAwesomeIcon icon={faChevronRight} /></Link>
                </span>
                <span>
                  <Link to="/video">Video <FontAwesomeIcon icon={faChevronRight} /></Link>
                </span>
                <span>{video.title}</span>
              </p>
              <h1 className="mb-0 bread">{video.title}</h1>
            </div>
          </div>
        </div>
      </section>

      <section className="ftco-section bg-light">
        <div className="container">
          <div className="content-grid">
            <div className="detail-card">
              <div className="thumb-hero">
                <video
                  ref={videoRef}
                  className="video-thumbnail"
                  controls
                  onPlay={handlePlayEvent}
                  onPause={handlePause}
                >
                  <source src={video.video_url} type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
                {!isPlaying && (
                  <button className="play-btn" aria-label="Phát video" onClick={handlePlay}>
                    <FontAwesomeIcon icon={faPlay} />
                  </button>
                )}
              </div>

              <div className="title-box">
                <h2 className="detail-title">{video.title}</h2>
                <p className="detail-time">{video.timeAgo}</p>
              </div>

              <div className="desc-box">
                <p className="video-desc">{video.description}</p>
              </div>

              <div className="author-box">
                <div className="author-bar">
                  <img src="/images/bg_1.jpg" alt={video.author} className="author-avatar" />
                  <div className="author-meta">
                    <div className="author-name">
                      {video.author} <FontAwesomeIcon icon={faCircleCheck} className="verified" />
                    </div>
                    <div className="author-rating">
                      <FontAwesomeIcon icon={faStar} className="star" /> {video.rating} Sao
                    </div>
                  </div>

                  <div className="author-actions">
                    <button className="btn-ghost">
                      <FontAwesomeIcon icon={faHeart} /> <span>Yêu thích</span>
                    </button>
                    <button className="btn-outline-blue">
                      <FontAwesomeIcon icon={faPhone} /> <span>Đặt lịch</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="footer-box">
                <div className="detail-footer">
                  <span className="df-item">
                    <FontAwesomeIcon icon={faHeart} /> {video.views}
                  </span>
                  <button className="df-link">
                    <FontAwesomeIcon icon={faShare} /> Chia sẻ
                  </button>
                  <button className="df-link">
                    <FontAwesomeIcon icon={faFlag} /> Báo cáo
                  </button>
                  <button className="df-more">
                    <FontAwesomeIcon icon={faEllipsisH} />
                  </button>
                </div>
              </div>

              <div className="desc-box">
                <div className="tags-row">
                  {video.tags.map((t, i) => (
                    <span key={i} className="tag-chip">{t}</span>
                  ))}
                </div>
                <div className="tips-panel">
                  <div className="tips-title">🧰 Công cụ bạn cần:</div>
                  <ul className="tips-list">
                    {video.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </div>
              </div>

              <div className="comments-box">
                <h3 className="comments-title">Bình luận</h3>
                {isAuthenticated ? (
                  <form onSubmit={handleCreateComment} className="comment-form">
                    <div className="comment-top">
                      <img src="/images/avatar-placeholder.jpg" alt="Avatar" className="avatar circle" />
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Viết bình luận..."
                        className="form-control"
                        rows="3"
                      />
                    </div>
                    <div className="input-actions">
                      <span className="note">Bình luận sẽ được kiểm duyệt</span>
                      <div className="btns">
                        <button type="submit" className={newComment.trim() ? 'btn-comment' : 'btn-comment-disabled'}>
                          Gửi
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <p className="login-prompt mb-4">
                    <Link to="/login">Đăng nhập</Link> để bình luận
                  </p>
                )}
                <div className="comments-list">
                  {comments.length === 0 ? (
                    <p className="text-muted">Chưa có bình luận nào.</p>
                  ) : (
                    renderComments(comments)
                  )}
                </div>
              </div>
            </div>

            <aside className="related-card">
              <h3 className="related-title-head">Video khác</h3>
              {relatedVideos.length === 0 ? (
                <p>Không có video khác.</p>
              ) : (
                relatedVideos.map((rv) => (
                  <Link key={rv.video_id} to={`/video/${rv.video_id}`} className="related-video">
                    <div className="related-thumb-wrap">
                      <video className="related-thumbnail">
                        <source src={rv.video_url} type="video/mp4" />
                        Trình duyệt của bạn không hỗ trợ video.
                      </video>
                    </div>
                    <div className="related-info">
                      <h4 className="rv-title">{rv.title}</h4>
                      <p className="rv-likes">✩ {rv.views}</p>
                    </div>
                  </Link>
                ))
              )}
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VideoDetail;