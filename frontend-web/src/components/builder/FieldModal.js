import React, { useState } from 'react';
import apiClient from '../../api/apiClient';

const FieldModal = ({ isOpen, onClose, entity, onFieldCreated }) => {
    const [fieldData, setFieldData] = useState({
        name: '',
        label: '',
        field_type: 'text',
        is_required: false,
        options: []
    });

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!entity || !fieldData.label) return;
        try {
            const slug = fieldData.label.toLowerCase().replace(/[^a-z0-9_]/g, '_');

            await apiClient.post(`/api/builder/entities/${entity.id}/fields`, {
                ...fieldData,
                name: slug
            });

            setFieldData({ name: '', label: '', field_type: 'text', is_required: false, options: [] });
            onClose();
            if (onFieldCreated) onFieldCreated();
        } catch (error) {
            alert("Erro ao criar campo: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
            <div className="bg-white dark:bg-gray-900 w-96 h-full shadow-2xl p-6 border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold dark:text-white">Novo Campo</h3>
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
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white"
                            value={fieldData.field_type}
                            onChange={(e) => setFieldData({ ...fieldData, field_type: e.target.value })}
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
                        </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="req"
                            checked={fieldData.is_required}
                            onChange={(e) => setFieldData({ ...fieldData, is_required: e.target.checked })}
                        />
                        <label htmlFor="req" className="text-sm dark:text-gray-300">Obrigatório?</label>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">Cancelar</button>
                    <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Criar Campo</button>
                </div>
            </div>
        </div>
    );
};

export default FieldModal;
