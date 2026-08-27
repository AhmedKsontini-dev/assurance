import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './CreditBook.css'; // We will create this or use existing styles

const CreditBook = () => {
  const [credits, setCredits] = useState([]);
  const [stats, setStats] = useState({ total_restant: 0, impayes_count: 0, partiels_count: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Notes Modal State
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedClientForNotes, setSelectedClientForNotes] = useState(null);
  const [clientNotes, setClientNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');

  // Payment Modal State (reusing logic conceptually, we will build a simplified modal here or trigger the existing one if possible)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedClientForPayment, setSelectedClientForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Espece');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchCredits();
  }, [statusFilter, searchTerm, dateFilter]);

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const response = await api.get('/credits', {
        params: {
          status: statusFilter,
          search: searchTerm,
          date: dateFilter
        }
      });
      setCredits(response.data.data.credits);
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Notes Logic ---
  const openNotesModal = async (client) => {
    setSelectedClientForNotes(client);
    setIsNotesModalOpen(true);
    try {
      const response = await api.get(`/clients/${client.id}/notes`);
      setClientNotes(response.data.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    try {
      const response = await api.post(`/clients/${selectedClientForNotes.id}/notes`, { content: newNoteContent });
      setClientNotes([response.data.data, ...clientNotes]);
      setNewNoteContent('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  // --- Payment Logic ---
  const openPaymentModal = (client) => {
    setSelectedClientForPayment(client);
    setPaymentAmount(client.reste_a_payer);
    setIsPaymentModalOpen(true);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/clients/${selectedClientForPayment.id}/versements`, {
        montant: parseFloat(paymentAmount),
        methode_paiement: paymentMethod,
        date_versement: paymentDate
      });
      
      // Update client's global montant_paye via an update call to reflect the new versement on the client record
      const updatedMontantPaye = parseFloat(selectedClientForPayment.montant_paye) + parseFloat(paymentAmount);
      await api.put(`/clients/${selectedClientForPayment.id}`, {
        montant_paye: updatedMontantPaye
      });

      setIsPaymentModalOpen(false);
      fetchCredits(); // Refresh list
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Erreur lors de l\'ajout du paiement');
    }
  };

  const getStatusBadge = (client) => {
    if (parseFloat(client.reste_a_payer) <= 0) return <span className="status-badge paid">Payé / Soldé</span>;
    if (parseFloat(client.reste_a_payer) === parseFloat(client.total)) return <span className="status-badge unpaid">Impayé</span>;
    return <span className="status-badge partial">Partiellement payé</span>;
  };

  return (
    <div className="page-content credit-book-page">
      <div className="page-header">
        <h1>📖 Cahier de Crédit</h1>
        <p>Suivi des dettes et montants restants à récupérer</p>
      </div>

      <div className="stats-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
        <div className="stat-card">
          <h3>Total Restant à Récupérer</h3>
          <div className="stat-value" style={{ color: 'var(--danger-color)' }}>
            {parseFloat(stats.total_restant || 0).toLocaleString('fr-FR')} DT
          </div>
        </div>
        <div className="stat-card">
          <h3>Crédits Actifs</h3>
          <div className="stat-value">
            {stats.impayes_count + stats.partiels_count}
          </div>
        </div>
        <div className="stat-card">
          <h3>Clients Impayés (100%)</h3>
          <div className="stat-value" style={{ color: 'var(--danger-color)' }}>
            {stats.impayes_count}
          </div>
        </div>
        <div className="stat-card">
          <h3>Partiellement Payés</h3>
          <div className="stat-value" style={{ color: 'var(--warning-color)' }}>
            {stats.partiels_count}
          </div>
        </div>
      </div>

      <div className="filters-section" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Rechercher (Nom, Police, Tel)..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '250px' }}
        />
        <select 
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="Impayé">Impayé</option>
          <option value="Partiellement payé">Partiellement payé</option>
          <option value="Soldé">Payé / Soldé</option>
        </select>
        <input 
          type="date" 
          className="filter-date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          title="Filtrer par date de création"
        />
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Chargement du cahier...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date (Création)</th>
                <th>Police</th>
                <th>Client</th>
                <th>Téléphone</th>
                <th>Total</th>
                <th>Déjà Payé</th>
                <th>Reste à Payer</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {credits.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center' }}>Aucun crédit trouvé.</td>
                </tr>
              ) : (
                credits.map(client => (
                  <tr key={client.id} className={parseFloat(client.reste_a_payer) <= 0 ? 'row-solded' : ''}>
                    <td>{new Date(client.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>{client.police}</td>
                    <td><strong>{client.societaire}</strong></td>
                    <td>{client.tel}</td>
                    <td>{parseFloat(client.total || 0).toLocaleString('fr-FR')} DT</td>
                    <td>{parseFloat(client.montant_paye || 0).toLocaleString('fr-FR')} DT</td>
                    <td style={{ fontWeight: 'bold', color: parseFloat(client.reste_a_payer) > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                      {parseFloat(client.reste_a_payer || 0).toLocaleString('fr-FR')} DT
                    </td>
                    <td>{getStatusBadge(client)}</td>
                    <td>
                      <div className="action-buttons" style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn-icon" onClick={() => openNotesModal(client)} title="Notes">📝</button>
                        {parseFloat(client.reste_a_payer) > 0 && (
                          <button className="btn-icon" onClick={() => openPaymentModal(client)} title="Ajouter un paiement">💰</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* NOTES MODAL */}
      {isNotesModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>📝 Notes : {selectedClientForNotes?.societaire}</h2>
              <button className="close-btn" onClick={() => setIsNotesModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input 
                  type="text" 
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Nouvelle note (ex: Passera demain...)"
                  style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                  required
                />
                <button type="submit" className="submit-btn" style={{ width: 'auto', padding: '0 20px' }}>Ajouter</button>
              </form>

              <div className="notes-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {clientNotes.length === 0 ? (
                  <p>Aucune note pour ce client.</p>
                ) : (
                  clientNotes.map(note => (
                    <div key={note.id} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid var(--primary-color)' }}>
                      <p style={{ margin: '0 0 10px 0', color: '#1e293b' }}>{note.content}</p>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Par {note.author_name}</span>
                        <span>{new Date(note.created_at).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>💰 Encaisser un paiement</h2>
              <button className="close-btn" onClick={() => setIsPaymentModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '15px' }}><strong>Client :</strong> {selectedClientForPayment?.societaire}</p>
              <form onSubmit={handleAddPayment} className="crud-form">
                <div className="form-group">
                  <label>Montant (DT)</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    value={paymentAmount} 
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={selectedClientForPayment?.reste_a_payer}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Méthode de paiement</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="Espece">Espèce</option>
                    <option value="Cheque">Chèque</option>
                    <option value="Kembyela">Kembyela</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date du paiement</label>
                  <input 
                    type="date" 
                    value={paymentDate} 
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required 
                  />
                </div>
                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="cancel-btn" onClick={() => setIsPaymentModalOpen(false)}>Annuler</button>
                  <button type="submit" className="submit-btn">Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditBook;
