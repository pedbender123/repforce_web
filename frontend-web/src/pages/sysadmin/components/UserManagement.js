import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import sysAdminApiClient from '../../../api/sysAdminApiClient';

const fetchUsers = async () => {
  const { data } = await sysAdminApiClient.get('/admin/users');
  return data;
};

const fetchRoles = async () => {
  const { data } = await sysAdminApiClient.get('/admin/roles');
  return data;
};

const createUser = async (userData) => {
  // Nota: O backend espera apenas campos que existam no UserCreate schema
  const { data } = await sysAdminApiClient.post('/admin/users', userData);
  return data;
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: users, isLoading: isLoadingUsers } = useQuery(['tenantAdminUsers'], fetchUsers);
  const { data: roles } = useQuery(['tenantRoles'], fetchRoles);

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
    // REMOVIDO: profile
    // O backend agora deve receber apenas username, email, password, name, e role_id
    const payload = {
      name: data.name,
      username: data.username,
      email: data.email,
      password: data.password,
      role_id: parseInt(data.role_id) // Cargo é obrigatório agora
    };
    mutation.mutate(payload);
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
              <input {...register("name", { required: "Nome é obrigatório" })} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white" />
              {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <input {...register("username", { required: "Username é obrigatório" })} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white" />
              {errors.username && <span className="text-red-500 text-sm">{errors.username.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input type="email" {...register("email")} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
              <input type="password" {...register("password", { required: "Senha é obrigatória", minLength: 6 })} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white" />
              {errors.password && <span className="text-red-500 text-sm">{errors.password.message || "Senha deve ter min. 6 caracteres"}</span>}
            </div>

            {/* SELETOR DE CARGO (Agora Obrigatório) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cargo (Role)</label>
              <select
                {...register("role_id", { required: "É obrigatório selecionar um cargo." })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="">Selecione um cargo...</option>
                {roles?.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              {errors.role_id && <span className="text-red-500 text-sm">{errors.role_id.message}</span>}
              <p className="text-xs text-gray-500 mt-1">O cargo define todas as permissões do usuário.</p>
            </div>

            <button
              type="submit"
              disabled={mutation.isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Username</th>
                  {/* Coluna Perfil removida */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cargo</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoadingUsers ? (
                  <tr><td colSpan="3" className="p-4 text-center dark:text-white">Carregando...</td></tr>
                ) : (
                  users?.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{user.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {/* Se o backend não retornar role_obj no endpoint de listagem, pode precisar de ajuste. 
                            Mas models.User tem role_obj, então se não vier, é porque o backend não fez joinedload.
                            Dica: O Passo 1 (auth.py) corrigiu o /users/me, mas talvez o GET /admin/users precise também?
                            Não é critico para o menu funcionar, mas é bom para visualizar.
                         */}
                        {user.role_id ? `ID: ${user.role_id}` : '-'}
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