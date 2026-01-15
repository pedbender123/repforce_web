import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Plus, Trash, ExternalLink, Activity, Webhook, Info } from 'lucide-react';

const WorkflowManager = ({ entityId }) => {
    const [workflows, setWorkflows] = useState([]);
    const [entities, setEntities] = useState([]);
    const [selectedEntityId, setSelectedEntityId] = useState(entityId || '');
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [isCreating, setIsCreating] = useState(false);
    const [newWf, setNewWf] = useState({
        name: '',
        trigger_type: 'ON_CREATE',
        webhook_url: '',
        is_active: true
    });

    useEffect(() => {
        fetchData();
        if (!entityId) fetchEntities();
    }, [entityId, selectedEntityId]);

    const fetchEntities = async () => {
        try {
            const { data } = await apiClient.get('/api/builder/entities');
            setEntities(data);
            if (data.length > 0 && !selectedEntityId) setSelectedEntityId(data[0].id);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchData = async () => {
        if (!selectedEntityId && !entityId) return;
        setLoading(true);
        try {
            const targetId = entityId || selectedEntityId;
            const { data } = await apiClient.get(`/api/builder/workflows?entity_id=${targetId}`);
            setWorkflows(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/api/builder/workflows', {
                ...newWf,
                entity_id: entityId || selectedEntityId
            });
            setIsCreating(false);
            setNewWf({ name: '', trigger_type: 'ON_CREATE', webhook_url: '', is_active: true });
            fetchData();
        } catch (error) {
            alert("Erro ao salvar: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja apagar este workflow?")) return;
        try {
            await apiClient.delete(`/api/builder/workflows/${id}`);
            fetchData();
        } catch (error) {
            alert("Erro ao deletar: " + error.message);
        }
    };

    const getTriggerBadge = (type) => {
        const styles = {
            'ON_CREATE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            'ON_UPDATE': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            'ON_DELETE': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        };
        const labels = {
            'ON_CREATE': 'Criado',
            'ON_UPDATE': 'Editado',
            'ON_DELETE': 'Apagado'
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold ${styles[type] || 'bg-gray-100'}`}>
                {labels[type] || type}
            </span>
        );
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <Webhook className="text-blue-600" /> Webhooks (Saída)
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Configure webhooks para notificar sistemas externos sobre mudanças nos dados.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={18} /> Novo Webhook
                </button>
            </div>

            {/* Entity Selector (If Global) */}
            {!entityId && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecione a Tabela:</label>
                    <select
                        className="w-full max-w-sm p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
                        value={selectedEntityId}
                        onChange={(e) => setSelectedEntityId(e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {entities.map(e => <option key={e.id} value={e.id}>{e.display_name}</option>)}
                    </select>
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-auto space-y-3">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Carregando automações...</div>
                ) : workflows.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                        <Activity className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma automação ativa</h3>
                        <p className="text-gray-500">Adicione um webhook para integrar com n8n, Zapier, etc.</p>
                    </div>
                ) : (
                    workflows.map(wf => (
                        <div key={wf.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{wf.name || 'Sem nome'}</h3>
                                    {getTriggerBadge(wf.trigger_type)}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-mono bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded w-fit">
                                    <span className="text-blue-500">POST</span>
                                    <span className="truncate max-w-md" title={wf.webhook_url}>{wf.webhook_url}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(wf.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Config & Hint */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <Info className="text-blue-600 dark:text-blue-400 mt-0.5" size={20} />
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-bold mb-1">Como funciona?</p>
                        <p>Ao realizar a ação configurada (Ex: Criar Cliente), o sistema enviará um POST para a URL com um JSON contendo os dados do registro, usuário que realizou a ação e timestamp.</p>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Nova Automação</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nome</label>
                                <input
                                    required
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Ex: Enviar para n8n"
                                    value={newWf.name}
                                    onChange={e => setNewWf({ ...newWf, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Gatilho (Trigger)</label>
                                <select
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newWf.trigger_type}
                                    onChange={e => setNewWf({ ...newWf, trigger_type: e.target.value })}
                                >
                                    <option value="ON_CREATE">Ao Criar Item</option>
                                    <option value="ON_UPDATE">Ao Editar Item</option>
                                    <option value="ON_DELETE">Ao Apagar Item</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Webhook URL (POST)</label>
                                <input
                                    required
                                    type="url"
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                                    placeholder="https://n8n.seu-dominio.com/webhook/..."
                                    value={newWf.webhook_url}
                                    onChange={e => setNewWf({ ...newWf, webhook_url: e.target.value })}
                                />
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
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Salvar Automação
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowManager;
