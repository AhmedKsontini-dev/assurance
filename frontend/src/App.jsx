import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
import './App.css';
import './pages/Renewal.css';

const AppLayout = ({ children }) => {
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState('');

  useEffect(() => {
    const handleUnauthorized = (e) => {
      setDeniedMessage(e.detail.message || "Vous n'avez pas la permission d'effectuer cette action.");
      setShowAccessDenied(true);
    };

    window.addEventListener('unauthorized-action', handleUnauthorized);
    return () => window.removeEventListener('unauthorized-action', handleUnauthorized);
  }, []);

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-layout">
        <Sidebar />
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
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
            <Route path="/alerts" element={<AppLayout><Alerts /></AppLayout>} />
            <Route path="/calendar" element={<AppLayout><CalendarPage /></AppLayout>} />
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
  );
}

export default App;
