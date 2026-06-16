import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';
import api from '../services/api';

const SinistreForm = () => {
  const [formData, setFormData] = useState({
    numero_police: '',
    nom_client: '',
    immatriculation: '',
    date_accident: '',
    numero_sinistre: '',
    nom_expert: '',
    nature_sinistre: '',
    montant_rapport_expertise: '',
    observation: '',
    date_cheque: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      const fetchSinistre = async () => {
        try {
          const response = await api.get(`/sinistres/${id}`);
          const data = response.data.data;
          setFormData({
            numero_police: data.numero_police || '',
            nom_client: data.nom_client || '',
            immatriculation: data.immatriculation || '',
            date_accident: data.date_accident ? data.date_accident.split('T')[0] : '',
            numero_sinistre: data.numero_sinistre || '',
            nom_expert: data.nom_expert || '',
            nature_sinistre: data.nature_sinistre || '',
            montant_rapport_expertise: data.montant_rapport_expertise || '',
            observation: data.observation || '',
            date_cheque: data.date_cheque ? data.date_cheque.split('T')[0] : ''
          });
        } catch (err) {
          showAlert.error(err.message || 'Erreur lors de la récupération des données');
          navigate('/sinistres');
        }
      };
      fetchSinistre();
    }
  }, [id, navigate, showAlert, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });
    
    if (file) {
      formDataToSend.append('rapport_cheque_file', file);
    }

    try {
      if (isEditMode) {
        await api.put(`/sinistres/${id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await api.post('/sinistres', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      navigate('/sinistres', { state: { successMessage: `Le sinistre a été ${isEditMode ? 'modifié' : 'ajouté'} avec succès.` } });
    } catch (err) {
      showAlert.error(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ justifyContent: 'center' }}>  
      <div style={{ justifyContent: 'center' }}> 
        <h1 style={{ fontSize: '2em', fontWeight: '700', color: '#0a2a53', textTransform: 'uppercase', letterSpacing: '1px' }}>{isEditMode ? 'Modifier le Sinistre' : 'Nouveau Sinistre'}</h1>
       </div> 
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}> 
        <form className="add-form-expanded" onSubmit={handleSubmit} encType="multipart/form-data">
          
          <div className="cf-section">
            <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
              <span className="cf-section-icon">👤</span>
              <span className="cf-section-title">Informations du Client</span>
            </div>
            <div className="cf-grid cf-grid-3">
              <div className="form-group cf-required">
                <label>Numéro de police</label>
                <input type="text" name="numero_police" value={formData.numero_police} onChange={handleChange} required />
              </div>
              <div className="form-group cf-required cf-span2">
                <label>Nom du client</label>
                <input type="text" name="nom_client" value={formData.nom_client} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className="cf-section">
            <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
              <span className="cf-section-icon">🚗</span>
              <span className="cf-section-title">Informations du Véhicule</span>
            </div>
            <div className="cf-grid cf-grid-3">
              <div className="form-group">
                <label>Immatriculation</label>
                <input type="text" name="immatriculation" value={formData.immatriculation} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="cf-section">
            <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' }}>
              <span className="cf-section-icon">⚠️</span>
              <span className="cf-section-title">Informations du Sinistre</span>
            </div>
            <div className="cf-grid cf-grid-3">
              <div className="form-group cf-required">
                <label>Date d'accident</label>
                <input type="date" name="date_accident" value={formData.date_accident} onChange={handleChange} required />
              </div>
              <div className="form-group cf-required">
                <label>Numéro de sinistre</label>
                <input type="text" name="numero_sinistre" value={formData.numero_sinistre} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Nature du sinistre</label>
                <input type="text" name="nature_sinistre" value={formData.nature_sinistre} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="cf-section">
            <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' }}>
              <span className="cf-section-icon">📋</span>
              <span className="cf-section-title">Rapport d'Expertise</span>
            </div>
            <div className="cf-grid cf-grid-3">
              <div className="form-group cf-span2">
                <label>Nom de l'expert</label>
                <input type="text" name="nom_expert" value={formData.nom_expert} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Montant du rapport (DT)</label>
                <input type="number" step="0.01" name="montant_rapport_expertise" value={formData.montant_rapport_expertise} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="cf-section">
            <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)' }}>
              <span className="cf-section-icon">💶</span>
              <span className="cf-section-title">Informations du Chèque</span>
            </div>
            <div className="cf-grid cf-grid-3">
              <div className="form-group">
                <label>Date du chèque</label>
                <input type="date" name="date_cheque" value={formData.date_cheque} onChange={handleChange} />
              </div>
              <div className="form-group cf-span2">
                <label>Rapport du chèque (Fichier joint)</label>
                <input type="file" name="rapport_cheque_file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ padding: '8px', background: '#f8fafc' }} />
                {isEditMode && <small style={{ display: 'block', marginTop: '5px', color: '#64748b' }}>Laissez vide pour conserver le fichier actuel.</small>}
              </div>
            </div>
          </div>

          <div className="cf-section">
            <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' }}>
              <span className="cf-section-icon">📝</span>
              <span className="cf-section-title">Observations</span>
            </div>
            <div className="form-group" style={{ padding: '15px' }}>
              <textarea 
                name="observation" 
                value={formData.observation} 
                onChange={handleChange} 
                rows="4"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <button type="button" className="cancel-btn" onClick={() => navigate('/sinistres')}>
              Retour
            </button>
            <button type="submit" className="add-btn" disabled={loading}>
              {loading ? 'Enregistrement...' : (isEditMode ? 'Modifier' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SinistreForm;
