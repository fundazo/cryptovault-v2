import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://cryptovault-backend-1tft.onrender.com/api/v1';

console.log('API_BASE =', API_BASE);
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
};

// User
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  changePassword: (data) => api.put('/user/change-password', data),
  getBalances: () => api.get('/user/balances'),
  getTransactions: (params) => api.get('/user/transactions', { params }),
  getNotifications: () => api.get('/user/notifications'),
  markNotificationsRead: () => api.put('/user/notifications/read'),
};

// Deposits
export const depositAPI = {
  getWalletAddresses: () => api.get('/deposits/wallet-addresses'),
  createDeposit: (data) => api.post('/deposits', data),
  getUserDeposits: (params) => api.get('/deposits', { params }),
};

// Withdrawals
export const withdrawalAPI = {
  createWithdrawal: (data) => api.post('/withdrawals', data),
  getUserWithdrawals: (params) => api.get('/withdrawals', { params }),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  adjustBalance: (data) => api.post('/admin/users/adjust-balance', data),
  getDeposits: (params) => api.get('/admin/deposits', { params }),
  reviewDeposit: (id, data) => api.patch(`/admin/deposits/${id}/review`, data),
  getWithdrawals: (params) => api.get('/admin/withdrawals', { params }),
  reviewWithdrawal: (id, data) => api.patch(`/admin/withdrawals/${id}/review`, data),
  getWalletAddresses: () => api.get('/admin/wallet-addresses'),
  upsertWalletAddress: (data) => api.post('/admin/wallet-addresses', data),
  getTransactions: (params) => api.get('/admin/transactions', { params }),
};

export default api;
