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
  const [viewingClient, setViewingClient] = useState(null);
  const [viewingClientVersements, setViewingClientVersements] = useState([]);
  const [activeDetailTab, setActiveDetailTab] = useState('infos');
  const [clientHistory, setClientHistory] = useState([]);
  const clientsPerPage = 10;

  const handleViewClient = async (client) => {
    setViewingClient(client);
    setViewingClientVersements([]);
    setClientHistory([]);
    setActiveDetailTab('infos');
    try {
      const res = await api.get(`/clients/${client.id}/versements`);
      setViewingClientVersements(res.data.data);
    } catch (err) {
      console.error('Failed to fetch client payments:', err);
    }
    try {
      const res = await api.get(`/clients/${client.id}/history`);
      setClientHistory(res.data.data);
    } catch (err) {
      console.error('Failed to fetch client history:', err);
    }
  };

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
                  <tr 
                    key={client.id}
                    onClick={() => handleViewClient(client)}
                    style={{ cursor: 'pointer' }}
                    title="Cliquer pour voir les détails"
                  >
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
              
              <div className="modal-tabs" style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '0px', marginBottom: '5px' }}>
                <button 
                  onClick={() => setActiveDetailTab('infos')}
                  className={`modal-tab-btn ${activeDetailTab === 'infos' ? 'active' : ''}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '10px 20px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    color: activeDetailTab === 'infos' ? 'var(--primary-color)' : '#64748b',
                    borderBottom: activeDetailTab === 'infos' ? '3px solid var(--primary-color)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ℹ️ Informations
                </button>
                <button 
                  onClick={() => setActiveDetailTab('history')}
                  className={`modal-tab-btn ${activeDetailTab === 'history' ? 'active' : ''}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '10px 20px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    color: activeDetailTab === 'history' ? 'var(--primary-color)' : '#64748b',
                    borderBottom: activeDetailTab === 'history' ? '3px solid var(--primary-color)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  📜 Historique
                </button>
              </div>

              {activeDetailTab === 'infos' ? (
                <>
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
                </>
              ) : (
                <div className="detail-section animate-fade-in">
                  <div className="detail-section-title">
                    📜 Historique des Modifications
                  </div>
                  <div className="payments-table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {clientHistory && clientHistory.length > 0 ? (
                      <table className="payments-table">
                        <thead>
                          <tr>
                            <th>Employé</th>
                            <th>Action</th>
                            <th>Ancienne valeur</th>
                            <th>Nouvelle valeur</th>
                            <th>Date & Heure</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientHistory.map(h => (
                            <tr key={h.id}>
                              <td><strong>{h.nom_utilisateur}</strong></td>
                              <td>
                                <span className="badge-count" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                  {h.action_effectuee}
                                </span>
                              </td>
                              <td style={{ color: '#e74c3c', maxWidth: '180px', wordBreak: 'break-all' }}>{h.ancienne_valeur || '-'}</td>
                              <td style={{ color: '#2ecc71', fontWeight: 'bold', maxWidth: '180px', wordBreak: 'break-all' }}>{h.nouvelle_valeur || '-'}</td>
                              <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(h.date_modification).toLocaleString('fr-FR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="no-data-msg">
                        Aucun historique de modification disponible pour ce client.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetails;
