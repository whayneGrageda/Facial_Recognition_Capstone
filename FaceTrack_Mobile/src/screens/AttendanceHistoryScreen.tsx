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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { attendanceService, DailyRecord } from '../services/attendanceService';
import DateRangePicker from '../components/DateRangePicker';
import { COLORS } from '../theme/colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatTime(isoString?: string): string {
  if (!isoString) return '--:--';
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Record Item ──────────────────────────────────────────────────────────────

const RecordItem = React.memo(({ item }: { item: DailyRecord }) => {
  const statusColor =
    item.status === 'complete' ? COLORS.success
    : item.status === 'partial' ? COLORS.warning
    : COLORS.error;

  const statusLabel =
    item.status === 'complete' ? 'Complete'
    : item.status === 'partial' ? 'Partial'
    : 'Absent';

  return (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.timeRow}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeBlockLabel}>Time In</Text>
          <Text style={[styles.timeBlockValue, { color: COLORS.success }]}>{formatTime(item.timeIn)}</Text>
        </View>
        <View style={styles.timeSeparator}>
          <Text style={styles.timeSeparatorText}>→</Text>
        </View>
        <View style={styles.timeBlock}>
          <Text style={styles.timeBlockLabel}>Time Out</Text>
          <Text style={[styles.timeBlockValue, { color: COLORS.error }]}>{formatTime(item.timeOut)}</Text>
        </View>
        {item.duration && (
          <>
            <View style={styles.timeSeparator}>
              <Text style={styles.timeSeparatorText}>·</Text>
            </View>
            <View style={styles.timeBlock}>
              <Text style={styles.timeBlockLabel}>Duration</Text>
              <Text style={[styles.timeBlockValue, { color: COLORS.gold }]}>{item.duration}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
});

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

const AttendanceHistoryScreen = () => {
  const { user } = useAuth();

  const [allRecords, setAllRecords] = useState<DailyRecord[]>([]);
  const [displayedRecords, setDisplayedRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [appliedStart, setAppliedStart] = useState('');
  const [appliedEnd, setAppliedEnd] = useState('');

  const fetchHistory = useCallback(async (start: string, end: string) => {
    if (!user?.id) return;
    setError('');
    try {
      const { records } = await attendanceService.getHistory(user.id, user.userType, {
        startDate: start || undefined,
        endDate: end || undefined,
      });
      setAllRecords(records);
      setPage(1);
      setDisplayedRecords(records.slice(0, PAGE_SIZE));
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance history.');
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchHistory(appliedStart, appliedEnd);
      setLoading(false);
    };
    load();
  }, [fetchHistory, appliedStart, appliedEnd]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory(appliedStart, appliedEnd);
    setRefreshing(false);
  }, [fetchHistory, appliedStart, appliedEnd]);

  const handleApply = (start: string, end: string) => {
    setAppliedStart(start);
    setAppliedEnd(end);
  };

  const handleClear = () => {
    setAppliedStart('');
    setAppliedEnd('');
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const end = nextPage * PAGE_SIZE;
    if (end - PAGE_SIZE < allRecords.length) {
      setDisplayedRecords(allRecords.slice(0, end));
      setPage(nextPage);
    }
  };

  const hasMore = displayedRecords.length < allRecords.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />

      {/* Header lives outside FlatList — stable, never remounts */}
      <View style={styles.header}>
        <View style={styles.pageTitle}>
          <Text style={styles.pageTitleText}>Attendance History</Text>
          <Text style={styles.pageTitleSub}>Your personal attendance records</Text>
        </View>

        <DateRangePicker
          startDate={appliedStart}
          endDate={appliedEnd}
          onApply={handleApply}
          onClear={handleClear}
        />

        {!loading && (
          <Text style={styles.summaryText}>
            {allRecords.length} record{allRecords.length !== 1 ? 's' : ''} found
          </Text>
        )}

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchHistory(appliedStart, appliedEnd)} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={displayedRecords}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => <RecordItem item={item} />}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          loading ? (
            <ActivityIndicator color={COLORS.gold} style={styles.loader} />
          ) : hasMore ? (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          ) : allRecords.length > 0 ? (
            <Text style={styles.endText}>— End of records —</Text>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No attendance records found.</Text>
              {(appliedStart || appliedEnd) && (
                <TouchableOpacity onPress={handleClear}>
                  <Text style={styles.emptyAction}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
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
    </SafeAreaView>
  );
};

export default AttendanceHistoryScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: COLORS.light,
  },
  pageTitle: {
    marginBottom: 12,
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
  summaryText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 4,
  },
  errorBanner: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
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
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  recordCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordDate: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timeBlockLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 3,
  },
  timeBlockValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeSeparator: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  timeSeparatorText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '300',
  },
  loader: {
    marginVertical: 20,
  },
  loadMoreBtn: {
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  loadMoreText: {
    color: COLORS.brown,
    fontSize: 14,
    fontWeight: '700',
  },
  endText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginBottom: 8,
  },
  emptyAction: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
