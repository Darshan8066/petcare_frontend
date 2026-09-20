import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { clearSession, getErrorMessage } from '../services/api.js';

const AuthContext = createContext(undefined);

const TOKEN_KEY = 'petcare_token';
const USER_KEY = 'petcare_user';

/** Flattens the two response shapes the API uses into a single user object. */
const normalizeUser = (rawData) => {
  if (!rawData) return null;
  if (rawData.user && typeof rawData.user === 'object') {
    return { ...rawData.user };
  }
  return rawData;
};

const persistSession = (userData, token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
  // Kept in sync for RouteManager, which reads the role directly.
  if (userData?.role) localStorage.setItem('petcare_user_role', userData.role);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? normalizeUser(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });

  // `loading` covers the initial session check only. Form submissions use
  // `submitting` so a failed login cannot leave the whole app in a loading
  // state, and so the initial check cannot be cancelled by a form.
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const endSession = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // Verify the stored token against the server on first load.
  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        // Nothing to verify — drop any stale cached user.
        if (!cancelled) {
          clearSession();
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (cancelled) return;

        if (res.data?.success && res.data.data) {
          const userData = normalizeUser(res.data.data);
          setUser(userData);
          persistSession(userData, null);
        } else {
          endSession();
        }
      } catch (err) {
        if (cancelled) return;
        // Only a real 401 invalidates the session. A network blip or a 500
        // must not sign the user out — the previous version cleared the
        // session on any error at all.
        if (err?.response?.status === 401) {
          endSession();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initAuth();
    return () => {
      cancelled = true;
    };
  }, [endSession]);

  // The api client fires this when a request comes back 401.
  useEffect(() => {
    const handleExpiry = () => setUser(null);
    window.addEventListener('petcare_session_expired', handleExpiry);
    return () => window.removeEventListener('petcare_session_expired', handleExpiry);
  }, []);

  /**
   * Signs in. Returns { success, user, message } so the caller can show the
   * real reason for a failure. Previously this returned `null` for every
   * error, so the UI could only ever say "invalid credentials".
   */
  const login = async (email, password, expectedRole) => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', { email, password });

      if (!res.data?.success) {
        return { success: false, message: res.data?.message || 'Sign in failed.' };
      }

      const raw = res.data.data;
      const userData = normalizeUser(raw);
      const token = raw.accessToken || raw.token;

      // Role gate for the separate admin portal. Nothing is persisted when the
      // role does not match, so a normal user cannot land in a half-signed-in
      // state on the admin page.
      if (expectedRole && userData.role !== expectedRole) {
        return {
          success: false,
          message:
            expectedRole === 'admin'
              ? 'This account does not have administrator access.'
              : 'Please use the administrator portal to sign in with this account.'
        };
      }

      persistSession(userData, token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, message: getErrorMessage(err, 'Invalid email or password.') };
    } finally {
      setSubmitting(false);
    }
  };

  const register = async (name, email, password) => {
    setSubmitting(true);
    try {
      // `role` is deliberately not sent — the server assigns it. Accepting a
      // role from the client allowed anyone to register as an administrator.
      const res = await api.post('/auth/register', { name, email, password });

      if (!res.data?.success) {
        return { success: false, message: res.data?.message || 'Registration failed.' };
      }

      const raw = res.data.data;
      const userData = normalizeUser(raw);
      persistSession(userData, raw.accessToken || raw.token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, message: getErrorMessage(err, 'Registration failed.') };
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Signing out locally must succeed even if the request fails.
    } finally {
      endSession();
    }
  };

  const updateUser = (updated) => {
    const normalized = normalizeUser(updated);
    persistSession(normalized, null);
    setUser(normalized);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        submitting,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        isUser: user?.role === 'user'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
