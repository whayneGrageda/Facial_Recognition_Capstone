import { useState, useEffect } from 'react';
import { RefreshCw, RotateCcw, Search, X } from 'lucide-react';
import { userService } from '../../services/userService';
import { guestService } from '../../services/guestService';
import type { CollegeUser, ShsUser, FacultyUser, Guest } from '../../types';
import '../admin/Archives.css';

type ArchivedUser = (CollegeUser | ShsUser | FacultyUser | Guest) & {
  archived_date?: string;
  archived_at?: string;
};

type UserType = 'college' | 'shs' | 'faculty' | 'guests';

const ModeratorArchives = () => {
  const [activeTab, setActiveTab] = useState<UserType>('college');
  const [loading, setLoading] = useState(false);
  const [archivedUsers, setArchivedUsers] = useState<ArchivedUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const tabs = [
    { id: 'college' as UserType, label: 'College Users', count: 0 },
    { id: 'shs' as UserType, label: 'SHS Users', count: 0 },
    { id: 'faculty' as UserType, label: 'Faculty Users', count: 0 },
    { id: 'guests' as UserType, label: 'Guests', count: 0 },
  ];

  const fetchArchivedUsers = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * recordsPerPage;
      const filters = {
        search: searchQuery || undefined,
        course_id: selectedCourse ? parseInt(selectedCourse) : undefined,
        strand_id: selectedCourse ? parseInt(selectedCourse) : undefined,
        department_id: selectedCourse ? parseInt(selectedCourse) : undefined,
        year_id: selectedYear ? parseInt(selectedYear) : undefined,
      };

      let data: any[] = [];
      let total = 0;
      
      if (activeTab === 'college') {
        const response = await userService.college.getArchived(recordsPerPage, offset, filters);
        data = response.users || [];
        total = response.totalCount || 0;
      } else if (activeTab === 'shs') {
        const response = await userService.shs.getArchived(recordsPerPage, offset, filters);
        data = response.users || [];
        total = response.totalCount || 0;
      } else if (activeTab === 'faculty') {
        const response = await userService.faculty.getArchived(recordsPerPage, offset, filters);
        data = response.users || [];
        total = response.totalCount || 0;
      } else if (activeTab === 'guests') {
        const response = await guestService.getArchived(recordsPerPage, offset, filters);
        data = response.guests || [];
        total = response.totalCount || 0;
      }

      setArchivedUsers(data);
      setTotalCount(total);
    } catch (error) {
      console.error('Error fetching archived users:', error);
      setArchivedUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedUsers();
    setCurrentPage(1);
    setSelectedUsers([]);
  }, [activeTab]);

  useEffect(() => {
    fetchArchivedUsers();
  }, [currentPage, searchQuery, selectedCourse, selectedYear]);

  const clearFilters = () => {
    setSelectedCourse('');
    setSelectedYear('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const toggleSelectUser = (id: number) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === archivedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(archivedUsers.map(u => u.id));
    }
  };

  // Pagination
  const totalPages = Math.ceil(totalCount / recordsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getFilterLabel = () => {
    switch (activeTab) {
      case 'college': return 'Course';
      case 'shs': return 'Strand';
      case 'faculty': return 'Department';
      default: return 'Filter';
    }
  };

  const handleRestore = async (userId: number) => {
    if (!confirm('Are you sure you want to restore this user?')) return;
    
    try {
      if (activeTab === 'college') {
        await userService.college.restore(userId);
      } else if (activeTab === 'shs') {
        await userService.shs.restore(userId);
      } else if (activeTab === 'faculty') {
        await userService.faculty.restore(userId);
      } else if (activeTab === 'guests') {
        await guestService.restore(userId);
      }
      
      fetchArchivedUsers();
    } catch (error) {
      console.error('Error restoring user:', error);
      alert('Failed to restore user');
    }
  };

  const handleBulkRestore = async () => {
    if (!confirm(`Are you sure you want to restore ${selectedUsers.length} user(s)?`)) return;
    
    try {
      if (activeTab === 'college') {
        await userService.college.bulkRestore(selectedUsers);
      } else if (activeTab === 'shs') {
        await userService.shs.bulkRestore(selectedUsers);
      } else if (activeTab === 'faculty') {
        await userService.faculty.bulkRestore(selectedUsers);
      } else if (activeTab === 'guests') {
        await guestService.bulkRestore(selectedUsers);
      }
      
      setSelectedUsers([]);
      fetchArchivedUsers();
    } catch (error) {
      console.error('Error bulk restoring users:', error);
      alert('Failed to restore users');
    }
  };

  return (
    <div className="archives-page">
      {/* Header */}
      <div className="archives-header">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>System Online</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchArchivedUsers}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Archives Management Card */}
      <div className="archives-card">
        <div className="card-header">
          <h2>Archives Management</h2>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className="tab-badge">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="filters-container">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Search</label>
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input search-input"
                />
              </div>
            </div>

            {activeTab !== 'guests' && (
              <div className="filter-group">
                <label>{getFilterLabel()}</label>
                <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="form-select">
                  <option value="">All {getFilterLabel()}s</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>
            )}

            {(activeTab === 'college' || activeTab === 'shs') && (
              <div className="filter-group">
                <label>Year</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="form-select">
                  <option value="">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            )}
          </div>

          <button onClick={clearFilters} className="btn btn-ghost btn-sm clear-filters-btn">
            <X size={16} />
            <span>Clear Filters</span>
          </button>
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="bulk-actions-bar">
            <span className="bulk-count">{selectedUsers.length} user(s) selected</span>
            <div className="bulk-actions">
              <button className="btn btn-sm bulk-btn-success" onClick={handleBulkRestore}>
                <RotateCcw size={16} />
                <span>Restore Selected</span>
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="table-container">
          <table className="archives-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === archivedUsers.length && archivedUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="checkbox"
                  />
                </th>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                {activeTab === 'college' && <th>Course</th>}
                {activeTab === 'shs' && <th>Strand</th>}
                {activeTab === 'faculty' && <th>Department</th>}
                {(activeTab === 'college' || activeTab === 'shs') && <th>Year</th>}
                <th>Archived Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="loading-cell">Loading...</td>
                </tr>
              ) : archivedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">No archived users found</td>
                </tr>
              ) : (
                archivedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="checkbox"
                      />
                    </td>
                    <td>{user.id}</td>
                    <td>{'name' in user ? user.name : 'N/A'}</td>
                    <td>{'email' in user ? user.email : 'N/A'}</td>
                    {activeTab === 'college' && <td>{'course_name' in user ? user.course_name : 'N/A'}</td>}
                    {activeTab === 'shs' && <td>{'strand_name' in user ? user.strand_name : 'N/A'}</td>}
                    {activeTab === 'faculty' && <td>{'department_name' in user ? user.department_name : 'N/A'}</td>}
                    {(activeTab === 'college' || activeTab === 'shs') && <td>{'year_name' in user ? user.year_name : 'grade_name' in user ? user.grade_name : 'N/A'}</td>}
                    <td>{user.archived_date || user.archived_at || 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon btn-icon-success" 
                          title="Restore"
                          onClick={() => handleRestore(user.id)}
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
        )}
      </div>
    </div>
  );
};

export default ModeratorArchives;
