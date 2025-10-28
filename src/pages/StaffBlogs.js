import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export default function StaffBlogs() {
  const { token } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

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
    if (
      !window.confirm(
        `Bạn có chắc muốn ${
          status === "Approved" ? "DUYỆT" : "TỪ CHỐI"
        } bài viết này?`
      )
    )
      return;

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

      alert(`${status === "Approved" ? "Đã duyệt" : "Đã từ chối"} thành công!`);
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      alert("Không thể cập nhật trạng thái bài viết.");
    }
  };

  const deletePost = async (post_id) => {
    if (!window.confirm("Bạn có chắc muốn xoá bài viết này?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/blogs/${post_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlogs((prev) => prev.filter((b) => b.post_id !== post_id));
      alert("Đã xoá bài viết thành công!");
    } catch (err) {
      alert("Không thể xoá bài viết.");
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <div>
      <h2 className="mb-3">Quản lý bài viết</h2>
      {blogs.length === 0 ? (
        <p>Không có bài viết nào.</p>
      ) : (
        <div className="row g-3">
          {blogs.map((blog) => (
            <div key={blog.post_id} className="col-12">
              <div
                className="card shadow-sm border-0"
                style={{ borderRadius: "12px", overflow: "hidden" }}
              >
                <div className="row g-0">
                  {/* Ảnh đại diện */}
                  <div className="col-md-3 bg-light d-flex align-items-center justify-content-center">
                    {(() => {
                      let firstImage = null;
                      try {
                        const imgs = Array.isArray(blog.photo_urls)
                          ? blog.photo_urls
                          : JSON.parse(blog.photo_urls);
                        firstImage = imgs?.[0];
                      } catch {
                        firstImage = blog.photo_urls;
                      }

                      if (!firstImage)
                        return (
                          <div className="text-muted small">Không có ảnh</div>
                        );

                      const imageSrc = firstImage.startsWith("/images/")
                        ? `http://localhost:3001${firstImage}`
                        : firstImage;

                      return (
                        <img
                          src={imageSrc}
                          alt="blog"
                          style={{
                            width: "100%",
                            height: "180px",
                            objectFit: "cover",
                            cursor: "pointer",
                          }}
                          onClick={() => setSelectedPost(blog)}
                        />
                      );
                    })()}
                  </div>

                  {/* Nội dung */}
                  <div className="col-md-9">
                    <div className="card-body d-flex flex-column h-100">
                      <h5 className="card-title mb-1">{blog.title}</h5>
                      <p className="card-text text-muted small mb-2">
                        <strong>Tác giả:</strong>{" "}
                        {blog.author_name || "Ẩn danh"}
                      </p>
                      <p
                        className="card-text small text-truncate mb-2"
                        style={{ maxWidth: "100%" }}
                      >
                        {blog.content || ""}
                      </p>
                      <p className="card-text mb-2">
                        <span
                          className={`badge ${
                            blog.status === "Approved"
                              ? "bg-success"
                              : blog.status === "Rejected"
                              ? "bg-danger"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {blog.status === "Approved"
                            ? "Đã duyệt"
                            : blog.status === "Rejected"
                            ? "Bị từ chối"
                            : "Chờ duyệt"}
                        </span>
                      </p>

                      {/* Nút hành động */}
                      <div className="mt-auto d-flex justify-content-end gap-2">
                        {blog.status === "Pending" && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() =>
                                updateStatus(blog.post_id, "Approved")
                              }
                            >
                              Duyệt
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                updateStatus(blog.post_id, "Rejected")
                              }
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => deletePost(blog.post_id)}
                        >
                          Xoá
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Xem chi tiết bài viết */}
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
