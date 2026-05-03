import { useAuth } from '../../contexts/AuthContext';
import { Users, BarChart3, FileText } from 'lucide-react';
import '../admin/Dashboard.css';

const ModeratorDashboardHome = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <span className="status-badge">System Online</span>
      </div>

      <div className="welcome-card">
        <div className="welcome-avatar">
          {user?.name?.charAt(0) || 'M'}
        </div>
        <div className="welcome-content">
          <h2>Welcome, <span className="highlight">{user?.name || 'Moderator'}!</span></h2>
          <p className="role-badge">Moderator</p>
        </div>
      </div>

      <div className="info-card">
        <div className="info-icon">
          <Users size={24} />
        </div>
        <div className="info-content">
          <h3>FaceTrack Management System</h3>
          <p>Welcome to your facial recognition attendance management platform. You have access to manage college and SHS users, monitor attendance, and view system analytics.</p>
        </div>
      </div>

      <div className="quick-actions">
        <div className="action-card">
          <div className="action-icon" style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #8B6914 100%)' }}>
            <Users size={24} />
          </div>
          <h4>Manage Users</h4>
        </div>

        <div className="action-card">
          <div className="action-icon" style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #8B6914 100%)' }}>
            <BarChart3 size={24} />
          </div>
          <h4>View Analytics</h4>
        </div>

        <div className="action-card">
          <div className="action-icon" style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #8B6914 100%)' }}>
            <FileText size={24} />
          </div>
          <h4>Attendance Logs</h4>
        </div>
      </div>
    </div>
  );
};

export default ModeratorDashboardHome;
