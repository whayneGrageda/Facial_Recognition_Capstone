import { Routes, Route } from 'react-router-dom';
import { Home, BarChart3, FileText, Users, GraduationCap, Archive } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import ModeratorDashboardHome from './ModeratorDashboardHome';
import AttendanceOverview from './AttendanceOverview';
import AttendanceLogs from './AttendanceLogs';
import CollegeManagement from './CollegeManagement';
import ShsManagement from './ShsManagement';
import ModeratorArchives from './ModeratorArchives';

const ModeratorDashboard = () => {
  const navItems = [
    { path: '/moderator', label: 'Dashboard', icon: <Home size={20} />, section: 'MAIN' },
    { path: '/moderator/attendance-overview', label: 'Attendance Overview', icon: <BarChart3 size={20} />, section: 'MAIN' },
    { path: '/moderator/attendance-logs', label: 'Attendance Logs', icon: <FileText size={20} />, section: 'MAIN' },
    
    { path: '/moderator/college', label: 'College', icon: <Users size={20} />, section: 'GROUPS' },
    { path: '/moderator/shs', label: 'SHS', icon: <GraduationCap size={20} />, section: 'GROUPS' },
    
    { path: '/moderator/archives', label: 'Archives', icon: <Archive size={20} />, section: 'ADMIN' },
  ];

  return (
    <DashboardLayout navItems={navItems} title="FaceTrack">
      <Routes>
        <Route index element={<ModeratorDashboardHome />} />
        <Route path="attendance-overview" element={<AttendanceOverview />} />
        <Route path="attendance-logs" element={<AttendanceLogs />} />
        <Route path="college" element={<CollegeManagement />} />
        <Route path="shs" element={<ShsManagement />} />
        <Route path="archives" element={<ModeratorArchives />} />
      </Routes>
    </DashboardLayout>
  );
};

export default ModeratorDashboard;
