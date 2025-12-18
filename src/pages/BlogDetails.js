import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import parse, { domToReact } from "html-react-parser";
import blogService from '../services/blogService';
import { useAuth } from '../contexts/AuthContext';
import '../css/BlogDetails.css';
import CreateQuoteButton from '../components/quotes/CreateQuoteButton';

const BlogDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  // Carousel index for images
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    fetchPostDetails();
  }, [id]);

  const fetchPostDetails = async () => {
    try {
      setLoading(true);

      const [postData, commentsData, servicesData] = await Promise.all([
        blogService.getPostById(id),
        blogService.getPostComments(id),
        blogService.getPostServices(id)
      ]);

      const post = postData.data;
      const comments = commentsData.data || [];
      const services = servicesData.data || [];

      console.log('post:', post);
      console.log('services:', comments);
      console.log('services:', services);

      setPost(post);
      setComments(comments);
      setServices(services);
      setLikesCount(post.likes || 0);

      // Check like status
      if (user) {
        try {
          const isLiked = await blogService.isPostLikedByUser(id, user.user_id);
          setLiked(!!isLiked);
        } catch (err) {
          console.error('Error checking like status:', err);
        }
      }
    } catch (err) {
      setError('Không thể tải chi tiết bài viết');
      console.error('Error fetching post details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    try {
      await blogService.toggleLikePost(id, user.user_id);
      setLiked(!liked);
      setLikesCount(prev => (liked ? prev - 1 : prev + 1));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }

    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await blogService.createComment({
        post_id: parseInt(id),
        user_id: user.user_id,
        content: newComment.trim()
      });

      const newCmt = response.data;
      setComments(prev => [...prev, newCmt]);
      setNewComment('');
    } catch (err) {
      console.error('Error creating comment:', err);
      alert('Không thể gửi bình luận');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Reset carousel index when post or its images change
  useEffect(() => {
    setSlideIndex(0);
  }, [post?.post_id, (post && Array.isArray(post.photo_urls) ? post.photo_urls.length : 0)]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const endsWithZ = /z$/i.test(String(dateString)); // ISO UTC like 2025-09-20T12:07:00Z
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    // If the input is explicitly UTC (ends with 'Z'), format in UTC to avoid +7h shift
    if (endsWithZ) {
      return new Intl.DateTimeFormat('vi-VN', { ...options, timeZone: 'UTC' }).format(date);
    }
    // Otherwise, render with default locale settings
    return new Intl.DateTimeFormat('vi-VN', options).format(date);
  };

  const formatPrice = (price) => {
    if (!price) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Helper: get preview image
  const getPreviewImage = () => {
    if (post && Array.isArray(post.photo_urls) && post.photo_urls.length > 0) {
      return post.photo_urls[0];
    }
    return '/images/bg_1.jpg'; // fallback image
  };

  // Helper: get author avatar
  const getAuthorAvatar = () => {
    if (post && post.author_avatar_url) {
      return post.author_avatar_url;
    }
    return '/images/person_1.jpg';
  };

  if (loading) {
    return (
      <div className="blog-details-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
        <p>Đang tải chi tiết bài viết...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="blog-details-error">
        <div className="error-content">
          <h2>Không tìm thấy bài viết</h2>
          <p>{error || 'Bài viết không tồn tại hoặc đã bị xóa.'}</p>
          <Link to="/blog" className="btn btn-primary">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  // Prepare content parsing helpers
  const hasTag = /<[^>]+>/.test(post.content || '');
  const normalizedContent = hasTag ? post.content : (post.content ? `<p>${post.content}</p>` : '');
  const hasInlineImages = /<img\s/i.test(normalizedContent || '');
  const photos = Array.isArray(post.photo_urls) ? post.photo_urls : [];

  const goPrev = (len) => {
    if (len <= 1) return;
    setSlideIndex((prev) => (prev - 1 + len) % len);
  };
  const goNext = (len) => {
    if (len <= 1) return;
    setSlideIndex((prev) => (prev + 1) % len);
  };

  return (
    <div className="blog-details">
      <div className="container">
        <div className="row">
          <div className="col-lg-8">
            <article className="blog-post">
              {/* Header */}
              <header className="post-header">
                <h1 className="post-title">{post.title}</h1>
                <div className="post-meta">
                  <div className="author-info">
                    <img
                      src={getAuthorAvatar()}
                      alt={post.author_name}
                      className="author-avatar"
                    />
                    <div className="author-details">
                      <span className="author-name">{post.author_name}</span>
                      <span className="post-date">{formatDate(post.post_date)}</span>
                    </div>
                  </div>
                  <div className="post-stats">
                    <span className="stat-item">
                      <i className="fas fa-eye"></i> {post.views || 0}
                    </span>
                    <span className={`stat-item like-count ${liked ? 'liked' : ''}`}>
                      <i className="fas fa-heart"></i> {likesCount}
                    </span>
                    <span className="stat-item">
                      <i className="fas fa-comment"></i> {comments.length}
                    </span>
                  </div>
                </div>
              </header>

              {/* Hero thumbnail (first image) */}
              {photos[0] && (
                <div className="post-hero">
                  <img
                    src={photos[0]}
                    alt="Ảnh minh họa"
                    className="hero-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}

              {/* Content */}
              <div className="post-content">{parse(normalizedContent)}</div>

              {/* Image carousel (only when content has no inline images and there are photos) */}
              {(() => {
                const galleryPhotos = photos.slice(1); // exclude hero thumbnail
                if (hasInlineImages || galleryPhotos.length === 0) return null;
                return (
                  <section className="image-carousel">
                    <div className="carousel">
                      <div className="carousel-viewport">
                        {galleryPhotos.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Slide ${idx + 1}`}
                            className={`carousel-img ${idx === slideIndex ? 'active' : ''}`}
                            loading="lazy"
                            decoding="async"
                          />
                        ))}
                      </div>
                      {galleryPhotos.length > 1 && (
                        <>
                          <button type="button" className="carousel-btn prev" onClick={() => goPrev(galleryPhotos.length)} aria-label="Ảnh trước">
                            ‹
                          </button>
                          <button type="button" className="carousel-btn next" onClick={() => goNext(galleryPhotos.length)} aria-label="Ảnh sau">
                            ›
                          </button>
                          <div className="carousel-dots">
                            {galleryPhotos.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className={`dot ${idx === slideIndex ? 'active' : ''}`}
                                onClick={() => setSlideIndex(idx)}
                                aria-label={`Chuyển đến ảnh ${idx + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </section>
                );
              })()}

              {/* Services */}
              {services.length > 0 && (
                <div className="post-services">
                  <h3>Dịch vụ liên quan</h3>
                  <div className="services-grid">
                    {services.map((service) => (
                      <div key={service.post_service_id} className="service-card improved-service-card">
                        <div className="service-header">
                          <span className="service-main-label">Dịch vụ chính:</span>
                          <span className="service-main improved-service-main">{service.name}</span>
                          {service.variant_name && (
                            <>
                              <span className="service-variant-label">Nhóm:</span>
                              <span className="service-variant1 improved-service-variant">{service.variant_name}</span>
                            </>
                          )}
                        </div>
                        <p className="service-description">{service.description}</p>
                        <div className="service-pricing improved-service-pricing">
                          <div className="price-row">
                            <span className="base-price-label">Khoảng giá:</span>
                            <span className="base-price improved-base-price">
                              {service.price_min != null && service.price_max != null
                                ? `${formatPrice(service.price_min)} - ${formatPrice(service.price_max)}${service.unit ? ` / ${service.unit}` : ''}`
                                : (service.specific_price != null
                                  ? `${formatPrice(service.specific_price)}${service.unit ? ` / ${service.unit}` : ''}`
                                  : '—')}
                            </span>
                          </div>
                          {service.desired_price && (
                            <div className="price-row">
                              <span className="desired-price-label">Giá mong muốn:</span>
                              <span className="desired-price improved-desired-price">{formatPrice(service.desired_price)}</span>
                            </div>
                          )}
                        </div>
                        {service.notes && (
                          <p className="service-notes improved-service-notes">
                            <strong>Ghi chú:</strong> {service.notes}
                          </p>
                        )}
                        {/* Quote CTA inside each service card? If only one service overall, we show a single CTA at bottom-right of the section */}
                      </div>
                    ))}
                  </div>
                  {/* Bottom-right CTA to open modal */}
                  <div className="services-quote-cta">
                    <CreateQuoteButton postId={id} services={services} />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="post-actions">
                <button
                  className={`btn btn-like ${liked ? 'liked' : ''}`}
                  onClick={handleLike}
                >
                  <i className={`fas fa-heart ${liked ? 'fas' : 'far'}`}></i>
                  {liked ? 'Đã thích' : 'Thích'} ({likesCount})
                </button>
                <button
                  className="btn btn-share"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: post.title,
                        text: post.content,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Đã sao chép link bài viết!');
                    }
                  }}
                >
                  <i className="fas fa-share"></i> Chia sẻ
                </button>
              </div>

              {/* Quote button moved into related services section */}
            </article>

            {/* Comments Section */}
            <section className="comments-section">
              <h3>Bình luận ({comments.length})</h3>

              {/* Comment Form */}
              {user ? (
                <form onSubmit={handleSubmitComment} className="comment-form">
                  <div className="form-group">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Viết bình luận của bạn..."
                      rows="4"
                      className="form-control"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingComment}
                  >
                    {submittingComment ? 'Đang gửi...' : 'Gửi bình luận'}
                  </button>
                </form>
              ) : (
                <div className="login-prompt">
                  <p>Vui lòng <Link to="/login">đăng nhập</Link> để bình luận</p>
                </div>
              )}

              {/* Comments List */}
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p className="no-comments">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.comment_id} className="comment-item">
                      <div className="comment-avatar">
                        <img
                          src={comment.author_avatar_url || "/images/person_1.jpg"}
                          alt={comment.author_name}
                        />
                      </div>
                      <div className="comment-content">
                        <div className="comment-header">
                          <span className="comment-author">
                            {comment.author_name || 'Người dùng ẩn danh'}
                          </span>
                          <span className="comment-date">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="comment-text">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="blog-sidebar">
              {/* Author Info */}
              <div className="sidebar-widget">
                <h4>Về tác giả</h4>
                <div className="author-widget">
                  <img
                    src={getAuthorAvatar()}
                    alt={post.author_name}
                    className="author-widget-avatar"
                  />
                  <div className="author-widget-info">
                    <h5>{post.author_name}</h5>
                    <p>{post.author_email}</p>
                  </div>
                </div>
              </div>

              {/* Related Posts */}
              <div className="sidebar-widget">
                <h4>Bài viết liên quan</h4>
                <div className="related-posts">
                  <p>Đang tải bài viết liên quan...</p>
                </div>
              </div>

              {/* Services Summary */}
              {services.length > 0 && (
                <div className="sidebar-widget">
                  <h4>Dịch vụ trong bài viết</h4>
                  <div className="services-summary">
                    {services.map((service) => (
                      <div key={service.post_service_id} className="service-summary">
                        <h6>
                          <span className="service-variant-tag">{service.name}</span>
                        </h6>
                        <span className="service-price">
                          {service.price_min != null && service.price_max != null
                            ? `${formatPrice(service.price_min)} - ${formatPrice(service.price_max)}${service.unit ? ` / ${service.unit}` : ''}`
                            : (service.specific_price != null
                              ? `${formatPrice(service.specific_price)}${service.unit ? ` / ${service.unit}` : ''}`
                              : '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetails;
