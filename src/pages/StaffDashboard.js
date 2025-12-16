import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList, faCertificate, faNewspaper, faRightFromBracket, faMedal, faVideo } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from '../contexts/AuthContext';
import '../css/StaffDashboard.css';

const tabs = [
  {
    name: "Đơn Tasker",
    path: "/staff/dashboard/applications",
    icon: faClipboardList,
  },
  {
    name: "Chứng chỉ",
    path: "/staff/dashboard/certifications",
    icon: faCertificate,
  },
  {
    name: "Bài viết",
    path: "/staff/dashboard/blogs",
    icon: faNewspaper,
  },
  {
    name: "Huy hiệu",
    path: "/staff/dashboard/badges",
    icon: faMedal,
  },
  {
    name: "Video",
    path: "/staff/dashboard/videos",
    icon: faVideo, // Need to import faVideo
  },
];

export default function StaffDashboard() {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="staff-dashboard-container">
      <aside className="staff-sidebar">
        <div>
          <nav>
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`sidebar-link${location.pathname.startsWith(tab.path) ? " active" : ""
                  }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="me-2" />
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-3 border-top">
          <div className="d-flex flex-column align-items-start gap-2">
            <div className="staff-user-info">{user?.name || user?.email}</div>
            <button className="btn-logout" onClick={logout}>
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>
      <main className="staff-dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
