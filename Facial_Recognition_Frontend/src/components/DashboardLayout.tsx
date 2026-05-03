import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import './DashboardLayout.css';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  section?: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
}

const DashboardLayout = ({ children, navItems, title }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get current page title from navItems based on current path
  const currentPage = navItems.find(item => item.path === location.pathname);
  const pageTitle = currentPage?.label || 'Dashboard';

  // Group nav items by section
  const sections: { [key: string]: NavItem[] } = {};
  navItems.forEach(item => {
    const sectionName = item.section || '';
    if (!sections[sectionName]) {
      sections[sectionName] = [];
    }
    sections[sectionName].push(item);
  });

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>{title}</h2>
        </div>
        
        <nav className="sidebar-nav">
          {Object.entries(sections).map(([sectionName, items]) => (
            <div key={sectionName} className="nav-section">
              {sectionName && <div className="nav-section-title">{sectionName}</div>}
              {items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name-sidebar">{user?.name || 'User'}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn-sidebar">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Top Bar */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <h1>{pageTitle}</h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
