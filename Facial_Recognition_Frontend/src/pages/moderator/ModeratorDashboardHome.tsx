import { useAuth } from '../../contexts/AuthContext';
import { Users, BarChart3, FileText, AlertTriangle, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { securityAlertService, SecurityAlert } from '../../services/securityAlertService';
import '../admin/Dashboard.css';

const ModeratorDashboardHome = () => {
  const { user } = useAuth();
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);

  useEffect(() => {
    fetchSecurityAlerts();
  }, []);

  const fetchSecurityAlerts = async () => {
    try {
      const alerts = await securityAlertService.getRecentUnresolved(5);
      setSecurityAlerts(alerts);
    } catch (error) {
      console.error('Error fetching security alerts:', error);
    }
  };

  const handleResolveAlert = async (id: number) => {
    try {
      await securityAlertService.resolve(id);
      fetchSecurityAlerts(); // Refresh the list
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

      {/* Security Alerts Section */}
      {securityAlerts.length > 0 && (
        <div className="security-alerts-section">
          <div className="section-header">
            <div className="section-title">
              <Shield size={24} className="section-icon" />
              <h3>Recent Security Alerts</h3>
            </div>
            <span className="alert-count">{securityAlerts.length} Unresolved</span>
          </div>
          
          <div className="alerts-list">
            {securityAlerts.map((alert) => (
              <div key={alert.id} className={`alert-card severity-${alert.severity}`}>
                <div className="alert-header">
                  <div className="alert-type">
                    <AlertTriangle size={20} />
                    <span>{alert.alert_type}</span>
                  </div>
                  <div className="alert-meta">
                    <span className="camera-badge">{alert.camera_type.toUpperCase()}</span>
                    <span className="alert-time">{formatTimestamp(alert.created_at)}</span>
                  </div>
                </div>
                
                <div className="alert-content">
                  <p className="ai-analysis">
                    🚨 <strong>[SECURITY AI ANALYST] - ALERT: {alert.alert_type} ({alert.camera_type.toUpperCase()})</strong>
                  </p>
                  <p className="ai-analysis-text">{alert.ai_analysis}</p>
                  
                  {/* Display captured image if available */}
                  {alert.image_path && (
                    <div className="alert-image-container">
                      <img 
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/security-alert-images/${alert.image_path}`}
                        alt="Security Alert Capture"
                        className="alert-image"
                        onError={(e) => {
                          // Hide image if it fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="alert-actions">
                  <button 
                    className="btn-resolve"
                    onClick={() => handleResolveAlert(alert.id)}
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
