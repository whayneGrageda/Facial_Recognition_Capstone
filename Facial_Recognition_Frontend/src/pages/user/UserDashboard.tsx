import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, LogOut, Target, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import type { Attendance } from '../../types';
import './UserDashboard.css';

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  attendanceRate: number;
  thisWeekPresent: number;
  thisMonthPresent: number;
}

interface TodayAttendance {
  timeIn?: string;
  timeOut?: string;
}

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F'];

const UserDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AttendanceStats>({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    attendanceRate: 0,
    thisWeekPresent: 0,
    thisMonthPresent: 0,
  });
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceStats();
    fetchTodayAttendance();
  }, []);

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getUserStats(user?.id || 0);
      setStats(response);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    if (!user?.id) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await attendanceService.getAll(100, 0, {
        user_id: user.id,
        user_type: user.userType,
        start_date: today,
        end_date: today,
      });
      const records = response.attendance || [];
      const timeInRecord  = records.find((r: Attendance) => r.attendance_type === 'time-in');
      const timeOutRecord = records.find((r: Attendance) => r.attendance_type === 'time-out');
      setTodayAttendance({
        timeIn:  timeInRecord  ? new Date(timeInRecord.timestamp).toLocaleTimeString('en-US',  { hour: '2-digit', minute: '2-digit' }) : undefined,
        timeOut: timeOutRecord ? new Date(timeOutRecord.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
      });
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const getUserInfo = () => {
    const t = user?.userType;
    if (t === 'college' && user?.course_name)     return `${user.course_name}${user.year_name ? ` • ${user.year_name}` : ''}`;
    if (t === 'shs'     && user?.strand_name)     return `${user.strand_name}${user.grade_name ? ` • ${user.grade_name}` : ''}`;
    if (t === 'faculty' && user?.department_name) return user.department_name;
    return '';
  };

  const getRoleLabel = () => {
    const t = user?.userType;
    if (t === 'college') return 'College Student';
    if (t === 'shs')     return 'SHS Student';
    if (t === 'faculty') return 'Faculty Member';
    return 'User';
  };

  const getStudentId = () =>
    (user?.userType === 'college' || user?.userType === 'shs') ? user?.student_id : null;

  // Build week presence array (M-F). Mark days up to today as present if thisWeekPresent covers them.
  const todayDow = new Date().getDay(); // 0=Sun … 6=Sat
  const weekDayIndex = todayDow === 0 ? 4 : Math.min(todayDow - 1, 4); // clamp to 0-4
  const weekPresence = WEEK_DAYS.map((_, i) => i < stats.thisWeekPresent);

  // Month bars — show 20 slots, fill presentDays
  const totalSlots = 20;
  const presentSlots = Math.min(stats.presentDays, totalSlots);

  return (
    <div className="dashboard-page user-dashboard">

      {/* ── TOP SECTION: Welcome + Today ── */}
      <div className="dashboard-top-section">

        {/* Welcome Card */}
        <div className="glass-card welcome-card">
          <div className="welcome-avatar">
            <div className="avatar-circle">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="avatar-status-dot" />
          </div>
          <div className="welcome-text">
            <h2>
              Welcome back, <span className="highlight">{user?.name || 'User'}!</span>
            </h2>
            <p>Your facial recognition profile is active and verified for today's sessions.</p>
            <div className="welcome-badges">
              <span className="welcome-badge verified">
                <CheckCircle size={13} />
                Verified
              </span>
              <span className="welcome-badge role">
                {getRoleLabel()}
                {getStudentId() && ` • ${getStudentId()}`}
                {getUserInfo() && ` • ${getUserInfo()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Today's Attendance Card */}
        <div className="glass-card today-card">
          <div className="today-card-header">
            <h3>Today</h3>
            <span className="today-date-label">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
            </span>
          </div>

          <div className="attendance-entries">
            {/* Time In */}
            <div className={`attendance-entry ${todayAttendance.timeIn ? 'has-record' : 'pending'}`}>
              <div className="entry-left">
                <div className={`entry-icon ${todayAttendance.timeIn ? 'time-in' : 'pending'}`}>
                  <LogIn size={18} />
                </div>
                <div>
                  <div className="entry-label">Time In</div>
                  <div className={`entry-time ${!todayAttendance.timeIn ? 'muted' : ''}`}>
                    {todayAttendance.timeIn || '-- : --'}
                  </div>
                </div>
              </div>
              {todayAttendance.timeIn && (
                <span className="entry-status-badge on-time">On Time</span>
              )}
            </div>

            {/* Time Out */}
            <div className={`attendance-entry ${todayAttendance.timeOut ? 'has-record' : 'pending'}`}>
              <div className="entry-left">
                <div className={`entry-icon ${todayAttendance.timeOut ? 'time-out' : 'pending'}`}>
                  <LogOut size={18} />
                </div>
                <div>
                  <div className="entry-label">Time Out</div>
                  <div className={`entry-time ${!todayAttendance.timeOut ? 'muted' : ''}`}>
                    {todayAttendance.timeOut || '-- : --'}
                  </div>
                </div>
              </div>
              {todayAttendance.timeOut && (
                <span className="entry-status-badge checked-out">Checked Out</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS BENTO GRID ── */}
      <div className="stats-bento">

        {/* Attendance Rate */}
        <div className="glass-card stat-bento-card">
          <div>
            <div className="stat-bento-icon gold">
              <Target size={22} />
            </div>
            <div className="stat-bento-label">Attendance Rate</div>
            <div className="stat-bento-value">
              <span className="stat-bento-number">
                {loading ? '—' : `${stats.attendanceRate}%`}
              </span>
              {!loading && stats.attendanceRate >= 90 && (
                <span className="stat-bento-trend">
                  <TrendingUp size={14} /> Good
                </span>
              )}
            </div>
          </div>
          <div className="stat-progress-bar">
            <div
              className="stat-progress-fill"
              style={{ width: loading ? '0%' : `${stats.attendanceRate}%` }}
            />
          </div>
        </div>

        {/* Present Days */}
        <div className="glass-card stat-bento-card">
          <div>
            <div className="stat-bento-icon brown">
              <Calendar size={22} />
            </div>
            <div className="stat-bento-label">Present Days</div>
            <div className="stat-bento-value">
              <span className="stat-bento-number">{loading ? '—' : stats.presentDays}</span>
              <span className="stat-bento-sub">Days</span>
            </div>
          </div>
          <div className="month-bars">
            {Array.from({ length: totalSlots }).map((_, i) => (
              <div
                key={i}
                className={`month-bar ${i < presentSlots ? '' : 'absent'}`}
                style={{ height: `${Math.max(40, Math.min(100, 60 + (i % 3) * 15))}%` }}
              />
            ))}
          </div>
        </div>

        {/* This Week */}
        <div className="glass-card stat-bento-card">
          <div>
            <div className="stat-bento-icon cream">
              <CheckCircle size={22} />
            </div>
            <div className="stat-bento-label">This Week</div>
            <div className="stat-bento-value">
              <span className="stat-bento-number">{loading ? '—' : stats.thisWeekPresent}</span>
              <span className="stat-bento-sub">/ 5 Days</span>
            </div>
          </div>
          <div className="week-dots">
            {WEEK_DAYS.map((day, i) => (
              <div key={i} className="week-day">
                <span className={`week-day-label ${i === weekDayIndex ? 'today' : ''}`}>{day}</span>
                <div className={`week-dot ${weekPresence[i] ? 'present' : 'absent'} ${i === weekDayIndex ? 'today-dot' : ''}`}>
                  {weekPresence[i] && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserDashboard;
