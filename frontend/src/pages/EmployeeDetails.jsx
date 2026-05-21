import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statsDate, setStatsDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 10;

  useEffect(() => {
    fetchAnalytics();
  }, [id, statsDate]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/reports/employee/${id}/details`, {
        params: { statsDate }
      });
      setData(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement des analyses détaillées...</div>;
  if (!data) return <div className="error-msg">Aucune donnée trouvée pour cet employé.</div>;

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button onClick={() => navigate('/reports')} className="back-link" style={{ marginBottom: '10px', display: 'block', background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '600' }}>
            ← Retour aux rapports
          </button>
          <h1>Analyses : {data.employee.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="date-input-wrapper" style={{ background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <span className="calendar-icon">📊</span>
            <input 
              type="date" 
              className="date-picker-input"
              value={statsDate}
              onChange={(e) => setStatsDate(e.target.value)}
              title="Filtrer les totaux et le portefeuille par date"
            />
          </div>
          {statsDate && (
            <button className="reset-filter-btn" onClick={() => setStatsDate('')}>Voir Tout</button>
          )}
          <div className="badge-count" style={{ padding: '8px 15px' }}>ID Employé: {data.employee.id}</div>
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
            <h2>Portefeuille Clients</h2>
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
                <h2>Historique des Actions</h2>
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

export default EmployeeDetails;
