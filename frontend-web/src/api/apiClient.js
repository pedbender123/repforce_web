import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Ajuste conforme necessário

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await apiClient.post('/login', formData);
    return response.data;
};

// --- CATALOGO & PRODUTOS ---
export const getCatalog = async () => {
  const response = await apiClient.get('/catalog/');
  return response.data;
};

// --- CLIENTES (Agora apenas cadastro básico, sem CRM) ---
// Nota: Se a rota de clientes estava em /crm/clients, ela deve ser movida no backend para /catalog ou /orders
// Assumindo que o backend agora serve clientes básicos em /orders/clients ou similar, 
// ou mantendo a rota mas sabendo que ela precisa existir no backend. 
// Vamos assumir que listagem de clientes para pedidos está em /orders/clients-list ou similar.
// Se não houver rota específica no código anterior, use a do Admin ou crie uma no Orders.
// Por simplificação, vou apontar para /orders/clients (precisa ser criada no orders.py se não existir)
// ou se o usuário SalesRep pode ler do /admin/clients (menos provável).
// Vou assumir que existe uma rota de leitura de clientes em /catalog/clients ou /orders/clients.
// Padrão atual: GET /admin/clients (se o vendedor tiver permissão) ou GET /catalog/clients.

export const getClients = async () => {
  // Ajuste a rota no backend para onde os clientes são listados para o app
  const response = await apiClient.get('/orders/clients'); 
  return response.data;
};

export const createClient = async (clientData) => {
    const response = await apiClient.post('/orders/clients', clientData);
    return response.data;
};

// --- PEDIDOS ---
export const getOrders = async () => {
    const response = await apiClient.get('/orders/');
    return response.data;
};

export const createOrder = async (orderData) => {
    const response = await apiClient.post('/orders/', orderData);
    return response.data;
};

export const getOrderDetails = async (orderId) => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
};

export default apiClient;