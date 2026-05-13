import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { attendanceService, UserStats, DailyRecord } from '../services/attendanceService';
import { COLORS } from '../theme/colors';

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
}

const StatCard = ({ label, value }: StatCardProps) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Today Row ────────────────────────────────────────────────────────────────

interface TodayRowProps {
  label: string;
  time?: string;
  color: string;
}

const TodayRow = ({ label, time, color }: TodayRowProps) => (
  <View style={styles.todayRow}>
    <View style={styles.todayRowLeft}>
      <View style={[styles.todayRowDot, { backgroundColor: color }]} />
      <Text style={styles.todayRowLabel}>{label}</Text>
    </View>
    <Text style={[styles.todayRowTime, !time && styles.todayRowTimeMissing]}>
      {time ?? '—'}
    </Text>
  </View>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(isoString?: string): string | undefined {
  if (!isoString) return undefined;
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const DashboardScreen = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setError('');

    try {
      // Fetch stats and today's attendance in parallel
      const [fetchedStats, rawHistory] = await Promise.all([
        attendanceService.getStats(user.id),
        attendanceService.getRawHistory(user.id, user.userType, 50),
      ]);

      console.log('[Dashboard] Stats:', JSON.stringify(fetchedStats));
      console.log('[Dashboard] Raw history count:', rawHistory.length);
      if (rawHistory.length > 0) {
        console.log('[Dashboard] First record:', JSON.stringify(rawHistory[0]));
      }

      // Log today comparison
      const today = new Date().toISOString().split('T')[0];
      console.log('[Dashboard] Today is:', today);
      const todayRaw = rawHistory.filter(
        (r) => new Date(r.timestamp).toISOString().split('T')[0] === today
      );
      console.log('[Dashboard] Records for today:', todayRaw.length);

      setStats(fetchedStats);

      if (todayRaw.length > 0) {
        const built = attendanceService.buildDailyRecords(todayRaw);
        setTodayRecord(built[0] ?? null);
      } else {
        setTodayRecord(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    load();

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const userTypeLabel =
    user?.userType === 'faculty'
      ? 'Faculty'
      : user?.userType === 'shs'
      ? 'SHS Student'
      : 'College Student';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.gold}
            colors={[COLORS.gold]}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name?.split(' ')[0] ?? 'User'}
            </Text>
            <Text style={styles.dateText}>{formatDate()}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── User Badge ── */}
        <View style={styles.userBadge}>
          <Text style={styles.userBadgeText}>{userTypeLabel}</Text>
        </View>

        {/* ── Error ── */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Today's Attendance Card ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Attendance</Text>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    todayRecord?.status === 'complete'
                      ? COLORS.success
                      : todayRecord?.status === 'partial'
                      ? COLORS.warning
                      : COLORS.error,
                },
              ]}
            />
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.gold} style={styles.loader} />
          ) : (
            <>
              <TodayRow
                label="Time In"
                time={formatTime(todayRecord?.timeIn)}
                color={COLORS.success}
              />
              <View style={styles.divider} />
              <TodayRow
                label="Time Out"
                time={formatTime(todayRecord?.timeOut)}
                color={COLORS.error}
              />
              {todayRecord?.duration && (
                <>
                  <View style={styles.divider} />
                  <TodayRow
                    label="Duration"
                    time={todayRecord.duration}
                    color={COLORS.gold}
                  />
                </>
              )}
              {!todayRecord && (
                <Text style={styles.noRecordText}>
                  No attendance recorded today.
                </Text>
              )}
            </>
          )}
        </View>

        {/* ── Stats Cards ── */}
        <Text style={styles.sectionHeading}>Your Statistics</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.gold} style={styles.loader} />
        ) : stats ? (
          <View style={styles.statsGrid}>
            <StatCard
              label="Attendance Rate"
              value={`${stats.attendanceRate}%`}
            />
            <StatCard
              label="Days Present"
              value={stats.presentDays}
            />
            <StatCard
              label="This Week"
              value={stats.thisWeekPresent}
            />
            <StatCard
              label="This Month"
              value={stats.thisMonthPresent}
            />
            <StatCard
              label="Expected Days"
              value={stats.totalDays}
            />
            <StatCard
              label="Late Days"
              value={stats.lateDays}
            />
          </View>
        ) : (
          !error && (
            <Text style={styles.noRecordText}>No statistics available.</Text>
          )
        )}

        {/* ── Info Footer ── */}
        <View style={styles.infoFooter}>
          <Text style={styles.infoFooterText}>
            Attendance is recorded automatically via facial recognition at the
            campus entrance.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: '800',
  },

  // User badge
  userBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.cream,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  userBadgeText: {
    color: COLORS.brown,
    fontSize: 12,
    fontWeight: '600',
  },

  // Error
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
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

  // Section card
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Today rows
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  todayRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayRowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  todayRowLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  todayRowTime: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  todayRowTimeMissing: {
    color: COLORS.placeholder,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  noRecordText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Stats
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.gold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Loader
  loader: {
    marginVertical: 20,
  },

  // Info footer
  infoFooter: {
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  infoFooterText: {
    color: COLORS.brown,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
