import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { NavLink, Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge,
  faUsers,
  faRightFromBracket,
  faIdBadge,
  faCogs,
  faExclamationTriangle,
  faClipboardList,
  faCheckDouble,
  faHistory,
  faStar,
  faTags,
  faWallet
} from '@fortawesome/free-solid-svg-icons';
import '../../css/AdminLayout.css';

// Simple Admin layout with a left sidebar and main content area
export default function AdminLayout() {
  const { logout, user } = useAuth();
  const linkClass = ({ isActive }) =>
    'list-group-item list-group-item-action d-flex align-items-center gap-3 ' +
    (isActive ? 'active' : '');

  return (
    <div className="admin-layout">
      <div className="row min-vh-100 g-0">
        <aside className="col-12 col-md-3 col-lg-2 p-0 border-end admin-sidebar d-flex flex-column justify-content-between">
          <div>
            <div className="p-4 border-bottom mb-2">
              <h5 className="mb-0 text-white">HomeHelper</h5>
              <small className="text-muted">Quản trị hệ thống</small>
            </div>
            <nav className="list-group list-group-flush rounded-0 px-2">
              <NavLink end to="/admin" className={linkClass}>
                <FontAwesomeIcon icon={faGauge} className="nav-icon" />
                <span>Tổng quan</span>
              </NavLink>
              <NavLink to="/admin/system" className={linkClass}>
                <FontAwesomeIcon icon={faHistory} className="nav-icon" />
                <span>Chi tiết thu nhập</span>
              </NavLink>

              <div className="nav-section-label mt-3 mb-1 px-3 small text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Người dùng</div>
              <NavLink to="/admin/users" className={linkClass}>
                <FontAwesomeIcon icon={faUsers} className="nav-icon" />
                <span>Khách hàng</span>
              </NavLink>
              <NavLink to="/admin/taskers" className={linkClass}>
                <FontAwesomeIcon icon={faIdBadge} className="nav-icon" />
                <span>Cộng tác viên</span>
              </NavLink>

              <div className="nav-section-label mt-3 mb-1 px-3 small text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Dịch vụ & Công việc</div>
              <NavLink to="/admin/service-management" className={linkClass}>
                <FontAwesomeIcon icon={faCogs} className="nav-icon" />
                <span>Mảng dịch vụ</span>
              </NavLink>
              <NavLink to="/admin/bookings" className={linkClass}>
                <FontAwesomeIcon icon={faClipboardList} className="nav-icon" />
                <span>Kiểm soát công việc</span>
              </NavLink>
              <NavLink to="/admin/evidence-review" className={linkClass}>
                <FontAwesomeIcon icon={faCheckDouble} className="nav-icon" />
                <span>Duyệt bằng chứng</span>
              </NavLink>

              <div className="nav-section-label mt-3 mb-1 px-3 small text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Hệ thống & Chất lượng</div>
              <NavLink to="/ratings" className={linkClass}>
                <FontAwesomeIcon icon={faStar} className="nav-icon" />
                <span>Đánh giá & Khiếu nại</span>
              </NavLink>
              <NavLink to="/admin/reports" className={linkClass}>
                <FontAwesomeIcon icon={faExclamationTriangle} className="nav-icon" />
                <span>Báo cáo sự cố</span>
              </NavLink>
              <NavLink to="/admin/withdrawals" className={linkClass}>
                <FontAwesomeIcon icon={faWallet} className="nav-icon" />
                <span>Quản lý rút tiền</span>
              </NavLink>

            </nav>
          </div>
          <div className="p-3 border-top mt-4">
            <div className="d-flex flex-column align-items-start gap-3">
              <div className="user-profile-sm d-flex align-items-center gap-2">
                <div className="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="user-info-sm overflow-hidden" style={{ maxWidth: '120px' }}>
                  <div className="text-white small text-truncate">{user?.name || user?.email}</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>Quản trị viên</div>
                </div>
              </div>
              <button className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2" style={{ borderRadius: '8px', borderWidth: '1px' }} onClick={logout}>
                <FontAwesomeIcon icon={faRightFromBracket} />
                <span className="fw-semibold">Đăng xuất</span>
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
