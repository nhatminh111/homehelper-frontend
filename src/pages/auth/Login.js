import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faArrowRight,
  faUser,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import {
  faGoogle,
  faFacebook,
  faTwitter,
  faInstagram,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, error, setError, isAuthenticated } =
    useAuth();

  const [userType, setUserType] = useState("user"); // 'user' or 'tasker'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated()) {
      const from = "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Initialize Google button with popup (disable FedCM/One Tap)
  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!window.google || !clientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (credential) {
            loginWithGoogle(credential).catch((e) => {
              console.error(e);
              setError(e.message || "Đăng nhập Google thất bại");
            });
          }
        },
        ux_mode: "popup",
        auto_select: false,
        use_fedcm_for_prompt: false,
      });

      const container = document.getElementById("google-btn");
      if (container) {
        window.google.accounts.id.renderButton(container, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
        });
      }
    } catch (e) {
      console.error("Google init error:", e);
    }
  }, [loginWithGoogle, setError]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error khi user bắt đầu nhập
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Gọi login từ AuthContext
      const response = await login(formData);

      // Lưu user info + token vào localStorage
      const userData = {
        userId: response.user.user_id, // đảm bảo trùng với backend
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
        token: response.token, // bắt buộc token để gọi API bảo mật
      };
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("role", response.user.role);

      console.log("Login successful, stored user:", userData);

      // Redirect theo role
      const role = response.user.role;
      if (role === "Customer") navigate("/customer", { replace: true });
      else if (role === "Tasker") navigate("/tasker", { replace: true });
      else if (role === "Admin") navigate("/admin", { replace: true });
      else navigate("/", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // One Tap/FedCM removed; using Google-rendered button instead

  return (
    <div
      className={`auth-container ${
        userType === "tasker" ? "yellow-theme" : ""
      }`}
    >
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
        {/* Login Form */}
        <div className="auth-card">
          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">
            {userType === "user" ? "Welcome back!" : "Welcome back, helper!"}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                name="email"
                placeholder="Email or phone number"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
            </div>

            <div className="form-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
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

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-password">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span>Đang đăng nhập...</span>
                  <div
                    className="spinner-border spinner-border-sm ms-2"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <FontAwesomeIcon icon={faArrowRight} />
                </>
              )}
            </button>
          </form>

          {/* Social Login */}
          <div className="social-separator">
            <span>Or continue with</span>
          </div>

          <div className="social-buttons">
            <div id="google-btn" className="social-button google">
              <FontAwesomeIcon icon={faGoogle} />
              <span>Continue with Google</span>
            </div>
            <button className="social-button facebook">
              <FontAwesomeIcon icon={faFacebook} />
              <span>Continue with Facebook</span>
            </button>
          </div>

          {/* Register Link */}
          <div className="auth-link">
            <span>Don't have an account? </span>
            <Link to="/register" className="link-text">
              Sign up now
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p className="terms-text">
            By continuing, you agree to our{" "}
            <a href="#" className="link-text">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="link-text">
              Privacy Policy
            </a>
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

export default Login;
