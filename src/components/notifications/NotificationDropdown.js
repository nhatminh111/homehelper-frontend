import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import './NotificationDropdown.css';

const NotificationDropdown = ({
  notifications,
  unreadCount,
  loading,
  onNotificationClick,
  onMarkAllAsRead,
  onDeleteNotification,
  onRefresh,
  getNotificationIcon,
  getNotificationColor
}) => {
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.is_read;
      case 'read':
        return notification.is_read;
      default:
        return true;
    }
  });

  // Format notification time
  const formatNotificationTime = (dateString) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: vi 
    });
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    onNotificationClick(notification);
  };

  // Handle delete confirmation
  const handleDeleteClick = (notificationId, event) => {
    event.stopPropagation();
    setShowDeleteConfirm(notificationId);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (notificationId) => {
    onDeleteNotification(notificationId);
    setShowDeleteConfirm(null);
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  // Get notification preview text
  const getNotificationPreview = (notification) => {
    if (notification.content) {
      return notification.content.length > 100 
        ? notification.content.substring(0, 100) + '...'
        : notification.content;
    }
    return 'Thông báo mới';
  };

  return (
    <div className="notification-dropdown">
      {/* Header */}
      <div className="dropdown-header">
        <div className="header-title">
          <h6>Thông báo</h6>
          {unreadCount > 0 && (
            <span className="unread-count">{unreadCount} chưa đọc</span>
          )}
        </div>
        <div className="header-actions">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onRefresh}
            disabled={loading}
            title="Làm mới"
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
          </button>
          {unreadCount > 0 && (
            <button
              className="btn btn-sm btn-primary"
              onClick={onMarkAllAsRead}
              title="Đánh dấu tất cả đã đọc"
            >
              <i className="fas fa-check-double"></i>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả
        </button>
        <button
          className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Chưa đọc
          {unreadCount > 0 && (
            <span className="filter-badge">{unreadCount}</span>
          )}
        </button>
        <button
          className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          Đã đọc
        </button>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {loading && notifications.length === 0 ? (
          <div className="loading-state">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span>Đang tải thông báo...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-bell-slash fa-2x text-muted mb-2"></i>
            <p className="text-muted">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' :
               filter === 'read' ? 'Không có thông báo đã đọc' :
               'Chưa có thông báo nào'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.notification_id}
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              {/* Notification Icon */}
              <div 
                className="notification-icon"
                style={{ color: getNotificationColor(notification.type) }}
              >
                <i className={getNotificationIcon(notification.type)}></i>
              </div>

              {/* Notification Content */}
              <div className="notification-content">
                <div className="notification-title">
                  {notification.title || 'Thông báo mới'}
                </div>
                <div className="notification-preview">
                  {getNotificationPreview(notification)}
                  {notification.data && (() => {
                    try {
                      const parsed = typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data;
                      if (parsed && parsed.conversation_id) {
                        return (
                          <span className="notification-link"> · Nhấn để mở cuộc trò chuyện</span>
                        );
                      }
                    } catch (_) {}
                    return null;
                  })()}
                </div>
                <div className="notification-time">
                  {formatNotificationTime(notification.created_at)}
                </div>
              </div>

              {/* Notification Actions */}
              <div className="notification-actions">
                {!notification.is_read && (
                  <div className="unread-indicator"></div>
                )}
                <button
                  className="action-btn"
                  onClick={(e) => handleDeleteClick(notification.notification_id, e)}
                  title="Xóa thông báo"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* Delete Confirmation */}
              {showDeleteConfirm === notification.notification_id && (
                <div className="delete-confirmation">
                  <div className="confirmation-content">
                    <p>Xóa thông báo này?</p>
                    <div className="confirmation-actions">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConfirm(notification.notification_id);
                        }}
                      >
                        Xóa
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCancel();
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="dropdown-footer">
          <button className="btn btn-link btn-sm">
            Xem tất cả thông báo
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
