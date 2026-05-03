import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { notificationService, Notification } from '../../services/notificationService';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIcon = (message: string) => {
    if (message.toLowerCase().includes('success') || message.toLowerCase().includes('recorded')) {
      return <CheckCircle size={20} />;
    } else if (message.toLowerCase().includes('late') || message.toLowerCase().includes('warning')) {
      return <AlertCircle size={20} />;
    } else {
      return <Info size={20} />;
    }
  };

  const getNotificationType = (message: string): 'success' | 'warning' | 'info' => {
    if (message.toLowerCase().includes('success') || message.toLowerCase().includes('recorded')) {
      return 'success';
    } else if (message.toLowerCase().includes('late') || message.toLowerCase().includes('warning')) {
      return 'warning';
    } else {
      return 'info';
    }
  };

  const formatTimestamp = (date: Date | string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now.getTime() - notifDate.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-mark-all">
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {loading ? (
          <div className="empty-state">
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} />
            <p>No notifications at the moment</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card notification-${getNotificationType(notification.message)} ${notification.is_read ? 'read' : 'unread'}`}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
              style={{ cursor: notification.is_read ? 'default' : 'pointer' }}
            >
              <div className="notification-icon">
                {getIcon(notification.message)}
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <h4>Notification</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="btn-delete"
                    aria-label="Delete notification"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="notification-message">{notification.message}</p>
                <div className="notification-footer">
                  <span className="notification-time">{formatTimestamp(notification.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
