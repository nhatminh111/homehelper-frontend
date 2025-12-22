import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import NotificationBell from "../../components/notifications/NotificationBell";
import "../../css/TaskerDashboard.css";
import { useAuth } from "../../contexts/AuthContext";

const TaskerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      logout();
      navigate("/login", { replace: true });
    } catch (e) {
      console.error("Logout failed:", e);
      navigate("/login", { replace: true });
    }
  };
  return (
    <div className="container-fluid">
      <div className="row tasker-dashboard-row">
        <aside className="col-12 col-md-3 col-lg-2 bg-light border-end p-0 tasker-sidebar">
          <div className="tasker-sidebar-content d-flex flex-column p-3">
            <h1 className="mb-3">HomeHelper</h1>
            <nav className="nav flex-column">
              <NavLink end to="" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Overview</NavLink>
              <NavLink to="bookings" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Bookings</NavLink>
              <NavLink to="/user-profile" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Profile</NavLink>
              <NavLink to="videos" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Videos</NavLink>
              <hr />
              <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Chat</NavLink>
              <NavLink to="/video" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Video</NavLink>
              <NavLink to="/blog" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Blog</NavLink>
            </nav>
            <div className="tasker-bottom mt-auto">
              <div className="tasker-user-info" onClick={() => navigate(user ? `/tasker-profile/${user.user_id}` : "/tasker-profile")} title="Xem hồ sơ">
                <img
                  src={(user && user.avatar_url) ? user.avatar_url : "/images/avatar-placeholder.jpg"}
                  alt="Tasker Avatar"
                  className="tasker-avatar"
                />
                <div className="tasker-user-text">
                  <div className="tasker-user-name">{user?.name || "Tasker"}</div>
                  {user?.email && <div className="tasker-user-email">{user.email}</div>}
                </div>
              </div>
              <button className="btn btn-outline-danger w-100 mt-2" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          </div>
        </aside>

        <main className="col-12 col-md-9 col-lg-10 p-4 tasker-main">
          <div className="tasker-bell-floating">
            <NotificationBell />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TaskerDashboard;
