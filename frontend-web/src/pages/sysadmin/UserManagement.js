import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import sysAdminApiClient from '../../api/sysAdminApiClient'; // <-- USA O API CLIENT NOVO

// --- Busca de Usuários ---
const fetchUsers = async () => {
  // ATENÇÃO: API path mudou (este é o /users, que só pega usuários do 'Systems')
  const { data } = await sysAdminApiClient.get('/api/sysadmin/users');
  return data;
};

// --- Criação de Usuário ---
const createUser = async (userData) => {
  // ATENÇÃO: API path mudou
  const { data } = await sysAdminApiClient.post('/api/sysadmin/users', userData);
  return data;
};

export default function SysAdminUserManagement() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      profile: 'sysadmin' // Padrão para criar novos admins
    }
  });

  // Query para buscar usuários existentes
  const { data: users, isLoading: isLoadingUsers } = useQuery(
    ['sysAdminUsers'], // Chave de query única
    fetchUsers
  );

  // Mutation para criar novo usuário
  const mutation = useMutation(createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries(['sysAdminUsers']);
      alert('Usuário criado com sucesso!');
      reset(); 
    },
    onError: (error) => {
      alert(`Erro ao criar usuário: ${error.response?.data?.detail || error.message}`);
    }
  });

  const onSubmit = (data) => {
    // Não precisa de tenant_id, o backend assume o tenant "Systems"
    mutation.mutate(data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Formulário de Criação */}
      <div className="md:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Novo Usuário (Sistema)
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <input
                id="name"
                type="text"
                {...register("name", { required: "Nome é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
              />
              {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username (para login)
              </label>
              <input
                id="username"
                type="text"
                {...register("username", { required: "Username é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
              />
              {errors.username && <span className="text-red-500 text-sm">{errors.username.message}</span>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email (para contato)
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
              />
            </div>
            
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                {...register("password", { required: "Senha é obrigatória", minLength: 6 })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
              />
              {errors.password && <span className="text-red-500 text-sm">{errors.password.message || "Senha deve ter min. 6 caracteres"}</span>}
            </div>

            <div>
              <label htmlFor="profile" className="block text-sm font-medium text-gray-700">
                Perfil
              </label>
              <select
                id="profile"
                {...register("profile", { required: "Perfil é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
              >
                <option value="sysadmin">SysAdmin</option>
                <option value="admin">Admin (Tenant)</option>
              </select>
              {errors.profile && <span className="text-red-500 text-sm">{errors.profile.message}</span>}
            </div>

            <button
              type="submit"
              disabled={mutation.isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-repforce-primary hover:bg-opacity-90 disabled:bg-gray-400"
            >
              {mutation.isLoading ? 'Criando...' : 'Criar Usuário'}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="md:col-span-2">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4">
            <h2 className="text-xl font-bold text-gray-800">Usuários do Sistema (Tenant 'Systems')</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perfil</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingUsers ? (
                  <tr><td colSpan="3" className="p-4 text-center">Carregando...</td></tr>
                ) : (
                  users?.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.profile === 'sysadmin' ? 'bg-red-100 text-red-800' :
                          user.profile === 'admin' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'
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