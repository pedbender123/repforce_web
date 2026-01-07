import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8100';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for Request: Injection
apiClient.interceptors.request.use((config) => {
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
  (response) => response,
  (error) => {
    // We avoid aggressive localStorage purge here to prevent AuthContext-Redirect loops.
    // AuthContext's hydrateUserData will handle 401s during boot or manual refreshes.
    if (error.response?.status === 401) {
      console.warn("Unauthorized API call detected:", error.config.url);
    }
    return Promise.reject(error);
  }
);

export default apiClient;