import { useState, useEffect } from 'react';
import api from '../services/api';
import { AlertTriangle, Clock, Phone, User, Calendar, RefreshCw, Search, MessageSquare, Send } from 'lucide-react';
import RenewalModal from '../components/RenewalModal';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [renewingClient, setRenewingClient] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // État pour le modal des notes clients
  const [viewingNotesClient, setViewingNotesClient] = useState(null);
  const [clientNotes, setClientNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alerts?days=10', { showPermissionAlert: false });
      setAlerts(res.data.data);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Échec du chargement des alertes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNotes = async (client, e) => {
    if (e) e.stopPropagation();
    setViewingNotesClient(client);
    setClientNotes([]);
    try {
      const res = await api.get(`/clients/${client.id}/notes`);
      setClientNotes(res.data.data);
    } catch (err) {
      console.error('Failed to fetch client notes:', err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !viewingNotesClient) return;
    
    setIsSubmittingNote(true);
    try {
      await api.post(`/clients/${viewingNotesClient.id}/notes`, { content: newNoteContent });
      setNewNoteContent('');
      const res = await api.get(`/clients/${viewingNotesClient.id}/notes`);
      setClientNotes(res.data.data);
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsSubmittingNote(false);
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
                
                <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '15px' }}>
                  <button 
                    className="renew-btn-small"
                    style={{ flex: 1, margin: 0 }}
                    onClick={() => setRenewingClient(alert)}
                  >
                    <RefreshCw size={14} /> Renouveler Contrat
                  </button>
                  <button 
                    onClick={(e) => handleOpenNotes(alert, e)}
                    style={{
                      flex: 1,
                      background: '#e0f2fe',
                      color: '#0284c7',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      transition: 'background 0.2s',
                      margin: 0
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#bae6fd'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#e0f2fe'}
                    title="Discussion et Notes"
                  >
                    <MessageSquare size={16} /> Notes
                  </button>
                </div>
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

      {/* Notes Modal */}
      {viewingNotesClient && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content animate-pop" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={24} /> Discussion & Notes
                </h2>
                <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  Client : {viewingNotesClient.societaire} ({viewingNotesClient.police})
                </p>
              </div>
              <button className="close-modal" onClick={() => setViewingNotesClient(null)}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
              <div className="notes-list" style={{
                maxHeight: '400px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                paddingRight: '10px'
              }}>
                {clientNotes.length > 0 ? (
                  clientNotes.map(note => (
                    <div key={note.id} style={{
                      background: '#f8fafc',
                      borderLeft: '4px solid #0ea5e9',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#334155' }}>{note.author_name || 'Utilisateur'}</span>
                        <span style={{ color: '#94a3b8' }}>
                          {new Date(note.created_at).toLocaleString('fr-FR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#475569', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                        {note.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                    <p>Aucune note enregistrée pour ce client.</p>
                  </div>
                )}
              </div>

              <div className="note-input-container" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Ajouter une nouvelle note, résumé d'appel, information..."
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmittingNote || !newNoteContent.trim()}
                    style={{
                      alignSelf: 'flex-end',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: (isSubmittingNote || !newNoteContent.trim()) ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      transition: 'opacity 0.2s',
                      opacity: (isSubmittingNote || !newNoteContent.trim()) ? 0.7 : 1
                    }}
                  >
                    <Send size={16} /> {isSubmittingNote ? 'Envoi...' : 'Ajouter la note'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
