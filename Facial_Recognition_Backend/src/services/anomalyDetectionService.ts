/**
 * ATTENDANCE ANOMALY DETECTION SERVICE
 * Detects abnormal and dangerous attendance patterns
 */

interface AttendanceRecord {
  id: number;
  user_id: number;
  user_type: string;
  timestamp: Date;
  attendance_type: 'time-in' | 'time-out';
  user_name?: string;
}

interface AnomalyResult {
  status: 'normal' | 'abnormal' | 'dangerous';
  reasons: string[];
  severity: number; // 0 = normal, 1 = abnormal, 2 = dangerous
}

interface DailyAttendance {
  userId: number;
  userName: string;
  userType: string;
  date: string;
  timeIn: Date | null;
  timeOut: Date | null;
  duration: number; // in hours
  entries: AttendanceRecord[];
}

export const AnomalyDetectionService = {
  /**
   * Configuration for anomaly detection
   */
  config: {
    normal: {
      timeInStart: 6, // 6 AM
      timeInEnd: 10, // 10 AM
      minDuration: 4, // hours
      maxDuration: 12, // hours
    },
    abnormal: {
      veryLateArrival: 10, // After 10 AM
      veryShortStay: 2, // Less than 2 hours
      incompleteDayMin: 2, // More than 2 hours
      incompleteDayMax: 4, // But less than 4 hours
      lateNightStart: 18, // 6 PM
      lateNightEnd: 22, // 10 PM
      multipleEntryWindow: 5, // minutes
      multipleEntryThreshold: 2, // More than 2 entries
      longDuration: 12, // More than 12 hours
      maxLongDuration: 16, // Up to 16 hours
    },
    dangerous: {
      midnightStart: 22, // 10 PM
      midnightEnd: 6, // 6 AM
      extremeDuration: 16, // More than 16 hours
      rapidEntryWindow: 1, // minute
      rapidEntryThreshold: 3, // 3+ entries in 1 minute
    },
  },

  /**
   * Analyze a single day's attendance for anomalies
   */
  analyzeDailyAttendance(daily: DailyAttendance): AnomalyResult {
    const reasons: string[] = [];
    let maxSeverity = 0;

    // Check for dangerous patterns first
    const dangerousChecks = [
      this.checkMidnightAccess(daily),
      this.checkExtremeDuration(daily),
      this.checkRapidMultipleEntries(daily),
      this.checkImpossibleSequence(daily),
    ];

    dangerousChecks.forEach((check) => {
      if (check) {
        reasons.push(check);
        maxSeverity = 2;
      }
    });

    // If dangerous, return immediately
    if (maxSeverity === 2) {
      return { status: 'dangerous', reasons, severity: 2 };
    }

    // Check for abnormal patterns
    const abnormalChecks = [
      this.checkVeryShortStay(daily),
      this.checkLateArrival(daily),
      this.checkLateNightPresence(daily),
      this.checkMultipleEntries(daily),
      this.checkIncompleteDay(daily),
      this.checkNoTimeOut(daily),
      this.checkVeryLongStay(daily),
    ];

    abnormalChecks.forEach((check) => {
      if (check) {
        reasons.push(check);
        maxSeverity = 1;
      }
    });

    if (maxSeverity === 1) {
      return { status: 'abnormal', reasons, severity: 1 };
    }

    return { status: 'normal', reasons: [], severity: 0 };
  },

  /**
   * DANGEROUS: Check for midnight access (10 PM - 6 AM)
   */
  checkMidnightAccess(daily: DailyAttendance): string | null {
    const { midnightStart, midnightEnd } = this.config.dangerous;

    for (const entry of daily.entries) {
      const hour = entry.timestamp.getHours();
      
      // Between 10 PM and midnight, or between midnight and 6 AM
      if (hour >= midnightStart || hour < midnightEnd) {
        return `Midnight access detected (${entry.timestamp.toLocaleTimeString()})`;
      }
    }

    return null;
  },

  /**
   * DANGEROUS: Check for extreme duration (16+ hours)
   */
  checkExtremeDuration(daily: DailyAttendance): string | null {
    const { extremeDuration } = this.config.dangerous;

    if (daily.duration >= extremeDuration) {
      return `Extremely long duration (${daily.duration.toFixed(1)} hours)`;
    }

    return null;
  },

  /**
   * DANGEROUS: Check for rapid multiple entries (3+ in 1 minute)
   */
  checkRapidMultipleEntries(daily: DailyAttendance): string | null {
    const { rapidEntryWindow, rapidEntryThreshold } = this.config.dangerous;
    const timeIns = daily.entries.filter((e) => e.attendance_type === 'time-in');

    if (timeIns.length < rapidEntryThreshold) return null;

    // Check each time-in against others
    for (let i = 0; i < timeIns.length - 1; i++) {
      let rapidCount = 1;
      const baseTime = timeIns[i].timestamp.getTime();

      for (let j = i + 1; j < timeIns.length; j++) {
        const diffMinutes = (timeIns[j].timestamp.getTime() - baseTime) / (1000 * 60);
        
        if (diffMinutes <= rapidEntryWindow) {
          rapidCount++;
        }
      }

      if (rapidCount >= rapidEntryThreshold) {
        return `Rapid multiple entries (${rapidCount} entries within ${rapidEntryWindow} minute)`;
      }
    }

    return null;
  },

  /**
   * DANGEROUS: Check for impossible time sequence
   */
  checkImpossibleSequence(daily: DailyAttendance): string | null {
    if (daily.timeIn && daily.timeOut && daily.timeOut < daily.timeIn) {
      return 'Impossible time sequence (time-out before time-in)';
    }

    return null;
  },

  /**
   * ABNORMAL: Check for very short stay (< 2 hours)
   */
  checkVeryShortStay(daily: DailyAttendance): string | null {
    const { veryShortStay } = this.config.abnormal;

    if (daily.duration > 0 && daily.duration < veryShortStay) {
      return `Very short stay (${daily.duration.toFixed(1)} hours)`;
    }

    return null;
  },

  /**
   * ABNORMAL: Check for late arrival (after 10 AM)
   */
  checkLateArrival(daily: DailyAttendance): string | null {
    const { veryLateArrival } = this.config.abnormal;

    if (daily.timeIn) {
      const hour = daily.timeIn.getHours();
      if (hour >= veryLateArrival) {
        return `Late arrival (${daily.timeIn.toLocaleTimeString()})`;
      }
    }

    return null;
  },

  /**
   * ABNORMAL: Check for late night presence (6 PM - 10 PM)
   */
  checkLateNightPresence(daily: DailyAttendance): string | null {
    const { lateNightStart, lateNightEnd } = this.config.abnormal;

    for (const entry of daily.entries) {
      const hour = entry.timestamp.getHours();
      
      if (hour >= lateNightStart && hour < lateNightEnd) {
        return `Late night presence (${entry.timestamp.toLocaleTimeString()})`;
      }
    }

    return null;
  },

  /**
   * ABNORMAL: Check for multiple entries (2+ within 5 minutes)
   */
  checkMultipleEntries(daily: DailyAttendance): string | null {
    const { multipleEntryWindow, multipleEntryThreshold } = this.config.abnormal;
    const timeIns = daily.entries.filter((e) => e.attendance_type === 'time-in');

    if (timeIns.length <= multipleEntryThreshold) return null;

    // Check for entries within window
    for (let i = 0; i < timeIns.length - 1; i++) {
      const baseTime = timeIns[i].timestamp.getTime();
      let count = 1;

      for (let j = i + 1; j < timeIns.length; j++) {
        const diffMinutes = (timeIns[j].timestamp.getTime() - baseTime) / (1000 * 60);
        
        if (diffMinutes <= multipleEntryWindow) {
          count++;
        }
      }

      if (count > multipleEntryThreshold) {
        return `Multiple entries (${count} entries within ${multipleEntryWindow} minutes)`;
      }
    }

    return null;
  },

  /**
   * ABNORMAL: Check for incomplete day (2-4 hours)
   */
  checkIncompleteDay(daily: DailyAttendance): string | null {
    const { incompleteDayMin, incompleteDayMax } = this.config.abnormal;

    if (daily.duration >= incompleteDayMin && daily.duration < incompleteDayMax) {
      return `Incomplete day (${daily.duration.toFixed(1)} hours)`;
    }

    return null;
  },

  /**
   * ABNORMAL: Check for no time-out
   */
  checkNoTimeOut(daily: DailyAttendance): string | null {
    if (daily.timeIn && !daily.timeOut) {
      const now = new Date();
      const timeInDate = new Date(daily.timeIn);
      
      // Only flag if it's past 6 PM on the same day
      if (
        now.toDateString() === timeInDate.toDateString() &&
        now.getHours() >= 18
      ) {
        return 'No time-out recorded';
      }
    }

    return null;
  },

  /**
   * ABNORMAL: Check for very long stay (12-16 hours)
   */
  checkVeryLongStay(daily: DailyAttendance): string | null {
    const { longDuration, maxLongDuration } = this.config.abnormal;

    if (daily.duration >= longDuration && daily.duration < maxLongDuration) {
      return `Very long stay (${daily.duration.toFixed(1)} hours)`;
    }

    return null;
  },

  /**
   * Format duration in hours and minutes
   */
  formatDuration(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  },
};
