import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const fetchTenants = async () => {
  const { data } = await sysAdminApiClient.get('/sysadmin/tenants');
  return data;
};

// Use Manager API for Atomic Provisioning (Tenant + User + Schema)
const createTenant = async (jsonData) => {
  const { data } = await sysAdminApiClient.post('/manager/tenants', jsonData);
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
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm();

  // Auto-generate slug from name
  const nameValue = watch("name");
  React.useEffect(() => {
    if (nameValue && isCreating) {
      const slug = nameValue.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue("slug", slug);
    }
  }, [nameValue, setValue, isCreating]);

  const { data: tenants, isLoading } = useQuery(['sysAdminTenants'], fetchTenants);

  const createMutation = useMutation(createTenant, {
    onSuccess: async (newTenant) => {
      alert(`Tenant "${newTenant.tenant?.slug}" provisionado com sucesso! Admin: ${newTenant.admin?.email}`);
      queryClient.invalidateQueries(['sysAdminTenants']);
      reset();
      setIsCreating(false);
    },
    onError: (error) => alert(`Erro: ${error.response?.data?.detail || error.message}`)
  });

  const [editingTenant, setEditingTenant] = useState(null);

  const updateTenant = async ({ id, data }) => {
    const { data: result } = await sysAdminApiClient.put(`/sysadmin/tenants/${id}`, data);
    return result;
  };

  const deleteTenant = async (id) => {
    await sysAdminApiClient.delete(`/sysadmin/tenants/${id}`);
  };

  const updateMutation = useMutation(updateTenant, {
    onSuccess: () => {
      queryClient.invalidateQueries(['sysAdminTenants']);
      reset();
      setEditingTenant(null);
      setIsCreating(false);
    },
    onError: (error) => alert(`Erro ao atualizar: ${error.message}`)
  });

  const deleteMutation = useMutation(deleteTenant, {
    onSuccess: () => {
      queryClient.invalidateQueries(['sysAdminTenants']);
    },
    onError: (error) => alert(`Erro ao remover: ${error.message}`)
  });

  const onSubmit = (data) => {
    if (editingTenant) {
      // Edit logic remains same (just metadata)
      updateMutation.mutate({
        id: editingTenant.id,
        data: {
          name: data.name,
          cnpj: data.cnpj,
          tenant_type: data.tenant_type
        }
      });
      return;
    }

    // New Tenant Payload for Manager API
    const payload = {
      name: data.name,
      slug: data.slug,
      plan_type: 'trial',
      admin_email: data.admin_email,
      admin_password: data.admin_password,
      admin_name: data.admin_name || 'Admin'
    };

    createMutation.mutate(payload);
  };

  const handleEdit = (tenant) => {
    setEditingTenant(tenant);
    reset({
      name: tenant.name,
      cnpj: tenant.cnpj,
      tenant_type: tenant.tenant_type || 'industry'
    });
    setIsCreating(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Tem certeza que deseja remover este tenant? Esta ação não pode ser desfeita.")) {
      deleteMutation.mutate(id);
    }
  };

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-white">{editingTenant ? 'Editar Tenant' : 'Novo Tenant'}</h2>
          <button onClick={() => { setIsCreating(false); setEditingTenant(null); reset({}); }} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tenant Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Nome da Empresa</label>
              <input {...register("name", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Slug (URL)</label>
              <input {...register("slug", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white bg-gray-100" readOnly={!editingTenant} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">CNPJ (Opcional)</label>
              <input {...register("cnpj")} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300">Tipo da Operação</label>
              <select {...register("tenant_type")} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">
                {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Admin User Provisioning - Only for Create */}
          {!editingTenant && (
            <div className="border-t pt-4 mt-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-3 dark:text-white">Dados do Administrador Inicial</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Nome do Admin</label>
                  <input {...register("admin_name", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" defaultValue="Administrador" />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Email do Admin (Login)</label>
                  <input type="email" {...register("admin_email", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Senha Inicial</label>
                  <input type="password" {...register("admin_password", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            {editingTenant ? 'Salvar Alterações' : 'Provisionar Tenant'}
          </button>
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
                  <button
                    onClick={() => handleEdit(t)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
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