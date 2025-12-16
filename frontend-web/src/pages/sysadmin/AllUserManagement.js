import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

const fetchAllUsers = async () => {
  const { data } = await sysAdminApiClient.get('/sysadmin/all-users');
  return data;
};

const fetchTenants = async () => {
    const { data } = await sysAdminApiClient.get('/sysadmin/tenants');
    return data;
};

const createUser = async (userData) => {
  const { data } = await sysAdminApiClient.post('/sysadmin/users', userData);
  return data;
};

export default function AllUserManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch } = useForm();

  const { data: users } = useQuery(['allSystemUsers'], fetchAllUsers);
  const { data: tenants } = useQuery(['sysAdminTenants'], fetchTenants);

  // Observa o tenant selecionado para ajustar a UI ou lógica
  const selectedTenantId = watch("tenant_id");
  const isSystemsTenant = tenants?.find(t => String(t.id) === String(selectedTenantId))?.name === 'Systems';

  const createMutation = useMutation(createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries(['allSystemUsers']);
      alert('Usuário criado com sucesso!');
      reset();
      setIsCreating(false);
    },
    onError: (error) => alert(`Erro: ${error.response?.data?.detail || error.message}`)
  });

  const onSubmit = (data) => {
    // CORREÇÃO: Se for o tenant Systems, força perfil sysadmin. Caso contrário, admin.
    const tenantName = tenants?.find(t => String(t.id) === String(data.tenant_id))?.name;
    const profile = tenantName === 'Systems' ? 'sysadmin' : 'admin';

    createMutation.mutate({
        ...data,
        profile: profile,
        tenant_id: parseInt(data.tenant_id)
    });
  };

  if (isCreating) {
      return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold dark:text-white">
                    {isSystemsTenant ? 'Novo Super Admin (SysAdmin)' : 'Novo Admin de Tenant'}
                </h2>
                <button onClick={() => setIsCreating(false)}><XMarkIcon className="w-6 h-6 text-gray-500"/></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Tenant (Empresa)</label>
                    <select {...register("tenant_id", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600">
                        <option value="">Selecione...</option>
                        {tenants?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Nome</label>
                    <input {...register("name", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Username</label>
                    <input {...register("username", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Email</label>
                    <input type="email" {...register("email")} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Senha</label>
                    <input type="password" {...register("password", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
                </div>
                
                <button type="submit" className={`w-full text-white py-2 rounded ${isSystemsTenant ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {isSystemsTenant ? 'Criar SysAdmin' : 'Criar Admin'}
                </button>
            </form>
        </div>
      );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg h-full flex flex-col">
      <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold dark:text-white">Usuários do Sistema</h2>
        <button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
            <PlusIcon className="w-5 h-5"/> Novo Usuário
        </button>
      </div>
      <div className="overflow-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perfil</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users?.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm font-medium dark:text-white">{u.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{u.username}</td>
                        <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${u.profile === 'sysadmin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {u.profile}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{u.tenant?.name || '-'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}