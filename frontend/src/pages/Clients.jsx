import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Eye, Edit, Trash2, RefreshCw, Filter, CheckCircle, XCircle, DollarSign, Plus } from 'lucide-react';
import RenewalModal from '../components/RenewalModal';

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
  const [renewingClient, setRenewingClient] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryStats, setCategoryStats] = useState({ total: 0, stats: [] });
  
  // Filtering & Pagination state
  const [filters, setFilters] = useState({
    date_effet: '',
    date_expiration: '',
    police: '',
    societaire: '',
    tel: '',
    immatriculation: '',
    usage_vehicle: '',
    rc: '',
    papier: '',
    status: '',
    payment_status: '',
    category: ''
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
    total: '',
    payment_status: 'Unpaid',
    payment_date: '',
    payment_method: '',
    category: ''
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
  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchCategoryStats = async () => {
    try {
      const res = await api.get('/clients/category-stats');
      setCategoryStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch category stats');
    }
  };

  useEffect(() => {
    fetchClients();
    fetchCategories();
    if (isAdmin) {
      fetchCategoryStats();
    }
  }, [isAdmin]);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/clients/${deleteConfirmId}`);
      setClients(clients.filter(c => c.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      
      // Refresh global stats and notifications
      if (isAdmin) fetchCategoryStats();
      window.dispatchEvent(new Event('refresh-alerts'));
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
      
      // Refresh global stats and notifications
      if (isAdmin) fetchCategoryStats();
      window.dispatchEvent(new Event('refresh-alerts'));
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const togglePaymentStatus = async (client) => {
    try {
      const newStatus = client.payment_status === 'Paid' ? 'Unpaid' : 'Paid';
      const updateData = { 
        payment_status: newStatus,
        payment_date: newStatus === 'Paid' ? new Date().toLocaleDateString('en-CA') : null
      };
      
      await api.put(`/clients/${client.id}`, updateData);
      setClients(clients.map(c => c.id === client.id ? { ...c, ...updateData } : c));
    } catch (err) {
      alert('Failed to update payment status');
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
      date_effet: client.date_effet ? new Date(client.date_effet).toLocaleDateString('en-CA') : '',
      date_expiration: client.date_expiration ? new Date(client.date_expiration).toLocaleDateString('en-CA') : '',
      total: client.total || '',
      payment_status: client.payment_status || 'Unpaid',
      payment_date: client.payment_date ? new Date(client.payment_date).toLocaleDateString('en-CA') : '',
      payment_method: client.payment_method || '',
      category: client.category || ''
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
    // Helper to format date for comparison (handles timezone shifts by using local time)
    const normalizeDate = (dateVal) => {
      if (!dateVal) return '';
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const clientDateEffet = normalizeDate(client.date_effet);
    const clientDateExpiration = normalizeDate(client.date_expiration);

    return (
      (client.police || '').toLowerCase().includes(filters.police.toLowerCase()) &&
      (client.societaire || '').toLowerCase().includes(filters.societaire.toLowerCase()) &&
      (client.tel || '').toLowerCase().includes(filters.tel.toLowerCase()) &&
      (client.immatriculation || '').toLowerCase().includes(filters.immatriculation.toLowerCase()) &&
      (client.usage_vehicle || '').toLowerCase().includes(filters.usage_vehicle.toLowerCase()) &&
      (client.rc || '').toString().toLowerCase().includes(filters.rc.toLowerCase()) &&
      (filters.papier === '' || (client.papier || '').toLowerCase().includes(filters.papier.toLowerCase())) &&
      (filters.date_effet === '' || clientDateEffet === filters.date_effet) &&
      (filters.date_expiration === '' || clientDateExpiration === filters.date_expiration) &&
      (filters.payment_status === '' || client.payment_status === filters.payment_status) &&
      (filters.category === '' || client.category === filters.category) &&
      (filters.status === '' || (() => {
        if (!client.date_expiration) return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        const exp = new Date(client.date_expiration);
        exp.setHours(0,0,0,0);
        const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
        
        if (filters.status === 'expiring_soon') return diff > 0 && diff <= 15 && client.renewal_status !== 'Refused';
        if (filters.status === 'expired') return diff <= 0 && client.renewal_status !== 'Refused';
        if (filters.status === 'renewable') return diff <= 30 && client.renewal_status !== 'Refused';
        return true;
      })())
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
        <h1>Gestion des Clients</h1>
      </div>

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
                <label>Usage du véhicule</label>
                <input 
                  type="text" 
                  placeholder="Filter by Usage..." 
                  value={filters.usage_vehicle}
                  onChange={(e) => handleFilterChange('usage_vehicle', e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>RC</label>
                <input 
                  type="text" 
                  placeholder="Filter by RC..." 
                  value={filters.rc}
                  onChange={(e) => handleFilterChange('rc', e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>Papier</label>
                <input 
                  type="text" 
                  placeholder="Filter by Papier..." 
                  value={filters.papier}
                  onChange={(e) => handleFilterChange('papier', e.target.value)}
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
              
              <div className="filter-item">
                <label>Statut Paiement</label>
                <select 
                  value={filters.payment_status}
                  onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                >
                  <option value="">Tous les paiements</option>
                  <option value="Paid">Payé</option>
                  <option value="Unpaid">Impayé</option>
                </select>
              </div>
              <div className="filter-item">
                <label>Catégorie</label>
                <select 
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="clear-filters" onClick={() => setFilters({
              date_effet: '', 
              date_expiration: '', 
              police: '', 
              societaire: '', 
              tel: '', 
              immatriculation: '',
              usage_vehicle: '',
              rc: '',
              papier: '',
              status: '',
              payment_status: '',
              category: ''
            })}>Effacer tous les filtres</button>
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
            <div className="stats-mini-pills">
              
              <span className="pill unpaid">
                {filteredClients.filter(c => c.payment_status === 'Unpaid' || !c.payment_status).length} Impayé
              </span>
            </div>
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
          {showForm ? 'Annuler' : '+ Ajouter un Client'}
        </button>
      </div>      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content form-modal">
            <div className="modal-header">
              <h2>{editingId ? 'Modifier un Client' : 'Nouveau Client'}</h2>
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
                      <option value="Kembyela">Kembyela</option>
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
                  <div className="form-group">
                    <label>Statut Paiement</label>
                    <select 
                      value={formData.payment_status} 
                      onChange={e => setFormData({...formData, payment_status: e.target.value})}
                    >
                      <option value="Unpaid">Impayé</option>
                      <option value="Paid">Payé</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date de Paiement</label>
                    <input type="date" value={formData.payment_date} onChange={e => setFormData({...formData, payment_date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Catégorie</label>
                    <div className="category-input-container">
                      <select 
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                        <option value="">Sélectionner une catégorie...</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        className="add-category-btn"
                        onClick={() => setShowCategoryModal(true)}
                        title="Ajouter une nouvelle catégorie"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                <button type="submit" className="save-btn">
                  {editingId ? 'Modifier' : 'Sauvegarder Client'}
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
              <h2>Details Client</h2>
              <button className="close-modal" onClick={() => setViewingClient(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="view-grid">
                <p><strong>ID:</strong> {viewingClient.id}</p>
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
                <p><strong>Total:</strong> {viewingClient.total}</p>
                <p><strong>Créé le:</strong> {viewingClient.created_at ? new Date(viewingClient.created_at).toLocaleString() : '-'}</p>
                <p><strong>Ajouter par:</strong> {viewingClient.creator_name || '-'}</p>
                <p><strong>Statut Renouvellement:</strong> {viewingClient.renewal_status || '-'}</p>
                <p><strong>Statut Paiement:</strong> {viewingClient.payment_status === 'Paid' ? '✅ Payé' : viewingClient.payment_status === 'Partial' ? '⚠️ Partiel' : '❌ Impayé'}</p>
                <p><strong>Date Paiement:</strong> {viewingClient.payment_date ? new Date(viewingClient.payment_date).toLocaleDateString() : '-'}</p>
                <p><strong>Catégorie:</strong> {viewingClient.category || '-'}</p>
                <p><strong>Montant Payé:</strong> {viewingClient.montant_paye}</p>
                <p><strong>Prochain Paiement:</strong> {viewingClient.date_prochain_paiement ? new Date(viewingClient.date_prochain_paiement).toLocaleDateString() : '-'}</p>
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
              <th>Police</th>
              <th>Sociétaire</th>
              <th>Adresse</th>
              <th>Téléphone</th>
              <th>Montant</th>
              <th>Réduction</th>
              <th>Immatriculation</th>
              <th>Date d'effet</th>
              <th>Date d'expiration</th>
              <th>Total</th>
              <th>Statut Paiement</th>
              <th>Catégorie</th>
              <th>Montant Payé</th>
              <th>Prochain Paiement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(client => {
              const totalAmount = parseFloat(client.total) || 0;
              const paidAmount = parseFloat(client.montant_paye) || 0;
              const remainingAmount = totalAmount - paidAmount;
              
              let paymentStatusStr = client.payment_status === 'Paid' ? 'Payé' : 'Impayé';
              let statusClass = client.payment_status === 'Paid' ? 'paid' : 'unpaid';
              if (client.payment_status === 'Partial') {
                paymentStatusStr = 'Partiellement payé';
                statusClass = 'partial';
              }

              return (
              <tr key={client.id}>
                <td>{client.police}</td>
                <td>{client.societaire}</td>
                <td>{client.adresse || '-'}</td>
                <td>{client.tel || '-'}</td>
                <td className="amount">{client.montant !== null && client.montant !== undefined ? `${client.montant} DT` : '-'}</td>
                <td className="amount">{client.reduction !== null && client.reduction !== undefined ? `${client.reduction} DT` : '-'}</td>
                <td>{client.immatriculation || '-'}</td>
                <td>{client.date_effet ? new Date(client.date_effet).toLocaleDateString() : '-'}</td>
                <td className={(() => {
                  if (client.renewal_status === 'Refused') return 'expiration-expired';
                  if (!client.date_expiration) return '';
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const exp = new Date(client.date_expiration);
                  exp.setHours(0,0,0,0);
                  const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
                  if (diff <= 0) return 'expiration-expired';
                  if (diff <= 3) return 'expiration-critical';
                  if (diff <= 10) return 'expiration-warning';
                  return '';
                })()}>
                  <div className="expiration-cell">
                    <span>
                      {client.renewal_status === 'Refused' 
                        ? 'Renou refusé' 
                        : (client.date_expiration ? new Date(client.date_expiration).toLocaleDateString() : '-')}
                    </span>
                    {(() => {
                      if (client.renewal_status === 'Refused') return <span className="expire-badge expired">Renou refusé</span>;
                      if (!client.date_expiration) return null;
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      const exp = new Date(client.date_expiration);
                      exp.setHours(0,0,0,0);
                      const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
                      if (diff <= 0) return <span className="expire-badge expired">Expiré</span>;
                      if (diff <= 3) return <span className="expire-badge critical">Expire bientôt</span>;
                      if (diff <= 10) return <span className="expire-badge warning">{diff}j restants</span>;
                      return null;
                    })()}
                  </div>
                </td>
                <td className="amount">{totalAmount.toFixed(2)} DT</td>
                <td>
                  <button 
                    onClick={() => togglePaymentStatus(client)}
                    className={`payment-toggle-btn ${statusClass}`}
                    title={paymentStatusStr === 'Payé' ? 'Marquer comme Impayé' : 'Marquer comme Payé'}
                  >
                    {paymentStatusStr === 'Payé' ? (
                      <CheckCircle size={20} />
                    ) : (
                      <XCircle size={20} />
                    )}
                    <span>{paymentStatusStr}</span>
                  </button>
                </td>
                <td>
                  <span className="category-badge">{client.category || 'N/A'}</span>
                </td>
                <td className="amount" style={{ color: '#27ae60' }}>{paidAmount.toFixed(2)} DT</td>
                <td className={(() => {
                  if (!client.date_prochain_paiement || remainingAmount <= 0) return '';
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const nextPay = new Date(client.date_prochain_paiement);
                  nextPay.setHours(0,0,0,0);
                  const diff = Math.ceil((nextPay - today) / (1000 * 60 * 60 * 24));
                  if (diff <= 0) return 'expiration-expired';
                  if (diff <= 3) return 'expiration-critical';
                  if (diff <= 7) return 'expiration-warning';
                  return '';
                })()}>
                  {client.date_prochain_paiement && remainingAmount > 0 ? (
                    <div className="expiration-cell">
                      <span>{new Date(client.date_prochain_paiement).toLocaleDateString()}</span>
                      {(() => {
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const nextPay = new Date(client.date_prochain_paiement);
                        nextPay.setHours(0,0,0,0);
                        const diff = Math.ceil((nextPay - today) / (1000 * 60 * 60 * 24));
                        if (diff < 0) return <span className="expire-badge expired">En retard</span>;
                        if (diff === 0) return <span className="expire-badge critical">Aujourd'hui</span>;
                        if (diff <= 3) return <span className="expire-badge critical">Dans {diff}j</span>;
                        if (diff <= 7) return <span className="expire-badge warning">Dans {diff}j</span>;
                        return null;
                      })()}
                    </div>
                  ) : '-'}
                </td>
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
                          setRenewingClient(client);
                          setOpenDropdownId(null);
                        }} className="dropdown-item renew">
                          <RefreshCw size={16} style={{marginRight: '8px'}} /> Renouveler
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
              );
            })}
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

      {renewingClient && (
        <RenewalModal 
          client={renewingClient} 
          onClose={() => setRenewingClient(null)} 
          onRenewalSuccess={() => {
            setSuccessMessage('Renouvellement enregistré !');
            fetchClients();
          }} 
        />
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal animate-pop">
            <h2>Nouvelle Catégorie</h2>
            <p>Saisissez le nom de la nouvelle catégorie à ajouter :</p>
            <input 
              type="text" 
              className="modal-input" 
              placeholder="Ex: Moto, Camion..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
            />
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => {
                setShowCategoryModal(false);
                setNewCategoryName('');
              }}>Annuler</button>
              <button className="save-btn-small" onClick={async () => {
                if (!newCategoryName.trim()) return;
                try {
                  const res = await api.post('/categories', { name: newCategoryName });
                  setCategories([...categories, res.data.data]);
                  setFormData({ ...formData, category: newCategoryName });
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                } catch (err) {
                  alert(err.response?.data?.message || 'Erreur lors de l\'ajout');
                }
              }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
