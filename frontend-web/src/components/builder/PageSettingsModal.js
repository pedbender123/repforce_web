import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

import { Plus, Trash2 } from 'lucide-react';

const PageSettingsModal = ({ isOpen, onClose, page, onUpdate }) => {
    const [name, setName] = useState('');
    const [isHidden, setIsHidden] = useState(false);
    const [filters, setFilters] = useState([]); // Array of { key: '', value: '' }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && page) {
            setName(page.name);
            setIsHidden(page.layout_config?.is_hidden || false);

            
            // Convert Object to Array for UI
            const pf = page.layout_config?.permanent_filters || {};
            const filterArray = Object.entries(pf).map(([k, v]) => ({ key: k, value: v }));
            setFilters(filterArray);
        }
    }, [isOpen, page]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            // Convert Array back to Object
            const parsedFilters = filters.reduce((acc, curr) => {
                if (curr.key && curr.value) acc[curr.key] = curr.value;
                return acc;
            }, {});

            const newLayoutConfig = {
                ...(page.layout_config || {}),
                permanent_filters: parsedFilters,
                is_hidden: isHidden
            };

            await apiClient.put(`/api/builder/navigation/pages/${page.id}`, {
                name,
                layout_config: newLayoutConfig
            });

            onUpdate();
            onClose();
        } catch (error) {
            alert("Erro ao salvar: " + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("ATENÇÃO: Tem certeza que deseja excluir esta página? Esta ação não pode ser desfeita.")) return;
        
        setLoading(true);
        try {
            await apiClient.delete(`/api/builder/navigation/pages/${page.id}`);
            if (onClose) onClose();
            if (onUpdate) onUpdate({ deleted: true });
        } catch (error) {
            alert("Erro ao excluir página: " + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    const addFilter = () => {
        setFilters([...filters, { key: '', value: '' }]);
    };

    const removeFilter = (index) => {
        const newFilters = [...filters];
        newFilters.splice(index, 1);
        setFilters(newFilters);
    };

    const updateFilter = (index, field, val) => {
        const newFilters = [...filters];
        newFilters[index][field] = val;
        setFilters(newFilters);
    };

    const isRecordPage = ['ficha_simples', 'form', 'form_page'].includes(page?.type);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[800px] h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex-none mb-4">
                    <h3 className="text-lg font-bold dark:text-white">Configurar Página: {page?.name} ({page?.type})</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {/* General Settings */}
                    <div className="p-4 border border-gray-100 dark:border-gray-700 rounded bg-gray-50/50 dark:bg-gray-800/50">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Geral</label>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Nome da Página</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                             <input 
                                type="checkbox" 
                                id="isHidden" 
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={isHidden}
                                onChange={(e) => setIsHidden(e.target.checked)} 
                             />
                             <label htmlFor="isHidden" className="text-sm text-gray-700 dark:text-gray-300 select-none">Ocultar da Navegação</label>
                        </div>
                    </div>


                    
                    {/* Filters - ONLY FOR Lists and Dashboards (NOT Record Pages) */}
                    {!isRecordPage && (
                        <div className="p-4 border border-gray-100 dark:border-gray-700 rounded bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase">Filtros Permanentes</label>
                                <button onClick={addFilter} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800">
                                    <Plus size={12} /> Adicionar
                                </button>
                            </div>
                            
                            {filters.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">Nenhum filtro configurado.</p>
                            ) : (
                                <div className="space-y-2">
                                    {filters.map((f, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input 
                                                className="w-1/3 text-xs p-2 border rounded dark:bg-gray-900 dark:text-white"
                                                placeholder="Campo (ex: status)"
                                                value={f.key}
                                                onChange={e => updateFilter(idx, 'key', e.target.value)}
                                            />
                                            <input 
                                                className="flex-1 text-xs p-2 border rounded dark:bg-gray-900 dark:text-white"
                                                placeholder="Valor ou Fórmula (ex: {me}, ativo)"
                                                value={f.value}
                                                onChange={e => updateFilter(idx, 'value', e.target.value)}
                                            />
                                            <button onClick={() => removeFilter(idx)} className="text-red-500 hover:text-red-700 p-1">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-[10px] text-gray-400 mt-2">
                                Use chaves para variáveis de contexto: <code>{`{me}`}</code> para ID do usuário atual.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex-none mt-6 flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                     {/* Botão Deletar (Esquerda) */}
                    <button 
                        onClick={handleDelete} 
                        className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded border border-transparent hover:border-red-200 transition-colors text-sm font-medium"
                    >
                        Deletar Página
                    </button>

                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Cancelar</button>
                        <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageSettingsModal;
