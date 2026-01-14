import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

const NavigationPageModal = ({ isOpen, onClose, groupId, onPageCreated }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('list');
    const [entityId, setEntityId] = useState('');
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchEntities();
            setName('');
            setType('list');
            setEntityId('');
        }
    }, [isOpen]);

    const fetchEntities = async () => {
        try {
            const { data } = await apiClient.get('/api/builder/entities');
            setEntities(data);
            if (data.length > 0) setEntityId(data[0].id);
        } catch (error) {
            console.error("Failed to load entities", error);
        }
    };

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!name || !groupId) return;
        setLoading(true);
        try {
            await apiClient.post(`/api/builder/navigation/groups/${groupId}/pages`, {
                name,
                type,
                entity_id: entityId || null,
                layout_config: {}, // Empty for now
                order: 0
            });
            onClose();
            if (onPageCreated) onPageCreated();
        } catch (error) {
            alert("Erro ao criar página: " + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Nova Página</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nome da Página</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Página</label>
                        <select
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="list">Lista Modificável (Padrão)</option>
                            <option value="list_readonly">Lista de Consulta (Sem Botão Novo)</option>
                            <option value="list_custom">Lista com Botão Personalizado</option>
                            <option value="dashboard">Dashboard</option>
                            <option value="blank">Em Branco (Apenas Título)</option>
                        </select>
                    </div>
                    
                    {/* Show Entity Select for relevant types */}
                    {['list', 'list_readonly', 'list_custom', 'blank'].includes(type) && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tabela Vinculada</label>
                            <select
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white"
                                value={entityId}
                                onChange={(e) => setEntityId(e.target.value)}
                            >
                                <option value="">Selecione uma tabela...</option>
                                {entities.map(ent => (
                                    <option key={ent.id} value={ent.id}>{ent.display_name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Cancelar</button>
                    <button onClick={handleCreate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Criando...' : 'Criar Página'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NavigationPageModal;
