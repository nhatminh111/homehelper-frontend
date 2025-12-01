import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';
import './NotificationBell.css';

const NotificationBell = ({ className = '' }) => {
  const {
    unreadCount,
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotifications();
  const navigate = useNavigate();

  const [showDropdown, setShowDropdown] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle bell click
  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    
    // Animate bell
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await markAsRead(notification.notification_id);
      }
      
      // Navigate to conversation if data contains conversation_id
      try {
        const data = typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data;
        if (data && data.conversation_id) {
          navigate(`/chat?conversationId=${data.conversation_id}`);
        } else if (notification.target_url) {
          navigate(notification.target_url);
        }
      } catch (_) {
        if (notification.target_url) {
          navigate(notification.target_url);
        }
      }
      
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return 'fas fa-comment';
      case 'booking':
        return 'fas fa-calendar-check';
      case 'payment':
        return 'fas fa-credit-card';
      case 'rating':
        return 'fas fa-star';
      case 'task':
        return 'fas fa-tasks';
      case 'system':
        return 'fas fa-cog';
      default:
        return 'fas fa-bell';
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'message':
        return '#007bff';
      case 'booking':
        return '#28a745';
      case 'payment':
        return '#ffc107';
      case 'rating':
        return '#fd7e14';
      case 'task':
        return '#6f42c1';
      case 'system':
        return '#6c757d';
      default:
        return '#007bff';
    }
  };

  return (
    <div className={`notification-bell ${className}`}>
      {/* Bell Button */}
      <button
        ref={bellRef}
        className={`bell-button ${isAnimating ? 'animating' : ''} ${showDropdown ? 'active' : ''}`}
        onClick={handleBellClick}
        title="Thông báo"
        aria-label={`Thông báo ${unreadCount > 0 ? `(${unreadCount} chưa đọc)` : ''}`}
      >
        <i className="fas fa-bell"></i>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="unread-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div ref={dropdownRef} className="notification-dropdown-container">
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            onNotificationClick={handleNotificationClick}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDeleteNotification={handleDeleteNotification}
            onRefresh={handleRefresh}
            getNotificationIcon={getNotificationIcon}
            getNotificationColor={getNotificationColor}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;