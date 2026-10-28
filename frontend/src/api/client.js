import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_URL, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('at_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('at_token');
      localStorage.removeItem('at_session');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Falha de rede/CORS/servidor fora do ar (a requisição nem recebeu resposta da API).
export function isNetworkError(err) {
  return !!err && !err.response;
}

export function apiErrorMessage(err, fallback = 'Ocorreu um erro inesperado.') {
  if (isNetworkError(err)) {
    return 'Não foi possível conectar ao servidor. Aguarde alguns segundos e tente novamente.';
  }
  const detail = err?.response?.data?.detail;
  return typeof detail === 'string' ? detail : fallback;
}

export default api;
