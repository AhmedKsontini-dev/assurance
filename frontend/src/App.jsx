import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import ProtectedRoute from './components/ProtectedRoute';
import AlertContainer from './components/AlertContainer';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Users from './pages/Users';
import Reports from './pages/Reports';
import EmployeeDetails from './pages/EmployeeDetails';
import Expenses from './pages/Expenses';
import Alerts from './pages/Alerts';
import CalendarPage from './pages/CalendarPage';
import Sinistres from './pages/Sinistres';
import SinistreForm from './pages/SinistreForm';
import SinistreDetails from './pages/SinistreDetails';
import './App.css';
import './pages/Renewal.css';

const AppLayout = ({ children }) => {
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState('');
  const location = useLocation();

  // Sidebar toggle state (desktop collapse)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Mobile drawer open state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sync collapse state with localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  useEffect(() => {
    const handleUnauthorized = (e) => {
      setDeniedMessage(e.detail.message || "Vous n'avez pas la permission d'effectuer cette action.");
      setShowAccessDenied(true);
    };

    window.addEventListener('unauthorized-action', handleUnauthorized);
    return () => window.removeEventListener('unauthorized-action', handleUnauthorized);
  }, []);

  return (
    <div className={`app-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Navbar toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} isMobileOpen={isMobileOpen} />
      <div className="main-layout">
        <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileOpen} toggleSidebar={toggleSidebar} />
        {isMobileOpen && (
          <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>
        )}
        <main className="main-content">
          {children}
        </main>
      </div>

      {/* Access Denied Modal */}
      {showAccessDenied && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content confirm-modal animate-pop">
            <div className="confirm-icon" style={{ fontSize: '4rem' }}>🚫</div>
            <h2 style={{ color: '#e74c3c' }}>Accès Refusé</h2>
            <p>{deniedMessage}</p>
            <div className="confirm-actions">
              <button className="confirm-delete-btn" onClick={() => setShowAccessDenied(false)}>J'ai compris</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <Router>
          <AlertContainer />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
              <Route path="/alerts" element={<AppLayout><Alerts /></AppLayout>} />
              <Route path="/calendar" element={<AppLayout><CalendarPage /></AppLayout>} />
              <Route path="/sinistres" element={<AppLayout><Sinistres /></AppLayout>} />
              <Route path="/sinistres/nouveau" element={<AppLayout><SinistreForm /></AppLayout>} />
              <Route path="/sinistres/modifier/:id" element={<AppLayout><SinistreForm /></AppLayout>} />
              <Route path="/sinistres/:id" element={<AppLayout><SinistreDetails /></AppLayout>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/users" element={<AppLayout><Users /></AppLayout>} />
              <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
              <Route path="/reports/employee/:id" element={<AppLayout><EmployeeDetails /></AppLayout>} />
              <Route path="/expenses" element={<AppLayout><Expenses /></AppLayout>} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </AlertProvider>
  );
}

export default App;
