import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devsight_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 and token was present, token expired
    if (error.response?.status === 401 && localStorage.getItem('devsight_token')) {
      console.warn('Session expired or unauthorized');
    }
    return Promise.reject(error);
  }
);
