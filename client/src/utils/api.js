import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.MODE === 'development'
      ? '/api'
      : 'https://your-backend-name.onrender.com/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('assessly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — logout user
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('assessly_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;