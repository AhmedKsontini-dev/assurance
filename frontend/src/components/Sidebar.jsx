import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isCollapsed, isMobileOpen, toggleSidebar }) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active-link' : '';

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-nav">
        <ul>
          <div className="sidebar-separator" style={{ borderTop: 'none', marginTop: 0 }}><span>Menu Principal</span></div>
          <li>
            <Link to="/dashboard" className={isActive('/dashboard')} title={isCollapsed ? "Dashboard" : ""}>
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/calendar" className={isActive('/calendar')} title={isCollapsed ? "Calendrier" : ""}>
              <span className="nav-icon">📅</span>
              <span className="nav-text">Calendrier</span>
            </Link>
          </li>
          
          <div className="sidebar-separator"><span>Gestion des tables</span></div>
          
          <li>
            <Link to="/clients" className={isActive('/clients')} title={isCollapsed ? "Tableau des clients" : ""}>
              <span className="nav-icon">👥</span>
              <span className="nav-text">Tableau des clients</span>
            </Link>
          </li>
          <li>
            <Link to="/credits" className={isActive('/credits')} title={isCollapsed ? "Cahier de Crédit" : ""}>
              <span className="nav-icon">📖</span>
              <span className="nav-text">Cahier de Crédit</span>
            </Link>
          </li>
          <li>
            <Link to="/sinistres" className={isActive('/sinistres')} title={isCollapsed ? "Gestion des Sinistres" : ""}>
              <span className="nav-icon">🚗</span>
              <span className="nav-text">Gestion des Sinistres</span>
            </Link>
          </li>
          <li>
            <Link to="/alerts" className={isActive('/alerts')} title={isCollapsed ? "Alertes & Notifications" : ""}>
              <span className="nav-icon">🔔</span>
              <span className="nav-text">Alertes & Notifications</span>
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link to="/users" className={isActive('/users')} title={isCollapsed ? "Tableau des employes" : ""}>
                <span className="nav-icon">⚙️</span>
                <span className="nav-text">Tableau des employes</span>
              </Link>
            </li>
          )}

          {isAdmin && (
            <>
              <div className="sidebar-separator"><span>Analyses & Finances</span></div>
              <li>
                <Link to="/reports" className={isActive('/reports')} title={isCollapsed ? "Rapports des employes" : ""}>
                  <span className="nav-icon">📈</span>
                  <span className="nav-text">Rapports des employes</span>
                </Link>
              </li>
              <li>
                <Link to="/expenses" className={isActive('/expenses')} title={isCollapsed ? "Mes Dépenses" : ""}>
                  <span className="nav-icon">🧾</span>
                  <span className="nav-text">Mes Dépenses</span>
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
              {user?.can_edit || isAdmin ? '✅' : '❌'} Modifier
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
