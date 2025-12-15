import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

// API Calls
const fetchAreas = async () => {
  const { data } = await sysAdminApiClient.get('/sysadmin/areas');
  return data;
};
const fetchTenants = async () => {
    const { data } = await sysAdminApiClient.get('/sysadmin/tenants');
    return data;
};
const fetchRoles = async (tenantId) => {
    if(!tenantId) return [];
    const { data } = await sysAdminApiClient.get(`/sysadmin/roles?tenant_id=${tenantId}`);
    return data;
};
const createArea = async (data) => {
    const { data: res } = await sysAdminApiClient.post('/sysadmin/areas', data);
    return res;
};

// Icons Options
const iconOptions = ['LayoutDashboard', 'ShoppingCart', 'Users', 'Map', 'Package', 'Settings', 'Briefcase', 'Phone'];

export default function AreaManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  
  const queryClient = useQueryClient();
  const { register, control, handleSubmit, reset, watch } = useForm({
      defaultValues: { pages_json: [{ label: '', path: '' }] }
  });
  
  const { fields, append, remove } = useFieldArray({ control, name: "pages_json" });

  // Watch tenant selection to load roles
  const tenantIdWatch = watch("tenant_id");
  React.useEffect(() => { setSelectedTenant(tenantIdWatch) }, [tenantIdWatch]);

  const { data: areas } = useQuery(['sysAdminAreas'], fetchAreas);
  const { data: tenants } = useQuery(['sysAdminTenants'], fetchTenants);
  const { data: roles } = useQuery(['tenantRoles', selectedTenant], () => fetchRoles(selectedTenant), {
      enabled: !!selectedTenant
  });

  const mutation = useMutation(createArea, {
      onSuccess: () => {
          queryClient.invalidateQueries(['sysAdminAreas']);
          alert('Área criada com sucesso!');
          reset();
          setIsCreating(false);
      },
      onError: (err) => alert(err.response?.data?.detail || "Erro ao criar área")
  });

  const onSubmit = (data) => {
      // Formata dados
      const payload = {
          name: data.name,
          icon: data.icon,
          tenant_id: parseInt(data.tenant_id),
          pages_json: data.pages_json,
          allowed_role_ids: data.role_ids ? data.role_ids.map(id => parseInt(id)) : []
      };
      mutation.mutate(payload);
  };

  if (isCreating) {
      return (
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold dark:text-white">Nova Área de Trabalho</h2>
                  <button onClick={() => setIsCreating(false)}><XMarkIcon className="w-6 h-6 text-gray-500"/></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium dark:text-gray-300">Nome da Área</label>
                          <input {...register("name", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"/>
                      </div>
                      <div>
                          <label className="block text-sm font-medium dark:text-gray-300">Ícone</label>
                          <select {...register("icon")} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">
                              {iconOptions.map(i => <option key={i} value={i}>{i}</option>)}
                          </select>
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-medium dark:text-gray-300">Tenant (Empresa)</label>
                      <select {...register("tenant_id", { required: true })} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">
                          <option value="">Selecione...</option>
                          {tenants?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                  </div>

                  {/* Páginas */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                      <div className="flex justify-between mb-2">
                          <h3 className="font-semibold dark:text-white">Páginas do Menu (Max 8)</h3>
                          <button type="button" onClick={() => append({ label: '', path: '' })} className="text-sm text-blue-600 hover:underline">+ Adicionar Página</button>
                      </div>
                      {fields.map((item, index) => (
                          <div key={item.id} className="flex gap-2 mb-2">
                              <input {...register(`pages_json.${index}.label`)} placeholder="Nome (Ex: Pedidos)" className="flex-1 p-2 border rounded text-sm"/>
                              <input {...register(`pages_json.${index}.path`)} placeholder="Rota (Ex: /app/orders)" className="flex-1 p-2 border rounded text-sm"/>
                              <button type="button" onClick={() => remove(index)} className="text-red-500"><TrashIcon className="w-4 h-4"/></button>
                          </div>
                      ))}
                  </div>

                  {/* Roles */}
                  {selectedTenant && (
                      <div>
                          <label className="block text-sm font-medium dark:text-gray-300 mb-2">Cargos com Acesso (Além do Admin)</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {roles?.map(role => (
                                  role.name !== 'Admin' && (
                                    <label key={role.id} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                                        <input type="checkbox" value={role.id} {...register("role_ids")} className="rounded text-blue-600"/>
                                        <span className="text-sm dark:text-white">{role.name}</span>
                                    </label>
                                  )
                              ))}
                              {(!roles || roles.length === 0 || (roles.length === 1 && roles[0].name === 'Admin')) && 
                                <p className="text-xs text-gray-500 col-span-4">Nenhum cargo extra encontrado. O Admin terá acesso automático.</p>
                              }
                          </div>
                      </div>
                  )}

                  <button type="submit" className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700">Criar Área</button>
              </form>
          </div>
      );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg h-full flex flex-col">
      <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold dark:text-white">Gerenciar Áreas</h2>
        <button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
            <PlusIcon className="w-5 h-5"/> Nova Área
        </button>
      </div>
      <div className="overflow-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Páginas</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {areas?.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 dark:text-white font-medium flex items-center gap-2">
                            {a.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{tenants?.find(t=>t.id===a.tenant_id)?.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{a.pages_json?.length || 0} páginas</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}