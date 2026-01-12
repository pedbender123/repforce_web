import React, { useState, useMemo, useEffect } from 'react';
import { 
  Play, 
  Plus, 
  Settings, 
  Webhook, 
  MousePointer2, 
  Database, 
  Search, 
  MoreVertical, 
  ChevronRight, 
  GitBranch, 
  Terminal, 
  MessageSquare, 
  ArrowDown, 
  Trash2,
  Code2,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Save,
  X
} from 'lucide-react';
import apiClient from '../../api/apiClient';

// --- COMPONENTES AUXILIARES ---

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
};

const TrailsManager = () => {
  // --- STATES ---
  const [view, setView] = useState('list');
  const [trails, setTrails] = useState([]); 
  const [activeTrail, setActiveTrail] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newTrailName, setNewTrailName] = useState('');

  // Trigger Selection State
  const [triggerSelectionOpen, setTriggerSelectionOpen] = useState(false);
  const [availableEntities, setAvailableEntities] = useState([]);
  const [availableActions, setAvailableActions] = useState([]);
  const [availablePages, setAvailablePages] = useState([]); // [NEW]

  // Node Manipulation State
  const [addingNodeTo, setAddingNodeTo] = useState(null); // { parentId, branch }

  // --- EFFECTS ---

  useEffect(() => {
    fetchTrails();
    loadAuxData();
  }, []);

  const loadAuxData = async () => {
    try {
        const [entRes, actRes, pageRes] = await Promise.all([
            apiClient.get('/api/builder/entities'),
            apiClient.get('/api/builder/actions'),
            apiClient.get('/api/builder/pages')
        ]);
        setAvailableEntities(entRes.data);
        setAvailableActions(actRes.data);
        setAvailablePages(pageRes.data);
    } catch (e) { console.error(e); }
  };

  const fetchTrails = async () => {
    try {
        const { data } = await apiClient.get('/api/builder/trails');
        const formatted = data.map(t => ({
            id: t.id,
            name: t.name,
            type: t.trigger_type,
            triggerDisplay: formatTriggerDisplay(t),
            active: t.is_active,
            steps: Object.keys(t.nodes || {}).length,
            original: t
        }));
        setTrails(formatted);
    } catch (error) {
        console.error("Error fetching trails", error);
    } finally {
        setIsLoading(false);
    }
  };

  // --- HELPERS ---

  const formatTriggerDisplay = (trail) => {
      if (trail.trigger_type === 'MANUAL') {
          if (trail.trigger_config?.context === 'LIST') return `Lista: ${trail.trigger_config?.page_name || 'Desconhecida'}`;
          return 'Manual / Botão';
      }
      if (trail.trigger_type === 'WEBHOOK') return 'Webhook';
      if (trail.trigger_type === 'DB_EVENT') return `DB: ${trail.trigger_config?.entity_name || 'N/A'}`;
      if (trail.trigger_type === 'SCHEDULER') return 'Periódico';
      return trail.trigger_type;
  };
 
  // ... (mapIconForType, mapNodeIcon, mapNodeColor, handleCreateTrail, handleDelete SAME)

  const handleUpdateTrigger = async (type, config) => {
    try {
        const { data } = await apiClient.put(`/api/builder/trails/${activeTrail.id}`, {
            trigger_type: type,
            trigger_config: config
        });
        const updated = { ...activeTrail, original: data, type: type, triggerDisplay: formatTriggerDisplay(data) };
        setActiveTrail(updated);
        setTrails(prev => prev.map(t => t.id === updated.id ? updated : t));
        setTriggerSelectionOpen(false);
    } catch (e) { alert("Erro ao salvar gatilho"); }
  };
  
  // ... (handleAddNode SAME)

  // --- SUB-COMPONENTS ---

  const TriggerSelector = () => {
    const [tab, setTab] = useState('manual');
    const [selEntity, setSelEntity] = useState('');
    const [selAction, setSelAction] = useState('');
    const [selPage, setSelPage] = useState('');

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-10 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-100 dark:border-slate-800 w-full max-w-4xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-950 p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-black tracking-tight text-center">Gatilho Inicial</h2>
                    <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Como esta trilha deve começar?</p>
                </div>
                
                <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800">
                    {[
                        { id: 'list_action', label: 'Ação em Lista', icon: <Search size={18}/> },
                        { id: 'manual', label: 'Botão', icon: <MousePointer2 size={18}/> },
                        { id: 'db_event', label: 'Evento DB', icon: <Database size={18}/> },
                        { id: 'webhook', label: 'Webhook', icon: <Webhook size={18}/> },
                    ].map(t => (
                        <button 
                           key={t.id}
                           onClick={() => setTab(t.id)}
                           className={`p-6 flex flex-col items-center gap-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${tab === t.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-slate-400'}`}
                        >
                            {t.icon}
                            <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                        </button>
                    ))}
                </div>

                <div className="p-8 min-h-[300px] flex flex-col items-center justify-center">
                    {tab === 'manual' && (
                        <div className="w-full max-w-md space-y-4">
                            <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                               value={selAction} onChange={e => setSelAction(e.target.value)}
                            >
                                <option value="">Selecione um Botão...</option>
                                {availableActions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <button 
                               onClick={() => handleUpdateTrigger('MANUAL', { action_id: selAction })}
                               disabled={!selAction}
                               className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-500/20"
                            >
                                DEFINIR GATILHO
                            </button>
                        </div>
                    )}
                     {tab === 'db_event' && (
                         <div className="w-full max-w-md space-y-4">
                             <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                                value={selEntity} onChange={e => setSelEntity(e.target.value)}
                             >
                                 <option value="">Selecione a Tabela...</option>
                                 {availableEntities.map(e => <option key={e.id} value={e.id}>{e.display_name}</option>)}
                             </select>
                             <button 
                                onClick={() => {
                                    const ent = availableEntities.find(e => e.id === selEntity);
                                    handleUpdateTrigger('DB_EVENT', { entity_id: selEntity, entity_name: ent?.display_name, event: 'ALL' });
                                }}
                                disabled={!selEntity}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-500/20"
                             >
                                 DEFINIR GATILHO
                             </button>
                         </div>
                     )}
                     {tab === 'webhook' && (
                        <div className="w-full max-w-md text-center space-y-6">
                           <div className="mx-auto w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-2">
                               <Webhook size={32}/>
                           </div>
                           <button 
                               onClick={() => handleUpdateTrigger('WEBHOOK', {})}
                               className="w-full py-4 bg-purple-600 text-white rounded-xl font-black text-sm hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/20"
                            >
                                GERAR WEBHOOK
                            </button>
                        </div>
                    )}
                    {tab === 'list_action' && (
                        <div className="w-full max-w-md space-y-4">
                             <p className="text-sm font-bold text-slate-500 mb-2 text-center">Selecione a página onde a ação aparecerá</p>
                             <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                                value={selPage} onChange={e => setSelPage(e.target.value)}
                             >
                                 <option value="">Selecione a Página...</option>
                                 {availablePages.filter(p => p.type === 'list').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                             </select>
                             <button 
                                onClick={() => {
                                    const page = availablePages.find(p => p.id === selPage);
                                    handleUpdateTrigger('MANUAL', { context: 'LIST', page_id: selPage, page_name: page?.name, entity_id: page?.entity_id });
                                }}
                                disabled={!selPage}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-500/20"
                             >
                                 CRIAR AÇÃO NA LISTA
                             </button>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
  };


  const NodePicker = () => (
      <div className="absolute z-50 top-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 flex flex-col gap-1 w-48 animate-fade-in-up">
          <button onClick={() => handleAddNode('ACTION')} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left transition-colors">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Zap size={14}/></div>
              <div>
                  <span className="block text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-300">Ação de Sistema</span>
                  <span className="block text-[9px] text-slate-400 font-bold">Executar script, etc.</span>
              </div>
          </button>
          <button onClick={() => handleAddNode('DECISION')} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left transition-colors">
              <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg"><GitBranch size={14}/></div>
              <div>
                  <span className="block text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-300">Decisão Lógica</span>
                  <span className="block text-[9px] text-slate-400 font-bold">Desviar fluxo (IF)</span>
              </div>
          </button>
      </div>
  );

  const AddButton = ({ parentId, branch = 'next' }) => (
      <div className="flex flex-col items-center relative">
        <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-800"></div>
        <button 
          onClick={() => setAddingNodeTo(addingNodeTo?.parentId === parentId && addingNodeTo?.branch === branch ? null : { parentId, branch })}
          className={`bg-white dark:bg-slate-800 border-2 ${addingNodeTo?.parentId === parentId && addingNodeTo?.branch === branch ? 'border-blue-500 text-blue-500' : 'border-slate-200 dark:border-slate-700 text-slate-400'} p-1 rounded-full hover:text-blue-500 hover:border-blue-500 transition-all -my-2 z-10 shadow-sm`}
        >
          <Plus size={16} className={addingNodeTo?.parentId === parentId && addingNodeTo?.branch === branch ? 'rotate-45 transition-transform' : 'transition-transform'}/>
        </button>
        {addingNodeTo?.parentId === parentId && addingNodeTo?.branch === branch && <NodePicker />}
      </div>
  );

  const TrailNode = ({ node, isLast = false, isSelected = false, onClick }) => (
    <div className="flex flex-col items-center">
      <div 
        onClick={onClick}
        className={`group relative w-72 bg-white dark:bg-slate-900 border-2 rounded-2xl p-4 shadow-sm transition-all cursor-pointer ${
          isSelected ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-xl ${node.color} bg-opacity-15`}>
            {node.icon}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-bold truncate">{node.title}</h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{node.type}</p>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 mb-1">
            <Code2 size={10} className="text-blue-500" />
            <span className="text-[9px] font-bold text-slate-400 uppercase">Lógica</span>
          </div>
          <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all leading-tight truncate">
            {node.expression || "{}"}
          </p>
        </div>
      </div>
    </div>
  );

  const EditorView = () => {
    // Check Config
    const isUnconfigured = activeTrail.type === 'MANUAL' && (!activeTrail.original.trigger_config || Object.keys(activeTrail.original.trigger_config).length === 0) && activeTrail.steps === 0;

    if (triggerSelectionOpen || isUnconfigured) {
        return (
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
                <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
                     <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase tracking-wider">
                        <ArrowDown className="rotate-90" size={16}/> Voltar
                     </button>
                     <h2 className="text-sm font-black text-slate-800 dark:text-white">{activeTrail?.name}</h2>
                     <div className="w-8"></div>
                </header>
                <TriggerSelector />
            </div>
        );
    }
    
    // Recursive Graph Rendering
    const renderSequence = (nodeId, nodesMap) => {
        if (!nodeId || !nodesMap[nodeId]) {
            // This is handled by parent usually, but if called, it's a dead end? 
            // We shouldn't reach here if parentLogic is correct, but just in case
            return null;
        }
        
        const node = nodesMap[nodeId];
        const uiNode = {
            id: nodeId,
            title: node.name || node.type,
            type: `${node.type}${node.action_type ? `: ${node.action_type}` : ''}`,
            icon: mapNodeIcon(node.type, node.action_type),
            color: mapNodeColor(node.type),
            expression: JSON.stringify(node.config || {}),
            original: node
        };

        if (node.type === 'DECISION') {
            return (
                <div key={nodeId} className="flex flex-col items-center w-full">
                     <TrailNode 
                        node={uiNode} 
                        isSelected={selectedNode?.id === nodeId}
                        onClick={() => setSelectedNode(uiNode)}
                    />
                    
                     <div className="relative w-full max-w-5xl flex justify-center pt-10">
                        {/* Connecting Lines Simplified */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-10 border-t-2 border-slate-300 dark:border-slate-800 rounded-t-[3rem] border-x-2"></div>
                        
                        <div className="grid grid-cols-2 gap-16 w-full px-4 pt-10">
                            <div className="flex flex-col items-center relative">
                                <Badge color="green">VERDADEIRO</Badge>
                                {node.next_true ? renderSequence(node.next_true, nodesMap) : <AddButton parentId={nodeId} branch="true"/>}
                            </div>
                            <div className="flex flex-col items-center relative">
                                <Badge color="amber">FALSO</Badge>
                                {node.next_false ? renderSequence(node.next_false, nodesMap) : <AddButton parentId={nodeId} branch="false"/>}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <React.Fragment key={nodeId}>
                <TrailNode 
                    node={uiNode} 
                    isSelected={selectedNode?.id === nodeId}
                    onClick={() => setSelectedNode(uiNode)}
                />
                {node.next_node_id ? renderSequence(node.next_node_id, nodesMap) : <AddButton parentId={nodeId} branch="next" />}
            </React.Fragment>
        );
    };

    const renderFlow = () => {
        // Empty State (ROOT)
        const nodesMap = activeTrail.original.nodes || {};
        const hasNodes = Object.keys(nodesMap).length > 0;

        // Find Start Node: Node not referenced by others
        const allTargetIds = new Set();
        Object.values(nodesMap).forEach(n => {
            if(n.next_node_id) allTargetIds.add(n.next_node_id);
            if(n.next_true) allTargetIds.add(n.next_true);
            if(n.next_false) allTargetIds.add(n.next_false);
        });
        const startNodeId = Object.keys(nodesMap).find(id => !allTargetIds.has(id));

        return (
            <div className="flex flex-col items-center">
                 <div className="flex flex-col items-center mb-10">
                    <div className="bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl px-8 py-5 shadow-2xl flex items-center gap-4 border-2 border-slate-800 dark:border-slate-200">
                        {mapIconForType(activeTrail.type)}
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Ponto de Partida</p>
                            <h3 className="text-lg font-bold leading-tight">{activeTrail.triggerDisplay}</h3>
                        </div>
                    </div>
                    <div className="w-0.5 h-12 bg-slate-300 dark:bg-slate-700"></div>
                </div>
                {hasNodes && startNodeId ? renderSequence(startNodeId, nodesMap) : (
                    <div className="relative">
                        <button 
                            onClick={() => setAddingNodeTo(addingNodeTo?.parentId === 'ROOT' ? null : { parentId: 'ROOT', branch: 'next' })}
                            className="group relative flex flex-col items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 group-hover:border-blue-500 flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
                                <Plus size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity absolute top-full mt-2">Adicionar Nó</span>
                        </button>
                        {addingNodeTo?.parentId === 'ROOT' && <NodePicker />}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex overflow-hidden bg-slate-50 dark:bg-slate-950">
            <div className="flex-1 overflow-auto flex flex-col">
                 <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <ArrowDown className="rotate-90 text-slate-400" size={20} />
                        </button>
                        <div>
                        <h2 className="text-lg font-black tracking-tight">{activeTrail?.name}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-100 px-1.5 rounded text-slate-500 font-bold uppercase">{activeTrail.type}</span>
                        </div>
                        </div>
                    </div>
                 </header>
                 <div className="flex-1 p-16 flex flex-col items-center">
                    {renderFlow()}
                 </div>
            </div>
            
            <aside className={`w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-transform fixed inset-y-0 right-0 z-30 lg:relative ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Configurar Nó</h3>
                    <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" size={20}/></button>
                </div>
                {selectedNode ? (
                     <div className="space-y-6 flex-1 overflow-auto">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300">
                             {selectedNode.type}
                        </div>
                        <textarea 
                           className="w-full bg-slate-900 text-blue-400 p-4 rounded-xl font-mono text-xs border-2 border-slate-800 focus:border-blue-500 outline-none"
                           rows={10}
                           defaultValue={JSON.stringify(selectedNode.config, null, 2)}
                           // TODO: Make this real config editing
                        />
                     </div>
                ) : <div/>}
                </div>
            </aside>
        </div>
    );
  };

  const ListView = () => (
    <div className="max-w-6xl mx-auto p-6 md:p-12">
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-4">
            <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">Minhas Trilhas</h1>
         </div>

        {!isCreating ? (
            <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
            <Plus size={16} /> Nova Trilha
            </button>
        ) : (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 animate-slide-in-right">
                <input 
                    autoFocus
                    placeholder="Nome da Trilha..."
                    className="bg-transparent outline-none px-3 py-1 text-xs font-bold w-40"
                    value={newTrailName}
                    onChange={e => setNewTrailName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateTrail()}
                />
                <button onClick={handleCreateTrail} className="bg-green-500 text-white p-1.5 rounded-md hover:bg-green-600"><Plus size={14}/></button>
                <button onClick={() => setIsCreating(false)} className="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600"><Trash2 size={14}/></button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrails.map(trail => (
          <div 
            key={trail.id}
            onClick={() => { setActiveTrail(trail); setView('editor'); }}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-lg hover:border-blue-500/50 transition-all cursor-pointer relative"
          >
            <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                trail.type === 'WEBHOOK' ? 'bg-purple-100 text-purple-600' :
                trail.type === 'MANUAL' ? 'bg-blue-100 text-blue-600' :
                trail.type === 'DB_EVENT' ? 'bg-amber-100 text-amber-600' :
                'bg-indigo-100 text-indigo-600'
                }`}>
                {mapIconForType(trail.type)}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-sm font-black truncate group-hover:text-blue-600 transition-colors">{trail.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate mt-0.5">{trail.triggerDisplay}</p>
                </div>

                <button 
                    onClick={(e) => handleDelete(e, trail.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all absolute top-2 right-2"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${trail.active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <span className="text-[10px] font-bold text-slate-400">{trail.active ? 'Ativo' : 'Inativo'}</span>
                 </div>
                 <span className="text-[10px] font-black text-slate-300">{trail.steps} Etapas</span>
            </div>
          </div>
        ))}
      </div>
      
      {filteredTrails.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Filter size={48} className="opacity-20 mb-4"/>
          <p className="font-bold text-sm">Nenhuma trilha encontrada.</p>
        </div>
      )}
    </div>
  );
  
  const filteredTrails = useMemo(() => {
    if (filterType === 'ALL') return trails;
    return trails.filter(t => t.type === filterType);
  }, [filterType, trails]);

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {view === 'list' ? <ListView /> : <EditorView />}
    </div>
  );
};

export default TrailsManager;
