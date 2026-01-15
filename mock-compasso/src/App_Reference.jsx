import React, { useState } from 'react';
import {
  LayoutDashboard, Users, ShoppingCart, FileText,
  CheckSquare, Package, Bell, Search, Plus,
  Briefcase, Database, AlertCircle, Truck, DollarSign,
  X, Check, Tag, ChevronRight, CreditCard, User, MoreHorizontal, ArrowUpRight
} from 'lucide-react';

// --- MOCK DATABASE ---
const DB = {
  clients: [
    { id: 1, name: 'Supermercado Modelo', cnpj: '12.345.678/0001-90', email: 'compras@modelo.com', status: 'Ativo', segment: 'Varejo', seller: 'Pedro', limit: 50000, used: 12500, history: ['Orçamento #9001 criado', 'Visita agendada 15/01'] },
    { id: 2, name: 'Construções Silva', cnpj: '98.765.432/0001-10', email: 'eng@silva.com', status: 'Ativo', segment: 'Construção', seller: 'Pedro', limit: 120000, used: 80000, history: ['Pedido #102 faturado'] },
    { id: 3, name: 'Padaria do João', cnpj: '11.111.222/0001-33', email: 'joao@padaria.com', status: 'Inativo', segment: 'Varejo', seller: 'Pedro', limit: 5000, used: 0, history: [] },
    { id: 4, name: 'Tech Solutions', cnpj: '33.444.555/0001-22', email: 'ti@techsol.com', status: 'Ativo', segment: 'Serviços', seller: 'Pedro', limit: 25000, used: 5000, history: ['Cadastro realizado'] },
  ],
  products: [
    { id: 101, code: 'CIM-001', name: 'Cimento CP II 50kg', brand: 'Votoran', group: 'Básico', stock: 500, price: 32.90, details: 'Resistente a sulfatos. Pallet 40 sacos.' },
    { id: 102, code: 'ARG-002', name: 'Argamassa ACIII 20kg', brand: 'Quartzolit', group: 'Básico', stock: 120, price: 45.50, details: 'Piso sobre piso.' },
    { id: 103, code: 'TIN-005', name: 'Tinta Acrílica 18L', brand: 'Suvinil', group: 'Acabamento', stock: 45, price: 380.00, details: 'Rendimento 300m².' },
    { id: 104, code: 'PIS-010', name: 'Porcelanato 60x60', brand: 'Portinari', group: 'Acabamento', stock: 0, price: 89.90, details: 'Estoque zerado.' },
  ],
  quotes: [
    { id: 9001, clientId: 1, clientName: 'Supermercado Modelo', date: '14/01/26', total: 4500.00, status: 'Aberto', items: [{ name: 'Cimento CP II', qty: 50, price: 32.90 }, { name: 'Argamassa ACIII', qty: 20, price: 45.50 }] },
    { id: 9002, clientId: 2, clientName: 'Construções Silva', date: '12/01/26', total: 12800.00, status: 'Aprovado', items: [{ name: 'Porcelanato', qty: 100, price: 89.90 }] },
  ],
  orders: [
    { id: 5001, clientId: 1, clientName: 'Supermercado Modelo', date: '10/01/26', total: 12500.00, status: 'Faturado', items: [{ name: 'Cimento CP II', qty: 200, price: 32.90 }] },
    { id: 5002, clientId: 2, clientName: 'Construções Silva', date: '11/01/26', total: 3200.00, status: 'Separação', items: [{ name: 'Tubo PVC', qty: 100, price: 28.90 }] },
  ],
  tasks: [
    { id: 1, title: 'Validar entrega #5002', client: 'Construções Silva', type: 'Checklist', status: 'Pendente', date: 'Hoje' },
    { id: 2, title: 'Enviar tabela atualizada', client: 'Supermercado Modelo', type: 'Email', status: 'Feito', date: 'Ontem' },
    { id: 3, title: 'Cobrar boleto vencido', client: 'Padaria do João', type: 'Ligação', status: 'Pendente', date: 'Amanhã' },
  ],
  campaigns: [
    { id: 1, name: 'Verão de Ofertas', type: 'Desconto %', value: '10%', target: 'Tintas', status: 'Ativa', valid: '28/02' },
    { id: 2, name: 'Queima de Estoque', type: 'Preço Fixo', value: 'Tabela B', target: 'Pisos', status: 'Ativa', valid: '31/01' },
  ]
};

// --- CONFIGURAÇÃO VISUAL ---
const NAV = {
  vendas: {
    label: 'Vendas', icon: Briefcase,
    pages: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'contas', label: 'Contas', icon: Users },
      { id: 'orcamentos', label: 'Orçamentos', icon: FileText },
      { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
      { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
    ]
  },
  cadastros: {
    label: 'Cadastros', icon: Database,
    pages: [
      { id: 'produtos', label: 'Produtos', icon: Package },
      { id: 'fretes', label: 'Fretes', icon: Truck },
      { id: 'campanhas', label: 'Campanhas', icon: Tag },
    ]
  }
};

const Badge = ({ status }) => {
  const map = {
    'Ativo': 'bg-emerald-100 text-emerald-800 border-emerald-200', 'Ativa': 'bg-emerald-100 text-emerald-800 border-emerald-200', 'Aprovado': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Faturado': 'bg-blue-100 text-blue-800 border-blue-200', 'Aberto': 'bg-sky-100 text-sky-800 border-sky-200',
    'Inativo': 'bg-rose-100 text-rose-800 border-rose-200', 'Pendente': 'bg-amber-100 text-amber-800 border-amber-200',
    'Feito': 'bg-slate-100 text-slate-500 decoration-line-through border-slate-200', 'Separação': 'bg-purple-100 text-purple-800 border-purple-200'
  };
  return <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider rounded-sm ${map[status] || 'bg-gray-100 border-gray-200'}`}>{status}</span>;
};

// --- HOOK DE PERSISTÊNCIA DE ABAS ---
const useTabSystem = (initial = []) => {
  const [tabs, setTabs] = useState(initial);
  const [activeId, setActiveId] = useState('list');

  const open = (item) => {
    if (!tabs.find(t => t.id === item.id)) setTabs([...tabs, item]);
    setActiveId(item.id);
  };
  const close = (id) => {
    const remaining = tabs.filter(t => t.id !== id);
    setTabs(remaining);
    if (activeId === id) setActiveId(remaining.length > 0 ? remaining[remaining.length - 1].id : 'list');
  };
  return { tabs, activeId, setActiveId, open, close };
};

// --- MÓDULO PADRÃO (LISTA + ABAS) ---
const StandardModule = ({ title, data, columns, renderRow, renderDetail, newItemLabel, tabState }) => {
  const { tabs, activeId, setActiveId, open, close } = tabState;
  const activeItem = tabs.find(t => t.id === activeId);

  return (
    <div className="flex flex-col h-full bg-white animate-fade-in">
      {/* Barra de Abas */}
      <div className="flex items-end px-2 border-b border-gray-300 bg-[#f3f4f6] h-10 gap-1 overflow-x-auto no-scrollbar">
        <div onClick={() => setActiveId('list')} className={`cursor-pointer px-4 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide border-t border-l border-r border-gray-300 rounded-t-sm ${activeId === 'list' ? 'bg-white border-b-white translate-y-[1px]' : 'bg-gray-100 hover:bg-gray-200'}`}>Lista de {title}</div>
        {tabs.map(tab => (
          <div key={tab.id} onClick={() => setActiveId(tab.id)} className={`cursor-pointer pl-3 pr-2 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide border-t border-l border-r border-gray-300 rounded-t-sm flex items-center gap-2 max-w-[200px] ${activeId === tab.id ? 'bg-white border-b-white translate-y-[1px]' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <span className="truncate">{tab.name || tab.clientName || tab.code}</span>
            <button onClick={(e) => { e.stopPropagation(); close(tab.id); }} className="hover:bg-red-100 hover:text-red-600 rounded-sm p-0.5"><X className="w-3 h-3" /></button>
          </div>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-hidden relative">
        {activeId === 'list' ? (
          <div className="p-4 h-full overflow-y-auto bg-white">
            <div className="flex justify-between mb-4 items-center bg-gray-50 p-2 border border-gray-200 rounded-sm">
              <div className="relative"><Search className="absolute left-3 top-2 w-4 h-4 text-gray-400" /><input className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-sm text-sm w-64 focus:ring-1 focus:ring-blue-600 outline-none" placeholder="Pesquisar..." /></div>
              {newItemLabel && <button className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 rounded-sm text-sm font-medium flex items-center gap-2 shadow-sm"><Plus className="w-4 h-4" /> {newItemLabel}</button>}
            </div>
            <div className="border border-gray-300 rounded-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-300 text-xs uppercase">
                  <tr>{columns.map((c, i) => <th key={i} className="p-3">{c}</th>)}<th className="p-3"></th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((item, idx) => (
                    <tr key={idx} onClick={() => open(item)} className="hover:bg-blue-50 cursor-pointer transition-colors group">
                      {renderRow(item)}
                      <td className="p-3 text-right"><ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 inline" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (activeItem ? renderDetail(activeItem) : <div className="p-10 text-center text-gray-400">Item fechado ou removido.</div>)}
      </div>
    </div>
  );
};

// --- COMPONENTE MESTRE-DETALHE (30/70) ---
const MasterDetailView = ({ item, summary, tabs }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].label);
  return (
    <div className="flex h-full bg-white animate-fade-in">
      <div className="w-[30%] min-w-[300px] border-r border-gray-300 bg-gray-50 h-full overflow-y-auto relative">{summary(item)}</div>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        <div className="flex border-b border-gray-300 px-4 pt-2 bg-gray-50">
          {tabs.map(t => (
            <button key={t.label} onClick={() => setActiveTab(t.label)} className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === t.label ? 'border-blue-600 text-blue-700 bg-white rounded-t-sm' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>{t.label}</button>
          ))}
        </div>
        <div className="p-6 flex-1 overflow-y-auto">{tabs.find(t => t.label === activeTab)?.content(item)}</div>
      </div>
    </div>
  );
};

// --- CONTEÚDO DOS MÓDULOS ---
const RenderClients = (tabState) => (
  <StandardModule title="Contas" data={DB.clients} newItemLabel="Nova Conta" columns={['Razão Social', 'CNPJ', 'Segmento', 'Status']} tabState={tabState}
    renderRow={(c) => <><td className="p-3 font-medium text-blue-700">{c.name}</td><td className="p-3 text-gray-600">{c.cnpj}</td><td className="p-3 text-gray-600">{c.segment}</td><td className="p-3"><Badge status={c.status} /></td></>}
    renderDetail={(c) => (
      <MasterDetailView item={c}
        summary={(i) => (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 mb-4"><div className="w-14 h-14 bg-blue-700 rounded-sm flex items-center justify-center text-white text-xl font-bold shadow-sm">{i.name.substring(0, 2).toUpperCase()}</div><div><h2 className="text-lg font-bold text-gray-800 leading-tight">{i.name}</h2><p className="text-xs text-gray-500 mt-1 uppercase">Cliente</p></div></div>
            <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm space-y-2 text-sm"><div><span className="text-xs text-gray-500 block">CNPJ</span>{i.cnpj}</div><div><span className="text-xs text-gray-500 block">Email</span><span className="text-blue-600">{i.email}</span></div><div><span className="text-xs text-gray-500 block">Vendedor</span>{i.seller}</div><div className="pt-2"><Badge status={i.status} /></div></div>
            <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm"><div className="flex justify-between text-xs mb-1"><span>Crédito</span><span className="font-bold">25%</span></div><div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-2"><div className="h-full bg-blue-600" style={{ width: '25%' }} /></div><p className="text-xs text-gray-500 text-center">Disp: R$ {(i.limit - i.used).toLocaleString()}</p></div>
          </div>
        )}
        tabs={[
          { label: 'Visão 360', content: () => <div className="grid grid-cols-2 gap-6"><div className="border border-gray-200 rounded-sm p-4"><h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Truck className="w-4 h-4" /> Logística</h3><p className="text-sm text-gray-600">Frete CIF padrão. Horário comercial.</p></div><div className="border border-gray-200 rounded-sm p-4"><h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Pagamento</h3><p className="text-sm text-gray-600">Boleto 28 DDL. Tabela Ouro.</p></div></div> },
          { label: 'Histórico', content: (i) => <div className="space-y-4">{i.history.map((h, k) => <div key={k} className="flex gap-3 text-sm text-gray-600"><div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5" />{h}</div>)}</div> }
        ]}
      />
    )}
  />
);

const RenderQuotes = (tabState) => (
  <StandardModule title="Orçamentos" data={DB.quotes} newItemLabel="Novo Orçamento" columns={['ID', 'Cliente', 'Data', 'Total', 'Status']} tabState={tabState}
    renderRow={(q) => <><td className="p-3 font-medium text-blue-700">#{q.id}</td><td className="p-3 text-gray-600">{q.clientName}</td><td className="p-3 text-gray-600">{q.date}</td><td className="p-3 font-bold text-gray-700">R$ {q.total.toLocaleString()}</td><td className="p-3"><Badge status={q.status} /></td></>}
    renderDetail={(q) => (
      <MasterDetailView item={q}
        summary={(i) => (
          <div className="p-6 space-y-6">
            <div className="border-b border-gray-200 pb-4"><h2 className="text-xl font-bold text-gray-800">Orçamento #{i.id}</h2><p className="text-sm text-blue-600 font-medium">{i.clientName}</p></div>
            <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm"><div className="mb-2"><span className="text-xs text-gray-500 block">Total</span><span className="text-2xl font-bold text-gray-800">R$ {i.total.toLocaleString()}</span></div><Badge status={i.status} /></div>
            <button className="w-full bg-blue-700 text-white py-2 rounded-sm text-sm font-bold hover:bg-blue-800">Aprovar Orçamento</button>
          </div>
        )}
        tabs={[
          { label: 'Itens', content: (i) => <table className="w-full text-sm text-left border border-gray-200"><thead className="bg-gray-50 text-gray-600 text-xs uppercase"><tr><th className="p-3">Produto</th><th className="p-3 text-right">Qtd</th><th className="p-3 text-right">Total</th></tr></thead><tbody>{i.items.map((it, k) => <tr key={k}><td className="p-3">{it.name}</td><td className="p-3 text-right">{it.qty}</td><td className="p-3 text-right">R$ {(it.qty * it.price).toFixed(2)}</td></tr>)}</tbody></table> }
        ]}
      />
    )}
  />
);

const RenderOrders = (tabState) => (
  <StandardModule title="Pedidos" data={DB.orders} newItemLabel="Novo Pedido" columns={['ID', 'Cliente', 'Data', 'Total', 'Status']} tabState={tabState}
    renderRow={(o) => <><td className="p-3 font-medium text-blue-700">#{o.id}</td><td className="p-3 text-gray-600">{o.clientName}</td><td className="p-3 text-gray-600">{o.date}</td><td className="p-3 font-bold text-gray-700">R$ {o.total.toLocaleString()}</td><td className="p-3"><Badge status={o.status} /></td></>}
    renderDetail={(o) => (
      <MasterDetailView item={o}
        summary={(i) => (
          <div className="p-6 space-y-6">
            <div className="border-b border-gray-200 pb-4"><h2 className="text-xl font-bold text-gray-800">Pedido #{i.id}</h2><p className="text-sm text-blue-600 font-medium">{i.clientName}</p></div>
            <div className="bg-white p-4 rounded-sm border border-gray-200 shadow-sm"><div className="mb-2"><span className="text-xs text-gray-500 block">Total</span><span className="text-2xl font-bold text-gray-800">R$ {i.total.toLocaleString()}</span></div><Badge status={i.status} /></div>
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-sm"><div className="flex gap-2 items-start"><Truck className="w-4 h-4 text-blue-600 mt-0.5" /><div><p className="text-xs font-bold text-blue-800">Previsão</p><p className="text-xs text-blue-600">18/01 via Transportadora</p></div></div></div>
          </div>
        )}
        tabs={[{ label: 'Itens', content: (i) => <table className="w-full text-sm text-left border border-gray-200"><thead className="bg-gray-50 text-gray-600 text-xs uppercase"><tr><th className="p-3">Produto</th><th className="p-3 text-right">Qtd</th><th className="p-3 text-right">Total</th></tr></thead><tbody>{i.items.map((it, k) => <tr key={k}><td className="p-3">{it.name}</td><td className="p-3 text-right">{it.qty}</td><td className="p-3 text-right">R$ {(it.qty * it.price).toFixed(2)}</td></tr>)}</tbody></table> }]}
      />
    )}
  />
);

const RenderProducts = (tabState) => (
  <StandardModule title="Catálogo" data={DB.products} newItemLabel="Adicionar" columns={['Código', 'Nome', 'Marca', 'Estoque', 'Preço']} tabState={tabState}
    renderRow={(p) => <><td className="p-3 text-gray-500 font-mono text-xs">{p.code}</td><td className="p-3 font-medium text-gray-800">{p.name}</td><td className="p-3 text-gray-600">{p.brand}</td><td className="p-3 font-bold">{p.stock}</td><td className="p-3 text-right">R$ {p.price.toFixed(2)}</td></>}
    renderDetail={(p) => (
      <div className="flex h-full bg-gray-50 p-8 justify-center animate-fade-in"><div className="bg-white max-w-2xl w-full rounded-sm shadow-sm border border-gray-200 p-8 h-fit">
        <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6"><div className="flex gap-6"><div className="w-24 h-24 bg-gray-100 rounded-sm flex items-center justify-center border border-gray-200"><Package className="w-10 h-10 text-gray-300" /></div><div><h2 className="text-2xl font-bold text-gray-800">{p.name}</h2><p className="text-sm text-gray-500 font-mono mt-1">{p.code} • {p.brand}</p><div className="flex gap-2 mt-3"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-sm text-xs font-bold uppercase">{p.group}</span></div></div></div><div className="text-right"><p className="text-sm text-gray-500">Preço Base</p><p className="text-3xl font-bold text-gray-800">R$ {p.price.toFixed(2)}</p></div></div>
        <div className="grid grid-cols-2 gap-8"><div><h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Estoque</h4><div className="bg-gray-50 p-4 rounded-sm border border-gray-200"><div className="flex justify-between mb-2"><span className="text-sm text-gray-600">Disponível</span><span className="font-bold text-gray-800">{p.stock}</span></div></div></div><div><h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Detalhes</h4><p className="text-sm text-gray-600 leading-relaxed">{p.details}</p></div></div>
      </div></div>
    )}
  />
);

const RenderTasks = () => (
  <div className="bg-white h-full flex flex-col"><div className="px-6 py-4 border-b border-gray-200 bg-gray-50"><h2 className="text-lg font-bold text-gray-800">Minhas Tarefas</h2></div><div className="p-6 max-w-4xl mx-auto w-full flex-1 overflow-y-auto space-y-2">{DB.tasks.map((t, i) => (<div key={i} className="flex items-center p-3 border rounded-sm bg-white border-gray-300 shadow-sm"><div className={`w-5 h-5 rounded-sm border mr-3 flex items-center justify-center ${t.status === 'Feito' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-400'}`}>{t.status === 'Feito' && <Check className="w-3 h-3" />}</div><div className="flex-1"><span className={`text-sm font-medium ${t.status === 'Feito' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{t.title}</span><span className="ml-2 text-xs text-gray-400">({t.client})</span></div><span className="text-xs font-mono text-gray-400">{t.date}</span></div>))}</div></div>
);

const RenderDashboard = () => (
  <div className="p-6 h-full overflow-y-auto bg-gray-50"><div className="grid grid-cols-4 gap-4 mb-6">{[{ l: 'Vendas', v: 'R$ 450k', c: 'text-blue-600' }, { l: 'Meta', v: '82%', c: 'text-emerald-600' }, { l: 'Pedidos', v: '24', c: 'text-gray-800' }, { l: 'Orçamentos', v: '12', c: 'text-orange-600' }].map((k, i) => <div key={i} className="bg-white p-4 rounded-sm shadow-sm border border-gray-200"><p className="text-xs text-gray-500 font-bold uppercase mb-1">{k.l}</p><p className={`text-2xl font-bold ${k.c}`}>{k.v}</p></div>)}</div><div className="grid grid-cols-3 gap-4 h-96"><div className="bg-white p-5 rounded-sm shadow-sm border border-gray-200 col-span-2"><h3 className="font-bold text-gray-700 mb-6 text-sm uppercase tracking-wide">Performance</h3><div className="flex h-64 items-end justify-around px-4 border-b border-gray-200">{[45, 60, 35, 80, 55, 90].map((h, i) => <div key={i} className="w-12 bg-blue-600 hover:bg-blue-700 transition-colors" style={{ height: `${h}%` }}></div>)}</div><div className="flex justify-between mt-2 text-xs text-gray-400"><span>JAN</span><span>JUN</span></div></div><div className="bg-white p-5 rounded-sm shadow-sm border border-gray-200"><h3 className="font-bold text-gray-700 mb-6 text-sm uppercase tracking-wide">Acesso Rápido</h3><div className="space-y-2">{[{ i: Plus, t: 'Novo Pedido' }, { i: User, t: 'Cadastrar Cliente' }].map((b, i) => <button key={i} className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-sm hover:bg-gray-50 text-sm font-medium text-gray-700"><div className="bg-blue-50 p-1.5 rounded-sm text-blue-600"><b.i className="w-4 h-4" /></div>{b.t}</button>)}</div></div></div></div>
);

// --- APP SHELL ---
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeGroup, setActiveGroup] = useState('vendas');
  const [activePage, setActivePage] = useState('dashboard');

  // --- ESTADO PERSISTENTE ---
  const clientsState = useTabSystem();
  const quotesState = useTabSystem();
  const ordersState = useTabSystem();
  const productsState = useTabSystem();

  const handleGroup = (key) => { setActiveGroup(key); setActivePage(NAV[key].pages[0].id); };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <RenderDashboard />;
      case 'contas': return RenderClients(clientsState);
      case 'orcamentos': return RenderQuotes(quotesState);
      case 'pedidos': return RenderOrders(ordersState);
      case 'produtos': return RenderProducts(productsState);
      case 'tarefas': return <RenderTasks />;
      case 'fretes': return <StandardModule title="Fretes" data={[{ id: 1, code: 'SP', name: 'SP Capital' }]} columns={['Cód', 'Nome']} renderRow={(i) => <><td className="p-3">{i.code}</td><td className="p-3">{i.name}</td></>} tabState={useTabSystem()} renderDetail={() => <div className="p-8">Detalhe Frete</div>} />;
      case 'campanhas': return <StandardModule title="Campanhas" data={DB.campaigns} columns={['Nome', 'Tipo', 'Status']} renderRow={(c) => <><td className="p-3">{c.name}</td><td className="p-3">{c.type}</td><td className="p-3"><Badge status={c.status} /></td></>} tabState={useTabSystem()} renderDetail={() => <div className="p-8">Detalhe Campanha</div>} />;
      default: return <div className="flex items-center justify-center h-full text-gray-400 font-bold uppercase tracking-widest">Em Desenvolvimento</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      <aside className={`bg-[#1e293b] text-white flex flex-col transition-all duration-300 ease-in-out z-30 shadow-xl border-r border-gray-800 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div onClick={() => setSidebarOpen(!sidebarOpen)} className="h-14 flex items-center px-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors"><div className="flex items-center gap-3 overflow-hidden"><div className="min-w-[32px] h-8 bg-blue-600 rounded-sm flex items-center justify-center font-bold text-lg text-white shadow-sm">C</div><span className={`font-bold text-lg tracking-wide whitespace-nowrap transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Compasso</span></div></div>
        <div className="flex-1 py-4 px-2 space-y-1">{Object.entries(NAV).map(([key, group]) => (<button key={key} onClick={() => handleGroup(key)} className={`w-full flex items-center gap-3 p-2.5 rounded-sm transition-all ${activeGroup === key ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><group.icon className="w-5 h-5 min-w-[20px]" /><span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>{group.label}</span></button>))}</div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-300 flex items-end justify-between px-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-20"><nav className="flex items-center gap-1 overflow-x-auto no-scrollbar h-full">{NAV[activeGroup].pages.map(page => (<button key={page.id} onClick={() => setActivePage(page.id)} className={`group flex items-center gap-2 px-4 h-10 mb-[-1px] text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activePage === page.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-gray-300'}`}><page.icon className="w-4 h-4" />{page.label}</button>))}</nav><div className="flex items-center gap-4 pl-4 border-l border-gray-200 shrink-0 h-8 mb-3"><div className="relative cursor-pointer text-gray-400 hover:text-gray-600"><Bell className="w-5 h-5" /><span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span></div><div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm cursor-pointer hover:bg-blue-600 transition-colors">PV</div></div></header>
        <main className="flex-1 overflow-hidden relative bg-gray-100">{renderContent()}</main>
      </div>
    </div>
  );
} 
