import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active-link' : '';

  return (
    <aside className="sidebar">
      <div className="sidebar-nav">
        <ul>
          <div className="sidebar-separator" style={{ borderTop: 'none', marginTop: 0 }}><span>Menu Principal</span></div>
          <li>
            <Link to="/dashboard" className={isActive('/dashboard')}>
              <span className="nav-icon">🏠</span> Dashboard
            </Link>
          </li>
          <li>
            <Link to="/calendar" className={isActive('/calendar')}>
              <span className="nav-icon">📅</span> Calendrier
            </Link>
          </li>
          
          <div className="sidebar-separator"><span>Gestion des tables</span></div>
          
          <li>
            <Link to="/clients" className={isActive('/clients')}>
              <span className="nav-icon">👥</span> Tableau des clients
            </Link>
          </li>
          <li>
            <Link to="/alerts" className={isActive('/alerts')}>
              <span className="nav-icon">🔔</span> Alertes & Notifications
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link to="/users" className={isActive('/users')}>
                <span className="nav-icon">⚙️</span> Tableau des employes
              </Link>
            </li>
          )}

          {isAdmin && (
            <>
              <div className="sidebar-separator"><span>Analyses & Finances</span></div>
              <li>
                <Link to="/reports" className={isActive('/reports')}>
                  <span className="nav-icon">📈</span> Rapports des employes
                </Link>
              </li>
              <li>
                <Link to="/expenses" className={isActive('/expenses')}>
                  <span className="nav-icon">🧾</span> Mes Dépenses
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="sidebar-footer">
        <div className="user-permissions-info">
          <p className="perms-title">Vos Autorisations</p>
          <div className="perms-list">
            <span className={`perm-item ${user?.can_add || isAdmin ? 'active' : ''}`}>
              {user?.can_add || isAdmin ? '✅' : '❌'} Ajouter
            </span>
            <span className={`perm-item ${user?.can_edit || isAdmin ? 'active' : ''}`}>
              {user?.can_edit || isAdmin ? '✅' : '❌'} Modifer
            </span>
            <span className={`perm-item ${user?.can_delete || isAdmin ? 'active' : ''}`}>
              {user?.can_delete || isAdmin ? '✅' : '❌'} Supprimer
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
