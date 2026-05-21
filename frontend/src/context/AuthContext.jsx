import { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser(decoded);
          // Optionally fetch full profile
          fetchProfile();
        }
      } catch (error) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  // Advanced Presence Tracking
  useEffect(() => {
    let interval;
    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    if (user) {
      // Listen for any user interaction
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => document.addEventListener(event, updateActivity));

      // Initial heartbeat (disable permission alerts for background calls)
      api.post('/auth/heartbeat', {}, { showPermissionAlert: false }).catch(() => {});

      // Check status every 30 seconds
      interval = setInterval(() => {
        const isVisible = document.visibilityState === 'visible';
        const isRecentlyActive = (Date.now() - lastActivity) < 180000; // 3 minutes

        // Only signal "Online" if they are looking at the tab AND interacting
        if (isVisible && isRecentlyActive) {
          api.post('/auth/heartbeat', {}, { showPermissionAlert: false }).catch(() => {});
        }
      }, 30000); // 30 second checks

      return () => {
        events.forEach(event => document.removeEventListener(event, updateActivity));
        clearInterval(interval);
      };
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile', { showPermissionAlert: false });
      setUser(res.data.data.user);
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, data } = res.data;
    localStorage.setItem('token', token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
