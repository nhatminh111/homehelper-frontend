import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList, faCertificate } from "@fortawesome/free-solid-svg-icons";
import "../css/StaffDashboard.css";

const tabs = [
  {
    name: "Đơn Tasker",
    path: "/staff/dashboard/applications",
    icon: faClipboardList,
  },
  {
    name: "Duyệt chứng chỉ",
    path: "/staff/dashboard/certifications",
    icon: faCertificate,
  },
];

export default function StaffDashboard() {
  const location = useLocation();

  return (
    <div className="staff-dashboard-container">
      <aside className="staff-sidebar">
        <h3 className="sidebar-title">Staff Dashboard</h3>
        <nav>
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`sidebar-link${location.pathname.startsWith(tab.path) ? " active" : ""}`}
            >
              <FontAwesomeIcon icon={tab.icon} className="mr-2" />
              {tab.name}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="staff-dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
