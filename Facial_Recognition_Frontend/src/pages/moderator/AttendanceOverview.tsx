import { useState, useEffect } from 'react';
import { Users, GraduationCap, TrendingUp, CheckCircle, Calendar, RefreshCw, BarChart3, Clock, PieChart as PieChartIcon, Award } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { attendanceService } from '../../services/attendanceService';
import { userService } from '../../services/userService';
import '../admin/AttendanceOverview.css';

const AttendanceOverview = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCourses: 0,
    totalRecords: 0,
    presentToday: 0,
    activeDays: 0,
    attendanceRate: 0
  });

  const refreshData = async () => {
    setLoading(true);
    try {
      // Fetch all attendance records to get total count
      const allAttendance = await attendanceService.getAll(1, 0);
      const todayAttendance = await attendanceService.getTodayAttendance();
      
      // Fetch total users count from college and SHS only (moderator access)
      const [collegeUsers, shsUsers] = await Promise.all([
        userService.college.getAll(1, 0),
        userService.shs.getAll(1, 0)
      ]);
      
      const totalUsers = 
        (collegeUsers.totalCount || 0) +
        (shsUsers.totalCount || 0);
      
      // Filter today's attendance to only count college and SHS users
      const collegeShsAttendance = todayAttendance.filter(
        (record: any) => record.user_type === 'college' || record.user_type === 'shs'
      );
      
      // Calculate attendance rate based on college and SHS users only
      const attendanceRate = totalUsers > 0 
        ? ((collegeShsAttendance.length / totalUsers) * 100).toFixed(1)
        : 0;
      
      // Fetch metadata for active courses (college courses + SHS strands)
      let activeCourses = 0;
      try {
        const [coursesRes, strandsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/metadata/courses`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch(`${import.meta.env.VITE_API_URL}/metadata/shs-strands`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        
        const coursesData = await coursesRes.json();
        const strandsData = await strandsRes.json();
        
        activeCourses = (coursesData.data?.length || 0) + (strandsData.data?.length || 0);
      } catch (error) {
        console.error('Error fetching metadata:', error);
      }
      
      setStats({
        totalUsers,
        activeCourses,
        totalRecords: allAttendance.totalCount || 0,
        presentToday: collegeShsAttendance.length,
        activeDays: 0, // TODO: Calculate from attendance records
        attendanceRate: Number(attendanceRate)
      });
    } catch (error) {
      console.error('Error fetching attendance overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Empty chart data - will be populated when backend analytics endpoints are available
  const monthlyData: any[] = [];
  const dailyData: any[] = [];
  const peakHoursData: any[] = [];
  const weeklyData: any[] = [];
  const topDaysData: any[] = [];

  const statCards = [
    {
      icon: Users,
      value: stats.totalUsers,
      label: 'Total Users',
      subtitle: 'All Registered',
      className: 'stat-gold'
    },
    {
      icon: GraduationCap,
      value: stats.activeCourses,
      label: 'Active Courses',
      subtitle: 'Available',
      className: 'stat-gold-light'
    },
    {
      icon: TrendingUp,
      value: stats.totalRecords.toLocaleString(),
      label: 'Total Records',
      subtitle: 'All Time',
      className: 'stat-brown-mid'
    },
    {
      icon: CheckCircle,
      value: stats.presentToday,
      label: 'Present Today',
      subtitle: 'Current Status',
      className: 'stat-brown-mid'
    },
    {
      icon: Calendar,
      value: stats.activeDays,
      label: 'Active Days',
      subtitle: 'This Semester',
      className: 'stat-brown-light'
    },
    {
      icon: TrendingUp,
      value: `${stats.attendanceRate}%`,
      label: 'Attendance Rate',
      subtitle: 'Overall Average',
      className: 'stat-gold-dark'
    }
  ];

  return (
    <div className="attendance-overview">
      {/* Refresh Button */}
      <div className="overview-header">
        <button onClick={refreshData} className="btn btn-primary btn-sm refresh-btn" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stat Cards Grid */}
      <div className="stats-grid">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className={`stat-card ${card.className}`}>
              <div className="stat-card-bg"></div>
              <div className="stat-card-content">
                <div className="stat-icon">
                  <Icon size={24} />
                </div>
                <h3 className="stat-value">{loading ? '...' : card.value}</h3>
                <p className="stat-label">{card.label}</p>
                <p className="stat-subtitle">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Row 1: Line and Bar Charts */}
        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-header">
              <div className="chart-title-group">
                <BarChart3 size={20} className="chart-icon" />
                <div>
                  <h3>Monthly Attendance Trend</h3>
                  <p>All Time Performance</p>
                </div>
              </div>
            </div>
            {monthlyData.length === 0 ? (
              <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <div style={{ textAlign: 'center' }}>
                  <BarChart3 size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                  <p>No attendance data available</p>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Start recording attendance to see trends</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorMonthMod" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '0.75rem' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" style={{ fontSize: '0.75rem' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }} 
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMonthMod)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div className="chart-title-group">
                <TrendingUp size={20} className="chart-icon" />
                <div>
                  <h3>Daily Attendance Trend</h3>
                  <p>Last 30 Days</p>
                </div>
              </div>
            </div>
            {dailyData.length === 0 ? (
              <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <div style={{ textAlign: 'center' }}>
                  <TrendingUp size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                  <p>No attendance data available</p>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Start recording attendance to see trends</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorDailyMod" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '0.75rem' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" style={{ fontSize: '0.75rem' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }} 
                    itemStyle={{ color: '#34d399' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDailyMod)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Row 2: Bar and Pie Charts */}
        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-header">
              <div className="chart-title-group">
                <Clock size={20} className="chart-icon" />
                <div>
                  <h3>Peak Hours Analysis</h3>
                  <p>Attendance by Hour</p>
                </div>
              </div>
            </div>
            {peakHoursData.length === 0 ? (
              <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <div style={{ textAlign: 'center' }}>
                  <Clock size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                  <p>No attendance data available</p>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Start recording attendance to see peak hours</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                  <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: '0.75rem' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" style={{ fontSize: '0.75rem' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }} 
                    cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {peakHoursData.map((entry, index) => {
                      const maxCount = Math.max(...peakHoursData.map(d => d.count));
                      const intensity = entry.count / maxCount;
                      const r = intensity > 0.5 ? 239 : Math.floor(16 + (intensity * 2) * (239 - 16));
                      const g = intensity > 0.5 ? Math.floor(185 - ((intensity - 0.5) * 2) * 117) : 185;
                      const b = intensity > 0.5 ? 68 : Math.floor(129 - (intensity * 2) * (129 - 68));
                      return <Cell key={`cell-${index}`} fill={`rgb(${r}, ${g}, ${b})`} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <div className="chart-title-group">
                <PieChartIcon size={20} className="chart-icon" />
                <div>
                  <h3>Weekly Attendance Pattern</h3>
                  <p>Distribution by Day</p>
                </div>
              </div>
            </div>
            {weeklyData.length === 0 ? (
              <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <div style={{ textAlign: 'center' }}>
                  <PieChartIcon size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                  <p>No attendance data available</p>
                  <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Start recording attendance to see patterns</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <defs>
                    {weeklyData.map((entry, index) => (
                      <linearGradient key={`grad-${index}`} id={`pieGradMod-${index}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={weeklyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {weeklyData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#pieGradMod-${index})`} style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }} 
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Row 3: Top Peak Days Table */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <div className="chart-title-group">
              <Award size={20} className="chart-icon" />
              <div>
                <h3>Top 10 Peak Attendance Days</h3>
                <p>Highest attendance records</p>
              </div>
            </div>
          </div>
          {topDaysData.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <Award size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <p>No attendance data available</p>
              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Start recording attendance to see top days</p>
            </div>
          ) : (
            <div className="top-days-table">
              <table>
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>ATTENDANCE COUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {topDaysData.map((day) => (
                    <tr key={day.rank}>
                      <td>{day.date}</td>
                      <td>
                        <span className={`rank-badge rank-${day.rank}`}>
                          #{day.rank} {day.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceOverview;
