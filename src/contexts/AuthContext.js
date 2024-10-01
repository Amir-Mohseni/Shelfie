// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

// Create the Auth Context
export const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [authUsername, setAuthUsername] = useState('');
  const [loading, setLoading] = useState(true);

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUsername = localStorage.getItem('username');
    if (savedToken && savedUsername) {
      setAuthToken(savedToken);
      setAuthUsername(savedUsername);
    }
    setLoading(false);
  }, []);

  // Function to handle login
  const login = (token, username) => {
    setAuthToken(token);
    setAuthUsername(username);
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username);
  };

  // Function to handle logout
  const logout = () => {
    setAuthToken(null);
    setAuthUsername('');
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
  };

  return (
    <AuthContext.Provider
      value={{
        authToken,
        authUsername,
        login,
        logout,
        isAuthenticated: !!authToken,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};