import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../services/axiosSetup';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Utility to clear all legacy auth cookies and localStorage items for old users
export const clearAllAuthCookiesAndStorage = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authUser');
    localStorage.removeItem('kforum_user');

    const cookies = document.cookie ? document.cookie.split(';') : [];
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
      }
    }
  } catch (err) {
    console.error('Error clearing auth cookies/storage:', err);
  }
};

// Check if JWT token is expired or malformed
const isTokenExpired = (jwtToken) => {
  if (!jwtToken) return true;
  try {
    const parts = jwtToken.split('.');
    if (parts.length !== 3) return true; // invalid JWT format
    const payload = JSON.parse(atob(parts[1]));
    if (payload && payload.exp) {
      return Date.now() / 1000 >= payload.exp;
    }
    return false;
  } catch (e) {
    return true; // malformed token
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is logged in on app start & auto-delete cookies/tokens for old/expired users
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      
      if (savedToken) {
        // Auto-delete cookies and storage if token is expired or malformed
        if (isTokenExpired(savedToken)) {
          console.warn('🔑 Expired token detected. Auto-clearing old auth cookies & token.');
          clearAllAuthCookiesAndStorage();
          setToken(null);
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const response = await axios.get('/api/auth/me');
          setUser({ ...response.data, id: response.data._id });
        } catch (error) {
          console.warn('🔑 Auth validation failed. Auto-deleting old auth cookies & session token.');
          clearAllAuthCookiesAndStorage();
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = (userData, authToken) => {
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    clearAllAuthCookiesAndStorage();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser(prev => (prev ? { ...prev, ...updatedData } : null));
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};