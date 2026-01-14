import axios from 'axios';

// Configuração da URL da API
// Em produção, REACT_APP_API_URL deve estar definido.
// Em desenvolvimento local, fallback para localhost:8100.
// Em desenvolvimento local, fallback para localhost:8100.
// FIX: Always use relative path to ensure Vite Proxy handles routing correctly (avoids /api/v1 doubles)
const API_URL = '';

if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL) {
    console.warn("AVISO: REACT_APP_API_URL não está definida em ambiente de produção. Usando fallback localhost.");
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for Request: Injection
apiClient.interceptors.request.use((config) => {
  console.log(`[API REQUEST] ${config.method.toUpperCase()} ${config.url}`, config);
  const token = localStorage.getItem('token');
  const tenantSlug = localStorage.getItem('tenantSlug');

  // Unified Token Logic
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Tenant injection (only if not a global system route or if explicitly selected)
  // FIX: Never send tenant slug for SysAdmin routes to avoid Middleware 404s on Stale State
  const isSysAdminRoute = config.url.includes('/sysadmin') || config.url.includes('/v1/sysadmin');

  if (tenantSlug && !isSysAdminRoute) {
    config.headers['X-Tenant-Slug'] = tenantSlug;
  }

  return config;
});

// Interceptor for Response: Anti-Loop & Session Management
apiClient.interceptors.response.use(
  (response) => {
      console.log(`[API SUCCESS] ${response.config.url}`, response.status);
      return response;
  },
  (error) => {
    console.error(`[API ERROR] ${error.config?.url}`, error.response || error);
    // We avoid aggressive localStorage purge here to prevent AuthContext-Redirect loops.
    // AuthContext's hydrateUserData will handle 401s during boot or manual refreshes.
    if (error.response?.status === 401) {
      console.warn("Unauthorized API call detected:", error.config.url);
    }
    return Promise.reject(error);
  }
);

export default apiClient;