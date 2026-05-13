import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { notificationService, Notification } from '../services/notificationService';
import { COLORS } from '../theme/colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{200D}]/gu, '')
    .trim();
}

function getNotifIcon(message: string): { name: keyof typeof Ionicons.glyphMap; color: string } {
  const m = message.toLowerCase();
  if (m.includes('time-in') || m.includes('check-in') || m.includes('recorded successfully')) {
    return { name: 'log-in-outline', color: COLORS.gold };
  }
  if (m.includes('time-out') || m.includes('check-out')) {
    return { name: 'log-out-outline', color: COLORS.brownLight };
  }
  if (m.includes('late') || m.includes('warning') || m.includes('alert')) {
    return { name: 'alert-circle-outline', color: COLORS.warning };
  }
  if (m.includes('welcome') || m.includes('success')) {
    return { name: 'checkmark-circle-outline', color: COLORS.gold };
  }
  return { name: 'notifications-outline', color: COLORS.gold };
}

// ─── Notification Item ────────────────────────────────────────────────────────

interface NotificationItemProps {
  item: Notification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const NotificationItem = ({ item, onMarkRead, onDelete }: NotificationItemProps) => {
  const icon = getNotifIcon(item.message);

  return (
    <TouchableOpacity
      style={[styles.notifCard, !item.is_read && styles.notifCardUnread]}
      onPress={() => !item.is_read && onMarkRead(item.id)}
      activeOpacity={item.is_read ? 1 : 0.8}
    >
      <View style={styles.notifIconWrap}>
        <Ionicons name={icon.name} size={20} color={icon.color} />
      </View>

      <View style={styles.notifBody}>
        <Text style={[styles.notifMessage, !item.is_read && { fontWeight: '600' }]}>
          {stripEmojis(item.message)}
        </Text>
        <View style={styles.notifFooter}>
          <Text style={styles.notifTime}>{formatTimestamp(item.created_at)}</Text>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    setError('');
    try {
      const data = await notificationService.getAll(50);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications.');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    };
    load();
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Notification', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await notificationService.delete(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to mark all as read.');
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const ListHeader = () => (
    <View>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitleText}>Notifications</Text>
          <Text style={styles.pageTitleSub}>
            {notifications.length} total{unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.markAllBtn, unreadCount === 0 && styles.markAllBtnDisabled]}
          onPress={handleMarkAllRead}
          activeOpacity={0.8}
          disabled={unreadCount === 0}
        >
          <Text style={[styles.markAllText, unreadCount === 0 && styles.markAllTextDisabled]}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchNotifications} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.gold} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          )}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubText}>
                Attendance alerts and updates will appear here.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.gold}
              colors={[COLORS.gold]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  listContent: {
    padding: 20,
    paddingBottom: 16,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pageTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  pageTitleSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  markAllBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markAllBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  markAllText: {
    color: COLORS.dark,
    fontSize: 12,
    fontWeight: '700',
  },
  markAllTextDisabled: {
    color: COLORS.textMuted,
  },

  // Error
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    flex: 1,
  },
  retryBtn: {
    marginLeft: 12,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },

  // Notification card
  notifCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notifCardUnread: {
    backgroundColor: '#FDFBF5',
    borderColor: COLORS.gold,
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifBody: {
    flex: 1,
  },
  notifMessage: {
    fontSize: 14,
    color: COLORS.textDark,
    lineHeight: 20,
    marginBottom: 6,
  },
  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginRight: 8,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
  },
  deleteBtn: {
    marginLeft: 8,
    padding: 4,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textDark,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
