import { useState, useEffect, useRef } from 'react';
import { UserPlus, Download, Edit, Archive, Trash2, Search, X, Camera, Video, CreditCard } from 'lucide-react';
import Modal from './Modal';
import { userService } from '../services/userService';
import { guestService } from '../services/guestService';
import { moderatorService } from '../services/moderatorService';
import { faceImageService } from '../services/faceImageService';
import { metadataService } from '../services/metadataService';
import type { CollegeUser, ShsUser, FacultyUser, Guest, Moderator, Course, Year, Strand, Grade, Department } from '../types';
import './UserManagement.css';

type User = CollegeUser | ShsUser | FacultyUser | Guest | Moderator;

interface UserManagementProps {
  userType: 'college' | 'shs' | 'faculty' | 'guests' | 'moderators';
}

const UserManagement = ({ userType }: UserManagementProps) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('');
  const [selectedVisitDate, setSelectedVisitDate] = useState('');
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
  const [isScanning, setIsScanning] = useState(false);
  
  // Face capture states
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [captureCount, setCaptureCount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const TARGET_FRAMES = 50;
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // New user form data
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    middleInitial: '',
    username: '',
    password: '',
    email: '',
    studentId: '',
    employeeId: '',
    courseOrStrandOrDept: '',
    yearOrGrade: '',
    contactNumber: '',
    purpose: '',
  });
  
  // Metadata for dropdowns
  const [courses, setCourses] = useState<Course[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * recordsPerPage;
      const filters: any = {
        search: searchQuery || undefined,
        purpose: selectedPurpose || undefined,
        visit_date: selectedVisitDate || undefined,
      };

      // Add user-type specific filters
      if (userType === 'college') {
        filters.course_id = selectedFilter ? parseInt(selectedFilter) : undefined;
        filters.year_id = selectedYear ? parseInt(selectedYear) : undefined;
      } else if (userType === 'shs') {
        filters.strand_id = selectedFilter ? parseInt(selectedFilter) : undefined;
        filters.grade_id = selectedYear ? parseInt(selectedYear) : undefined;
      } else if (userType === 'faculty') {
        filters.department_id = selectedFilter ? parseInt(selectedFilter) : undefined;
      }

      let response;
      
      if (userType === 'college') {
        response = await userService.college.getAll(recordsPerPage, offset, filters);
      } else if (userType === 'shs') {
        response = await userService.shs.getAll(recordsPerPage, offset, filters);
      } else if (userType === 'faculty') {
        response = await userService.faculty.getAll(recordsPerPage, offset, filters);
      } else if (userType === 'guests') {
        response = await guestService.getAll(recordsPerPage, offset, filters);
      } else if (userType === 'moderators') {
        response = await moderatorService.getAll(recordsPerPage, offset);
      }

      if (response) {
        const data = userType === 'guests' ? response.guests : userType === 'moderators' ? response.moderators : response.users;
        setUsers(data || []);
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
  }, [userType, currentPage, searchQuery, selectedFilter, selectedYear, selectedPurpose, selectedVisitDate]);
  
  // Fetch metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [coursesData, yearsData, strandsData, gradesData, departmentsData] = await Promise.all([
          metadataService.getCourses(),
          metadataService.getYears(),
          metadataService.getStrands(),
          metadataService.getGrades(),
          metadataService.getDepartments(),
        ]);
        setCourses(coursesData);
        setYears(yearsData);
        setStrands(strandsData);
        setGrades(gradesData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      }
    };
    fetchMetadata();
  }, []);
  
  // Cleanup video stream and intervals on unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [videoStream]);
  
  // Handle video stream binding
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
      videoRef.current.play().catch(err => console.log("Auto-play failed:", err));
    }
  }, [videoStream]);

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
      } else if (userType === 'faculty') {
        await userService.faculty.exportToCSV(filters);
      } else if (userType === 'guests') {
        // For guests, we'll need to add this to guestService
        console.log('Guest CSV export not yet implemented');
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
    setSelectedPurpose('');
    setSelectedVisitDate('');
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
    switch (userType) {
      case 'college': return 'Course';
      case 'shs': return 'Strand';
      case 'faculty': return 'Department';
      default: return 'Filter';
    }
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
      } else if (userType === 'faculty') {
        const updateData: any = {
          email: (editingUser as FacultyUser).email,
          contact_number: (editingUser as FacultyUser).contact_number,
        };
        
        if ((editingUser as FacultyUser).name) {
          const nameParts = (editingUser as FacultyUser).name!.trim().split(' ');
          updateData.first_name = nameParts[0] || '';
          updateData.last_name = nameParts.slice(1).join(' ') || '';
        }
        
        if ((editingUser as FacultyUser).department_id) {
          updateData.department_id = parseInt((editingUser as FacultyUser).department_id!.toString());
        }
        
        await userService.faculty.update(editingUser.id, updateData);
      } else if (userType === 'guests') {
        const updateData: any = {
          name: (editingUser as Guest).name,
          purpose: (editingUser as Guest).purpose,
          contact_number: (editingUser as Guest).contact_number,
        };
        await guestService.update(editingUser.id, updateData);
      } else if (userType === 'moderators') {
        const updateData: any = {
          username: (editingUser as Moderator).username,
          email: (editingUser as Moderator).email,
        };
        await moderatorService.update(editingUser.id, updateData);
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
      if (field === 'name' && userType !== 'moderators' && userType !== 'guests') {
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
      } else if (userType === 'faculty') {
        await userService.faculty.delete(id);
      } else if (userType === 'guests') {
        await guestService.delete(id);
      } else if (userType === 'moderators') {
        await moderatorService.delete(id);
      }
      
      fetchUsers();
    } catch (error) {
      console.error('Error archiving user:', error);
      alert('Failed to archive user');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    
    try {
      if (userType === 'college') {
        await userService.college.permanentDelete(id);
      } else if (userType === 'shs') {
        await userService.shs.permanentDelete(id);
      } else if (userType === 'faculty') {
        await userService.faculty.permanentDelete(id);
      } else if (userType === 'guests') {
        await guestService.permanentDelete(id);
      } else if (userType === 'moderators') {
        await moderatorService.permanentDelete(id);
      }
      
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleBulkArchive = async () => {
    if (!confirm(`Are you sure you want to archive ${selectedUsers.length} user(s)?`)) return;
    
    try {
      if (userType === 'college') {
        await userService.college.bulkArchive(selectedUsers);
      } else if (userType === 'shs') {
        await userService.shs.bulkArchive(selectedUsers);
      } else if (userType === 'faculty') {
        await userService.faculty.bulkArchive(selectedUsers);
      } else if (userType === 'guests') {
        await guestService.bulkArchive(selectedUsers);
      } else if (userType === 'moderators') {
        await moderatorService.bulkArchive(selectedUsers);
      }
      
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk archiving users:', error);
      alert('Failed to archive users');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) return;
    
    try {
      if (userType === 'college') {
        await userService.college.bulkDelete(selectedUsers);
      } else if (userType === 'shs') {
        await userService.shs.bulkDelete(selectedUsers);
      } else if (userType === 'faculty') {
        await userService.faculty.bulkDelete(selectedUsers);
      } else if (userType === 'guests') {
        await guestService.bulkDelete(selectedUsers);
      } else if (userType === 'moderators') {
        await moderatorService.bulkDelete(selectedUsers);
      }
      
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      alert('Failed to delete users');
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
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      setVideoStream(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      setVideoStream(stream);
      if (videoRef.current) {
        try {
          await videoRef.current.play();
        } catch (e) {
          console.log("Video play interrupted or failed, will retry on mount");
        }
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

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const beginCapturing = () => {
    if (!videoStream || !videoRef.current) return;

    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }

    setIsRecording(true);
    setCaptureCount(0);
    const frames: string[] = [];
    console.log('Starting face capture...');

    captureIntervalRef.current = setInterval(() => {
      if (frames.length >= TARGET_FRAMES) {
        stopCapturing(frames);
        return;
      }

      const frame = captureFrame();
      if (frame) {
        frames.push(frame);
        setCaptureCount(frames.length);
      }
    }, 100);
  };

  const stopCapturing = (frames: string[]) => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    console.log(`Face capture finished. Captured ${frames.length} frames.`);
    
    setIsRecording(prev => {
      if (prev) {
        setCapturedFrames(frames);
      }
      return false;
    });
  };

  const handleStartRecording = () => {
    if (!videoStream || !videoRef.current) return;

    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    setCapturedFrames([]);
    setCaptureCount(0);
    setIsRecording(false);
    setCountdown(3);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          beginCapturing();
          return null;
        }
        return prev! - 1;
      });
    }, 1000);
  };

  const handleAddUser = () => {
    setIsAddUserModalOpen(true);
    // Reset form and capture state
    setNewUserData({
      firstName: '',
      lastName: '',
      middleInitial: '',
      username: '',
      password: '',
      email: '',
      studentId: '',
      employeeId: '',
      courseOrStrandOrDept: '',
      yearOrGrade: '',
      contactNumber: '',
      purpose: '',
    });
    setCapturedFrames([]);
    setCaptureCount(0);
    setCountdown(null);
    
    // Only start camera for non-moderator user types
    if (userType !== 'moderators') {
      setTimeout(() => startCamera(), 100);
    }
  };

  const handleCloseAddUser = () => {
    stopCamera();
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsAddUserModalOpen(false);
    setIsRecording(false);
    setIsScanning(false);
    setCapturedFrames([]);
    setCaptureCount(0);
    setCountdown(null);
  };
  
  const handleNewUserInputChange = (field: string, value: string) => {
    setNewUserData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmitNewUser = async () => {
    // Validate face images for non-moderator users
    if (userType !== 'moderators' && (!capturedFrames || capturedFrames.length === 0)) {
      alert('Please capture face images before submitting');
      return;
    }
    
    // Validate required fields
    if (userType === 'moderators' && (!newUserData.username || !newUserData.password)) {
      alert('Username and password are required');
      return;
    }
    
    if (userType !== 'moderators' && (!newUserData.firstName || !newUserData.lastName || !newUserData.password)) {
      alert('First name, last name, and password are required');
      return;
    }

    setLoading(true);
    try {
      // 1. Create user in database
      if (userType === 'college') {
        await userService.college.create({
          first_name: newUserData.firstName,
          middle_initial: newUserData.middleInitial || undefined,
          last_name: newUserData.lastName,
          email: newUserData.email || undefined,
          contact_number: newUserData.contactNumber || undefined,
          student_id: newUserData.studentId,
          password: newUserData.password,
          course_id: parseInt(newUserData.courseOrStrandOrDept),
          year_id: parseInt(newUserData.yearOrGrade),
        });
      } else if (userType === 'shs') {
        await userService.shs.create({
          first_name: newUserData.firstName,
          middle_initial: newUserData.middleInitial || undefined,
          last_name: newUserData.lastName,
          email: newUserData.email || undefined,
          contact_number: newUserData.contactNumber || undefined,
          student_id: newUserData.studentId,
          password: newUserData.password,
          strand_id: parseInt(newUserData.courseOrStrandOrDept),
          grade_id: parseInt(newUserData.yearOrGrade),
        });
      } else if (userType === 'faculty') {
        await userService.faculty.create({
          first_name: newUserData.firstName,
          middle_initial: newUserData.middleInitial || undefined,
          last_name: newUserData.lastName,
          email: newUserData.email || undefined,
          contact_number: newUserData.contactNumber || undefined,
          password: newUserData.password,
          department_id: parseInt(newUserData.courseOrStrandOrDept),
        });
      } else if (userType === 'guests') {
        await guestService.create({
          name: `${newUserData.firstName} ${newUserData.lastName}`.trim(),
          purpose: newUserData.purpose,
          contact_number: newUserData.contactNumber || undefined,
        });
      } else if (userType === 'moderators') {
        await moderatorService.create({
          username: newUserData.username,
          password: newUserData.password,
          email: newUserData.email,
        });
      }

      // 2. Upload face images using FULL NAME (for non-moderators)
      if (userType !== 'moderators') {
        const fullName = `${newUserData.firstName} ${newUserData.middleInitial ? newUserData.middleInitial + ' ' : ''}${newUserData.lastName}`.trim();
        await faceImageService.uploadFaceImages(fullName, capturedFrames);
      }

      alert(`User added successfully! ${capturedFrames.length > 0 ? `${capturedFrames.length} face images captured.` : ''}`);
      handleCloseAddUser();
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add user. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleScanID = () => {
    setIsScanning(true);
    // TODO: Implement ID scanning logic
    console.log('Scanning ID...');
    setTimeout(() => {
      setIsScanning(false);
      // Mock data - replace with actual scanned data
      console.log('ID scanned successfully');
    }, 2000);
  };

  const getPageTitle = () => {
    switch (userType) {
      case 'college':    return { title: 'College Users',    subtitle: 'Manage college student accounts and face profiles.' };
      case 'shs':        return { title: 'SHS Users',        subtitle: 'Manage Senior High School student accounts and face profiles.' };
      case 'faculty':    return { title: 'Faculty Users',    subtitle: 'Manage faculty member accounts and face profiles.' };
      case 'guests':     return { title: 'Guests',           subtitle: 'Manage guest visitor accounts and access records.' };
      case 'moderators': return { title: 'Moderators',       subtitle: 'Manage moderator accounts and system access.' };
      default:           return { title: 'User Management',  subtitle: 'Manage user accounts and face profiles.' };
    }
  };

  return (
    <div className="user-management">
      {/* Page Title */}
      <div className="page-title-block">
        <h2>{getPageTitle().title}</h2>
        <p className="page-subtitle">{getPageTitle().subtitle}</p>
      </div>

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
          {/* Show Course/Strand/Department filter for non-guest user types */}
          {userType !== 'guests' && userType !== 'moderators' && (
            <div className="filter-group">
              <label>Filter by {getFilterLabel()}</label>
              <select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)} className="form-select">
                <option value="">All {getFilterLabel()}s</option>
                {userType === 'college' && courses.map(course => (
                  <option key={course.id} value={course.id.toString()}>{course.name}</option>
                ))}
                {userType === 'shs' && strands.map(strand => (
                  <option key={strand.id} value={strand.id.toString()}>{strand.name}</option>
                ))}
                {userType === 'faculty' && departments.map(dept => (
                  <option key={dept.id} value={dept.id.toString()}>{dept.department_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Show Year/Grade filter for college and SHS */}
          {(userType === 'college' || userType === 'shs') && (
            <div className="filter-group">
              <label>Filter by {getYearLabel()}</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="form-select">
                <option value="">All {getYearLabel()}s</option>
                {userType === 'college' && years.map(year => (
                  <option key={year.id} value={year.id.toString()}>{year.year_name}</option>
                ))}
                {userType === 'shs' && grades.map(grade => (
                  <option key={grade.id} value={grade.id.toString()}>{grade.grade_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Show Purpose filter for guests */}
          {userType === 'guests' && (
            <div className="filter-group">
              <label>Filter by Purpose</label>
              <select value={selectedPurpose} onChange={(e) => setSelectedPurpose(e.target.value)} className="form-select">
                <option value="">All Purposes</option>
                <option value="Meeting">Meeting</option>
                <option value="Interview">Interview</option>
                <option value="Delivery">Delivery</option>
                <option value="Consultation">Consultation</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {/* Show Visit Date filter for guests */}
          {userType === 'guests' && (
            <div className="filter-group">
              <label>Filter by Visit Date</label>
              <input
                type="date"
                value={selectedVisitDate}
                onChange={(e) => setSelectedVisitDate(e.target.value)}
                className="form-input"
              />
            </div>
          )}

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
            <button className="btn btn-sm bulk-btn-error" onClick={handleBulkDelete}>
              <Trash2 size={16} />
              <span>Delete Selected</span>
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
              {(userType === 'college' || userType === 'shs') && <th>Student ID</th>}
              {userType === 'college' && <th>Course</th>}
              {userType === 'shs' && <th>Strand</th>}
              {userType === 'faculty' && <th>Department</th>}
              {(userType === 'college' || userType === 'shs') && <th>{getYearLabel()}</th>}
              {userType === 'guests' && <th>Purpose</th>}
              {userType === 'guests' && <th>Visit Date</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="loading-cell">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-cell">No users found</td>
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
                    {userType === 'moderators' && 'username' in user 
                      ? user.username 
                      : 'name' in user && user.name 
                        ? user.name 
                        : 'first_name' in user && 'last_name' in user
                          ? `${user.first_name} ${user.last_name}`
                          : 'N/A'}
                  </td>
                  <td>{'email' in user ? user.email : 'N/A'}</td>
                  {(userType === 'college' || userType === 'shs') && <td>{'student_id' in user ? user.student_id : 'N/A'}</td>}
                  {userType === 'college' && <td>{'course_name' in user ? user.course_name : 'N/A'}</td>}
                  {userType === 'shs' && <td>{'strand_name' in user ? user.strand_name : 'N/A'}</td>}
                  {userType === 'faculty' && <td>{'department_name' in user ? user.department_name : 'N/A'}</td>}
                  {(userType === 'college' || userType === 'shs') && <td>{'year_name' in user ? user.year_name : 'grade_name' in user ? user.grade_name : 'N/A'}</td>}
                  {userType === 'guests' && <td><span className="badge badge-secondary">{'purpose' in user ? user.purpose : 'N/A'}</span></td>}
                  {userType === 'guests' && <td>{'created_at' in user && user.created_at ? new Date(user.created_at as string | number | Date).toLocaleDateString() : 'N/A'}</td>}
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
                      <button 
                        className="btn-icon btn-icon-error" 
                        title="Delete"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 size={16} />
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
                  value={
                    userType === 'moderators' 
                      ? (editingUser as Moderator).username || '' 
                      : (editingUser as CollegeUser | ShsUser | FacultyUser | Guest).name || ''
                  }
                  onChange={(e) => handleInputChange(userType === 'moderators' ? 'username' : 'name', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={
                    userType === 'moderators'
                      ? (editingUser as Moderator).email || ''
                      : userType === 'guests'
                        ? ''
                        : (editingUser as CollegeUser | ShsUser | FacultyUser).email || ''
                  }
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="form-input"
                  disabled={userType === 'guests'}
                />
              </div>

              {(userType === 'college' || userType === 'shs') && (
                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <input
                    type="text"
                    value={(editingUser as CollegeUser | ShsUser).student_id || ''}
                    onChange={(e) => handleInputChange('student_id', e.target.value)}
                    className="form-input"
                  />
                </div>
              )}

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

              {userType === 'faculty' && (
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    value={'department_id' in editingUser ? editingUser.department_id || '' : ''}
                    onChange={(e) => handleInputChange('department_id', e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select Department</option>
                    <option value="1">Computer Science Department</option>
                    <option value="2">Business Administration Department</option>
                    <option value="3">Engineering Department</option>
                    <option value="4">Arts and Sciences Department</option>
                    <option value="5">Education Department</option>
                  </select>
                </div>
              )}

              {userType === 'guests' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Purpose</label>
                    <select
                      value={'purpose' in editingUser ? editingUser.purpose || '' : ''}
                      onChange={(e) => handleInputChange('purpose', e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select Purpose</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Interview">Interview</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Consultation">Consultation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Visit Date</label>
                    <input
                      type="date"
                      value={'created_at' in editingUser && editingUser.created_at ? new Date(editingUser.created_at as string | number | Date).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('created_at', e.target.value)}
                      className="form-input"
                    />
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
          <div className={`add-user-layout ${userType === 'moderators' ? 'no-camera' : ''}`}>
            {/* Left side - Camera (hidden for moderators) */}
            {userType !== 'moderators' && (
              <div className="camera-section">
                <div className="camera-container">
                  {countdown !== null && (
                    <div className="countdown-overlay">
                      <div className="countdown-number">{countdown}</div>
                    </div>
                  )}
                  
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    muted
                    className="camera-video"
                  />
                  
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  
                  {!videoStream && (
                    <div className="camera-placeholder">
                      <Camera size={48} />
                      <p>Camera will appear here</p>
                    </div>
                  )}
                  
                  {isRecording && (
                    <div className="recording-indicator">
                      <div className="recording-dot"></div>
                      <span>Capturing... {captureCount}/{TARGET_FRAMES}</span>
                    </div>
                  )}
                  
                  {captureCount > 0 && !isRecording && capturedFrames.length > 0 && (
                    <div className="capture-complete">
                      <span>✓ {captureCount} frames captured</span>
                    </div>
                  )}
                </div>
                <div className="camera-controls">
                  {capturedFrames.length === 0 ? (
                    <button 
                      onClick={handleStartRecording}
                      className="btn btn-primary"
                      disabled={!videoStream || isRecording || countdown !== null}
                    >
                      <Video size={16} />
                      <span>{countdown !== null ? `Starting in ${countdown}...` : 'Start Capture'}</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleStartRecording}
                      className="btn btn-secondary"
                      disabled={isRecording || countdown !== null}
                    >
                      <Video size={16} />
                      <span>Recapture</span>
                    </button>
                  )}
                </div>
                <div className="camera-instructions">
                  <p>Position your face in the center</p>
                  <p>Ensure good lighting</p>
                  <p>Stay still for ~5 seconds ({TARGET_FRAMES} frames)</p>
                </div>
              </div>
            )}

            {/* Right side - Form */}
            <div className="form-section">
              <div className="form-grid">
                {userType !== 'moderators' && userType !== 'guests' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Enter first name"
                        value={newUserData.firstName}
                        onChange={(e) => handleNewUserInputChange('firstName', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Enter last name"
                        value={newUserData.lastName}
                        onChange={(e) => handleNewUserInputChange('lastName', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Middle Initial</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="M" 
                        maxLength={1}
                        value={newUserData.middleInitial}
                        onChange={(e) => handleNewUserInputChange('middleInitial', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {userType === 'guests' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Enter first name"
                        value={newUserData.firstName}
                        onChange={(e) => handleNewUserInputChange('firstName', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Enter last name"
                        value={newUserData.lastName}
                        onChange={(e) => handleNewUserInputChange('lastName', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {userType === 'moderators' && (
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Enter username"
                      value={newUserData.username}
                      onChange={(e) => handleNewUserInputChange('username', e.target.value)}
                    />
                  </div>
                )}

                {(userType === 'college' || userType === 'shs') && (
                  <div className="form-group">
                    <label className="form-label">Student ID *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Enter student ID"
                      value={newUserData.studentId}
                      onChange={(e) => handleNewUserInputChange('studentId', e.target.value)}
                    />
                  </div>
                )}

                {userType === 'faculty' && (
                  <div className="form-group">
                    <label className="form-label">Employee ID</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Enter employee ID"
                      value={newUserData.employeeId}
                      onChange={(e) => handleNewUserInputChange('employeeId', e.target.value)}
                    />
                  </div>
                )}

                {(userType === 'moderators' || userType !== 'guests') && (
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="Enter email"
                      value={newUserData.email}
                      onChange={(e) => handleNewUserInputChange('email', e.target.value)}
                    />
                  </div>
                )}

                {userType !== 'guests' && (
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="Enter password"
                      value={newUserData.password}
                      onChange={(e) => handleNewUserInputChange('password', e.target.value)}
                    />
                  </div>
                )}

                {userType === 'college' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Course *</label>
                      <select 
                        className="form-select"
                        value={newUserData.courseOrStrandOrDept}
                        onChange={(e) => handleNewUserInputChange('courseOrStrandOrDept', e.target.value)}
                      >
                        <option value="">Select Course</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id.toString()}>{course.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Year *</label>
                      <select 
                        className="form-select"
                        value={newUserData.yearOrGrade}
                        onChange={(e) => handleNewUserInputChange('yearOrGrade', e.target.value)}
                      >
                        <option value="">Select Year</option>
                        {years.map(year => (
                          <option key={year.id} value={year.id.toString()}>{year.year_name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {userType === 'shs' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Strand *</label>
                      <select 
                        className="form-select"
                        value={newUserData.courseOrStrandOrDept}
                        onChange={(e) => handleNewUserInputChange('courseOrStrandOrDept', e.target.value)}
                      >
                        <option value="">Select Strand</option>
                        {strands.map(strand => (
                          <option key={strand.id} value={strand.id.toString()}>{strand.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Grade *</label>
                      <select 
                        className="form-select"
                        value={newUserData.yearOrGrade}
                        onChange={(e) => handleNewUserInputChange('yearOrGrade', e.target.value)}
                      >
                        <option value="">Select Grade</option>
                        {grades.map(grade => (
                          <option key={grade.id} value={grade.id.toString()}>{grade.grade_name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {userType === 'faculty' && (
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select 
                      className="form-select"
                      value={newUserData.courseOrStrandOrDept}
                      onChange={(e) => handleNewUserInputChange('courseOrStrandOrDept', e.target.value)}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id.toString()}>{dept.department_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {userType === 'guests' && (
                  <>
                    <div className="form-group full-width">
                      <button 
                        type="button"
                        onClick={handleScanID}
                        className="btn btn-secondary scan-id-btn"
                        disabled={isScanning}
                      >
                        <CreditCard size={16} />
                        <span>{isScanning ? 'Scanning...' : 'Scan ID'}</span>
                      </button>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Purpose *</label>
                      <select 
                        className="form-select"
                        value={newUserData.purpose}
                        onChange={(e) => handleNewUserInputChange('purpose', e.target.value)}
                      >
                        <option value="">Select Purpose</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Interview">Interview</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Consultation">Consultation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>
                )}

                {userType !== 'moderators' && userType !== 'guests' && (
                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="09xxxxxxxxx"
                      value={newUserData.contactNumber}
                      onChange={(e) => handleNewUserInputChange('contactNumber', e.target.value)}
                      maxLength={11}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button onClick={handleCloseAddUser} className="btn btn-ghost">
              Cancel
            </button>
            <button 
              onClick={handleSubmitNewUser} 
              className="btn btn-primary"
              disabled={loading || (userType !== 'moderators' && capturedFrames.length === 0)}
            >
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
