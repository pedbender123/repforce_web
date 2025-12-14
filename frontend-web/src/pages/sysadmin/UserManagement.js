import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import sysAdminApiClient from '../../api/sysAdminApiClient';

// ID do Tenant de sistema
const SYSTEMS_TENANT_ID = 1;

const fetchUsers = async () => {
  const { data } = await sysAdminApiClient.get('/sysadmin/users');
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

export default function SysAdminUserManagement() {
  const queryClient = useQueryClient();
  const { data: tenants, isLoading: isLoadingTenants } = useQuery(
    ['allTenantsForSelection'],
    fetchTenants
  );

  const defaultTenantId = tenants?.find(t => t.name === 'Systems')?.id || SYSTEMS_TENANT_ID;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      tenant_id: defaultTenantId,
    }
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery(
    ['sysAdminUsers'],
    fetchUsers
  );

  const mutation = useMutation(createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries(['sysAdminUsers']);
      queryClient.invalidateQueries(['allSystemUsers']); 
      alert('Usuário criado com sucesso!');
      reset({
        tenant_id: defaultTenantId
      }); 
    },
    onError: (error) => {
      alert(`Erro ao criar usuário: ${error.response?.data?.detail || error.message}`);
    }
  });

  const onSubmit = (data) => {
    const selectedTenantId = parseInt(data.tenant_id, 10);
    let profile;

    if (selectedTenantId === SYSTEMS_TENANT_ID) {
      profile = 'sysadmin';
    } else {
      profile = 'admin';
    }
    
    const userData = {
      ...data,
      tenant_id: selectedTenantId,
      profile: profile
    }

    mutation.mutate(userData);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Formulário de Criação - Modo Escuro Ajustado */}
      <div className="md:col-span-1">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors duration-300">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Novo Usuário
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div>
              <label htmlFor="tenant_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tenant (Empresa)
              </label>
              {isLoadingTenants ? (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Carregando Tenants...</p>
              ) : (
                <select
                  id="tenant_id"
                  {...register("tenant_id", { required: "Tenant é obrigatório" })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                >
                  {tenants?.map(tenant => (
                    <option key={tenant.id} value={tenant.id} className="dark:bg-gray-700">
                      {tenant.name} (ID: {tenant.id}) 
                      {tenant.id === SYSTEMS_TENANT_ID ? " - Perfil: SysAdmin" : " - Perfil: Admin"}
                    </option>
                  ))}
                </select>
              )}
              {errors.tenant_id && <span className="text-red-500 text-sm">{errors.tenant_id.message}</span>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Selecione o Tenant. O perfil será definido automaticamente.
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome
              </label>
              <input
                id="name"
                type="text"
                {...register("name", { required: "Nome é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
              {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username (para login)
              </label>
              <input
                id="username"
                type="text"
                {...register("username", { required: "Username é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
              {errors.username && <span className="text-red-500 text-sm">{errors.username.message}</span>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email (para contato)
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <input
                id="password"
                type="password"
                {...register("password", { required: "Senha é obrigatória", minLength: 6 })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
              {errors.password && <span className="text-red-500 text-sm">{errors.password.message || "Senha deve ter min. 6 caracteres"}</span>}
            </div>

            <button
              type="submit"
              disabled={mutation.isLoading || isLoadingTenants}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 transition-colors"
            >
              {mutation.isLoading ? 'Criando...' : 'Criar Usuário'}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Usuários - Modo Escuro Ajustado */}
      <div className="md:col-span-2">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden transition-colors duration-300">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">SysAdmins Cadastrados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Perfil</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoadingUsers ? (
                  <tr><td colSpan="3" className="p-4 text-center text-gray-500 dark:text-gray-300">Carregando...</td></tr>
                ) : (
                  users?.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                          {user.profile}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}