import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import blogService from '../services/blogService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCalendar, faComment, faHeart, faUser } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../components/blog/Pagination';

const MyBlogs = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchData = async () => {
    if (!user?.user_id) return;
    try {
      setLoading(true);
      setError(null);
      const status = statusFilter === 'all' ? '' : statusFilter;
      const res = await blogService.getUserPosts(user.user_id, { page, limit, sortBy: 'post_date', sortOrder: 'DESC', status });
      if (res?.success) {
        setPosts(res.data || []);
        setTotal(res.pagination?.totalItems || 0);
      } else {
        setError(res?.message || 'Không thể tải danh sách bài viết.');
      }
    } catch (err) {
      setError(err?.message || 'Đã xảy ra lỗi khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.user_id, page, limit, statusFilter]);

  const getStatusInfo = (statusRaw) => {
    const s = (statusRaw || '').toString().trim().toLowerCase();
    if (s === 'approved' || s.includes('phê duyệt')) {
      return { text: 'Approved', badge: 'badge-success' };
    }
    if (s === 'pending' || s.includes('chờ') || s.includes('cho')) {
      return { text: 'Pending', badge: 'badge-warning' };
    }
    if (s === 'rejected' || s.includes('từ chối') || s.includes('tu choi')) {
      return { text: 'Rejected', badge: 'badge-danger' };
    }
    return { text: statusRaw || 'Unknown', badge: 'badge-secondary' };
  };

  return (
    <section className="ftco-section bg-light">
      <div className="container">
        <div className="row justify-content-center mb-5 pb-3">
          <div className="col-md-7 heading-section text-center">
            <h2 className="mb-4">Bài viết của tôi</h2>
          </div>
        </div>

        <div className="mb-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <button className="btn btn-outline-secondary mr-2" disabled>
              Tổng: {total}
            </button>
            <select className="form-control d-inline-block mr-2" style={{ width: 110 }} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <select
              className="form-control d-inline-block"
              style={{ width: 160 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <Link to="/blog/create" className="btn btn-primary">Tạo bài viết</Link>
        </div>

        {loading && <div className="text-center">Đang tải...</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && posts.length === 0 && (
          <div className="alert alert-info">Bạn chưa có bài viết nào.</div>
        )}

        <div className="row">
          {posts.map((post) => {
            const photos = Array.isArray(post.photo_urls) ? post.photo_urls : [];
            const imageUrl = photos.length > 0 ? post.photo_urls[0] : '/images/bg_1.jpg';
            const { text: statusText, badge: badgeClass } = getStatusInfo(post.status);
            const dateText = post.post_date ? new Date(post.post_date).toLocaleDateString() : '';
            const preview = (post.content || '').replace(/<[^>]+>/g, '').slice(0, 220);
            return (
              <div className="col-12 mb-3" key={post.post_id}>
                <div className="card shadow-sm">
                  <div className="row no-gutters">
                    <div className="col-md-4">
                      <Link to={`/blog/${post.post_id}`} className="d-block h-100 w-100">
                        <img src={imageUrl} alt={post.title} className="w-100 h-100" style={{ objectFit: 'cover', minHeight: 180 }} />
                      </Link>
                    </div>
                    <div className="col-md-8">
                      <div className="card-body d-flex flex-column h-100">
                        <div className="d-flex justify-content-between align-items-start">
                          <h5 className="card-title mb-2" style={{ maxWidth: '75%' }}>
                            <Link to={`/blog/${post.post_id}`}>{post.title}</Link>
                          </h5>
                          <div className="d-flex align-items-center">
                            <span className={`badge ${badgeClass} mr-2`}>{statusText}</span>
                            <button className="btn btn-sm btn-outline-secondary mr-2" title="Edit (coming soon)" disabled>
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button className="btn btn-sm btn-outline-danger" title="Delete (coming soon)" disabled>
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>

                        <p className="card-text text-muted small mb-2">
                          <span className="mr-3"><span className="icon-calendar"><FontAwesomeIcon icon={faCalendar} /></span> {dateText}</span>
                          <span className="mr-3"><span className="icon-person"><FontAwesomeIcon icon={faUser} /></span> {post.author_name || 'Bạn'}</span>
                        </p>

                        <p className="card-text" style={{ overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3 }}>
                          {preview}
                        </p>

                        <div className="d-flex align-items-center mt-auto">
                          <p className="mb-0">
                            <Link to={`/blog/${post.post_id}`} className="btn btn-secondary btn-sm">
                              Xem chi tiết <span className="ion-ios-arrow-round-forward"></span>
                            </Link>
                            { !post.related_booking_id && (
                              <Link to={`/blog/${post.post_id}/quotes`} className="btn btn-outline-primary btn-sm ml-2">
                                Xem Yêu Cầu
                              </Link>
                            )}
                          </p>
                          <p className="ml-auto mb-0">
                            <span className="mr-3"><span className="icon-heart"><FontAwesomeIcon icon={faHeart} /></span> {post.likes || 0}</span>
                            <span className="mr-3"><span className="icon-chat"><FontAwesomeIcon icon={faComment} /></span> {post.comments_count || 0}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="row mt-4">
            <div className="col">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
                size="default"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MyBlogs;