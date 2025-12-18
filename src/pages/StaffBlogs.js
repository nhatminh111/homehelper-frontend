import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../components/common/CustomToast";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export default function StaffBlogs() {
  const { token } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  // Generic confirmation using CustomToast.confirm if available; fallback to window.confirm
  const confirmAction = async (message) => {
    if (showToast && typeof showToast.confirm === "function") {
      return await showToast.confirm(message);
    }
    return window.confirm(message);
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/blogs/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBlogs(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Lỗi khi tải danh sách bài viết:", err);
        setError("Không thể tải danh sách blog.");
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [token]);

  const updateStatus = async (post_id, status) => {
    const confirmed = await confirmAction(
      `Bạn có chắc muốn ${
        status === "Approved" ? "DUYỆT" : "TỪ CHỐI"
      } bài viết này?`
    );
    if (!confirmed) return;

    try {
      const url =
        status === "Approved"
          ? `${API_BASE_URL}/blogs/${post_id}/approve`
          : `${API_BASE_URL}/blogs/${post_id}/reject`;

      await axios.put(
        url,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBlogs((prev) =>
        prev.map((p) => (p.post_id === post_id ? { ...p, status } : p))
      );

      showToast.success(
        `${status === "Approved" ? "Đã duyệt" : "Đã từ chối"} thành công!`
      );
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      showToast.error("Không thể cập nhật trạng thái bài viết.");
    }
  };

  const deletePost = async (post_id) => {
    const confirmed = await confirmAction("Bạn có chắc muốn xoá bài viết này?");
    if (!confirmed) return;
    try {
      await axios.delete(`${API_BASE_URL}/blogs/${post_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlogs((prev) => prev.filter((b) => b.post_id !== post_id));
      showToast.success("Đã xoá bài viết thành công!");
    } catch (err) {
      showToast.error("Không thể xoá bài viết.");
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <div>
      <style>{`
        .staff-blogs-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .staff-blog-card {
          display: flex;
          flex-direction: row;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          background: #fff;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
        }

        .staff-blog-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.1);
        }

        .staff-blog-img {
          width: 35%;
          height: auto;
          max-height: 250px;
          object-fit: cover;
          background: #f8f9fa;
          cursor: pointer;
        }

        .staff-blog-content {
          width: 65%;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .status-badge {
          position: absolute;
          top: 10px;
          right: 12px;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.approved { background: #d1e7dd; color: #0f5132; }
        .status-badge.rejected { background: #f8d7da; color: #842029; }
        .status-badge.pending { background: #fff3cd; color: #664d03; }

        @media (max-width: 768px) {
          .staff-blog-card {
            flex-direction: column;
          }
          .staff-blog-img {
            width: 100%;
            height: 200px;
          }
          .staff-blog-content {
            width: 100%;
            padding: 16px;
          }
        }
      `}</style>

      <h2 className="mb-3">Quản lý bài viết</h2>
      <div className="staff-blogs-container">
        {blogs.length === 0 ? (
          <p>Không có bài viết nào.</p>
        ) : (
          blogs.map((blog) => {
            let firstImage = null;
            try {
              const imgs = Array.isArray(blog.photo_urls)
                ? blog.photo_urls
                : JSON.parse(blog.photo_urls);
              firstImage = imgs?.[0];
            } catch {
              firstImage = blog.photo_urls;
            }

            const imageSrc = firstImage
              ? firstImage.startsWith("/images/")
                ? `http://localhost:3001${firstImage}`
                : firstImage
              : null;

            const statusClass =
              blog.status === "Approved"
                ? "approved"
                : blog.status === "Rejected"
                ? "rejected"
                : "pending";

            const statusText =
              blog.status === "Approved"
                ? "Đã duyệt"
                : blog.status === "Rejected"
                ? "Bị từ chối"
                : "Chờ duyệt";

            return (
              <div key={blog.post_id} className="staff-blog-card">
                <div className={`status-badge ${statusClass}`}>
                  {statusText}
                </div>

                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="blog"
                    className="staff-blog-img"
                    onClick={() => setSelectedPost(blog)}
                  />
                ) : (
                  <div className="staff-blog-img d-flex align-items-center justify-content-center text-muted small">
                    Không có ảnh
                  </div>
                )}

                <div className="staff-blog-content">
                  <div>
                    <h5 className="card-title mb-1">{blog.title}</h5>
                    <p className="card-text text-muted small mb-2">
                      <strong>Tác giả:</strong> {blog.author_name || "Ẩn danh"}
                    </p>
                    <div
                      className="card-text small mb-2"
                      style={{
                        maxWidth: "100%",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                      dangerouslySetInnerHTML={{ __html: blog.content || "" }}
                    ></div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-2">
                    {blog.status === "Pending" && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => updateStatus(blog.post_id, "Approved")}
                        >
                          Duyệt
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => updateStatus(blog.post_id, "Rejected")}
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    {/* <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => deletePost(blog.post_id)}
                    >
                      Xoá 
                    </button> */}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal xem chi tiết */}
      {selectedPost && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center"
          style={{ zIndex: 1050 }}
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white p-4 rounded shadow-lg"
            style={{ width: "80%", maxHeight: "90%", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4>{selectedPost.title}</h4>
            <p className="text-muted">
              <strong>Tác giả:</strong> {selectedPost.author_name}
            </p>
            <p dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
            <button
              className="btn btn-secondary mt-3"
              onClick={() => setSelectedPost(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
