import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import apiClient from '../../../api/apiClient';
import { XMarkIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

// API Functions using apiClient
const fetchRoles = async () => {
    // SysAdmin context (Token) implies tenant_id (likely 1 for Systems)
    // /admin/roles uses request.state.tenant_id
    const { data } = await apiClient.get('/admin/roles');
    return data;
};

const fetchAreas = async () => {
    const { data } = await apiClient.get('/admin/areas');
    return data;
};

const createRole = async (data) => {
    const { data: res } = await apiClient.post('/admin/roles', data);
    return res;
};

const updateRole = async ({ id, data }) => {
    const { data: res } = await apiClient.put(`/admin/roles/${id}`, data);
    return res;
};

const deleteRole = async (id) => {
    await apiClient.delete(`/admin/roles/${id}`);
};

export default function RoleManagement() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const queryClient = useQueryClient();

    const { register, handleSubmit, reset, setValue } = useForm({
        defaultValues: { area_ids: [] }
    });

    const { data: roles, isLoading: isLoadingRoles } = useQuery(['sysAdminRoles'], fetchRoles);
    const { data: areas } = useQuery(['sysAdminAreas'], fetchAreas);

    const createMutation = useMutation(createRole, {
        onSuccess: () => {
            queryClient.invalidateQueries(['sysAdminRoles']);
            closeForm();
            alert('Cargo criado!');
        },
        onError: (err) => alert(err.response?.data?.detail || "Erro ao criar")
    });

    const updateMutation = useMutation(updateRole, {
        onSuccess: () => {
            queryClient.invalidateQueries(['sysAdminRoles']);
            closeForm();
            alert('Cargo atualizado!');
        },
        onError: (err) => alert(err.response?.data?.detail || "Erro ao atualizar")
    });

    const deleteMutation = useMutation(deleteRole, {
        onSuccess: () => {
            queryClient.invalidateQueries(['sysAdminRoles']);
        },
        onError: (err) => alert(err.response?.data?.detail || "Erro ao excluir")
    });

    const onSubmit = (data) => {
        const payload = {
            ...data,
            area_ids: data.area_ids ? data.area_ids.map(Number) : []
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const startEdit = (role) => {
        setEditingId(role.id);
        setIsFormOpen(true);
        setValue('name', role.name);
        setValue('description', role.description);
        setValue('area_ids', role.areas ? role.areas.map(a => String(a.id)) : []);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        reset();
    };

    if (isFormOpen) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold dark:text-white">
                        {editingId ? 'Editar Cargo Global' : 'Novo Cargo Global'}
                    </h2>
                    <button onClick={closeForm} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-300">Nome do Cargo</label>
                        <input {...register('name', { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: Auditor Global" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-300">Descrição</label>
                        <input {...register('description')} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium dark:text-gray-300 mb-2">Acesso às Áreas (Permissões)</label>
                        <div className="space-y-2 max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-3 rounded border dark:border-gray-600">
                            {areas?.map(area => (
                                <label key={area.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-1 rounded transition-colors">
                                    <input
                                        type="checkbox"
                                        value={area.id}
                                        {...register('area_ids')}
                                        className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                                    />
                                    <span className="text-sm dark:text-gray-200">{area.name}</span>
                                </label>
                            ))}
                            {areas?.length === 0 && <p className="text-xs text-gray-500">Nenhuma área disponível.</p>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={createMutation.isLoading || updateMutation.isLoading}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {editingId ? 'Salvar Alterações' : 'Criar Cargo'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg h-full flex flex-col transition-colors">
            <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white">Gerenciar Cargos Globais</h2>
                <button onClick={() => setIsFormOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <PlusIcon className="w-5 h-5" /> Novo Cargo
                </button>
            </div>
            <div className="overflow-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Áreas Vinculadas</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {roles?.map(role => (
                            <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium dark:text-white">{role.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{role.description}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {role.areas?.map(a => (
                                            <span key={a.id} className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {a.name}
                                            </span>
                                        ))}
                                        {(!role.areas || role.areas.length === 0) && <span className="text-xs text-gray-400">-</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => startEdit(role)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => { if (window.confirm('Excluir?')) deleteMutation.mutate(role.id) }} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
