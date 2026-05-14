import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookOpen, Plus, Trash2, Calendar, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Search, X, AlertCircle } from 'lucide-react';

const CaisseSection = ({ onEntryChange, statsDate }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  // New entry form
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    montant: '',
    description: '',
    type: 'EXPENSE',
    date_operation: new Date().toISOString().split('T')[0]
  });
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, entriesRes] = await Promise.all([
        api.get('/caisse/summary'),
        api.get('/caisse/entries', { params: { limit: 50, date: statsDate } })
      ]);
      setSummary(summaryRes.data.data.summary);
      setEntries(entriesRes.data.data.entries);
      setError('');
    } catch (err) {
      console.error('Caisse fetch error:', err);
      setError('Impossible de charger le journal de caisse.');
    } finally {
      setLoading(false);
    }
  }, [statsDate]);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user, fetchData]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!newEntry.montant || !newEntry.description) return;

    setAdding(true);
    try {
      const res = await api.post('/caisse/entries', {
        montant: parseFloat(newEntry.montant),
        type: newEntry.type,
        description: newEntry.description,
        date_operation: newEntry.date_operation
      });

      setSummary(res.data.data.summary);
      // Refetch entries to show the new one
      const entriesRes = await api.get('/caisse/entries', { params: { limit: 50, date: statsDate } });
      setEntries(entriesRes.data.data.entries);

      setNewEntry({
        montant: '',
        description: '',
        type: 'EXPENSE',
        date_operation: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      setError('');
      if (onEntryChange) onEntryChange();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette entrée ?')) return;
    try {
      const res = await api.delete(`/caisse/entries/${id}`);
      setSummary(res.data.data.summary);
      setEntries(prev => prev.filter(e => e.id !== id));
      if (onEntryChange) onEntryChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchSearch = !searchTerm || entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !filterType || entry.type === filterType;
    return matchSearch && matchType;
  });

  if (loading && !summary) {
    return (
      <section className="caisse-section">
        <div className="caisse-loading">
          <BookOpen size={24} />
          <span>Chargement du journal...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="caisse-section">
      {/* Header */}
      <div className="caisse-header">
        <div className="caisse-title-group">
          <div className="caisse-icon-wrapper">
            <BookOpen size={22} />
          </div>
          <div>
            <h2>Mon Journal de Caisse</h2>
            <p className="caisse-subtitle">Suivi manuel des entrées et sorties d'argent</p>
          </div>
        </div>
        <button
          className={`caisse-tab-btn ${showForm ? 'active' : ''}`}
          onClick={() => setShowForm(!showForm)}
          style={{ background: showForm ? '#fff' : 'transparent', color: showForm ? '#4472b3' : '#fff' }}
        >
          {showForm ? <><X size={16} /> Annuler</> : <><Plus size={16} /> Nouvelle Entrée</>}
        </button>
      </div>

      {error && (
        <div className="caisse-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="caisse-summary-cards">
          <div className="caisse-card caisse-card-initial">
            <div className="caisse-card-top">
              <span className="caisse-card-label">Total Entrées (+)</span>
              <TrendingUp size={18} color="#27ae60" />
            </div>
            <p className="caisse-card-value" style={{ color: '#27ae60' }}>
              +{(summary.overall.total_income || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} <small>TND</small>
            </p>
          </div>

          <div className="caisse-card caisse-card-depenses">
            <div className="caisse-card-top">
              <span className="caisse-card-label">Total Sorties (-)</span>
              <TrendingDown size={18} color="#e74c3c" />
            </div>
            <p className="caisse-card-value depenses">
              -{(summary.overall.total_expense || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} <small>TND</small>
            </p>
          </div>

          <div className="caisse-card caisse-card-solde">
            <div className="caisse-card-top">
              <span className="caisse-card-label">Solde Actuel</span>
              <div style={{ padding: '4px 8px', borderRadius: '12px', background: summary.overall.solde >= 0 ? '#ecfdf5' : '#fef2f2', color: summary.overall.solde >= 0 ? '#059669' : '#dc2626', fontSize: '0.7rem', fontWeight: 700 }}>
                BILAN
              </div>
            </div>
            <p className="caisse-card-value" style={{ color: summary.overall.solde >= 0 ? '#27ae60' : '#e74c3c' }}>
              {(summary.overall.solde || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} <small>TND</small>
            </p>
          </div>
        </div>
      )}

      {/* Add Entry Form */}
      {showForm && (
        <div style={{ padding: '0 28px 24px' }}>
          <form className="caisse-add-form" onSubmit={handleAddEntry} style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="caisse-form-title">
              <Plus size={18} />
              <span>Enregistrer un mouvement</span>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button
                type="button"
                onClick={() => setNewEntry({ ...newEntry, type: 'INCOME' })}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '2px solid', borderColor: newEntry.type === 'INCOME' ? '#27ae60' : '#e2e8f0', background: newEntry.type === 'INCOME' ? '#ecfdf5' : '#fff', color: newEntry.type === 'INCOME' ? '#059669' : '#64748b', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <ArrowUpCircle size={18} /> Revenu (+)
              </button>
              <button
                type="button"
                onClick={() => setNewEntry({ ...newEntry, type: 'EXPENSE' })}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '2px solid', borderColor: newEntry.type === 'EXPENSE' ? '#e74c3c' : '#e2e8f0', background: newEntry.type === 'EXPENSE' ? '#fef2f2' : '#fff', color: newEntry.type === 'EXPENSE' ? '#dc2626' : '#64748b', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <ArrowDownCircle size={18} /> Dépense (-)
              </button>
            </div>

            <div className="caisse-form-fields">
              <input
                type="number"
                placeholder="Montant (TND)"
                value={newEntry.montant}
                onChange={(e) => setNewEntry({ ...newEntry, montant: e.target.value })}
                required
                min="0.001"
                step="0.001"
                className="caisse-input"
              />
              <input
                type="text"
                placeholder="Description (ex: Payement loyer, Vente police...)"
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                required
                className="caisse-input caisse-input-desc"
              />
              <input
                type="date"
                value={newEntry.date_operation}
                onChange={(e) => setNewEntry({ ...newEntry, date_operation: e.target.value })}
                required
                className="caisse-input"
                style={{ width: '150px' }}
              />
              <button type="submit" className="caisse-submit-btn" disabled={adding} style={{ background: newEntry.type === 'INCOME' ? '#27ae60' : '#e74c3c' }}>
                {adding ? '...' : <><Plus size={16} /> Enregistrer</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries List */}
      <div className="caisse-operations-list" style={{ margin: '0 28px 28px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="caisse-list-title" style={{ margin: 0 }}>
            Historique des mouvements {statsDate ? `du ${new Date(statsDate).toLocaleDateString('fr-FR')}` : ''}
          </h3>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '6px 10px 6px 30px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', width: '180px' }}
              />
            </div>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', background: '#fff', color: '#64748b' }}
            >
              <option value="">Tous les types</option>
              <option value="INCOME">Entrées (+)</option>
              <option value="EXPENSE">Sorties (-)</option>
            </select>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="caisse-empty">
            <BookOpen size={40} strokeWidth={1} />
            <p>Aucun mouvement enregistré</p>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Utilisez le bouton "Nouvelle Entrée" pour commencer.</span>
          </div>
        ) : (
          <div className="caisse-ops-scroll">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="caisse-op-item" style={{ borderLeft: `4px solid ${entry.type === 'INCOME' ? '#27ae60' : '#e74c3c'}` }}>
                <div className="caisse-op-info">
                  <span className="caisse-op-desc">{entry.description}</span>
                  <span className="caisse-op-time">
                    <Calendar size={12} />
                    {new Date(entry.date_operation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {new Date(entry.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className="caisse-op-amount" style={{ color: entry.type === 'INCOME' ? '#27ae60' : '#e74c3c', fontSize: '1.1rem' }}>
                  {entry.type === 'INCOME' ? '+' : '-'}{parseFloat(entry.montant).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} TND
                </span>
                <button
                  className="caisse-delete-btn"
                  onClick={() => handleDelete(entry.id)}
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CaisseSection;
