import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Eye, Edit, Trash2, RefreshCw, Filter, CheckCircle, XCircle, DollarSign, Plus, Printer, AlertCircle, MessageSquare, Send } from 'lucide-react';
import RenewalModal from '../components/RenewalModal';

const Clients = () => {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [viewingClientVersements, setViewingClientVersements] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [renewingClient, setRenewingClient] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [categories, setCategories] = useState([]);
  const [creators, setCreators] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryStats, setCategoryStats] = useState({ total: 0, stats: [] });
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateError, setDuplicateError] = useState(null);
  const [duplicateToast, setDuplicateToast] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('infos');
  const [clientHistory, setClientHistory] = useState([]);
  
  // Print state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMonth, setPrintMonth] = useState('');
  
  // Payment Modal State
  const [paymentModalClient, setPaymentModalClient] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Espece');

  // Notes Modal State
  const [viewingNotesClient, setViewingNotesClient] = useState(null);
  const [clientNotes, setClientNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  
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
    category: '',
    created_by: '',
    created_at_start: '',
    created_at_end: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [grandTotal, setGrandTotal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // ── Drag-scroll table ──
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
    // Horizontal scroll via shift+wheel or horizontal wheel
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      el.scrollLeft += e.deltaX || e.deltaY;
      updateShadows();
    }
  }, [updateShadows]);
  
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
    montant_paye: '',
    montant_verse_aujourd_hui: '',
    payment_status: 'Unpaid',
    payment_date: '',
    payment_method: '',
    date_prochain_paiement: '',
    category: '',
    created_at: ''
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

  const fetchCreators = async () => {
    try {
      const res = await api.get('/clients/creators');
      setCreators(res.data.data);
    } catch (err) {
      console.error('Failed to fetch creators');
    }
  };

  const checkDuplicate = async (field, value) => {
    if (!value || value.trim() === '') {
      if (duplicateWarning?.field === field) setDuplicateWarning(null);
      return;
    }
    try {
      const res = await api.get(`/clients/check-duplicate?${field}=${encodeURIComponent(value)}`);
      if (res.data.isDuplicate && (!editingId || res.data.existingClient.id !== editingId)) {
        setDuplicateWarning({
          field,
          client: res.data.existingClient
        });
      } else {
        if (duplicateWarning?.field === field) {
          setDuplicateWarning(null);
        }
      }
    } catch (err) {
      console.error('Duplicate check error', err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchCategories();
    fetchCreators();
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
      const payload = { ...formData };
      if (!editingId) {
        delete payload.montant_verse_aujourd_hui;
      }

      if (editingId) {
        await api.put(`/clients/${editingId}`, payload);
        setSuccessMessage('Client modifié avec succès !');
      } else {
        await api.post('/clients', payload);
        setSuccessMessage('Client ajouté avec succès !');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormState);
      setDuplicateError(null);
      setDuplicateWarning(null);
      fetchClients();
      
      // Refresh global stats and notifications
      if (isAdmin) fetchCategoryStats();
      window.dispatchEvent(new Event('refresh-alerts'));
    } catch (err) {
      if (err.response?.status === 409) {
        const existing = err.response.data.existingClient || null;
        setDuplicateError(existing);
        setDuplicateToast({ client: existing, visible: true });
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          setDuplicateToast(null);
        }, 5000);
      } else {
        alert(err.response?.data?.message || 'Operation failed');
      }
    }
  };

  const togglePaymentStatus = async (client) => {
    try {
      let newStatus;
      let newPaidAmount = client.montant_paye;
      let newPaymentDate = client.payment_date;

      const currentStatus = client.payment_status || 'Unpaid';
      const totalVal = parseFloat(client.total) || 0;

      if (currentStatus === 'Unpaid') {
        newStatus = 'Partial';
        const currentPaid = parseFloat(client.montant_paye) || 0;
        if (currentPaid <= 0 || currentPaid >= totalVal) {
          newPaidAmount = totalVal / 2;
        } else {
          newPaidAmount = currentPaid;
        }
      } else if (currentStatus === 'Partial') {
        newStatus = 'Paid';
        newPaidAmount = totalVal;
        newPaymentDate = new Date().toLocaleDateString('en-CA');
      } else { // Paid
        newStatus = 'Unpaid';
        newPaidAmount = 0;
        newPaymentDate = null;
      }

      const updateData = { 
        payment_status: newStatus,
        montant_paye: newPaidAmount,
        payment_date: newPaymentDate
      };
      
      await api.put(`/clients/${client.id}`, updateData);
      setClients(clients.map(c => c.id === client.id ? { ...c, ...updateData } : c));
    } catch (err) {
      alert('Failed to update payment status');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || !paymentDate) {
      setError("Veuillez remplir le montant et la date du versement.");
      return;
    }
    
    try {
      await api.post(`/clients/${paymentModalClient.id}/versements`, {
        montant: parseFloat(paymentAmount),
        date_versement: paymentDate,
        methode_paiement: paymentMethod
      });
      setSuccessMessage("Versement ajouté avec succès.");
      setPaymentModalClient(null);
      setPaymentAmount('');
      setPaymentMethod('Espece');
      fetchClients();
    } catch (err) {
      setError("Erreur lors de l'ajout du versement.");
    }
  };

  const handleView = async (client) => {
    setViewingClient(client);
    setOpenDropdownId(null);
    setViewingClientVersements([]);
    setClientHistory([]);
    setActiveDetailTab('infos');
    try {
      const res = await api.get(`/clients/${client.id}/versements`);
      setViewingClientVersements(res.data.data);
    } catch (err) {
      console.error('Failed to fetch client payments:', err);
    }
    try {
      const res = await api.get(`/clients/${client.id}/history`);
      setClientHistory(res.data.data);
    } catch (err) {
      console.error('Failed to fetch client history:', err);
    }
  };

  const handleOpenNotes = async (client) => {
    setOpenDropdownId(null);
    setViewingNotesClient(client);
    setClientNotes([]);
    try {
      const res = await api.get(`/clients/${client.id}/notes`);
      setClientNotes(res.data.data);
    } catch (err) {
      console.error('Failed to fetch client notes:', err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !viewingNotesClient) return;
    
    setIsSubmittingNote(true);
    try {
      await api.post(`/clients/${viewingNotesClient.id}/notes`, { content: newNoteContent });
      setNewNoteContent('');
      // Refresh notes
      const res = await api.get(`/clients/${viewingNotesClient.id}/notes`);
      setClientNotes(res.data.data);
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
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
      date_prochain_paiement: client.date_prochain_paiement ? new Date(client.date_prochain_paiement).toLocaleDateString('en-CA') : '',
      montant_paye: client.montant_paye || '',
      montant_verse_aujourd_hui: '',
      category: client.category || '',
      created_at: client.created_at ? new Date(client.created_at).toLocaleDateString('en-CA') : ''
    });
    setShowForm(true);
    setDuplicateError(null);
    setDuplicateWarning(null);
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

  const generatePrintableList = async () => {
    if (!printMonth) {
      alert("Veuillez sélectionner un mois.");
      return;
    }

    try {
      const res = await api.get(`/clients?month=${printMonth}`);
      // Fallback local filter in case backend has not been restarted
      const allClients = res.data.data;
      const filteredClients = allClients.filter(c => {
        if (!c.created_at) return false;
        // created_at is returned as ISO string or YYYY-MM-DD
        return c.created_at.startsWith(printMonth);
      });

      if (filteredClients.length === 0) {
        alert("Aucun client n'a été ajouté pendant ce mois.");
        return;
      }

      const [year, month] = printMonth.split('-');
      const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
      const monthName = monthNames[parseInt(month, 10) - 1];

      const printWindow = window.open('', '_blank');
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Liste des clients - ${monthName} ${year}</title>
            <style>
              @page { size: landscape; margin: 8mm; }
              body { font-family: Arial, sans-serif; margin: 10px; color: #333; font-size: 11px; }
              h1 { text-align: center; color: #2c3e50; margin-bottom: 20px; font-size: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 9px; }
              th, td { border: 1px solid #ccc; padding: 6px 4px; text-align: left; word-break: break-word; }
              th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
              tr:nth-child(even) { background-color: #f8fafc; }
              .footer { margin-top: 25px; text-align: right; font-style: italic; font-size: 12px; color: #475569; }
              .header-info { margin-bottom: 15px; font-size: 12px; display: flex; justify-content: space-between; }
              @media print {
                button { display: none; }
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <h1>Rapport des Clients Ajoutés</h1>
            <div class="header-info">
              <div><strong>Période :</strong> ${monthName} ${year}</div>
              <div><strong>Date d'impression :</strong> ${new Date().toLocaleDateString()}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Police</th>
                  <th>Sociétaire</th>
                  <th>Adresse</th>
                  <th>Téléphone</th>
                  <th>Paiement</th>
                  <th>Montant</th>
                  <th>Réduction</th>
                  <th>RC</th>
                  <th>Papier</th>
                  <th>Usage Véhicule</th>
                  <th>Immatriculation</th>
                  <th>Date Effet</th>
                  <th>Date Expiration</th>
                  <th>Total</th>
                  <th>Statut Paiement</th>
                  <th>Date Paiement</th>
                  <th>Montant Payé</th>
                  <th>Prochain Paiement</th>
                  <th>Catégorie</th>
                </tr>
              </thead>
              <tbody>
                ${filteredClients.map(c => `
                  <tr>
                    <td>${c.police || '-'}</td>
                    <td>${c.societaire || '-'}</td>
                    <td>${c.adresse || '-'}</td>
                    <td>${c.tel || '-'}</td>
                    <td>${c.paiement || '-'}</td>
                    <td>${c.montant !== null && c.montant !== undefined ? c.montant + ' DT' : '-'}</td>
                    <td>${c.reduction !== null && c.reduction !== undefined ? c.reduction + ' DT' : '-'}</td>
                    <td>${c.rc || '-'}</td>
                    <td>${c.papier || '-'}</td>
                    <td>${c.usage_vehicle || '-'}</td>
                    <td>${c.immatriculation || '-'}</td>
                    <td>${c.date_effet ? new Date(c.date_effet).toLocaleDateString() : '-'}</td>
                    <td>${c.date_expiration ? new Date(c.date_expiration).toLocaleDateString() : '-'}</td>
                    <td>${c.total !== null && c.total !== undefined ? c.total + ' DT' : '-'}</td>
                    <td>${c.payment_status === 'Paid' ? 'Payé' : c.payment_status === 'Partial' ? 'Partiellement payé' : 'Impayé'}</td>
                    <td>${c.payment_date ? new Date(c.payment_date).toLocaleDateString() : '-'}</td>
                    <td>${c.montant_paye !== null && c.montant_paye !== undefined ? c.montant_paye + ' DT' : '-'}</td>
                    <td>${c.date_prochain_paiement ? new Date(c.date_prochain_paiement).toLocaleDateString() : '-'}</td>
                    <td>${c.category || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              Total clients inscrits ce mois: <strong>${filteredClients.length}</strong>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              }
            </script>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      setShowPrintModal(false);
      setPrintMonth('');
    } catch (err) {
      alert('Erreur lors de la récupération des données depuis MySQL.');
    }
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

      const clientCreatedAt = normalizeDate(client.created_at);

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
      (filters.created_by === '' || client.created_by?.toString() === filters.created_by) &&
      (filters.created_at_start === '' || clientCreatedAt >= filters.created_at_start) &&
      (filters.created_at_end === '' || clientCreatedAt <= filters.created_at_end) &&
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

  // Tri strict par ID décroissant pour garantir que l'ordre ne change jamais après une modification
  filteredClients.sort((a, b) => b.id - a.id);

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
                  <option value="Partial">Partiellement payé</option>
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
              <div className="filter-item">
                <label>Créé par</label>
                <select 
                  value={filters.created_by}
                  onChange={(e) => handleFilterChange('created_by', e.target.value)}
                >
                  <option value="">Tous les utilisateurs</option>
                  {creators.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label>Créé entre le</label>
                <input 
                  type="date" 
                  value={filters.created_at_start}
                  onChange={(e) => handleFilterChange('created_at_start', e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>Et le</label>
                <input 
                  type="date" 
                  value={filters.created_at_end}
                  onChange={(e) => handleFilterChange('created_at_end', e.target.value)}
                />
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
              category: '',
              created_by: '',
              created_at_start: '',
              created_at_end: ''
            })}>Effacer tous les filtres</button>
          </div>
        )}
      </div>

      <div className="action-bar">
        <div className="total-display-container">
          {isAdmin && (
            <>
              <button className="total-btn" onClick={calculateGrandTotal}>
                📊 Calcule Total
              </button>
              {grandTotal !== null && (
                <div className="total-badge animate-pop">
                  <span className="label">Grand Total:</span>
                  <span className="value">{grandTotal} <small>DT</small></span>
                </div>
              )}
            </>
          )}
          <div className="stats-mini-pills">
            
            <span className="pill unpaid">
              {filteredClients.filter(c => c.payment_status === 'Unpaid' || !c.payment_status).length} Impayé
            </span>
            <span className="pill partial">
              {filteredClients.filter(c => c.payment_status === 'Partial').length} Partiellement payé
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="total-btn" onClick={() => setShowPrintModal(true)} style={{ borderColor: '#4caf50', color: '#4caf50' }}>
            <Printer size={18} style={{ marginRight: '5px' }} /> Imprimer
          </button>
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
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content form-modal" style={{ maxWidth: '750px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: '10px', padding: '10px', display: 'flex' }}>
                  <span style={{ fontSize: '20px' }}>{editingId ? '✏️' : '👤'}</span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>
                    {editingId ? 'Modifier le Client' : 'Nouveau Client'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                    {editingId ? 'Mettez à jour les informations du client' : 'Remplissez les informations pour ajouter un client'}
                  </p>
                </div>
              </div>
              <button className="close-modal" onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData(initialFormState);
                setDuplicateError(null);
                setDuplicateWarning(null);
              }}>&times;</button>
            </div>
            <div className="modal-body">
              {/* Duplicate toast is shown outside the form as a floating notification */}
              <form className="add-form-expanded" onSubmit={handleSubmit}>

                {/* ── Section 1 : Informations Client ── */}
                <div className="cf-section">
                  <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
                    <span className="cf-section-icon">👤</span>
                    <span className="cf-section-title">Informations Client</span>
                  </div>
                  <div className="cf-grid cf-grid-3">
                    <div className="form-group cf-required">
                      <label>Numéro de Police</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          value={formData.police}
                          onChange={e => setFormData({...formData, police: e.target.value})}
                          onBlur={e => checkDuplicate('police', e.target.value)}
                          placeholder="Ex: POL-2024-001"
                          required
                        />
                        {duplicateWarning?.field === 'police' && (
                          <span style={{ color: '#ef4444', fontSize: '0.75rem', position: 'absolute', bottom: '-18px', left: 0 }}>
                            ⚠️ Police existante : {duplicateWarning.client.societaire}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="form-group cf-required cf-span2">
                      <label>Nom du Sociétaire</label>
                      <input
                        value={formData.societaire}
                        onChange={e => setFormData({...formData, societaire: e.target.value})}
                        placeholder="Prénom et Nom"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Téléphone</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          value={formData.tel}
                          onChange={e => setFormData({...formData, tel: e.target.value})}
                          onBlur={e => checkDuplicate('tel', e.target.value)}
                          placeholder="+216 XX XXX XXX"
                        />
                        {duplicateWarning?.field === 'tel' && (
                          <span style={{ color: '#ef4444', fontSize: '0.75rem', position: 'absolute', bottom: '-18px', left: 0 }}>
                            ⚠️ Tél. existant : {duplicateWarning.client.societaire}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="form-group cf-span2">
                      <label>Adresse</label>
                      <input
                        value={formData.adresse}
                        onChange={e => setFormData({...formData, adresse: e.target.value})}
                        placeholder="Adresse complète"
                      />
                    </div>
                    <div className="form-group">
                      <label>Catégorie</label>
                      <div className="category-input-container">
                        <select
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                        >
                          <option value="">Sélectionner...</option>
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
                    <div className="form-group">
                      <label>Date de création</label>
                      <input
                        type="date"
                        value={formData.created_at || ''}
                        onChange={e => setFormData({...formData, created_at: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 2 : Véhicule & Contrat ── */}
                <div className="cf-section">
                  <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
                    <span className="cf-section-icon">🚗</span>
                    <span className="cf-section-title">Véhicule & Contrat</span>
                  </div>
                  <div className="cf-grid cf-grid-3">
                    <div className="form-group">
                      <label>Immatriculation</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          value={formData.immatriculation}
                          onChange={e => setFormData({...formData, immatriculation: e.target.value})}
                          onBlur={e => checkDuplicate('immatriculation', e.target.value)}
                          placeholder="Ex: 123 TU 456"
                        />
                        {duplicateWarning?.field === 'immatriculation' && (
                          <span style={{ color: '#ef4444', fontSize: '0.75rem', position: 'absolute', bottom: '-18px', left: 0 }}>
                            ⚠️ Immatriculation existante : {duplicateWarning.client.societaire}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Usage Véhicule</label>
                      <input
                        value={formData.usage_vehicle}
                        onChange={e => setFormData({...formData, usage_vehicle: e.target.value})}
                        placeholder="Ex: Particulier, Taxi..."
                      />
                    </div>
                    <div className="form-group">
                      <label>RC</label>
                      <input
                        type="text"
                        value={formData.rc}
                        onChange={e => setFormData({...formData, rc: e.target.value})}
                        placeholder="Responsabilité Civile"
                      />
                    </div>
                    <div className="form-group">
                      <label>Papier</label>
                      <input
                        value={formData.papier}
                        onChange={e => setFormData({...formData, papier: e.target.value})}
                        placeholder="Type de document"
                      />
                    </div>
                    <div className="form-group">
                      <label>Date d'effet</label>
                      <input
                        type="date"
                        value={formData.date_effet}
                        onChange={e => setFormData({...formData, date_effet: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Date d'expiration</label>
                      <input
                        type="date"
                        value={formData.date_expiration}
                        onChange={e => setFormData({...formData, date_expiration: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 3 : Tarification ── */}
                <div className="cf-section">
                  <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
                    <span className="cf-section-icon">💰</span>
                    <span className="cf-section-title">Tarification</span>
                  </div>
                  <div className="cf-grid cf-grid-3">
                    <div className="form-group">
                      <label>Montant (Hors Réduction)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.montant}
                        onChange={e => {
                          const m = e.target.value;
                          const r = formData.reduction || 0;
                          const t = m ? (parseFloat(m) - parseFloat(r)) : 0;
                          setFormData({ ...formData, montant: m, total: isNaN(t) ? '' : t.toString() });
                        }}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="form-group">
                      <label>Réduction (DT)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.reduction}
                        onChange={e => {
                          const r = e.target.value;
                          const m = formData.montant || 0;
                          const t = m ? (parseFloat(m) - parseFloat(r || 0)) : 0;
                          setFormData({ ...formData, reduction: r, total: isNaN(t) ? '' : t.toString() });
                        }}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Net (calculé)</label>
                      <input
                        type="number"
                        value={formData.total}
                        readOnly
                        style={{ background: '#f1f5f9', fontWeight: '700', color: '#1e293b', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 4 : Paiement ── */}
                <div className="cf-section">
                  <div className="cf-section-header" style={{ background: 'linear-gradient(135deg, #fdf4ff, #f3e8ff)' }}>
                    <span className="cf-section-icon">💳</span>
                    <span className="cf-section-title">Paiement</span>
                  </div>
                  <div className="cf-grid cf-grid-3">
                    <div className="form-group">
                      <label>Mode de Règlement</label>
                      <select
                        value={formData.paiement}
                        onChange={e => setFormData({...formData, paiement: e.target.value})}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="Cheque">Chèque</option>
                        <option value="Espece">Espèce</option>
                        <option value="Virement">Virement</option>
                        <option value="Kembyela">Kembyela</option>
                      </select>
                    </div>
                    {editingId ? (
                      <div className="form-group">
                        <label>Montant Versé Aujourd'hui (DT)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.montant_verse_aujourd_hui !== undefined ? formData.montant_verse_aujourd_hui : ''}
                          onChange={e => setFormData({...formData, montant_verse_aujourd_hui: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                    ) : (
                      <div className="form-group">
                        <label>Montant Payé (DT)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.montant_paye}
                          onChange={e => setFormData({...formData, montant_paye: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                    )}
                    <div className="form-group">
                      <label>Reste à Payer</label>
                      <input
                        type="number"
                        value={
                          editingId 
                            ? ((parseFloat(formData.total) || 0) - (parseFloat(formData.montant_paye) || 0) - (parseFloat(formData.montant_verse_aujourd_hui) || 0)).toFixed(2)
                            : ((parseFloat(formData.total) || 0) - (parseFloat(formData.montant_paye) || 0)).toFixed(2)
                        }
                        disabled
                        style={{
                          background: '#f1f5f9',
                          fontWeight: '700',
                          cursor: 'not-allowed',
                          color: (
                            editingId 
                              ? ((parseFloat(formData.total) || 0) - (parseFloat(formData.montant_paye) || 0) - (parseFloat(formData.montant_verse_aujourd_hui) || 0))
                              : ((parseFloat(formData.total) || 0) - (parseFloat(formData.montant_paye) || 0))
                          ) > 0 ? '#dc2626' : '#16a34a'
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Statut de Paiement</label>
                      <select
                        value={formData.payment_status}
                        onChange={e => setFormData({...formData, payment_status: e.target.value})}
                      >
                        <option value="Unpaid">❌ Impayé</option>
                        <option value="Partial">⚠️ Partiellement payé</option>
                        <option value="Paid">✅ Payé</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date du Paiement</label>
                      <input
                        type="date"
                        value={formData.payment_date}
                        onChange={e => setFormData({...formData, payment_date: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Date du Prochain Paiement</label>
                      <input
                        type="date"
                        value={formData.date_prochain_paiement}
                        onChange={e => setFormData({...formData, date_prochain_paiement: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Footer Actions ── */}
                <div className="cf-footer">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => { setShowForm(false); setEditingId(null); setFormData(initialFormState); setDuplicateError(null); setDuplicateWarning(null); }}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="save-btn">
                    {editingId ? '✏️ Enregistrer les modifications' : '✅ Sauvegarder le Client'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingClient && (
        <div className="modal-overlay">
          <div className="modal-content view-modal-content animate-pop">
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>Détails du Client</h2>
                <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  {viewingClient.societaire} (ID: {viewingClient.id})
                </p>
              </div>
              <button className="close-modal" onClick={() => setViewingClient(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div className="modal-tabs" style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '0px', marginBottom: '5px' }}>
                <button 
                  onClick={() => setActiveDetailTab('infos')}
                  className={`modal-tab-btn ${activeDetailTab === 'infos' ? 'active' : ''}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '10px 20px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    color: activeDetailTab === 'infos' ? 'var(--primary-color)' : '#64748b',
                    borderBottom: activeDetailTab === 'infos' ? '3px solid var(--primary-color)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ℹ️ Informations
                </button>
                <button 
                  onClick={() => setActiveDetailTab('history')}
                  className={`modal-tab-btn ${activeDetailTab === 'history' ? 'active' : ''}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '10px 20px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    color: activeDetailTab === 'history' ? 'var(--primary-color)' : '#64748b',
                    borderBottom: activeDetailTab === 'history' ? '3px solid var(--primary-color)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  📜 Historique
                </button>
              </div>

              {activeDetailTab === 'infos' ? (
                <>
                  {/* Section 1: Informations Personnelles & Contrat */}
                  <div className="detail-section">
                    <div className="detail-section-title">
                      👤 Informations Personnelles & Contrat
                    </div>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Sociétaire / Nom</span>
                        <span className="detail-value">{viewingClient.societaire || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Téléphone</span>
                        <span className="detail-value">{viewingClient.tel || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Adresse</span>
                        <span className="detail-value">{viewingClient.adresse || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Catégorie</span>
                        <span className="detail-value">{viewingClient.category || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Numéro de Police</span>
                        <span className="detail-value" style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{viewingClient.police || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Date d'effet</span>
                        <span className="detail-value">{viewingClient.date_effet ? new Date(viewingClient.date_effet).toLocaleDateString() : '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Date d'expiration</span>
                        <span className="detail-value">{viewingClient.date_expiration ? new Date(viewingClient.date_expiration).toLocaleDateString() : '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Statut Renouvellement</span>
                        <span className="detail-value">{viewingClient.renewal_status || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Créé par</span>
                        <span className="detail-value">{viewingClient.creator_name || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Créé le</span>
                        <span className="detail-value">{viewingClient.created_at ? new Date(viewingClient.created_at).toLocaleString() : '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Informations de Société & Véhicule */}
                  <div className="detail-section">
                    <div className="detail-section-title">
                      🏢 Informations de Société & Véhicule
                    </div>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Registre de Commerce (RC)</span>
                        <span className="detail-value">{viewingClient.rc || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Papier / Attestation</span>
                        <span className="detail-value">{viewingClient.papier || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Immatriculation</span>
                        <span className="detail-value" style={{ fontWeight: 'bold' }}>{viewingClient.immatriculation || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Usage Véhicule</span>
                        <span className="detail-value">{viewingClient.usage_vehicle || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Informations de Paiement */}
                  <div className="detail-section">
                    <div className="detail-section-title">
                      💳 Informations de Paiement
                    </div>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Montant Hors Réduction</span>
                        <span className="detail-value">{viewingClient.montant !== null && viewingClient.montant !== undefined ? `${viewingClient.montant} DT` : '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Réduction</span>
                        <span className="detail-value" style={{ color: '#e74c3c' }}>{viewingClient.reduction !== null && viewingClient.reduction !== undefined ? `${viewingClient.reduction} DT` : '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Montant Total Net</span>
                        <span className="detail-value" style={{ color: 'var(--primary-color)', fontSize: '1.1rem', fontWeight: '700' }}>
                          {viewingClient.total !== null && viewingClient.total !== undefined ? `${parseFloat(viewingClient.total).toFixed(2)} DT` : '-'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Montant Déjà Payé</span>
                        <span className="detail-value" style={{ color: '#2ecc71', fontWeight: '700' }}>
                          {viewingClient.montant_paye !== null && viewingClient.montant_paye !== undefined ? `${parseFloat(viewingClient.montant_paye).toFixed(2)} DT` : '0.00 DT'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Reste à payer</span>
                        <span className="detail-value" style={{ 
                          color: ((parseFloat(viewingClient.total) || 0) - (parseFloat(viewingClient.montant_paye) || 0)) > 0 ? '#e74c3c' : '#2ecc71',
                          fontWeight: '700'
                        }}>
                          {((parseFloat(viewingClient.total) || 0) - (parseFloat(viewingClient.montant_paye) || 0)).toFixed(2)} DT
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Statut Paiement</span>
                        <span className={`detail-badge ${
                          viewingClient.payment_status === 'Paid' ? 'success' : viewingClient.payment_status === 'Partial' ? 'warning' : 'danger'
                        }`}>
                          {viewingClient.payment_status === 'Paid' ? 'Payé' : viewingClient.payment_status === 'Partial' ? 'Partiel' : 'Impayé'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Mode de règlement</span>
                        <span className="detail-value">{viewingClient.paiement || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Dernière date de règlement</span>
                        <span className="detail-value">{viewingClient.payment_date ? new Date(viewingClient.payment_date).toLocaleDateString() : '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Prochain paiement prévu</span>
                        <span className="detail-value" style={{ fontWeight: '700', color: '#e67e22' }}>
                          {viewingClient.date_prochain_paiement ? new Date(viewingClient.date_prochain_paiement).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Historique des Versements */}
                  <div className="detail-section">
                    <div className="detail-section-title">
                      📜 Historique des Versements
                    </div>
                    <div className="payments-table-container">
                      {viewingClientVersements && viewingClientVersements.length > 0 ? (
                        <table className="payments-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Montant</th>
                              <th>Méthode</th>
                              <th>Date d'enregistrement</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewingClientVersements.map(v => (
                              <tr key={v.id}>
                                <td>{v.date_versement ? new Date(v.date_versement).toLocaleDateString() : '-'}</td>
                                <td style={{ fontWeight: 'bold', color: '#2ecc71' }}>{parseFloat(v.montant).toFixed(2)} DT</td>
                                <td>{v.methode_paiement || 'Espèce'}</td>
                                <td>{v.created_at ? new Date(v.created_at).toLocaleString() : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="no-data-msg">
                          Aucun versement enregistré pour ce client.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="detail-section animate-fade-in">
                  <div className="detail-section-title">
                    📜 Historique des Modifications
                  </div>
                  <div className="payments-table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {clientHistory && clientHistory.length > 0 ? (
                      <table className="payments-table">
                        <thead>
                          <tr>
                            <th>Employé</th>
                            <th>Action</th>
                            <th>Ancienne valeur</th>
                            <th>Nouvelle valeur</th>
                            <th>Date & Heure</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientHistory.map(h => {
                            const translateVal = (val) => {
                              if (!val) return '-';
                              return val
                                .replace(/\bPaid\b/g, 'Payé')
                                .replace(/\bUnpaid\b/g, 'Impayé')
                                .replace(/\bPartial\b/g, 'Partiellement payé');
                            };
                            return (
                              <tr key={h.id}>
                                <td><strong>{h.nom_utilisateur}</strong></td>
                                <td>
                                  <span className="badge-count" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                    {h.action_effectuee}
                                  </span>
                                </td>
                                <td style={{ color: '#e74c3c', maxWidth: '180px', wordBreak: 'break-all' }}>{translateVal(h.ancienne_valeur)}</td>
                                <td style={{ color: '#2ecc71', fontWeight: 'bold', maxWidth: '180px', wordBreak: 'break-all' }}>{translateVal(h.nouvelle_valeur)}</td>
                                <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(h.date_modification).toLocaleString('fr-FR')}</td>
                              </tr>
                            );
                          })}

                        </tbody>
                      </table>
                    ) : (
                      <div className="no-data-msg">
                        Aucun historique de modification disponible pour ce client.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      <div className="drag-table-wrapper">
        {showLeftShadow  && <div className="drag-shadow drag-shadow-left"  />}
        {showRightShadow && <div className="drag-shadow drag-shadow-right" />}
        <div
          className="table-container scrollable drag-scroll"
          ref={tableRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onScroll={updateShadows}
          onWheel={onWheel}
        >
        <table>
          <thead>
            <tr>
              <th>Police</th>
              <th>Sociétaire</th>
              <th>Catégorie</th>
              <th>Adresse</th>
              <th>Téléphone</th>
              <th>Immatriculation</th>
              <th>Papier</th>
              <th>Date d'effet</th>
              <th>Date d'expiration</th>
              <th>Statut Paiement</th>
              <th>Total</th>
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
                <td>
                  <span className="category-badge">{client.category || 'N/A'}</span>
                </td>
                <td>{client.adresse || '-'}</td>
                <td>{client.tel || '-'}</td>
               
                <td>{client.immatriculation || '-'}</td>
                <td>
                  {(!client.papier || client.papier.trim() === '') ? (
                    <span className="missing-paper-badge" title="Le document papier n'est pas fourni">
                      <span className="icon">⚠️</span> Papier manquant
                    </span>
                  ) : (
                    client.papier
                  )}
                </td>
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
                <td>
                  <span 
                    className="payment-status-badge"
                    style={{
                      backgroundColor: client.payment_status === 'Paid' ? '#10b981' : 
                                     client.payment_status === 'Partial' ? '#f59e0b' : '#ef4444',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '500',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {client.payment_status === 'Paid' ? (
                      <CheckCircle size={16} />
                    ) : client.payment_status === 'Partial' ? (
                      <AlertCircle size={16} />
                    ) : (
                      <XCircle size={16} />
                    )}
                    {paymentStatusStr}
                  </span>
                </td>
                <td className="amount">{totalAmount.toFixed(2)} DT</td>
                
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
                        <button onClick={() => handleOpenNotes(client)} className="dropdown-item notes" style={{ color: '#0284c7' }}>
                          <MessageSquare size={16} style={{marginRight: '8px'}} /> Notes
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
        </div>{/* end .drag-scroll */}
      </div>{/* end .drag-table-wrapper */}


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

      {/* Print Monthly Clients Modal */}
      {showPrintModal && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal animate-pop">
            <div className="confirm-icon">🖨️</div>
            <h2>Imprimer les clients</h2>
            <p style={{ marginBottom: '15px' }}>Sélectionnez le mois d'ajout pour générer la liste des clients inscrits ce mois-ci :</p>
            <input 
              type="month" 
              className="modal-input" 
              style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '5px', border: '1px solid #ccc' }}
              value={printMonth}
              onChange={(e) => setPrintMonth(e.target.value)}
            />
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => {
                setShowPrintModal(false);
                setPrintMonth('');
              }}>Annuler</button>
              <button className="save-btn" style={{ width: 'auto', padding: '10px 20px' }} onClick={generatePrintableList}>Générer & Imprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {paymentModalClient && (
        <div className="modal-overlay">
          <div className="modal-content animate-pop" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--primary-color)' }}>Ajouter un Versement</h2>
              <button className="close-modal" onClick={() => setPaymentModalClient(null)}>&times;</button>
            </div>
            
            <form onSubmit={handleAddPayment}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Montant du Versement (DT)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Reste à payer: ${((parseFloat(paymentModalClient.total) || 0) - (parseFloat(paymentModalClient.montant_paye) || 0)).toFixed(2)} DT`}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date de Versement</label>
                <input 
                  type="date" 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Méthode de Paiement</label>
                <select 
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Espece">Espèce</option>
                  <option value="Cheque">Chèque</option>
                  <option value="Virement">Virement</option>
                  <option value="Traite">Traite</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="cancel-btn" onClick={() => setPaymentModalClient(null)}>Annuler</button>
                <button type="submit" className="save-btn" style={{ width: 'auto' }}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {viewingNotesClient && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content animate-pop" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={24} /> Discussion & Notes
                </h2>
                <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  Client : {viewingNotesClient.societaire} ({viewingNotesClient.police})
                </p>
              </div>
              <button className="close-modal" onClick={() => setViewingNotesClient(null)}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
              <div className="notes-list" style={{
                maxHeight: '400px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                paddingRight: '10px'
              }}>
                {clientNotes.length > 0 ? (
                  clientNotes.map(note => (
                    <div key={note.id} style={{
                      background: '#f8fafc',
                      borderLeft: '4px solid #0ea5e9',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#334155' }}>{note.author_name || 'Utilisateur'}</span>
                        <span style={{ color: '#94a3b8' }}>
                          {new Date(note.created_at).toLocaleString('fr-FR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#475569', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                        {note.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                    <p>Aucune note enregistrée pour ce client.</p>
                  </div>
                )}
              </div>

              <div className="note-input-container" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Ajouter une nouvelle note, résumé d'appel, information..."
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmittingNote || !newNoteContent.trim()}
                    style={{
                      alignSelf: 'flex-end',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: (isSubmittingNote || !newNoteContent.trim()) ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      transition: 'opacity 0.2s',
                      opacity: (isSubmittingNote || !newNoteContent.trim()) ? 0.7 : 1
                    }}
                  >
                    <Send size={16} /> {isSubmittingNote ? 'Envoi...' : 'Ajouter la note'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Duplicate Client Toast Notification ── */}
      {duplicateToast && (
        <div className="duplicate-toast-overlay" onClick={() => setDuplicateToast(null)}>
          <div className="duplicate-toast" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="duplicate-toast-header">
              <div className="duplicate-toast-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="duplicate-toast-title">
                <span className="duplicate-toast-badge">Doublon détecté</span>
                <h4>Enregistrement bloqué</h4>
              </div>
              <button className="duplicate-toast-close" onClick={() => setDuplicateToast(null)} aria-label="Fermer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <p className="duplicate-toast-desc">
              Un client identique existe déjà dans la base de données. Veuillez vérifier les informations ci-dessous avant de soumettre à nouveau.
            </p>

            {duplicateToast.client && (
              <div className="duplicate-toast-details">
                {duplicateToast.client.societaire && (
                  <div className="duplicate-toast-row">
                    <span className="dup-label">👤 Nom</span>
                    <span className="dup-value">{duplicateToast.client.societaire}</span>
                  </div>
                )}
                {duplicateToast.client.police && (
                  <div className="duplicate-toast-row">
                    <span className="dup-label">📋 Police</span>
                    <span className="dup-value">{duplicateToast.client.police}</span>
                  </div>
                )}
                {duplicateToast.client.tel && (
                  <div className="duplicate-toast-row">
                    <span className="dup-label">📞 Téléphone</span>
                    <span className="dup-value">{duplicateToast.client.tel}</span>
                  </div>
                )}
                {duplicateToast.client.immatriculation && (
                  <div className="duplicate-toast-row">
                    <span className="dup-label">🚗 Immatriculation</span>
                    <span className="dup-value">{duplicateToast.client.immatriculation}</span>
                  </div>
                )}
                {duplicateToast.client.created_at && (
                  <div className="duplicate-toast-row">
                    <span className="dup-label">📅 Créé le</span>
                    <span className="dup-value">
                      {new Date(duplicateToast.client.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {duplicateToast.client.creator_name ? ` — par ${duplicateToast.client.creator_name}` : ''}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Progress bar */}
            <div className="duplicate-toast-progress">
              <div className="duplicate-toast-progress-bar" />
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default Clients;
