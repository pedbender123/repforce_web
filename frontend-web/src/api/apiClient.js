import { mockEngine, resetMockDB } from './mockEngine';

// Simula delay de rede para parecer real (300ms)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Extrair coleção (slug) da URL
const getCollectionFromUrl = (url) => {
  if (url.includes('/api/engine/object/')) {
    const parts = url.split('/api/engine/object/')[1].split('/');
    return parts[0].split('?')[0]; // Remove query params
  }
  // Mapeamentos específicos se necessário
  if (url.includes('products')) return 'produtos';
  if (url.includes('clients')) return 'clientes';
  if (url.includes('orders') || url.includes('quotations')) return 'pedidos';
  if (url.includes('suppliers')) return 'fornecedores';
  return null;
};

// Helper: Extrair ID da URL
const getIdFromUrl = (url) => {
  const parts = url.split('/');
  const lastPart = parts[parts.length - 1].split('?')[0];
  return !isNaN(lastPart) ? parseInt(lastPart) : null;
};

const apiClient = {
  // --- POST (CRIAR) ---
  post: async (url, data) => {
    // await delay(300); // MOCK INSTANTÂNEO
    console.log(`[MOCK POST] ${url}`, data);

    // LOGIN
    if (url.includes('/auth/login') || url.includes('/login')) {
      const result = mockEngine.login(data.username, data.password);
      if (result.success) {
        return { data: { access_token: result.token, user: result.user } };
      }
      throw { response: { status: 401, data: { detail: "Credenciais inválidas. Tente: compasso / 123456" } } };
    }

    // ENGINE OBJECT CREATE
    const collection = getCollectionFromUrl(url);
    if (collection) {
      const newItem = mockEngine.create(collection, data);
      return { data: newItem };
    }

    // BUILDER ACTIONS (Apenas simula sucesso)
    if (url.includes('/builder/actions')) {
      return { data: { success: true, message: "Ação executada com sucesso (Mock)" } };
    }

    return { data: { id: Date.now(), ...data } };
  },

  // --- GET (LER) ---
  get: async (url) => {
    // await delay(200); // MOCK INSTANTÂNEO
    console.log(`[MOCK GET] ${url}`);

    // USUÁRIO ATUAL
    if (url.includes('/users/me') || url.includes('/auth/me')) {
      return { 
        data: { 
          id: 1, 
          email: "admin@compasso.com", 
          name: "Admin Compasso", 
          role: "superuser",
          tenant_id: 1,
          is_active: true,
          is_superuser: true,
          memberships: [
            { tenant: { id: 1, slug: 'compasso', name: 'Compasso Demo' }, role: 'admin' }
          ]
        } 
      };
    }

    // BUILDER ENTITIES & FIELDS
    if (url.includes('builder/entities') && url.includes('/fields')) {
      const entityId = getIdFromUrl(url.split('/fields')[0]); // Handle .../entities/1/fields
      return { data: getMockFields(entityId) };
    }
    if (url.includes('builder/entities')) {
      return { data: getMockEntities() };
    }

    // BUILDER PAGES
    if (url.includes('/api/builder/pages/')) {
      const pageId = url.split('/pages/')[1].split('?')[0];
      return { data: getMockPage(pageId) };
    }

    // NAVIGATION
    if (url.includes('builder/navigation')) {
      return { data: getMockNavigation() };
    }

    // ENGINE OBJECT LIST & GET BY ID
    const collection = getCollectionFromUrl(url);
    const id = getIdFromUrl(url);

    if (collection) {
      // Buscar por ID
      if (id) {
        const item = mockEngine.getById(collection, id);
        return { data: item || {} }; // Se não achar devolve vazio (ou poderia ser erro 404)
      }
      
      // Filtros Especiais Mockados
      if (collection === 'pedidos') {
          if (url.includes('quotations') || url.includes('orcamentos')) return { data: mockEngine.getOrcamentos() };
          if (url.includes('sales') || url.includes('vendas')) return { data: mockEngine.getPedidosVenda() };
      }
      
      // Listar Todos
      return { data: mockEngine.list(collection) };
    }

    // DASHBOARD
    if (url.includes('dashboard') || url.includes('analytics')) {
      return { data: getMockDashboard() };
    }

    return { data: [] };
  },

  // --- PUT (ATUALIZAR) ---
  put: async (url, data) => {
    // await delay(300); // MOCK INSTANTÂNEO
    console.log(`[MOCK PUT] ${url}`, data);

    const collection = getCollectionFromUrl(url);
    const id = getIdFromUrl(url);

    if (collection && id) {
      const updatedItem = mockEngine.update(collection, id, data);
      if (updatedItem) return { data: updatedItem };
      throw { response: { status: 404, data: { detail: "Registro não encontrado para atualização." } } };
    }

    // Configurações de página/navegação (apenas retorna ok)
    if (url.includes('/builder/navigation') || url.includes('/builder/pages')) {
         return { data: data };
    }

    return { data: data };
  },

  // --- DELETE (APAGAR) ---
  delete: async (url) => {
    // await delay(300); // MOCK INSTANTÂNEO
    console.log(`[MOCK DELETE] ${url}`);

    const collection = getCollectionFromUrl(url);
    const id = getIdFromUrl(url);

    if (collection && id) {
      const success = mockEngine.delete(collection, id);
      if (success) return { data: { success: true } };
      throw { response: { status: 404, data: { detail: "Registro não encontrado para exclusão." } } };
    }

    return { data: { success: true } };
  }
};

// --- MOCK DATA HELPERS ---

function getMockDashboard() {
  const metrics = mockEngine.getMetrics();
  return {
    total_clientes: metrics.top_clientes.length, // Simplificado
    clientes_ativos: 3,
    total_pedidos: 5,
    orcamentos_abertos: 2,
    vendas_mes: 3,
    faturamento_mes: metrics.faturamento_mensal,
    produtos_estoque_critico: 2,
    tarefas_pendentes: 3,
    chart_vendas: [
      { mes: 'Out', valor: 15000 },
      { mes: 'Nov', valor: 18000 },
      { mes: 'Dez', valor: 22000 },
      { mes: 'Jan', valor: metrics.faturamento_mensal } // Dinâmico
    ]
  };
}

function getMockNavigation() {
  return [
    {
      id: 'vendas', name: 'Vendas', icon: 'ShoppingCart',
      pages: [
        { id: 'orcamentos', name: 'Orçamentos', table: 'pedidos', type: 'list' },
        { id: 'pedidos', name: 'Pedidos e Entregas', table: 'pedidos', type: 'list' },
        { id: 'clientes', name: 'Clientes', table: 'clientes', type: 'list' }
      ]
    },
    {
      id: 'catalogo', name: 'Catálogo', icon: 'Package',
      pages: [
        { id: 'produtos', name: 'Produtos', table: 'produtos', type: 'list' },
        { id: 'fornecedores', name: 'Fornecedores', table: 'fornecedores', type: 'list' },
        { id: 'campanhas', name: 'Campanhas', table: 'campanhas', type: 'list' }
      ]
    },
    {
      id: 'produtividade', name: 'Produtividade', icon: 'Briefcase',
      pages: [
        { id: 'tarefas', name: 'Minhas Tarefas', table: 'tarefas', type: 'list' },
        { id: 'historico', name: 'Histórico', table: 'interacoes', type: 'list' }
      ]
    },
    {
      id: 'analytics', name: 'Dashboards', icon: 'LayoutDashboard',
      pages: [
        { id: 'dashboard', name: 'Analytics', table: null, type: 'dashboard' }
      ]
    }
  ];
}

function getMockEntities() {
  return [
    { id: 1, slug: 'fornecedores', display_name: 'Fornecedores', name: 'fornecedores' },
    { id: 2, slug: 'produtos', display_name: 'Produtos', name: 'produtos' },
    { id: 3, slug: 'clientes', display_name: 'Clientes', name: 'clientes' },
    { id: 4, slug: 'pedidos', display_name: 'Pedidos', name: 'pedidos' },
    { id: 5, slug: 'campanhas', display_name: 'Campanhas', name: 'campanhas' },
    { id: 6, slug: 'tarefas', display_name: 'Tarefas', name: 'tarefas' },
    { id: 7, slug: 'interacoes', display_name: 'Interações', name: 'interacoes' },
    { id: 8, slug: 'itens_pedido', display_name: 'Itens do Pedido', name: 'itens_pedido' },
    { id: 9, slug: 'regras_frete', display_name: 'Regras de Frete', name: 'regras_frete' }
  ];
}

function getMockPage(pageId) {
  const pageMap = {
    'orcamentos': {
      id: 'orcamentos', name: 'Orçamentos', type: 'list', entity_id: 4, entitySlug: 'pedidos', entityName: 'Pedidos',
      layout_config: { columns: ['Numero_Controle', 'Cliente_Nome', 'Status', 'Total_Final', 'Data_Criacao'], permanent_filters: { Fase_Funil: 'Orcamento' } },
      subpages: []
    },
    'pedidos': {
      id: 'pedidos', name: 'Pedidos e Entregas', type: 'list', entity_id: 4, entitySlug: 'pedidos', entityName: 'Pedidos',
      layout_config: { columns: ['Numero_Controle', 'Cliente_Nome', 'Status', 'Total_Final', 'Link_NF'], permanent_filters: { Fase_Funil: 'Venda' } },
      subpages: []
    },
    'clientes': {
      id: 'clientes', name: 'Clientes', type: 'list', entity_id: 3, entitySlug: 'clientes', entityName: 'Clientes',
      layout_config: { columns: ['Razao_Social', 'Nome_Fantasia', 'Status_Cadastro', 'Classificacao_ABC', 'Dias_Sem_Compra'] },
      subpages: []
    },
    'produtos': {
      id: 'produtos', name: 'Produtos', type: 'list', entity_id: 2, entitySlug: 'produtos', entityName: 'Produtos',
      layout_config: { columns: ['Nome', 'SKU', 'Preco_Base', 'Estoque_Atual', 'Status_Estoque'] },
      subpages: []
    },
    'fornecedores': {
      id: 'fornecedores', name: 'Fornecedores', type: 'list', entity_id: 1, entitySlug: 'fornecedores', entityName: 'Fornecedores',
      layout_config: { columns: ['Razao_Social', 'CNPJ', 'Ativo', 'Contato_Comercial'] },
      subpages: []
    },
    'campanhas': {
      id: 'campanhas', name: 'Campanhas', type: 'list', entity_id: 5, entitySlug: 'campanhas', entityName: 'Campanhas',
      layout_config: { columns: ['Nome_Campanha', 'Data_Inicio', 'Data_Fim', 'Tipo_Desconto', 'Ativa_Hoje'] },
      subpages: []
    },
    'tarefas': {
      id: 'tarefas', name: 'Minhas Tarefas', type: 'list', entity_id: 6, entitySlug: 'tarefas', entityName: 'Tarefas',
      layout_config: { columns: ['Titulo', 'Cliente_Nome', 'Prioridade', 'Prazo', 'Status'] },
      subpages: []
    },
    'historico': {
      id: 'historico', name: 'Histórico', type: 'list', entity_id: 7, entitySlug: 'interacoes', entityName: 'Interações',
      layout_config: { columns: ['Cliente_Nome', 'Data_Hora', 'Tipo', 'Resumo'] },
      subpages: []
    },
    'dashboard': {
      id: 'dashboard', name: 'Analytics', type: 'dashboard', entity_id: null, layout_config: {}, subpages: []
    }
  };
  
  return pageMap[pageId] || {
    id: pageId, name: pageId, type: 'list', entity_id: null, layout_config: {}, subpages: []
  };
}

function getMockFields(entityId) {
  const fieldsByEntity = {
    // Fornecedores (entity_id: 1)
    1: [
      { name: 'id', label: 'ID', type: 'number' },
      { name: 'Razao_Social', label: 'Razão Social', type: 'text' },
      { name: 'CNPJ', label: 'CNPJ', type: 'text' },
      { name: 'Logo', label: 'Logo', type: 'image' },
      { name: 'Ativo', label: 'Ativo', type: 'boolean' },
      { name: 'Contato_Comercial', label: 'Contato Comercial', type: 'text' }
    ],
    // Produtos (entity_id: 2)
    2: [
      { name: 'id', label: 'ID', type: 'number' },
      { name: 'Nome', label: 'Nome', type: 'text' },
      { name: 'SKU', label: 'SKU', type: 'text' },
      { name: 'Fornecedor_Ref', label: 'Fornecedor', type: 'reference', reference_entity: 'fornecedores' },
      { name: 'Preco_Base', label: 'Preço Base', type: 'currency' },
      { name: 'Custo', label: 'Custo', type: 'currency' },
      { name: 'Estoque_Atual', label: 'Estoque Atual', type: 'number' },
      { name: 'Estoque_Minimo', label: 'Estoque Mínimo', type: 'number' },
      { name: 'Imagem_Produto', label: 'Imagem', type: 'image' },
      { name: 'Unidade_Medida', label: 'Unidade', type: 'enum', options: ['UN', 'CX', 'PAR', 'M2'] },
      { name: 'Status_Estoque', label: 'Status Estoque', type: 'text', is_virtual: true }
    ],
    // Clientes (entity_id: 3)
    3: [
      { name: 'id', label: 'ID', type: 'number' },
      { name: 'Razao_Social', label: 'Razão Social', type: 'text' },
      { name: 'Nome_Fantasia', label: 'Nome Fantasia', type: 'text' },
      { name: 'CNPJ', label: 'CNPJ', type: 'text' },
      { name: 'Ramo_Atividade', label: 'Ramo', type: 'enum', options: ['Marcenaria', 'Construtora', 'Revenda', 'Arquiteto'] },
      { name: 'Endereco_Completo', label: 'Endereço', type: 'text' },
      { name: 'Status_Cadastro', label: 'Status', type: 'enum', options: ['Ativo', 'Inativo', 'Bloqueado Financeiro', 'Prospect'] },
      { name: 'Classificacao_ABC', label: 'Classificação', type: 'enum', options: ['A - VIP', 'B - Regular', 'C - Eventual'] },
      { name: 'Data_Ultima_Compra', label: 'Última Compra', type: 'date' },
      { name: 'Dias_Sem_Compra', label: 'Dias Sem Compra', type: 'number', is_virtual: true }
    ],
    // Pedidos (entity_id: 4)
    4: [
      { name: 'id', label: 'ID', type: 'number' },
      { name: 'Numero_Controle', label: 'Número', type: 'text' },
      { name: 'Cliente_Ref', label: 'Cliente ID', type: 'reference', reference_entity: 'clientes' },
      { name: 'Cliente_Nome', label: 'Cliente', type: 'text' },
      { name: 'Data_Criacao', label: 'Data', type: 'date' },
      { name: 'Status', label: 'Status', type: 'enum', options: ['Rascunho', 'Em Negociacao', 'Aguardando Aprovação', 'Aprovado', 'Em Separação', 'Faturado', 'Em Rota', 'Entregue', 'Cancelado'] },
      { name: 'Condicao_Pagamento', label: 'Condição Pgto', type: 'enum', options: ['À Vista', '30 Dias', '30/60 Dias', '30/60/90 Dias'] },
      { name: 'Validade_Orcamento', label: 'Validade', type: 'date' },
      { name: 'Valor_Desconto', label: 'Desconto', type: 'currency' },
      { name: 'Link_NF', label: 'NF', type: 'url' },
      { name: 'Total_Itens', label: 'Total Itens', type: 'currency', is_virtual: true },
      { name: 'Total_Final', label: 'Total', type: 'currency', is_virtual: true },
      { name: 'Fase_Funil', label: 'Fase', type: 'text', is_virtual: true }
    ],
    // Campanhas (entity_id: 5)
    5: [
      { name: 'id', label: 'ID', type: 'number' },
      { name: 'Nome_Campanha', label: 'Nome', type: 'text' },
      { name: 'Data_Inicio', label: 'Início', type: 'date' },
      { name: 'Data_Fim', label: 'Fim', type: 'date' },
      { name: 'Tipo_Desconto', label: 'Tipo', type: 'enum', options: ['Percentual', 'Valor Fixo'] },
      { name: 'Valor_Desconto', label: 'Valor', type: 'number' },
      { name: 'Ativa_Hoje', label: 'Ativa?', type: 'boolean', is_virtual: true }
    ],
    // Tarefas (entity_id: 6)
    6: [
      { name: 'id', label: 'ID', type: 'number' },
      { name: 'Titulo', label: 'Título', type: 'text' },
      { name: 'Cliente_Vinculado', label: 'Cliente ID', type: 'reference', reference_entity: 'clientes' },
      { name: 'Cliente_Nome', label: 'Cliente', type: 'text' },
      { name: 'Prioridade', label: 'Prioridade', type: 'enum', options: ['Alta', 'Média', 'Baixa'] },
      { name: 'Prazo', label: 'Prazo', type: 'date' },
      { name: 'Status', label: 'Status', type: 'enum', options: ['Pendente', 'Em Andamento', 'Concluída'] }
    ],
    // Interações (entity_id: 7)
    7: [
      { name: 'id', label: 'ID', type: 'number' },
      { name: 'Cliente_Ref', label: 'Cliente ID', type: 'reference', reference_entity: 'clientes' },
      { name: 'Cliente_Nome', label: 'Cliente', type: 'text' },
      { name: 'Data_Hora', label: 'Data/Hora', type: 'datetime' },
      { name: 'Tipo', label: 'Tipo', type: 'enum', options: ['Ligação', 'WhatsApp', 'Visita Presencial', 'Email'] },
      { name: 'Resumo', label: 'Resumo', type: 'text', field_type: 'longtext' }
    ]
  };

  return fieldsByEntity[entityId] || [
    { name: 'id', label: 'ID', type: 'number' },
    { name: 'name', label: 'Nome', type: 'text' }
  ];
}

export default apiClient;