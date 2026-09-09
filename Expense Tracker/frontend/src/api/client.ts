import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true // To send HTTPOnly cookies if using them for refresh tokens
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const authStore = localStorage.getItem('auth-storage');
    if (authStore) {
      try {
        const { state } = JSON.parse(authStore);
        if (state.token) {
          config.headers['Authorization'] = `Bearer ${state.token}`;
        }
      } catch (error) {
        console.error('Error parsing auth token', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
