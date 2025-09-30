import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faTwitter,
  faInstagram,
  faDribbble,
} from "@fortawesome/free-brands-svg-icons";
import {
  faBars,
  faUser as faUserSolid,
  faSearch as faSearchSolid,
  faBell,
  faCog,
  faSignOutAlt,
  faSignInAlt,
  faUserPlus,
  faWallet,
  faIdCard,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../contexts/AuthContext";
import useWalletBalance from "../hooks/useWalletBalance";
import { formatVND } from "../utils/formatVND";
import NotificationBell from "./notifications/NotificationBell";

const Header = () => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout, isAdmin, isTasker, isStaff } = useAuth();

  const { balance, loading, error, refresh } = useWalletBalance();

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <>
      {/* Thanh trên cùng */}
      <div className="wrap">
        <div className="container">
          <div className="row justify-content-between">
            <div className="col-12 col-md d-flex align-items-center">
              <p className="mb-0 phone">
                <span className="mailus">Phone no:</span>
                <a href="tel:+001234567">+00 1234 567</a> or
                <span className="mailus">email us:</span>
                <a href="mailto:emailsample@email.com">emailsample@email.com</a>
              </p>
            </div>
            <div className="col-12 col-md d-flex justify-content-md-end">
              <div className="social-media">
                <p className="mb-0 d-flex">
                  <a
                    href="#"
                    className="d-flex align-items-center justify-content-center"
                  >
                    <FontAwesomeIcon icon={faFacebook} />
                    <i className="sr-only">Facebook</i>
                  </a>
                  <a
                    href="#"
                    className="d-flex align-items-center justify-content-center"
                  >
                    <FontAwesomeIcon icon={faTwitter} />
                    <i className="sr-only">Twitter</i>
                  </a>
                  <a
                    href="#"
                    className="d-flex align-items-center justify-content-center"
                  >
                    <FontAwesomeIcon icon={faInstagram} />
                    <i className="sr-only">Instagram</i>
                  </a>
                  <a
                    href="#"
                    className="d-flex align-items-center justify-content-center"
                  >
                    <FontAwesomeIcon icon={faDribbble} />
                    <i className="sr-only">Dribbble</i>
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Điều hướng */}
      <nav className="navbar navbar-expand-lg navbar-dark ftco_navbar bg-dark ftco-navbar-light" id="ftco-navbar">
        <div className="container">
          <Link className="navbar-brand" to="/">
            Home<span>Helper</span>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#ftco-nav"
            aria-controls="ftco-nav"
            aria-expanded={!isNavCollapsed}
            aria-label="Toggle navigation"
            onClick={handleNavCollapse}
          >
            <FontAwesomeIcon icon={faBars} /> Menu
          </button>
          <div
            className={`${isNavCollapsed ? "collapse" : ""} navbar-collapse`}
            id="ftco-nav"
          >
            <ul className="navbar-nav ml-auto">
              <li className={`nav-item ${isActive('/')}`}>
                <Link to="/" className="nav-link">Trang chủ</Link>
              </li>
              <li className={`nav-item ${isActive('/about')}`}>
                <Link to="/about" className="nav-link">Giới thiệu</Link>
              </li>
              <li className={`nav-item ${isActive('/services')}`}>
                <Link to="/services" className="nav-link">Dịch vụ</Link>
              </li>
              <li className={`nav-item ${isActive('/portfolio')}`}>
                <Link to="/portfolio" className="nav-link">Dự án</Link>
              </li>
              <li className={`nav-item ${isActive("/blog")}`}>
                <Link to="/blog" className="nav-link">
                  Blog
                </Link>
              </li>
              <li className={`nav-item ${isActive('/contact')}`}>
                <Link to="/contact" className="nav-link">Liên hệ</Link>
              </li>
              <li className={`nav-item ${isActive("/chat")}`}>
                <Link to="/chat" className="nav-link">
                  Chat
                </Link>
              </li>
              <li className={`nav-item ${isActive("/cccd")}`}>
                <Link to="/cccd" className="nav-link">
                  <FontAwesomeIcon icon={faIdCard} className="mr-1" /> CCCD
                </Link>
              </li>

              {/* Auth Menu */}
              {isAuthenticated() ? (
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="navbarDropdown"
                    role="button"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowUserMenu(!showUserMenu);
                    }}
                  >
                    <FontAwesomeIcon icon={faUserSolid} className="mr-2" />
                    {user?.name || 'Tài khoản'}
                  </a>
                  <div
                    className={`dropdown-menu ${showUserMenu ? "show" : ""}`}
                    aria-labelledby="navbarDropdown"
                  >
                    <div className="dropdown-header">
                      <strong>{user?.name}</strong>
                      <small className="text-muted d-block">
                        {user?.email}
                      </small>
                      <span className="badge badge-primary">{user?.role}</span>

                      {/* 👉 dòng số dư ví */}
                      <div
                        className="mt-2 p-2 border rounded bg-light d-flex justify-content-between align-items-center"
                        style={{ cursor: "pointer" }}
                        onClick={refresh}
                      >
                        <span>Số dư ví:</span>
                        <strong style={{ color: "#16a34a" }}>
                          {error ? "Lỗi" : loading ? "..." : formatVND(balance)}
                        </strong>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>

                    <Link className="dropdown-item" to="/dashboard">
                      <FontAwesomeIcon icon={faCog} className="mr-2" />
                      Bảng điều khiển
                    </Link>
                    <Link className="dropdown-item" to="/my-blogs">
                      <FontAwesomeIcon icon={faCog} className="mr-2" />
                      Blog của tôi
                    </Link>

                    {isTasker() && (
                      <Link className="dropdown-item" to="/tasker">
                        <FontAwesomeIcon icon={faCog} className="mr-2" />
                        Bảng điều khiển Tasker
                      </Link>
                    )}

                    {isAdmin() && (
                      <Link className="dropdown-item" to="/admin">
                        <FontAwesomeIcon icon={faCog} className="mr-2" />
                        Khu vực quản trị
                      </Link>
                    )}
                    {(isStaff() || isAdmin()) && (
                      <Link className="dropdown-item" to="/tasker-approvals">
                        <FontAwesomeIcon icon={faCog} className="mr-2" />
                        Approve Taskers
                      </Link>
                    )}

                    <div className="dropdown-divider"></div>
                    {/* 👉 thêm mục Wallet */}
                    <Link className="dropdown-item" to="/wallet">
                      <FontAwesomeIcon icon={faWallet} className="mr-2" />
                      Ví tiền
                    </Link>
                    <Link className="dropdown-item" to="/account">
                      <FontAwesomeIcon icon={faUserSolid} className="mr-2" />
                      Hồ sơ của tôi
                    </Link>
                    <Link className="dropdown-item" to="/tasks">
                      <FontAwesomeIcon icon={faCog} className="mr-2" />
                      Công việc của tôi
                    </Link>
                    <Link className="dropdown-item" to="/payment">
                      <FontAwesomeIcon icon={faCog} className="mr-2" />
                      Thanh toán
                    </Link>
                    <Link className="dropdown-item" to="/ratings">
                      <FontAwesomeIcon icon={faCog} className="mr-2" />
                      Đánh giá
                    </Link>
                    <Link className="dropdown-item" to="/wishlists">
                      <FontAwesomeIcon icon={faHeart} className="mr-2" />
                      Yêu thích
                    </Link>

                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                                              Đăng xuất
                      </button>
                  </div>
                </li>
              ) : (
                <>
                  <li className="nav-item">
                    <Link to="/login" className="nav-link">
                      <FontAwesomeIcon icon={faSignInAlt} className="mr-1" />
                      Đăng nhập
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/register" className="nav-link">
                      <FontAwesomeIcon icon={faUserPlus} className="mr-1" />
                      Đăng ký
                    </Link>
                  </li>
                </>
              )}

              {/* Search Icon */}
              <li className="nav-item">
                <Link to="/tasker-search" className="nav-link">
                  <FontAwesomeIcon icon={faSearchSolid} />
                </Link>
              </li>

              {/* Notification Bell */}
              <li className="nav-item d-flex align-items-center">
                <NotificationBell />
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
