import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import sysAdminApiClient from '../../api/sysAdminApiClient'; // <-- USA O API CLIENT NOVO

// --- Busca de Tenants ---
const fetchTenants = async () => {
  // CORRIGIDO: /api/ removido
  const { data } = await sysAdminApiClient.get('/sysadmin/tenants');
  return data;
};

// --- Criação de Tenant ---
const createTenant = async (formData) => { // MUDOU: de tenantData para formData
  // CORRIGIDO: /api/ removido e agora envia FormData
  const { data } = await sysAdminApiClient.post('/sysadmin/tenants', formData, {
    headers: {
      // Deixe o browser definir o 'Content-Type' para 'multipart/form-data'
      // Não defina 'Content-Type': 'application/json'
    }
  });
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

  // Query para buscar tenants existentes
  const { data: tenants, isLoading: isLoadingTenants } = useQuery(
    ['sysAdminTenants'], // Chave de query única
    fetchTenants
  );

  // Mutation para criar novo tenant
  const mutation = useMutation(createTenant, {
    onSuccess: () => {
      queryClient.invalidateQueries(['sysAdminTenants']);
      alert('Tenant criado com sucesso!');
      reset();
    },
    onError: (error) => {
      alert(`Erro ao criar tenant: ${error.response?.data?.detail || error.message}`);
    }
  });

  // MUDANÇA: onSubmit agora cria FormData
  const onSubmit = (data) => {
    const formData = new FormData();

    // Adiciona os campos de texto
    formData.append('name', data.name);
    formData.append('cnpj', data.cnpj || '');
    formData.append('email', data.email || '');
    formData.append('phone', data.phone || '');
    formData.append('status', data.status);
    formData.append('commercial_info', data.commercial_info || '');

    // Adiciona o arquivo de logo (se existir)
    if (data.logo && data.logo[0]) {
      formData.append('logo', data.logo[0]);
    }
    
    mutation.mutate(formData);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Formulário de Criação de Tenant */}
      <div className="md:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Novo Tenant (Empresa)
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome da Empresa
              </label>
              <input
                id="name"
                {...register("name", { required: "Nome é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
              />
              {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
            </div>

            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                CNPJ
              </label>
              <input
                id="cnpj"
                {...register("cnpj")}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Comercial
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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input
                id="phone"
                {...register("phone")}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                {...register("status", { required: "Status é obrigatório" })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.status && <span className="text-red-500 text-sm">{errors.status.message}</span>}
            </div>

            {/* --- UPGRADE DO CAMPO DE LOGO --- */}
            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
                Logo (Upload)
              </label>
              <input
                id="logo"
                type="file"
                {...register("logo")}
                accept="image/png, image/jpeg, image/gif"
                className="mt-1 block w-full text-sm text-gray-700 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none file:bg-gray-200 file:border-0 file:px-3 file:py-2 file:mr-3 file:text-sm file:font-medium"
              />
            </div>
            {/* --- FIM DO UPGRADE --- */}

            <div>
              <label htmlFor="commercial_info" className="block text-sm font-medium text-gray-700">
                Informações Comerciais
              </label>
              <textarea
                id="commercial_info"
                rows={3}
                {...register("commercial_info")}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary"
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-repforce-primary hover:bg-opacity-90 disabled:bg-gray-400"
            >
              {mutation.isLoading ? 'Criando...' : 'Criar Tenant'}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Tenants */}
      <div className="md:col-span-2">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4">
            <h2 className="text-xl font-bold text-gray-800">Tenants Cadastrados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingTenants ? (
                  <tr><td colSpan="5" className="p-4 text-center">Carregando...</td></tr>
                ) : (
                  tenants?.map((tenant) => (
                    <tr key={tenant.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tenant.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* A logo agora é servida pela API, então o caminho relativo funciona */}
                        {tenant.logo_url ? (
                          <img src={tenant.logo_url} alt={`Logo ${tenant.name}`} className="h-10 w-10 object-contain" />
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.cnpj || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.email || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                          tenant.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {statusOptions.find(o => o.value === tenant.status)?.label || tenant.status}
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