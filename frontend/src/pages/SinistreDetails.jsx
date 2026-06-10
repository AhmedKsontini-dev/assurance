import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';
import api from '../services/api';

const UPLOADS_URL = 'http://100.113.217.68:5000';

const SinistreDetails = () => {
  const [sinistre, setSinistre] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchSinistre = async () => {
      try {
        const response = await api.get(`/sinistres/${id}`);
        setSinistre(response.data.data);
      } catch (err) {
        showAlert.error(err.message || 'Erreur lors du chargement des détails');
        navigate('/sinistres');
      } finally {
        setLoading(false);
      }
    };
    fetchSinistre();
  }, [id, navigate, showAlert]);

  if (loading) return <div className="loader"></div>;
  if (!sinistre) return <div>Sinistre introuvable</div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Détails du Sinistre {sinistre.numero_sinistre}</h1>
        <button className="cancel-btn" onClick={() => navigate('/sinistres')}>
          Retour à la liste
        </button>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
          <div className="cf-section">
            <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
              <span className="cf-section-icon">👤</span>
              <span className="cf-section-title">Informations du client</span>
            </div>
            <div className="cf-grid cf-grid-3">
              <div className="form-group">
                <label>Numéro de police</label>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '4px' }}>{sinistre.numero_police}</div>
              </div>
              <div className="form-group cf-span2">
                <label>Nom du client</label>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '4px' }}>{sinistre.nom_client}</div>
              </div>
            </div>
          </div>

          <div className="cf-section">
            <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
              <span className="cf-section-icon">🚗</span>
              <span className="cf-section-title">Informations du véhicule</span>
            </div>
            <div className="cf-grid cf-grid-3">
              <div className="form-group">
                <label>Immatriculation</label>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '4px' }}>{sinistre.immatriculation || 'Non spécifiée'}</div>
              </div>
            </div>
          </div>

          <div className="cf-section">
            <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' }}>
              <span className="cf-section-icon">⚠️</span>
              <span className="cf-section-title">Informations du sinistre</span>
            </div>
            <div className="cf-grid cf-grid-3">
              <div className="form-group">
                <label>Date d'accident</label>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '4px' }}>{sinistre.date_accident ? new Date(sinistre.date_accident).toLocaleDateString() : 'Non spécifiée'}</div>
              </div>
              <div className="form-group">
                <label>Numéro de sinistre</label>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '4px' }}>{sinistre.numero_sinistre}</div>
              </div>
              <div className="form-group">
                <label>Nature du sinistre</label>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '4px' }}>{sinistre.nature_sinistre || 'Non spécifiée'}</div>
              </div>
            </div>
          </div>

          <div className="cf-section">
            <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' }}>
              <span className="cf-section-icon">📋</span>
              <span className="cf-section-title">Rapport d'expertise</span>
            </div>
            <div className="cf-grid cf-grid-3">
              <div className="form-group cf-span2">
                <label>Nom de l'expert</label>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '4px' }}>{sinistre.nom_expert || 'Non spécifié'}</div>
              </div>
              <div className="form-group">
                <label>Montant du rapport</label>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '4px' }}>{sinistre.montant_rapport_expertise ? `${sinistre.montant_rapport_expertise} DT` : 'Non spécifié'}</div>
              </div>
            </div>
          </div>

          <div className="cf-section">
            <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)' }}>
              <span className="cf-section-icon">💶</span>
              <span className="cf-section-title">Informations du chèque</span>
            </div>
            <div className="cf-grid cf-grid-3">
              <div className="form-group">
                <label>Date du chèque</label>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '4px' }}>{sinistre.date_cheque ? new Date(sinistre.date_cheque).toLocaleDateString() : 'Non spécifiée'}</div>
              </div>
              <div className="form-group cf-span2">
                <label>Fichier</label>
                <div style={{ padding: '10px' }}>
                  {sinistre.rapport_cheque ? (
                    <a 
                      href={`${UPLOADS_URL}/uploads/${sinistre.rapport_cheque}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="add-btn"
                      style={{ textDecoration: 'none', display: 'inline-block' }}
                    >
                      📄 Visualiser le rapport
                    </a>
                  ) : (
                    <span style={{ fontStyle: 'italic', color: '#7f8c8d' }}>Aucun fichier joint.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="cf-section">
            <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' }}>
              <span className="cf-section-icon">📝</span>
              <span className="cf-section-title">Observations</span>
            </div>
            <div className="form-group" style={{ padding: '15px' }}>
              <div style={{ whiteSpace: 'pre-wrap', color: '#334155', lineHeight: '1.6', background: '#f8fafc', padding: '15px', borderRadius: '4px' }}>
                {sinistre.observation || 'Aucune observation.'}
              </div>
            </div>
          </div>

      </div>
    </div>
  );
};

export default SinistreDetails;
