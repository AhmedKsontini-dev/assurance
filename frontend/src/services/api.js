import axios from 'axios';

const api = axios.create({
  baseURL: 'http://100.113.217.68:5000/api',
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      // Log which API call is triggering 403
      console.error('403 Forbidden:', error.config?.url, error.config?.method);
      console.error('showPermissionAlert flag:', error.config?.showPermissionAlert);
      
      // Only show permission alert for user-initiated requests
      // Background requests (heartbeat, etc.) should not trigger alerts
      const showPermissionAlert = error.config?.showPermissionAlert !== false;
      
      if (showPermissionAlert) {
        // Dispatch a custom event for unauthorized access
        window.dispatchEvent(new CustomEvent('unauthorized-action', { 
          detail: { message: error.response.data.message } 
        }));
      }
    }
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
