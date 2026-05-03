import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CollegeDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>College Student Portal</h1>
        <div>
          <span>Welcome, {user?.name || 'Student'}</span>
          <button onClick={logout} className="btn btn-outline btn-sm" style={{ marginLeft: '1rem' }}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <Routes>
          <Route index element={<CollegeHome />} />
        </Routes>
      </div>
    </div>
  );
};

const CollegeHome = () => {
  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div className="card">
        <div className="card-body">
          <h2>My Dashboard</h2>
          <p>View your attendance and profile information</p>
        </div>
      </div>
    </div>
  );
};

export default CollegeDashboard;
