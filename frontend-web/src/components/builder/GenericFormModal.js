import React, { useState } from 'react';
import apiClient from '../../api/apiClient';
import { X, Loader2, Save } from 'lucide-react';

const GenericFormModal = ({ isOpen, onClose, entitySlug, fields, onSuccess }) => {
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiClient.post(`/api/engine/object/${entitySlug}`, formData);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            alert("Erro ao criar registro: " + (error.response?.data?.detail || error.message));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Novo Registro</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto">
                    <form id="generic-form" onSubmit={handleSubmit} className="space-y-4">
                        {fields.map(field => (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {field.label} {field.is_required && <span className="text-red-500">*</span>}
                                </label>
                                
                                {field.field_type === 'select' ? (
                                    <select
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        required={field.is_required}
                                    >
                                        <option value="">Selecione...</option>
                                        {field.options?.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : field.field_type === 'list_ref' ? (
                                    <div className="space-y-1">
                                        <select
                                            multiple
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow h-32"
                                            value={Array.isArray(formData[field.name]) ? formData[field.name] : []}
                                            onChange={(e) => {
                                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                handleChange(field.name, selected);
                                            }}
                                            required={field.is_required && (!formData[field.name] || formData[field.name].length === 0)}
                                        >
                                            {field.options?.map((opt, idx) => {
                                                const optLab = typeof opt === 'object' ? (opt.label || opt.name || opt.nome) : opt;
                                                const optVal = typeof opt === 'object' ? (opt.value || opt.id) : opt;
                                                return <option key={idx} value={optVal}>{optLab}</option>;
                                            })}
                                        </select>
                                        <p className="text-xs text-gray-400">Segure Ctrl (ou Cmd) para selecionar múltiplos.</p>
                                    </div>
                                ) : (
                                    <input
                                        type={field.field_type === 'number' ? 'number' : field.field_type === 'password' ? 'password' : 'text'}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        required={field.is_required}
                                        placeholder={`Digite ${field.label}...`}
                                    />
                                )}
                            </div>
                        ))}
                        
                        {fields.length === 0 && (
                            <p className="text-center text-gray-500 py-4">Nenhum campo definido para esta tabela.</p>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors font-medium text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        form="generic-form"
                        disabled={saving || fields.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenericFormModal;
