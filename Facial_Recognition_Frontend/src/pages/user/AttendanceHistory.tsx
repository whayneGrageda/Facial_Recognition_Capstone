import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, Filter, Timer } from 'lucide-react';
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
      const filters = {
        user_id: user.id,
        user_type: user.userType,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      // Fetch all records (no pagination on API call, we'll paginate the daily summary)
      const response = await attendanceService.getAll(1000, 0, filters);
      const records = response.attendance || [];
      
      // Group by date and get first time-in and last time-out per day
      const dailyMap = new Map<string, DailyAttendance>();
      
      records.forEach((record: Attendance) => {
        const date = new Date(record.timestamp).toISOString().split('T')[0];
        const time = new Date(record.timestamp);
        
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { date });
        }
        
        const daily = dailyMap.get(date)!;
        
        if (record.attendance_type === 'time-in') {
          if (!daily.timeIn || time < new Date(daily.timeIn)) {
            daily.timeIn = time.toISOString();
          }
        } else if (record.attendance_type === 'time-out') {
          if (!daily.timeOut || time > new Date(daily.timeOut)) {
            daily.timeOut = time.toISOString();
          }
        }
      });
      
      // Calculate duration and convert to array
      const dailyArray = Array.from(dailyMap.values()).map(day => {
        if (day.timeIn && day.timeOut) {
          const timeInDate = new Date(day.timeIn);
          const timeOutDate = new Date(day.timeOut);
          const diffMs = timeOutDate.getTime() - timeInDate.getTime();
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          day.duration = `${hours}h ${minutes}m`;
        }
        return day;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTotalCount(dailyArray.length);
      
      // Paginate the daily summary
      const startIdx = (currentPage - 1) * recordsPerPage;
      const endIdx = startIdx + recordsPerPage;
      setDailyAttendance(dailyArray.slice(startIdx, endIdx));
      
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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date?: Date | string) => {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(totalCount / recordsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="attendance-history-page">
      {/* Header */}
      <div className="history-header">
        <h2>Attendance History</h2>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-inputs">
          <div className="filter-input-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="filter-input-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="date-input"
            />
          </div>

          <button onClick={clearFilters} className="btn-clear-filters">
            <Filter size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="history-table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time In</th>
              <th>Time Out</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="loading-cell">Loading...</td>
              </tr>
            ) : dailyAttendance.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-cell">No attendance records found</td>
              </tr>
            ) : (
              dailyAttendance.map((day) => {
                return (
                  <tr key={day.date}>
                    <td>
                      <div className="cell-with-icon">
                        <Calendar size={16} />
                        {formatDate(day.date)}
                      </div>
                    </td>
                    <td>
                      <div className="cell-with-icon">
                        <Clock size={16} />
                        {formatTime(day.timeIn)}
                      </div>
                    </td>
                    <td>
                      <div className="cell-with-icon">
                        <Clock size={16} />
                        {formatTime(day.timeOut)}
                      </div>
                    </td>
                    <td>
                      <div className="cell-with-icon">
                        <Timer size={16} />
                        {day.duration || '--'}
                      </div>
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
        <div className="pagination">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            First
          </button>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
