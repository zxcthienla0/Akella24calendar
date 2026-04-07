import axios from 'axios';
import { useAuthStore } from './authStore';

const API_URL = 'https://task-scheduler-wheat.vercel.app/api/';

const $api = axios.create({
  withCredentials: true,
  baseURL: API_URL,
});

$api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

$api.interceptors.response.use(
  (config) => config,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.code === 'ECONNABORTED' ||
      error.message === 'Network Error' ||
      error.code === 'ERR_NETWORK' ||
      error.response?.status >= 500
    ) {
      console.warn('Backend cold start or network issue:', error.message);
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._isRetry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._isRetry = true;
      try {
        const response = await $api.get('/auth/refresh');
        localStorage.setItem('accessToken', response.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return $api(originalRequest);
      } catch (refreshError) {
        console.log('Refresh token expired or invalid');
        useAuthStore.getState().logoutSync();
        localStorage.removeItem('accessToken');
        if (!window.location.hash.includes('/login')) {
          window.location.hash = '#/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default $api;