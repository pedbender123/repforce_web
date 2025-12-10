import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import * as Icons from '@heroicons/react/24/outline'; // Importa ícones para preview

// --- API Functions ---
const fetchAreas = async () => {
  const { data } = await sysAdminApiClient.get('/sysadmin/areas');
  return data;
};

const fetchTenants = async () => {
  const { data } = await sysAdminApiClient.get('/sysadmin/tenants');
  return data;
};

const createArea = async (data) => {
  const { data: res } = await sysAdminApiClient.post('/sysadmin/areas', data);
  return res;
};

const deleteArea = async (id) => {
  await sysAdminApiClient.delete(`/sysadmin/areas/${id}`);
};

// Lista de ícones disponíveis para escolher (nomes do Heroicons)
const availableIcons = ['BriefcaseIcon', 'CurrencyDollarIcon', 'TruckIcon', 'UsersIcon', 'ShoppingCartIcon', 'ChartBarIcon'];

export default function AreasManagement() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch } = useForm();
  
  // Queries
  const { data: areas, isLoading: loadingAreas } = useQuery(['sysAreas'], fetchAreas);
  const { data: tenants } = useQuery(['sysTenants'], fetchTenants);

  // Mutations
  const createMutation = useMutation(createArea, {
    onSuccess: () => {
      queryClient.invalidateQueries(['sysAreas']);
      reset();
      alert('Área criada!');
    }
  });

  const deleteMutation = useMutation(deleteArea, {
    onSuccess: () => queryClient.invalidateQueries(['sysAreas'])
  });

  const onSubmit = (data) => {
    createMutation.mutate({
        ...data,
        tenant_id: parseInt(data.tenant_id),
        order: parseInt(data.order || 0)
    });
  };

  // Preview do ícone selecionado no form
  const selectedIcon = watch('icon');
  const PreviewIcon = selectedIcon && Icons[selectedIcon] ? Icons[selectedIcon] : Icons.QuestionMarkCircleIcon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Form de Criação */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Nova Área</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tenant (Empresa)</label>
                    <select {...register('tenant_id', { required: true })} className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:text-white shadow-sm p-2">
                        <option value="">Selecione...</option>
                        {tenants?.map(t => (
                            <option key={t.id} value={t.id}>{t.name} (ID: {t.id})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rótulo (Nome)</label>
                    <input {...register('label', { required: true })} placeholder="Ex: Vendas" className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:text-white shadow-sm p-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ícone (Heroicons)</label>
                    <div className="flex gap-2 items-center">
                        <select {...register('icon', { required: true })} className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:text-white shadow-sm p-2">
                            <option value="">Selecione...</option>
                            {availableIcons.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                        </select>
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                            <PreviewIcon className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ordem</label>
                    <input type="number" {...register('order')} defaultValue={1} className="mt-1 block w-full rounded-md border-gray-300 dark:bg-gray-700 dark:text-white shadow-sm p-2" />
                </div>

                <button type="submit" disabled={createMutation.isLoading} className="w-full bg-repforce-primary text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                    {createMutation.isLoading ? 'Salvando...' : 'Criar Área'}
                </button>
            </form>
        </div>
      </div>

      {/* Lista de Áreas */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white">Estrutura Existente</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tenant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Área</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ícone</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loadingAreas ? <tr><td colSpan="4" className="p-4 text-center dark:text-white">Carregando...</td></tr> : areas?.map(area => {
                        const AreaIcon = Icons[area.icon] || Icons.QuestionMarkCircleIcon;
                        const tenantName = tenants?.find(t => t.id === area.tenant_id)?.name || area.tenant_id;
                        return (
                            <tr key={area.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{tenantName}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{area.label}</td>
                                <td className="px-6 py-4">
                                    <AreaIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => { if(window.confirm('Deletar área e suas páginas?')) deleteMutation.mutate(area.id) }}
                                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                    {areas?.length === 0 && (
                        <tr><td colSpan="4" className="p-8 text-center text-gray-500">Nenhuma área configurada.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}