// frontend-web/src/api/mockEngine.js
// SISTEMA MOCK COMPASSO V1 - STANDALONE
// Dados e Lógica baseados no Checklist de Execução V1

// 1. DADOS INICIAIS
const INITIAL_DB = {
  auth: { user: 'compasso', pass: '123456', token: 'fake-jwt-token-compasso-999' },
  
  fornecedores: [
    { id: 1, Razao_Social: "Madeiras do Sul Ltda", CNPJ: "12.345.678/0001-90", Logo: null, Ativo: true, Contato_Comercial: "João Silva" },
    { id: 2, Razao_Social: "Ferragens Elite", CNPJ: "98.765.432/0001-10", Logo: null, Ativo: true, Contato_Comercial: "Maria Santos" },
    { id: 3, Razao_Social: "Colas e Adesivos BR", CNPJ: "11.222.333/0001-44", Logo: null, Ativo: true, Contato_Comercial: "Carlos Ferreira" }
  ],
  
  produtos: [
    { id: 1, Nome: "MDF Branco Tx 15mm", SKU: "MDF-BCO-15", Fornecedor_Ref: 1, Preco_Base: 150.00, Custo: 95.00, Estoque_Atual: 50, Estoque_Minimo: 10, Imagem_Produto: null, Unidade_Medida: "UN", Status_Estoque: "Normal" },
    { id: 2, Nome: "Puxador Colonial", SKU: "PUX-COL-01", Fornecedor_Ref: 2, Preco_Base: 25.00, Custo: 12.00, Estoque_Atual: 5, Estoque_Minimo: 20, Imagem_Produto: null, Unidade_Medida: "UN", Status_Estoque: "Crítico" },
    { id: 3, Nome: "Cola de Contato 5L", SKU: "COLA-5L", Fornecedor_Ref: 3, Preco_Base: 80.00, Custo: 45.00, Estoque_Atual: 100, Estoque_Minimo: 15, Imagem_Produto: null, Unidade_Medida: "L", Status_Estoque: "Normal" },
    { id: 4, Nome: "Dobradiça Slow Motion", SKU: "DOB-SM-01", Fornecedor_Ref: 2, Preco_Base: 35.00, Custo: 18.00, Estoque_Atual: 200, Estoque_Minimo: 50, Imagem_Produto: null, Unidade_Medida: "PAR", Status_Estoque: "Normal" },
    { id: 5, Nome: "Parafuso Chipboard 4x40", SKU: "PAR-CB-440", Fornecedor_Ref: 2, Preco_Base: 45.00, Custo: 22.00, Estoque_Atual: 8, Estoque_Minimo: 30, Imagem_Produto: null, Unidade_Medida: "CX", Status_Estoque: "Crítico" }
  ],
  
  regras_frete: [
    { id: 1, Estado_UF: "SP", Valor_Pedido_Minimo: 500.00, Percentual_Frete: 5 },
    { id: 2, Estado_UF: "RJ", Valor_Pedido_Minimo: 800.00, Percentual_Frete: 8 },
    { id: 3, Estado_UF: "MG", Valor_Pedido_Minimo: 600.00, Percentual_Frete: 7 },
    { id: 4, Estado_UF: "PR", Valor_Pedido_Minimo: 400.00, Percentual_Frete: 6 },
    { id: 5, Estado_UF: "RS", Valor_Pedido_Minimo: 450.00, Percentual_Frete: 6 }
  ],
  
  clientes: [
    { id: 1, Razao_Social: "Marcenaria Ouro Verde", Nome_Fantasia: "Ouro Verde Móveis", CNPJ: "44.555.666/0001-77", Ramo_Atividade: "Marcenaria", Endereco_Completo: "Rua das Madeiras, 123 - São Paulo/SP", Status_Cadastro: "Ativo", Classificacao_ABC: "A - VIP", Data_Ultima_Compra: "2024-01-10", Dias_Sem_Compra: 4 },
    { id: 2, Razao_Social: "Construtora Predial SA", Nome_Fantasia: "Predial", CNPJ: "77.888.999/0001-00", Ramo_Atividade: "Construtora", Endereco_Completo: "Av. Brasil, 4500 - Rio de Janeiro/RJ", Status_Cadastro: "Bloqueado Financeiro", Classificacao_ABC: "B - Regular", Data_Ultima_Compra: "2023-11-15", Dias_Sem_Compra: 60 },
    { id: 3, Razao_Social: "Design Interiores ME", Nome_Fantasia: "Design & Cia", CNPJ: "22.333.444/0001-55", Ramo_Atividade: "Arquiteto", Endereco_Completo: "Rua Elegância, 45 - Curitiba/PR", Status_Cadastro: "Ativo", Classificacao_ABC: "A - VIP", Data_Ultima_Compra: "2024-01-12", Dias_Sem_Compra: 2 },
    { id: 4, Razao_Social: "Revenda Sul Materiais", Nome_Fantasia: "Sul Materiais", CNPJ: "88.999.000/0001-11", Ramo_Atividade: "Revenda", Endereco_Completo: "BR-116, Km 42 - Porto Alegre/RS", Status_Cadastro: "Prospect", Classificacao_ABC: "C - Eventual", Data_Ultima_Compra: null, Dias_Sem_Compra: null }
  ],
  
  pedidos: [
    { id: 101, Numero_Controle: "ORC-2024-001", Cliente_Ref: 1, Cliente_Nome: "Marcenaria Ouro Verde", Data_Criacao: "2024-01-10", Status: "Em Negociacao", Condicao_Pagamento: "30/60 Dias", Validade_Orcamento: "2024-01-25", Valor_Desconto: 50.00, Link_NF: null, Total_Itens: 500.00, Total_Final: 450.00, Fase_Funil: "Orcamento" },
    { id: 102, Numero_Controle: "PED-2024-089", Cliente_Ref: 2, Cliente_Nome: "Construtora Predial SA", Data_Criacao: "2024-01-05", Status: "Aprovado", Condicao_Pagamento: "À Vista", Validade_Orcamento: null, Valor_Desconto: 0, Link_NF: "https://nf.example.com/89", Total_Itens: 5000.00, Total_Final: 5000.00, Fase_Funil: "Venda" },
    { id: 103, Numero_Controle: "ORC-2024-002", Cliente_Ref: 3, Cliente_Nome: "Design Interiores ME", Data_Criacao: "2024-01-12", Status: "Rascunho", Condicao_Pagamento: "30 Dias", Validade_Orcamento: "2024-01-27", Valor_Desconto: 0, Link_NF: null, Total_Itens: 1200.00, Total_Final: 1200.00, Fase_Funil: "Orcamento" },
    { id: 104, Numero_Controle: "PED-2024-090", Cliente_Ref: 1, Cliente_Nome: "Marcenaria Ouro Verde", Data_Criacao: "2024-01-08", Status: "Faturado", Condicao_Pagamento: "30/60/90 Dias", Validade_Orcamento: null, Valor_Desconto: 100.00, Link_NF: "https://nf.example.com/90", Total_Itens: 3500.00, Total_Final: 3400.00, Fase_Funil: "Venda" }
  ],
  
  itens_pedido: [
    { id: 1, Pedido_Ref: 101, Produto_Ref: 1, Produto_Nome: "MDF Branco Tx 15mm", Quantidade: 3, Preco_Praticado: 150.00, Subtotal: 450.00 },
    { id: 2, Pedido_Ref: 101, Produto_Ref: 2, Produto_Nome: "Puxador Colonial", Quantidade: 2, Preco_Praticado: 25.00, Subtotal: 50.00 },
    { id: 3, Pedido_Ref: 102, Produto_Ref: 1, Produto_Nome: "MDF Branco Tx 15mm", Quantidade: 30, Preco_Praticado: 145.00, Subtotal: 4350.00 },
    { id: 4, Pedido_Ref: 102, Produto_Ref: 4, Produto_Nome: "Dobradiça Slow Motion", Quantidade: 50, Preco_Praticado: 13.00, Subtotal: 650.00 }
  ],
  
  campanhas: [
    { id: 1, Nome_Campanha: "Promoção de Janeiro", Data_Inicio: "2024-01-01", Data_Fim: "2024-01-31", Tipo_Desconto: "Percentual", Valor_Desconto: 10, Ativa_Hoje: true },
    { id: 2, Nome_Campanha: "Frete Grátis Sul", Data_Inicio: "2024-01-15", Data_Fim: "2024-02-15", Tipo_Desconto: "Valor Fixo", Valor_Desconto: 150, Ativa_Hoje: false }
  ],
  
  interacoes: [
    { id: 1, Cliente_Ref: 1, Cliente_Nome: "Marcenaria Ouro Verde", Data_Hora: "2024-01-10T14:30:00", Tipo: "Visita Presencial", Resumo: "Visita para apresentação de novos produtos MDF. Cliente interessado em lote grande para projeto de cozinhas." },
    { id: 2, Cliente_Ref: 2, Cliente_Nome: "Construtora Predial SA", Data_Hora: "2024-01-08T10:00:00", Tipo: "Ligação", Resumo: "Cobrança de pagamento em atraso. Cliente solicita prazo de 15 dias para regularização." },
    { id: 3, Cliente_Ref: 3, Cliente_Nome: "Design Interiores ME", Data_Hora: "2024-01-12T16:45:00", Tipo: "WhatsApp", Resumo: "Envio de catálogo atualizado. Cliente pediu orçamento para projeto residencial." }
  ],
  
  tarefas: [
    { id: 1, Titulo: "Ligar para Marcenaria Ouro Verde", Cliente_Vinculado: 1, Cliente_Nome: "Marcenaria Ouro Verde", Prioridade: "Alta", Prazo: "2024-01-15", Status: "Pendente" },
    { id: 2, Titulo: "Enviar proposta Design Interiores", Cliente_Vinculado: 3, Cliente_Nome: "Design Interiores ME", Prioridade: "Média", Prazo: "2024-01-16", Status: "Em Andamento" },
    { id: 3, Titulo: "Cobrar pagamento Construtora", Cliente_Vinculado: 2, Cliente_Nome: "Construtora Predial SA", Prioridade: "Alta", Prazo: "2024-01-14", Status: "Pendente" },
    { id: 4, Titulo: "Atualizar cadastro fornecedores", Cliente_Vinculado: null, Cliente_Nome: null, Prioridade: "Baixa", Prazo: "2024-01-20", Status: "Pendente" }
  ]
};

// 2. FUNÇÕES BASE
const loadDB = () => {
  try {
    // Pode mudar a chave para limpar cache antigo
    const local = localStorage.getItem('MOCK_DB_COMPASSO_V1_REV1');
    if (!local) {
      localStorage.setItem('MOCK_DB_COMPASSO_V1_REV1', JSON.stringify(INITIAL_DB));
      return JSON.parse(JSON.stringify(INITIAL_DB));
    }
    return JSON.parse(local);
  } catch (e) {
    console.error('[MOCK] Erro ao carregar DB:', e);
    return JSON.parse(JSON.stringify(INITIAL_DB));
  }
};

const saveDB = (db) => {
  try {
    localStorage.setItem('MOCK_DB_COMPASSO_V1_REV1', JSON.stringify(db));
  } catch (e) {
    console.error('[MOCK] Erro ao salvar DB:', e);
  }
};

export const resetMockDB = () => {
  localStorage.setItem('MOCK_DB_COMPASSO_V1_REV1', JSON.stringify(INITIAL_DB));
  console.log('[MOCK] DB Resetado!');
  window.location.reload();
};

// 3. ENGINE LÓGICA
export const mockEngine = {
  // Autenticação
  login: (u, p) => {
    const db = loadDB();
    if (u === db.auth.user && p === db.auth.pass) {
      return { 
        success: true, 
        token: db.auth.token, 
        user: { id: 1, name: "Administrador Compasso", email: "admin@compasso.com", role: "admin", tenant_id: 1 } 
      };
    }
    return { success: false };
  },

  // CRUD Genérico
  list: (collection) => {
    const db = loadDB();
    return db[collection] || [];
  },

  getById: (collection, id) => {
    const db = loadDB();
    const table = db[collection] || [];
    return table.find(item => item.id == id) || null; // Loose equality for string/number
  },

  create: (collection, item) => {
    const db = loadDB();
    const table = db[collection] || [];
    const newItem = { ...item, id: Date.now() }; // ID numérico seq
    
    // --- WORKFLOWS AO CRIAR ---
    
    // Produtos: Status Estoque Inicial
    if (collection === 'produtos') {
      const atual = Number(newItem.Estoque_Atual || 0);
      const min = Number(newItem.Estoque_Minimo || 0);
      newItem.Status_Estoque = atual <= min ? "Crítico" : "Normal";
    }

    // Pedidos: Definição Inicial
    if (collection === 'pedidos') {
      newItem.Data_Criacao = new Date().toISOString().split('T')[0];
      newItem.Status = newItem.Status || 'Rascunho';
      
      // Funil
      const isOrcamento = ['Rascunho', 'Em Negociacao', 'Aguardando Aprovação'].includes(newItem.Status);
      newItem.Fase_Funil = isOrcamento ? 'Orcamento' : 'Venda';
      
      // Número Controle
      const prefix = isOrcamento ? 'ORC' : 'PED';
      const year = new Date().getFullYear();
      const count = table.filter(t => t.Fase_Funil === newItem.Fase_Funil).length + 1;
      newItem.Numero_Controle = `${prefix}-${year}-${String(count).padStart(3, '0')}`;
    }

    // Itens Pedido: Recalcular Pai
    if (collection === 'itens_pedido') {
      newItem.Subtotal = (newItem.Quantidade || 1) * (newItem.Preco_Praticado || 0);
      // Precisa atualizar o pedido pai... mas create é sync. Vamos tentar atualizar DB.
      // Complexo em single pass, mas OK.
    }

    table.push(newItem);
    db[collection] = table;
    saveDB(db);
    
    // Pós-Criação: Trigger de Totalização
    if (collection === 'itens_pedido') {
      recalcularPedido(newItem.Pedido_Ref);
    }

    return newItem;
  },

  update: (collection, id, updates) => {
    const db = loadDB();
    const table = db[collection] || [];
    const index = table.findIndex(i => i.id == id);
    
    if (index > -1) {
      const oldItem = table[index];
      const updatedItem = { ...oldItem, ...updates };

      // --- WORKFLOWS AO ATUALIZAR ---

      // W01: Alçada Aprovação
      if (collection === 'pedidos') {
        const total = updatedItem.Total_Itens || 0;
        const desconto = updatedItem.Valor_Desconto || 0;
        
        // Se ainda é orçamento e tem desconto agressivo
        if (updatedItem.Fase_Funil === 'Orcamento' && desconto > (total * 0.15)) {
           if (updatedItem.Status !== 'Aguardando Aprovação') {
             updatedItem.Status = 'Aguardando Aprovação';
             alert("⚠️ Orçamento retido para aprovação (Desconto > 15%)");
           }
        }

        // W02: Expirado (Manual trigger simulado) - Se mudar validade e for < hoje
        if (updatedItem.Validade_Orcamento && new Date(updatedItem.Validade_Orcamento) < new Date()) {
          updatedItem.Status = 'Cancelado'; // Simplificado
        }

        // W03: Venda Aprovada (Baixa Estoque)
        // Se mudou de status PRE-Venda para Venda 'Aprovado'
        if (updates.Status === 'Aprovado' && oldItem.Status !== 'Aprovado') {
           processarVendaAprovada(updatedItem.id);
           alert("✅ Venda Aprovada! Estoque atualizado.");
        }
      }

      // Produtos: Recalcular Status Estoque
      if (collection === 'produtos') {
         const atual = updatedItem.Estoque_Atual;
         const min = updatedItem.Estoque_Minimo;
         updatedItem.Status_Estoque = atual <= min ? "Crítico" : "Normal";
      }

      table[index] = updatedItem;
      db[collection] = table;
      saveDB(db);
      return updatedItem;
    }
    return null;
  },

  delete: (collection, id) => {
    const db = loadDB();
    const table = db[collection] || [];
    const index = table.findIndex(i => i.id == id);
    
    if (index > -1) {
      // Se deletar item, recalcular pedido
      if (collection === 'itens_pedido') {
        const item = table[index];
        table.splice(index, 1);
        db[collection] = table;
        saveDB(db);
        recalcularPedido(item.Pedido_Ref);
        return true;
      }

      table.splice(index, 1);
      db[collection] = table;
      saveDB(db);
      return true;
    }
    return false;
  },

  // Helpers Específicos
  getOrcamentos: () => mockEngine.list('pedidos').filter(p => ['Rascunho', 'Em Negociacao', 'Aguardando Aprovação'].includes(p.Status)),
  getPedidosVenda: () => mockEngine.list('pedidos').filter(p => !['Rascunho', 'Em Negociacao', 'Aguardando Aprovação'].includes(p.Status)),
  getTarefasPendentes: () => mockEngine.list('tarefas').filter(t => t.Status !== 'Concluído' && t.Status !== 'Cancelado'),
  
  // Dashboard Metrics
  getMetrics: () => {
    const db = loadDB();
    const pedidos = db.pedidos || [];
    const vendas = pedidos.filter(p => p.Fase_Funil === 'Venda');
    const faturamento = vendas.reduce((acc, v) => acc + (v.Total_Final || 0), 0);
    
    return {
       faturamento_mensal: faturamento,
       crescimento: 12.5, // Fake
       ticket_medio: vendas.length ? faturamento / vendas.length : 0,
       pedidos_dia: [12, 19, 3, 5, 2, 30], // Fake
       top_clientes: db.clientes.slice(0, 5), // Fake top
    };
  }
};

// --- FUNÇÕES DE LÓGICA (INTERNAS) ---

function recalcularPedido(pedidoId) {
  const db = loadDB();
  const itens = (db.itens_pedido || []).filter(i => i.Pedido_Ref == pedidoId);
  const pedidoIndex = (db.pedidos || []).findIndex(p => p.id == pedidoId);
  
  if (pedidoIndex > -1) {
    const totalItens = itens.reduce((acc, item) => acc + (item.Subtotal || 0), 0);
    const pedido = db.pedidos[pedidoIndex];
    pedido.Total_Itens = totalItens;
    pedido.Total_Final = Math.max(0, totalItens - (pedido.Valor_Desconto || 0));
    
    // Salvar
    saveDB(db);
  }
}

function processarVendaAprovada(pedidoId) {
  const db = loadDB();
  const itens = (db.itens_pedido || []).filter(i => i.Pedido_Ref == pedidoId);
  
  // 1. Baixar Estoque
  itens.forEach(item => {
    const prodIndex = db.produtos.findIndex(p => p.id == item.Produto_Ref);
    if (prodIndex > -1) {
      db.produtos[prodIndex].Estoque_Atual -= (item.Quantidade || 0);
      // Recalc Status
      const p = db.produtos[prodIndex];
      p.Status_Estoque = p.Estoque_Atual <= p.Estoque_Minimo ? "Crítico" : "Normal";
    }
  });

  // 2. Atualizar Cliente (Última Compra)
  const pedido = db.pedidos.find(p => p.id == pedidoId);
  if (pedido && pedido.Cliente_Ref) {
    const cliIndex = db.clientes.findIndex(c => c.id == pedido.Cliente_Ref);
    if (cliIndex > -1) {
      db.clientes[cliIndex].Data_Ultima_Compra = new Date().toISOString().split('T')[0];
      // Dias sem compra virtual calcula no display
    }
  }

  saveDB(db);
}
