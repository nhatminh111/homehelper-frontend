import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import chatService from '../services/chatService';

export const useNotifications = () => {
  const { 
    unreadCount, 
    updateUnreadCount, 
    markNotificationAsRead: socketMarkAsRead 
  } = useSocket();
  const { user, token, isAuthenticated } = useAuth();

  // State management
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState(null);

  // Load notifications
  const loadNotifications = useCallback(async (page = 1, limit = 20, filters = {}) => {
    try {
      setLoading(true);
      const response = await chatService.getNotifications(page, limit, filters);
      // Ensure all notifications have is_read field
      const safeNotifications = (response.notifications || []).map(n => ({ is_read: false, ...n }));
      if (page === 1) {
        setNotifications(safeNotifications);
      } else {
        setNotifications(prev => [...prev, ...safeNotifications]);
      }
      setHasMore(response.hasMore || false);
      return response;
    } catch (error) {
      if (page === 1) {
        setNotifications([]);
      }
      setHasMore(false);
      setError(null);
      return { notifications: [], hasMore: false, page, limit };
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more notifications (pagination)
  const loadMoreNotifications = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const currentPage = Math.ceil(notifications.length / 20);
    await loadNotifications(currentPage + 1, 20);
  }, [hasMore, loading, notifications.length, loadNotifications]);

  // Load unread notifications
  const loadUnreadNotifications = useCallback(async (limit = 10) => {
    try {
      const response = await chatService.getUnreadNotifications(limit);
      return response.notifications || [];
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await chatService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => prev.map(notif => 
        notif.notification_id === notificationId 
          ? { ...notif, is_read: true, read_at: new Date() }
          : notif
      ));
      
      // Update unread count
      updateUnreadCount(Math.max(0, unreadCount - 1));
      
      // Mark via socket
      socketMarkAsRead(notificationId);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [unreadCount, updateUnreadCount, socketMarkAsRead]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await chatService.markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev => prev.map(notif => ({
        ...notif,
        is_read: true,
        read_at: new Date()
      })));
      
      // Reset unread count
      updateUnreadCount(0);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [updateUnreadCount]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await chatService.deleteNotification(notificationId);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.notification_id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.notification_id !== notificationId));
      
      // Update unread count if notification was unread
      if (deletedNotification && !deletedNotification.is_read) {
        updateUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, [notifications, unreadCount, updateUnreadCount]);

  // Delete all read notifications
  const deleteReadNotifications = useCallback(async () => {
    try {
      await chatService.deleteReadNotifications();
      
      // Update local state
      setNotifications(prev => prev.filter(notif => !notif.is_read));
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Load notification stats
  const loadStats = useCallback(async () => {
    try {
      const response = await chatService.getNotificationStats();
      setStats(response.stats);
      return response.stats;
    } catch (error) {
      // Nếu backend chưa có bảng Notifications, trả về thống kê mặc định để không làm vỡ UI
      const fallback = { total: 0, unread: 0, byType: {} };
      setStats(fallback);
      return fallback;
    }
  }, []);

  // Filter notifications by type
  const getNotificationsByType = useCallback((type) => {
  return notifications.filter(notif => notif && typeof notif.type !== 'undefined' && notif.type === type);
  }, [notifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notif => notif && typeof notif.is_read !== 'undefined' ? !notif.is_read : true);
  }, [notifications]);

  // Get read notifications
  const getReadNotifications = useCallback(() => {
    return notifications.filter(notif => notif && typeof notif.is_read !== 'undefined' ? notif.is_read : false);
  }, [notifications]);

  // Search notifications
  const searchNotifications = useCallback(async (query, page = 1, limit = 20) => {
    try {
      setLoading(true);
      const response = await chatService.notificationService.searchNotifications(query, page, limit);
      
      if (page === 1) {
        setNotifications(response.notifications || []);
      } else {
        setNotifications(prev => [...prev, ...(response.notifications || [])]);
      }
      
      setHasMore(response.hasMore || false);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await loadNotifications(1, 20);
    await loadStats();
  }, [loadNotifications, loadStats]);

  // Reload/clear when auth changes to avoid stale data from previous account
  useEffect(() => {
    const authed = (typeof isAuthenticated === 'function') ? isAuthenticated() : !!(user && token);
    if (authed) {
      // Reset local list first to avoid flashing stale items
      setNotifications([]);
      updateUnreadCount(0);
      // Load for current user
      refreshNotifications();
    } else {
      // Logged out: clear all
      setNotifications([]);
      setHasMore(true);
      setStats(null);
      updateUnreadCount(0);
    }
  }, [user, token]);

  // Socket event handlers
  useEffect(() => {
    const handleNewNotification = (event) => {
      const { notification } = event.detail;
      
      // Add new notification to the beginning of the list
      setNotifications(prev => [notification, ...prev]);
      
      // Update unread count
      updateUnreadCount(prev => prev + 1);
      
      // Show toast notification (you can implement this)
      console.log('New notification:', notification);
    };

    // Add event listener
    window.addEventListener('socket_new_notification', handleNewNotification);

    return () => {
      window.removeEventListener('socket_new_notification', handleNewNotification);
    };
  }, [updateUnreadCount]);

  // Load initial data
  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [loadNotifications, loadStats]);

  // Update unread count from socket context
  useEffect(() => {
    // Sync with socket context unread count
    const currentUnreadCount = getUnreadNotifications().length;
    if (currentUnreadCount !== unreadCount) {
      updateUnreadCount(currentUnreadCount);
    }
  }, [notifications, unreadCount, updateUnreadCount, getUnreadNotifications]);

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    stats,
    
    // Actions
    loadNotifications,
    loadMoreNotifications,
    loadUnreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
    loadStats,
    refreshNotifications,
    searchNotifications,
    
    // Utils
    getNotificationsByType,
    getUnreadNotifications,
    getReadNotifications,
    
    // Computed values
    unreadNotifications: getUnreadNotifications(),
    readNotifications: getReadNotifications(),
    messageNotifications: getNotificationsByType('message'),
    systemNotifications: getNotificationsByType('system'),
    bookingNotifications: getNotificationsByType('booking'),
    paymentNotifications: getNotificationsByType('payment'),
    ratingNotifications: getNotificationsByType('rating'),
    taskNotifications: getNotificationsByType('task')
  };
};