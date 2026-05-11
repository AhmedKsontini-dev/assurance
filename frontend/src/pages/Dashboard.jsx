import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Calendar, XCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statsDate, setStatsDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 10;

  useEffect(() => {
    if (user && user.id) {
      fetchAnalytics();
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
    </div>
  );
};

export default Dashboard;
