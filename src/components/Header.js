import React, { useState, useEffect, useRef } from "react";
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
  faSignOutAlt,
  faSignInAlt,
  faUserPlus,
  faWallet,
  faIdCard,
  faHeart,
  faArrowLeft,
  faCog,
  faHome,
  faInfoCircle,
  faTools,
  faProjectDiagram,
  faNewspaper,
  faEnvelope,
  faComments,
  faTasks,
  faHandshake,
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import useWalletBalance from "../hooks/useWalletBalance";
import { formatVND } from "../utils/formatVND";
import NotificationBell from "./notifications/NotificationBell";
import "../css/Header.css";

const Header = () => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const dropdownRef = useRef(null);

  const location = useLocation();
  const { user, isAuthenticated, logout, isAdmin, isTasker, isStaff } =
    useAuth();
  const { balance, loading, error, refresh } = useWalletBalance();

  // Danh sách các link chính với icon
  const mainLinks = [
    { path: "/", name: "Trang chủ", icon: faHome },
    { path: "/about", name: "Giới thiệu", icon: faInfoCircle },
    { path: "/services", name: "Dịch vụ", icon: faTools },
    { path: "/video", name: "Video", icon: faProjectDiagram },
    { path: "/blog", name: "Blog", icon: faNewspaper },
    { path: "/contact", name: "Liên hệ", icon: faEnvelope },
    { path: "/chat", name: "Chat", icon: faComments },
    { path: "/cccd", name: "CCCD", icon: faIdCard },
    { path: "/tasker-search", name: "Tìm kiếm", icon: faSearchSolid },
  ];

  // Theo dõi kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 992);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Đóng dropdown khi nhấp ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        isDropdownOpen
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Đóng dropdown và sidebar khi thay đổi route
  useEffect(() => {
    setIsDropdownOpen(false);
    setIsSidebarOpen(false);
    setShowUserInfo(false);
  }, [location]);

  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <>


      {/* Navbar Desktop */}
      <nav className="navbar navbar-expand-lg navbar-dark ftco_navbar bg-dark ftco-navbar-light">
        <div className="container">
          <Link className="navbar-brand" to="/">
           <span className="home-text">Home</span><span>Helper</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            style={{
              transform: isSidebarOpen ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            <FontAwesomeIcon icon={faBars} /> Menu
          </button>

          <div
            className={`${isNavCollapsed ? "collapse" : ""} navbar-collapse`}
            id="ftco-nav"
          >
            <ul className="navbar-nav ml-auto">
              {mainLinks.map((link, i) => (
                <li key={i} className={`nav-item ${isActive(link.path)}`}>
                  <Link to={link.path} className="nav-link">
                    <FontAwesomeIcon icon={link.icon} className="mr-1" />
                    {link.name}
                  </Link>
                </li>
              ))}

              {isAuthenticated() ? (
                <li
                  className={`nav-item dropdown ${
                    isDesktop && isDropdownOpen ? "open" : ""
                  }`}
                  ref={dropdownRef}
                >
                  <a
                    href="#"
                    className="nav-link dropdown-toggle"
                    onClick={(e) => {
                      e.preventDefault();
                      if (isDesktop) {
                        setIsDropdownOpen(!isDropdownOpen);
                      } else {
                        setIsSidebarOpen(true);
                        setShowUserInfo(true);
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faUserSolid} className="mr-2" />
                    {user?.name || "Tài khoản"}
                  </a>

                  {/* Dropdown chỉ hiển thị khi ở desktop */}
                  {isDesktop && isDropdownOpen && (
                    <div className="dropdown-menu show" style={{ display: "block" }}>
                      <div className="px-3 py-2 text-right">
                        <strong className="mb-1 d-block">{user?.name}</strong>
                        <small className="text-muted d-block">
                          {user?.email}
                        </small>
                        <span className="badge badge-primary mb-2">
                          {user?.role}
                        </span>

                        <button
                          type="button"
                          onClick={refresh}
                          className="w-100 p-2 bg-white border rounded d-flex justify-content-between align-items-center"
                          style={{ cursor: "pointer" }}
                        >
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon
                              icon={faWallet}
                              className="mr-2 text-success"
                            />
                            <span className="text-dark">Số dư ví</span>
                          </div>
                          <strong className="text-success">
                            {error ? "Lỗi" : loading ? "..." : formatVND(balance)}
                          </strong>
                        </button>
                      </div>

                      <div className="dropdown-divider"></div>

                      <Link className="dropdown-item" to="/dashboard">
                        <FontAwesomeIcon icon={faCog} className="mr-2" />
                        Bảng điều khiển
                      </Link>
                      <Link className="dropdown-item" to="/my-blogs">
                        <FontAwesomeIcon icon={faNewspaper} className="mr-2" />
                        Blog của tôi
                      </Link>

                      {isTasker() && (
                        <Link className="dropdown-item" to="/tasker">
                          <FontAwesomeIcon icon={faTools} className="mr-2" />
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
                          <FontAwesomeIcon icon={faHandshake} className="mr-2" />
                          Approve Taskers
                        </Link>
                      )}

                      <div className="dropdown-divider"></div>

                      <Link className="dropdown-item" to="/wallet">
                        <FontAwesomeIcon icon={faWallet} className="mr-2" />
                        Ví tiền
                      </Link>
                      <Link className="dropdown-item" to="/account">
                        <FontAwesomeIcon icon={faUserSolid} className="mr-2" />
                        Hồ sơ của tôi
                      </Link>
                      <Link className="dropdown-item" to="/tasks">
                        <FontAwesomeIcon icon={faTasks} className="mr-2" />
                        Công việc của tôi
                      </Link>
                      <Link className="dropdown-item" to="/payment">
                        <FontAwesomeIcon icon={faWallet} className="mr-2" />
                        Thanh toán
                      </Link>
                      <Link className="dropdown-item" to="/ratings">
                        <FontAwesomeIcon icon={faHeart} className="mr-2" />
                        Đánh giá
                      </Link>
                      <Link className="dropdown-item" to="/wishlists">
                        <FontAwesomeIcon icon={faHeart} className="mr-2" />
                        Yêu thích
                      </Link>

                      <div className="dropdown-divider"></div>

                      <button
                        className="dropdown-item logout-btn"
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }}
                      >
                        <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </li>
              ) : (
                <>
                  <li className="nav-item">
                    <Link to="/login" className="nav-link">
                      <FontAwesomeIcon icon={faSignInAlt} className="mr-1" />{" "}
                      Đăng nhập
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/register" className="nav-link">
                      <FontAwesomeIcon icon={faUserPlus} className="mr-1" />{" "}
                      Đăng ký
                    </Link>
                  </li>
                </>
              )}

              <li className="nav-item d-flex align-items-center">
                <NotificationBell className="notification-bell-icon" />
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Overlay và Sidebar (Phần Mobile) */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay active"
          onClick={() => {
            setIsSidebarOpen(false);
            setShowUserInfo(false);
          }}
        ></div>
      )}

      {/* Sidebar - Dùng Framer Motion cho animation mobile */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <span
          className="close-btn"
          onClick={() => {
            setIsSidebarOpen(false);
            setShowUserInfo(false);
          }}
        >
          &times;
        </span>

        <AnimatePresence mode="wait">
          {!showUserInfo ? (
            // Menu chính của Sidebar
            <motion.div
              key="menu"
              className="sidebar-content"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {mainLinks.map((link, i) => (
                <Link key={i} to={link.path} onClick={() => setIsSidebarOpen(false)}>
                  <FontAwesomeIcon icon={link.icon} className="mr-2" />
                  {link.name}
                </Link>
              ))}

              {isAuthenticated() ? (
                <div className="user-section mt-3">
                  <button
                    className="user-btn"
                    onClick={() => setShowUserInfo(true)}
                  >
                    <FontAwesomeIcon icon={faUserSolid} className="mr-2" />
                    {user?.name || "Tài khoản"}
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsSidebarOpen(false)}>
                    <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
                    Đăng nhập
                  </Link>
                  <Link to="/register" onClick={() => setIsSidebarOpen(false)}>
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                    Đăng ký
                  </Link>
                </>
              )}
            </motion.div>
          ) : (
            // Thông tin người dùng trong Sidebar
            <motion.div
              key="userinfo"
              className="user-info"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button
                className="back-btn"
                onClick={() => setShowUserInfo(false)}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Quay lại
              </button>

              <h3 className="text-warning mt-3">Thông tin người dùng</h3>
              <ul>
                <li>
                  <strong>Tên:</strong> {user?.name}
                </li>
                <li>
                  <strong>Email:</strong> {user?.email}
                </li>
                <li>
                  <strong>Vai trò:</strong> {user?.role}
                </li>
                <li>
                  <strong>Số dư ví:</strong>{" "}
                  {error ? "Lỗi" : loading ? "..." : formatVND(balance)}
                </li>
              </ul>

              <div className="user-actions mt-3">
                <Link to="/dashboard" onClick={() => setIsSidebarOpen(false)}>
                  <FontAwesomeIcon icon={faCog} className="mr-2" />
                  Bảng điều khiển
                </Link>
                <Link to="/my-blogs" onClick={() => setIsSidebarOpen(false)}>
                  <FontAwesomeIcon icon={faNewspaper} className="mr-2" />
                  Blog của tôi
                </Link>
                {isTasker() && (
                  <Link to="/tasker" onClick={() => setIsSidebarOpen(false)}>
                    <FontAwesomeIcon icon={faTools} className="mr-2" />
                    Bảng điều khiển Tasker
                  </Link>
                )}
                {isAdmin() && (
                  <Link to="/admin" onClick={() => setIsSidebarOpen(false)}>
                    <FontAwesomeIcon icon={faCog} className="mr-2" />
                    Khu vực quản trị
                  </Link>
                )}
                {(isStaff() || isAdmin()) && (
                  <Link
                    to="/tasker-approvals"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <FontAwesomeIcon icon={faHandshake} className="mr-2" />
                    Approve Taskers
                  </Link>
                )}
                <Link to="/wallet" onClick={() => setIsSidebarOpen(false)}>
                  <FontAwesomeIcon icon={faWallet} className="mr-2" />
                  Ví tiền
                </Link>
                <Link to="/account" onClick={() => setIsSidebarOpen(false)}>
                  <FontAwesomeIcon icon={faUserSolid} className="mr-2" />
                  Hồ sơ của tôi
                </Link>
                <Link to="/tasks" onClick={() => setIsSidebarOpen(false)}>
                  <FontAwesomeIcon icon={faTasks} className="mr-2" />
                  Công việc của tôi
                </Link>
                <Link to="/payment" onClick={() => setIsSidebarOpen(false)}>
                  <FontAwesomeIcon icon={faWallet} className="mr-2" />
                  Thanh toán
                </Link>
                <Link to="/ratings" onClick={() => setIsSidebarOpen(false)}>
                  <FontAwesomeIcon icon={faHeart} className="mr-2" />
                  Đánh giá
                </Link>
                <Link to="/wishlists" onClick={() => setIsSidebarOpen(false)}>
                  <FontAwesomeIcon icon={faHeart} className="mr-2" />
                  Yêu thích
                </Link>
                <button
                  className="logout-btn"
                  onClick={() => {
                    logout();
                    setIsSidebarOpen(false);
                    setShowUserInfo(false);
                  }}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                  Đăng xuất
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </>
  );
};

export default Header;