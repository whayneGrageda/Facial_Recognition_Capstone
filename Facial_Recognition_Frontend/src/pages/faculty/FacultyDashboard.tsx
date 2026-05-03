import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const FacultyDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Faculty Portal</h1>
        <div>
          <span>Welcome, {user?.name || 'Faculty'}</span>
          <button onClick={logout} className="btn btn-outline btn-sm" style={{ marginLeft: '1rem' }}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <Routes>
          <Route index element={<FacultyHome />} />
        </Routes>
      </div>
    </div>
  );
};

const FacultyHome = () => {
  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div className="card">
        <div className="card-body">
          <h2>My Dashboard</h2>
          <p>View your department and attendance information</p>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
