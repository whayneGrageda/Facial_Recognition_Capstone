import { useState, useEffect } from 'react';
import {
  Users, GraduationCap, TrendingUp, CheckCircle,
  RefreshCw, Download, TrendingDown
} from 'lucide-react';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { attendanceService } from '../../services/attendanceService';
import { userService } from '../../services/userService';
import { guestService } from '../../services/guestService';
import { moderatorService } from '../../services/moderatorService';
import './AttendanceOverview.css';

// ── Heatmap data: 5 days × 12 hours (Mon–Fri, 8a–7p)
// 0=none, 1=low, 2=mid, 3=high
const HEATMAP_DATA = [
  [0,0,2,3,3,2,0,0,0,0,0,0],
  [0,2,3,3,2,2,0,0,0,0,0,0],
  [0,0,2,3,3,2,0,0,0,0,0,0],
  [0,0,2,2,3,3,2,0,0,0,0,0],
  [0,0,0,2,2,2,0,0,0,0,0,0],
];
const HEATMAP_DAYS  = ['Mon','Tue','Wed','Thu','Fri'];
const HEATMAP_HOURS = ['8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p'];

const AttendanceOverview = () => {
  const [loading, setLoading]   = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0, activeCourses: 0, totalRecords: 0,
    presentToday: 0, activeDays: 0, attendanceRate: 0,
  });
  const [monthlyData, setMonthlyData]   = useState<any[]>([]);
  const [peakHoursData, setPeakHoursData] = useState<any[]>([]);
  const [topDaysData, setTopDaysData]   = useState<any[]>([]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [allAtt, todayAtt, monthly, daily, peakHours] = await Promise.all([
        attendanceService.getAll(1, 0),
        attendanceService.getTodayAttendance(),
        attendanceService.getMonthlyTrends(),
        attendanceService.getDailyTrends(),
        attendanceService.getPeakHours(),
      ]);

      const [col, shs, fac, guests, mods] = await Promise.all([
        userService.college.getAll(1, 0),
        userService.shs.getAll(1, 0),
        userService.faculty.getAll(1, 0),
        guestService.getAll(1, 0),
        moderatorService.getAll(1, 0),
      ]);

      const totalUsers =
        (col.totalCount || 0) + (shs.totalCount || 0) +
        (fac.totalCount || 0) + (guests.totalCount || 0) + (mods.totalCount || 0);

      // Fix: count unique users present today (not raw record count)
      const uniqueUsersToday = new Set(todayAtt.map((r: any) => r.user_id)).size;
      const attendanceRate = totalUsers > 0
        ? Number(((uniqueUsersToday / totalUsers) * 100).toFixed(1)) : 0;

      let activeCourses = 0;
      try {
        const [cRes, sRes, dRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/metadata/courses`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
          fetch(`${import.meta.env.VITE_API_URL}/metadata/shs-strands`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
          fetch(`${import.meta.env.VITE_API_URL}/metadata/faculty-departments`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        ]);
        const [cd, sd, dd] = await Promise.all([cRes.json(), sRes.json(), dRes.json()]);
        activeCourses = (cd.data?.length || 0) + (sd.data?.length || 0) + (dd.data?.length || 0);
      } catch { /* ignore */ }

      setStats({ totalUsers, activeCourses, totalRecords: allAtt.totalCount || 0,
        presentToday: uniqueUsersToday, activeDays: daily.length, attendanceRate });

      setMonthlyData(monthly || []);
      setPeakHoursData(peakHours || []);

      setTopDaysData([...(daily || [])].sort((a,b) => b.count - a.count).slice(0,10).map((d,i) => ({
        rank: i+1, date: d.date, count: d.count,
      })));
    } catch (e) {
      console.error('Error fetching overview data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try { await attendanceService.exportAnalyticsToCSV(); }
    catch { alert('Failed to export. Please try again.'); }
    finally { setExporting(false); }
  };

  // Stat cards config
  const statCards = [
    { icon: Users,         value: stats.totalUsers.toLocaleString(), label: 'Total Users',    trend: '+2.4%', trendDir: 'up',   className: 'stat-gold',       sparks: [3,4,2,5,3,4,5] },
    { icon: GraduationCap, value: stats.activeCourses,               label: 'Active Courses', trend: 'Stable',trendDir: 'flat', className: 'stat-gold-light', sparks: [4,4,4,4,4,4,4] },
    { icon: TrendingUp,    value: stats.totalRecords.toLocaleString(),label: 'Total Records',  trend: '+12k',  trendDir: 'up',   className: 'stat-brown-mid',  sparks: [1,2,3,5,6,4,5] },
    { icon: CheckCircle,   value: `${stats.attendanceRate}%`,         label: 'Present Today',  trend: '-0.8%', trendDir: 'down', className: 'stat-success',    sparks: [5,5,5,4,5,5,5] },
  ];

  // Peak hours from data or fallback
  const peakHoursBars = peakHoursData.length > 0
    ? peakHoursData.slice(0, 3).map((d: any, i: number) => ({
        label: d.hour || `${8+i}:00 - ${9+i}:00`,
        pct: Math.round((d.count / Math.max(...peakHoursData.map((x:any) => x.count))) * 100),
        level: i === 0 ? 'high' : i === 1 ? 'medium' : 'low',
        levelLabel: i === 0 ? 'High' : i === 1 ? 'Medium' : 'Low',
      }))
    : [
        { label: '08:00 - 09:00', pct: 95, level: 'high',   levelLabel: 'High' },
        { label: '12:00 - 13:00', pct: 65, level: 'medium', levelLabel: 'Medium' },
        { label: '16:00 - 17:00', pct: 30, level: 'low',    levelLabel: 'Low' },
      ];

  const avgPresence = stats.attendanceRate || 92;

  return (
    <div className="attendance-overview">

      {/* ── Page Header ── */}
      <div className="overview-header">
        <div className="overview-header-left">
          <h2>Attendance Overview</h2>
          <p>Real-time biometric tracking and historical trend analysis.</p>
        </div>
        <div className="overview-actions">
          <button className="btn btn-secondary btn-sm" onClick={refreshData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            Refresh Data
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExportCSV} disabled={exporting}>
            <Download size={15} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stats-grid">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`stat-card ${card.className}`}>
              <div className="stat-card-content">
                <div className="stat-card-top">
                  <div className="stat-icon"><Icon /></div>
                  <span className={`stat-trend ${card.trendDir}`}>
                    {card.trendDir === 'up'   && <TrendingUp size={12} />}
                    {card.trendDir === 'down' && <TrendingDown size={12} />}
                    {card.trend}
                  </span>
                </div>
                <p className="stat-label">{card.label}</p>
                <h3 className="stat-value">{loading ? '—' : card.value}</h3>
                <div className="stat-sparkline">
                  {card.sparks.map((h, si) => (
                    <div
                      key={si}
                      className={`spark-bar ${si === card.sparks.length - 1 ? 'active' : ''}`}
                      style={{ height: `${(h / 5) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Row 1: Monthly Trends + Weekly Pattern ── */}
      <div className="ao-row-trends">

        {/* Monthly Trends */}
        <div className="ao-card">
          <div className="ao-card-body">
            <div className="ao-card-header">
              <h3 className="ao-card-title">Monthly Attendance Trends</h3>
              <div className="ao-card-legend">
                <span className="ao-legend-item">
                  <span className="ao-legend-dot" style={{ background: '#755b00' }} />
                  Current Month
                </span>
                <span className="ao-legend-item">
                  <span className="ao-legend-dot" style={{ background: '#d0c5b2' }} />
                  Last Month
                </span>
              </div>
            </div>
            {monthlyData.length === 0 ? (
              <div className="ao-empty" style={{ height: 260 }}>
                <TrendingUp size={40} />
                <p>No data yet</p>
                <span>Start recording attendance to see trends</span>
              </div>
            ) : (
              <div className="ao-trend-chart">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={monthlyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradMonth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#755b00" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#755b00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" vertical={false} />
                    <XAxis dataKey="month" stroke="#7e7665" style={{ fontSize: '0.75rem' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#7e7665" style={{ fontSize: '0.75rem' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '0.5rem', fontSize: '0.8125rem' }}
                      labelStyle={{ color: '#1a1c1c', fontWeight: 600 }}
                      itemStyle={{ color: '#755b00' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#755b00" strokeWidth={2} fill="url(#gradMonth)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Pattern Donut */}
        <div className="ao-card">
          <div className="ao-card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="ao-card-header">
              <h3 className="ao-card-title">Weekly Pattern</h3>
            </div>
            <div className="ao-donut-wrap">
              {/* SVG donut — time-in vs absent, two segments */}
              <div style={{ position: 'relative', width: 192, height: 192 }}>
                <svg width="192" height="192" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Track (absent) */}
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#eae2cd" strokeWidth="3" />
                  {/* Time-in segment */}
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#755b00" strokeWidth="3"
                    strokeDasharray={`${Math.min(avgPresence, 100)}, 100`} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: '#755b00', lineHeight: 1 }}>{avgPresence}%</span>
                  <span style={{ fontSize: '0.75rem', color: '#7e7665', marginTop: '0.25rem' }}>Present Today</span>
                </div>
              </div>
              <div className="ao-donut-legend">
                <span className="ao-donut-legend-item">
                  <span className="ao-donut-dot" style={{ background: '#755b00' }} />
                  Time-In ({stats.presentToday})
                </span>
                <span className="ao-donut-legend-item">
                  <span className="ao-donut-dot" style={{ background: '#eae2cd' }} />
                  Absent
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Heatmap + Peak Hours ── */}
      <div className="ao-row-heatmap">

        {/* Heatmap */}
        <div className="ao-card">
          <div className="ao-card-body">
            <div className="ao-card-header">
              <h3 className="ao-card-title">Peak Attendance Heatmap</h3>
              <div className="ao-heatmap-legend">
                <span>Low</span>
                <div className="ao-heatmap-legend-bar">
                  <div style={{ background: '#eae2cd' }} />
                  <div style={{ background: '#e6c364', opacity: 0.6 }} />
                  <div style={{ background: '#c9a84c' }} />
                  <div style={{ background: '#755b00' }} />
                </div>
                <span>High</span>
              </div>
            </div>
            <div className="ao-heatmap-grid-wrap">
              <div className="ao-heatmap-y">
                {HEATMAP_DAYS.map(d => (
                  <div key={d} className="ao-heatmap-y-label">{d}</div>
                ))}
              </div>
              <div className="ao-heatmap-right">
                {HEATMAP_DATA.map((row, ri) => (
                  <div key={ri} className="ao-heatmap-row">
                    {row.map((heat, ci) => (
                      <div key={ci} className={`ao-heatmap-cell heat-${heat}`} title={`${HEATMAP_DAYS[ri]} ${HEATMAP_HOURS[ci]}`} />
                    ))}
                  </div>
                ))}
                <div className="ao-heatmap-x">
                  {HEATMAP_HOURS.map(h => (
                    <span key={h} className="ao-heatmap-x-label">{h}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="ao-card">
          <div className="ao-card-body">
            <div className="ao-card-header">
              <h3 className="ao-card-title">Peak Hours</h3>
            </div>
            <div className="ao-peak-list">
              {peakHoursBars.map((item, i) => (
                <div key={i} className="ao-peak-item">
                  <div className="ao-peak-row">
                    <span className="ao-peak-label">{item.label}</span>
                    <span className={`ao-peak-level ${item.level}`}>{item.levelLabel}</span>
                  </div>
                  <div className="ao-peak-track">
                    <div className={`ao-peak-fill ${item.level}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top 10 Peak Attendance Days ── */}
      <div className="ao-card">
        <div className="ao-table-header">
          <h3>Top 10 Peak Attendance Days</h3>
        </div>
        <div className="ao-table-wrap">
          {topDaysData.length === 0 ? (
            <div className="ao-empty">
              <TrendingUp size={40} />
              <p>No data yet</p>
              <span>Start recording attendance to see top days</span>
            </div>
          ) : (
            <table className="ao-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Date</th>
                  <th>Total Attendees</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {topDaysData.map(day => {
                  const rankClass = day.rank === 1 ? 'r1' : day.rank === 2 ? 'r2' : day.rank === 3 ? 'r3' : 'rn';
                  const perfClass = day.rank <= 2 ? 'exceptional' : day.rank <= 5 ? 'above-avg' : 'normal';
                  const perfLabel = day.rank <= 2 ? 'Exceptional' : day.rank <= 5 ? 'Above Avg' : 'Normal';
                  return (
                    <tr key={day.rank}>
                      <td><span className={`ao-rank-circle ${rankClass}`}>{day.rank}</span></td>
                      <td style={{ fontWeight: 600 }}>{day.date}</td>
                      <td>{day.count?.toLocaleString()}</td>
                      <td><span className={`ao-perf-badge ${perfClass}`}>{perfLabel}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default AttendanceOverview;
