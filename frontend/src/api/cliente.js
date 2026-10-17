import axios from 'axios';
export const TOKEN_KEY = 'trama_token';
export const USUARIO_KEY = 'trama_usuario';
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export const clienteApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});
clienteApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
clienteApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USUARIO_KEY);
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);
export default clienteApi;
