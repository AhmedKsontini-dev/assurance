import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Calendar, 
  Save, 
  X, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  History, 
  Plus, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';

const RenewalModal = ({ client, onClose, onRenewalSuccess }) => {
  const [formData, setFormData] = useState({
    new_expiration_date: '',
    plan_duration: '12 Months',
    notes: '',
    status: 'Accepted',
    old_expiration_date: client.date_expiration ? new Date(client.date_expiration).toLocaleDateString('en-CA') : '',
    
    // Amount Choice
    amount_choice: 'same', // 'same' or 'custom'
    montant: client.montant !== null && client.montant !== undefined ? client.montant.toString() : '',
    reduction: client.reduction !== null && client.reduction !== undefined ? client.reduction.toString() : '0',
    
    // Payment settings
    paiement: client.paiement || 'Espece',
    payment_date: new Date().toLocaleDateString('en-CA'),
    payment_type: 'comptant', // 'comptant' or 'partiel'
    date_prochain_paiement: '',
    
    // Multiple payments
    versements: []
  });

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [validationError, setValidationError] = useState('');

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
    if (duration === 'Custom') {
      setFormData(prev => ({
        ...prev,
        plan_duration: duration
      }));
      return;
    }

    const baseDate = client.date_expiration ? new Date(client.date_expiration) : new Date();
    const newDate = new Date(baseDate);
    
    if (duration === '3 Months') newDate.setMonth(newDate.getMonth() + 3);
    else if (duration === '6 Months') newDate.setMonth(newDate.getMonth() + 6);
    else if (duration === '12 Months') newDate.setFullYear(newDate.getFullYear() + 1);
    else if (duration === '24 Months') newDate.setFullYear(newDate.getFullYear() + 2);

    setFormData(prev => ({
      ...prev,
      plan_duration: duration,
      new_expiration_date: newDate.toLocaleDateString('en-CA')
    }));
  };

  // Helper to safely calculate previous contract total
  const getClientTotal = (c) => {
    if (c.total !== null && c.total !== undefined && c.total !== '') {
      return parseFloat(c.total);
    }
    const m = parseFloat(c.montant || 0);
    const r = parseFloat(c.reduction || 0);
    return m - r;
  };

  // On-the-fly calculations
  const totalToPay = formData.amount_choice === 'same' 
    ? getClientTotal(client) 
    : (parseFloat(formData.montant || 0) - parseFloat(formData.reduction || 0));

  const montantPaye = formData.payment_type === 'comptant'
    ? totalToPay
    : formData.versements.reduce((acc, v) => acc + parseFloat(v.montant || 0), 0);

  const resteAPayer = Math.max(0, totalToPay - montantPaye);
  
  const paymentStatus = resteAPayer <= 0 
    ? 'Paid' 
    : (montantPaye > 0 ? 'Partial' : 'Unpaid');

  const handlePaymentTypeChange = (type) => {
    let newVersements = [...formData.versements];
    if (type === 'partiel' && newVersements.length === 0) {
      newVersements = [{
        montant: '',
        date_versement: new Date().toLocaleDateString('en-CA'),
        methode_paiement: formData.paiement || 'Espece'
      }];
    }
    setFormData(prev => ({
      ...prev,
      payment_type: type,
      versements: newVersements
    }));
  };

  const addVersement = () => {
    setFormData(prev => ({
      ...prev,
      versements: [
        ...prev.versements,
        {
          montant: '',
          date_versement: new Date().toLocaleDateString('en-CA'),
          methode_paiement: prev.paiement || 'Espece'
        }
      ]
    }));
  };

  const removeVersement = (index) => {
    setFormData(prev => {
      const updated = [...prev.versements];
      updated.splice(index, 1);
      return {
        ...prev,
        versements: updated
      };
    });
  };

  const updateVersement = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.versements];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return {
        ...prev,
        versements: updated
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    
    // Validation of inputs
    if (formData.status === 'Accepted') {
      if (!formData.new_expiration_date) {
        setValidationError("Veuillez renseigner la nouvelle date d'expiration.");
        return;
      }
      
      if (formData.amount_choice === 'custom') {
        const montantNum = parseFloat(formData.montant);
        if (isNaN(montantNum) || montantNum < 0) {
          setValidationError("Veuillez entrer un montant valide supérieur ou égal à 0.");
          return;
        }
        const reductionNum = parseFloat(formData.reduction || 0);
        if (isNaN(reductionNum) || reductionNum < 0) {
          setValidationError("Veuillez entrer une réduction valide supérieure ou égale à 0.");
          return;
        }
        if (montantNum - reductionNum < 0) {
          setValidationError("Le total net (Montant - Réduction) ne peut pas être négatif.");
          return;
        }
      }
      
      if (formData.payment_type === 'partiel') {
        if (formData.versements.length === 0) {
          setValidationError("Veuillez ajouter au moins un versement pour le paiement partiel.");
          return;
        }
        
        for (let i = 0; i < formData.versements.length; i++) {
          const v = formData.versements[i];
          const vAmt = parseFloat(v.montant);
          if (isNaN(vAmt) || vAmt <= 0) {
            setValidationError(`Le versement #${i + 1} doit avoir un montant supérieur à 0.`);
            return;
          }
          if (!v.date_versement) {
            setValidationError(`Le versement #${i + 1} doit avoir une date de versement.`);
            return;
          }
        }
        
        if (montantPaye > totalToPay + 0.01) {
          setValidationError(`Le montant total payé (${montantPaye.toFixed(2)} DT) dépasse le total à payer (${totalToPay.toFixed(2)} DT).`);
          return;
        }
        
        if (resteAPayer > 0 && !formData.date_prochain_paiement) {
          setValidationError("Veuillez choisir une date de prochain paiement pour le reste à payer.");
          return;
        }
      } else {
        if (!formData.payment_date) {
          setValidationError("Veuillez choisir la date de paiement.");
          return;
        }
      }
    }

    setLoading(true);
    try {
      const payload = {
        new_expiration_date: formData.new_expiration_date,
        plan_duration: formData.plan_duration,
        notes: formData.notes,
        status: formData.status,
        old_expiration_date: formData.old_expiration_date,
      };

      if (formData.status === 'Accepted') {
        payload.montant = formData.amount_choice === 'same' ? parseFloat(client.montant || 0) : parseFloat(formData.montant || 0);
        payload.reduction = formData.amount_choice === 'same' ? parseFloat(client.reduction || 0) : parseFloat(formData.reduction || 0);
        payload.total = totalToPay;
        payload.paiement = formData.paiement;
        payload.payment_status = paymentStatus;
        payload.payment_date = formData.payment_date;
        payload.montant_paye = montantPaye;
        payload.date_prochain_paiement = resteAPayer > 0 ? formData.date_prochain_paiement : null;
        payload.versements = formData.payment_type === 'comptant'
          ? [{
              montant: totalToPay,
              date_versement: formData.payment_date,
              methode_paiement: formData.paiement
            }]
          : formData.versements.map(v => ({
              montant: parseFloat(v.montant),
              date_versement: v.date_versement,
              methode_paiement: v.methode_paiement
            }));
      }

      await api.post(`/clients/${client.id}/renew`, payload);
      onRenewalSuccess();
      
      // Notify other components (like Navbar) to refresh alert counts
      window.dispatchEvent(new Event('refresh-alerts'));
      
      onClose();
    } catch (err) {
      setValidationError(err.response?.data?.message || 'Le renouvellement a échoué');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content renewal-modal animate-pop" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <div className="header-title">
            <Calendar className="icon" />
            <div>
              <h2>Renouvellement de contrat</h2>
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
          {validationError && (
            <div className="validation-alert">
              <AlertTriangle size={18} />
              <span>{validationError}</span>
            </div>
          )}

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
              {/* Statut de l'appel */}
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

              {/* Si Accepté : Formulaire complet */}
              {formData.status === 'Accepted' && (
                <div className="accepted-fields-container">
                  {/* Section 1 : Durée & Expiration */}
                  <div className="section-card">
                    <h4 className="section-title">⏱️ Durée du nouveau forfait</h4>
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
                  </div>

                  {/* Section 2 : Tarification (Choix du montant) */}
                  <div className="section-card">
                    <h4 className="section-title">💰 Tarification du nouveau contrat</h4>
                    <div className="amount-choice-container">
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="amount_choice" 
                          value="same" 
                          checked={formData.amount_choice === 'same'} 
                          onChange={() => setFormData({...formData, amount_choice: 'same'})} 
                        />
                        <div className="radio-design"></div>
                        <span className="radio-text">
                          Garder le même montant ({getClientTotal(client).toFixed(2)} DT)
                        </span>
                      </label>
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="amount_choice" 
                          value="custom" 
                          checked={formData.amount_choice === 'custom'} 
                          onChange={() => setFormData({...formData, amount_choice: 'custom'})} 
                        />
                        <div className="radio-design"></div>
                        <span className="radio-text">Modifier le montant du contrat</span>
                      </label>
                    </div>

                    {formData.amount_choice === 'custom' && (
                      <div className="form-grid amount-custom-fields animate-fade-in">
                        <div className="form-group">
                          <label>Nouveau montant de base (Hors Réduction)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={formData.montant} 
                            onChange={(e) => setFormData({...formData, montant: e.target.value})}
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Réduction (DT)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={formData.reduction} 
                            onChange={(e) => setFormData({...formData, reduction: e.target.value})}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 3 : Informations de Paiement */}
                  <div className="section-card">
                    <h4 className="section-title">💳 Informations de règlement</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Méthode de paiement principale</label>
                        <select 
                          value={formData.paiement} 
                          onChange={(e) => {
                            const val = e.target.value;
                            const updatedVersements = formData.versements.map(v => 
                              v.methode_paiement === formData.paiement ? { ...v, methode_paiement: val } : v
                            );
                            setFormData({
                              ...formData, 
                              paiement: val,
                              versements: updatedVersements
                            });
                          }}
                        >
                          <option value="Espece">Espèce</option>
                          <option value="Cheque">Chèque</option>
                          <option value="Virement">Virement</option>
                          <option value="Kembyela">Kembyela</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Date de règlement</label>
                        <input 
                          type="date" 
                          value={formData.payment_date} 
                          onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                        />
                      </div>
                      
                      <div className="form-group full-width">
                        <label>Type de règlement</label>
                        <div className="payment-type-toggles">
                          <button 
                            type="button" 
                            className={`toggle-btn ${formData.payment_type === 'comptant' ? 'active' : ''}`}
                            onClick={() => handlePaymentTypeChange('comptant')}
                          >
                            Paiement comptant (Totalité)
                          </button>
                          <button 
                            type="button" 
                            className={`toggle-btn ${formData.payment_type === 'partiel' ? 'active' : ''}`}
                            onClick={() => handlePaymentTypeChange('partiel')}
                          >
                            Paiement en plusieurs tranches
                          </button>
                        </div>
                      </div>
                    </div>

                    {formData.payment_type === 'partiel' && (
                      <div className="versements-section animate-fade-in">
                        <div className="versements-header">
                          <h5>Tranches & Versements initial</h5>
                          <button type="button" className="add-v-btn" onClick={addVersement}>
                            <Plus size={14} /> Ajouter un versement
                          </button>
                        </div>
                        
                        <div className="versements-list">
                          {formData.versements.map((v, index) => (
                            <div key={index} className="versement-card-row">
                              <div className="row-number">#{index + 1}</div>
                              <div className="row-inputs">
                                <div className="row-input-group">
                                  <label>Montant (DT)</label>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    value={v.montant} 
                                    onChange={(e) => updateVersement(index, 'montant', e.target.value)}
                                    placeholder="0.00"
                                    required
                                  />
                                </div>
                                <div className="row-input-group">
                                  <label>Date</label>
                                  <input 
                                    type="date" 
                                    value={v.date_versement} 
                                    onChange={(e) => updateVersement(index, 'date_versement', e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="row-input-group">
                                  <label>Mode</label>
                                  <select 
                                    value={v.methode_paiement} 
                                    onChange={(e) => updateVersement(index, 'methode_paiement', e.target.value)}
                                  >
                                    <option value="Espece">Espèce</option>
                                    <option value="Cheque">Chèque</option>
                                    <option value="Virement">Virement</option>
                                    <option value="Kembyela">Kembyela</option>
                                  </select>
                                </div>
                              </div>
                              <button 
                                type="button" 
                                className="delete-row-btn" 
                                onClick={() => removeVersement(index)}
                                disabled={formData.versements.length <= 1}
                                title="Supprimer ce versement"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Synthèse Financière Automatique */}
                    <div className="financial-panel">
                      <div className="fin-col">
                        <span className="fin-label">Total à payer</span>
                        <span className="fin-value">{totalToPay.toFixed(2)} DT</span>
                      </div>
                      <div className="fin-col highlight-green">
                        <span className="fin-label text-success">Montant payé</span>
                        <span className="fin-value text-success">{montantPaye.toFixed(2)} DT</span>
                      </div>
                      <div className="fin-col highlight-red">
                        <span className="fin-label text-danger">Reste à payer</span>
                        <span className="fin-value text-danger">{resteAPayer.toFixed(2)} DT</span>
                      </div>
                    </div>

                    {resteAPayer > 0 && (
                      <div className="form-group next-pay-group animate-fade-in">
                        <label className="text-warning">📅 Date de prochain versement / paiement (Requis)</label>
                        <input 
                          type="date" 
                          value={formData.date_prochain_paiement} 
                          onChange={(e) => setFormData({...formData, date_prochain_paiement: e.target.value})}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes globales */}
              <div className="form-group full-width" style={{ marginTop: '20px' }}>
                <label>Notes de l'appel / Détails du renouvellement</label>
                <textarea 
                  placeholder="Détails de la conversation, raisons du refus, ou informations de suivi..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
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
          overflow-y: auto;
          background: #f8fafc;
        }
        .header-title {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .header-title .icon {
          background: rgba(59, 130, 246, 0.1);
          padding: 10px;
          border-radius: 12px;
          color: #3b82f6;
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
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: white;
          color: #475569;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .history-btn:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }
        .status-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 10px;
          margin-bottom: 10px;
        }
        .status-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 10px;
          border: 2px solid transparent;
          background: white;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          color: #64748b;
        }
        .status-btn.accepted.active {
          background: #effdf4;
          color: #15803d;
          border-color: #22c55e;
          box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.1);
        }
        .status-btn.refused.active {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #ef4444;
          box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.1);
        }
        .status-btn.follow-up.active {
          background: #fffbeb;
          color: #b45309;
          border-color: #f59e0b;
          box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.1);
        }
        
        .section-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .section-title {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 1.05rem;
          font-weight: 600;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 8px;
        }

        /* Radio Buttons */
        .amount-choice-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 15px;
        }
        .radio-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }
        .radio-label input[type="radio"] {
          display: none;
        }
        .radio-design {
          width: 20px;
          height: 20px;
          border: 2px solid #cbd5e1;
          border-radius: 50%;
          position: relative;
          transition: all 0.2s;
        }
        .radio-label input[type="radio"]:checked + .radio-design {
          border-color: #3b82f6;
          background: #3b82f6;
        }
        .radio-label input[type="radio"]:checked + .radio-design::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .radio-text {
          font-size: 0.95rem;
          color: #334155;
          font-weight: 500;
        }

        /* Toggles button group */
        .payment-type-toggles {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 5px;
        }
        .toggle-btn {
          padding: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }
        .toggle-btn:hover {
          background: #f1f5f9;
        }
        .toggle-btn.active {
          background: #e0f2fe;
          color: #0369a1;
          border-color: #38bdf8;
        }

        /* Versements List */
        .versements-section {
          margin-top: 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 15px;
        }
        .versements-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .versements-header h5 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #475569;
        }
        .add-v-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .add-v-btn:hover {
          background: #2563eb;
        }
        .versements-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .versement-card-row {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }
        .row-number {
          font-weight: 700;
          color: #94a3b8;
          font-size: 0.9rem;
          min-width: 20px;
        }
        .row-inputs {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }
        .row-input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .row-input-group label {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
        }
        .row-input-group input, .row-input-group select {
          padding: 6px 8px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.85rem;
          color: #334155;
        }
        .delete-row-btn {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fee2e2;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .delete-row-btn:hover:not(:disabled) {
          background: #fee2e2;
          color: #b91c1c;
        }
        .delete-row-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Financial Panel */
        .financial-panel {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          background: #f1f5f9;
          border-radius: 10px;
          padding: 15px;
          margin-top: 20px;
          text-align: center;
          gap: 10px;
        }
        .fin-col {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .fin-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }
        .fin-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-top: 4px;
        }
        .highlight-green {
          background: #f0fdf4;
          border-radius: 8px;
          padding: 8px;
        }
        .highlight-red {
          background: #fef2f2;
          border-radius: 8px;
          padding: 8px;
        }

        .next-pay-group {
          margin-top: 15px;
          background: #fffbeb;
          border: 1px dashed #f59e0b;
          padding: 12px;
          border-radius: 8px;
        }

        .validation-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .renewal-form .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .full-width {
          grid-column: span 2;
        }
        textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #cbd5e1;
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
          max-height: 500px;
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
          background: white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
          border-left-width: 4px;
        }
        .history-item.status-accepted { border-left-color: #16a34a; }
        .history-item.status-refused { border-left-color: #dc2626; }
        .history-item.status-follow-up { border-left-color: #d97706; }
        
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
        .status-accepted .status-badge { background: #dcfce7; color: #16a34a; }
        .status-refused .status-badge { background: #fee2e2; color: #dc2626; }
        .status-follow-up .status-badge { background: #fef3c7; color: #d97706; }
        
        .history-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          font-size: 0.9rem;
          gap: 10px;
        }
        .history-notes {
          margin-top: 10px;
          font-size: 0.9rem;
          background: #f8fafc;
          padding: 8px;
          border-radius: 5px;
          border: 1px solid #f1f5f9;
        }

        /* Animations */
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RenewalModal;
