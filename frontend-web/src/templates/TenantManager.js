import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import sysAdminApiClient from '../api/sysAdminApiClient';

// Funções API isoladas
const fetchTenants = async () => (await sysAdminApiClient.get('/sysadmin/tenants')).data;
const createTenant = async (data) => (await sysAdminApiClient.post('/sysadmin/tenants', data)).data;
const updateTenantStatus = async ({ id, status }) => (await sysAdminApiClient.put(`/sysadmin/tenants/${id}`, { status })).data;

const statusOptions = [
  { value: 'inactive', label: 'Inativo' },
  { value: 'active', label: 'Ativo' },
  { value: 'contract', label: 'Em Contrato' },
];

const typeOptions = [
  { value: 'industry', label: 'Indústria (Fabricante)' },
  { value: 'agency', label: 'Agência de Representação' },
  { value: 'reseller', label: 'Revenda / Distribuidora' },
];

export default function TenantManager() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { status: 'inactive', tenant_type: 'industry' }
  });

  const { data: tenants, isLoading } = useQuery(['sysAdminTenants'], fetchTenants);

  const createMutation = useMutation(createTenant, {
    onSuccess: () => {
      queryClient.invalidateQueries(['sysAdminTenants']);
      alert('Tenant criado com sucesso!');
      reset();
    },
    onError: (err) => alert(`Erro: ${err.response?.data?.detail || err.message}`)
  });

  const statusMutation = useMutation(updateTenantStatus, {
    onSuccess: () => queryClient.invalidateQueries(['sysAdminTenants'])
  });

  const onSubmit = (data) => {
    // Gera slug automático simples se não fornecido
    const payload = {
        ...data,
        slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        sysadmin_password: "password123", // Senha padrão temporária para agilizar
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {/* Formulário */}
      <div className="md:col-span-1">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Novo Tenant</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Empresa</label>
              <input {...register("name", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" />
              {errors.name && <span className="text-red-500 text-xs">Obrigatório</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
              <select {...register("tenant_type")} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600">
                {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Admin</label>
              <input type="email" {...register("sysadmin_email", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status Inicial</label>
              <select {...register("status")} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600">
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <button type="submit" disabled={createMutation.isLoading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              {createMutation.isLoading ? 'Criando...' : 'Criar Tenant'}
            </button>
          </form>
        </div>
      </div>

      {/* Lista */}
      <div className="md:col-span-2">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold dark:text-white">Tenants Cadastrados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? <tr><td colSpan="3" className="p-4 text-center">Carregando...</td></tr> : tenants?.map(t => (
                    <tr key={t.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-white">{t.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t.tenant_type}</td>
                    <td className="px-6 py-4">
                        <select 
                            value={t.status} 
                            onChange={(e) => statusMutation.mutate({ id: t.id, status: e.target.value })}
                            className="text-xs border rounded p-1 dark:bg-gray-700 dark:text-white"
                        >
                            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
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