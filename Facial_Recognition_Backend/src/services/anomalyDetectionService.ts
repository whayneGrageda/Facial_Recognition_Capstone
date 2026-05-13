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
      veryShortStay: 2, // Less than 2 hours (kept for config reference, check disabled)
      incompleteDayMin: 2, // More than 2 hours
      incompleteDayMax: 4, // But less than 4 hours
      lateNightStart: 18, // 6 PM
      lateNightEnd: 22, // 10 PM
      multipleEntryWindow: 5, // minutes
      multipleEntryThreshold: 3, // More than 3 entries (4+)
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
      this.checkRapidAlternatingPattern(daily),
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
      this.checkLateNightPresence(daily),
      this.checkMultipleEntries(daily),
      this.checkExcessiveEntries(daily),
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
   * DANGEROUS: Check for rapid alternating time-in/time-out pattern
   * This detects gaming behavior where someone repeatedly times in and out
   */
  checkRapidAlternatingPattern(daily: DailyAttendance): string | null {
    // Sort all entries by timestamp
    const sortedEntries = [...daily.entries].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    if (sortedEntries.length < 4) return null;

    // Check for alternating pattern within a short time window (10 minutes)
    const windowMinutes = 10;
    let alternatingCount = 0;
    let maxAlternatingCount = 0;

    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const current = sortedEntries[i];
      const next = sortedEntries[i + 1];
      const diffMinutes = (next.timestamp.getTime() - current.timestamp.getTime()) / (1000 * 60);

      // Check if they alternate and are within window
      if (diffMinutes <= windowMinutes && current.attendance_type !== next.attendance_type) {
        alternatingCount++;
        maxAlternatingCount = Math.max(maxAlternatingCount, alternatingCount);
      } else {
        alternatingCount = 0;
      }
    }

    // If we have 3+ alternations (6+ entries), it's suspicious
    if (maxAlternatingCount >= 3) {
      return `Rapid alternating time-in/out pattern (${maxAlternatingCount + 1} alternations) - possible system gaming`;
    }

    return null;
  },

  /**
   * DANGEROUS: Check for rapid multiple entries (3+ in 1 minute)
   */
  checkRapidMultipleEntries(daily: DailyAttendance): string | null {
    const { rapidEntryWindow, rapidEntryThreshold } = this.config.dangerous;
    
    // Sort all entries by timestamp
    const sortedEntries = [...daily.entries].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    if (sortedEntries.length < rapidEntryThreshold) return null;

    // Check for any entries (time-in or time-out) within the window
    for (let i = 0; i < sortedEntries.length - (rapidEntryThreshold - 1); i++) {
      const baseTime = sortedEntries[i].timestamp.getTime();
      const windowEnd = baseTime + (rapidEntryWindow * 60 * 1000);
      
      let count = 1;
      for (let j = i + 1; j < sortedEntries.length; j++) {
        const entryTime = sortedEntries[j].timestamp.getTime();
        
        if (entryTime <= windowEnd) {
          count++;
        } else {
          break; // No need to check further
        }
      }

      if (count >= rapidEntryThreshold) {
        return `Rapid multiple entries (${count} entries within ${rapidEntryWindow} minute) - possible system gaming`;
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
   * ABNORMAL: Check for multiple entries (3+ within 5 minutes)
   */
  checkMultipleEntries(daily: DailyAttendance): string | null {
    const { multipleEntryWindow, multipleEntryThreshold } = this.config.abnormal;
    
    // Sort all entries by timestamp
    const sortedEntries = [...daily.entries].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    if (sortedEntries.length <= multipleEntryThreshold) return null;

    // Check for any entries within the window
    for (let i = 0; i < sortedEntries.length - multipleEntryThreshold; i++) {
      const baseTime = sortedEntries[i].timestamp.getTime();
      const windowEnd = baseTime + (multipleEntryWindow * 60 * 1000);
      
      let count = 1;
      for (let j = i + 1; j < sortedEntries.length; j++) {
        const entryTime = sortedEntries[j].timestamp.getTime();
        
        if (entryTime <= windowEnd) {
          count++;
        } else {
          break;
        }
      }

      if (count > multipleEntryThreshold) {
        return `Multiple entries (${count} entries within ${multipleEntryWindow} minutes) - unusual pattern`;
      }
    }

    return null;
  },

  /**
   * ABNORMAL: Check for excessive entries per day
   */
  checkExcessiveEntries(daily: DailyAttendance): string | null {
    const totalEntries = daily.entries.length;
    
    // Normal is 2 entries (1 time-in, 1 time-out)
    // 4 entries might be acceptable (forgot to time out, came back)
    // 6+ entries is suspicious
    if (totalEntries >= 10) {
      return `Excessive entries (${totalEntries} total entries in one day) - highly unusual`;
    } else if (totalEntries >= 6) {
      return `Multiple entries (${totalEntries} total entries in one day) - unusual pattern`;
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
