import React, { useState, useEffect } from 'react';
import { X, Plus, GripVertical, Trash2, Settings, Type } from 'lucide-react';
import apiClient from '../../api/apiClient';

/**
 * FieldLayoutModal
 * Permite selecionar, ordenar campos e adicionar textos fixos (separadores).
 */
const FieldLayoutModal = ({ isOpen, onClose, entityId, currentLayout, onSave }) => {
    const [availableFields, setAvailableFields] = useState([]);
    const [layout, setLayout] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchFields();
            // Inicializar layout com o que já existe ou vazio
            setLayout(currentLayout || []);
        }
    }, [isOpen, currentLayout]);

    const fetchFields = async () => {
        console.log("[FieldLayoutModal] Fetching fields for entityId:", entityId);
        try {
            const { data } = await apiClient.get(`/api/builder/entities/${entityId}/fields`);
            console.log("[FieldLayoutModal] Fields received:", data.length);
            setAvailableFields(data);
        } catch (error) {
            console.error("Failed to load fields", error);
        }
    };

    const addField = (field) => {
        if (layout.find(item => item.type === 'field' && item.name === field.name)) {
            alert("Este campo já foi adicionado.");
            return;
        }
        setLayout([...layout, { type: 'field', name: field.name, label: field.label }]);
    };

    const addDivider = () => {
        const text = window.prompt("Digite o texto do separador:");
        if (text) {
            setLayout([...layout, { type: 'divider', label: text }]);
        }
    };

    const removeItem = (index) => {
        const newLayout = [...layout];
        newLayout.splice(index, 1);
        setLayout(newLayout);
    };

    const moveItem = (index, direction) => {
        const newLayout = [...layout];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newLayout.length) return;
        
        const item = newLayout.splice(index, 1)[0];
        newLayout.splice(targetIndex, 0, item);
        setLayout(newLayout);
    };

    const handleSave = () => {
        onSave(layout);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Settings className="text-blue-600" size={20} />
                            Personalizar Layout da Ficha
                        </h3>
                        <p className="text-sm text-gray-500">Escolha os campos, organize a ordem e adicione separadores.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Lateral: Campos Disponíveis */}
                    <div className="w-1/3 border-right border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-black/20 p-4 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Campos da Tabela</label>
                            <button 
                                onClick={addDivider}
                                className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors font-bold uppercase"
                            >
                                <Type size={12} /> Add Separador
                            </button>
                        </div>
                        <div className="space-y-2">
                            {availableFields.map(field => (
                                <button
                                    key={field.id}
                                    onClick={() => addField(field)}
                                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-left hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all group"
                                >
                                    <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600">{field.label}</span>
                                    <Plus size={14} className="text-gray-400 group-hover:text-blue-600" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Centro: Layout Atual (Ordenação) */}
                    <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-900">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Visualização do Layout (Arraste não implementado, use setas)</label>
                        
                        {layout.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 italic text-center p-8">
                                <Plus size={32} className="mb-2 opacity-20" />
                                <p>Nenhum campo selecionado.<br/>O padrão (todos os campos) será usado.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {layout.map((item, index) => (
                                    <div 
                                        key={index}
                                        className={`flex items-center gap-3 p-3 border rounded-lg shadow-sm transition-all ${
                                            item.type === 'divider' 
                                            ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30' 
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <button 
                                                onClick={() => moveItem(index, -1)}
                                                disabled={index === 0}
                                                className="text-gray-400 hover:text-blue-600 disabled:opacity-0 transition-colors"
                                            >
                                                <GripVertical size={16} />
                                            </button>
                                        </div>
                                        
                                        <div className="flex-1">
                                            {item.type === 'divider' ? (
                                                <div className="flex items-center gap-2">
                                                    <Type size={14} className="text-blue-500" />
                                                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{item.label}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.label}</span>
                                            )}
                                        </div>

                                        <button 
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <button 
                        onClick={() => setLayout([])}
                        className="text-sm text-red-600 hover:underline font-medium"
                    >
                        Limpar Tudo (Padrão)
                    </button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                        >
                            Salvar Layout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FieldLayoutModal;
