import React, { useState, useEffect } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseStats } from '../services/expenseService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Edit, Trash2, Calendar, XCircle } from 'lucide-react';
import './Expenses.css';

const EXPENSE_CATEGORIES = [
  'Fourniture', 'Soned', 'Steg', 'Louyer', 'Leasing', 
  'Salaire', 'Cadeaux', 'Essence', 'Autre'
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9'];

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ today: 0, thisMonth: 0, thisYear: 0, overall: 0, byCategory: [] });
  const [showModal, setShowModal] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    description: '',
    payment_method: 'Cash',
    expense_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const filters = {};
      if (filterDate) filters.date = filterDate;

      const [expensesData, statsData] = await Promise.all([
        getExpenses(filters),
        getExpenseStats(filters)
      ]);
      
      setExpenses(expensesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch expenses', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setCurrentExpense(expense);
      setFormData({
        category: expense.category,
        amount: expense.amount,
        description: expense.description || '',
        payment_method: expense.payment_method || 'Cash',
        expense_date: expense.expense_date.split('T')[0]
      });
    } else {
      setCurrentExpense(null);
      setFormData({
        category: EXPENSE_CATEGORIES[0],
        amount: '',
        description: '',
        payment_method: 'Cash',
        expense_date: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentExpense) {
        await updateExpense(currentExpense.id, formData);
      } else {
        await createExpense(formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save expense', error);
      alert("Erreur lors de l'enregistrement de la dépense.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      try {
        await deleteExpense(id);
        fetchData();
      } catch (error) {
        console.error('Failed to delete expense', error);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(amount);
  };

  if (isLoading) return <div className="loading-state">Chargement de vos dépenses privées...</div>;

  return (
    <div className="expenses-container">
      <div className="expenses-header">
        <h1>Mes Dépenses (Privé)</h1>
        
        <div className="header-actions">
          <div className="expenses-filter-section">
            <div className="date-input-wrapper-expenses">
              <Calendar size={20} color="#ec5b32" />
              <input 
                type="date" 
                className="date-picker-input-expenses"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                title="Filtrer les dépenses par date"
              />
            </div>
            {filterDate && (
              <button className="reset-filter-btn-expenses" onClick={() => setFilterDate('')}>
                <XCircle size={18} /> Voir Tout
              </button>
            )}
          </div>

          <button className="add-expense-btn" onClick={() => handleOpenModal()}>
            + Nouvelle Dépense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Aujourd'hui</div>
          <div className="stat-value">{formatCurrency(stats.today)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Ce Mois</div>
          <div className="stat-value">{formatCurrency(stats.thisMonth)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Cette Année</div>
          <div className="stat-value">{formatCurrency(stats.thisYear)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Global</div>
          <div className="stat-value">{formatCurrency(stats.overall)}</div>
        </div>
        {stats.filtered !== undefined && stats.filtered !== null && (
          <div className="stat-card filtered-stat">
            <div className="stat-title">Dépenses du {new Date(filterDate).toLocaleDateString('fr-TN')}</div>
            <div className="stat-value">{formatCurrency(stats.filtered)}</div>
          </div>
        )}
      </div>

      {/* Analytics Chart */}
      {stats.byCategory && stats.byCategory.length > 0 && (
        <div className="charts-section">
          <div className="chart-card">
            <h3>Dépenses par Catégorie</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={stats.byCategory}>
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {stats.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="table-container">
        <table className="expenses-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Catégorie</th>
              <th>Description</th>
              <th>Méthode</th>
              <th>Montant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td>{new Date(expense.expense_date).toLocaleDateString('fr-TN')}</td>
                <td>
                  <span className="category-badge">{expense.category}</span>
                </td>
                <td>{expense.description || '-'}</td>
                <td>{expense.payment_method || '-'}</td>
                <td style={{ fontWeight: '600' }}>{formatCurrency(expense.amount)}</td>
                <td>
                  <div className="action-btns">
                    <button className="edit-btn" onClick={() => handleOpenModal(expense)}>
                      <Edit size={16} />
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(expense.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  Aucune dépense trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="expense-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{currentExpense ? 'Modifier Dépense' : 'Ajouter Dépense'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Catégorie</label>
                <select name="category" value={formData.category} onChange={handleInputChange} required>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Montant (TND)</label>
                <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" name="expense_date" value={formData.expense_date} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Méthode de paiement</label>
                <select name="payment_method" value={formData.payment_method} onChange={handleInputChange}>
                  <option value="Cash">Cash</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Virement">Virement</option>
                  <option value="Carte Bancaire">Carte Bancaire</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description (Optionnel)</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3"></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="save-btn">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
