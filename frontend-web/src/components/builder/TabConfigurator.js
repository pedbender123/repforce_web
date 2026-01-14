import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, GripVertical } from 'lucide-react';
import apiClient from '../../api/apiClient';

const TabConfigurator = ({ isOpen, onClose, onSave, currentTabs = [] }) => {
    const [tabs, setTabs] = useState(currentTabs);
    const [infoMessage, setInfoMessage] = useState('');
    
    // Remote Data
    const [entities, setEntities] = useState([]);
    const [entityFields, setEntityFields] = useState({}); // Cache: { entityId: [fields] }
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTabs(currentTabs);
            fetchEntities();
        }
    }, [isOpen, currentTabs]);

    const fetchEntities = async () => {
        try {
            const { data } = await apiClient.get('/api/builder/entities');
            setEntities(data);
        } catch (error) {
            console.error("Failed to load entities", error);
        }
    };

    const fetchFields = async (entityId) => {
        if (entityFields[entityId]) return; // Use cache
        try {
            const { data } = await apiClient.get(`/api/builder/entities/${entityId}/fields`);
            setEntityFields(prev => ({ ...prev, [entityId]: data }));
        } catch (error) {
            console.error(`Failed to load fields for ${entityId}`, error);
        }
    };

    const handleAddTab = () => {
        setTabs([...tabs, { id: Date.now(), label: 'Nova Aba', target_entity: '', filter_column: '', is_active: true }]);
    };

    const handleRemoveTab = (idx) => {
        setTabs(tabs.filter((_, i) => i !== idx));
    };

    const handleChange = (idx, field, value) => {
        const updated = [...tabs];
        updated[idx] = { ...updated[idx], [field]: value };
        setTabs(updated);

        // Convert slug/id mapping if needed. Just storing what is selected.
        if (field === 'target_entity') {
            // Trigger field fetch
            fetchFields(value); 
            // Reset filter column if entity changes
            updated[idx].filter_column = ''; 
        }
    };

    const handleSave = () => {
        onSave(tabs);
        onClose();
    };

    // Pre-load fields for existing tabs
    useEffect(() => {
        if (entities.length > 0 && tabs.length > 0) {
            tabs.forEach(t => {
                if (t.target_entity) fetchFields(t.target_entity);
            });
        }
    }, [entities, tabs]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configurar Abas (Visão 360°)</h2>
                        <p className="text-sm text-gray-500 mt-1">Defina quais tabelas relacionadas aparecerão na visualização deste registro.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                    <div className="space-y-4">
                        {tabs.map((tab, idx) => (
                            <div key={tab.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-start md:items-center group">
                                <div className="p-2 cursor-move text-gray-400 hover:text-gray-600">
                                    <GripVertical size={16} />
                                </div>
                                
                                {/* Label */}
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome da Aba</label>
                                    <input 
                                        type="text" 
                                        value={tab.label}
                                        onChange={(e) => handleChange(idx, 'label', e.target.value)}
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="Ex: Pedidos"
                                    />
                                </div>

                                {/* Entity Select */}
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tabela Relacionada</label>
                                    <select
                                        value={tab.target_entity}
                                        onChange={(e) => handleChange(idx, 'target_entity', e.target.value)}
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    >
                                        <option value="">Selecione...</option>
                                        {entities.map(ent => (
                                            <option key={ent.id} value={ent.id}>{ent.display_name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filter Column Select */}
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Coluna de Filtro (Nela)</label>
                                    <select
                                        value={tab.filter_column}
                                        onChange={(e) => handleChange(idx, 'filter_column', e.target.value)}
                                        disabled={!tab.target_entity}
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:opacity-50"
                                    >
                                        <option value="">Selecione...</option>
                                        {(entityFields[tab.target_entity] || []).map(f => (
                                            <option key={f.id} value={f.name}>{f.label} ({f.name})</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-400">Esta coluna deve conter o ID do registro atual.</p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-5">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={tab.is_active}
                                            onChange={(e) => handleChange(idx, 'is_active', e.target.checked)}
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Ativa</span>
                                    </label>
                                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"/>
                                    <button 
                                        onClick={() => handleRemoveTab(idx)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {tabs.length === 0 && (
                            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                Nenhuma aba configurada.
                            </div>
                        )}

                        <button 
                            onClick={handleAddTab}
                            className="w-full py-3 border-2 border-dashed border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-medium flex items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            Adicionar Nova Aba
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm hover:shadow-md"
                    >
                        <Save size={18} />
                        Salvar Configuração
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TabConfigurator;
