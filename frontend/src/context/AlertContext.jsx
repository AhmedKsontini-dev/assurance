import { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const removeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const addAlert = useCallback((alert) => {
    const id = Date.now() + Math.random();
    const newAlert = {
      id,
      type: 'info', // success, error, warning, info
      duration: 5000, // auto-dismiss after 5 seconds
      ...alert,
    };
    
    setAlerts((prev) => [...prev, newAlert]);

    // Auto-dismiss
    if (newAlert.duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, newAlert.duration);
    }

    return id;
  }, [removeAlert]);

  const success = useCallback((message, options = {}) => {
    return addAlert({ type: 'success', message, ...options });
  }, [addAlert]);

  const error = useCallback((message, options = {}) => {
    return addAlert({ type: 'error', message, ...options });
  }, [addAlert]);

  const warning = useCallback((message, options = {}) => {
    return addAlert({ type: 'warning', message, ...options });
  }, [addAlert]);

  const info = useCallback((message, options = {}) => {
    return addAlert({ type: 'info', message, ...options });
  }, [addAlert]);

  return (
    <AlertContext.Provider
      value={{
        alerts,
        addAlert,
        removeAlert,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
