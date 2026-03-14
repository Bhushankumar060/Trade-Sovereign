import axios from 'axios';
import { auth } from './firebase';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const getMe = () => api.get('/api/auth/me').then(r => r.data);
export const updateProfile = (data) => api.put('/api/auth/profile', data).then(r => r.data);

// Products
export const listProducts = (params) => api.get('/api/products', { params }).then(r => r.data);
export const getProduct = (id) => api.get(`/api/products/${id}`).then(r => r.data);

// Categories
export const listCategories = () => api.get('/api/categories').then(r => r.data);

// Media
export const listMedia = (params) => api.get('/api/media', { params }).then(r => r.data);
export const getMediaItem = (id) => api.get(`/api/media/${id}`).then(r => r.data);
export const getMediaDownload = (id) => api.get(`/api/media/${id}/download`).then(r => r.data);

// Orders
export const listOrders = () => api.get('/api/orders').then(r => r.data);
export const getOrder = (id) => api.get(`/api/orders/${id}`).then(r => r.data);

// Payments
export const createPaymentOrder = (data) => api.post('/api/payments/create-order', data).then(r => r.data);
export const verifyPayment = (data) => api.post('/api/payments/verify', data).then(r => r.data);

// Subscriptions
export const getMySubscription = () => api.get('/api/subscriptions/my').then(r => r.data);
export const listSubscriptionPlans = () => api.get('/api/subscriptions/plans').then(r => r.data);

// Rewards
export const getMyRewards = () => api.get('/api/rewards/my').then(r => r.data);

// AI
export const aiChat = (data) => api.post('/api/ai/chat', data).then(r => r.data);
export const aiAnalyze = (data) => api.post('/api/ai/analyze', data).then(r => r.data);
export const aiSearch = (data) => api.post('/api/ai/search', data).then(r => r.data);
export const listConversations = () => api.get('/api/ai/conversations').then(r => r.data);
export const saveConversation = (data) => api.post('/api/ai/conversations', data).then(r => r.data);
export const deleteConversation = (id) => api.delete(`/api/ai/conversations/${id}`).then(r => r.data);

// Admin
export const adminGetStats = () => api.get('/api/admin/stats').then(r => r.data);
export const adminGetAnalytics = (period) => api.get('/api/admin/analytics', { params: { period } }).then(r => r.data);
export const adminListProducts = () => api.get('/api/admin/products').then(r => r.data);
export const adminCreateProduct = (data) => api.post('/api/admin/products', data).then(r => r.data);
export const adminUpdateProduct = (id, data) => api.put(`/api/admin/products/${id}`, data).then(r => r.data);
export const adminDeleteProduct = (id) => api.delete(`/api/admin/products/${id}`).then(r => r.data);
export const adminListMedia = () => api.get('/api/admin/media').then(r => r.data);
export const adminCreateMedia = (data) => api.post('/api/admin/media', data).then(r => r.data);
export const adminListUsers = () => api.get('/api/admin/users').then(r => r.data);
export const adminUpdateUserRole = (id, data) => api.put(`/api/admin/users/${id}/role`, data).then(r => r.data);
export const adminListCategories = () => api.get('/api/admin/categories').then(r => r.data);
export const adminCreateCategory = (data) => api.post('/api/admin/categories', data).then(r => r.data);
export const adminUpdateCategory = (id, data) => api.put(`/api/admin/categories/${id}`, data).then(r => r.data);
export const adminDeleteCategory = (id) => api.delete(`/api/admin/categories/${id}`).then(r => r.data);
export const adminListPages = () => api.get('/api/admin/pages').then(r => r.data);
export const adminCreatePage = (data) => api.post('/api/admin/pages', data).then(r => r.data);
export const adminUpdatePage = (id, data) => api.put(`/api/admin/pages/${id}`, data).then(r => r.data);
export const adminDeletePage = (id) => api.delete(`/api/admin/pages/${id}`).then(r => r.data);
export const adminGetAiSettings = () => api.get('/api/admin/ai-settings').then(r => r.data);
export const adminUpdateAiSettings = (data) => api.put('/api/admin/ai-settings', data).then(r => r.data);
export const adminListSubscriptionPlans = () => api.get('/api/admin/subscription-plans').then(r => r.data);
export const adminCreateSubscriptionPlan = (data) => api.post('/api/admin/subscription-plans', data).then(r => r.data);
export const adminDeleteSubscriptionPlan = (id) => api.delete(`/api/admin/subscription-plans/${id}`).then(r => r.data);

// Copy Trading
export const listTraders = (params) => api.get('/api/copy-trading/traders', { params }).then(r => r.data);
export const getTraderProfile = (id) => api.get(`/api/copy-trading/traders/${id}`).then(r => r.data);
export const listTradeSignals = (params) => api.get('/api/copy-trading/signals', { params }).then(r => r.data);
export const becomeTrader = () => api.post('/api/copy-trading/become-trader').then(r => r.data);
export const createTradeSignal = (data) => api.post('/api/copy-trading/signals', data).then(r => r.data);
export const copyTrader = (traderId, data) => api.post(`/api/copy-trading/copy/${traderId}`, data).then(r => r.data);
export const stopCopyingTrader = (traderId) => api.delete(`/api/copy-trading/copy/${traderId}`).then(r => r.data);
export const getMyCopies = () => api.get('/api/copy-trading/my-copies').then(r => r.data);
export const getMyTraderProfile = () => api.get('/api/copy-trading/my-trader-profile').then(r => r.data);
export const updateMyTraderProfile = (data) => api.put('/api/copy-trading/my-trader-profile', data).then(r => r.data);

export default api;
