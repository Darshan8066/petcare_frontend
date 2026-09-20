import axios from 'axios';

/**
 * Resolves the API base URL.
 *
 * VITE_* variables are inlined at BUILD time, not at runtime — if the variable
 * is missing when `vite build` runs, the deployed bundle ships with
 * `undefined` and every request silently hits the frontend's own origin.
 * Falling back to a relative "/api" keeps the app working with the dev proxy
 * and with any same-origin deployment.
 */
const resolveBaseURL = () => {
  const configured = import.meta.env.VITE_API_URL?.trim();

  if (!configured) {
    if (import.meta.env.PROD) {
      console.warn(
        '[api] VITE_API_URL is not set. Falling back to "/api". Set it in your hosting provider\'s environment variables and redeploy.'
      );
    }
    return '/api';
  }

  // Tolerate a trailing slash so "https://host/api/" and "https://host/api"
  // both produce correct URLs.
  return configured.replace(/\/+$/, '');
};

const api = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: { 'Content-Type': 'application/json' }
});

const TOKEN_KEY = 'petcare_token';
const USER_KEY = 'petcare_user';

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('petcare_user_role');
};

// Attach the bearer token to every outgoing request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Turns any axios failure into a human-readable message. Previously the app
 * discarded the server's response and showed "Invalid email or password" for
 * everything — including network failures, CORS rejections and 500s — which
 * made the production login problem impossible to diagnose from the UI.
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;

  if (error?.code === 'ECONNABORTED') {
    return 'The server took too long to respond. Please try again.';
  }

  // No response object at all means the request never reached the API:
  // server down, wrong VITE_API_URL, or blocked by CORS.
  if (!error?.response) {
    return 'Cannot reach the server. Please check your connection and try again.';
  }

  if (error.response.status >= 500) {
    return 'The server encountered an error. Please try again shortly.';
  }

  return fallback;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const path = window.location.pathname;
    const onAuthPage = path.includes('/login') || path.includes('/admin-login');

    // A 401 means the session is genuinely gone. Clear it so the UI stops
    // showing a signed-in state, but never while the user is actively trying
    // to sign in (that would wipe the form's context mid-attempt).
    if (status === 401 && !onAuthPage) {
      clearSession();
      window.dispatchEvent(new CustomEvent('petcare_session_expired'));
    }

    return Promise.reject(error);
  }
);

export default api;
