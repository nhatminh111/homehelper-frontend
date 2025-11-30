import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { NavLink, Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGauge, faUsers, faRightFromBracket, faIdBadge, faCogs } from '@fortawesome/free-solid-svg-icons';
import '../../css/AdminLayout.css';

// Simple Admin layout with a left sidebar and main content area
export default function AdminLayout() {
  const { logout, user } = useAuth();
  const linkClass = ({ isActive }) =>
    'list-group-item list-group-item-action d-flex align-items-center gap-2 ' +
    (isActive ? 'active' : '');

  return (
    <div className="admin-layout">
      <div className="row min-vh-100 g-0">
        <aside className="col-12 col-md-3 col-lg-2 p-0 border-end admin-sidebar d-flex flex-column justify-content-between">
          <div>
            <div className="p-3 border-bottom">
              <h5 className="mb-0">Admin</h5>
              <small className="text-muted">Control Panel</small>
            </div>
            <nav className="list-group list-group-flush rounded-0">
              <NavLink end to="/admin" className={linkClass}>
                <FontAwesomeIcon icon={faGauge} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/admin/users" className={linkClass}>
                <FontAwesomeIcon icon={faUsers} />
                <span>Users</span>
              </NavLink>
              <NavLink to="/admin/taskers" className={linkClass}>
                <FontAwesomeIcon icon={faIdBadge} />
                <span>Tasker</span>
              </NavLink>
              <NavLink to="/admin/service-management" className={linkClass}>
                <FontAwesomeIcon icon={faCogs} />
                <span>Service Management</span>
              </NavLink>
              <NavLink to="/admin/reports" className={linkClass}>
                <FontAwesomeIcon icon={faCogs} />
                <span>Report Issues</span>
              </NavLink>
            </nav>
          </div>
          <div className="p-3 border-top">
            <div className="d-flex flex-column align-items-start gap-2">
              <div className="text small mb-1">{user?.name || user?.email}</div>
              <button className="btn btn-light btn-sm d-flex align-items-center gap-2 px-2 py-1 border" style={{borderRadius: '6px'}} onClick={logout}>
                <FontAwesomeIcon icon={faRightFromBracket} className="text-danger" />
                <span className="fw-semibold text-danger">Đăng xuất</span>
              </button>
            </div>
          </div>
        </aside>
        <main className="col p-3 p-md-4 admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
