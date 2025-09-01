import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kiểm tra token khi component mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await authAPI.getCurrentUser(token);
          setUser(response.user);
        } catch (error) {
          console.error('Token không hợp lệ:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Đăng nhập
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      
      const { user: userData, token: authToken } = response;
      
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Đăng ký
  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      
      const { user: newUser, token: authToken } = response;
      
      setUser(newUser);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Đăng xuất
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setError(null);
  };

  // Đổi password
  const changePassword = async (passwordData) => {
    try {
      setError(null);
      const response = await authAPI.changePassword(passwordData, token);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Quên password
  const forgotPassword = async (email) => {
    try {
      setError(null);
      const response = await authAPI.forgotPassword(email);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (resetData) => {
    try {
      setError(null);
      const response = await authAPI.resetPassword(resetData);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Kiểm tra user có phải admin không
  const isAdmin = () => user?.role === 'Admin';

  // Kiểm tra user có phải tasker không
  const isTasker = () => user?.role === 'Tasker';

  // Kiểm tra user có phải customer không
  const isCustomer = () => user?.role === 'Customer';

  // Kiểm tra user đã đăng nhập chưa
  const isAuthenticated = () => !!user && !!token;

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    isAdmin,
    isTasker,
    isCustomer,
    isAuthenticated,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

