import { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, ChevronDown } from 'lucide-react';
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsProfileOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

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
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Top Bar */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <h1>{today}</h1>
          </div>
          <div className="topbar-right">
            <div className="profile-dropdown" ref={dropdownRef}>
              <button 
                className="profile-button" 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="profile-avatar">
                  <User size={18} />
                </div>
                <span className="profile-name">{user?.name || 'User'}</span>
                <ChevronDown size={16} className={`chevron ${isProfileOpen ? 'open' : ''}`} />
              </button>
              
              {isProfileOpen && (
                <div className="profile-dropdown-menu">
                  <button className="dropdown-item" onClick={handleProfileClick}>
                    <User size={16} />
                    <span>My Profile</span>
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
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
