import React, { useState, useEffect } from 'react';
import { LayoutDashboard, LogOut, X, ShoppingCart, Package, Briefcase, Menu } from 'lucide-react';
import Dashboard from '../pages/Dashboard';
import GenericList from '../pages/GenericList';
import GenericForm from '../pages/GenericForm';

export default function MainLayout({ onLogout }) {
  // Estado das Abas (Persistente)
  const [tabs, setTabs] = useState(() => {
    const saved = localStorage.getItem('MOCK_TABS');
    return saved ? JSON.parse(saved) : [{ id: 'dashboard', title: 'Dashboard', type: 'dashboard' }];
  });
  
  const [activeTabId, setActiveTabId] = useState(() => {
    return localStorage.getItem('MOCK_ACTIVE_TAB') || 'dashboard';
  });

  // Salvar Estado
  useEffect(() => {
    localStorage.setItem('MOCK_TABS', JSON.stringify(tabs));
    localStorage.setItem('MOCK_ACTIVE_TAB', activeTabId);
  }, [tabs, activeTabId]);

  // Função para abrir abas corretamente configuradas
  const openTab = (item) => {
    const existing = tabs.find(t => t.id === item.id);
    if (!existing) {
      setTabs([...tabs, { 
        id: item.id, 
        title: item.name || item.title, 
        type: item.type || 'list', 
        collection: item.collection || item.table || item.id, // Mapeamento inteligente
        ...item 
      }]);
    }
    setActiveTabId(item.id);
  };

  const closeTab = (tabId, e) => {
    if (e) e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== tabId);
    
    // Regra de Ouro: Nunca vazio
    if (newTabs.length === 0) {
      newTabs.push({ id: 'dashboard', title: 'Dashboard', type: 'dashboard' });
      setActiveTabId('dashboard');
    } else if (activeTabId === tabId) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
    
    setTabs(newTabs);
  };

  // Renderização Dinâmica do Conteúdo
  const renderTabContent = (tab) => {
    if (tab.type === 'dashboard') {
      return <Dashboard />;
    }
    
    if (tab.type === 'form') {
      return (
        <GenericForm 
           collection={tab.collection} 
           id={tab.recordId} 
           onClose={() => closeTab(tab.id)} 
        />
      );
    }
    
    if (tab.type === 'list') {
      // Mapeamento de fallback
      const collectionMap = {
        'orcamentos': 'pedidos', 
        'pedidos': 'pedidos',
        'clientes': 'clientes',
        'produtos': 'produtos',
        'fornecedores': 'fornecedores',
        'tarefas': 'tarefas',
        'historico': 'interacoes',
        'campanhas': 'campanhas'
      };
      
      const collectionName = tab.collection || collectionMap[tab.id] || tab.id;
      return <GenericList collection={collectionName} openTab={openTab} />;
    }

    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">{tab.title}</h2>
        <p className="text-gray-500">Conteúdo não implementado: {tab.type}</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-gray-900">
      
      {/* SIDEBAR FIXA */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight text-blue-400">REP<span className="text-white">FORCE</span></h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Compasso V1 (Mock)</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <MenuSection title="Vendas" icon={ShoppingCart} items={[
             { id: 'orcamentos', name: 'Orçamentos', type: 'list', collection: 'pedidos' },
             { id: 'pedidos', name: 'Pedidos', type: 'list', collection: 'pedidos' },
             { id: 'clientes', name: 'Clientes', type: 'list', collection: 'clientes' }
          ]} openTab={openTab} activeTabId={activeTabId} />

          <MenuSection title="Catálogo" icon={Package} items={[
             { id: 'produtos', name: 'Produtos', type: 'list' },
             { id: 'fornecedores', name: 'Fornecedores', type: 'list' },
             { id: 'campanhas', name: 'Campanhas', type: 'list' }
          ]} openTab={openTab} activeTabId={activeTabId} />

          <MenuSection title="Produtividade" icon={Briefcase} items={[
             { id: 'tarefas', name: 'Tarefas', type: 'list' },
             { id: 'historico', name: 'Histórico', type: 'list', collection: 'interacoes' }
          ]} openTab={openTab} activeTabId={activeTabId} />
        </nav>

        <div className="p-4 border-t border-slate-800">
            <button onClick={onLogout} className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm w-full p-2 rounded hover:bg-slate-800">
                <LogOut size={16} /> Sair
            </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-100">
        
        {/* TAB BAR */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-end px-2 gap-1 overflow-x-auto select-none shadow-sm z-10">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`
                group relative px-4 py-2.5 min-w-[140px] max-w-[200px] flex items-center justify-between gap-2 
                border-t border-r border-l rounded-t-lg cursor-pointer transition-all text-sm font-medium
                ${activeTabId === tab.id 
                  ? 'bg-gray-100 border-gray-200 text-blue-600 mb-[-1px] pb-3 shadow-sm z-10' 
                  : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }
              `}
            >
              <span className="truncate">{tab.title}</span>
              <button 
                onClick={(e) => closeTab(tab.id, e)}
                className={`p-0.5 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity ${activeTabId===tab.id ? 'opacity-100':''}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* WORKSPACE CONTENT */}
        <div className="flex-1 overflow-hidden relative bg-white m-2 rounded-lg shadow-sm border border-gray-200">
          {tabs.map(tab => (
            <div key={tab.id} className={`h-full w-full overflow-auto ${activeTabId === tab.id ? 'block' : 'hidden'}`}>
                {renderTabContent(tab)}
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}

const MenuSection = ({ title, icon: Icon, items, openTab, activeTabId }) => (
  <div className="mb-6">
    <div className="px-6 mb-2 flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-wider">
        <Icon size={14} /> {title}
    </div>
    <div className="flex flex-col">
        {items.map(item => (
            <button 
                key={item.id}
                onClick={() => openTab(item)}
                className={`
                    px-6 py-2 text-left text-sm transition-colors border-l-2
                    ${activeTabId === item.id 
                        ? 'border-blue-500 text-white bg-slate-800/50' 
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }
                `}
            >
                {item.name}
            </button>
        ))}
    </div>
  </div>
);
