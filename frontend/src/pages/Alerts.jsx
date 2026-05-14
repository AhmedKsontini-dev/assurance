import { useState, useEffect } from 'react';
import api from '../services/api';
import { AlertTriangle, Clock, Phone, User, Calendar, RefreshCw, Search } from 'lucide-react';
import RenewalModal from '../components/RenewalModal';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [renewingClient, setRenewingClient] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alerts?days=10');
      setAlerts(res.data.data);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Échec du chargement des alertes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (level) => {
    switch (level) {
      case 'expired': return '💀';
      case 'red': return '🔴';
      case 'orange': return '🟠';
      default: return '🟡';
    }
  };

  const getAlertLabel = (level) => {
    switch (level) {
      case 'expired': return 'Expiré';
      case 'red': return 'Critique';
      case 'orange': return 'Attention';
      default: return 'Info';
    }
  };

  const getAlertMessage = (alert) => {
    if (alert.days_remaining < 0) {
      return `Expiré depuis ${Math.abs(alert.days_remaining)} jour(s)`;
    }
    if (alert.days_remaining === 0) {
      return "Expire aujourd'hui !";
    }
    return `Expire dans ${alert.days_remaining} jour(s)`;
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch =
      (alert.societaire || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.tel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.police || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = filterLevel === 'all' || alert.alert_level === filterLevel;

    return matchesSearch && matchesLevel;
  });

  // Statistics
  const stats = {
    total: alerts.length,
    expired: alerts.filter(a => a.alert_level === 'expired').length,
    critical: alerts.filter(a => a.alert_level === 'red').length,
    warning: alerts.filter(a => a.alert_level === 'orange').length,
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="alerts-loading">
          <div className="alerts-loading-spinner"></div>
          <p>Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="alerts-page-header">
        <div className="alerts-title-section">
          <div className="alerts-title-icon">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h1>Centre d'Alertes</h1>
            <p className="alerts-subtitle">
              Surveillance automatique des expirations de polices
            </p>
          </div>
        </div>
        <div className="alerts-header-actions">
          <span className="last-refresh">
            <Clock size={14} />
            Mis à jour: {lastRefresh.toLocaleTimeString()}
          </span>
          <button className="refresh-btn" onClick={fetchAlerts}>
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Stats Cards */}
      <div className="alert-stats-grid">
        <div className="alert-stat-card total">
          <div className="alert-stat-icon">📊</div>
          <div className="alert-stat-info">
            <span className="alert-stat-value">{stats.total}</span>
            <span className="alert-stat-label">Total Alertes</span>
          </div>
        </div>
        <div className="alert-stat-card expired">
          <div className="alert-stat-icon">💀</div>
          <div className="alert-stat-info">
            <span className="alert-stat-value">{stats.expired}</span>
            <span className="alert-stat-label">Expirées</span>
          </div>
        </div>
        <div className="alert-stat-card critical">
          <div className="alert-stat-icon">🔴</div>
          <div className="alert-stat-info">
            <span className="alert-stat-value">{stats.critical}</span>
            <span className="alert-stat-label">Critiques (-3j)</span>
          </div>
        </div>
        <div className="alert-stat-card warning">
          <div className="alert-stat-icon">🟠</div>
          <div className="alert-stat-info">
            <span className="alert-stat-value">{stats.warning}</span>
            <span className="alert-stat-label">Attention (-10j)</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="alerts-toolbar">
        <div className="alerts-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, police..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="alerts-level-filters">
          {[
            { key: 'all', label: 'Tous', count: stats.total },
            { key: 'expired', label: 'Expirés', count: stats.expired },
            { key: 'red', label: 'Critiques', count: stats.critical },
            { key: 'orange', label: 'Attention', count: stats.warning },
          ].map(f => (
            <button
              key={f.key}
              className={`alert-filter-chip ${filterLevel === f.key ? 'active' : ''} ${f.key}`}
              onClick={() => setFilterLevel(f.key)}
            >
              {f.label}
              <span className="chip-count">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards List */}
      {filteredAlerts.length === 0 ? (
        <div className="alerts-empty">
          <div className="alerts-empty-icon">🎉</div>
          <h3>Aucune alerte</h3>
          <p>Tous les contrats sont à jour. Aucune expiration proche détectée.</p>
        </div>
      ) : (
        <div className="alerts-list">
          {filteredAlerts.map((alert, index) => (
            <div
              key={alert.id}
              className={`alert-card alert-level-${alert.alert_level}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="alert-card-indicator"></div>
              <div className="alert-card-content">
                <div className="alert-card-top">
                  <div className="alert-card-badge">
                    <span className="alert-badge-icon">{getAlertIcon(alert.alert_level)}</span>
                    <span className={`alert-badge-text level-${alert.alert_level}`}>
                      {getAlertLabel(alert.alert_level)}
                    </span>
                  </div>
                  <div className="alert-card-countdown">
                    <span className={`countdown-number level-${alert.alert_level}`}>
                      {alert.days_remaining <= 0 ? 0 : alert.days_remaining}
                    </span>
                    <span className="countdown-label">jour(s) restant(s)</span>
                  </div>
                </div>

                <div className="alert-card-details">
                  <div className="alert-detail-item">
                    <User size={16} />
                    <div>
                      <span className="detail-label">Société</span>
                      <span className="detail-value">{alert.societaire || '—'}</span>
                    </div>
                  </div>
                  <div className="alert-detail-item">
                    <Phone size={16} />
                    <div>
                      <span className="detail-label">Téléphone</span>
                      <span className="detail-value">{alert.tel || '—'}</span>
                    </div>
                  </div>
                  <div className="alert-detail-item">
                    <Calendar size={16} />
                    <div>
                      <span className="detail-label">Date d'expiration</span>
                      <span className="detail-value">
                        {alert.date_expiration
                          ? new Date(alert.date_expiration).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: 'long', year: 'numeric'
                            })
                          : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="alert-detail-item">
                    <AlertTriangle size={16} />
                    <div>
                      <span className="detail-label">Police</span>
                      <span className="detail-value">{alert.police || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="alert-card-footer">
                  <span className={`alert-message level-${alert.alert_level}`}>
                    ⏰ {getAlertMessage(alert)}
                  </span>
                  <span className="alert-immat">
                    🚗 {alert.immatriculation || 'N/A'}
                  </span>
                </div>
                
                <button 
                  className="renew-btn-small"
                  onClick={() => setRenewingClient(alert)}
                >
                  <RefreshCw size={14} /> Renouveler Contrat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {renewingClient && (
        <RenewalModal 
          client={renewingClient} 
          onClose={() => setRenewingClient(null)} 
          onRenewalSuccess={() => {
            fetchAlerts();
          }} 
        />
      )}
    </div>
  );
};

export default Alerts;
