import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { loading, isAuthenticated, isAdmin, isTasker, isCustomer, isStaff } = useAuth();
  const location = useLocation();

  // Hiển thị loading khi đang kiểm tra auth
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Kiểm tra đăng nhập
  if (!isAuthenticated()) {
    // Redirect đến login với return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra role nếu có yêu cầu
  if (requiredRole) {
    let hasRole = false;
    
    switch (requiredRole) {
      case 'Admin':
        hasRole = isAdmin();
        break;
      case 'Tasker':
        hasRole = isTasker() || isAdmin();
        break;
      case 'Customer':
        hasRole = isCustomer() || isAdmin();
        break;
      case 'Staff':
        hasRole = isStaff() || isAdmin();
        break;
      default:
        hasRole = true;
    }

    if (!hasRole) {
      return (
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="alert alert-danger" role="alert">
                <h4 className="alert-heading">Không có quyền truy cập!</h4>
                <p>Bạn không có quyền truy cập trang này.</p>
                <hr />
                <p className="mb-0">
                  <a href="/" className="alert-link">Quay về trang chủ</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;

