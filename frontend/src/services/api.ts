import axios from 'axios';

export const getBaseUrl = (): string => {
  let url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // If running on local network IP (e.g. 192.168.x.x)
      if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return `http://${hostname}:5000/api`;
      }
      // If running on localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
      }
    }
    url = 'https://shopcraft-backend-guv5.onrender.com/api';
  }

  url = url.trim();
  // Force HTTPS on secure pages to eliminate Mixed Content browser blocks
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http:')) {
    url = url.replace(/^http:/, 'https:');
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  // Fix duplicate /api/api
  if (url.endsWith('/api/api')) {
    url = url.replace(/\/api\/api$/, '/api');
  }

  // Ensure single /api suffix
  if (!url.endsWith('/api')) {
    url = url + '/api';
  }

  return url;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization header
api.interceptors.request.use(
  (config) => {
    config.baseURL = getBaseUrl();
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Attach CSRF Token placeholder if needed for forms
      const csrfToken = localStorage.getItem('csrfToken');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiries
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Optionally redirect to login page
      }
    }
    return Promise.reject(error);
  }
);

export default api;
