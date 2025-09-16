import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEyeSlash, 
  faLock,
  faCheck,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faFacebook, faTwitter, faInstagram, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import './Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const { resetPassword, setError, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const token = searchParams.get('token');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const email = searchParams.get('email');
    await resetPassword({ email, token, newPassword: formData.password });
    setIsSubmitted(true);
  };

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

        {/* Reset Password Form */}
        <div className="auth-card">
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">
            {isSubmitted 
              ? 'Your password has been reset successfully' 
              : 'Enter your new password below'
            }
          </p>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="New password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength="8"
                />
                <FontAwesomeIcon 
                  icon={showPassword ? faEyeSlash : faEye} 
                  className="input-icon clickable"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>

              <div className="form-group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength="8"
                />
                <FontAwesomeIcon 
                  icon={faLock} 
                  className="input-icon"
                />
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">{error}</div>
              )}
              <button type="submit" className="auth-button primary">
                <span>Reset Password</span>
                <FontAwesomeIcon icon={faLock} />
              </button>
            </form>
          ) : (
            <div className="success-message">
              <div className="success-icon">
                <FontAwesomeIcon icon={faCheck} />
              </div>
              <p>Password reset successfully!</p>
              <p>You can now sign in with your new password.</p>
            </div>
          )}

          {/* Back to Login */}
          <div className="auth-link">
            <Link to="/login" className="back-link">
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p className="terms-text">
            By continuing, you agree to our{' '}
            <a href="#" className="link-text">Terms of Service</a> and{' '}
            <a href="#" className="link-text">Privacy Policy</a>
          </p>
          
          <div className="social-icons">
            <a href="#" className="social-icon">
              <FontAwesomeIcon icon={faFacebook} />
            </a>
            <a href="#" className="social-icon">
              <FontAwesomeIcon icon={faTwitter} />
            </a>
            <a href="#" className="social-icon">
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a href="#" className="social-icon">
              <FontAwesomeIcon icon={faLinkedin} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
