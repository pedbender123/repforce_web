import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function AdminAreaManagement() {
    const [isCreating, setIsCreating] = useState(false);
    const [newArea, setNewArea] = useState({ name: '', slug: '', icon: '', order: 0 });
    const queryClient = useQueryClient();

    // Fetch Areas
    const { data: areas, isLoading } = useQuery(['areas'], async () => {
        const { data } = await apiClient.get('/crm/config/areas');
        return data;
    });

    // Create Mutation
    const createMutation = useMutation(
        async (areaData) => await apiClient.post('/crm/config/areas', areaData),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['areas']);
                setIsCreating(false);
                setNewArea({ name: '', slug: '', icon: '', order: 0 });
            },
            onError: (err) => alert("Erro ao criar área: " + (err.response?.data?.detail || err.message))
        }
    );

    // Delete Mutation
    const deleteMutation = useMutation(
        async (id) => await apiClient.delete(`/crm/config/areas/${id}`),
        {
            onSuccess: () => queryClient.invalidateQueries(['areas'])
        }
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(newArea);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 dark:text-white">Gerenciamento de Áreas (Menus)</h1>

            {/* Action Bar */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    <PlusIcon className="w-5 h-5 mr-2" /> Nova Área
                </button>
            </div>

            {/* Form */}
            {isCreating && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6 border dark:border-gray-700">
                    <h3 className="font-semibold mb-4 dark:text-white">Nova Área</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">Nome</label>
                            <input
                                required
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                value={newArea.name}
                                onChange={e => {
                                    const slug = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                    setNewArea({ ...newArea, name: e.target.value, slug });
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">Slug (URL)</label>
                            <input
                                required
                                className="w-full p-2 border rounded bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-300"
                                value={newArea.slug}
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">Ícone (Lucide Name)</label>
                            <input
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                placeholder="ex: Users, Layout, Box"
                                value={newArea.icon}
                                onChange={e => setNewArea({ ...newArea, icon: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 dark:text-gray-300">Ordem</label>
                            <input
                                type="number"
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                value={newArea.order}
                                onChange={e => setNewArea({ ...newArea, order: parseInt(e.target.value) })}
                            />
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ícone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordem</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center dark:text-gray-400">Carregando...</td></tr>
                        ) : areas?.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center dark:text-gray-400">Nenhuma área configurada.</td></tr>
                        ) : (
                            areas?.map(area => (
                                <tr key={area.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 text-sm font-medium dark:text-white">{area.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{area.slug}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{area.icon}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{area.order}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Tem certeza?')) deleteMutation.mutate(area.id);
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
