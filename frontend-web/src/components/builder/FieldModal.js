import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Plus, Trash } from 'lucide-react';

const FieldModal = ({ isOpen, onClose, entity, onFieldCreated, initialData }) => {
    const [fieldData, setFieldData] = useState({
        name: '',
        label: '',
        field_type: 'text',
        is_required: false,
        options: [] // Array for select, Object for ref
    });
    const [entities, setEntities] = useState([]);
    const [newOption, setNewOption] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchEntities();
            if (initialData) {
                setFieldData({
                    ...initialData
                });
            } else {
                setFieldData({
                    name: '',
                    label: '',
                    field_type: 'text',
                    is_required: false,
                    options: []
                });
            }
        }
    }, [isOpen, initialData]);

    const fetchEntities = async () => {
        try {
            const { data } = await apiClient.get('/api/builder/entities');
            setEntities(data);
        } catch (error) {
            console.error("Failed to load entities", error);
        }
    };

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!entity || !fieldData.label) return;
        try {
            if (initialData) {
                 // Update
                 await apiClient.patch(`/api/builder/entities/${entity.id}/fields/${initialData.id}`, {
                    label: fieldData.label,
                    // name: fieldData.name (We could allow rename if we want, but let's stick to label for simplicity unless slug changes logic is robust)
                 });
            } else {
                // Create
                const slug = fieldData.label.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                await apiClient.post(`/api/builder/entities/${entity.id}/fields`, {
                    ...fieldData,
                    name: slug
                });
            }

            onClose();
            if (onFieldCreated) onFieldCreated();
        } catch (error) {
            alert("Erro ao salvar campo: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
            <div className="bg-white dark:bg-gray-900 w-96 h-full shadow-2xl p-6 border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold dark:text-white">{initialData ? 'Editar Campo' : 'Novo Campo'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nome do Campo (Label)</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white"
                            value={fieldData.label}
                            onChange={(e) => setFieldData({ ...fieldData, label: e.target.value })}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Dado</label>
                        <select
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white disabled:opacity-50"
                            value={fieldData.field_type}
                            onChange={(e) => setFieldData({ ...fieldData, field_type: e.target.value })}
                            disabled={!!initialData} 
                        >
                            <option value="text">Texto Curto</option>
                            <option value="long_text">Texto Longo</option>
                            <option value="number">Número</option>
                            <option value="currency">Moeda (R$)</option>
                            <option value="date">Data</option>
                            <option value="boolean">Sim/Não</option>
                            <option value="select">Seleção (Dropdown)</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="email">Email</option>
                            <option value="ref">Referência (Outra Tabela)</option>
                        </select>
                        {initialData && <p className="text-xs text-yellow-600 mt-1">O tipo não pode ser alterado após criação.</p>}
                    </div>

                    {/* Options Editor for Select */}
                    {fieldData.field_type === 'select' && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                            <label className="block text-xs font-medium text-gray-500 mb-2">Opções de Seleção</label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    className="flex-1 p-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Nova opção..."
                                    value={newOption}
                                    onChange={e => setNewOption(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (newOption.trim()) {
                                                const current = Array.isArray(fieldData.options) ? fieldData.options : [];
                                                setFieldData({...fieldData, options: [...current, newOption.trim()]});
                                                setNewOption('');
                                            }
                                        }
                                    }}
                                />
                                <button 
                                    type="button"
                                    onClick={() => {
                                        if (newOption.trim()) {
                                            const current = Array.isArray(fieldData.options) ? fieldData.options : [];
                                            setFieldData({...fieldData, options: [...current, newOption.trim()]});
                                            setNewOption('');
                                        }
                                    }}
                                    className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {(Array.isArray(fieldData.options) ? fieldData.options : []).map((opt, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-700 p-1.5 rounded border border-gray-100 dark:border-gray-600 text-sm">
                                        <span className="dark:text-gray-200">{opt}</span>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const current = Array.isArray(fieldData.options) ? fieldData.options : [];
                                                setFieldData({...fieldData, options: current.filter((_, i) => i !== idx)});
                                            }}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Target Entity for Ref */}
                    {fieldData.field_type === 'ref' && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                             <label className="block text-xs font-medium text-gray-500 mb-1">Tabela de Origem</label>
                             <select
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white"
                                value={fieldData.options?.ref_entity_id || ''}
                                onChange={e => setFieldData({...fieldData, options: { ref_entity_id: e.target.value }})}
                             >
                                 <option value="">Selecione a tabela...</option>
                                 {entities.filter(e => e.id !== entity?.id).map(ent => (
                                     <option key={ent.id} value={ent.id}>{ent.display_name}</option>
                                 ))}
                             </select>
                             <p className="text-xs text-gray-400 mt-1">Este campo armazenará o ID de um registro da tabela selecionada.</p>
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="req"
                            checked={fieldData.is_required}
                            onChange={(e) => setFieldData({ ...fieldData, is_required: e.target.checked })}
                            disabled={!!initialData} // Disable required change for now because SchemaManager add_column handles it, but update doesn't yet (ALTER COLUMN SET NOT NULL is complex without data check)
                        />
                        <label htmlFor="req" className="text-sm dark:text-gray-300">Obrigatório?</label>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        {initialData ? 'Salvar Alterações' : 'Criar Campo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FieldModal;
