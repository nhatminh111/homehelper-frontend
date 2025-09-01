import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faSignInAlt, faUserPlus, faKey } from '@fortawesome/free-solid-svg-icons';
import './Auth.css';

const AuthDemo = () => {
  return (
    <div className="auth-container">
      <div className="auth-background">
        {/* Background decorative shapes */}
        <div className="bg-shape bg-circle-1"></div>
        <div className="bg-shape bg-circle-2"></div>
        <div className="bg-shape bg-diamond-1"></div>
        <div className="bg-shape bg-diamond-2"></div>
      </div>

      <div className="auth-content">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon">
            <div className="house-icon">
              <span>H</span>
            </div>
          </div>
          <h1 className="logo-text">HomeHelper</h1>
        </div>

        {/* Demo Navigation */}
        <div className="auth-card">
          <h2 className="auth-title">Authentication Demo</h2>
          <p className="auth-subtitle">
            Choose an authentication page to view
          </p>

          <div className="demo-navigation">
            <Link to="/register" className="demo-link">
              <FontAwesomeIcon icon={faUserPlus} />
              <div>
                <h3>Register</h3>
                <p>User & Tasker registration with role selection</p>
              </div>
            </Link>

            <Link to="/login" className="demo-link">
              <FontAwesomeIcon icon={faSignInAlt} />
              <div>
                <h3>Login</h3>
                <p>Sign in with email and password</p>
              </div>
            </Link>

            <Link to="/forgot-password" className="demo-link">
              <FontAwesomeIcon icon={faKey} />
              <div>
                <h3>Forgot Password</h3>
                <p>Password recovery flow</p>
              </div>
            </Link>

            <Link to="/reset-password" className="demo-link">
              <FontAwesomeIcon icon={faKey} />
              <div>
                <h3>Reset Password</h3>
                <p>Set new password with token</p>
              </div>
            </Link>
          </div>

          <div className="auth-link">
            <Link to="/" className="back-link">
              <FontAwesomeIcon icon={faHome} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p className="terms-text">
            This is a demo of the HomeHelper authentication system
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthDemo;
