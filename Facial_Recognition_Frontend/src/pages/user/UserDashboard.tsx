import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, LogIn, LogOut, Target, Zap, Award } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import type { Attendance } from '../../types';
import '../admin/Dashboard.css';
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
      // Fetch user's attendance statistics
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
      const filters = {
        user_id: user.id,
        user_type: user.userType,
        start_date: today,
        end_date: today,
      };

      const response = await attendanceService.getAll(100, 0, filters);
      const records = response.attendance || [];
      
      const timeInRecord = records.find((r: Attendance) => r.attendance_type === 'time-in');
      const timeOutRecord = records.find((r: Attendance) => r.attendance_type === 'time-out');
      
      setTodayAttendance({
        timeIn: timeInRecord ? new Date(timeInRecord.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
        timeOut: timeOutRecord ? new Date(timeOutRecord.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
      });
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const getUserInfo = () => {
    const userType = user?.userType;
    let info = '';
    
    if (userType === 'college' && user?.course_name) {
      info = `${user.course_name} - ${user.year_name || ''}`;
    } else if (userType === 'shs' && user?.strand_name) {
      info = `${user.strand_name} - ${user.grade_name || ''}`;
    } else if (userType === 'faculty' && user?.department_name) {
      info = user.department_name;
    }
    
    return info;
  };

  const getRoleLabel = () => {
    const userType = user?.userType;
    if (userType === 'college') return 'College Student';
    if (userType === 'shs') return 'SHS Student';
    if (userType === 'faculty') return 'Faculty Member';
    return 'User';
  };

  const getStudentId = () => {
    if (user?.userType === 'college' || user?.userType === 'shs') {
      return user?.student_id || 'N/A';
    }
    return null;
  };

  return (
    <div className="dashboard-page user-dashboard">
      {/* Welcome Header */}
      <div className="user-welcome-header">
        <div className="user-avatar-large">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="user-welcome-content">
          <h1 className="user-welcome-title">
            Welcome back, <span className="highlight">{user?.name || 'User'}!</span>
          </h1>
          <p className="user-welcome-subtitle">
            {getRoleLabel()}
            {getStudentId() && ` • ID: ${getStudentId()}`}
            {getUserInfo() && ` • ${getUserInfo()}`}
          </p>
        </div>
      </div>

      {/* Today's Attendance Card */}
      <div className="today-attendance-card">
        <div className="card-header">
          <h3>Today's Attendance</h3>
          <span className="date-badge">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
        
        <div className="attendance-time-grid">
          <div className={`time-card ${todayAttendance.timeIn ? 'active' : 'inactive'}`}>
            <div className="time-card-header">
              <LogIn size={20} />
              <span>Time In</span>
            </div>
            <div className="time-display">
              {todayAttendance.timeIn || '--:--'}
            </div>
            {todayAttendance.timeIn && (
              <div className="time-status">Checked In</div>
            )}
          </div>

          <div className={`time-card ${todayAttendance.timeOut ? 'active-out' : 'inactive'}`}>
            <div className="time-card-header">
              <LogOut size={20} />
              <span>Time Out</span>
            </div>
            <div className="time-display">
              {todayAttendance.timeOut || '--:--'}
            </div>
            {todayAttendance.timeOut && (
              <div className="time-status">Checked Out</div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-section">
        <h3 className="section-title">Your Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Calendar size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{loading ? '...' : stats.presentDays}</div>
              <div className="stat-label">Present Days</div>
              <div className="stat-description">Total attendance recorded</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Target size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{loading ? '...' : `${stats.attendanceRate}%`}</div>
              <div className="stat-label">Attendance Rate</div>
              <div className="stat-description">Your overall performance</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Zap size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{loading ? '...' : stats.thisWeekPresent}</div>
              <div className="stat-label">This Week</div>
              <div className="stat-description">Days present this week</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Award size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{loading ? '...' : stats.thisMonthPresent}</div>
              <div className="stat-label">This Month</div>
              <div className="stat-description">Days present this month</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
