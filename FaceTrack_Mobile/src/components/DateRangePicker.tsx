import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateRangePickerProps {
  startDate: string;   // YYYY-MM-DD or ''
  endDate: string;     // YYYY-MM-DD or ''
  onApply: (start: string, end: string) => void;
  onClear: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromYMD(s: string): Date | null {
  if (!s || s.length !== 10) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDisplay(ymd: string): string {
  const d = fromYMD(ymd);
  if (!d) return ymd;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

const DateRangePicker = ({ startDate, endDate, onApply, onClear }: DateRangePickerProps) => {
  const today = new Date();
  const [visible, setVisible] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Temp selection inside the modal
  const [selStart, setSelStart] = useState(startDate);
  const [selEnd, setSelEnd] = useState(endDate);
  const [picking, setPicking] = useState<'start' | 'end'>('start');

  const openPicker = () => {
    setSelStart(startDate);
    setSelEnd(endDate);
    setPicking('start');
    setVisible(true);
  };

  const handleDayPress = (ymd: string) => {
    if (picking === 'start') {
      setSelStart(ymd);
      setSelEnd('');
      setPicking('end');
    } else {
      // Ensure start <= end
      if (selStart && ymd < selStart) {
        setSelEnd(selStart);
        setSelStart(ymd);
      } else {
        setSelEnd(ymd);
      }
      setPicking('start');
    }
  };

  const handleApply = () => {
    onApply(selStart, selEnd);
    setVisible(false);
  };

  const handleClear = () => {
    setSelStart('');
    setSelEnd('');
    onClear();
    setVisible(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar grid
  const totalDays = daysInMonth(viewYear, viewMonth);
  const firstDay = firstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const getDayState = (day: number | null): 'start' | 'end' | 'range' | 'today' | 'normal' | 'empty' => {
    if (day === null) return 'empty';
    const ymd = toYMD(new Date(viewYear, viewMonth, day));
    if (ymd === selStart) return 'start';
    if (ymd === selEnd) return 'end';
    if (selStart && selEnd && ymd > selStart && ymd < selEnd) return 'range';
    if (ymd === toYMD(today)) return 'today';
    return 'normal';
  };

  const hasFilter = !!(startDate || endDate);

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity style={styles.trigger} onPress={openPicker} activeOpacity={0.8}>
        <Ionicons name="calendar-outline" size={16} color={hasFilter ? COLORS.gold : COLORS.textMuted} />
        <Text style={[styles.triggerText, hasFilter && styles.triggerTextActive]}>
          {hasFilter
            ? `${startDate ? formatDisplay(startDate) : 'Any'} → ${endDate ? formatDisplay(endDate) : 'Any'}`
            : 'Filter by Date Range'}
        </Text>
        {hasFilter && (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); onClear(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Date Range</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Picking indicator */}
            <View style={styles.pickingRow}>
              <View style={[styles.pickingChip, picking === 'start' && styles.pickingChipActive]}>
                <Text style={[styles.pickingLabel, picking === 'start' && styles.pickingLabelActive]}>
                  Start: {selStart ? formatDisplay(selStart) : 'tap a date'}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color={COLORS.textMuted} style={{ marginHorizontal: 6 }} />
              <View style={[styles.pickingChip, picking === 'end' && styles.pickingChipActive]}>
                <Text style={[styles.pickingLabel, picking === 'end' && styles.pickingLabelActive]}>
                  End: {selEnd ? formatDisplay(selEnd) : 'tap a date'}
                </Text>
              </View>
            </View>

            {/* Month navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={18} color={COLORS.textDark} />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={styles.dayHeaders}>
              {DAYS.map(d => (
                <Text key={d} style={styles.dayHeader}>{d}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.grid}>
              {cells.map((day, i) => {
                const state = getDayState(day);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.cell,
                      state === 'start' && styles.cellStart,
                      state === 'end' && styles.cellEnd,
                      state === 'range' && styles.cellRange,
                    ]}
                    onPress={() => day && handleDayPress(toYMD(new Date(viewYear, viewMonth, day)))}
                    disabled={state === 'empty'}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.cellText,
                      state === 'start' && styles.cellTextSelected,
                      state === 'end' && styles.cellTextSelected,
                      state === 'today' && styles.cellTextToday,
                      state === 'range' && styles.cellTextRange,
                    ]}>
                      {day ?? ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyBtn, !selStart && styles.applyBtnDisabled]}
                onPress={handleApply}
                disabled={!selStart}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default DateRangePicker;

// ─── Styles ───────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  triggerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  triggerTextActive: {
    color: COLORS.textDark,
    fontWeight: '600',
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  // Picking indicator
  pickingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickingChip: {
    flex: 1,
    backgroundColor: COLORS.light,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickingChipActive: {
    borderColor: COLORS.gold,
    backgroundColor: '#FDFBF5',
  },
  pickingLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  pickingLabelActive: {
    color: COLORS.gold,
    fontWeight: '600',
  },

  // Month nav
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navBtn: {
    padding: 6,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  // Day headers
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayHeader: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    paddingVertical: 4,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  cell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  cellStart: {
    backgroundColor: COLORS.gold,
    borderRadius: 8,
  },
  cellEnd: {
    backgroundColor: COLORS.gold,
    borderRadius: 8,
  },
  cellRange: {
    backgroundColor: COLORS.gold + '25',
    borderRadius: 0,
  },
  cellText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '400',
  },
  cellTextSelected: {
    color: COLORS.dark,
    fontWeight: '800',
  },
  cellTextToday: {
    color: COLORS.gold,
    fontWeight: '700',
  },
  cellTextRange: {
    color: COLORS.brown,
    fontWeight: '500',
  },

  // Actions
  actions: {
    flexDirection: 'row',
  },
  clearBtn: {
    flex: 1,
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  clearBtnText: {
    color: COLORS.brown,
    fontSize: 14,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 2,
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: '800',
  },
});
