export const API_CONFIG = {
  baseURL: process.env.API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh',
  },
  threats: {
    getAll: '/threats',
    getById: (id: string) => `/threats/${id}`,
    statistics: '/threats/statistics',
    updateStatus: (id: string) => `/threats/${id}/status`,
  },
  decoys: {
    getAll: '/decoys',
    getById: (id: string) => `/decoys/${id}`,
    create: '/decoys',
    updateStatus: (id: string) => `/decoys/${id}/status`,
    triggers: (id: string) => `/decoys/${id}/triggers`,
    statistics: '/decoys/statistics',
  },
};