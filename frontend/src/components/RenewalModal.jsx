import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Save, X, Phone, CheckCircle, XCircle, Clock, History } from 'lucide-react';

const RenewalModal = ({ client, onClose, onRenewalSuccess }) => {
  const [formData, setFormData] = useState({
    new_expiration_date: '',
    plan_duration: '12 Months',
    notes: '',
    status: 'Accepted',
    old_expiration_date: client.date_expiration ? new Date(client.date_expiration).toLocaleDateString('en-CA') : ''
  });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Default new expiration date to +1 year from current expiration or today
    const baseDate = client.date_expiration ? new Date(client.date_expiration) : new Date();
    const nextYear = new Date(baseDate);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    
    setFormData(prev => ({
      ...prev,
      new_expiration_date: nextYear.toLocaleDateString('en-CA')
    }));

    fetchHistory();
  }, [client]);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/clients/${client.id}/renewals`);
      setHistory(res.data.data);
    } catch (err) {
      console.error('Failed to fetch renewal history', err);
    }
  };

  const handlePlanChange = (duration) => {
    const baseDate = client.date_expiration ? new Date(client.date_expiration) : new Date();
    const newDate = new Date(baseDate);
    
    if (duration === '3 Months') newDate.setMonth(newDate.getMonth() + 3);
    else if (duration === '6 Months') newDate.setMonth(newDate.getMonth() + 6);
    else if (duration === '12 Months') newDate.setFullYear(newDate.getFullYear() + 1);
    else if (duration === '24 Months') newDate.setFullYear(newDate.getFullYear() + 2);

    setFormData({
      ...formData,
      plan_duration: duration,
      new_expiration_date: newDate.toLocaleDateString('en-CA')
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/clients/${client.id}/renew`, formData);
      onRenewalSuccess();
      
      // Notify other components (like Navbar) to refresh alert counts
      window.dispatchEvent(new Event('refresh-alerts'));
      
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Renewal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content renewal-modal animate-pop" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <div className="header-title">
            <Calendar className="icon" />
            <div>
              <h2>Renouvellement d'abonnement</h2>
              <p>Client: {client.societaire}</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="history-btn" onClick={() => setShowHistory(!showHistory)}>
              <History size={18} /> {showHistory ? 'Formulaire' : 'Historique'}
            </button>
            <button className="close-modal" onClick={onClose}>&times;</button>
          </div>
        </div>

        <div className="modal-body">
          {showHistory ? (
            <div className="renewal-history">
              <h3>Historique des renouvellements</h3>
              {history.length === 0 ? (
                <p className="no-data">Aucun historique de renouvellement trouvé.</p>
              ) : (
                <div className="history-list">
                  {history.map((item, index) => (
                    <div key={index} className={`history-item status-${item.status.toLowerCase()}`}>
                      <div className="history-header">
                        <span className="status-badge">{item.status}</span>
                        <span className="date">{new Date(item.renewal_date).toLocaleString()}</span>
                      </div>
                      <div className="history-details">
                        <p><strong>Nouvelle expiration:</strong> {new Date(item.new_expiration_date).toLocaleDateString()}</p>
                        <p><strong>Durée:</strong> {item.plan_duration}</p>
                        <p><strong>Par:</strong> {item.admin_name}</p>
                      </div>
                      {item.notes && (
                        <div className="history-notes">
                          <strong>Notes:</strong> {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="renewal-form">
              <div className="form-section">
                <label><Phone size={16} /> Résultat de l'appel / Statut</label>
                <div className="status-selector">
                  <button 
                    type="button" 
                    className={`status-btn accepted ${formData.status === 'Accepted' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, status: 'Accepted'})}
                  >
                    <CheckCircle size={18} /> Accepté
                  </button>
                  <button 
                    type="button" 
                    className={`status-btn refused ${formData.status === 'Refused' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, status: 'Refused'})}
                  >
                    <XCircle size={18} /> Refusé
                  </button>
                  <button 
                    type="button" 
                    className={`status-btn follow-up ${formData.status === 'Follow-up' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, status: 'Follow-up'})}
                  >
                    <Clock size={18} /> À rappeler
                  </button>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Durée du forfait</label>
                  <select 
                    value={formData.plan_duration} 
                    onChange={(e) => handlePlanChange(e.target.value)}
                  >
                    <option value="3 Months">3 Mois</option>
                    <option value="6 Months">6 Mois</option>
                    <option value="12 Months">12 Mois (1 An)</option>
                    <option value="24 Months">24 Mois (2 Ans)</option>
                    <option value="Custom">Personnalisé</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Nouvelle date d'expiration</label>
                  <input 
                    type="date" 
                    value={formData.new_expiration_date} 
                    onChange={(e) => setFormData({...formData, new_expiration_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Notes de l'appel / Détails du renouvellement</label>
                <textarea 
                  placeholder="Détails de la conversation, raisons du refus, ou informations de suivi..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="4"
                ></textarea>
              </div>

              <div className="form-footer">
                <button type="button" className="cancel-btn" onClick={onClose}>Annuler</button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Enregistrement...' : (
                    <>
                      <Save size={18} /> Enregistrer le renouvellement
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .renewal-modal {
          overflow: hidden;
        }
        .header-title {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .header-title .icon {
          background: rgba(var(--primary-rgb), 0.1);
          padding: 10px;
          border-radius: 12px;
          color: var(--primary-color);
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .history-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .history-btn:hover {
          background: #f5f5f5;
        }
        .status-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 10px;
          margin-bottom: 20px;
        }
        .status-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 10px;
          border: 2px solid transparent;
          background: #f8f9fa;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          color: #666;
        }
        .status-btn.accepted.active {
          background: #e6f4ea;
          color: #1e7e34;
          border-color: #1e7e34;
        }
        .status-btn.refused.active {
          background: #fce8e6;
          color: #d93025;
          border-color: #d93025;
        }
        .status-btn.follow-up.active {
          background: #fef7e0;
          color: #f29900;
          border-color: #f29900;
        }
        .renewal-form .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .full-width {
          grid-column: span 2;
          margin-top: 20px;
        }
        textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          resize: vertical;
          font-family: inherit;
        }
        .form-footer {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
          gap: 15px;
        }
        .renewal-history {
          max-height: 400px;
          overflow-y: auto;
        }
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 15px;
        }
        .history-item {
          padding: 15px;
          border-radius: 10px;
          border-left: 4px solid #ddd;
          background: #f8f9fa;
        }
        .history-item.status-accepted { border-left-color: #1e7e34; }
        .history-item.status-refused { border-left-color: #d93025; }
        .history-item.status-follow-up { border-left-color: #f29900; }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .status-badge {
          font-size: 0.8rem;
          font-weight: bold;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .status-accepted .status-badge { background: #e6f4ea; color: #1e7e34; }
        .status-refused .status-badge { background: #fce8e6; color: #d93025; }
        .status-follow-up .status-badge { background: #fef7e0; color: #f29900; }
        
        .history-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          font-size: 0.9rem;
          gap: 10px;
        }
        .history-notes {
          margin-top: 10px;
          font-size: 0.9rem;
          background: white;
          padding: 8px;
          border-radius: 5px;
        }
      `}</style>
    </div>
  );
};

export default RenewalModal;
