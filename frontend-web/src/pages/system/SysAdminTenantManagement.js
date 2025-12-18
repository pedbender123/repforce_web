import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const fetchTenants = async () => {
  const { data } = await sysAdminApiClient.get('/sysadmin/tenants');
  return data;
};

const createTenant = async (formData) => {
  const { data } = await sysAdminApiClient.post('/sysadmin/tenants', formData);
  return data;
};

const typeOptions = [
  { value: 'industry', label: 'Indústria' },
  { value: 'agency', label: 'Agência' },
  { value: 'reseller', label: 'Revenda' },
];

export default function TenantManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: tenants, isLoading } = useQuery(['sysAdminTenants'], fetchTenants);

  const createMutation = useMutation(createTenant, {
    onSuccess: async (newTenant) => {
      // Setup Inicial Automático: Criar Área e Cargos Padrão
      try {
        const tenantId = newTenant.id;

        // 1. Criar Área de Administração (Padrão)
        const areaPayload = {
          name: 'Administração',
          description: 'Área de gestão do sistema',
          icon: 'ShieldAlert',
          tenant_id: tenantId,
          pages_json: [
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Usuários', path: '/admin/users' },
            { label: 'Cargos', path: '/admin/roles' },
            { label: 'Produtos', path: '/admin/products' }
          ]
        };
        const { data: area } = await sysAdminApiClient.post('/sysadmin/areas', areaPayload);

        // 2. Criar Cargo Admin (Vinculado à Área de Administração)
        const { data: adminRole } = await sysAdminApiClient.post('/sysadmin/roles', {
          name: 'Admin',
          description: 'Acesso total ao sistema',
          tenant_id: tenantId,
          area_ids: [area.id]
        });

        // 3. Criar Cargo Representante (Sem área padrão vinculada inicialmente, ou criar área Vendas separada?)
        // Para simplificar e atender o "MVP Enterprise", vamos criar apenas o Admin agora e deixar o Admin criar a área de vendas.
        // Ou criar uma segunda área de Vendas? Vamos criar a segunda área para não quebrar a expectativa de "Testar Vendas".

        const salesAreaPayload = {
          name: 'Vendas',
          icon: 'Briefcase',
          tenant_id: tenantId,
          pages_json: [
            { label: 'Dashboard', path: '/app/dashboard' },
            { label: 'Clientes', path: '/app/clients' },
            { label: 'Pedidos', path: '/app/orders/new' }
          ]
        };
        const { data: salesArea } = await sysAdminApiClient.post('/sysadmin/areas', salesAreaPayload);

        await sysAdminApiClient.post('/sysadmin/roles', {
          name: 'Representante',
          description: 'Força de Vendas',
          tenant_id: tenantId,
          area_ids: [salesArea.id]
        });

        // 4. ATRIBUIR CARGO ADMIN AO USUÁRIO PADRÃO
        // Pequeno delay para garantir que o usuário foi commitado no banco (se houver async no backend)
        await new Promise(r => setTimeout(r, 1000));

        const { data: tenantUsers } = await sysAdminApiClient.get(`/sysadmin/users?tenant_id=${tenantId}`);
        if (tenantUsers && tenantUsers.length > 0) {
          // Assume que o usuário criado junto com o tenant é o primeiro/único
          const adminUser = tenantUsers.find(u => u.email === newTenant.email) || tenantUsers[0];

          console.log("Atualizando usuário Admin:", adminUser, "para Role:", adminRole);

          await sysAdminApiClient.put(`/sysadmin/users/${adminUser.id}`, {
            ...adminUser,
            role_id: adminRole.id
          });
        }

        alert(`Tenant "${newTenant.name}" criado com sucesso! Configuração inicial (Área Vendas + Cargos + Usuário Admin) aplicada.`);
      } catch (setupError) {
        console.error("Erro no setup inicial:", setupError);
        alert(`Tenant criado, mas houve erro na configuração inicial: ${setupError.message}`);
      }

      queryClient.invalidateQueries(['sysAdminTenants']);
      reset();
      setIsCreating(false);
    },
    onError: (error) => alert(`Erro: ${error.response?.data?.detail || error.message}`)
  });

  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('cnpj', data.cnpj || '');
    formData.append('email', data.email || '');
    formData.append('status', 'active');
    formData.append('tenant_type', data.tenant_type);
    if (data.logo?.[0]) formData.append('logo', data.logo[0]);
    createMutation.mutate(formData);
  };

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-white">Novo Tenant</h2>
          <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium dark:text-gray-300">Nome</label>
            <input {...register("name", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">CNPJ</label>
              <input {...register("cnpj")} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Tipo</label>
              <select {...register("tenant_type")} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">
                {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-gray-300">Logo</label>
            <input type="file" {...register("logo")} className="w-full text-sm dark:text-gray-300" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Salvar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg h-full flex flex-col">
      <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold dark:text-white">Tenants (Empresas)</h2>
        <button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
          <PlusIcon className="w-5 h-5" /> Novo Tenant
        </button>
      </div>
      <div className="overflow-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tenants?.map(t => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 text-sm text-gray-500">{t.id}</td>
                <td className="px-6 py-4 text-sm font-medium dark:text-white">{t.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{t.cnpj}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${t.status === 'active' ? 'bg-green-100 text-green-800' :
                      t.status === 'provisioning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {t.status === 'provisioning' ? 'Aguardando Provisionamento' : t.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                  <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}