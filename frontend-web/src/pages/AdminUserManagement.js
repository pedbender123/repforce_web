
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import apiClient from '../api/apiClient';
import { XMarkIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'; // Adicionei TrashIcon se quisermos delete no futuro

const fetchUsers = async () => {
  const { data } = await apiClient.get('/admin/users');
  return data;
};

const createUser = async (userData) => {
  const { data } = await apiClient.post('/admin/users', userData);
  return data;
};

export default function TenantUserManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      profile: 'representante'
    }
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery(
    ['tenantAdminUsers'],
    fetchUsers
  );

  const mutation = useMutation(createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tenantAdminUsers']);
      alert('Usuário criado com sucesso!');
      reset();
      setIsCreating(false);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Erro desconhecido.';
      alert(`Erro ao criar usuário: ${errorMessage} `);
    }
  });

  // ... inside component ...
  const [editingId, setEditingId] = useState(null);

  const deleteMutation = useMutation(async (id) => {
    await apiClient.delete(`/admin/users/${id}`);
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tenantAdminUsers']);
      alert('Usuário excluído!');
    },
    onError: () => alert('Erro ao excluir usuário.')
  });

  const updateMutation = useMutation(async ({ id, data }) => {
    await apiClient.put(`/admin/users/${id}`, data);
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tenantAdminUsers']);
      alert('Atualizado com sucesso!');
      reset();
      setIsCreating(false);
      setEditingId(null);
    }
  });

  const onSubmit = (data) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      mutation.mutate(data);
    }
  };

  const startEdit = (user) => {
    setIsCreating(true);
    setEditingId(user.id);
    setValue('name', user.name);
    setValue('username', user.username);
    setValue('email', user.email);
    setValue('profile', user.profile);
    // Password field might need handling (optional update)
  };


  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-white">
            Novo Usuário
          </h2>
          <button onClick={() => setIsCreating(false)}><XMarkIcon className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium dark:text-gray-300">Nome</label>
            <input {...register("name", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-gray-300">Username</label>
            <input {...register("username", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-gray-300">Email</label>
            <input type="email" {...register("email")} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-gray-300">Senha</label>
            <input type="password" {...register("password", { required: true, minLength: 6 })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-gray-300">Perfil</label>
            <select {...register("profile", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500">
              <option value="representante">Representante</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" disabled={mutation.isLoading} className="w-full text-white py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {mutation.isLoading ? 'Criando...' : 'Criar Usuário'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg h-full flex flex-col transition-colors">
      <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold dark:text-white">Gerenciar Usuários</h2>
        <button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <PlusIcon className="w-5 h-5" /> Novo Usuário
        </button>
      </div>
      <div className="overflow-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Perfil</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users?.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 text-sm font-medium dark:text-white">{u.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{u.username}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 text-xs rounded-full ${u.profile === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'} `}>
                    {u.profile}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{u.email || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                  <button onClick={() => startEdit(u)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => { if (window.confirm('Excluir usuário?')) deleteMutation.mutate(u.id) }} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {(!users || users.length === 0) && !isLoadingUsers && (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">Nenhum usuário encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}