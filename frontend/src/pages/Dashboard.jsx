import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Calendar, XCircle, Bell, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import CaisseSection from '../components/CaisseSection';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statsDate, setStatsDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [upcomingExpenses, setUpcomingExpenses] = useState([]);
  const [viewingClient, setViewingClient] = useState(null);
  const [viewingClientVersements, setViewingClientVersements] = useState([]);

  const handleViewClient = async (client) => {
    setViewingClient(client);
    setViewingClientVersements([]);
    try {
      const res = await api.get(`/clients/${client.id}/versements`);
      setViewingClientVersements(res.data.data);
    } catch (err) {
      console.error('Failed to fetch client payments:', err);
    }
  };
  const clientsPerPage = 10;

  useEffect(() => {
    if (user && user.id) {
      fetchAnalytics();
      fetchUpcomingEvents();
      fetchUpcomingExpenses();
    }
  }, [user, statsDate]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/reports/employee/${user.id}/details`, {
        params: { statsDate }
      });
      setData(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
      setLoading(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const res = await api.get('/events');
      const allEvents = res.data.data;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);

      const filtered = allEvents.filter(event => {
        const eventDate = new Date(event.event_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today && eventDate <= threeDaysLater;
      }).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

      setUpcomingEvents(filtered);
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  };

  const fetchUpcomingExpenses = async () => {
    try {
      const res = await api.get('/expenses/upcoming');
      setUpcomingExpenses(res.data.data.expenses || []);
    } catch (err) {
      // Non-admin users may not have access — silently ignore
      console.warn('Could not fetch upcoming expenses (may not be admin):', err.message);
    }
  };

  if (loading) return <div className="loading">Chargement de votre tableau de bord...</div>;
  if (!data) return <div className="error-msg">Aucune donnée trouvée pour votre compte.</div>;

  const filteredClients = data.clients.filter(client => 
    client.societaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.police.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#1e293b', margin: 0 }}>Mon Tableau de Bord</h1>
          <p style={{ color: '#64748b', marginTop: '8px', fontSize: '1.05rem' }}>Bienvenue, {data.employee.name} </p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="date-input-wrapper" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: '#fff', 
            border: '2px solid #ec5b32', 
            borderRadius: '12px',
            padding: '8px 16px',
            boxShadow: '0 4px 6px rgba(236, 91, 50, 0.1)',
            transition: 'all 0.3s ease'
          }}>
            <Calendar size={20} color="#ec5b32" style={{ marginRight: '10px' }} />
            <input 
              type="date" 
              className="date-picker-input"
              value={statsDate}
              onChange={(e) => setStatsDate(e.target.value)}
              title="Filtrer les totaux et le portefeuille par date"
              style={{
                border: 'none',
                outline: 'none',
                color: '#ec5b32',
                fontWeight: '600',
                fontSize: '1rem',
                background: 'transparent',
                cursor: 'pointer',
                accentColor: '#ec5b32'
              }}
            />
          </div>
          {statsDate && (
            <button className="reset-filter-btn" onClick={() => setStatsDate('')} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#fff',
              color: '#ec5b32',
              border: '1px solid #ec5b32',
              padding: '8px 16px',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(236, 91, 50, 0.05)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#fff3f0'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; }}
            >
              <XCircle size={18} /> Voir Tout
            </button>
          )}
        </div>
      </div>

      {/* Payment Reminder Alerts */}
      {(() => {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        const paymentAlerts = data && data.clients ? data.clients.filter(client => {
          const total = parseFloat(client.total) || 0;
          const paid = parseFloat(client.montant_paye) || 0;
          const remaining = total - paid;
          
          if (remaining <= 0 || !client.date_prochain_paiement) return false;

          const nextPaymentDate = new Date(client.date_prochain_paiement);
          nextPaymentDate.setHours(0, 0, 0, 0);

          const diffTime = nextPaymentDate - todayDate;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return diffDays <= 3;
        }).sort((a, b) => new Date(a.date_prochain_paiement) - new Date(b.date_prochain_paiement)) : [];

        if (paymentAlerts.length === 0) return null;

        return (
          <div className="payment-alerts-banner" style={{
            background: 'linear-gradient(135deg, #fff 0%, #fff7f7 100%)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '30px',
            borderLeft: '5px solid #e74c3c',
            boxShadow: '0 10px 25px -5px rgba(231, 76, 60, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#e74c3c', padding: '8px', borderRadius: '10px' }}>
                <Bell size={20} color="white" />
              </div>
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#1e293b' }}>Rappels de Paiement Immédiats</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
              {paymentAlerts.map(client => {
                const total = parseFloat(client.total) || 0;
                const paid = parseFloat(client.montant_paye) || 0;
                const remaining = total - paid;
                const nextPaymentDate = new Date(client.date_prochain_paiement);
                nextPaymentDate.setHours(0, 0, 0, 0);
                const diffTime = nextPaymentDate - todayDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let relativeText = "";
                let badgeColor = "";
                let badgeBg = "";

                if (diffDays < 0) {
                  relativeText = `En retard de ${Math.abs(diffDays)}j`;
                  badgeColor = '#ef4444';
                  badgeBg = '#fee2e2';
                } else if (diffDays === 0) {
                  relativeText = "Aujourd'hui";
                  badgeColor = '#ef4444';
                  badgeBg = '#fee2e2';
                } else {
                  relativeText = `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                  badgeColor = '#d97706';
                  badgeBg = '#fef3c7';
                }

                return (
                  <div key={client.id} style={{
                    background: 'white',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #fecaca',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 2px 4px rgba(231, 76, 60, 0.02)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(231, 76, 60, 0.08)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(231, 76, 60, 0.02)';
                  }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1rem', fontWeight: '700' }}>{client.societaire}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>Police: {client.police}</span>
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: badgeBg,
                        color: badgeColor,
                        fontWeight: '700'
                      }}>
                        {relativeText}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Reste à payer</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#e74c3c' }}>{remaining.toFixed(2)} DT</span>
                      </div>
                      <button 
                        onClick={() => handleViewClient(client)}
                        style={{
                          background: '#f1f5f9',
                          border: 'none',
                          color: 'var(--primary-color)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      >
                        Voir Client
                      </button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                      Échéance : <strong>{new Date(client.date_prochain_paiement).toLocaleDateString('fr-FR')}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Upcoming Expenses Reminder Banner */}
      {upcomingExpenses.length > 0 && (() => {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        return (
          <div style={{
            background: 'linear-gradient(135deg, #fff 0%, #fff8f0 100%)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '30px',
            borderLeft: '5px solid #f97316',
            boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', padding: '8px', borderRadius: '10px' }}>
                <AlertTriangle size={20} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#1e293b' }}>Rappels des dépenses à venir</h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  {upcomingExpenses.length} dépense{upcomingExpenses.length > 1 ? 's' : ''} prévue{upcomingExpenses.length > 1 ? 's' : ''} dans les 3 prochains jours
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {upcomingExpenses.map(expense => {
                const expDate = new Date(expense.expense_date);
                expDate.setHours(0, 0, 0, 0);
                const diffDays = Math.round((expDate - todayDate) / (1000 * 60 * 60 * 24));

                const isToday = diffDays === 0;
                const badgeBg = isToday ? '#fee2e2' : diffDays === 1 ? '#ffedd5' : '#fef9c3';
                const badgeColor = isToday ? '#dc2626' : diffDays === 1 ? '#ea580c' : '#ca8a04';
                const badgeText = isToday ? "Aujourd'hui !" : diffDays === 1 ? 'Demain' : `Dans ${diffDays} jours`;

                return (
                  <div key={expense.id} style={{
                    background: 'white',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: `1px solid ${isToday ? '#fecaca' : '#fed7aa'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 2px 8px rgba(249,115,22,0.04)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(249,115,22,0.1)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(249,115,22,0.04)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{
                          display: 'inline-block',
                          background: '#f1f5f9',
                          color: '#475569',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '20px',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>{expense.category}</span>
                        <p style={{ margin: 0, fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>
                          {expense.description || 'Sans description'}
                        </p>
                      </div>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: badgeBg,
                        color: badgeColor,
                        fontWeight: '800',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        marginLeft: '8px'
                      }}>{badgeText}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.8rem' }}>
                        <Calendar size={13} />
                        <span>{new Date(expense.expense_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      </div>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: isToday ? '#dc2626' : '#f97316' }}>
                        {parseFloat(expense.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} TND
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Reminders Banner */}
      {upcomingEvents.length > 0 && (
        <div className="reminders-banner" style={{
          background: 'linear-gradient(135deg, #fff 0%, #fff5f2 100%)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '30px',
          borderLeft: '5px solid #ec5b32',
          boxShadow: '0 10px 25px -5px rgba(236, 91, 50, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#ec5b32', padding: '8px', borderRadius: '10px' }}>
              <Bell size={20} color="white" />
            </div>
            <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#1e293b' }}>Rappels de votre planning</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {upcomingEvents.map(event => {
              const isToday = new Date(event.event_date).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA');
              return (
                <div key={event.id} style={{
                  background: 'white',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s',
                  cursor: 'default'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '4px', 
                      height: '35px', 
                      background: event.color || '#ec5b32', 
                      borderRadius: '2px' 
                    }}></div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '600', color: '#334155', fontSize: '0.95rem' }}>{event.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          padding: '2px 8px', 
                          borderRadius: '12px',
                          background: isToday ? '#fee2e2' : '#f1f5f9',
                          color: isToday ? '#ef4444' : '#64748b',
                          fontWeight: '600'
                        }}>
                          {isToday ? "Aujourd'hui" : new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        {event.start_time && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '0.75rem' }}>
                            <Clock size={14} />
                            <span>{event.start_time.substring(0, 5)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#cbd5e1" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="stats-cards" style={{ gridTemplateColumns: `repeat(${data.financials.custom ? 5 : 4}, 1fr)` }}>
        <div className="stat-card">
          <h3>Aujourd'hui</h3>
          <p className="stat-value">{parseFloat(data.financials.today.amount).toLocaleString()} TND</p>
          <span className="badge-count">{data.financials.today.count} clients</span>
        </div>
        
        {data.financials.custom && (
          <div className="stat-card" style={{ border: '2px solid var(--primary-color)', background: '#f0f7ff' }}>
            <h3 style={{ color: 'var(--primary-color)' }}>Le {new Date(statsDate).toLocaleDateString()}</h3>
            <p className="stat-value">{parseFloat(data.financials.custom.amount).toLocaleString()} TND</p>
            <span className="badge-count" style={{ background: 'var(--primary-color)' }}>{data.financials.custom.count} clients</span>
          </div>
        )}

        <div className="stat-card">
          <h3>Cette Semaine</h3>
          <p className="stat-value">{parseFloat(data.financials.week.amount).toLocaleString()} TND</p>
          <span className="badge-count">{data.financials.week.count} clients</span>
        </div>
        <div className="stat-card">
          <h3>Ce Mois</h3>
          <p className="stat-value">{parseFloat(data.financials.month.amount).toLocaleString()} TND</p>
          <span className="badge-count">{data.financials.month.count} clients</span>
        </div>
        <div className="stat-card accent">
          <h3>Global</h3>
          <p className="stat-value">{parseFloat(data.financials.overall.amount).toLocaleString()} TND</p>
          <span className="badge-count">{data.financials.overall.count} clients</span>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Clients Table */}
        <section className="analytics-section">
          <div className="section-header">
            <h2>Mon Portefeuille Clients</h2>
            <input 
              type="text" 
              placeholder="Rechercher par nom ou police..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Police</th>
                  <th>Societaire</th>
                  <th>Date Effet</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {currentClients.map(client => (
                  <tr key={client.id}>
                    <td>{client.police}</td>
                    <td>{client.societaire}</td>
                    <td>{new Date(client.date_effet).toLocaleDateString()}</td>
                    <td className="amount">{parseFloat(client.total).toLocaleString()} TND</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>Prev</button>
            <span>Page {currentPage} sur {totalPages || 1}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages || totalPages === 0}>Next</button>
          </div>
        </section>

        <div className="side-analytics">
          {/* Activity Logs */}
          <section className="analytics-section">
            <div className="section-header" style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2>Mon Historique d'Actions</h2>
                <span className="badge-count" style={{ background: '#64748b' }}>{data.logs.length}</span>
              </div>
            </div>
            <div className="logs-container">
              {data.logs.map(log => (
                <div key={log.id} className={`log-item action-${log.action_type.toLowerCase()}`}>
                  <div className="log-icon">
                    {log.action_type === 'ADD' ? '➕' : log.action_type === 'UPDATE' ? '📝' : log.action_type === 'DELETE' ? '🗑️' : log.action_type === 'LOGIN' ? '🔑' : '🚪'}
                  </div>
                  <div className="log-details">
                    <p className="log-desc">{log.description}</p>
                    <span className="log-time">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {data.logs.length === 0 && (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Aucune action enregistrée pour cette période.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Cash Journal Section */}
      <CaisseSection onEntryChange={fetchAnalytics} statsDate={statsDate} />

      {/* View Modal */}
      {viewingClient && (
        <div className="modal-overlay">
          <div className="modal-content view-modal-content animate-pop">
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>Détails du Client</h2>
                <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  {viewingClient.societaire} (ID: {viewingClient.id})
                </p>
              </div>
              <button className="close-modal" onClick={() => setViewingClient(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* Section 1: Informations Personnelles & Contrat */}
              <div className="detail-section">
                <div className="detail-section-title">
                  👤 Informations Personnelles & Contrat
                </div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Sociétaire / Nom</span>
                    <span className="detail-value">{viewingClient.societaire || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Téléphone</span>
                    <span className="detail-value">{viewingClient.tel || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Adresse</span>
                    <span className="detail-value">{viewingClient.adresse || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Catégorie</span>
                    <span className="detail-value">{viewingClient.category || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Numéro de Police</span>
                    <span className="detail-value" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{viewingClient.police || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date d'effet</span>
                    <span className="detail-value">{viewingClient.date_effet ? new Date(viewingClient.date_effet).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date d'expiration</span>
                    <span className="detail-value">{viewingClient.date_expiration ? new Date(viewingClient.date_expiration).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Statut Renouvellement</span>
                    <span className="detail-value">{viewingClient.renewal_status || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Informations de Société & Véhicule */}
              <div className="detail-section">
                <div className="detail-section-title">
                  🏢 Informations de Société & Véhicule
                </div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Registre de Commerce (RC)</span>
                    <span className="detail-value">{viewingClient.rc || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Papier / Attestation</span>
                    <span className="detail-value">{viewingClient.papier || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Immatriculation</span>
                    <span className="detail-value" style={{ fontWeight: 'bold' }}>{viewingClient.immatriculation || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Usage Véhicule</span>
                    <span className="detail-value">{viewingClient.usage_vehicle || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Informations de Paiement */}
              <div className="detail-section">
                <div className="detail-section-title">
                  💳 Informations de Paiement
                </div>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Montant Hors Réduction</span>
                    <span className="detail-value">{viewingClient.montant !== null && viewingClient.montant !== undefined ? `${viewingClient.montant} DT` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Réduction</span>
                    <span className="detail-value" style={{ color: '#e74c3c' }}>{viewingClient.reduction !== null && viewingClient.reduction !== undefined ? `${viewingClient.reduction} DT` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Montant Total Net</span>
                    <span className="detail-value" style={{ color: 'var(--primary-color)', fontSize: '1.1rem', fontWeight: '700' }}>
                      {viewingClient.total !== null && viewingClient.total !== undefined ? `${parseFloat(viewingClient.total).toFixed(2)} DT` : '-'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Montant Déjà Payé</span>
                    <span className="detail-value" style={{ color: '#2ecc71', fontWeight: '700' }}>
                      {viewingClient.montant_paye !== null && viewingClient.montant_paye !== undefined ? `${parseFloat(viewingClient.montant_paye).toFixed(2)} DT` : '0.00 DT'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Reste à payer</span>
                    <span className="detail-value" style={{ 
                      color: ((parseFloat(viewingClient.total) || 0) - (parseFloat(viewingClient.montant_paye) || 0)) > 0 ? '#e74c3c' : '#2ecc71',
                      fontWeight: '700'
                    }}>
                      {((parseFloat(viewingClient.total) || 0) - (parseFloat(viewingClient.montant_paye) || 0)).toFixed(2)} DT
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Statut Paiement</span>
                    <span className={`detail-badge ${
                      viewingClient.payment_status === 'Paid' ? 'success' : viewingClient.payment_status === 'Partial' ? 'warning' : 'danger'
                    }`}>
                      {viewingClient.payment_status === 'Paid' ? 'Payé' : viewingClient.payment_status === 'Partial' ? 'Partiel' : 'Impayé'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Mode de règlement</span>
                    <span className="detail-value">{viewingClient.paiement || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Prochain paiement prévu</span>
                    <span className="detail-value" style={{ fontWeight: '700', color: '#e67e22' }}>
                      {viewingClient.date_prochain_paiement ? new Date(viewingClient.date_prochain_paiement).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Historique des Versements */}
              <div className="detail-section">
                <div className="detail-section-title">
                  📜 Historique des Versements
                </div>
                <div className="payments-table-container">
                  {viewingClientVersements && viewingClientVersements.length > 0 ? (
                    <table className="payments-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Montant</th>
                          <th>Méthode</th>
                          <th>Date d'enregistrement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingClientVersements.map(v => (
                          <tr key={v.id}>
                            <td>{v.date_versement ? new Date(v.date_versement).toLocaleDateString() : '-'}</td>
                            <td style={{ fontWeight: 'bold', color: '#2ecc71' }}>{parseFloat(v.montant).toFixed(2)} DT</td>
                            <td>{v.methode_paiement || 'Espèce'}</td>
                            <td>{v.created_at ? new Date(v.created_at).toLocaleString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-data-msg">
                      Aucun versement enregistré pour ce client.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
