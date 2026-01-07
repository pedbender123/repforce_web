import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { 
    MousePointer, Smartphone, Zap, Plus, Trash, Save, 
    ExternalLink, Copy, Check, FileText, Mail, Database 
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const ActionManager = () => {
    const [activeTab, setActiveTab] = useState('VIRTUAL_HOOK'); // VIRTUAL_HOOK, UI_BUTTON, LIST_CLICK, PAGE_LOAD
    const [actions, setActions] = useState([]);
    const [entities, setEntities] = useState([]);
    const [pages, setPages] = useState([]);
    const [navGroups, setNavGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const [virtualActions, setVirtualActions] = useState([]); // Reusable chunks
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const [targetFields, setTargetFields] = useState([]); // Fields for the target page (Ref Filter)

    // Form
    const [isCreating, setIsCreating] = useState(false);
    const [newAction, setNewAction] = useState(getInitialState('VIRTUAL_HOOK'));

    function getInitialState(source) {
        return {
            name: '',
            trigger_source: source,
            trigger_context: source === 'VIRTUAL_HOOK' ? uuidv4() : '',
            action_type: 'WEBHOOK',
            config: {}
        };
    }

    useEffect(() => {
        fetchEntities();
        fetchPages();
        fetchPages();
        fetchActions();
        fetchActions();
        fetchUsers();
        fetchVirtualActions();
    }, [activeTab]);

    // Effect to fetch target fields when NAVIGATE path changes
    useEffect(() => {
        if (newAction.action_type === 'NAVIGATE' && newAction.config.path) {
            fetchTargetPageFields(newAction.config.path);
        } else {
            setTargetFields([]);
        }
    }, [newAction.config.path, newAction.action_type]);

    const fetchTargetPageFields = async (path) => {
        // Path format: /app/page/{id}
        if (!path.startsWith('/app/page/')) return;
        const pageId = path.split('/').pop();
        
        // Find page to get entity_id
        // We need to look inside navGroups or flattened pages. We have 'pages'.
        const targetPage = pages.find(p => p.id === pageId);
        if (targetPage && targetPage.entity_id) {
            try {
                const { data } = await apiClient.get(`/api/builder/entities/${targetPage.entity_id}/fields`);
                setTargetFields(data);
            } catch (e) {
                console.error("Failed to fetch target fields", e);
            }
        } else {
            setTargetFields([]);
        }
    };

    const fetchEntities = async () => {
        const { data } = await apiClient.get('/api/builder/entities');
        setEntities(data);
    };

    const fetchPages = async () => {
        try {
            const { data } = await apiClient.get('/api/builder/navigation');
            setNavGroups(data); // Store groups for dropdowns
            
            // Flatten pages from groups for simple listing if needed
            const flatPages = [];
            data.forEach(group => {
                if(group.pages) flatPages.push(...group.pages);
            });
            setPages(flatPages);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchUsers = async () => {
        try {
            // For now using manager/admin endpoint or a simplified builder endpoint
            // Assuming /admin/users exists and returns list
            const { data } = await apiClient.get('/admin/users');
            setUsers(data);
        } catch (error) {
            console.log("Failed to fetch users for task assignment (might be non-admin)");
        }
    };

    const fetchVirtualActions = async () => {
        try {
            const { data } = await apiClient.get(`/api/builder/actions?trigger_source=VIRTUAL_HOOK`);
            setVirtualActions(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchActions = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/api/builder/actions?trigger_source=${activeTab}`);
            setActions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/api/builder/actions', newAction);
            setIsCreating(false);
            setNewAction(getInitialState(activeTab));
            fetchActions();
        } catch (error) {
            alert('Erro ao salvar: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Apagar esta ação?")) return;
        try {
            await apiClient.delete(`/api/builder/actions/${id}`);
            fetchActions();
        } catch (error) {
            alert('Erro ao deletar.');
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const renderConfigFields = () => {
        const type = newAction.action_type;
        
        switch (type) {
            case 'WEBHOOK':
                return (
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">URL do Webhook</label>
                        <input 
                            required 
                            type="url"
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={newAction.config.url || ''}
                            onChange={e => setNewAction({...newAction, config: {...newAction.config, url: e.target.value}})}
                            placeholder="https://..."
                        />
                    </div>
                );
            case 'CREATE_ITEM':
            case 'EDIT_ITEM':
            case 'DELETE_ITEM':
                return (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tabela Alvo</label>
                            <select 
                                required
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={newAction.config.entity_slug || ''}
                                onChange={e => setNewAction({...newAction, config: {...newAction.config, entity_slug: e.target.value}})}
                            >
                                <option value="">Selecione...</option>
                                {entities.map(e => <option key={e.id} value={e.slug}>{e.display_name}</option>)}
                            </select>
                        </div>
                        {type === 'CREATE_ITEM' && (
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Valores Padrão (JSON)</label>
                                <textarea 
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                                    rows={3}
                                    placeholder='{"status": "novo"}'
                                    value={JSON.stringify(newAction.config.defaults || {}, null, 2)}
                                    onChange={e => {
                                        try {
                                            const val = JSON.parse(e.target.value);
                                            setNewAction({...newAction, config: {...newAction.config, defaults: val}});
                                        } catch(e) {}
                                    }}
                                />
                            </div>
                        )}
                         {(type === 'EDIT_ITEM' || type === 'DELETE_ITEM') && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                <b>Nota:</b> O ID do registro deve ser enviado no payload do webhook como "id" ou "record_id".
                            </p>
                        )}
                    </div>
                );
            case 'EMAIL':
                 return (
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Para (Email)</label>
                        <input 
                            required 
                            type="email"
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={newAction.config.to_email || ''}
                            onChange={e => setNewAction({...newAction, config: {...newAction.config, to_email: e.target.value}})}
                            placeholder="exemplo@empresa.com"
                        />
                    </div>
                );
            case 'CREATE_TASK':
                 return (
                     <div className="space-y-3">
                         <div>
                             <label className="block text-sm font-medium mb-1 dark:text-gray-300">Título da Tarefa</label>
                             <input 
                                 required 
                                 className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                 value={newAction.config.title || ''}
                                 onChange={e => setNewAction({...newAction, config: {...newAction.config, title: e.target.value}})}
                                 placeholder="Ex: Revisar Pedido"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium mb-1 dark:text-gray-300">Responsável</label>
                             <select 
                                 required
                                 className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                 value={newAction.config.assignee_id || ''}
                                 onChange={e => setNewAction({...newAction, config: {...newAction.config, assignee_id: e.target.value}})}
                             >
                                 <option value="">Selecione um usuário...</option>
                                 {users.map(u => (
                                     <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                                 ))}
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descrição (Opcional)</label>
                             <textarea 
                                 className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                 rows={2}
                                 value={newAction.config.description || ''}
                                 onChange={e => setNewAction({...newAction, config: {...newAction.config, description: e.target.value}})}
                             />
                         </div>
                     </div>
                );
             case 'RUN_FLOW':
                 return (
                     <div>
                         <label className="block text-sm font-medium mb-1 dark:text-gray-300">Ações para Executar (Sequência)</label>
                         <div className="border rounded dark:border-gray-600 max-h-40 overflow-y-auto p-2 space-y-2">
                             {virtualActions.length === 0 && <p className="text-xs text-gray-400">Nenhuma ação virtual disponível.</p>}
                             {virtualActions.map(act => (
                                 <div key={act.id} className="flex items-center gap-2">
                                     <input 
                                         type="checkbox"
                                         id={`flow_${act.id}`}
                                         checked={(newAction.config.flow_actions || []).includes(act.id)}
                                         onChange={e => {
                                             const current = newAction.config.flow_actions || [];
                                             let next;
                                             if (e.target.checked) next = [...current, act.id];
                                             else next = current.filter(id => id !== act.id);
                                             setNewAction({...newAction, config: {...newAction.config, flow_actions: next}});
                                         }}
                                         className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                     />
                                     <label htmlFor={`flow_${act.id}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                         {act.name} <span className="text-xs text-gray-500">({act.action_type})</span>
                                     </label>
                                 </div>
                             ))}
                         </div>
                         <p className="text-xs text-gray-500 mt-1">
                             Selecione as ações virtuais que devem ser executadas em ordem.
                         </p>
                     </div>
                 );
             case 'NAVIGATE':
                 return (
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Página de Destino</label>
                        <select 
                            required 
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={newAction.config.path || ''}
                            onChange={e => setNewAction({...newAction, config: {...newAction.config, path: e.target.value}})}
                        >
                            <option value="">Selecione...</option>
                            {/* Dashboard is usually fixed, but we can add static options */}
                            <optgroup label="Sistema">
                                <option value="/app/dashboard">Dashboard</option>
                            </optgroup>
                            {navGroups.map(group => (
                                <optgroup key={group.id} label={group.name}>
                                    {group.pages?.map(page => (
                                        <option key={page.id} value={`/app/page/${page.id}`}>
                                            {page.name}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">O sistema irá navegar para a página selecionada.</p>
                        
                        <div className="mt-2 flex items-center gap-2">
                             <input 
                                type="checkbox" 
                                id="include_id"
                                checked={newAction.config.include_record_id || false}
                                onChange={e => setNewAction({...newAction, config: {...newAction.config, include_record_id: e.target.checked}})}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                             />
                             <label htmlFor="include_id" className="text-sm text-gray-700 dark:text-gray-300">
                                 Enviar ID do Registro selecionado (Query Param `record_id`)
                             </label>
                        </div>
                        
                        <div className="mt-2 flex items-center gap-2">
                             <input 
                                type="checkbox" 
                                id="ref_filter"
                                checked={newAction.config.ref_filter_enabled || false}
                                onChange={e => setNewAction({...newAction, config: {...newAction.config, ref_filter_enabled: e.target.checked}})}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                             />
                             <label htmlFor="ref_filter" className="text-sm text-gray-700 dark:text-gray-300">
                                 Filtrar por Referência (Master-Detail)
                             </label>
                        </div>

                        {newAction.config.ref_filter_enabled && (
                            <div className="mt-2 pl-6">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Campo na Tabela Destino</label>
                                <input
                                    type="text"
                                    placeholder="Ex: cliente_id"
                                    className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newAction.config.ref_filter_field || ''}
                                    onChange={e => setNewAction({...newAction, config: {...newAction.config, ref_filter_field: e.target.value}})}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Nome da coluna na tabela da página de destino que deve ser igual ao ID do registro atual.
                                </p>
                                
                                {targetFields.length > 0 ? (
                                    <select
                                        className="w-full mt-2 p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={newAction.config.ref_filter_field || ''}
                                        onChange={e => setNewAction({...newAction, config: {...newAction.config, ref_filter_field: e.target.value}})}
                                    >
                                        <option value="">Selecione o campo de referência...</option>
                                        {targetFields.map(f => (
                                            <option key={f.id} value={f.name}>
                                                {f.label} ({f.name})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="Ex: cliente_id"
                                        className="w-full mt-2 p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={newAction.config.ref_filter_field || ''}
                                        onChange={e => setNewAction({...newAction, config: {...newAction.config, ref_filter_field: e.target.value}})}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                );
             case 'FETCH_FIRST':
                 return (
                     <div className="space-y-3">
                         <p className="text-sm text-gray-500">Busca o primeiro registro da tabela vinculada à página e o exibe.</p>
                     </div>
                 );
             case 'XLSX':
             case 'PDF':
                 return (
                     <p className="text-sm text-gray-500">
                         {type === 'XLSX' ? 'Gera um Excel com os dados da lista atual.' : 'Gera um PDF da visualização atual.'}
                     </p>
                 );
            default:
                return null;
        }
    };

    const getBaseUrl = () => {
        // Tries to guess the API URL. Ideally from context.
        return window.location.origin.replace('3000', '8000') + '/api/engine/actions/virtual/';
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
                <Zap className="text-yellow-500" /> Gestão de Botões
            </h1>
            <p className="text-gray-500 mb-6">Configure botões, interações e webhooks de entrada.</p>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
                {[
                    { id: 'VIRTUAL_HOOK', icon: <Database size={16} />, label: 'Botões Virtuais (Webhook In)' },
                    { id: 'UI_BUTTON', icon: <MousePointer size={16} />, label: 'Botões de Página' },
                    { id: 'LIST_CLICK', icon: <Smartphone size={16} />, label: 'Interação de Página' },
                    { id: 'PAGE_LOAD', icon: <Zap size={16} />, label: 'Ao Carregar (Sem ID)' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setNewAction(getInitialState(tab.id)); setIsCreating(false); }}
                        className={`px-4 py-2 flex items-center gap-2 border-b-2 font-medium transition-colors ${
                            activeTab === tab.id 
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"
                >
                    <Plus size={18} /> Nova Ação
                </button>
            </div>

            <div className="flex-1 overflow-auto space-y-3">
                {actions.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-gray-500">
                        Nenhuma ação configurada neste modo.
                    </div>
                )}
                {actions.map(action => (
                    <div key={action.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {action.name}
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono text-gray-600 dark:text-gray-300">
                                        {action.action_type}
                                    </span>
                                </h3>
                                
                                {activeTab === 'VIRTUAL_HOOK' && (
                                    <div className="mt-2 text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                                        <code className="text-blue-600 truncate">{getBaseUrl() + action.trigger_context}</code>
                                        <button 
                                            onClick={() => copyToClipboard(getBaseUrl() + action.trigger_context, action.id)}
                                            className="text-gray-400 hover:text-blue-500"
                                            title="Copiar URL"
                                        >
                                            {copiedId === action.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                )}
                                
                                {activeTab !== 'VIRTUAL_HOOK' && (
                                    <div className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                                        <span>Página:</span>
                                        <span className="font-medium text-gray-600 dark:text-gray-300">
                                            {pages.find(p => p.id === action.trigger_context)?.name || 'Desconhecida/Deletada'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => handleDelete(action.id)} className="text-red-400 hover:text-red-600 p-1">
                                <Trash size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Nova Ação</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome da Ação</label>
                                <input 
                                    autoFocus
                                    required 
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Ex: Criar Cliente via Hook"
                                    value={newAction.name}
                                    onChange={e => setNewAction({...newAction, name: e.target.value})}
                                />
                            </div>

                            {/* Trigger Context Selector (Unless Virtual) */}
                            {activeTab !== 'VIRTUAL_HOOK' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Página Vinculada (Gatilho)</label>
                                    <select 
                                        required
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={newAction.trigger_context}
                                        onChange={e => setNewAction({...newAction, trigger_context: e.target.value})}
                                    >
                                        <option value="">Selecione a Página onde a ação ocorrerá...</option>
                                        {pages.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Defina em qual página esta ação será disparada.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tipo de Ação</label>
                                <select 
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newAction.action_type}
                                    onChange={e => setNewAction({...newAction, action_type: e.target.value, config: {}})}
                                >
                                    <optgroup label="Dados">
                                        <option value="CREATE_ITEM">Criar Novo Item</option>
                                        <option value="EDIT_ITEM">Editar Item Existente</option>
                                        <option value="DELETE_ITEM">Apagar Item</option>
                                    </optgroup>
                                    <optgroup label="Comunicação">
                                        <option value="EMAIL">Enviar Email</option>
                                        <option value="WEBHOOK">Chamar Webhook (Saída)</option>
                                        <option value="CREATE_TASK">Criar Tarefa (Usuário)</option>
                                    </optgroup>
                                    {activeTab !== 'VIRTUAL_HOOK' && (
                                        <optgroup label="Interface">
                                            <option value="NAVIGATE">Navegar para Página</option>
                                            <option value="RUN_FLOW">Executar Fluxo (Múltiplas Ações)</option>
                                            <option value="XLSX">Gerar Excel (Lista)</option>
                                            <option value="PDF">Gerar PDF</option>
                                            {activeTab === 'PAGE_LOAD' && <option value="FETCH_FIRST">Carregar Primeiro Registro</option>}
                                        </optgroup>
                                    )}
                                </select>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                {renderConfigFields()}
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <Save size={16} /> Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionManager;
