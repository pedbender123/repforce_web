// frontend-web/src/api/mockEngine.js

// 1. DADOS INICIAIS (O Checklist Compasso V1)
const INITIAL_DB = {
  auth: { user: 'compasso', pass: '123456', token: 'fake-jwt-token-999' },
  fornecedores: [
    { id: 1, Razao_Social: "Indústria de Paineis Arauco", CNPJ: "12.345.678/0001-90", Ativo: true, Logo: "arauco.png" },
    { id: 2, Razao_Social: "Guararapes Paineis", CNPJ: "98.765.432/0001-10", Ativo: true, Logo: "guararapes.png" },
    { id: 3, Razao_Social: "Blum Ferragens Austria", CNPJ: "11.222.333/0001-00", Ativo: true, Logo: "blum.png" },
    { id: 4, Razao_Social: "Cometal Indústria Metalúrgica", CNPJ: "44.555.666/0001-88", Ativo: true, Logo: "cometal.png" }
  ],
  produtos: [
    // CHAPAS MDF
    { id: 1, Nome: "MDF Branco Tx 15mm 2 Faces", SKU: "MDF-BCO-15-2F", Preco_Base: 165.90, Estoque_Atual: 240, Estoque_Minimo: 50, Status_Estoque: "Normal", Categoria: "Paineis" },
    { id: 2, Nome: "MDF Branco Tx 18mm 2 Faces", SKU: "MDF-BCO-18-2F", Preco_Base: 198.50, Estoque_Atual: 150, Estoque_Minimo: 40, Status_Estoque: "Normal", Categoria: "Paineis" },
    { id: 3, Nome: "MDF Carvalho Hanover 18mm", SKU: "MDF-CARV-18", Preco_Base: 289.00, Estoque_Atual: 30, Estoque_Minimo: 20, Status_Estoque: "Normal", Categoria: "Paineis" },
    { id: 4, Nome: "MDF Grafite Matt 18mm", SKU: "MDF-GRAF-18", Preco_Base: 310.00, Estoque_Atual: 12, Estoque_Minimo: 15, Status_Estoque: "Crítico", Categoria: "Paineis" },

    // FERRAGENS
    { id: 10, Nome: "Dobradiça Curva 35mm Slide-On", SKU: "DOB-35-CURVA", Preco_Base: 2.50, Estoque_Atual: 5000, Estoque_Minimo: 1000, Status_Estoque: "Normal", Categoria: "Ferragens" },
    { id: 11, Nome: "Corrediça Telescópica 450mm Zincada", SKU: "COR-TEL-450", Preco_Base: 18.90, Estoque_Atual: 450, Estoque_Minimo: 200, Status_Estoque: "Normal", Categoria: "Ferragens" },
    { id: 12, Nome: "Pistão a Gás 80N Inverso", SKU: "PIS-80N-INV", Preco_Base: 12.40, Estoque_Atual: 80, Estoque_Minimo: 100, Status_Estoque: "Crítico", Categoria: "Ferragens" },
    { id: 13, Nome: "Parafuso Philips 4,0x40 Chipboard", SKU: "PAR-4040-CX", Preco_Base: 45.00, Estoque_Atual: 60, Estoque_Minimo: 10, Status_Estoque: "Normal", Categoria: "Ferragens" },

    // INSUMOS
    { id: 20, Nome: "Cola de Contato 2,8kg Base Solvente", SKU: "COLA-CTC-2.8", Preco_Base: 65.00, Estoque_Atual: 40, Estoque_Minimo: 10, Status_Estoque: "Normal", Categoria: "Químicos" },
    { id: 21, Nome: "Fita de Borda PVC Branco 22mm x 20m", SKU: "FIT-BCO-22", Preco_Base: 12.00, Estoque_Atual: 300, Estoque_Minimo: 50, Status_Estoque: "Normal", Categoria: "Fitas" }
  ],
  clientes: [
    { id: 1, Razao_Social: "Móveis Bento Ltda", Nome_Fantasia: "Bento Móveis", Cidade: "Bento Gonçalves", UF: "RS", Status_Cadastro: "Ativo", Classificacao_ABC: "A - VIP", Data_Ultima_Compra: "2023-11-20" },
    { id: 2, Razao_Social: "Marcenaria Silva e Filhos", Nome_Fantasia: "Marcenaria Silva", Cidade: "Caxias do Sul", UF: "RS", Status_Cadastro: "Ativo", Classificacao_ABC: "B - Regular", Data_Ultima_Compra: "2023-10-15" },
    { id: 3, Razao_Social: "Indústria de Móveis Planejados Vida Nova", Nome_Fantasia: "Vida Nova Planejados", Cidade: "Porto Alegre", UF: "RS", Status_Cadastro: "Bloqueado Financeiro", Classificacao_ABC: "C - Risco", Data_Ultima_Compra: "2023-08-01" },
    { id: 4, Razao_Social: "ArteFATTO Interiores", Nome_Fantasia: "ArteFATTO", Cidade: "Flores da Cunha", UF: "RS", Status_Cadastro: "Ativo", Classificacao_ABC: "A - VIP", Data_Ultima_Compra: "2023-11-22" },
    { id: 5, Razao_Social: "Marcenaria do Pedro", nome_fantasia: "Pedro Móveis", Cidade: "Garibaldi", UF: "RS", Status_Cadastro: "Inativo", Classificacao_ABC: "C - Inativo", Data_Ultima_Compra: "2023-01-10" }
  ],
  pedidos: [
    { id: 1001, Numero_Controle: "PED-23-001", Cliente_Ref: "Móveis Bento Ltda", Status: "Aprovado", Fase_Funil: "Venda", Total_Final: 12500.00, Data_Emissao: "2023-11-20" },
    { id: 1002, Numero_Controle: "ORC-23-045", Cliente_Ref: "Marcenaria Silva", Status: "Em Negociacao", Fase_Funil: "Orcamento", Total_Final: 2300.50, Data_Emissao: "2023-11-21" },
    { id: 1003, Numero_Controle: "PED-23-002", Cliente_Ref: "ArteFATTO Interiores", Status: "Em Separação", Fase_Funil: "Entrega", Total_Final: 8900.00, Data_Emissao: "2023-11-22" },
    { id: 1004, Numero_Controle: "ORC-23-046", Cliente_Ref: "Vida Nova Planejados", Status: "Cancelado", Fase_Funil: "Perdido", Total_Final: 540.00, Data_Emissao: "2023-11-10" },
    { id: 1005, Numero_Controle: "PED-23-003", Cliente_Ref: "Móveis Bento Ltda", Status: "Rascunho", Fase_Funil: "Orcamento", Total_Final: 0.00, Data_Emissao: "2023-11-23" }
  ],
  itens_pedido: [
    { id: 1, pedido_id: 1001, produto_id: 1, quantidade: 50, preco_unitario: 165.90, total: 8295.00 }, // MDF Branco
    { id: 2, pedido_id: 1001, produto_id: 10, quantidade: 200, preco_unitario: 2.50, total: 500.00 }, // Dobradiças
    { id: 3, pedido_id: 1001, produto_id: 21, quantidade: 20, preco_unitario: 12.00, total: 240.00 }, // Fita Borda

    { id: 4, pedido_id: 1002, produto_id: 2, quantidade: 10, preco_unitario: 198.50, total: 1985.00 }, // MDF 18mm
    { id: 5, pedido_id: 1002, produto_id: 20, quantidade: 5, preco_unitario: 65.00, total: 325.00 },  // Cola

    { id: 6, pedido_id: 1003, produto_id: 3, quantidade: 20, preco_unitario: 289.00, total: 5780.00 }, // MDF Carvalho
    { id: 7, pedido_id: 1003, produto_id: 11, quantidade: 100, preco_unitario: 18.90, total: 1890.00 } // Corrediças
  ],
  // Estruturas adicionais para evitar crashes
  navigation_groups: [
    {
      id: 1, name: "Comercial", icon: "ShoppingCart", order: 1, pages: [
        { id: "orcamentos", name: "Orçamentos", type: "list", entity: "pedidos" },
        { id: "pedidos", name: "Pedidos de Venda", type: "list", entity: "pedidos" },
        { id: "clientes", name: "Carteira de Clientes", type: "list", entity: "clientes" }
      ]
    },
    {
      id: 2, name: "Catálogo", icon: "Package", order: 2, pages: [
        { id: "produtos", name: "Produtos e Estoque", type: "list", entity: "produtos" },
        { id: "fornecedores", name: "Fornecedores", type: "list", entity: "fornecedores" }
      ]
    }
  ],
  tables: [
    { id: 1, name: "pedidos" }, { id: 2, name: "produtos" }, { id: 3, name: "clientes" }, { id: 4, name: "fornecedores" }
  ]
};

// 2. FUNÇÕES DO BANCO DE DADOS (LocalStorage)
const loadDB = () => {
  const local = localStorage.getItem('MOCK_DB_V1');
  if (!local) {
    localStorage.setItem('MOCK_DB_V1', JSON.stringify(INITIAL_DB));
    return JSON.parse(JSON.stringify(INITIAL_DB));
  }
  return JSON.parse(local);
};

const saveDB = (db) => {
  localStorage.setItem('MOCK_DB_V1', JSON.stringify(db));
};

export const resetMockDB = () => {
  localStorage.setItem('MOCK_DB_V1', JSON.stringify(INITIAL_DB));
  window.location.reload();
};

// 3. LÓGICA DE NEGÓCIO
export const mockEngine = {
  login: (username, password) => {
    const db = loadDB();
    if (username === db.auth.user && password === db.auth.pass) {
      return { success: true, token: db.auth.token, user: { id: 1, name: "Administrador Compasso", role: "admin", email: "admin@compasso.com" } };
    }
    return { success: false };
  },

  // --- BUSINESS LOGIC & HELPERS ---

  enrichData: (collection, item) => {
    if (!item) return item;

    // Colunas Virtuais: Produtos
    if (collection === 'produtos') {
      item.Status_Estoque = (item.Estoque_Atual <= item.Estoque_Minimo) ? "Crítico" : "Normal";
    }

    // Colunas Virtuais: Pedidos
    if (collection === 'pedidos') {
      // Total Final (Simulação)
      item.Total_Final = item.Total_Final || (Math.random() * 5000 + 100).toFixed(2);

      // Fase Funil (Simulação baseada no Status)
      if (['Rascunho', 'Em Negociacao'].includes(item.Status)) item.Fase_Funil = 'Orcamento';
      else if (['Aguardando Aprovação', 'Aprovado', 'Em Separação'].includes(item.Status)) item.Fase_Funil = 'Venda';
      else if (['Cancelado'].includes(item.Status)) item.Fase_Funil = 'Perdido';
      else item.Fase_Funil = 'Entrega';
    }

    // Colunas Virtuais: Clientes
    if (collection === 'clientes') {
      // Simular Dias sem Compra
      const lastBuy = new Date(item.Data_Ultima_Compra || '2023-01-01');
      const diffTime = Math.abs(Date.now() - lastBuy);
      item.Dias_Sem_Compra = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return item;
  },

  list: (collection) => {
    const db = loadDB();
    const list = db[collection] || [];
    return list.map(item => mockEngine.enrichData(collection, item));
  },

  getById: (collection, id) => {
    const db = loadDB();
    const table = db[collection] || [];
    const item = table.find(item => item.id == id);
    return item ? mockEngine.enrichData(collection, item) : null;
  },

  create: (collection, item) => {
    const db = loadDB();
    const table = db[collection] || [];
    const newItem = { ...item, id: Date.now() };

    // W01: Alçada de Aprovação
    if (collection === 'pedidos') {
      const total = newItem.Total_Final || 1000;
      const desconto = newItem.Valor_Desconto || 0;
      // Se desconto > 15%, status = Aguardando
      if (total > 0 && desconto > (total * 0.15)) {
        newItem.Status = 'Aguardando Aprovação';
        alert("⚠️ ALERTA: Desconto excedeu 15%. Pedido enviado para aprovação.");
      } else if (!newItem.Status) {
        newItem.Status = 'Em Negociacao';
      }
    }

    table.push(newItem);
    db[collection] = table;
    saveDB(db);
    return mockEngine.enrichData(collection, newItem);
  },

  update: (collection, id, updates) => {
    const db = loadDB();
    const table = db[collection] || [];
    const index = table.findIndex(i => i.id == id);

    if (index > -1) {
      const oldItem = table[index];
      const newItem = { ...oldItem, ...updates };

      // W03: Baixa de Estoque ao Aprovar
      if (collection === 'pedidos' && updates.Status === 'Aprovado' && oldItem.Status !== 'Aprovado') {
        alert("✅ PEDIDO APROVADO! Estoque baixado automaticamente.");
        // Em um mock mais complexo, aqui iteraríamos sobre 'itens_pedido' para baixar 'produtos'
      }

      table[index] = newItem;
      db[collection] = table;
      saveDB(db);
      return mockEngine.enrichData(collection, newItem);
    }
    return null;
  },

  delete: (collection, id) => {
    const db = loadDB();
    const table = db[collection] || [];
    const index = table.findIndex(i => i.id == id);
    if (index > -1) {
      table.splice(index, 1);
      db[collection] = table;
      saveDB(db);
      return true;
    }
    return false;
  },

  // Helpers
  getMetrics: () => {
    const db = loadDB();
    return {
      faturamento_mensal: 45000,
      vendas_mes: 15,
      orcamentos_abertos: 5,
      produtos_criticos: 2,
      top_clientes: db.clientes.slice(0, 5),
      pedidos_dia: [10, 5, 8, 20, 15]
    };
  },

  getOrcamentos: () => mockEngine.list('pedidos').filter(p => p.Fase_Funil === 'Orcamento'),
  getPedidosVenda: () => mockEngine.list('pedidos').filter(p => p.Fase_Funil === 'Venda'),
  getNavigation: () => loadDB().navigation_groups || [],
  getTables: () => loadDB().tables || []
};
