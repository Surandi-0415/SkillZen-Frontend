// src/api/authApi.js

import { nodeClient } from './client';

// ============================================================
// Auth APIs
// ============================================================

export const register = (userData) => {
  return nodeClient.post('/auth/register', userData);
};

export const login = (credentials) => {
  return nodeClient.post('/auth/login', credentials);
};

export const getProfile = () => {
  return nodeClient.get('/auth/profile');
};

export const updateProfile = (profileData) => {
  return nodeClient.put('/auth/profile', profileData);
};

export const forgotPassword = (emailData) => {
  return nodeClient.post('/auth/forgot-password', emailData);
};

export const resetPassword = (token, passwordData) => {
  return nodeClient.post(`/auth/reset-password/${token}`, passwordData);
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      return JSON.parse(user);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem('user');
  // Don't redirect here, let the component handle it
  return true;
};