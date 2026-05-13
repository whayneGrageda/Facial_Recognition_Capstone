import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Shared Pages
import LandingPage from './pages/shared/LandingPage';
import LoginPage from './pages/shared/LoginPage';
import ForgotPasswordPage from './pages/shared/ForgotPasswordPage';
import RegisterPage from './pages/shared/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Moderator Pages
import ModeratorDashboard from './pages/moderator/ModeratorDashboard';

// User Pages (College, SHS, Faculty)
import UserDashboardLayout from './pages/user/UserDashboardLayout';
import UserDashboard from './pages/user/UserDashboard';
import AttendanceHistory from './pages/user/AttendanceHistory';
import Notifications from './pages/user/Notifications';
import Settings from './pages/user/Settings';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // Redirect authenticated users away from the landing page to their dashboard
  const getHomePage = () => {
    if (!isAuthenticated) return <LandingPage />;
    const role = user?.role;
    if (role === 'admin')     return <Navigate to="/admin" replace />;
    if (role === 'moderator') return <Navigate to="/moderator" replace />;
    return <Navigate to="/user/dashboard" replace />;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        isAuthenticated
          ? <Navigate to={user?.role === 'admin' ? '/admin' : user?.role === 'moderator' ? '/moderator' : '/user/dashboard'} replace />
          : <LoginPage />
      } />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Moderator Routes */}
      <Route
        path="/moderator/*"
        element={
          <ProtectedRoute allowedRoles={['moderator']}>
            <ModeratorDashboard />
          </ProtectedRoute>
        }
      />

      {/* User Routes (College, SHS, Faculty) */}
      <Route
        path="/user/*"
        element={
          <ProtectedRoute allowedRoles={['student', 'faculty']}>
            <UserDashboardLayout>
              <Routes>
                <Route path="dashboard" element={<UserDashboard />} />
                <Route path="attendance" element={<AttendanceHistory />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
              </Routes>
            </UserDashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route path="/" element={getHomePage()} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
