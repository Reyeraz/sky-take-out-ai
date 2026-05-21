import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sky_token');
  if (token) {
    config.headers.token = token;
  }
  console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code === 1) {
      return res.data;
    }
    console.error(res.msg || 'Operation failed');
    return Promise.reject(new Error(res.msg || 'Operation failed'));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sky_token');
      localStorage.removeItem('sky_user');
      const isAdmin = window.location.pathname.startsWith('/admin');
      window.location.href = isAdmin ? '/admin/login' : '/login';
    }
    console.error('[API] Error:', error.message);
    return Promise.reject(error);
  }
);

export default api;
