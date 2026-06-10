import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useSinistreAlert } from '../context/SinistreAlertContext';
import api from '../services/api';

const Sinistres = () => {
  const [sinistres, setSinistres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sinistreToDelete, setSinistreToDelete] = useState(null);

  const { user, isAdmin } = useAuth();
  const { showAlert } = useAlert();
  const { alertSinistres, refreshAlerts } = useSinistreAlert();
  const navigate = useNavigate();
  const location = useLocation();

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filtering state
  const [filters, setFilters] = useState({
    numero_police: '',
    nom_client: '',
    immatriculation: '',
    numero_sinistre: '',
    date_accident: '',
    nature_sinistre: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Drag-scroll table refs & state
  const tableRef = useRef(null);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(true);

  const updateShadows = useCallback(() => {
    const el = tableRef.current;
    if (!el) return;
    setShowLeftShadow(el.scrollLeft > 8);
    setShowRightShadow(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  const onMouseDown = useCallback((e) => {
    const el = tableRef.current;
    if (!el) return;
    dragState.current = { isDragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    const el = tableRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.5;
    el.scrollLeft = dragState.current.scrollLeft - walk;
    updateShadows();
  }, [updateShadows]);

  const onMouseUp = useCallback(() => {
    dragState.current.isDragging = false;
    const el = tableRef.current;
    if (el) { el.style.cursor = 'grab'; el.style.userSelect = ''; }
  }, []);

  const onWheel = useCallback((e) => {
    const el = tableRef.current;
    if (!el) return;
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      el.scrollLeft += e.deltaX || e.deltaY;
      updateShadows();
    }
  }, [updateShadows]);

  const fetchSinistres = async () => {
    try {
      const response = await api.get('/sinistres');
      setSinistres(response.data.data);
      refreshAlerts();
    } catch (err) {
      showAlert.error('Erreur lors du chargement des sinistres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSinistres();
    
    if (location.state && location.state.successMessage) {
      setSuccessMessage(location.state.successMessage);
      // Clean up the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  const filteredSinistres = sinistres.filter((s) => {
    const normalizeDate = (dateVal) => {
      if (!dateVal) return '';
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const sDateAccident = normalizeDate(s.date_accident);

    return (
      (s.numero_police || '').toLowerCase().includes(filters.numero_police.toLowerCase()) &&
      (s.nom_client || '').toLowerCase().includes(filters.nom_client.toLowerCase()) &&
      (s.immatriculation || '').toLowerCase().includes(filters.immatriculation.toLowerCase()) &&
      (s.numero_sinistre || '').toLowerCase().includes(filters.numero_sinistre.toLowerCase()) &&
      (s.nature_sinistre || '').toLowerCase().includes(filters.nature_sinistre.toLowerCase()) &&
      (filters.date_accident === '' || sDateAccident === filters.date_accident)
    );
  });

  // Tri strict par ID décroissant
  filteredSinistres.sort((a, b) => b.id - a.id);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSinistres.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSinistres.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const confirmDelete = (id) => {
    setSinistreToDelete(id);
    setShowDeleteModal(true);
    setOpenDropdownId(null);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/sinistres/${sinistreToDelete}`);
      setSuccessMessage('Sinistre supprimé avec succès');
      setSinistres(sinistres.filter(s => s.id !== sinistreToDelete));
      refreshAlerts();
    } catch (err) {
      showAlert.error(err.message || 'Erreur lors de la suppression');
    } finally {
      setShowDeleteModal(false);
      setSinistreToDelete(null);
    }
  };

  if (loading) return <div className="loading">Loading sinistres...</div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Gestion des Sinistres</h1>
      </div>

      {/* Alert Banner */}
      {alertSinistres.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '20px', color: '#ef4444' }}>🔔</span>
            <h2 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#1e293b' 
            }}>
              Sinistres arrivant à échéance
            </h2>
            <span style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {alertSinistres.length}
            </span>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '16px' 
          }}>
            {alertSinistres.map(sinistre => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const chequeDate = new Date(sinistre.date_cheque);
              chequeDate.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((chequeDate - today) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={sinistre.id} style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'box-shadow 0.2s'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1e293b',
                      marginBottom: '4px'
                    }}>
                      {sinistre.nom_client}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#64748b',
                      marginBottom: '8px'
                    }}>
                      Police: {sinistre.numero_police}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#64748b',
                      marginBottom: '8px'
                    }}>
                      N° Sinistre: {sinistre.numero_sinistre}
                    </div>
                  </div>
                  
                  <div style={{ 
                    marginBottom: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '6px',
                    border: '1px solid #fee2e2'
                  }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                      Date du chèque
                    </div>
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: '700', 
                      color: '#dc2626' 
                    }}>
                      {new Date(sinistre.date_cheque).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      Échéance
                    </div>
                    <span style={{
                      backgroundColor: diffDays <= 3 ? '#fef3c7' : '#fef9c3',
                      color: diffDays <= 3 ? '#92400e' : '#854d0e',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {diffDays === 0 ? "Aujourd'hui" : diffDays === 1 ? 'Demain' : `Dans ${diffDays} jours`}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/sinistres/${sinistre.id}`)}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                  >
                    Voir Sinistre
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapsible Filter Section */}
      <div className="filter-section">
        <div className="filter-header" onClick={() => setShowFilters(!showFilters)}>
          <h3>Filtrage rapide</h3>
          <span className={`arrow ${showFilters ? 'open' : ''}`}>▼</span>
        </div>
        
        {showFilters && (
          <div className="filter-content">
            <div className="filter-grid">
              <div className="filter-item">
                <label>N° Police</label>
                <input 
                  type="text" 
                  placeholder="Filter by Police..." 
                  value={filters.numero_police}
                  onChange={(e) => handleFilterChange('numero_police', e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>Nom du Client</label>
                <input 
                  type="text" 
                  placeholder="Filter by Name..." 
                  value={filters.nom_client}
                  onChange={(e) => handleFilterChange('nom_client', e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>Immatriculation</label>
                <input 
                  type="text" 
                  placeholder="Filter by Plate..." 
                  value={filters.immatriculation}
                  onChange={(e) => handleFilterChange('immatriculation', e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>N° Sinistre</label>
                <input 
                  type="text" 
                  placeholder="Filter by Sinistre..." 
                  value={filters.numero_sinistre}
                  onChange={(e) => handleFilterChange('numero_sinistre', e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>Nature du Sinistre</label>
                <input 
                  type="text" 
                  placeholder="Filter by Nature..." 
                  value={filters.nature_sinistre}
                  onChange={(e) => handleFilterChange('nature_sinistre', e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>Date d'accident</label>
                <input 
                  type="date" 
                  value={filters.date_accident}
                  onChange={(e) => handleFilterChange('date_accident', e.target.value)}
                />
              </div>
            </div>
            <button className="clear-filters" onClick={() => setFilters({
              numero_police: '', 
              nom_client: '', 
              immatriculation: '', 
              numero_sinistre: '', 
              nature_sinistre: '', 
              date_accident: ''
            })}>Effacer tous les filtres</button>
          </div>
        )}
      </div>

      <div className="action-bar" style={{ justifyContent: 'flex-end' }}>
      
        
        {(user?.can_add || isAdmin) && (
          <button className="add-btn" onClick={() => navigate('/sinistres/nouveau')}>
            + Nouveau Sinistre
          </button>
        )}
      </div>

      <div className="table-container-wrapper" style={{ position: 'relative' }}>
        {showLeftShadow && <div className="scroll-shadow scroll-shadow-left"></div>}
        {showRightShadow && <div className="scroll-shadow scroll-shadow-right"></div>}
        
        <div 
          className="table-container drag-scroll"
          ref={tableRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          onScroll={updateShadows}
        >
          <table>
            <thead>
              <tr>
                <th>N° Sinistre</th>
                <th>N° Police</th>
                <th>Client</th>
                <th>Immatriculation</th>
                <th>Date Accident</th>
                <th>Nature</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((sinistre) => (
                <tr key={sinistre.id}>
                  <td>{sinistre.numero_sinistre}</td>
                  <td>{sinistre.numero_police}</td>
                  <td>{sinistre.nom_client}</td>
                  <td>{sinistre.immatriculation || '-'}</td>
                  <td>{sinistre.date_accident ? new Date(sinistre.date_accident).toLocaleDateString() : '-'}</td>
                  <td>{sinistre.nature_sinistre || '-'}</td>
                  <td className="actions-cell">
                    <div className="dropdown">
                      <button 
                        className="dropdown-toggle" 
                        onClick={() => setOpenDropdownId(openDropdownId === sinistre.id ? null : sinistre.id)}
                      >
                        Actions ▾
                      </button>
                      {openDropdownId === sinistre.id && (
                        <div className="dropdown-menu">
                          <button onClick={() => navigate(`/sinistres/${sinistre.id}`)} className="dropdown-item view">
                            <Eye size={16} style={{marginRight: '8px'}} /> Voir
                          </button>
                          {(user?.can_edit || isAdmin) && (
                            <button onClick={() => navigate(`/sinistres/modifier/${sinistre.id}`)} className="dropdown-item edit">
                              <Edit size={16} style={{marginRight: '8px'}} /> Modifier
                            </button>
                          )}
                          {(user?.can_delete || isAdmin) && (
                            <button onClick={() => confirmDelete(sinistre.id)} className="dropdown-item delete">
                              <Trash2 size={16} style={{marginRight: '8px'}} /> Supprimer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    Aucun sinistre trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pagination">
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
        <span>Page {currentPage} of {totalPages || 1}</span>
        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>Next</button>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal animate-pop">
            <div className="confirm-icon">⚠️</div>
            <h2>Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer ce sinistre ? Cette action est irréversible.</p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button className="confirm-delete-btn" onClick={handleDelete}>Oui, Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successMessage && (
        <div className="modal-overlay">
          <div className="modal-content success-modal animate-pop">
            <div className="success-icon">✅</div>
            <h2>Félicitations !</h2>
            <p>{successMessage}</p>
            <button className="success-close-btn" onClick={() => setSuccessMessage('')}>D'accord</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sinistres;
