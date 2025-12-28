import axios from 'axios';

// Use relative path for production (nginx proxy)
const API_URL = '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Token and Tenant Slug
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const tenantSlug = localStorage.getItem('tenantSlug');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenantSlug) {
    config.headers['X-Tenant-Slug'] = tenantSlug;
  }

  return config;
});

export const login = async (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);
  const response = await apiClient.post('/auth/token', formData);
  return response.data;
};

// --- CATALOGO & PRODUTOS ---
export const getCatalog = async () => {
  const response = await apiClient.get('/catalog/');
  return response.data;
};

// --- CLIENTES ---
export const getClients = async () => {
  // Ajustado para rota CRM
  const response = await apiClient.get('/crm/clients');
  return response.data;
};

export const createClient = async (clientData) => {
  const response = await apiClient.post('/crm/clients', clientData);
  return response.data;
};

// --- PEDIDOS ---
export const getOrders = async () => {
  const response = await apiClient.get('/orders/orders'); // Verifique se a rota backend é /orders ou /orders/orders
  return response.data;
};

export const createOrder = async (orderData) => {
  const response = await apiClient.post('/orders/orders', orderData);
  return response.data;
};

export const getOrderDetails = async (orderId) => {
  const response = await apiClient.get(`/orders/orders/${orderId}`);
  return response.data;
};

export default apiClient;