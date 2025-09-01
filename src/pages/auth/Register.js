import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faUser, 
  faEye, 
  faEyeSlash, 
  faLock,
  faPlus,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faFacebook, faTwitter, faInstagram, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, error, setError, isAuthenticated } = useAuth();
  
  const [userType, setUserType] = useState('user'); // 'user' or 'tasker'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error khi user bắt đầu nhập
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    try {
      const userData = {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: userType === 'tasker' ? 'Tasker' : 'Customer',
        phone: '' // Có thể thêm field phone sau
      };

      await register(userData);
      // Register thành công sẽ được redirect trong useEffect
    } catch (error) {
      console.error('Register error:', error);
      // Error đã được set trong AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container ${userType === 'tasker' ? 'yellow-theme' : ''}`}>
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

        {/* User Type Selector */}
        <div className="user-type-selector">
          <button 
            className={`type-option ${userType === 'user' ? 'active' : ''}`}
            onClick={() => setUserType('user')}
          >
            <FontAwesomeIcon icon={faUser} />
            <span>Người dùng</span>
          </button>
          <button 
            className={`type-option ${userType === 'tasker' ? 'active' : ''}`}
            onClick={() => setUserType('tasker')}
          >
            <FontAwesomeIcon icon={faStar} />
            <span>Người giúp việc</span>
          </button>
        </div>

        {/* Registration Form */}
        <div className="auth-card">
          <h2 className="auth-title">Đăng ký</h2>
          <p className="auth-subtitle">
            {userType === 'user' ? 'Tạo tài khoản mới' : 'Tạo tài khoản người giúp việc mới'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                name="email"
                placeholder="Email hoặc số điện thoại"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="fullName"
                placeholder="Họ và tên"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
              <FontAwesomeIcon icon={faUser} className="input-icon" />
            </div>

            <div className="form-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Mật khẩu"
                value={formData.password}
                onChange={handleInputChange}
                required
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
                placeholder="Xác nhận mật khẩu"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              <FontAwesomeIcon 
                icon={faLock} 
                className="input-icon"
              />
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            <button type="submit" className="auth-button primary" disabled={loading}>
              {loading ? (
                <>
                  <span>Đang đăng ký...</span>
                  <div className="spinner-border spinner-border-sm ms-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Đăng ký</span>
                </>
              )}
            </button>
          </form>

          {/* Social Login */}
          <div className="social-separator">
            <span>Hoặc tiếp tục với</span>
          </div>

          <div className="social-buttons">
            <button className="social-button google">
              <FontAwesomeIcon icon={faGoogle} />
              <span>Tiếp tục với Google</span>
            </button>
            <button className="social-button facebook">
              <FontAwesomeIcon icon={faFacebook} />
              <span>Tiếp tục với Facebook</span>
            </button>
          </div>

          {/* Login Link */}
          <div className="auth-link">
            <span>Đã có tài khoản? </span>
            <Link to="/login" className="link-text">Đăng nhập ngay</Link>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p className="terms-text">
            Bằng cách tiếp tục, bạn đồng ý với{' '}
            <a href="#" className="link-text">Điều khoản dịch vụ</a> và{' '}
            <a href="#" className="link-text">Chính sách bảo mật</a>
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

export default Register;
