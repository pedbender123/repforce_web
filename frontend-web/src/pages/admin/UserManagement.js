import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import apiClient from '../../api/apiClient';

// --- Busca de Usuários ---
const fetchUsers = async () => {
  const { data } = await apiClient.get('/api/admin/users');
  return data;
};

// --- Criação de Usuário ---
const createUser = async (userData) => {
  const { data } = await apiClient.post('/api/admin/users', userData);
  return data;
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Query para buscar usuários existentes
  const { data: users, isLoading: isLoadingUsers } = useQuery(
    ['adminUsers'], 
    fetchUsers
  );

  // Mutation para criar novo usuário
  const mutation = useMutation(createUser, {
    onSuccess: () => {
      // Invalida a query 'adminUsers' para buscar a lista atualizada
      queryClient.invalidateQueries(['adminUsers']);
      alert('Representante criado com sucesso!');
      reset(); // Limpa o formulário
    },
    onError: (error) => {
      alert(`Erro ao criar representante: ${error.response?.data?.detail || error.message}`);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Formulário de Criação */}
      <div className="md:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Novo Representante
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email", { required: "Email é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
              />
              {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
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
            <h2 className="text-xl font-bold text-gray-800">Usuários do Tenant</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perfil</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingUsers ? (
                  <tr><td colSpan="3" className="p-4 text-center">Carregando...</td></tr>
                ) : (
                  users?.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.profile}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
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