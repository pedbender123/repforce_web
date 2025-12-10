import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import sysAdminApiClient from '../../api/sysAdminApiClient';

// Importação EXPLÍCITA dos ícones (Mais seguro que import * as Icons)
import { 
    BriefcaseIcon, 
    CurrencyDollarIcon, 
    TruckIcon, 
    UsersIcon, 
    ShoppingCartIcon, 
    ChartBarIcon, 
    QuestionMarkCircleIcon,
    FolderIcon,
    CalendarIcon,
    ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

// Mapa de Ícones permitidos
const ICON_OPTIONS = {
    'BriefcaseIcon': { component: BriefcaseIcon, label: 'Maleta (Geral)' },
    'CurrencyDollarIcon': { component: CurrencyDollarIcon, label: 'Financeiro' },
    'TruckIcon': { component: TruckIcon, label: 'Logística' },
    'UsersIcon': { component: UsersIcon, label: 'Pessoas' },
    'ShoppingCartIcon': { component: ShoppingCartIcon, label: 'Vendas' },
    'ChartBarIcon': { component: ChartBarIcon, label: 'Relatórios' },
    'FolderIcon': { component: FolderIcon, label: 'Arquivos' },
    'CalendarIcon': { component: CalendarIcon, label: 'Agenda' },
    'ClipboardDocumentListIcon': { component: ClipboardDocumentListIcon, label: 'Tarefas' },
};

// --- API Functions ---
const fetchAreas = async () => {
  try {
    const { data } = await sysAdminApiClient.get('/sysadmin/areas');
    return data || []; // Garante array
  } catch (e) {
    console.error("Erro ao buscar áreas", e);
    return [];
  }
};

const fetchTenants = async () => {
  try {
    const { data } = await sysAdminApiClient.get('/sysadmin/tenants');
    return data || [];
  } catch (e) {
    console.error("Erro ao buscar tenants", e);
    return [];
  }
};

const createArea = async (data) => {
  const { data: res } = await sysAdminApiClient.post('/sysadmin/areas', data);
  return res;
};

const deleteArea = async (id) => {
  await sysAdminApiClient.delete(`/sysadmin/areas/${id}`);
};

export default function AreasManagement() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  
  // Queries
  const { data: areas, isLoading: loadingAreas } = useQuery(['sysAreas'], fetchAreas);
  const { data: tenants } = useQuery(['sysTenants'], fetchTenants);

  // Mutations
  const createMutation = useMutation(createArea, {
    onSuccess: () => {
      queryClient.invalidateQueries(['sysAreas']);
      reset();
      // Feedback simples (pode ser melhorado com Toast)
      alert('Área criada com sucesso!');
    },
    onError: (err) => {
        alert('Erro ao criar área: ' + (err.response?.data?.detail || err.message));
    }
  });

  const deleteMutation = useMutation(deleteArea, {
    onSuccess: () => queryClient.invalidateQueries(['sysAreas'])
  });

  const onSubmit = (data) => {
    if (!data.tenant_id) return alert("Selecione um Tenant");
    
    createMutation.mutate({
        ...data,
        tenant_id: parseInt(data.tenant_id),
        order: parseInt(data.order || 0)
    });
  };

  // Preview do ícone selecionado no form
  const selectedIconKey = watch('icon');
  const SelectedIconComponent = ICON_OPTIONS[selectedIconKey]?.component || QuestionMarkCircleIcon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      
      {/* Form de Criação */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-repforce-primary rounded-full"></span>
                Nova Área
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tenant (Empresa)</label>
                    <select 
                        {...register('tenant_id', { required: true })} 
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-repforce-primary focus:ring-repforce-primary sm:text-sm p-2.5"
                    >
                        <option value="">Selecione...</option>
                        {tenants?.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rótulo (Nome)</label>
                    <input 
                        {...register('label', { required: true })} 
                        placeholder="Ex: Vendas" 
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-repforce-primary focus:ring-repforce-primary sm:text-sm p-2.5" 
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ícone</label>
                    <div className="flex gap-3 items-center">
                        <select 
                            {...register('icon', { required: true })} 
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-repforce-primary focus:ring-repforce-primary sm:text-sm p-2.5"
                        >
                            <option value="">Selecione...</option>
                            {Object.entries(ICON_OPTIONS).map(([key, value]) => (
                                <option key={key} value={key}>{value.label}</option>
                            ))}
                        </select>
                        <div className="p-2.5 bg-gray-100 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-600">
                            <SelectedIconComponent className="w-6 h-6 text-repforce-primary" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ordem de Exibição</label>
                    <input 
                        type="number" 
                        {...register('order')} 
                        defaultValue={1} 
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-repforce-primary focus:ring-repforce-primary sm:text-sm p-2.5" 
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={createMutation.isLoading} 
                    className="w-full bg-repforce-primary hover:bg-blue-700 text-white font-medium py-2.5 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                >
                    {createMutation.isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Criar Área'}
                </button>
            </form>
        </div>
      </div>

      {/* Lista de Áreas */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-white">Estrutura Existente</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                    {areas?.length || 0} Áreas
                </span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tenant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Área</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ícone</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ordem</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loadingAreas ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">Carregando dados...</td></tr>
                        ) : areas?.length === 0 ? (
                            <tr><td colSpan="5" className="p-12 text-center text-gray-400 italic">Nenhuma área configurada no sistema.</td></tr>
                        ) : areas?.map(area => {
                            const IconData = ICON_OPTIONS[area.icon];
                            const AreaIcon = IconData ? IconData.component : QuestionMarkCircleIcon;
                            const tenantName = tenants?.find(t => t.id === area.tenant_id)?.name || `ID: ${area.tenant_id}`;
                            
                            return (
                                <tr key={area.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-medium">
                                        {tenantName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                        {area.label}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex justify-center">
                                            <AreaIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" title={area.icon} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                                        {area.order}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => { if(window.confirm(`Tem certeza que deseja excluir a área "${area.label}"? Isso removerá o acesso a ela.`)) deleteMutation.mutate(area.id) }}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}