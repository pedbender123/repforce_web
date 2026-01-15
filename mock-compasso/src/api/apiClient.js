import { mockEngine } from './mockEngine';
import { STATIC_SCHEMAS, STATIC_PAGES } from './staticMetadata';

// Simula delay de rede para parecer real (300ms)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para descobrir a coleção da URL
const getCollection = (url) => {
  if (url.includes('products') || url.includes('produtos')) return 'produtos';
  if (url.includes('clients') || url.includes('clientes')) return 'clientes';
  if (url.includes('orders') || url.includes('pedidos') || url.includes('quotations')) return 'pedidos';
  if (url.includes('suppliers')) return 'fornecedores';
  // Fallback para URL genérica
  if (url.includes('/api/engine/object/')) return url.split('/api/engine/object/')[1].split('/')[0];
  return null;
};

const getId = (url) => {
  const parts = url.split('/');
  const last = parts[parts.length - 1];
  return !isNaN(last) ? parseInt(last) : null;
};

const apiClient = {
  post: async (url, data) => {
    await delay(300);
    console.log(`[MOCK POST] ${url}`, data);

    // LOGIN
    if (url.includes('/auth/token') || url.includes('/login')) {
      const result = mockEngine.login(data.username || data.email, data.password);
      if (result.success) return { data: { access_token: result.token, user: result.user } };
      throw { response: { status: 401, data: { detail: "Credenciais Inválidas" } } };
    }

    // BUILDER ACTIONS
    if (url.includes('builder/actions')) return { data: { success: true } };

    // CRIAR
    const col = getCollection(url);
    if (col) {
      return { data: mockEngine.create(col, data) };
    }

    return { data: { id: Date.now(), ...data } };
  },

  get: async (url) => {
    await delay(200);
    console.log(`[MOCK GET] ${url}`);

    // USUÁRIO
    if (url.includes('/users/me') || url.includes('/auth/me')) {
      return { data: { id: 1, email: "admin@compasso.com", name: "Admin Compasso", role: "admin", tenant_id: 1 } };
    }

    // BUILDER / METADATA
    // PAGE DETAILS (Hardcoded bypass)
    if (url.includes('/api/builder/pages/')) {
      const pageId = url.split('/').pop();
      const staticPage = STATIC_PAGES.find(p => p.id === pageId);
      // If not found, try to generate a generic one based on ID or return null
      if (staticPage) return { data: staticPage };

      // Fallback for "magic" pages if needed
      return { data: { id: pageId, name: 'Página Genérica', type: 'list', entity_id: 'generic', layout_config: {} } };
    }

    if (url.includes('builder/navigation')) return { data: mockEngine.getNavigation() };
    if (url.includes('builder/entities') || url.includes('/api/engine/schema')) return { data: Object.keys(STATIC_SCHEMAS).map(k => ({ id: k, slug: k, display_name: k.toUpperCase(), fields: STATIC_SCHEMAS[k].fields })) };

    // LISTAR / OBTER
    const col = getCollection(url);
    const id = getId(url);

    if (col) {
      if (id) {
        const item = mockEngine.getById(col, id);
        return { data: item || {} };
      }

      // Filtros específicos
      if (col === 'pedidos') {
        if (url.includes('quotations')) return { data: mockEngine.getOrcamentos() };
        if (url.includes('sales')) return { data: mockEngine.getPedidosVenda() };
      }

      return { data: mockEngine.list(col) };
    }

    // DASHBOARD
    if (url.includes('dashboard') || url.includes('analytics')) {
      return { data: mockEngine.getMetrics() };
    }

    return { data: [] };
  },

  put: async (url, data) => {
    await delay(300);
    console.log(`[MOCK PUT] ${url}`, data);

    const col = getCollection(url);
    const id = getId(url);

    if (col && id) {
      return { data: mockEngine.update(col, id, data) };
    }

    return { data: data };
  },

  delete: async (url) => {
    await delay(300);
    console.log(`[MOCK DELETE] ${url}`);

    const col = getCollection(url);
    const id = getId(url);

    if (col && id) {
      mockEngine.delete(col, id);
    }

    return { data: { success: true } };
  }
};

export default apiClient;