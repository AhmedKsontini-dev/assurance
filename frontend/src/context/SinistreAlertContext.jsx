import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SinistreAlertContext = createContext();

export const useSinistreAlert = () => {
  const context = useContext(SinistreAlertContext);
  if (!context) {
    throw new Error('useSinistreAlert must be used within a SinistreAlertProvider');
  }
  return context;
};

export const SinistreAlertProvider = ({ children }) => {
  const [alertCount, setAlertCount] = useState(0);
  const [alertSinistres, setAlertSinistres] = useState([]);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/sinistres');
      const sinistres = response.data.data;
      
      // Calculate alerts: sinistres with date_cheque within 10 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const alerts = sinistres.filter(sinistre => {
        if (!sinistre.date_cheque) return false;
        const chequeDate = new Date(sinistre.date_cheque);
        chequeDate.setHours(0, 0, 0, 0);
        const diffTime = chequeDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 10;
      });
      
      setAlertSinistres(alerts);
      setAlertCount(alerts.length);
    } catch (err) {
      console.error('Error fetching sinistre alerts:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Listen for custom event to refresh alerts
    const handleRefreshAlerts = () => {
      fetchAlerts();
    };
    
    window.addEventListener('refresh-sinistre-alerts', handleRefreshAlerts);
    
    return () => {
      window.removeEventListener('refresh-sinistre-alerts', handleRefreshAlerts);
    };
  }, []);

  const refreshAlerts = () => {
    fetchAlerts();
  };

  return (
    <SinistreAlertContext.Provider value={{ alertCount, alertSinistres, refreshAlerts }}>
      {children}
    </SinistreAlertContext.Provider>
  );
};
