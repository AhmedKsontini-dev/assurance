import React, { useState, useRef } from 'react';
import { Upload, X, FileText, FileSpreadsheet, CheckCircle, AlertCircle, AlertTriangle, Loader2, Play, Check } from 'lucide-react';
import api from '../services/api';
import './ImportClientsModal.css';

const ImportClientsModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setSelectedFile(null);
    setPreviewData(null);
    setError('');
    onClose();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      'application/pdf', 
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(file.type)) {
      setError('Format de fichier non supporté. Veuillez utiliser un PDF ou un fichier Excel.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Le fichier est trop volumineux (max 10MB).');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/clients/import/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === 'success') {
        setPreviewData(response.data.data);
        setStep(2);
      } else {
        setError(response.data.message || 'Erreur lors de l\'analyse du fichier.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur lors de l\'analyse.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.valid === 0) return;

    setImporting(true);
    setError('');

    try {
      const response = await api.post('/clients/import/confirm', {
        clients: previewData.clients
      });

      if (response.data.status === 'success') {
        setStep(3);
        setTimeout(() => {
          onSuccess(response.data.message);
          handleClose();
        }, 3000);
      } else {
        setError(response.data.message || 'Erreur lors de l\'importation.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur lors de l\'importation.');
    } finally {
      setImporting(false);
    }
  };

  const renderStatusBadge = (status, message) => {
    if (status === 'Valide') {
      return <span className="import-badge import-badge-valid"><CheckCircle size={14} /> Valide</span>;
    }
    if (status === 'Doublon') {
      return <span className="import-badge import-badge-duplicate" title={message}><AlertTriangle size={14} /> Doublon</span>;
    }
    return <span className="import-badge import-badge-error" title={message}><AlertCircle size={14} /> Erreur</span>;
  };

  return (
    <div className="modal-backdrop">
      <div className="import-modal-container">
        <div className="modal-header">
          <h2>📥 Importer des clients</h2>
          <button className="close-btn" onClick={handleClose} disabled={analyzing || importing}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message"><AlertCircle size={18} /> {error}</div>}

          {/* STEP 1: Sélection du fichier */}
          {step === 1 && (
            <div className="import-step step-1">
              <div className="step-title">Étape 1 — Sélection du fichier</div>
              
              <div 
                className="file-drop-area"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept=".pdf, .xls, .xlsx"
                  onChange={handleFileSelect}
                />
                
                {selectedFile ? (
                  <div className="selected-file-info">
                    {selectedFile.type === 'application/pdf' ? <FileText size={48} color="#ef4444" /> : <FileSpreadsheet size={48} color="#10b981" />}
                    <div className="file-name">{selectedFile.name}</div>
                    <div className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <Upload size={48} color="#94a3b8" />
                    <p>Cliquez pour sélectionner un fichier PDF ou Excel</p>
                    <span>Formats supportés : .pdf, .xls, .xlsx</span>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ marginTop: '2rem' }}>
                <button className="import-btn import-btn-cancel" onClick={handleClose}>
                  <X size={18} style={{ marginRight: '6px' }} /> Annuler
                </button>
                <button 
                  className="import-btn import-btn-primary" 
                  disabled={!selectedFile || analyzing} 
                  onClick={handleAnalyze}
                >
                  {analyzing ? <><Loader2 size={18} className="spin" style={{ marginRight: '6px' }} /> Analyse en cours...</> : <><Play size={18} style={{ marginRight: '6px' }} /> Analyser le fichier</>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Vérification */}
          {step === 2 && previewData && (
            <div className="import-step step-2" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '70vh' }}>
              <div className="step-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Étape 2 — Vérification des clients</span>
                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal', backgroundColor: '#e2e8f0', padding: '4px 10px', borderRadius: '12px' }}>
                  {previewData.total} client(s) détecté(s)
                </span>
              </div>
              
              <div className="import-stats" style={{ flexShrink: 0 }}>
                <div className="stat-card stat-valid">
                  <span className="stat-value">{previewData.valid}</span>
                  <span className="stat-label">Valides</span>
                </div>
                <div className="stat-card stat-duplicate">
                  <span className="stat-value">{previewData.duplicates}</span>
                  <span className="stat-label">Doublons</span>
                </div>
                <div className="stat-card stat-error">
                  <span className="stat-value">{previewData.errors}</span>
                  <span className="stat-label">Erreurs</span>
                </div>
              </div>

              {previewData.clients.length > 0 && previewData.clients[0]._detectedDateColumn && (
                <div style={{ flexShrink: 0, marginBottom: '1rem', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6', fontSize: '0.9rem', color: '#334155' }}>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>🔍 Mapping automatique :</span> La colonne <strong>"{previewData.clients[0]._detectedDateColumn}"</strong> du fichier correspond à <strong>"Date D'expiration"</strong> et sera insérée dans la base de données <code>(date_expiration)</code>.
                </div>
              )}

              <div className="table-responsive import-preview-table-container" style={{ flex: 1, minHeight: 0 }}>
                <table className="clients-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>État</th>
                      <th>N° Police</th>
                      <th>Sociétaire</th>
                      <th>Téléphone</th>
                      <th>Date D'expiration</th>
                      <th>Statut Paiement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.clients.map((client, idx) => (
                      <tr key={idx} className={client._status === 'Erreur' ? 'row-error' : (client._status === 'Doublon' ? 'row-duplicate' : '')}>
                        <td>{renderStatusBadge(client._status, client._message)}</td>
                        <td>{client.police || '-'}</td>
                        <td>{client.societaire || '-'}</td>
                        <td>{client.tel || '-'}</td>
                        <td>{client.date_expiration ? client.date_expiration.split('-').reverse().join('/') : '-'}</td>
                        <td>
                          <span className="payment-badge unpaid">Impayé</span>
                        </td>
                      </tr>
                    ))}
                    {previewData.clients.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                          Aucun client détecté dans le fichier.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="modal-footer" style={{ marginTop: '1rem', flexShrink: 0 }}>
                <button className="import-btn import-btn-cancel" onClick={() => setStep(1)} disabled={importing}>
                  <X size={18} style={{ marginRight: '6px' }} /> Retour
                </button>
                <button 
                  className="import-btn import-btn-primary" 
                  disabled={previewData.valid === 0 || importing} 
                  onClick={handleConfirmImport}
                >
                  {importing ? <><Loader2 size={18} className="spin" style={{ marginRight: '6px' }} /> Importation...</> : <><Check size={18} style={{ marginRight: '6px' }} /> Confirmer l'importation ({previewData.valid} clients)</>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Succès */}
          {step === 3 && (
            <div className="import-step step-3">
              <div className="success-container">
                <CheckCircle size={80} color="#10b981" />
                <h2>Importation terminée avec succès !</h2>
                <p>Les clients valides ont été ajoutés à la base de données.</p>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '1rem' }}>Fermeture automatique...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportClientsModal;
