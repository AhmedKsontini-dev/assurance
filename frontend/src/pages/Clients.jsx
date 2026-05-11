import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Eye, Edit, Trash2 } from 'lucide-react';

const Clients = () => {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Filtering & Pagination state
  const [filters, setFilters] = useState({
    date_effet: '',
    date_expiration: '',
    police: '',
    societaire: '',
    tel: '',
    immatriculation: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [grandTotal, setGrandTotal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // New client form state (All 14 fields)
  const initialFormState = {
    police: '',
    societaire: '',
    adresse: '',
    tel: '',
    paiement: '',
    montant: '',
    reduction: '',
    rc: '',
    papier: '',
    usage_vehicle: '',
    immatriculation: '',
    date_effet: '',
    date_expiration: '',
    total: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data.data);
    } catch (err) {
      setError('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/clients/${deleteConfirmId}`);
      setClients(clients.filter(c => c.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert('Delete failed');
    }
  };

  const confirmDelete = (id) => {
    setDeleteConfirmId(id);
    setOpenDropdownId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, formData);
        setSuccessMessage('Client modifié avec succès !');
      } else {
        await api.post('/clients', formData);
        setSuccessMessage('Client ajouté avec succès !');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleView = (client) => {
    setViewingClient(client);
    setOpenDropdownId(null);
  };

  const handleEdit = (client) => {
    setEditingId(client.id);
    setFormData({
      police: client.police || '',
      societaire: client.societaire || '',
      adresse: client.adresse || '',
      tel: client.tel || '',
      paiement: client.paiement || '',
      montant: client.montant || '',
      reduction: client.reduction || '',
      rc: client.rc || '',
      papier: client.papier || '',
      usage_vehicle: client.usage_vehicle || '',
      immatriculation: client.immatriculation || '',
      date_effet: client.date_effet ? client.date_effet.split('T')[0] : '',
      date_expiration: client.date_expiration ? client.date_expiration.split('T')[0] : '',
      total: client.total || ''
    });
    setShowForm(true);
    setOpenDropdownId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const calculateGrandTotal = () => {
    const total = filteredClients.reduce((sum, client) => sum + (parseFloat(client.total) || 0), 0);
    setGrandTotal(total.toFixed(2));
  };

  // Filter clients based on all 6 filter fields
  const filteredClients = clients.filter(client => {
    return (
      (client.police || '').toLowerCase().includes(filters.police.toLowerCase()) &&
      (client.societaire || '').toLowerCase().includes(filters.societaire.toLowerCase()) &&
      (client.tel || '').toLowerCase().includes(filters.tel.toLowerCase()) &&
      (client.immatriculation || '').toLowerCase().includes(filters.immatriculation.toLowerCase()) &&
      (filters.date_effet === '' || (client.date_effet && client.date_effet.includes(filters.date_effet))) &&
      (filters.date_expiration === '' || (client.date_expiration && client.date_expiration.includes(filters.date_expiration)))
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div className="loading">Loading clients...</div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Clients Management</h1>
      </div>

      {/* Collapsible Filter Section */}
      <div className="filter-section">
        <div className="filter-header" onClick={() => setShowFilters(!showFilters)}>
          <h3>Quick Filters</h3>
          <span className={`arrow ${showFilters ? 'open' : ''}`}>▼</span>
        </div>
        
        {showFilters && (
          <div className="filter-content">
            <div className="filter-grid">
              <div className="filter-item">
                <label>Police</label>
                <input 
                  type="text" 
                  placeholder="Filter by Police..." 
                  value={filters.police}
                  onChange={(e) => handleFilterChange('police', e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>Societaire</label>
                <input 
                  type="text" 
                  placeholder="Filter by Name..." 
                  value={filters.societaire}
                  onChange={(e) => handleFilterChange('societaire', e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>Telephone</label>
                <input 
                  type="text" 
                  placeholder="Filter by Phone..." 
                  value={filters.tel}
                  onChange={(e) => handleFilterChange('tel', e.target.value)}
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
                <label>Date d'effet</label>
                <input 
                  type="date" 
                  value={filters.date_effet}
                  onChange={(e) => handleFilterChange('date_effet', e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>Date d'expiration</label>
                <input 
                  type="date" 
                  value={filters.date_expiration}
                  onChange={(e) => handleFilterChange('date_expiration', e.target.value)}
                />
              </div>
            </div>
            <button className="clear-filters" onClick={() => setFilters({
              date_effet: '', date_expiration: '', police: '', societaire: '', tel: '', immatriculation: ''
            })}>Clear All Filters</button>
          </div>
        )}
      </div>

      <div className="action-bar">
        {isAdmin && (
          <div className="total-display-container">
            <button className="total-btn" onClick={calculateGrandTotal}>
              📊 Calcule Total
            </button>
            {grandTotal !== null && (
              <div className="total-badge animate-pop">
                <span className="label">Grand Total:</span>
                <span className="value">{grandTotal} <small>DT</small></span>
              </div>
            )}
          </div>
        )}
        <button className="add-btn" onClick={() => {
          if (showForm && editingId) {
            setEditingId(null);
            setFormData(initialFormState);
          } else {
            setShowForm(!showForm);
          }
        }}>
          {showForm ? 'Cancel' : '+ Add New Client'}
        </button>
      </div>      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content form-modal">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Client' : 'New Client Information'}</h2>
              <button className="close-modal" onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData(initialFormState);
              }}>&times;</button>
            </div>
            <div className="modal-body">
              <form className="add-form-expanded" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Police</label>
                    <input value={formData.police} onChange={e => setFormData({...formData, police: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Societaire</label>
                    <input value={formData.societaire} onChange={e => setFormData({...formData, societaire: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Adresse</label>
                    <input value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Telephone</label>
                    <input value={formData.tel} onChange={e => setFormData({...formData, tel: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Paiement</label>
                    <select 
                      value={formData.paiement} 
                      onChange={e => setFormData({...formData, paiement: e.target.value})}
                    >
                      <option value="">Sélectionner...</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Espece">Espece</option>
                      <option value="Virement">Virement</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Montant</label>
                    <input type="number" value={formData.montant} onChange={e => setFormData({...formData, montant: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Reduction</label>
                    <input type="number" value={formData.reduction} onChange={e => setFormData({...formData, reduction: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>RC</label>
                    <input type="number" value={formData.rc} onChange={e => setFormData({...formData, rc: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Papier</label>
                    <input value={formData.papier} onChange={e => setFormData({...formData, papier: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Usage Vehicle</label>
                    <input value={formData.usage_vehicle} onChange={e => setFormData({...formData, usage_vehicle: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Immatriculation</label>
                    <input value={formData.immatriculation} onChange={e => setFormData({...formData, immatriculation: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Date d'effet</label>
                    <input type="date" value={formData.date_effet} onChange={e => setFormData({...formData, date_effet: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Date d'expiration</label>
                    <input type="date" value={formData.date_expiration} onChange={e => setFormData({...formData, date_expiration: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Total</label>
                    <input type="number" value={formData.total} onChange={e => setFormData({...formData, total: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="save-btn">
                  {editingId ? 'Update Client' : 'Save Client'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingClient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Client Details</h2>
              <button className="close-modal" onClick={() => setViewingClient(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="view-grid">
                <p><strong>Police:</strong> {viewingClient.police}</p>
                <p><strong>Societaire:</strong> {viewingClient.societaire}</p>
                <p><strong>Adresse:</strong> {viewingClient.adresse}</p>
                <p><strong>Telephone:</strong> {viewingClient.tel}</p>
                <p><strong>Paiement:</strong> {viewingClient.paiement}</p>
                <p><strong>Montant:</strong> {viewingClient.montant}</p>
                <p><strong>Reduction:</strong> {viewingClient.reduction}</p>
                <p><strong>RC:</strong> {viewingClient.rc}</p>
                <p><strong>Papier:</strong> {viewingClient.papier}</p>
                <p><strong>Usage:</strong> {viewingClient.usage_vehicle}</p>
                <p><strong>Immatriculation:</strong> {viewingClient.immatriculation}</p>
                <p><strong>Date Effet:</strong> {viewingClient.date_effet ? new Date(viewingClient.date_effet).toLocaleDateString() : '-'}</p>
                <p><strong>Date Expiration:</strong> {viewingClient.date_expiration ? new Date(viewingClient.date_expiration).toLocaleDateString() : '-'}</p>
                <p><strong>Créé le:</strong> {viewingClient.created_at ? new Date(viewingClient.created_at).toLocaleString() : '-'}</p>
                <p><strong>Total:</strong> {viewingClient.total}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      <div className="table-container scrollable">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Police</th>
              <th>Societaire</th>
              <th>Telephone</th>
              <th>Immatriculation</th>
              <th>Usage</th>
              <th>Date d'effet</th>
              <th>Date d'expiration</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(client => (
              <tr key={client.id}>
                <td>{client.id}</td>
                <td>{client.police}</td>
                <td>{client.societaire}</td>
                <td>{client.tel}</td>
                <td>{client.immatriculation}</td>
                <td>{client.usage_vehicle}</td>
                <td>{client.date_effet ? new Date(client.date_effet).toLocaleDateString() : '-'}</td>
                <td>{client.date_expiration ? new Date(client.date_expiration).toLocaleDateString() : '-'}</td>
                <td className="amount">{client.total}</td>
                <td className="actions-cell">
                  <div className="dropdown">
                    <button 
                      className="dropdown-toggle" 
                      onClick={() => setOpenDropdownId(openDropdownId === client.id ? null : client.id)}
                    >
                      Actions ▾
                    </button>
                    {openDropdownId === client.id && (
                      <div className="dropdown-menu">
                        <button onClick={() => handleView(client)} className="dropdown-item view">
                          <Eye size={16} style={{marginRight: '8px'}} /> Voir
                        </button>
                        <button onClick={() => handleEdit(client)} className="dropdown-item edit">
                          <Edit size={16} style={{marginRight: '8px'}} /> Modifier
                        </button>
                        <button onClick={() => { 
                          confirmDelete(client.id); 
                        }} className="dropdown-item delete">
                          <Trash2 size={16} style={{marginRight: '8px'}} /> Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal animate-pop">
            <div className="confirm-icon">⚠️</div>
            <h2>Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.</p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setDeleteConfirmId(null)}>Annuler</button>
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

      <div className="pagination">
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
        <span>Page {currentPage} of {totalPages || 1}</span>
        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>Next</button>
      </div>
    </div>
  );
};

export default Clients;
