import { ReactNode } from 'react';
import { Home, History, Bell, Settings } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

interface UserDashboardLayoutProps {
  children: ReactNode;
}

const UserDashboardLayout = ({ children }: UserDashboardLayoutProps) => {
  const navItems = [
    { path: '/user/dashboard', label: 'Dashboard', icon: <Home size={20} />, section: 'MAIN' },
    { path: '/user/attendance', label: 'Attendance History', icon: <History size={20} />, section: 'MAIN' },
    { path: '/user/notifications', label: 'Notifications', icon: <Bell size={20} />, section: 'MAIN' },
    { path: '/user/settings', label: 'Settings', icon: <Settings size={20} />, section: 'MAIN' },
  ];

  return (
    <DashboardLayout navItems={navItems} title="FaceTrack">
      {children}
    </DashboardLayout>
  );
};

export default UserDashboardLayout;
