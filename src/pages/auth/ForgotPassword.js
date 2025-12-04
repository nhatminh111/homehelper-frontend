import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faArrowLeft,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faTwitter, faInstagram, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import './Auth.css';

const ForgotPassword = () => {
  const { forgotPassword, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      // Error đã được set trong AuthContext
    } finally {
      setLoading(false);
    }
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

        {/* Forgot Password Form */}
        <div className="auth-card">
          <h2 className="auth-title">Forgot Password</h2>
          <p className="auth-subtitle">
            {isSubmitted 
              ? 'Check your email for reset instructions' 
              : 'Enter your email to receive password reset instructions'
            }
          </p>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              <button type="submit" className="auth-button primary" disabled={loading}>
                {loading ? (
                  <>
                    <span>Đang gửi...</span>
                    <div className="spinner-border spinner-border-sm ms-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <FontAwesomeIcon icon={faEnvelope} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="success-message">
              <div className="success-icon">
                <FontAwesomeIcon icon={faCheck} />
              </div>
              <p>Reset link sent successfully!</p>
              <p className="email-sent">We've sent a password reset link to:</p>
              <p className="email-address">{email}</p>
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
            <Link to="/terms-of-service" className="link-text">Terms of Service</Link> and{' '}
            <a href="#" className="link-text">Privacy Policy</a>
          </p>
          
          <div className="social-icons">
            <button className="social-icon btn btn-link">
              <FontAwesomeIcon icon={faFacebook} />
            </button>
            <button className="social-icon btn btn-link">
              <FontAwesomeIcon icon={faTwitter} />
            </button>
            <button className="social-icon btn btn-link">
              <FontAwesomeIcon icon={faInstagram} />
            </button>
            <button className="social-icon btn btn-link">
              <FontAwesomeIcon icon={faLinkedin} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
