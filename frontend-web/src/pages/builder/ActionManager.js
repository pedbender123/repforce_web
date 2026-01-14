import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { 
    MousePointer, Smartphone, Zap, Plus, Trash, Save, 
    ExternalLink, Copy, Check, FileText, Mail, Database, GitBranch, Settings 
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const ActionManager = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('UI_BUTTON'); // UI_BUTTON, LIST_CLICK, PAGE_LOAD, VIRTUAL_HOOK
    const [actions, setActions] = useState([]);
    const [pages, setPages] = useState([]); // Contexts
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    // Form
    const [isCreating, setIsCreating] = useState(false);
    const [newAction, setNewAction] = useState(getInitialState('UI_BUTTON'));

    function getInitialState(source) {
        return {
            name: '',
            trigger_source: source,
            trigger_context: source === 'VIRTUAL_HOOK' ? uuidv4() : '',
            icon: 'Zap',
            style_variant: 'primary',
            config: {} // Vazio, pois a lógica agora é na Trilha
        };
    }

    useEffect(() => {
        fetchPages();
    }, []);

    useEffect(() => {
        fetchActions();
    }, [activeTab]);

    const fetchPages = async () => {
        try {
            const { data } = await apiClient.get('/api/builder/navigation');
            // Flatten pages from groups
            const flatPages = [];
            data.forEach(group => {
                if(group.pages) flatPages.push(...group.pages);
            });
            setPages(flatPages);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchActions = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/api/builder/actions?trigger_source=${activeTab}`);
            if (Array.isArray(data)) {
                setActions(data);
            } else {
                 console.warn("API returned invalid actions data:", data);
                 setActions([]);
            }
        } catch (error) {
            console.error(error);
            setActions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Save the Action (Trigger Definition)
            const { data: action } = await apiClient.post('/api/builder/actions', newAction);
            
            // Auto-create a Trail for this Action?
            // For now, just refresh list. User will click "Criar Trilha" to link.
            // Or better: Redirect immediately to Trail Builder?
            // Let's keep it manual for safety unless user wants immediate jump.
            
            setIsCreating(false);
            setNewAction(getInitialState(activeTab));
            fetchActions();
        } catch (error) {
            alert('Erro ao salvar: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Apagar este gatilho? A trilha associada (se houver) não será apagada.")) return;
        try {
            await apiClient.delete(`/api/builder/actions/${id}`);
            fetchActions();
        } catch (error) {
            alert('Erro ao deletar.');
        }
    };

    const navigateToTrail = async (action) => {
        // If action has a trail_id (backend should return it), go there.
        // If not, we trigger a "Create Trail" for this action first.
        
        if (action.trail_id) {
            setSearchParams({ tab: 'trails', trailId: action.trail_id });
        } else {
            // Create a trail on the fly
             try {
                const { data: trail } = await apiClient.post('/api/builder/trails', {
                    name: `Fluxo: ${action.name}`,
                    description: `Automação disparada por ${action.trigger_source}`,
                    trigger_type: 'ACTION',
                    trigger_config: { action_id: action.id },
                    is_active: true
                });
                // Update local list to reflet linking (optional but good)
                setSearchParams({ tab: 'trails', trailId: trail.id });
                fetchActions(); // Refresh to get the link
            } catch (error) {
                console.error("Error creating trail for action", error);
                alert("Erro ao criar trilha para este gatilho.");
            }
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getBaseUrl = () => {
         // Fallback logic for webhook URL display
        return window.location.origin.replace('3000', '8000') + '/api/hooks/';
    };

    return (
        <div className="p-6 h-full flex flex-col max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
                <MousePointer className="text-blue-500" /> Gestor de Botões & Gatilhos
            </h1>
            <p className="text-gray-500 mb-6">Defina pontos de entrada (Botões, Webhooks) e conecte-os a Trilhas de Automação.</p>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
                {[
                    { id: 'UI_BUTTON', icon: <MousePointer size={16} />, label: 'Botões em Páginas' },
                    { id: 'LIST_CLICK', icon: <Smartphone size={16} />, label: 'Cliques na Lista' },
                    { id: 'PAGE_LOAD', icon: <Zap size={16} />, label: 'Ao Carregar' },
                    { id: 'VIRTUAL_HOOK', icon: <Database size={16} />, label: 'Gatilhos Externos (Webhook)' },
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
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                >
                    <Plus size={18} /> Novo Gatilho
                </button>
            </div>

            <div className="flex-1 overflow-auto space-y-3 pb-20">
                {actions.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-gray-500">
                        Nenhum gatilho configurado neste modo.
                    </div>
                )}
                {actions.map(action => (
                    <div key={action.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${action.trail_id ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {activeTab === 'VIRTUAL_HOOK' ? <Database size={20} /> : <MousePointer size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {action.name}
                                        {action.trail_id && (
                                            <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1">
                                                <Zap size={10} fill="currentColor" /> Automatizado
                                            </span>
                                        )}
                                    </h3>
                                    
                                    <div className="text-sm text-gray-500 mt-0.5">
                                        {activeTab === 'VIRTUAL_HOOK' ? (
                                            <div className="flex items-center gap-2">
                                                 <code className="text-xs bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">{action.trigger_context}</code>
                                                 <button onClick={() => copyToClipboard(getBaseUrl() + action.trigger_context, action.id)} className="hover:text-blue-500">
                                                     {copiedId === action.id ? <Check size={14} /> : <Copy size={14} />}
                                                 </button>
                                            </div>
                                        ) : (
                                            <span>Local: {pages.find(p => p.id === action.trigger_context)?.name || 'Desconhecido'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => navigateToTrail(action)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                        action.trail_id 
                                            ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300' 
                                            : 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100'
                                    }`}
                                >
                                    <GitBranch size={16} />
                                    {action.trail_id ? 'Editar Lógica' : 'Criar Automação'}
                                </button>
                                
                                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                                <button onClick={() => handleDelete(action.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <Trash size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Criação Simplificado */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold dark:text-white">Novo Gatilho</h2>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome do Botão / Gatilho</label>
                                <input 
                                    autoFocus
                                    required 
                                    className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder={activeTab === 'VIRTUAL_HOOK' ? "Ex: Webhook Integração CRM" : "Ex: Aprovar Pedido"}
                                    value={newAction.name}
                                    onChange={e => setNewAction({...newAction, name: e.target.value})}
                                />
                            </div>

                            {/* Trigger Context Selector (Unless Virtual) */}
                            {activeTab !== 'VIRTUAL_HOOK' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Onde será exibido?</label>
                                    <select 
                                        required
                                        className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={newAction.trigger_context}
                                        onChange={e => setNewAction({...newAction, trigger_context: e.target.value})}
                                    >
                                        <option value="">Selecione a Página...</option>
                                        {pages.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {activeTab === 'UI_BUTTON' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Ícone (Lucide)</label>
                                        <input 
                                            className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Ex: Check, User, Mail"
                                            value={newAction.icon || ''}
                                            onChange={e => setNewAction({...newAction, icon: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Estilo</label>
                                        <select 
                                            className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={newAction.style_variant || 'primary'}
                                            onChange={e => setNewAction({...newAction, style_variant: e.target.value})}
                                        >
                                            <option value="primary">Azul (Destaque)</option>
                                            <option value="secondary">Cinza (Padrão)</option>
                                            <option value="danger">Vermelho (Perigo)</option>
                                            <option value="success">Verde (Sucesso)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3 mt-4">
                                <Zap className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" size={18} />
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                    Ao salvar, você poderá configurar a <b>Trilha de Automação</b> que definirá o que acontece quando este gatilho for acionado.
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                                >
                                    <Save size={18} /> Salvar Gatilho
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
