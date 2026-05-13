import { useState, useEffect } from 'react';
import { RefreshCw, Download, Search, X } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import type { Attendance } from '../../types';
import './AttendanceLogs.css';

const AttendanceLogs = () => {
  const [loading, setLoading] = useState(false);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [coursesStrandsDepts, setCoursesStrandsDepts] = useState<string[]>([]);
  
  // Filters
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterUserType, setFilterUserType] = useState('');
  const [filterCourseStrandDept, setFilterCourseStrandDept] = useState('');
  const [filterAttendanceType, setFilterAttendanceType] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Fetch courses/strands/departments for filter dropdown
  const fetchMetadata = async () => {
    try {
      const [courses, strands, departments] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/metadata/courses`).then(r => r.json()),
        fetch(`${import.meta.env.VITE_API_URL}/metadata/shs-strands`).then(r => r.json()),
        fetch(`${import.meta.env.VITE_API_URL}/metadata/faculty-departments`).then(r => r.json())
      ]);
      
      const allOptions = [
        ...(courses.data || []).map((c: any) => c.name),
        ...(strands.data || []).map((s: any) => s.acronym),
        ...(departments.data || []).map((d: any) => d.department_name)
      ].filter(Boolean);
      
      // Ensure unique options to avoid duplicate key errors
      setCoursesStrandsDepts(Array.from(new Set(allOptions)));
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  const fetchAttendanceLogs = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * recordsPerPage;
      
      // Build date filter (handle partial matches)
      let dateFilter: string | undefined;
      
      // If year is selected, build from year
      if (filterYear) {
        dateFilter = filterYear;
        if (filterMonth) {
          const monthNum = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(filterMonth) + 1;
          dateFilter += `-${String(monthNum).padStart(2, '0')}`;
          if (filterDay) {
            dateFilter += `-${String(filterDay).padStart(2, '0')}`;
          }
        }
      } 
      // If no year but month is selected, use wildcard for year
      else if (filterMonth) {
        const monthNum = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(filterMonth) + 1;
        const monthStr = String(monthNum).padStart(2, '0');
        
        if (filterDay) {
          const dayStr = String(filterDay).padStart(2, '0');
          // Match any year with this month and day (e.g., "%-04-30" matches 2024-04-30, 2025-04-30, etc.)
          dateFilter = `%-${monthStr}-${dayStr}`;
        } else {
          // Match any year with this month (e.g., "%-04" matches 2024-04, 2025-04, etc.)
          dateFilter = `%-${monthStr}`;
        }
      }
      // If only day is selected (without year or month), use wildcard
      else if (filterDay) {
        const dayStr = String(filterDay).padStart(2, '0');
        // Match any year and month with this day (e.g., "%-%-30" matches any month's 30th day)
        dateFilter = `%-%-${dayStr}`;
      }
      
      const filters = {
        user_type: filterUserType || undefined,
        date: dateFilter,
        course_strand_dept: filterCourseStrandDept || undefined,
        attendance_type: filterAttendanceType || undefined,
        search: searchQuery || undefined,
      };

      const response = await attendanceService.getAll(recordsPerPage, offset, filters);
      setAttendanceList(response.attendance || response.items || []);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
      setAttendanceList([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchAttendanceLogs();
  }, [currentPage, filterYear, filterMonth, filterDay, filterUserType, filterCourseStrandDept, filterAttendanceType, searchQuery]);

  const downloadReports = async () => {
    try {
      setLoading(true);
      
      // Build date filter (handle partial matches)
      let dateFilter: string | undefined;
      
      // If year is selected, build from year
      if (filterYear) {
        dateFilter = filterYear;
        if (filterMonth) {
          const monthNum = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(filterMonth) + 1;
          dateFilter += `-${String(monthNum).padStart(2, '0')}`;
          if (filterDay) {
            dateFilter += `-${String(filterDay).padStart(2, '0')}`;
          }
        }
      } 
      // If no year but month is selected, use wildcard for year
      else if (filterMonth) {
        const monthNum = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(filterMonth) + 1;
        const monthStr = String(monthNum).padStart(2, '0');
        
        if (filterDay) {
          const dayStr = String(filterDay).padStart(2, '0');
          dateFilter = `%-${monthStr}-${dayStr}`;
        } else {
          dateFilter = `%-${monthStr}`;
        }
      }
      // If only day is selected (without year or month), use wildcard
      else if (filterDay) {
        const dayStr = String(filterDay).padStart(2, '0');
        dateFilter = `%-%-${dayStr}`;
      }

      const filters = {
        user_type: filterUserType || undefined,
        date: dateFilter,
        course_strand_dept: filterCourseStrandDept || undefined,
        attendance_type: filterAttendanceType || undefined,
        search: searchQuery || undefined,
      };

      await attendanceService.getReport(filters);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterYear('');
    setFilterMonth('');
    setFilterDay('');
    setFilterUserType('');
    setFilterCourseStrandDept('');
    setFilterAttendanceType('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(totalCount / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, totalCount);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getUserTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      college: 'College',
      shs: 'SHS',
      faculty: 'Faculty',
      guest: 'Guest'
    };
    return labels[type] || type;
  };

  const getStatusBadgeClass = (type: string) => {
    const classes: Record<string, string> = {
      'time-in': 'badge-success',
      'time-out': 'badge-error'
    };
    return classes[type] || 'badge-secondary';
  };

  return (
    <div className="attendance-logs">
      {/* Page Title */}
      <div className="page-title-block">
        <h2>Attendance Logs</h2>
        <p className="page-subtitle">View and filter all attendance records across all users.</p>
      </div>

      {/* Header with Actions */}
      <div className="logs-header">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>System Online</span>
        </div>
        <div className="header-actions">
          <button onClick={fetchAttendanceLogs} className="btn btn-primary btn-sm" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={downloadReports} className="btn btn-secondary btn-sm">
            <Download size={16} />
            <span>Download Reports</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Year</label>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="form-select">
              <option value="">All</option>
              {Array.from({ length: 9 }, (_, i) => 2022 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Month</label>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="form-select">
              <option value="">All</option>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Day</label>
            <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className="form-select">
              <option value="">All</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>User Type</label>
            <select value={filterUserType} onChange={(e) => setFilterUserType(e.target.value)} className="form-select">
              <option value="">All Types</option>
              <option value="college">College</option>
              <option value="shs">SHS</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Course/Strand/Dept</label>
            <select value={filterCourseStrandDept} onChange={(e) => setFilterCourseStrandDept(e.target.value)} className="form-select">
              <option value="">All</option>
              {coursesStrandsDepts.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Attendance Type</label>
            <select value={filterAttendanceType} onChange={(e) => setFilterAttendanceType(e.target.value)} className="form-select">
              <option value="">All Types</option>
              <option value="time-in">Time In</option>
              <option value="time-out">Time Out</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Search</label>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by ID, Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input search-input"
              />
            </div>
          </div>
        </div>

        <button onClick={clearFilters} className="btn btn-ghost btn-sm clear-filters-btn">
          <X size={16} />
          <span>Clear Filters</span>
        </button>
      </div>

      {/* Records Count */}
      <div className="records-info">
        Showing {startIndex + 1} to {endIndex} of {totalCount} records
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>User Type</th>
              <th>Course/Strand/Dept</th>
              <th>Timestamp</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="loading-cell">Loading...</td>
              </tr>
            ) : attendanceList.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">No records found</td>
              </tr>
            ) : (
              attendanceList.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>{record.user_name || 'N/A'}</td>
                  <td>{record.user_email || 'N/A'}</td>
                  <td><span className="badge badge-primary">{getUserTypeLabel(record.user_type)}</span></td>
                  <td>{(record as any).course_strand_dept || 'N/A'}</td>
                  <td>{formatTimestamp(record.timestamp)}</td>
                  <td><span className={`badge ${getStatusBadgeClass(record.attendance_type || '')}`}>{record.attendance_type || 'N/A'}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button 
          onClick={() => goToPage(1)} 
          disabled={currentPage === 1}
          className="btn btn-ghost btn-sm"
        >
          First
        </button>
        <button 
          onClick={() => goToPage(currentPage - 1)} 
          disabled={currentPage === 1}
          className="btn btn-ghost btn-sm"
        >
          Previous
        </button>
        <span className="page-info">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          onClick={() => goToPage(currentPage + 1)} 
          disabled={currentPage === totalPages}
          className="btn btn-ghost btn-sm"
        >
          Next
        </button>
        <button 
          onClick={() => goToPage(totalPages)} 
          disabled={currentPage === totalPages}
          className="btn btn-ghost btn-sm"
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default AttendanceLogs;
