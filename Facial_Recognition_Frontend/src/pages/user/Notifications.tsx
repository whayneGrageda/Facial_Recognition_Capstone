import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, X, CheckCheck } from 'lucide-react';
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
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getType = (msg: string): 'success' | 'warning' | 'info' => {
    const m = msg.toLowerCase();
    if (m.includes('success') || m.includes('recorded')) return 'success';
    if (m.includes('late') || m.includes('warning'))     return 'warning';
    return 'info';
  };

  const getIcon = (msg: string) => {
    const t = getType(msg);
    if (t === 'success') return <CheckCircle size={20} />;
    if (t === 'warning') return <AlertCircle size={20} />;
    return <Info size={20} />;
  };

  const formatTimestamp = (date: Date | string) => {
    const diff = Date.now() - new Date(date).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (h < 1)  return 'Just now';
    if (h < 24) return `${h}h ago`;
    if (d === 1) return 'Yesterday';
    return `${d} days ago`;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notifications-page">

      {/* Header */}
      <div className="notifications-header">
        <div className="page-title-block">
          <h2>Notifications</h2>
          <p className="page-subtitle">Stay updated on your attendance and system alerts.</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-mark-all" onClick={markAllAsRead}>
            <CheckCheck size={15} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Unread Banner */}
      {unreadCount > 0 && (
        <div className="unread-banner">
          <div className="unread-banner-icon">
            <Bell size={20} />
          </div>
          <span className="unread-banner-text">
            You have <span>{unreadCount} unread</span> notification{unreadCount > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* List */}
      <div className="notifications-list">
        {loading ? (
          <div className="empty-state">
            <p>Loading notifications…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} />
            <p>No notifications at the moment</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`notification-card notification-${getType(notif.message)} ${notif.is_read ? 'read' : 'unread'}`}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
            >
              <div className="notification-icon">
                {getIcon(notif.message)}
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <h4>Notification</h4>
                  <button
                    className="btn-delete"
                    onClick={e => { e.stopPropagation(); deleteNotification(notif.id); }}
                    aria-label="Delete notification"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="notification-message">{notif.message}</p>
                <div className="notification-footer">
                  <span className="notification-time">{formatTimestamp(notif.created_at)}</span>
                  {!notif.is_read && <span className="unread-dot" />}
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
