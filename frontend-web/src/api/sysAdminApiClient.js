import axios from 'axios';

const sysAdminApiClient = axios.create({ baseURL: '/api' });

sysAdminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sysadmin_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export default sysAdminApiClient;