import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import apiClient from '../../api/apiClient';

const fetchUsers = async () => {
  const { data } = await apiClient.get('/admin/users');
  return data;
};

const createUser = async (userData) => {
  const { data } = await apiClient.post('/admin/users', userData);
  return data;
};

export default function TenantUserManagement() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
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
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || error.message || 'Erro desconhecido.';
      alert(`Erro ao criar usuário: ${errorMessage}`);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Formulário */}
      <div className="md:col-span-1">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Novo Usuário
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome
              </label>
              <input
                id="name"
                type="text"
                {...register("name", { required: "Nome é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 dark:text-white"
              />
              {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                {...register("username", { required: "Username é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 dark:text-white"
              />
              {errors.username && <span className="text-red-500 text-sm">{errors.username.message}</span>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 dark:text-white"
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
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 dark:text-white"
              />
              {errors.password && <span className="text-red-500 text-sm">{errors.password.message || "Senha deve ter min. 6 caracteres"}</span>}
            </div>

            <div>
              <label htmlFor="profile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Perfil
              </label>
              <select
                id="profile"
                {...register("profile", { required: "Perfil é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="representante">Representante</option>
                <option value="admin">Admin (Tenant)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={mutation.isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-repforce-primary hover:bg-opacity-90 disabled:bg-gray-400 transition-colors"
            >
              {mutation.isLoading ? 'Criando...' : 'Criar Usuário'}
            </button>
          </form>
        </div>
      </div>

      {/* Lista */}
      <div className="md:col-span-2">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Usuários do Tenant</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Perfil</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoadingUsers ? (
                  <tr><td colSpan="4" className="p-4 text-center dark:text-white">Carregando...</td></tr>
                ) : (
                  users?.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.username}</td> 
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.profile === 'admin' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 
                          'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        }`}>
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