import { Routes, Route } from 'react-router-dom';
import { Home, BarChart3, FileText, Users, GraduationCap, UserCheck, UserPlus, Shield, Archive, BookOpen, Building2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import Dashboard from './Dashboard';
import AttendanceOverview from './AttendanceOverview';
import AttendanceLogs from './AttendanceLogs';
import CollegeManagement from './CollegeManagement';
import ShsManagement from './ShsManagement';
import FacultyManagement from './FacultyManagement';
import GuestsManagement from './GuestsManagement';
import ModeratorsManagement from './ModeratorsManagement';
import CoursesManagement from './CoursesManagement';
import StrandsManagement from './StrandsManagement';
import DepartmentsManagement from './DepartmentsManagement';
import Archives from './Archives';

const AdminDashboard = () => {
  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <Home size={20} />, section: 'MAIN' },
    { path: '/admin/attendance-overview', label: 'Attendance Overview', icon: <BarChart3 size={20} />, section: 'MAIN' },
    { path: '/admin/attendance-logs', label: 'Attendance Logs', icon: <FileText size={20} />, section: 'MAIN' },
    
    { path: '/admin/college', label: 'College', icon: <Users size={20} />, section: 'GROUPS' },
    { path: '/admin/shs', label: 'SHS', icon: <GraduationCap size={20} />, section: 'GROUPS' },
    { path: '/admin/faculty', label: 'Faculty', icon: <UserCheck size={20} />, section: 'GROUPS' },
    { path: '/admin/guests', label: 'Guests', icon: <UserPlus size={20} />, section: 'GROUPS' },
    
    { path: '/admin/courses', label: 'Courses', icon: <BookOpen size={20} />, section: 'METADATA' },
    { path: '/admin/strands', label: 'Strands', icon: <GraduationCap size={20} />, section: 'METADATA' },
    { path: '/admin/departments', label: 'Departments', icon: <Building2 size={20} />, section: 'METADATA' },
    
    { path: '/admin/moderators', label: 'Moderators', icon: <Shield size={20} />, section: 'ADMIN' },
    { path: '/admin/archives', label: 'Archives', icon: <Archive size={20} />, section: 'ADMIN' },
  ];

  return (
    <DashboardLayout navItems={navItems} title="FaceTrack">
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="attendance-overview" element={<AttendanceOverview />} />
        <Route path="attendance-logs" element={<AttendanceLogs />} />
        <Route path="college" element={<CollegeManagement />} />
        <Route path="shs" element={<ShsManagement />} />
        <Route path="faculty" element={<FacultyManagement />} />
        <Route path="guests" element={<GuestsManagement />} />
        <Route path="courses" element={<CoursesManagement />} />
        <Route path="strands" element={<StrandsManagement />} />
        <Route path="departments" element={<DepartmentsManagement />} />
        <Route path="moderators" element={<ModeratorsManagement />} />
        <Route path="archives" element={<Archives />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AdminDashboard;
