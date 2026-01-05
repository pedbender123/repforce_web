import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X, RotateCcw } from 'lucide-react';

const DynamicForm = ({ entity, recordId, onCancel, onSuccess }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});

    // 1. Fetch Metadata
    const { data: meta, isLoading: isMetaLoading } = useQuery({
        queryKey: ['metadata', entity],
        queryFn: async () => {
            const response = await apiClient.get(`/v1/engine/metadata/${entity}`);
            return response.data;
        }
    });

    // 2. Fetch Existing Record if Edit Mode
    const { data: record, isLoading: isRecordLoading } = useQuery({
        queryKey: ['record', entity, recordId],
        queryFn: async () => {
            const response = await apiClient.get(`/v1/engine/${entity}/${recordId}`);
            return response.data;
        },
        enabled: !!recordId
    });

    // Populate form data when record is loaded
    useEffect(() => {
        if (record) {
            setFormData(record);
        }
    }, [record]);

    // 3. Save Mutation
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (recordId) {
                return await apiClient.put(`/v1/engine/${entity}/${recordId}`, data);
            } else {
                return await apiClient.post(`/v1/engine/${entity}`, data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['data', entity]);
            onSuccess();
        }
    });

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic Validation
        const newErrors = {};
        meta.fields.forEach(f => {
            if (f.is_required && !formData[f.name]) {
                newErrors[f.name] = 'Campo obrigatório';
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        saveMutation.mutate(formData);
    };

    if (isMetaLoading || (recordId && isRecordLoading)) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow max-w-4xl mx-auto">
            <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold dark:text-white">
                    {recordId ? 'Editar' : 'Novo'} {meta.display_name}
                </h2>
                <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {meta.fields.map(field => (
                        <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {field.label} {field.is_required && <span className="text-red-500">*</span>}
                            </label>
                            {renderInput(field, formData[field.name], (val) => handleChange(field.name, val))}
                            {errors[field.name] && <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>}
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                    >
                        {saveMutation.isPending ? 'Salvando...' : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

const renderInput = (field, value, onChange) => {
    const baseClasses = "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm px-3 py-2 outline-none";

    switch (field.type) {
        case 'number':
        case 'currency':
            return (
                <input
                    type="number"
                    step={field.type === 'currency' ? '0.01' : '1'}
                    className={baseClasses}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
        case 'date':
            return (
                <input
                    type="date"
                    className={baseClasses}
                    value={value ? value.split('T')[0] : ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
        case 'boolean':
            return (
                <div className="flex items-center mt-2">
                    <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Ativado</span>
                </div>
            );
        case 'select':
            return (
                <select
                    className={baseClasses}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">Selecione...</option>
                    {field.options?.choices?.map(choice => (
                        <option key={choice.value} value={choice.value}>{choice.label}</option>
                    ))}
                </select>
            );
        default:
            return (
                <input
                    type="text"
                    className={baseClasses}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
    }
};

export default DynamicForm;
