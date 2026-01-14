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
  ListTree,
  Layout
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
      const triggerConfig = activeTrail.original.trigger_config || {};
      
      // Always add ID for MANUAL triggers to allow flexibility, but label it based on context
      if (activeTrail.type === 'MANUAL') {
          if (triggerConfig.context === 'LIST') {
             vars.push({ name: 'id', label: 'ID do Item Clicado', type: 'ID (Lista)' });
          } else {
             // Generic fallback, sometimes useful
             vars.push({ name: 'id', label: 'ID do Contexto (Se houver)', type: 'ID (Opcional)' });
          }
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
        alert('Erro ao criar trilha: ' + (e.response?.data?.detail || e.message));
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if(!window.confirm("Tem certeza que deseja excluir esta trilha?")) return;
    try {
        await apiClient.delete(`/api/builder/trails/${id}`);
        fetchTrails();
    } catch (e) { alert("Erro ao deletar: " + (e.response?.data?.detail || e.message)); }
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
    } catch (e) { alert("Erro ao salvar gatilho: " + (e.response?.data?.detail || e.message)); }
  };
  
  const fetchEntityFields = async (entityId) => {
      if (entityFieldsCache[entityId]) return entityFieldsCache[entityId];
      try {
          const { data } = await apiClient.get(`/api/builder/entities/${entityId}/fields`);
          setEntityFieldsCache(prev => ({ ...prev, [entityId]: data }));
          return data;
      } catch (e) { return []; }
  };

  const handleCreateAction = async (name, source, contextId) => {
      try {
          const payload = {
              name: name,
              trigger_source: source,
              trigger_context: contextId,
              action_type: 'TRIGGER',
              style_variant: 'primary',
              icon: 'Zap',
              config: {}
          };
          const { data } = await apiClient.post('/api/builder/actions', payload);
          // Refresh list
          const { data: allActions } = await apiClient.get('/api/builder/actions');
          setAvailableActions(allActions);
          return data;
      } catch (e) {
           alert("Erro ao criar gatilho: " + (e.response?.data?.detail || e.message));
           return null;
      }
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
    } catch (e) { alert("Erro ao adicionar nó: " + (e.response?.data?.detail || e.message)); }
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
    } catch (e) { alert("Erro ao excluir nó: " + (e.response?.data?.detail || e.message)); }
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
                <div className="bg-slate-50 dark:bg-slate-950 p-6 border-b border-slate-100 dark:border-slate-800 relative">
                    <button onClick={() => setTriggerSelectionOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500"><X size={24}/></button>
                    <h2 className="text-xl font-black tracking-tight text-center">Gatilho Inicial</h2>
                    <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Como esta trilha deve começar?</p>
                </div>
                
                <div className="grid grid-cols-5 border-b border-slate-100 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800">
                    {[
                        { id: 'list_action', label: 'Ação em Lista', icon: <Search size={18}/> },
                        { id: 'manual', label: 'Botão', icon: <MousePointer2 size={18}/> },
                        { id: 'db_event', label: 'Evento DB', icon: <Database size={18}/> },
                        { id: 'webhook', label: 'Webhook', icon: <Webhook size={18}/> },
                        { id: 'scheduler', label: 'Agendamento', icon: <Clock size={18}/> },
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
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4">
                                <button
                                    onClick={() => setSelAction('EXISTING')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${selAction !== 'NEW' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                                >
                                    Selecionar Existente
                                </button>
                                <button
                                    onClick={() => setSelAction('NEW')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${selAction === 'NEW' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                                >
                                    Criar Novo
                                </button>
                            </div>

                            {selAction === 'NEW' ? (
                                <div className="space-y-3 animate-fade-in">
                                    <input
                                        placeholder="Nome do Botão (Ex: Aprovar Pedido)"
                                        className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                                        id="newActionName"
                                    />
                                    <select 
                                        className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                                        id="newActionPage"
                                    >
                                        <option value="">Onde será exibido?</option>
                                        {availablePages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <button 
                                        onClick={async () => {
                                            const name = document.getElementById('newActionName').value;
                                            const pageId = document.getElementById('newActionPage').value;
                                            if(!name || !pageId) return alert("Preencha nome e página");
                                            
                                            const newAct = await handleCreateAction(name, 'UI_BUTTON', pageId);
                                            if(newAct) {
                                                handleUpdateTrigger('MANUAL', { action_id: newAct.id });
                                            }
                                        }}
                                        className="w-full py-3 bg-green-600 text-white rounded-xl font-black text-xs hover:bg-green-700 transition-all shadow-lg shadow-green-500/20"
                                    >
                                        SALVAR E VINCULAR
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <select className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                                       value={selAction === 'EXISTING' ? '' : selAction} 
                                       onChange={e => setSelAction(e.target.value)}
                                    >
                                        <option value="">Selecione um Botão...</option>
                                        {availableActions.filter(a => a.trigger_source === 'UI_BUTTON').map(a => <option key={a.id} value={a.id}>{a.name} ({availablePages.find(p=>p.id===a.trigger_context)?.name})</option>)}
                                    </select>
                                    <button 
                                       onClick={() => handleUpdateTrigger('MANUAL', { action_id: selAction })}
                                       disabled={!selAction || selAction === 'EXISTING'}
                                       className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-500/20"
                                    >
                                        DEFINIR GATILHO
                                    </button>
                                </>
                            )}
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
                             
                             <div className="grid grid-cols-3 gap-2">
                               {['ON_CREATE', 'ON_UPDATE', 'ON_DELETE'].map(evt => (
                                 <button
                                    key={evt}
                                    id={`btn_evt_${evt}`}
                                    onClick={() => {
                                        document.querySelectorAll('[id^="btn_evt_"]').forEach(b => b.classList.remove('bg-blue-100', 'border-blue-500', 'text-blue-600'));
                                        document.getElementById(`btn_evt_${evt}`).classList.add('bg-blue-100', 'border-blue-500', 'text-blue-600');
                                        document.getElementById(`btn_evt_${evt}`).dataset.selected = "true";
                                    }}
                                    className="p-3 border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:border-blue-300"
                                 >
                                    {evt === 'ON_CREATE' && 'Novo Item'}
                                    {evt === 'ON_UPDATE' && 'Item Editado'}
                                    {evt === 'ON_DELETE' && 'Item Apagado'}
                                 </button>
                               ))}
                             </div>

                             <button 
                                onClick={() => {
                                    const ent = availableEntities.find(e => e.id === selEntity);
                                    let evt = 'ALL';
                                    if(document.getElementById('btn_evt_ON_CREATE')?.dataset.selected) evt = 'ON_CREATE';
                                    if(document.getElementById('btn_evt_ON_UPDATE')?.dataset.selected) evt = 'ON_UPDATE';
                                    if(document.getElementById('btn_evt_ON_DELETE')?.dataset.selected) evt = 'ON_DELETE';
                                    
                                    handleUpdateTrigger('DB_EVENT', { entity_id: selEntity, entity_name: ent?.display_name, event: evt });
                                }}
                                disabled={!selEntity}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-500/20"
                             >
                                 DEFINIR GATILHO
                             </button>
                         </div>
                     )}
                     {tab === 'scheduler' && (
                        <div className="w-full max-w-md space-y-4 text-center">
                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Intervalo (Minutos)</label>
                                <input 
                                    className="text-4xl font-black text-center bg-transparent outline-none w-full text-blue-600"
                                    placeholder="60"
                                    defaultValue="60"
                                    id="schedulerInterval"
                                    type="number"
                                />
                                <p className="text-xs text-slate-400 font-bold mt-2">Executar a cada X minutos</p>
                            </div>
                            <button 
                                onClick={() => {
                                    const interval = document.getElementById('schedulerInterval').value;
                                    handleUpdateTrigger('SCHEDULER', { interval: interval });
                                }}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                             >
                                 ATIVAR AGENDAMENTO
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
      <div className="absolute z-50 top-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 flex flex-col gap-1 w-56 animate-fade-in-up max-h-80 overflow-y-auto">
          <button onClick={() => handleAddNode('ACTION')} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left transition-colors">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Zap size={14}/></div>
              <div>
                  <span className="block text-xs font-black uppercase tracking-wide text-slate-700 dark:text-slate-300">Ação de Sistema</span>
                  <span className="block text-[9px] text-slate-400 font-bold">Automações (DB, PDF, Email)</span>
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

  const AddButton = ({ onClick }) => (
      <button onClick={onClick} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"><Plus size={16}/></button>
  );

  const TrailNode = ({ node, selected, onSelect }) => {
      // Safeguard: Ensure node exists
      if (!node) return null;
      return (
          <div onClick={() => onSelect(node)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-blue-500 bg-white shadow-lg' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-blue-300'}`}>
              <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${mapNodeColor(node.type)} text-white`}>{mapNodeIcon(node.type, node.action_type)}</div>
                  <div>
                      <span className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">{node.name || 'Sem Nome'}</span>
                      <span className="block text-[10px] text-slate-400 font-bold">{node.type}</span>
                  </div>
              </div>
          </div>
      );
  };

  const EditorView = () => {
    // Computed Variables (Design Time)
    const computedVariables = useMemo(() => {
        const vars = [];
        // Global
        vars.push({ name: 'user.id', label: 'ID Usuário (Sistema)', type: 'system' });
        vars.push({ name: 'user.email', label: 'Email Usuário (Sistema)', type: 'system' });
        vars.push({ name: 'user.name', label: 'Nome Usuário (Sistema)', type: 'system' });

        // Trigger Context
        if(activeTrail.original.trigger_type === 'DB_EVENT') {
             vars.push({ name: 'id', label: 'ID do Registro (Gatilho)', type: 'trigger' });
             // vars.push({ name: 'data.field', ... }); // Could iterate entityFieldsCache if available
        } else if (activeTrail.original.trigger_type === 'WEBHOOK') {
             vars.push({ name: 'body.field', label: 'Campo do Webhook (Ex: body.email)', type: 'webhook' });
        }

        // Node Outputs
        if(activeTrail.original.nodes) {
             Object.values(activeTrail.original.nodes).forEach(node => {
                  if(node.id === selectedNode?.id) return; 
                  
                  if (node.action_type === 'DB_CREATE' || node.action_type === 'DB_UPDATE' || node.action_type === 'DB_DELETE') {
                      vars.push({ name: `${node.id}.id`, label: `ID Afetado (${node.name})`, type: 'id' });
                  }
                  if (node.action_type === 'DB_FETCH_FIELD') {
                      vars.push({ name: `${node.id}.value`, label: `Valor Lido (${node.name})`, type: 'value' });
                  }
                  if (node.action_type === 'MATH_OP') {
                      vars.push({ name: `${node.id}.result`, label: `Resultado (${node.name})`, type: 'number' });
                  }
                  if (node.action_type === 'GENERATE_CSV' || node.action_type === 'GENERATE_PDF') {
                      vars.push({ name: `${node.id}.url`, label: `URL Arquivo (${node.name})`, type: 'url' });
                  }
                  if (node.action_type === 'AI_CLASSIFY') {
                      vars.push({ name: `${node.id}.tag`, label: `Tag IA (${node.name})`, type: 'text' });
                  }
             });
        }
        return vars;
    }, [activeTrail, selectedNode]);

    if (triggerSelectionOpen) return <TriggerSelector />;

    return (
        <div className="relative h-full w-full">
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-950">
            {/* GRAPH AREA - Simplified Linear List */}
            <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center gap-6 pb-40">
                <button 
                    onClick={() => setTriggerSelectionOpen(true)}
                    className="p-4 bg-green-100 text-green-700 rounded-full font-black text-xs uppercase tracking-widest border border-green-200 shadow-sm flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer"
                >
                    {activeTrail?.original && mapIconForType(activeTrail.original.trigger_type)}
                    INÍCIO: {activeTrail?.original ? formatTriggerDisplay(activeTrail.original) : 'Carregando...'}
                </button>
                <ArrowDown className="text-slate-300"/>
                
                {Object.values(activeTrail.original.nodes || {}).map(node => (
                    <React.Fragment key={node.id}>
                        <div className="w-full max-w-md relative group">
                             <TrailNode node={node} selected={selectedNode?.id === node.id} onSelect={() => { setSelectedNode(node); setAddingNodeTo(null); }} />
                        </div>
                        <ArrowDown className="text-slate-300"/>
                    </React.Fragment>
                ))}

                <div className="relative group">
                     {!addingNodeTo ? (
                        <button onClick={() => setAddingNodeTo('END')} className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-all"><Plus size={24}/></button>
                     ) : (
                        <button onClick={() => setAddingNodeTo(null)} className="p-3 bg-slate-400 text-white rounded-full shadow-lg hover:scale-110 transition-all"><X size={24}/></button>
                     )}
                     {addingNodeTo && <NodePicker />}
                </div>
            </div>

            {/* SIDEBAR CONFIG */}
            {selectedNode && (
                <div className="w-[450px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl z-20 animate-slide-in-right">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex-1 mr-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Nome da Etapa</label>
                            <input 
                                className="bg-transparent font-black text-lg outline-none w-full text-slate-800 dark:text-white placeholder:text-slate-300" 
                                value={selectedNode.title || selectedNode.name || ''}
                                onChange={e => setSelectedNode(prev => ({ ...prev, title: e.target.value, name: e.target.value }))}
                            />
                        </div>
                        <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {selectedNode.original.type === 'ACTION' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Ação</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'DB_CREATE', label: 'Criar Item', icon: <Plus size={14}/> },
                                                { id: 'DB_UPDATE', label: 'Editar Item', icon: <Database size={14}/> },
                                                { id: 'DB_DELETE', label: 'Deletar Item', icon: <Trash2 size={14}/> },
                                                { id: 'DB_FETCH_FIELD', label: 'Ler Campo', icon: <Search size={14}/> },
                                                { id: 'MATH_OP', label: 'Cálculo', icon: <Code2 size={14}/> },
                                                { id: 'NAVIGATE', label: 'Ir para Página', icon: <ChevronRight size={14}/> },
                                                { id: 'GENERATE_CSV', label: 'Gerar CSV', icon: <ListTree size={14}/> },
                                                { id: 'GENERATE_PDF', label: 'Gerar PDF', icon: <ListTree size={14}/> },
                                                { id: 'SEND_NOTIFICATION', label: 'Notificação', icon: <MessageSquare size={14}/> },
                                                { id: 'OPEN_SUBPAGE', label: 'Abrir Subpágina', icon: <Layout size={14}/> },
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

                                     {/* OPEN SUBPAGE FORM */}
                                     {selectedNode.original.action_type === 'OPEN_SUBPAGE' && (
                                         <div className="space-y-4 animate-fade-in">
                                             <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Layout / Template da Ficha</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.path || ''}
                                                    onChange={e => {
                                                        const pageId = e.target.value;
                                                        const page = availablePages.find(p => p.id === pageId);
                                                        // We save the full path, but here we select by ID for UX
                                                        // Construct path: /app/page/{id}
                                                        setSelectedNode(prev => ({
                                                             ...prev,
                                                             original: { ...prev.original, config: { ...prev.original.config, path: `/app/page/${pageId}`, title: page?.name } }
                                                        }));
                                                    }}
                                                >
                                                    <option value="">Selecione o Layout...</option>
                                                    {availablePages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <p className="text-[10px] text-slate-400">Este layout será aberto em uma nova aba ao clicar.</p>
                                             </div>

                                             <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Modelo de Abertura (Template)</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.template || 'FICHA'}
                                                    onChange={e => {
                                                        setSelectedNode(prev => ({
                                                             ...prev,
                                                             original: { ...prev.original, config: { ...prev.original.config, template: e.target.value } }
                                                        }));
                                                    }}
                                                >
                                                    <option value="FICHA">Ficha Lateral (Padrão)</option>
                                                    <option value="MODAL">Modal (Pop-up)</option>
                                                    <option value="FULL">Página Cheia</option>
                                                    <option value="PANEL">Painel Expansível</option>
                                                </select>
                                             </div>

                                             <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">ID do Registro (Para carregar dados)</label>
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
                                                    <option value="">Sem Contexto (Página em Branco)</option>
                                                    {computedVariables.map(v => (
                                                        <option key={v.name} value={`{{${v.name}}}`}>{v.label} ({v.type})</option>
                                                    ))}
                                                    {/* Fallback hardcoded if computed fails */}
                                                    <option value="{{id}}">ID do Item Clicado (Forçar Manual)</option>
                                                </select>
                                                <p className="text-[10px] text-slate-400">Geralmente use <strong>ID do Item Clicado</strong> para abrir o item correto.</p>
                                             </div>
                                         </div>
                                     )}

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


                                    {/* DB_FETCH_FIELD */}
                                    {selectedNode.original.action_type === 'DB_FETCH_FIELD' && (
                                        <div className="space-y-4 animate-fade-in">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Tabela de Busca</label>
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
                                                <label className="text-xs font-bold text-slate-500 uppercase">Qual Registro? (ID)</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.record_id || ''}
                                                    onChange={e => setSelectedNode(prev => ({...prev, original: { ...prev.original, config: { ...prev.original.config, record_id: e.target.value } }}))}
                                                >
                                                    <option value="">Selecione ID...</option>
                                                    {computedVariables.map(v => <option key={v.name} value={`{{${v.name}}}`}>{v.label}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Qual Campo Ler?</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.field_name || ''}
                                                    onChange={e => setSelectedNode(prev => ({...prev, original: { ...prev.original, config: { ...prev.original.config, field_name: e.target.value } }}))}
                                                >
                                                    <option value="">Selecione Campo...</option>
                                                    {(entityFieldsCache[selectedNode.original.config.table_id] || []).map(f => (
                                                        <option key={f.name} value={f.name}>{f.display_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* MATH_OP */}
                                    {selectedNode.original.action_type === 'MATH_OP' && (
                                        <div className="space-y-4 animate-fade-in">
                                             <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Fórmula Matemática</label>
                                                <div 
                                                    onClick={() => {
                                                        setIsFormulaEditorOpen(true);
                                                        setFormulaFieldTarget({ path: 'config.expression', label: 'Fórmula' });
                                                    }}
                                                    className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-500"
                                                >
                                                    <p className="font-mono text-xs">{selectedNode.original.config.expression || "Clique para editar..."}</p>
                                                </div>
                                             </div>
                                        </div>
                                    )}

                                    {/* GENERATE_CSV */}
                                    {selectedNode.original.action_type === 'GENERATE_CSV' && (
                                        <div className="space-y-4 animate-fade-in">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Tabela para Exportar</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.table_id || ''}
                                                    onChange={e => setSelectedNode(prev => ({...prev, original: { ...prev.original, config: { ...prev.original.config, table_id: e.target.value } }}))}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {availableEntities.map(e => <option key={e.id} value={e.id}>{e.display_name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* GENERATE_PDF */}
                                    {selectedNode.original.action_type === 'GENERATE_PDF' && (
                                        <div className="space-y-4 animate-fade-in">
                                            <p className="text-xs text-slate-500">Gera um relatório PDF simples com os dados do contexto atual.</p>
                                        </div>
                                    )}

                                    {/* SEND_NOTIFICATION */}
                                    {selectedNode.original.action_type === 'SEND_NOTIFICATION' && (
                                        <div className="space-y-4 animate-fade-in">
                                             <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Destinatário (Usuário/Email/Fórmula)</label>
                                                <select 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
                                                    value={selectedNode.original.config.recipient || ''}
                                                    onChange={e => setSelectedNode(prev => ({...prev, original: { ...prev.original, config: { ...prev.original.config, recipient: e.target.value } }}))}
                                                >
                                                    <option value="">Selecione...</option>
                                                    <option value="pbrandon">Pedro Brandon (Hardcoded)</option>
                                                    {computedVariables.map(v => <option key={v.name} value={`{{${v.name}}}`}>{v.label}</option>)}
                                                </select>
                                             </div>
                                             <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Mensagem</label>
                                                <textarea 
                                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-slate-200 outline-none h-24"
                                                    placeholder="Sua mensagem aqui..."
                                                    value={selectedNode.original.config.message || ''}
                                                    onChange={e => setSelectedNode(prev => ({...prev, original: { ...prev.original, config: { ...prev.original.config, message: e.target.value } }}))}
                                                />
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
