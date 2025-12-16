import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import apiClient from '../../api/apiClient';
import { XMarkIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

// API Functions
const fetchRoles = async () => {
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
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const queryClient = useQueryClient();
    
    const { register, handleSubmit, reset, setValue } = useForm({
        defaultValues: { area_ids: [] }
    });

    const { data: roles, isLoading: isLoadingRoles } = useQuery(['adminRoles'], fetchRoles);
    const { data: areas } = useQuery(['adminAreas'], fetchAreas);

    const createMutation = useMutation(createRole, {
        onSuccess: () => {
            queryClient.invalidateQueries(['adminRoles']);
            reset();
            setIsEditing(false);
            alert('Cargo criado!');
        },
        onError: (err) => alert(err.response?.data?.detail || "Erro ao criar")
    });

    const updateMutation = useMutation(updateRole, {
        onSuccess: () => {
            queryClient.invalidateQueries(['adminRoles']);
            reset();
            setIsEditing(false);
            setEditingId(null);
            alert('Cargo atualizado!');
        },
        onError: (err) => alert(err.response?.data?.detail || "Erro ao atualizar")
    });

    const deleteMutation = useMutation(deleteRole, {
        onSuccess: () => {
            queryClient.invalidateQueries(['adminRoles']);
        },
        onError: (err) => alert(err.response?.data?.detail || "Erro ao excluir (verifique se há usuários vinculados)")
    });

    const onSubmit = (data) => {
        // Converte IDs para int
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
        setIsEditing(true);
        setValue('name', role.name);
        setValue('description', role.description);
        setValue('area_ids', role.areas.map(a => String(a.id))); // React Hook Form precisa de strings para checkbox
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditingId(null);
        reset();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="md:col-span-1">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold dark:text-white">
                            {editingId ? 'Editar Cargo' : 'Novo Cargo'}
                        </h2>
                        {isEditing && (
                             <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700">
                                <XMarkIcon className="w-5 h-5"/>
                             </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Nome do Cargo</label>
                            <input {...register('name', { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="Ex: Vendedor Jr"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300">Descrição</label>
                            <input {...register('description')} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium dark:text-gray-300 mb-2">Acesso às Áreas</label>
                            <div className="space-y-2 max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-3 rounded border dark:border-gray-600">
                                {areas?.map(area => (
                                    <label key={area.id} className="flex items-center space-x-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            value={area.id} 
                                            {...register('area_ids')}
                                            className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                                        />
                                        <span className="text-sm dark:text-gray-200">{area.name}</span>
                                    </label>
                                ))}
                                {areas?.length === 0 && <p className="text-xs text-gray-500">Nenhuma área cadastrada pelo SysAdmin.</p>}
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={createMutation.isLoading || updateMutation.isLoading}
                            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {editingId ? 'Salvar Alterações' : 'Criar Cargo'}
                        </button>
                    </form>
                </div>
            </div>

            {/* List Column */}
            <div className="md:col-span-2">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b dark:border-gray-700">
                        <h2 className="text-xl font-bold dark:text-white">Cargos Existentes</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Áreas Vinculadas</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {roles?.map(role => (
                                    <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium dark:text-white">{role.name}</div>
                                            <div className="text-xs text-gray-500">{role.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {role.areas?.map(a => (
                                                    <span key={a.id} className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        {a.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => startEdit(role)} className="text-blue-600 hover:text-blue-800">
                                                <PencilIcon className="w-5 h-5"/>
                                            </button>
                                            {/* Evita deletar o Admin padrão se necessário, mas o backend já protege se tiver usuários */}
                                            <button onClick={() => { if(window.confirm('Excluir?')) deleteMutation.mutate(role.id) }} className="text-red-600 hover:text-red-800">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}