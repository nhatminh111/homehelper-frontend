import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faInstagram, faDribbble } from '@fortawesome/free-brands-svg-icons';
import { faBars, faUser as faUserSolid, faSearch as faSearchSolid, faBell, faCog } from '@fortawesome/free-solid-svg-icons';

const Header = () => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <>
      {/* Top Bar */}
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
                  <a href="#" className="d-flex align-items-center justify-content-center">
                    <FontAwesomeIcon icon={faFacebook} />
                    <i className="sr-only">Facebook</i>
                  </a>
                  <a href="#" className="d-flex align-items-center justify-content-center">
                    <FontAwesomeIcon icon={faTwitter} />
                    <i className="sr-only">Twitter</i>
                  </a>
                  <a href="#" className="d-flex align-items-center justify-content-center">
                    <FontAwesomeIcon icon={faInstagram} />
                    <i className="sr-only">Instagram</i>
                  </a>
                  <a href="#" className="d-flex align-items-center justify-content-center">
                    <FontAwesomeIcon icon={faDribbble} />
                    <i className="sr-only">Dribbble</i>
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark ftco_navbar bg-dark ftco-navbar-light" id="ftco-navbar">
        <div className="container">
          <Link className="navbar-brand" to="/">
            Cleaning<span>company</span>
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
          <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="ftco-nav">
            <ul className="navbar-nav ml-auto">
              <li className={`nav-item ${isActive('/')}`}>
                <Link to="/" className="nav-link">Home</Link>
              </li>
              <li className={`nav-item ${isActive('/about')}`}>
                <Link to="/about" className="nav-link">About</Link>
              </li>
              <li className={`nav-item ${isActive('/services')}`}>
                <Link to="/services" className="nav-link">Services</Link>
              </li>
              <li className={`nav-item ${isActive('/tasker-search')}`}>
                <Link to="/tasker-search" className="nav-link">Find Cleaners</Link>
              </li>
              <li className={`nav-item ${isActive('/portfolio')}`}>
                <Link to="/portfolio" className="nav-link">Portfolio</Link>
              </li>
              <li className={`nav-item ${isActive('/pricing')}`}>
                <Link to="/pricing" className="nav-link">Pricing</Link>
              </li>
              <li className={`nav-item ${isActive('/blog')}`}>
                <Link to="/blog" className="nav-link">Blog</Link>
              </li>
              <li className={`nav-item ${isActive('/contact')}`}>
                <Link to="/contact" className="nav-link">Contact</Link>
              </li>
              
              {/* User Menu */}
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
                  Account
                </a>
                <div className={`dropdown-menu ${showUserMenu ? 'show' : ''}`} aria-labelledby="navbarDropdown">
                  <Link className="dropdown-item" to="/dashboard">
                    <FontAwesomeIcon icon={faCog} className="mr-2" />
                    Dashboard
                  </Link>
                  <Link className="dropdown-item" to="/tasker">
                    <FontAwesomeIcon icon={faCog} className="mr-2" />
                    Tasker Panel
                  </Link>
                  <Link className="dropdown-item" to="/admin">
                    <FontAwesomeIcon icon={faCog} className="mr-2" />
                    Admin Panel
                  </Link>
                  <div className="dropdown-divider"></div>
                  <Link className="dropdown-item" to="/account">
                    <FontAwesomeIcon icon={faUserSolid} className="mr-2" />
                    My Profile
                  </Link>
                  <Link className="dropdown-item" to="/tasks">
                    <FontAwesomeIcon icon={faCog} className="mr-2" />
                    My Tasks
                  </Link>
                  <Link className="dropdown-item" to="/payment">
                    <FontAwesomeIcon icon={faCog} className="mr-2" />
                    Payments
                  </Link>
                  <Link className="dropdown-item" to="/ratings">
                    <FontAwesomeIcon icon={faCog} className="mr-2" />
                    Ratings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <a className="dropdown-item" href="#">
                    <FontAwesomeIcon icon={faCog} className="mr-2" />
                    Logout
                  </a>
                </div>
              </li>
              
              {/* Search Icon */}
              <li className="nav-item">
                <Link to="/tasker-search" className="nav-link">
                  <FontAwesomeIcon icon={faSearchSolid} />
                </Link>
              </li>
              
              {/* Notification Icon */}
              <li className="nav-item">
                <a href="#" className="nav-link">
                  <FontAwesomeIcon icon={faBell} />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header; 