import {
  Clock,
  AlertTriangle,
  Shield,
  LogIn,
  LogOut,
  Users,
  CalendarCheck,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { securityAlertService, SecurityAlert } from '../../services/securityAlertService';
import { attendanceService } from '../../services/attendanceService';
import type { Attendance } from '../../types';
import './Dashboard.css';

interface AttendanceStats {
  total: number;
  timeIn: number;
  timeOut: number;
  byUserType: { college: number; shs: number; faculty: number; guest: number };
}

const Dashboard = () => {
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [newRecordIds, setNewRecordIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const previousIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [alertsResult, recentResult, statsResult] = await Promise.allSettled([
        securityAlertService.getRecentUnresolved(5),
        attendanceService.getTodayAttendance(),
        attendanceService.getStats(),
      ]);

      if (alertsResult.status === 'fulfilled') setSecurityAlerts(alertsResult.value || []);
      else setSecurityAlerts([]);

      if (statsResult.status === 'fulfilled') setStats(statsResult.value);

      if (recentResult.status === 'fulfilled') {
        const newData = recentResult.value || [];

        if (previousIdsRef.current.size > 0) {
          const newIds = new Set<number>();
          newData.forEach((r: Attendance) => {
            if (!previousIdsRef.current.has(r.id)) newIds.add(r.id);
          });
          if (newIds.size > 0) {
            setNewRecordIds(newIds);
            setTimeout(() => setNewRecordIds(new Set()), 1000);
          }
        }

        previousIdsRef.current = new Set(newData.map((r: Attendance) => r.id));
        const sorted = [...newData].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setRecentAttendance(sorted);
      } else {
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

  const formatTime = (ts: Date | string) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const getTimeAgo = (ts: Date | string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const attendanceRate = stats
    ? stats.total > 0 ? Math.round((stats.timeIn / stats.total) * 100) : 0
    : null;

  const totalUsers = stats
    ? (stats.byUserType.college + stats.byUserType.shs + stats.byUserType.faculty + stats.byUserType.guest)
    : null;

  return (
    <div className="dashboard-page">

      {/* ── Stat Cards ── */}
      <div className="stat-cards-row">

        {/* Total Active Today */}
        <div className="stat-card stat-card-light">
          <div className="stat-card-body">
            <div>
              <p className="stat-card-label">Total Active Today</p>
              <h3 className="stat-card-value stat-gold">
                {loading ? '—' : (stats?.total ?? 0).toLocaleString()}
              </h3>
            </div>
            <div className="stat-card-icon stat-icon-gold">
              <Users size={24} />
            </div>
          </div>
          <div className="stat-card-footer">
            <span className="stat-trend-up">
              {loading ? '' : `${stats?.timeIn ?? 0} time-ins`}
            </span>
            <span className="stat-sub">&nbsp;·&nbsp;{loading ? '' : `${stats?.timeOut ?? 0} time-outs`}</span>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="stat-card stat-card-light">
          <div className="stat-card-body">
            <div>
              <p className="stat-card-label">Attendance Rate</p>
              <h3 className="stat-card-value stat-brown">
                {loading ? '—' : `${attendanceRate ?? 0}%`}
              </h3>
            </div>
            <div className="stat-card-icon stat-icon-brown">
              <CalendarCheck size={24} />
            </div>
          </div>
          <div className="stat-card-footer">
            <span className="stat-trend-neutral">
              {loading ? '' : `${totalUsers ?? 0} unique users`}
            </span>
            <span className="stat-sub">&nbsp;today</span>
          </div>
        </div>

        {/* Security Status */}
        <div className="stat-card stat-card-dark">
          <div className="stat-card-body">
            <div>
              <p className="stat-card-label-dark">Security Status</p>
              <h3 className="stat-card-value-dark">
                {securityAlerts.length === 0 ? 'Secure' : 'Alert'}
              </h3>
            </div>
            <div className="stat-card-icon stat-icon-dark">
              <ShieldCheck size={24} />
            </div>
          </div>
          <div className="stat-card-footer-dark">
            <span className={securityAlerts.length > 0 ? 'stat-trend-alert' : 'stat-trend-secure'}>
              {securityAlerts.length > 0 ? `${securityAlerts.length} active alert${securityAlerts.length > 1 ? 's' : ''}` : 'Active'}
            </span>
            <span className="stat-sub-dark">
              &nbsp;·&nbsp;AI engine running
            </span>
          </div>
        </div>

      </div>

      {/* ── Bento Grid: Live Feed + Alerts ── */}
      <div className="bento-grid">

        {/* Live Attendance — col-span 8 */}
        <div className="content-card card-feed">
          <div className="card-header">
            <div className="card-title">
              <Clock size={18} />
              <h3>Live Attendance</h3>
            </div>
            <span className="live-badge">
              <span className="pulse-dot" />
              Real-time
            </span>
          </div>

          <div className="card-table-wrap">
            {loading ? (
              <div className="empty-state"><Clock size={40} /><p>Loading…</p></div>
            ) : recentAttendance.length === 0 ? (
              <div className="empty-state">
                <Clock size={40} />
                <p>No records yet today</p>
                <span>Attendance will appear here as it's logged</span>
              </div>
            ) : (
              <table className="live-table">
                <thead>
                  <tr>
                    <th>Student / Staff</th>
                    <th>Group</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance.slice(0, 10).map(record => (
                    <tr key={record.id} className={newRecordIds.has(record.id) ? 'new-record' : ''}>
                      <td>
                        <div className="live-user">
                          <div className="live-avatar">
                            {record.user_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="live-name">{record.user_name || 'Unknown'}</p>
                            <p className="live-id">{record.user_type}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="group-chip">
                          {record.course_strand_dept || record.user_type || '—'}
                        </span>
                      </td>
                      <td className="live-time">{formatTime(record.timestamp)}</td>
                      <td>
                        <span className={`status-pill ${record.attendance_type === 'time-in' ? 'pill-in' : 'pill-out'}`}>
                          {record.attendance_type === 'time-in'
                            ? <><LogIn size={12} /> Time-In</>
                            : <><LogOut size={12} /> Time-Out</>}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Security Alerts — col-span 4, dark */}
        <div className="content-card card-alerts">
          <div className="card-header card-header-dark">
            <div className="card-title">
              <Shield size={18} className="alert-icon-pulse" />
              <h3>Security Alerts</h3>
            </div>
            {securityAlerts.length > 0 && (
              <span className="alert-count-badge">{securityAlerts.length}</span>
            )}
          </div>

          <div className="card-body-dark">
            {loading ? (
              <div className="empty-state-dark"><Shield size={40} /><p>Loading…</p></div>
            ) : securityAlerts.length === 0 ? (
              <div className="empty-state-dark empty-secure">
                <Shield size={40} />
                <p>No Active Alerts</p>
                <span>All systems secure</span>
              </div>
            ) : (
              <div className="alerts-list">
                {securityAlerts.map(alert => (
                  <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
                    <div className="alert-top">
                      <span className="alert-type-badge">{alert.alert_type}</span>
                      <span className="alert-time">{getTimeAgo(alert.created_at)}</span>
                    </div>

                    {alert.image_path && (
                      <div className="alert-img-wrap">
                        <img
                          src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/security-alert-images/${alert.image_path}`}
                          alt="Alert capture"
                          onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
                        />
                        <div className="alert-img-label">{alert.camera_type.toUpperCase()} Camera</div>
                      </div>
                    )}

                    <p className="alert-title-text">
                      <AlertTriangle size={14} />
                      {alert.alert_type === 'SPOOF' ? 'Non-Human Signature Detected' : 'Unauthorized Access Attempt'}
                    </p>
                    <p className="alert-desc" onClick={() => setSelectedAlert(alert)} style={{ cursor: 'pointer' }}>
                      {alert.ai_analysis}
                    </p>

                    <div className="alert-actions">
                      <span className="camera-chip">{alert.camera_type.toUpperCase()}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-view-analysis" onClick={() => setSelectedAlert(alert)}>
                          View Analysis
                        </button>
                        <button className="btn-resolve" onClick={() => handleResolveAlert(alert.id)}>
                          Resolve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── AI Analysis Modal ── */}
      {selectedAlert && (
        <div className="alert-modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="alert-modal" onClick={e => e.stopPropagation()}>
            <div className="alert-modal-header">
              <div className="alert-modal-title">
                <AlertTriangle size={16} />
                <span>{selectedAlert.alert_type === 'SPOOF' ? 'Non-Human Signature Detected' : 'Unauthorized Access Attempt'}</span>
                <span className="alert-type-badge" style={{ marginLeft: '0.5rem' }}>{selectedAlert.alert_type}</span>
              </div>
              <button className="alert-modal-close" onClick={() => setSelectedAlert(null)}>
                <X size={18} />
              </button>
            </div>

            {selectedAlert.image_path && (
              <div className="alert-modal-img">
                <img
                  src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/security-alert-images/${selectedAlert.image_path}`}
                  alt="Alert capture"
                  onError={e => ((e.target as HTMLImageElement).style.display = 'none')}
                />
                <div className="alert-img-label">{selectedAlert.camera_type.toUpperCase()} Camera</div>
              </div>
            )}

            <div className="alert-modal-body">
              <p className="alert-modal-meta">
                <span className="camera-chip">{selectedAlert.camera_type.toUpperCase()}</span>
                <span className="alert-time">{getTimeAgo(selectedAlert.created_at)}</span>
              </p>
              <p className="alert-modal-analysis">{selectedAlert.ai_analysis}</p>
            </div>

            <div className="alert-modal-footer">
              <button className="alert-modal-dismiss" onClick={() => setSelectedAlert(null)}>
                Dismiss
              </button>
              <button className="btn-resolve" onClick={() => { handleResolveAlert(selectedAlert.id); setSelectedAlert(null); }}>
                Mark as Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
