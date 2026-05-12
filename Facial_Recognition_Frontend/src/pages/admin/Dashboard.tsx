 import { useAuth } from '../../contexts/AuthContext';
import { 
  Clock, 
  AlertTriangle, 
  Shield, 
  LogIn,
  LogOut
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { securityAlertService, SecurityAlert } from '../../services/securityAlertService';
import { attendanceService } from '../../services/attendanceService';
import type { Attendance } from '../../types';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [newRecordIds, setNewRecordIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const previousIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Check every 5 seconds for real-time feel
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [alertsResult, recentResult] = await Promise.allSettled([
        securityAlertService.getRecentUnresolved(5),
        attendanceService.getTodayAttendance()
      ]);
      
      if (alertsResult.status === 'fulfilled') {
        setSecurityAlerts(alertsResult.value || []);
      } else {
        console.error('Error fetching security alerts:', alertsResult.reason);
        setSecurityAlerts([]);
      }
      
      if (recentResult.status === 'fulfilled') {
        const newData = recentResult.value || [];
        
        // Detect new records
        if (previousIdsRef.current.size > 0) {
          const newIds = new Set<number>();
          newData.forEach((record: Attendance) => {
            if (!previousIdsRef.current.has(record.id)) {
              newIds.add(record.id);
            }
          });
          
          if (newIds.size > 0) {
            setNewRecordIds(newIds);
            // Remove animation class after animation completes
            setTimeout(() => {
              setNewRecordIds(new Set());
            }, 1000);
          }
        }
        
        // Update previous IDs
        previousIdsRef.current = new Set(newData.map((r: Attendance) => r.id));
        
        // Sort by timestamp descending (most recent first)
        const sorted = [...newData].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setRecentAttendance(sorted);
      } else {
        console.error('Error fetching attendance:', recentResult.reason);
        setRecentAttendance([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (id: number) => {
    try {
      await securityAlertService.resolve(id);
      fetchDashboardData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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

  const getTimeAgo = (timestamp: Date | string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="dashboard-page">
      {/* Hero Welcome Section */}
      <div className="hero-welcome">
        <h1>Welcome back, {user?.name || 'admin'}</h1>
        <p>Here's what's happening with your system today</p>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Live Attendance */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={20} />
              <h3>Live Attendance</h3>
            </div>
            <span className="live-badge">
              <span className="pulse-dot"></span>
              Live
            </span>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="empty-state">
                <Clock size={48} />
                <p>Loading...</p>
              </div>
            ) : recentAttendance.length === 0 ? (
              <div className="empty-state">
                <Clock size={48} />
                <p>No records yet today</p>
                <span>Attendance will appear here as it's logged</span>
              </div>
            ) : (
              <div className="attendance-list">
                {recentAttendance.slice(0, 10).map((record) => (
                  <div 
                    key={record.id} 
                    className={`attendance-row ${newRecordIds.has(record.id) ? 'new-record' : ''}`}
                  >
                    <div className="attendance-user">
                      <div className="user-avatar">
                        {record.user_name?.charAt(0) || '?'}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{record.user_name || 'Unknown'}</div>
                        <div className="user-meta">
                          <span className="user-type">{record.user_type}</span>
                          {record.course_strand_dept && (
                            <>
                              <span className="separator">•</span>
                              <span className="user-dept">{record.course_strand_dept}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="attendance-details">
                      <span className={`attendance-badge ${record.attendance_type}`}>
                        {record.attendance_type === 'time-in' ? <LogIn size={14} /> : <LogOut size={14} />}
                        {record.attendance_type}
                      </span>
                      <div className="attendance-time">{formatTime(record.timestamp)}</div>
                      <div className="time-ago">{getTimeAgo(record.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security Alerts */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-title">
              <Shield size={20} />
              <h3>Security Alerts</h3>
            </div>
            {securityAlerts.length > 0 && (
              <span className="alert-badge">{securityAlerts.length}</span>
            )}
          </div>

          <div className="card-body">
            {loading ? (
              <div className="empty-state">
                <Shield size={48} />
                <p>Loading alerts...</p>
              </div>
            ) : securityAlerts.length === 0 ? (
              <div className="empty-state empty-success">
                <Shield size={48} />
                <p>No Active Alerts</p>
                <span>All systems secure</span>
              </div>
            ) : (
              <div className="alerts-list">
                {securityAlerts.map((alert) => (
                  <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
                    <div className="alert-header">
                      <div className="alert-title">
                        <AlertTriangle size={16} />
                        <span>{alert.alert_type}</span>
                      </div>
                      <span className="camera-label">{alert.camera_type.toUpperCase()}</span>
                    </div>
                    <p className="alert-description">{alert.ai_analysis}</p>
                    {alert.image_path && (
                      <div className="alert-image">
                        <img 
                          src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/security-alert-images/${alert.image_path}`}
                          alt="Alert"
                          onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />
                      </div>
                    )}
                    <div className="alert-footer">
                      <span className="alert-timestamp">{formatTimestamp(alert.created_at)}</span>
                      <button 
                        className="btn-resolve"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
