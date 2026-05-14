import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../services/api';
import logo from '../assets/Logo CTAMA bleu.jpg';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [alertCount, setAlertCount] = useState(0);
  const [showAlertPreview, setShowAlertPreview] = useState(false);
  const [alertPreview, setAlertPreview] = useState([]);

  const fetchAlertCount = async () => {
    try {
      const res = await api.get('/alerts/count');
      setAlertCount(res.data.count);
    } catch (err) {
      // Silently fail - non-critical feature
    }
  };

  const fetchAlertPreview = async () => {
    try {
      const res = await api.get('/alerts?days=10');
      setAlertPreview(res.data.data.slice(0, 5));
    } catch (err) {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchAlertCount();

    const handleRefresh = () => {
      fetchAlertCount();
      // Also refresh preview if it's open
      if (showAlertPreview) {
        fetchAlertPreview();
      }
    };

    window.addEventListener('refresh-alerts', handleRefresh);

    // Refresh count every 2 minutes
    const interval = setInterval(fetchAlertCount, 2 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-alerts', handleRefresh);
    };
  }, [showAlertPreview]);

  const handleBellClick = () => {
    if (!showAlertPreview) {
      fetchAlertPreview();
    }
    setShowAlertPreview(!showAlertPreview);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDaysLabel = (days) => {
    if (days < 0) return `Expiré (${Math.abs(days)}j)`;
    if (days === 0) return "Aujourd'hui";
    return `${days}j restant(s)`;
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src={logo} alt="CTAMA Logo" style={{ height: '60px', borderRadius: '30px' }} />
        CTAMA
      </div>
      <div className="navbar-user">
        {/* Notification Bell */}
        <div className="navbar-notification-wrapper">
          <button className="notification-bell" onClick={handleBellClick} title="Alertes d'expiration">
            <Bell size={20} />
            {alertCount > 0 && (
              <span className="notification-badge animate-pulse-badge">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </button>

          {/* Alert Preview Dropdown */}
          {showAlertPreview && (
            <>
              <div className="alert-preview-backdrop" onClick={() => setShowAlertPreview(false)}></div>
              <div className="alert-preview-dropdown">
                <div className="alert-preview-header">
                  <h4>🔔 Alertes d'Expiration</h4>
                  <span className="alert-preview-count">{alertCount} active(s)</span>
                </div>
                <div className="alert-preview-list">
                  {alertPreview.length === 0 ? (
                    <div className="alert-preview-empty">
                      <span>✅</span>
                      <p>Aucune alerte</p>
                    </div>
                  ) : (
                    alertPreview.map(alert => (
                      <div key={alert.id} className={`alert-preview-item level-${alert.alert_level}`}>
                        <div className="alert-preview-dot"></div>
                        <div className="alert-preview-info">
                          <span className="alert-preview-name">{alert.societaire || 'Sans nom'}</span>
                          <span className="alert-preview-days">{getDaysLabel(alert.days_remaining)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link
                  to="/alerts"
                  className="alert-preview-footer"
                  onClick={() => setShowAlertPreview(false)}
                >
                  Voir toutes les alertes →
                </Link>
              </div>
            </>
          )}
        </div>

        <span>{user?.name}</span>
        <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
      </div>
    </nav>
  );
};

export default Navbar;
