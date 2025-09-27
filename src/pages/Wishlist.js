import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faStar } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const API_BASE_URL = "http://localhost:3001/api";

const createHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const Wishlist = () => {
  const { user, token } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [loading, setLoading] = useState(true);

  // Load wishlist
  useEffect(() => {
    if (!user) return;
    console.log("Current user:", user);

    const fetchWishlist = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/wishlists/${user.user_id}`, {
          headers: createHeaders(token),
        });
        const data = await res.json();
        setWishlist(data.taskers || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user, token]);

  // Remove tasker
  const removeTasker = async (taskerId) => {
    if (!window.confirm("Bạn có chắc muốn xóa tasker này khỏi wishlist?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/wishlists/remove`, {
        method: "POST",
        headers: createHeaders(token),
        body: JSON.stringify({ customer_id: user.user_id, taskerId }),
      });
      if (res.ok) {
        setWishlist((prev) => prev.filter((t) => t.tasker_id !== taskerId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Search + sort
  const filtered = wishlist.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.role || "").toLowerCase().includes(search.toLowerCase())
  );
  // .sort((a, b) => {
  //   if (sortBy === "name") return a.name.localeCompare(b.name);
  //   if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
  //   return 0;
  // });

  if (loading) return <div className="container py-5">Loading wishlist...</div>;

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>My Wishlist</h3>
        <span>{filtered.length} items</span>
      </div>

      {/* Search + Sort */}
      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* <div className="col-md-3 ms-auto">
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="rating">Sort by Rating</option>
          </select>
        </div> */}
      </div>

      {/* Wishlist items */}
      <div className="row">
        {filtered.length > 0 ? (
          filtered.map((tasker) => (
            <div key={tasker.tasker_id} className="col-md-4 mb-4">
              <div
                className="card shadow-sm h-100"
                style={{ position: "relative" }}
              >
                {/* Trái tim góc phải trên */}
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    zIndex: 2,
                    background: "transparent", // Đảm bảo không có nền
                    border: "none", // Không viền
                    boxShadow: "none", // Không bóng
                  }}
                >
                  <FontAwesomeIcon
                    icon={faHeart}
                    className="text-danger"
                    style={{
                      cursor: "pointer",
                      fontSize: "2.2rem",
                      background: "transparent", // Đảm bảo icon không có nền
                      boxShadow: "none",
                    }}
                  />
                </div>
                <div className="card-body text-center">
                  <img
                    src={tasker.avatar || "/images/default-avatar.png"}
                    alt={tasker.name}
                    className="rounded-circle mb-3"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                    }}
                  />
                  <h5 className="fw-bold mb-1">{tasker.name}</h5>
                  <p className="text-muted small mb-1">
                    {tasker.role || "Tasker"}
                  </p>
                  <div className="mb-2 text-warning">
                    <FontAwesomeIcon icon={faStar} className="me-1" />
                    {tasker.rating?.toFixed(1) || "0.0"}
                  </div>
                  <p className="text-muted small">{tasker.bio || ""}</p>
                  <div className="d-flex justify-content-center gap-2">
                    <Link
                      to={`/tasker-profile/${tasker.tasker_id}`}
                      className="btn btn-primary btn-sm"
                    >
                      View Profile
                    </Link>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeTasker(tasker.tasker_id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center text-muted">
            No items in your wishlist.
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
