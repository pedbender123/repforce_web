import axios from 'axios';

// API Client 100% SEPARADO para o SysAdmin
const sysAdminApiClient = axios.create({
  baseURL: '/api', 
});

// Interceptor de Request
sysAdminApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sysadmin_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Response
sysAdminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("SysAdmin Erro 401 - Não autorizado. Deslogando...");
      localStorage.removeItem('sysadmin_token');
      window.location.replace('/sysadmin/login');
    }
    return Promise.reject(error);
  }
);

export default sysAdminApiClient;