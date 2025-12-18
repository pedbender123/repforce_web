import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const ENTITIES = [
    { value: 'client', label: 'Clientes' },
    { value: 'product', label: 'Produtos' },
    { value: 'order', label: 'Pedidos' }
];

const FIELD_TYPES = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'date', label: 'Data' },
    { value: 'boolean', label: 'Sim/Não' },
    { value: 'select', label: 'Seleção (Lista)' }
];

export default function AdminCustomFields() {
    const [selectedEntity, setSelectedEntity] = useState('client');
    const [isCreating, setIsCreating] = useState(false);
    const [newField, setNewField] = useState({
        key: '',
        label: '',
        type: 'text',
        options: '', // comma separated for UI
        required: false
    });

    const queryClient = useQueryClient();

    const { data: fields, isLoading } = useQuery(
        ['customFields', selectedEntity],
        async () => {
            const { data } = await apiClient.get(`/crm/config/fields/${selectedEntity}`);
            return data;
        }
    );

    const createMutation = useMutation(
        async (fieldData) => {
            // Formata options se for select
            const payload = { ...fieldData, entity: selectedEntity };
            if (payload.type === 'select' && typeof payload.options === 'string') {
                payload.options = payload.options.split(',').map(s => s.trim()).filter(Boolean);
            } else if (payload.type !== 'select') {
                payload.options = null;
            }
            await apiClient.post('/crm/config/fields', payload);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['customFields', selectedEntity]);
                setIsCreating(false);
                setNewField({ key: '', label: '', type: 'text', options: '', required: false });
            },
            onError: (err) => alert("Erro ao criar campo: " + (err.response?.data?.detail || err.message))
        }
    );

    const deleteMutation = useMutation(
        async (id) => await apiClient.delete(`/crm/config/fields/${id}`),
        {
            onSuccess: () => queryClient.invalidateQueries(['customFields', selectedEntity])
        }
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(newField);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 dark:text-white">Configuração de Campos Personalizados</h1>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b dark:border-gray-700">
                {ENTITIES.map(ent => (
                    <button
                        key={ent.value}
                        onClick={() => setSelectedEntity(ent.value)}
                        className={`py-2 px-4 border-b-2 font-medium transition-colors ${selectedEntity === ent.value
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        {ent.label}
                    </button>
                ))}
            </div>

            {/* Action Bar */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    <PlusIcon className="w-5 h-5 mr-2" /> Novo Campo
                </button>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6 border dark:border-gray-700">
                    <h3 className="font-semibold mb-4 dark:text-white">Novo Campo para {ENTITIES.find(e => e.value === selectedEntity)?.label}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">Rótulo (Label)</label>
                            <input
                                required
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                value={newField.label}
                                onChange={e => {
                                    // Auto-generate key
                                    const key = e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                                    setNewField({ ...newField, label: e.target.value, key });
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">Chave Interna (ID)</label>
                            <input
                                required
                                className="w-full p-2 border rounded bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-300"
                                value={newField.key}
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">Tipo</label>
                            <select
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                value={newField.type}
                                onChange={e => setNewField({ ...newField, type: e.target.value })}
                            >
                                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>

                        {newField.type === 'select' && (
                            <div className="col-span-2">
                                <label className="block text-sm mb-1 dark:text-gray-300">Opções (separadas por vírgula)</label>
                                <input
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                    placeholder="Azul, Vermelho, Verde"
                                    value={newField.options}
                                    onChange={e => setNewField({ ...newField, options: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="flex items-center mt-6">
                            <input
                                type="checkbox"
                                id="req"
                                checked={newField.required}
                                onChange={e => setNewField({ ...newField, required: e.target.checked })}
                                className="mr-2"
                            />
                            <label htmlFor="req" className="dark:text-gray-300">Obrigatório</label>
                        </div>

                        <div className="col-span-2 flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chave</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Obrigatório</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center dark:text-gray-400">Carregando...</td></tr>
                        ) : fields?.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center dark:text-gray-400">Nenhum campo customizado ainda.</td></tr>
                        ) : (
                            fields?.map(field => (
                                <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 text-sm font-medium dark:text-white">{field.label}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{field.key}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {field.required ? 'Sim' : 'Não'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Tem certeza? Dados existentes não serão apagados, mas o campo sumirá.')) {
                                                    deleteMutation.mutate(field.id);
                                                }
                                            }}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
