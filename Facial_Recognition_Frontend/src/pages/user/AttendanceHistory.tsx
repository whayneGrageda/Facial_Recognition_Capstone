import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, Filter, Timer, CheckCircle, AlertCircle } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import type { Attendance } from '../../types';
import './AttendanceHistory.css';

interface DailyAttendance {
  date: string;
  timeIn?: string;
  timeOut?: string;
  duration?: string;
}

const AttendanceHistory = () => {
  const { user } = useAuth();
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const recordsPerPage = 15;

  useEffect(() => {
    fetchAttendance();
  }, [currentPage, startDate, endDate]);

  const fetchAttendance = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await attendanceService.getAll(1000, 0, {
        user_id: user.id,
        user_type: user.userType,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      const records = response.attendance || [];

      const dailyMap = new Map<string, DailyAttendance>();
      records.forEach((record: Attendance) => {
        const date = new Date(record.timestamp).toISOString().split('T')[0];
        const time = new Date(record.timestamp);
        if (!dailyMap.has(date)) dailyMap.set(date, { date });
        const daily = dailyMap.get(date)!;
        if (record.attendance_type === 'time-in') {
          if (!daily.timeIn || time < new Date(daily.timeIn)) daily.timeIn = time.toISOString();
        } else if (record.attendance_type === 'time-out') {
          if (!daily.timeOut || time > new Date(daily.timeOut)) daily.timeOut = time.toISOString();
        }
      });

      const dailyArray = Array.from(dailyMap.values()).map(day => {
        if (day.timeIn && day.timeOut) {
          const diff = new Date(day.timeOut).getTime() - new Date(day.timeIn).getTime();
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          day.duration = `${h}h ${m}m`;
        }
        return day;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTotalCount(dailyArray.length);
      const start = (currentPage - 1) * recordsPerPage;
      setDailyAttendance(dailyArray.slice(start, start + recordsPerPage));
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setDailyAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const formatTime = (d?: string) =>
    d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  const getStatus = (day: DailyAttendance) => {
    if (day.timeIn && day.timeOut) return 'complete';
    if (day.timeIn) return 'partial';
    return 'absent';
  };

  const totalPages = Math.ceil(totalCount / recordsPerPage);
  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <div className="attendance-history-page">

      {/* Page Title */}
      <div className="page-title-block">
        <h2>Attendance History</h2>
        <p className="page-subtitle">Your personal attendance records and session durations.</p>
      </div>

      {/* Filter Card */}
      <div className="ah-glass history-filter-card">
        <div className="filter-field">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="filter-field">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button className="btn-clear" onClick={clearFilters}>
          <Filter size={15} />
          Clear Filters
        </button>
      </div>

      {/* Table Card */}
      <div className="ah-glass history-table-card">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time In</th>
              <th>Time Out</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="table-placeholder">Loading records…</td></tr>
            ) : dailyAttendance.length === 0 ? (
              <tr><td colSpan={5} className="table-placeholder">No attendance records found</td></tr>
            ) : (
              dailyAttendance.map(day => {
                const status = getStatus(day);
                return (
                  <tr key={day.date}>
                    <td>
                      <span className="cell-icon-wrap">
                        <Calendar size={15} />
                        {formatDate(day.date)}
                      </span>
                    </td>
                    <td>
                      <span className="cell-icon-wrap">
                        <Clock size={15} />
                        {formatTime(day.timeIn)}
                      </span>
                    </td>
                    <td>
                      <span className="cell-icon-wrap">
                        <Clock size={15} />
                        {formatTime(day.timeOut)}
                      </span>
                    </td>
                    <td>
                      {day.duration ? (
                        <span className="duration-chip">
                          <Timer size={13} />
                          {day.duration}
                        </span>
                      ) : (
                        <span style={{ color: '#9C6B3C', fontSize: '0.875rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${status}`}>
                        {status === 'complete' && <CheckCircle size={12} />}
                        {status === 'partial'  && <Clock size={12} />}
                        {status === 'absent'   && <AlertCircle size={12} />}
                        {status === 'complete' ? 'Complete' : status === 'partial' ? 'Partial' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="history-pagination">
          <button className="pg-btn" onClick={() => goToPage(1)} disabled={currentPage === 1}>First</button>
          <button className="pg-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
          <span className="pg-info">Page {currentPage} of {totalPages}</span>
          <button className="pg-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
          <button className="pg-btn" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>Last</button>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
