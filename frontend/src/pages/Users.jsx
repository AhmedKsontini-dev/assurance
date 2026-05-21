import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Edit, Trash2 } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const initialFormState = {
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    can_add: true,
    can_edit: true,
    can_delete: true
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchUsers();
    // Auto-refresh user list every 30 seconds to update online status dots
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const isUserOnline = (lastActive) => {
    if (!lastActive) return false;
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diffInMinutes = (now - lastActiveDate) / 1000 / 60;
    return diffInMinutes < 3; // Online if active in last 3 minutes
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/users/${deleteConfirmId}`);
      setUsers(users.filter(u => u.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      setSuccessMessage('Utilisateur supprimé avec succès !');
    } catch (err) {
      alert('Delete failed');
    }
  };

  const togglePermission = async (user, permissionType) => {
    try {
      const updatedValue = !user[permissionType];
      await api.patch(`/users/${user.id}`, {
        ...user,
        [permissionType]: updatedValue
      });
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, [permissionType]: updatedValue } : u
      ));
    } catch (err) {
      alert('Failed to update permission');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/users/${editingId}`, formData);
        setSuccessMessage('Utilisateur modifié avec succès !');
      } else {
        await api.post('/users', formData);
        setSuccessMessage('Utilisateur ajouté avec succès !');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password
      role: user.role,
      can_add: !!user.can_add,
      can_edit: !!user.can_edit,
      can_delete: !!user.can_delete
    });
    setShowForm(true);
    setOpenDropdownId(null);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>User Management</h1>
      </div>

      <div className="action-bar">
        <div></div> {/* Left spacer */}
        <button className="add-btn" onClick={() => setShowForm(true)}>
          + Add New User
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content form-modal animate-pop">
            <div className="modal-header">
              <h2>{editingId ? 'Edit User' : 'New User Account'}</h2>
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
                    <label>Full Name</label>
                    <input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email"
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>{editingId ? 'New Password (optional)' : 'Password'}</label>
                    <input 
                      type="password"
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      required={!editingId}
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select 
                      value={formData.role} 
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Permissions par défaut</label>
                    <div className="permissions-group" style={{ marginTop: '10px' }}>
                      <label className="permission-checkbox">
                        <input 
                          type="checkbox" 
                          checked={formData.can_add} 
                          onChange={e => setFormData({...formData, can_add: e.target.checked})}
                        />
                        <span>Autoriser Ajout</span>
                      </label>
                      <label className="permission-checkbox">
                        <input 
                          type="checkbox" 
                          checked={formData.can_edit} 
                          onChange={e => setFormData({...formData, can_edit: e.target.checked})}
                        />
                        <span>Autoriser Modification</span>
                      </label>
                      <label className="permission-checkbox">
                        <input 
                          type="checkbox" 
                          checked={formData.can_delete} 
                          onChange={e => setFormData({...formData, can_delete: e.target.checked})}
                        />
                        <span>Autoriser Suppression</span>
                      </label>
                    </div>
                  </div>
                </div>
                <button type="submit" className="save-btn">
                  {editingId ? 'Update User' : 'Create User'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Access (Add | Edit | Delete)</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const online = isUserOnline(user.last_active);
              return (
                <tr key={user.id}>
                  <td>
                    <div className="status-indicator">
                      <span className={`status-dot ${online ? 'online' : 'offline'}`}></span>
                      <span className="status-text">{online ? 'Au travail' : 'Absent'}</span>
                    </div>
                  </td>
                  <td>{user.id}</td>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  {user.role === 'ADMIN' ? (
                    <span className="full-access-badge">✨ Full Access</span>
                  ) : (
                    <div className="permissions-group">
                      <label className="permission-checkbox">
                        <input 
                          type="checkbox" 
                          checked={user.can_add} 
                          onChange={() => togglePermission(user, 'can_add')}
                        />
                        <span>Add</span>
                      </label>
                      <label className="permission-checkbox">
                        <input 
                          type="checkbox" 
                          checked={user.can_edit} 
                          onChange={() => togglePermission(user, 'can_edit')}
                        />
                        <span>Edit</span>
                      </label>
                      <label className="permission-checkbox">
                        <input 
                          type="checkbox" 
                          checked={user.can_delete} 
                          onChange={() => togglePermission(user, 'can_delete')}
                        />
                        <span>Delete</span>
                      </label>
                    </div>
                  )}
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <div className="dropdown">
                    <button 
                      className="dropdown-toggle" 
                      onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                    >
                      Actions ▾
                    </button>
                    {openDropdownId === user.id && (
                      <div className="dropdown-menu">
                        <button onClick={() => handleEdit(user)} className="dropdown-item edit">
                          <Edit size={16} style={{marginRight: '8px'}} /> Modifier
                        </button>
                        <button onClick={() => {
                          setDeleteConfirmId(user.id);
                          setOpenDropdownId(null);
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
            <h2>Supprimer l'utilisateur</h2>
            <p>Êtes-vous sûr de vouloir supprimer ce compte ? L'utilisateur n'aura plus accès au système.</p>
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
            <h2>Opération réussie</h2>
            <p>{successMessage}</p>
            <button className="success-close-btn" onClick={() => setSuccessMessage('')}>D'accord</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
