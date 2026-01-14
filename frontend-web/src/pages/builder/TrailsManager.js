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
  X,
  ListTree
} from 'lucide-react';
import apiClient from '../../api/apiClient';
import FormulaEditorModal from '../../components/builder/FormulaEditorModal';

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

  // Variables State


  // Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newTrailName, setNewTrailName] = useState('');

  // Trigger Selection State
  const [triggerSelectionOpen, setTriggerSelectionOpen] = useState(false);
  const [availableEntities, setAvailableEntities] = useState([]);
  const [availableActions, setAvailableActions] = useState([]);
  const [availablePages, setAvailablePages] = useState([]);

  // Node Manipulation State
  const [addingNodeTo, setAddingNodeTo] = useState(null); // { parentId, branch }
  const [isFormulaEditorOpen, setIsFormulaEditorOpen] = useState(false);
  const [formulaFieldTarget, setFormulaFieldTarget] = useState(null); // { path: 'config.expression', label: 'Expressão' }

  // Action Configuration State
  const [entityFieldsCache, setEntityFieldsCache] = useState({}); // { entityId: [fields] }


  // --- COMPUTED VARIABLES ---
  const computedVariables = useMemo(() => {
      if (!activeTrail) return [];
      const vars = [];

      // 1. Trigger Variables
      if (activeTrail.type === 'MANUAL' && activeTrail.original.trigger_config?.context === 'LIST') {
          vars.push({ name: 'id', label: 'ID do Item Clicado', type: 'ID' });
          // vars.push({ name: 'trigger.table_id', label: 'ID da Tabela Base', type: 'ID' }); // Not usually present in row
          // vars.push({ name: 'trigger.user_id', label: 'Usuário Executor', type: 'ID' });
      }
      if (activeTrail.type === 'WEBHOOK') {
          vars.push({ name: 'trigger.body', label: 'Webhook Body (JSON)', type: 'JSON' });
          vars.push({ name: 'trigger.query', label: 'Webhook Query', type: 'JSON' });
      }

      // 2. Node Outputs
      Object.values(activeTrail.original.nodes || {}).forEach(node => {
        const safeName = `[${node.name || node.id}]`;
        if (node.action_type === 'DB_CREATE') {
            vars.push({ name: `${safeName}.new_id`, label: `Novo ID (${node.name})`, type: 'ID' });
        }
        else if (node.action_type === 'WEBHOOK_OUT') {
             vars.push({ name: `${safeName}.response`, label: `Resposta API (${node.name})`, type: 'JSON' });
             vars.push({ name: `${safeName}.status`, label: `Status Code (${node.name})`, type: 'NUMBER' });
        }
      });
      return vars;
  }, [activeTrail]);

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
 
  const mapIconForType = (type) => {
      if (type === 'WEBHOOK') return <Webhook size={18}/>;
      if (type === 'MANUAL') return <MousePointer2 size={18}/>;
      if (type === 'DB_EVENT') return <Database size={18}/>;
      if (type === 'SCHEDULER') return <Clock size={18}/>;
      return <Zap size={18}/>;
  };

  const mapNodeIcon = (type, actionType) => {
    if (type === 'DECISION') return <GitBranch className="text-amber-500" />;
    
    // Action Types
    if (actionType === 'DB_CREATE') return <Plus className="text-green-500" />;
    if (actionType === 'DB_UPDATE') return <Database className="text-blue-500" />;
    if (actionType === 'DB_DELETE') return <Trash2 className="text-red-500" />;
    if (actionType === 'NAVIGATE') return <ChevronRight className="text-indigo-500" />;
    if (actionType === 'WEBHOOK_OUT') return <Webhook className="text-purple-500" />;
    if (actionType === 'CREATE_TASK') return <CheckCircle2 className="text-teal-500" />;
    
    return <Zap className="text-slate-500" />;
  };

  const mapNodeColor = (type) => {
     if (type === 'DECISION') return "bg-amber-500";
     if (type === 'ACTION') return "bg-blue-500"; 
     return "bg-slate-500";
  };

  const handleCreateTrail = async () => {
    if(!newTrailName) return;
    try {
        const { data } = await apiClient.post('/api/builder/trails', {
            name: newTrailName,
            trigger_type: 'MANUAL', 
            is_active: true,
            nodes: {} 
        });
        const newTrail = {
            id: data.id,
            name: data.name,
            type: 'MANUAL',
            triggerDisplay: 'Não Configurado',
            active: true,
            steps: 0,
            original: data
        };
        setTrails([...trails, newTrail]);
        setActiveTrail(newTrail);
        setView('editor');
        setTriggerSelectionOpen(true); 
        setIsCreating(false);
        setNewTrailName('');
    } catch (e) {
        alert('Erro ao criar trilha');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if(!window.confirm("Tem certeza que deseja excluir esta trilha?")) return;
    try {
        await apiClient.delete(`/api/builder/trails/${id}`);
        fetchTrails();
    } catch (e) { alert("Erro ao deletar"); }
  };

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
  
  const fetchEntityFields = async (entityId) => {
      if (entityFieldsCache[entityId]) return entityFieldsCache[entityId];
      try {
          const { data } = await apiClient.get(`/api/builder/entities/${entityId}/fields`);
          setEntityFieldsCache(prev => ({ ...prev, [entityId]: data }));
          return data;
      } catch (e) { return []; }
  };

  const handleAddNode = async (type) => {
    if (!addingNodeTo) return;
    
    const newNodeId = crypto.randomUUID();
    const newNode = {
        id: newNodeId,
        type: type,
        action_type: type === 'ACTION' ? 'DB_CREATE' : null, // Default to DB_CREATE for actions
        name: type === 'ACTION' ? 'Nova Ação' : 'Nova Decisão',
        config: {},
        next_node_id: null
    };
    
    // ... (rest same)
    if (type === 'DECISION') {
        newNode.next_true = null;
        newNode.next_false = null;
        delete newNode.next_node_id;
    }

    // Clone & Update
    const currentNodes = { ...activeTrail.original.nodes };
    const { parentId, branch } = addingNodeTo;

    if (parentId !== 'ROOT' && currentNodes[parentId]) {
        if (branch === 'true') currentNodes[parentId].next_true = newNodeId;
        else if (branch === 'false') currentNodes[parentId].next_false = newNodeId;
        else currentNodes[parentId].next_node_id = newNodeId;
    }

    currentNodes[newNodeId] = newNode;

    try {
        const { data } = await apiClient.put(`/api/builder/trails/${activeTrail.id}`, {
            nodes: currentNodes
        });
        
        const updated = { ...activeTrail, original: data, steps: Object.keys(data.nodes).length };
        setActiveTrail(updated);
        setTrails(prev => prev.map(t => t.id === updated.id ? updated : t));
        setAddingNodeTo(null);
        setSelectedNode({ ...newNode, original: newNode, expression: '' }); 
    } catch (e) { alert("Erro ao adicionar nó"); }
  };

  const handleDeleteNode = async (nodeId) => {
    if (!window.confirm("Tem certeza que deseja excluir este nó?")) return;

    const currentNodes = { ...activeTrail.original.nodes };
    
    // 1. Remove Node
    delete currentNodes[nodeId];

    // 2. Cleanup References (pointers to this node)
    Object.keys(currentNodes).forEach(id => {
        const node = currentNodes[id];
        if (node.next_node_id === nodeId) node.next_node_id = null;
        if (node.next_true === nodeId) node.next_true = null;
        if (node.next_false === nodeId) node.next_false = null;
    });

    try {
        const { data } = await apiClient.put(`/api/builder/trails/${activeTrail.id}`, {
            nodes: currentNodes
        });
        
        const updated = { ...activeTrail, original: data, steps: Object.keys(data.nodes).length };
        setActiveTrail(updated);
        setTrails(prev => prev.map(t => t.id === updated.id ? updated : t));
        setSelectedNode(null); // Close sidebar
    } catch (e) { alert("Erro ao excluir nó"); }
  };



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
            return null;
        }
        
        const node = nodesMap[nodeId];
        const uiNode = {
            id: nodeId,
            title: node.name || node.type,
            type: `${node.type}${node.action_type ? `: ${node.action_type}` : ''}`,
            icon: mapNodeIcon(node.type, node.action_type),
            color: mapNodeColor(node.type),
            expression: typeof node.config?.expression === 'string' ? node.config.expression : JSON.stringify(node.config || {}),
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
        // ... (same implementation of renderFlow)
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
            <div className="flex flex-col items-center pb-96"> {/* Added padding bottom for scrol */}
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
        <div className="h-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
            <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
                 <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
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
                 <div className="min-w-full min-h-full p-4 md:p-16 flex flex-col items-center justify-start">
                    {renderFlow()}
                 </div>
            </div>
            
            {/* OVERLAY SIDEBAR */}
            <div 
                className={`fixed inset-y-0 right-0 w-full md:w-[500px] bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-out z-[50] ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {selectedNode && (
                     <div className="h-full flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Configurar Nó</h3>
                            <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                             {/* Node Header */}
                             <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-2xl ${mapNodeColor(selectedNode.original.type)} bg-opacity-20 text-slate-700 dark:text-white`}>
                                    {mapNodeIcon(selectedNode.original.type, selectedNode.original.action_type)}
                                </div>
                                <div>
                                    <input 
                                        className="text-xl font-black bg-transparent outline-none w-full placeholder:text-slate-300" 
                                        value={selectedNode.title}
                                        onChange={e => setSelectedNode(prev => ({...prev, title: e.target.value}))}
                                    />
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wide mt-1">{selectedNode.type}</p>
                                </div>
                            </div>

                            {/* Dynamic Config Form */}
                            {selectedNode.original.type === 'ACTION' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Ação</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'DB_CREATE', label: 'Criar Item', icon: <Plus size={14}/> },
                                                { id: 'DB_UPDATE', label: 'Editar Item', icon: <Database size={14}/> },
                                                { id: 'DB_DELETE', label: 'Deletar Item', icon: <Trash2 size={14}/> },
                                                { id: 'NAVIGATE', label: 'Ir para Página', icon: <ChevronRight size={14}/> },
                                                { id: 'WEBHOOK_OUT', label: 'Webhook (API)', icon: <Webhook size={14}/> },
                                                { id: 'CREATE_TASK', label: 'Criar Tarefa', icon: <CheckCircle2 size={14}/> },
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => {
                                                         // Reset config when type changes
                                                         setSelectedNode(prev => ({ 
                                                             ...prev, 
                                                             type: `ACTION: ${opt.id}`,
                                                             original: { ...prev.original, action_type: opt.id, config: {} }
                                                         }));
                                                    }}
                                                    className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold border-2 transition-all ${selectedNode.original.action_type === opt.id ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                                                >
                                                    {opt.icon} {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-4"></div>

                                    {/* Sub-Forms */}
                                    {selectedNode.original.action_type === 'DB_CREATE' && (
                                         <div className="space-y-4 animate-fade-in">
                                             {/* Table Selection */}
                                              <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Tabela Alvo</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.table_id || ''}
                                                    onChange={async (e) => {
                                                        const tid = e.target.value;
                                                        await fetchEntityFields(tid); // Pre-fetch fields
                                                        setSelectedNode(prev => ({
                                                             ...prev,
                                                             original: { ...prev.original, config: { ...prev.original.config, table_id: tid } }
                                                        }));
                                                    }}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {availableEntities.map(e => <option key={e.id} value={e.id}>{e.display_name}</option>)}
                                                </select>
                                              </div>
                                              
                                              {/* Fields Mapping */}
                                              {selectedNode.original.config.table_id && (
                                                  <div className="space-y-2">
                                                      <label className="text-xs font-bold text-slate-500 uppercase">Preencher Campos</label>
                                                      <div className="space-y-2">
                                                          {(entityFieldsCache[selectedNode.original.config.table_id] || []).map(field => (
                                                              <div key={field.name} className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                                  <div className="flex justify-between">
                                                                    <span className="text-xs font-bold text-slate-700">{field.label}</span>
                                                                    <code className="text-[10px] text-slate-400">{field.name}</code>
                                                                  </div>
                                                                  <div 
                                                                    onClick={() => {
                                                                        setIsFormulaEditorOpen(true);
                                                                        setFormulaFieldTarget({ 
                                                                            path: `mapped_values.${field.name}`, 
                                                                            label: field.label 
                                                                        });
                                                                    }}
                                                                    className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs text-blue-600 font-mono cursor-pointer hover:border-blue-400"
                                                                  >
                                                                     {selectedNode.original.config.mapped_values?.[field.name] || 'Clique para definir fórmula...'}
                                                                  </div>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  </div>
                                              )}
                                         </div>
                                    )}
                                    {/* DB UPDATE FORM */}
                                    {selectedNode.original.action_type === 'DB_UPDATE' && (
                                         <div className="space-y-4 animate-fade-in">
                                              <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Tabela Alvo</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.table_id || ''}
                                                    onChange={async (e) => {
                                                        const tid = e.target.value;
                                                        await fetchEntityFields(tid);
                                                        setSelectedNode(prev => ({
                                                             ...prev,
                                                             original: { ...prev.original, config: { ...prev.original.config, table_id: tid } }
                                                        }));
                                                    }}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {availableEntities.map(e => <option key={e.id} value={e.id}>{e.display_name}</option>)}
                                                </select>
                                              </div>

                                              <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">ID do Registro (Fórmula)</label>
 
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.record_id || ''}
                                                    onChange={e => {
                                                        setSelectedNode(prev => ({
                                                             ...prev,
                                                             original: { ...prev.original, config: { ...prev.original.config, record_id: e.target.value } }
                                                        }));
                                                    }}
                                                >
                                                    <option value="">Selecione ou deixe vazio...</option>
                                                    {computedVariables.map(v => (
                                                        <option key={v.name} value={`{{${v.name}}}`}>{v.label} ({v.type})</option>
                                                    ))}
                                                    <option value="MANUAL">Digitar ID manualmente...</option>
                                                </select>
                                                {selectedNode.original.config.record_id === 'MANUAL' && (
                                                     <input 
                                                         className="mt-2 w-full p-3 bg-white border border-slate-200 rounded-xl text-sm"
                                                         placeholder="Digite o ID..."
                                                         onBlur={e => {
                                                             setSelectedNode(prev => ({
                                                                 ...prev,
                                                                 original: { ...prev.original, config: { ...prev.original.config, record_id: e.target.value } }
                                                            }));
                                                         }}
                                                     />
                                                )}
                                              </div>
                                              
                                              {selectedNode.original.config.table_id && (
                                                  <div className="space-y-2">
                                                      <label className="text-xs font-bold text-slate-500 uppercase">Atualizar Campos</label>
                                                      <div className="space-y-2">
                                                          {(entityFieldsCache[selectedNode.original.config.table_id] || []).map(field => (
                                                              <div key={field.name} className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                                  <div className="flex justify-between">
                                                                    <span className="text-xs font-bold text-slate-700">{field.label}</span>
                                                                    <code className="text-[10px] text-slate-400">{field.name}</code>
                                                                  </div>
                                                                  <div 
                                                                    onClick={() => {
                                                                        setIsFormulaEditorOpen(true);
                                                                        setFormulaFieldTarget({ 
                                                                            path: `mapped_values.${field.name}`, 
                                                                            label: field.label 
                                                                        });
                                                                    }}
                                                                    className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs text-blue-600 font-mono cursor-pointer hover:border-blue-400"
                                                                  >
                                                                     {selectedNode.original.config.mapped_values?.[field.name] || 'Clique para definir valor...'}
                                                                  </div>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  </div>
                                              )}
                                         </div>
                                    )}

                                    {/* DB DELETE FORM */}
                                    {selectedNode.original.action_type === 'DB_DELETE' && (
                                        <div className="space-y-4 animate-fade-in">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Tabela Alvo</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.table_id || ''}
                                                    onChange={e => {
                                                        setSelectedNode(prev => ({
                                                             ...prev,
                                                             original: { ...prev.original, config: { ...prev.original.config, table_id: e.target.value } }
                                                        }));
                                                    }}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {availableEntities.map(e => <option key={e.id} value={e.id}>{e.display_name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">ID do Registro para Deletar</label>
 
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.record_id || ''}
                                                    onChange={e => {
                                                        setSelectedNode(prev => ({
                                                             ...prev,
                                                             original: { ...prev.original, config: { ...prev.original.config, record_id: e.target.value } }
                                                        }));
                                                    }}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {computedVariables.map(v => (
                                                        <option key={v.name} value={`{{${v.name}}}`}>{v.label} ({v.type})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* NAVIGATE FORM */}
                                    {selectedNode.original.action_type === 'NAVIGATE' && (
                                        <div className="space-y-4 animate-fade-in">
                                             <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Página de Destino</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.page_id || ''}
                                                    onChange={e => {
                                                        setSelectedNode(prev => ({
                                                             ...prev,
                                                             original: { ...prev.original, config: { ...prev.original.config, page_id: e.target.value } }
                                                        }));
                                                    }}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {availablePages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">ID do Registro (Opcional - Para abrir Detalhes)</label>
 
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.record_id || ''}
                                                    onChange={e => {
                                                        setSelectedNode(prev => ({
                                                             ...prev,
                                                             original: { ...prev.original, config: { ...prev.original.config, record_id: e.target.value } }
                                                        }));
                                                    }}
                                                >
                                                    <option value="">Vazio (Nenhum Filtro)</option>
                                                    {computedVariables.map(v => (
                                                        <option key={v.name} value={`{{${v.name}}}`}>{v.label} ({v.type})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* WEBHOOK FORM */}
                                    {selectedNode.original.action_type === 'WEBHOOK_OUT' && (
                                        <div className="space-y-4 animate-fade-in">
                                             <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Método HTTP</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.method || 'POST'}
                                                    onChange={e => {
                                                        setSelectedNode(prev => ({
                                                             ...prev,
                                                             original: { ...prev.original, config: { ...prev.original.config, method: e.target.value } }
                                                        }));
                                                    }}
                                                >
                                                    <option value="GET">GET</option>
                                                    <option value="POST">POST</option>
                                                    <option value="PUT">PUT</option>
                                                    <option value="DELETE">DELETE</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">URL de Destino</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.url || ''}
                                                    onChange={e => {
                                                        setSelectedNode(prev => ({
                                                             ...prev,
                                                             original: { ...prev.original, config: { ...prev.original.config, url: e.target.value } }
                                                        }));
                                                    }}
                                                >
                                                    <option value="">Selecione ou deixe vazio...</option>
                                                    {computedVariables.map(v => (
                                                        <option key={v.name} value={`{{${v.name}}}`}>{v.label} ({v.type})</option>
                                                    ))}
                                                    <option value="MANUAL">Digitar URL manualmente...</option>
                                                </select>
                                                {selectedNode.original.config.url === 'MANUAL' && (
                                                     <input 
                                                         className="mt-2 w-full p-3 bg-white border border-slate-200 rounded-xl text-sm"
                                                         placeholder="https://..."
                                                         onBlur={e => {
                                                             setSelectedNode(prev => ({
                                                                 ...prev,
                                                                 original: { ...prev.original, config: { ...prev.original.config, url: e.target.value } }
                                                            }));
                                                         }}
                                                     />
                                                )}
                                                {/* Fallback for viewing manual if not matching 'MANUAL' select option but existing */}
                                                {selectedNode.original.config.url && !selectedNode.original.config.url.startsWith('{{') && selectedNode.original.config.url !== 'MANUAL' && (
                                                    <div className="mt-2 text-xs text-slate-500">
                                                        Valor atual: {selectedNode.original.config.url} 
                                                        <button className="ml-2 text-blue-500 underline" onClick={()=>setSelectedNode(prev => ({...prev, original: {...prev.original, config: {...prev.original.config, url: 'MANUAL'}} }))}>Editar</button>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                                    <span>Corpo do Request (JSON)</span>
                                                    <button 
                                                        onClick={() => {
                                                            const key = prompt("Nome do campo (ex: email):");
                                                            if(key) {
                                                                setSelectedNode(prev => ({
                                                                    ...prev,
                                                                    original: { 
                                                                        ...prev.original, 
                                                                        config: { 
                                                                            ...prev.original.config, 
                                                                            body: { ...(prev.original.config.body || {}), [key]: '' } 
                                                                        } 
                                                                    }
                                                                }));
                                                            }
                                                        }}
                                                        className="text-blue-500 hover:underline"
                                                    >+ Add Campo</button>
                                                </label>
                                                <div className="space-y-2">
                                                    {Object.entries(selectedNode.original.config.body || {}).map(([key, val]) => (
                                                        <div key={key} className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                                            <div className="flex justify-between">
                                                                <span className="text-xs font-bold text-slate-700">{key}</span>
                                                                <button 
                                                                    onClick={() => {
                                                                        const newBody = { ...selectedNode.original.config.body };
                                                                        delete newBody[key];
                                                                        setSelectedNode(prev => ({
                                                                            ...prev,
                                                                            original: { ...prev.original, config: { ...prev.original.config, body: newBody } }
                                                                        }));
                                                                    }}
                                                                    className="text-red-400 opacity-0 group-hover:opacity-100"
                                                                ><Trash2 size={12}/></button>
                                                            </div>
                                                            <select 
                                                                className="w-full p-2 bg-white rounded-lg border border-slate-200 text-xs text-blue-600 font-mono outline-none"
                                                                value={val || ''}
                                                                onChange={e => {
                                                                    const newVal = e.target.value;
                                                                    const newBody = { ...selectedNode.original.config.body, [key]: newVal };
                                                                    setSelectedNode(prev => ({
                                                                        ...prev,
                                                                        original: { ...prev.original, config: { ...prev.original.config, body: newBody } }
                                                                    }));
                                                                }}
                                                            >
                                                                <option value="">Vazio...</option>
                                                                {computedVariables.map(v => (
                                                                    <option key={v.name} value={`{{${v.name}}}`}>{v.label} ({v.type})</option>
                                                                ))}
                                                                 <option value="MANUAL">Valor Fixo...</option>
                                                            </select>
                                                            {val === 'MANUAL' && <input className="mt-1 w-full text-xs p-1 border rounded" placeholder="Valor..." onBlur={e => {
                                                                 const newBody = { ...selectedNode.original.config.body, [key]: e.target.value };
                                                                    setSelectedNode(prev => ({
                                                                        ...prev,
                                                                        original: { ...prev.original, config: { ...prev.original.config, body: newBody } }
                                                                    }));
                                                            }}/>}
                                                        </div>
                                                    ))}
                                                    {Object.keys(selectedNode.original.config.body || {}).length === 0 && (
                                                        <p className="text-center text-xs text-slate-400 py-2">Sem campos no corpo.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TASK FORM */}
                                    {selectedNode.original.action_type === 'CREATE_TASK' && (
                                        <div className="space-y-4 animate-fade-in">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Responsável (ID ou Email)</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.assignee || ''}
                                                    onChange={e => {
                                                        setSelectedNode(prev => ({
                                                             ...prev,
                                                             original: { ...prev.original, config: { ...prev.original.config, assignee: e.target.value } }
                                                        }));
                                                    }}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {computedVariables.map(v => (
                                                        <option key={v.name} value={`{{${v.name}}}`}>{v.label}</option>
                                                    ))}
                                                    <option value="MANUAL">Digitar ID/Email...</option>
                                                </select>
                                                 {selectedNode.original.config.assignee === 'MANUAL' && (
                                                     <input 
                                                         className="mt-2 w-full p-3 bg-white border border-slate-200 rounded-xl text-sm"
                                                         placeholder="ID ou Email..."
                                                         onBlur={e => {
                                                             setSelectedNode(prev => ({
                                                                 ...prev,
                                                                 original: { ...prev.original, config: { ...prev.original.config, assignee: e.target.value } }
                                                            }));
                                                         }}
                                                     />
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Título da Tarefa</label>
                                                 <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.title || ''}
                                                    onChange={e => {
                                                        setSelectedNode(prev => ({
                                                             ...prev,
                                                             original: { ...prev.original, config: { ...prev.original.config, title: e.target.value } }
                                                        }));
                                                    }}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {computedVariables.map(v => (
                                                        <option key={v.name} value={`{{${v.name}}}`}>{v.label}</option>
                                                    ))}
                                                    <option value="MANUAL">Digitar Título...</option>
                                                </select>
                                                {selectedNode.original.config.title === 'MANUAL' && (
                                                     <input 
                                                         className="mt-2 w-full p-3 bg-white border border-slate-200 rounded-xl text-sm"
                                                         placeholder="Título da Tarefa..."
                                                         onBlur={e => {
                                                             setSelectedNode(prev => ({
                                                                 ...prev,
                                                                 original: { ...prev.original, config: { ...prev.original.config, title: e.target.value } }
                                                            }));
                                                         }}
                                                     />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedNode.original.type === 'DECISION' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Expressão Lógica (Se Verdadeiro)</label>
                                    <div 
                                        onClick={() => {
                                            setIsFormulaEditorOpen(true);
                                            setFormulaFieldTarget({ path: 'expression', label: 'Condição' });
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 cursor-pointer group transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-blue-500">
                                                <Code2 size={16}/>
                                                <span className="text-xs font-black uppercase">Editor de Fórmula</span>
                                            </div>
                                            <ArrowDown className="-rotate-90 text-slate-300 group-hover:text-blue-500 transition-colors" size={16}/>
                                        </div>
                                        <p className="font-mono text-xs text-slate-600 dark:text-slate-400 break-all line-clamp-3">
                                            {selectedNode.original.config?.expression || "Clique para editar a lógica..."}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        Use fórmulas estilo AppSheet para definir quando o fluxo deve seguir pelo caminho <strong className="text-green-600">VERDADEIRO</strong>.
                                    </p>
                                </div>
                            )}

                            <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    onClick={() => handleDeleteNode(selectedNode.id)}
                                    className="w-full py-3 flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 size={16} />
                                    EXCLUIR ESTE NÓ
                                </button>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                             <button 
                                onClick={async () => {
                                    // Save Logic
                                    const currentNodes = { ...activeTrail.original.nodes };
                                    
                                    // Preserve title edit
                                    const nodeToSave = {
                                        ...selectedNode.original,
                                        name: selectedNode.title, 
                                        config: selectedNode.original.config 
                                    };

                                    currentNodes[selectedNode.id] = nodeToSave;

                                    try {
                                        const { data } = await apiClient.put(`/api/builder/trails/${activeTrail.id}`, { nodes: currentNodes });
                                        const updated = { ...activeTrail, original: data };
                                        setActiveTrail(updated);
                                        setTrails(prev => prev.map(t => t.id === updated.id ? updated : t));
                                        alert('Salvo com sucesso!');
                                    } catch (e) { alert('Erro ao salvar'); }
                                }}
                                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={18}/> Salvar e Fechar
                            </button>
                        </div>
                     </div>
                )}
            </div>
            

            

            {isFormulaEditorOpen && selectedNode && formulaFieldTarget && (
                <FormulaEditorModal
                    isOpen={true}
                    onClose={() => {
                        setIsFormulaEditorOpen(false);
                        setFormulaFieldTarget(null);
                    }}
                    initialValue={
                        formulaFieldTarget.path.includes('.') 
                        ? (function resolvePath(obj, path){
                            return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj);
                          })(selectedNode.original.config, formulaFieldTarget.path) || ''
                        : selectedNode.original.config?.[formulaFieldTarget.path] || ''
                    }
                    onSave={(newFormula) => {
                         const deepSet = (obj, path, value) => {
                             const keys = path.split('.');
                             const last = keys.pop();
                             const target = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
                             target[last] = value;
                             return obj;
                         };

                         setSelectedNode(prev => ({
                            ...prev,
                            original: { 
                                ...prev.original, 
                                config: deepSet({ ...prev.original.config }, formulaFieldTarget.path, newFormula)
                            }
                        }));
                    }}
                    entityId={activeTrail.trigger_config?.entity_id}
                    fields={computedVariables} 
                    availableEntities={availableEntities} 
                    onFetchEntityFields={fetchEntityFields} 
                />
            )}
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
