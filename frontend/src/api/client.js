import axios from 'axios';

/**
 * Central axios instance.
 * - Base URL comes from VITE_API_BASE_URL; when empty, requests are same-origin
 *   ("/api/...") which works with the Vite dev proxy and single-service deploys.
 * - A request interceptor attaches the JWT from localStorage.
 * - A response interceptor clears the session and redirects to /login on 401.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' }
});

export const TOKEN_KEY = 'vr_token';
export const USER_KEY = 'vr_user';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired / invalid — force a fresh login (unless we're logging in).
      const url = error.config?.url || '';
      if (!url.includes('/api/auth/login')) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/** Normalise an axios error into a human-readable message. */
export function errorMessage(error, fallback = 'Something went wrong') {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default api;
