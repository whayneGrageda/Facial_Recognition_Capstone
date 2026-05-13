import { useState, useEffect, useRef } from 'react';
import { UserPlus, Download, Edit, Archive, Search, X, Camera, Video } from 'lucide-react';
import Modal from './Modal';
import { userService } from '../services/userService';
import type { CollegeUser, ShsUser } from '../types';
import './UserManagement.css';

type User = CollegeUser | ShsUser;

interface ModeratorUserManagementProps {
  userType: 'college' | 'shs';
}

const ModeratorUserManagement = ({ userType }: ModeratorUserManagementProps) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isScheduleArchiveModalOpen, setIsScheduleArchiveModalOpen] = useState(false);
  const [archiveDate, setArchiveDate] = useState('');
  const [archiveTime, setArchiveTime] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * recordsPerPage;
      const filters = {
        search: searchQuery || undefined,
        course_id: selectedFilter ? parseInt(selectedFilter) : undefined,
        strand_id: selectedFilter ? parseInt(selectedFilter) : undefined,
        year_id: selectedYear ? parseInt(selectedYear) : undefined,
      };

      let response;
      
      if (userType === 'college') {
        response = await userService.college.getAll(recordsPerPage, offset, filters);
      } else if (userType === 'shs') {
        response = await userService.shs.getAll(recordsPerPage, offset, filters);
      }

      if (response) {
        setUsers(response.users || []);
        setTotalCount(response.totalCount || 0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userType, currentPage, searchQuery, selectedFilter, selectedYear]);

  const downloadCSV = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchQuery || undefined,
        course: selectedFilter || undefined,
        year: selectedYear || undefined,
      };
      
      if (userType === 'college') {
        await userService.college.exportToCSV(filters);
      } else if (userType === 'shs') {
        await userService.shs.exportToCSV(filters);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedFilter('');
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
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  // Pagination
  const totalPages = Math.ceil(totalCount / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, totalCount);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Get filter label based on user type
  const getFilterLabel = () => {
    return userType === 'college' ? 'Course' : 'Strand';
  };

  const getYearLabel = () => {
    return userType === 'shs' ? 'Grade' : 'Year';
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      if (userType === 'college') {
        const updateData: any = {
          email: (editingUser as CollegeUser).email,
          contact_number: (editingUser as CollegeUser).contact_number,
          student_id: (editingUser as CollegeUser).student_id,
        };
        
        if ((editingUser as CollegeUser).name) {
          const nameParts = (editingUser as CollegeUser).name!.trim().split(' ');
          updateData.first_name = nameParts[0] || '';
          updateData.last_name = nameParts.slice(1).join(' ') || '';
        }
        
        if ((editingUser as CollegeUser).course_id) {
          updateData.course_id = parseInt((editingUser as CollegeUser).course_id!.toString());
        }
        if ((editingUser as CollegeUser).year_id) {
          updateData.year_id = parseInt((editingUser as CollegeUser).year_id!.toString());
        }
        
        await userService.college.update(editingUser.id, updateData);
      } else if (userType === 'shs') {
        const updateData: any = {
          email: (editingUser as ShsUser).email,
          contact_number: (editingUser as ShsUser).contact_number,
          student_id: (editingUser as ShsUser).student_id,
        };
        
        if ((editingUser as ShsUser).name) {
          const nameParts = (editingUser as ShsUser).name!.trim().split(' ');
          updateData.first_name = nameParts[0] || '';
          updateData.last_name = nameParts.slice(1).join(' ') || '';
        }
        
        if ((editingUser as ShsUser).strand_id) {
          updateData.strand_id = parseInt((editingUser as ShsUser).strand_id!.toString());
        }
        if ((editingUser as ShsUser).grade_id) {
          updateData.grade_id = parseInt((editingUser as ShsUser).grade_id!.toString());
        }
        
        await userService.shs.update(editingUser.id, updateData);
      }
      
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (editingUser) {
      // For name field, split it into first_name and last_name
      if (field === 'name') {
        const nameParts = value.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        setEditingUser({ 
          ...editingUser, 
          name: value,
          first_name: firstName,
          last_name: lastName
        } as User);
      } else {
        setEditingUser({ ...editingUser, [field]: value } as User);
      }
    }
  };

  const handleArchiveUser = async (id: number) => {
    if (!confirm('Are you sure you want to archive this user?')) return;
    
    try {
      if (userType === 'college') {
        await userService.college.delete(id);
      } else if (userType === 'shs') {
        await userService.shs.delete(id);
      }
      
      fetchUsers();
    } catch (error) {
      console.error('Error archiving user:', error);
      alert('Failed to archive user');
    }
  };

  const handleBulkArchive = async () => {
    if (!confirm(`Are you sure you want to archive ${selectedUsers.length} user(s)?`)) return;
    
    try {
      if (userType === 'college') {
        await userService.college.bulkArchive(selectedUsers);
      } else if (userType === 'shs') {
        await userService.shs.bulkArchive(selectedUsers);
      }
      
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk archiving users:', error);
      alert('Failed to archive users');
    }
  };

  const handleScheduleArchive = () => {
    // TODO: Implement schedule archive logic with backend
    console.log('Scheduling archive for:', selectedUsers, 'on date:', archiveDate, 'at time:', archiveTime);
    setIsScheduleArchiveModalOpen(false);
    setArchiveDate('');
    setArchiveTime('');
    setSelectedUsers([]);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // TODO: Implement actual recording logic
    console.log('Started recording...');
  };

  const handleSaveRecording = () => {
    setIsRecording(false);
    // TODO: Implement save recording logic
    console.log('Saving recording...');
  };

  const handleAddUser = () => {
    setIsAddUserModalOpen(true);
    setTimeout(() => startCamera(), 100);
  };

  const handleCloseAddUser = () => {
    stopCamera();
    setIsAddUserModalOpen(false);
    setIsRecording(false);
  };

  return (
    <div className="user-management">
      {/* Header with Actions */}
      <div className="management-header">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>System Online</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary btn-sm" onClick={handleAddUser}>
            <UserPlus size={16} />
            <span>Add User</span>
          </button>
          <button onClick={downloadCSV} className="btn btn-secondary btn-sm">
            <Download size={16} />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Filter by {getFilterLabel()}</label>
            <select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)} className="form-select">
              <option value="">All {getFilterLabel()}s</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Computer Science">Computer Science</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Filter by {getYearLabel()}</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="form-select">
              <option value="">All {getYearLabel()}s</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Search</label>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by ID, email, name..."
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

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-count">{selectedUsers.length} user(s) selected</span>
          <div className="bulk-actions">
            <button className="btn btn-sm bulk-btn-warning" onClick={handleBulkArchive}>
              <Archive size={16} />
              <span>Archive Selected</span>
            </button>
            <button 
              className="btn btn-sm bulk-btn-schedule"
              onClick={() => setIsScheduleArchiveModalOpen(true)}
            >
              <Archive size={16} />
              <span>Schedule Archive</span>
            </button>
          </div>
        </div>
      )}

      {/* Records Count */}
      <div className="records-info">
        Showing {startIndex + 1} to {endIndex} of {totalCount} users
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={toggleSelectAll}
                  className="checkbox"
                />
              </th>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Student ID</th>
              {userType === 'college' && <th>Course</th>}
              {userType === 'shs' && <th>Strand</th>}
              <th>{getYearLabel()}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="loading-cell">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
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
                  <td>
                    {'name' in user && user.name 
                      ? user.name 
                      : 'first_name' in user && 'last_name' in user
                        ? `${user.first_name} ${user.last_name}`
                        : 'N/A'}
                  </td>
                  <td>{'email' in user ? user.email : 'N/A'}</td>
                  <td>{'student_id' in user ? user.student_id : 'N/A'}</td>
                  {userType === 'college' && <td>{'course_name' in user ? user.course_name : 'N/A'}</td>}
                  {userType === 'shs' && <td>{'strand_name' in user ? user.strand_name : 'N/A'}</td>}
                  <td>{'year_name' in user ? user.year_name : 'grade_name' in user ? user.grade_name : 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-icon-success" 
                        title="Edit"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon btn-icon-warning" 
                        title="Archive"
                        onClick={() => handleArchiveUser(user.id)}
                      >
                        <Archive size={16} />
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

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        title="Edit User"
        size="md"
      >
        {editingUser && (
          <div className="edit-user-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  value={(editingUser as CollegeUser | ShsUser).name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={(editingUser as CollegeUser | ShsUser).email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Student ID</label>
                <input
                  type="text"
                  value={(editingUser as CollegeUser | ShsUser).student_id || ''}
                  onChange={(e) => handleInputChange('student_id', e.target.value)}
                  className="form-input"
                />
              </div>

              {userType === 'college' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Course</label>
                    <select
                      value={'course_id' in editingUser ? editingUser.course_id || '' : ''}
                      onChange={(e) => handleInputChange('course_id', e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select Course</option>
                      <option value="1">Bachelor of Science in Computer Science</option>
                      <option value="2">Bachelor of Science in Information Technology</option>
                      <option value="3">Bachelor of Science in Business Administration</option>
                      <option value="4">Bachelor of Science in Accountancy</option>
                      <option value="5">Bachelor of Science in Engineering</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select
                      value={'year_id' in editingUser ? editingUser.year_id || '' : ''}
                      onChange={(e) => handleInputChange('year_id', e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </>
              )}

              {userType === 'shs' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Strand</label>
                    <select
                      value={'strand_id' in editingUser ? editingUser.strand_id || '' : ''}
                      onChange={(e) => handleInputChange('strand_id', e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select Strand</option>
                      <option value="1">STEM</option>
                      <option value="2">ABM</option>
                      <option value="3">HUMSS</option>
                      <option value="4">GAS</option>
                      <option value="5">TVL</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Grade</label>
                    <select
                      value={'grade_id' in editingUser ? editingUser.grade_id || '' : ''}
                      onChange={(e) => handleInputChange('grade_id', e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select Grade</option>
                      <option value="1">Grade 11</option>
                      <option value="2">Grade 12</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingUser(null);
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button onClick={handleSaveUser} className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Schedule Archive Modal */}
      <Modal
        isOpen={isScheduleArchiveModalOpen}
        onClose={() => {
          setIsScheduleArchiveModalOpen(false);
          setArchiveDate('');
        }}
        title="Schedule Archive"
        size="sm"
      >
        <div className="schedule-archive-form">
          <div className="schedule-info">
            <p className="schedule-count">
              You are scheduling <strong>{selectedUsers.length} user(s)</strong> for archiving.
            </p>
            <p className="schedule-description">
              Select a date when these users should be automatically archived. The system will archive them at midnight on the selected date.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Archive Date</label>
            <input
              type="date"
              value={archiveDate}
              onChange={(e) => setArchiveDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="form-input"
              placeholder="Select date"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Archive Time</label>
            <input
              type="time"
              value={archiveTime}
              onChange={(e) => setArchiveTime(e.target.value)}
              className="form-input"
              placeholder="Select time"
            />
          </div>

          <div className="modal-actions">
            <button
              onClick={() => {
                setIsScheduleArchiveModalOpen(false);
                setArchiveDate('');
                setArchiveTime('');
              }}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button 
              onClick={handleScheduleArchive} 
              className="btn bulk-btn-schedule"
              disabled={!archiveDate || !archiveTime}
            >
              Schedule Archive
            </button>
          </div>
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={handleCloseAddUser}
        title="Add New User"
        size="lg"
      >
        <div className="add-user-form">
          <div className="add-user-layout">
            {/* Left side - Camera */}
            <div className="camera-section">
              <div className="camera-container">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  className="camera-video"
                />
                {!videoStream && (
                  <div className="camera-placeholder">
                    <Camera size={48} />
                    <p>Camera will appear here</p>
                  </div>
                )}
              </div>
              <div className="camera-controls">
                {!isRecording ? (
                  <button 
                    onClick={handleStartRecording}
                    className="btn btn-primary"
                    disabled={!videoStream}
                  >
                    <Video size={16} />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleSaveRecording}
                    className="btn btn-secondary recording-btn"
                  >
                    <span className="recording-dot"></span>
                    <span>Save Recording</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right side - Form */}
            <div className="form-section">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-input" placeholder="Enter first name" />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-input" placeholder="Enter last name" />
                </div>

                <div className="form-group">
                  <label className="form-label">Middle Initial</label>
                  <input type="text" className="form-input" placeholder="M" maxLength={1} />
                </div>

                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input type="text" className="form-input" placeholder="Enter username" />
                </div>

                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <input type="text" className="form-input" placeholder="Enter student ID" />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" placeholder="Enter password" />
                </div>

                <div className="form-group">
                  <label className="form-label">{userType === 'college' ? 'Course' : 'Strand'}</label>
                  <select className="form-select">
                    <option value="">Select {userType === 'college' ? 'Course' : 'Strand'}</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{getYearLabel()}</label>
                  <select className="form-select">
                    <option value="">Select {getYearLabel()}</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select">
                    <option value="Student">Student (Default)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button onClick={handleCloseAddUser} className="btn btn-ghost">
              Cancel
            </button>
            <button className="btn btn-primary">
              Add User
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModeratorUserManagement;
