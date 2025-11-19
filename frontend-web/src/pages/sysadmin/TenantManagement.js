import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import sysAdminApiClient from '../../api/sysAdminApiClient';

const fetchTenants = async () => {
  const { data } = await sysAdminApiClient.get('/sysadmin/tenants');
  return data;
};

const createTenant = async (formData) => { 
  const { data } = await sysAdminApiClient.post('/sysadmin/tenants', formData);
  return data;
};

const updateTenantStatus = async ({ id, status }) => {
  const { data } = await sysAdminApiClient.put(`/sysadmin/tenants/${id}`, { status });
  return data;
};

const statusOptions = [
  { value: 'inactive', label: 'Inativo' },
  { value: 'active', label: 'Ativo' },
  { value: 'contract', label: 'Em Contrato' },
];

export default function TenantManagement() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      status: 'inactive'
    }
  });

  const { data: tenants, isLoading: isLoadingTenants } = useQuery(
    ['sysAdminTenants'], 
    fetchTenants
  );

  const createMutation = useMutation(createTenant, {
    onSuccess: () => {
      queryClient.invalidateQueries(['sysAdminTenants']);
      alert('Tenant criado com sucesso!');
      reset();
    },
    onError: (error) => {
      alert(`Erro ao criar tenant: ${error.response?.data?.detail || error.message}`);
    }
  });

  const statusMutation = useMutation(updateTenantStatus, {
    onSuccess: () => {
      queryClient.invalidateQueries(['sysAdminTenants']);
    },
    onError: (error) => {
      alert(`Erro ao atualizar status: ${error.response?.data?.detail || error.message}`);
    }
  });
  
  const handleStatusChange = (tenantId, newStatus) => {
    statusMutation.mutate({ id: tenantId, status: newStatus });
  };

  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('cnpj', data.cnpj || '');
    formData.append('email', data.email || '');
    formData.append('phone', data.phone || '');
    formData.append('status', data.status);
    formData.append('commercial_info', data.commercial_info || '');

    if (data.logo && data.logo[0]) {
      formData.append('logo', data.logo[0]);
    }
    
    createMutation.mutate(formData);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Formulário */}
      <div className="md:col-span-1">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-colors">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Novo Tenant
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome da Empresa
              </label>
              <input
                id="name"
                {...register("name", { required: "Nome é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
            </div>

            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                CNPJ
              </label>
              <input
                id="cnpj"
                {...register("cnpj")}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email", { required: "Email é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Telefone
              </label>
              <input
                id="phone"
                {...register("phone")}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                id="status"
                {...register("status", { required: "Status é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Logo (Upload)
              </label>
              <input
                id="logo"
                type="file"
                {...register("logo")}
                accept="image/png, image/jpeg, image/gif"
                className="mt-1 block w-full text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none file:bg-gray-200 dark:file:bg-gray-600 file:border-0 file:px-3 file:py-2 file:mr-3 file:text-sm file:font-medium dark:file:text-white"
              />
            </div>

            <div>
              <label htmlFor="commercial_info" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Informações Comerciais
              </label>
              <textarea
                id="commercial_info"
                rows={3}
                {...register("commercial_info")}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-repforce-primary hover:bg-opacity-90 disabled:bg-gray-400 transition-colors"
            >
              {createMutation.isLoading ? 'Criando...' : 'Criar Tenant'}
            </button>
          </form>
        </div>
      </div>

      {/* Lista */}
      <div className="md:col-span-2">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gerenciar Tenants</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoadingTenants ? (
                  <tr><td colSpan="5" className="p-4 text-center dark:text-white">Carregando...</td></tr>
                ) : (
                  tenants?.map((tenant) => (
                    <tr key={tenant.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tenant.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tenant.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tenant.cnpj || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tenant.email || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <select
                          value={tenant.status}
                          onChange={(e) => handleStatusChange(tenant.id, e.target.value)}
                          disabled={statusMutation.isLoading}
                          className={`mt-1 block w-auto pl-3 pr-10 py-1 text-sm border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-repforce-primary focus:border-repforce-primary dark:bg-gray-700 dark:text-white ${
                            tenant.status === 'active' ? 'text-green-800 dark:text-green-400 bg-green-50 dark:bg-green-900/30' :
                            tenant.status === 'inactive' ? 'text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-900/30' :
                            'text-yellow-800 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30'
                          }`}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value} className="dark:bg-gray-700 dark:text-white">{opt.label}</option>
                          ))}
                        </select>
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