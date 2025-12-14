import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import './NotificationDropdown.css';

const NotificationDropdown = ({
  notifications,
  unreadCount,
  loading,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onRefresh,
  getNotificationIcon,
  getNotificationColor
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [liveNotifications, setLiveNotifications] = useState([]); // realtime pushed items
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Merge prop notifications + realtime ones
  const baseList = [
    ...liveNotifications,
    ...(notifications || [])
  ];
  // Ensure all notifications are defined and have is_read
  const safeNotifications = baseList.filter(n => n && typeof n === 'object').map(n => ({ is_read: false, ...n }));
  // Filter notifications
  const filteredNotifications = safeNotifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.is_read;
      case 'read':
        return notification.is_read;
      default:
        return true;
    }
  });

const formatTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);


    if (isNaN(date.getTime())) {
      return ''; 
    }

    const hasTimeZone = typeof dateString === 'string' && /Z$|[+-]\d{2}:?\d{2}$/.test(dateString);
    if (hasTimeZone) {
      const hh = String(date.getUTCHours()).padStart(2, '0');
      const mm = String(date.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    
    try {
        return format(date, 'HH:mm', { locale: vi });
    } catch (e) {
        return '';
    }
  };

  // Attach realtime socket listeners
  useEffect(() => {
    const socket = window?.socket;
    if (!socket) return;

    const handleNewNotification = (payload) => {
      if (!payload) return;
      // Avoid duplicates based on notification_id
      setLiveNotifications(prev => {
        if (payload.notification_id && (
          prev.some(p => p.notification_id === payload.notification_id) ||
          (notifications || []).some(p => p.notification_id === payload.notification_id)
        )) return prev;
        const wrapped = {
          notification_id: payload.notification_id || `live-${Date.now()}-${Math.random()}`,
            title: payload.title || 'Thông báo mới',
            content: payload.content || '',
            type: payload.type || 'system',
            data: payload.data || null,
            created_at: new Date().toISOString(),
            is_read: false,
            _live: true
        };
        return [wrapped, ...prev].slice(0, 200); // cap to prevent unlimited growth
      });
    };

    const handleSosBroadcast = (payload) => {
      if (!payload) return;
      // Convert broadcast into an ephemeral notification
      setLiveNotifications(prev => {
        const id = `sos-${payload.booking_id}-${payload.customer_id}`;
        if (prev.some(p => p.notification_id === id)) return prev;
        const wrapped = {
          notification_id: id,
          title: 'Yêu cầu SOS mới',
          content: `Khách hàng cần gấp dịch vụ. Đơn #${payload.booking_id}.`,
          type: 'sos',
          data: {
            booking_id: payload.booking_id,
            customer_id: payload.customer_id,
            url: `/tasker/sos/${payload.booking_id}`
          },
          created_at: new Date().toISOString(),
          is_read: false,
          _live: true,
          _ephemeral: true
        };
        return [wrapped, ...prev];
      });
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('sos_created', handleSosBroadcast);

    return () => {
      try { socket.off('new_notification', handleNewNotification); } catch {}
      try { socket.off('sos_created', handleSosBroadcast); } catch {}
    };
  }, [notifications]);

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Prefer deep-link navigation if present
    try {
      const data = typeof notification?.data === 'string'
        ? JSON.parse(notification.data)
        : notification?.data;
      const url = data?.url;
      if (url) {
        // If backend provided absolute URL (with protocol), use full-page navigation
        if (/^https?:\/\//i.test(url)) {
          window.location.assign(url);
        } else {
          // SPA internal route
          navigate(url);
        }
        // Mark read after navigation trigger
        if (notification?.notification_id) {
          if (!notification._ephemeral) {
            if (typeof onMarkAsRead === 'function') {
              onMarkAsRead(notification.notification_id);
            } else if (window?.socket?.emit) {
              try { window.socket.emit('notification_read', { notificationId: notification.notification_id }); } catch {}
            } else {
              // REST fallback
              const token = localStorage.getItem('token') || localStorage.getItem('access_token');
              if (token) {
                try {
                  fetch(`http://localhost:3001/api/notifications/${notification.notification_id}/read`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                } catch {}
              }
            }
          }
          if (typeof onRefresh === 'function') onRefresh();
        }
        return;
      }
    } catch (_) {}
    onNotificationClick(notification);
    // Also mark read for non-deeplink notifications (e.g., message types)
    if (notification?.notification_id) {
      if (!notification._ephemeral) {
        if (typeof onMarkAsRead === 'function') {
          onMarkAsRead(notification.notification_id);
        } else if (window?.socket?.emit) {
          try { window.socket.emit('notification_read', { notificationId: notification.notification_id }); } catch {}
        } else {
          const token = localStorage.getItem('token') || localStorage.getItem('access_token');
          if (token) {
            try {
              fetch(`/api/notifications/${notification.notification_id}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              });
            } catch {}
          }
        }
        if (typeof onRefresh === 'function') onRefresh();
      }
    }
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
  const content = notification.content || '';
  if (typeof content !== 'string') return 'Thông báo mới';

  const types = [
    { prefix: '[NEG_REQ]', label: 'Yêu cầu thương lượng giá với mức giá' },
    { prefix: '[NEG_ACK]', label: 'Đã chấp nhận thương lượng ở mức giá' },
    { prefix: '[NEG_REJ]', label: 'Đã từ chối thương lượng ở mức giá' },
  ];

  for (const { prefix, label } of types) {
    if (content.startsWith(prefix)) {
      let payload = {};
      try {
        payload = JSON.parse(content.substring(prefix.length));
      } catch {}
      const priceText =
        payload.price !== undefined
          ? `${Number(payload.price).toLocaleString()}₫`
          : 'Không xác định';
      return `${label} ${priceText}`;
    }
  }

  if (content.length > 100) return content.substring(0, 100) + '...';
  return content || 'Thông báo mới';
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
          filteredNotifications.map(notification => {
            if (!notification || typeof notification !== 'object' || !notification.notification_id) return null;
            return (
              <div
                key={notification.notification_id}
                className={`notification-item ${!notification.is_read ? 'unread' : ''} ${notification._ephemeral ? 'ephemeral' : ''}`}
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
                        if (parsed?.url) {
                          return (<span className="notification-link"> · Nhấn để mở chi tiết</span>);
                        }
                        if (parsed && parsed.conversation_id) {
                          return (<span className="notification-link"> · Nhấn để mở cuộc trò chuyện</span>);
                        }
                      } catch (_) {}
                      return null;
                    })()}
                  </div>
                  <div className="notification-time">
                    {formatTime(notification.created_at)}
                  </div>
                </div>

                {/* Notification Actions */}
                <div className="notification-actions">
                  {!notification.is_read && !notification._ephemeral && (
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
                {showDeleteConfirm === notification.notification_id && !notification._ephemeral && (
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
            );
          })
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
