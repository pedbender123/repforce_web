import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient'; 
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';

/**
 * Este é o componente "Mágico".
 * Ele recebe configurações (via props ou data do backend) e monta a tela sozinho.
 */
export default function GenericListForm({ config }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();
  
  // Configurações padrão caso não venham
  const { 
    endpoint, 
    title = 'Gerenciamento', 
    columns = [], 
    fields = [] 
  } = config || {};

  // Hook Form
  const { register, handleSubmit, reset, setValue } = useForm();

  // 1. Fetch Data (Lista)
  const { data: items, isLoading } = useQuery([endpoint], async () => {
    if (!endpoint) return [];
    
    // Pequena lógica para decidir qual cliente usar (SysAdmin vs App normal)
    // Se o endpoint começar com /sysadmin, usa o cliente específico (se você tiver um importado dinamicamente ou usar lógica de token)
    // Por simplificação aqui, usaremos o apiClient padrão e assumimos que o token correto está no localStorage
    // OBS: Se precisar separar estritamente, pode injetar o cliente via props.
    
    // Verifica se é rota de sysadmin para tentar usar o token de sysadmin se necessário
    // (Isso depende de como você organizou seus clients, mas vamos pelo padrão por enquanto)
    const res = await apiClient.get(endpoint);
    return res.data;
  }, { enabled: !!endpoint });

  // 2. Mutation (Create/Update)
  const mutation = useMutation(async (formData) => {
    if (editingItem) {
      return apiClient.put(`${endpoint}/${editingItem.id}`, formData);
    } else {
      return apiClient.post(endpoint, formData);
    }
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries([endpoint]);
      closeForm();
    },
    onError: (err) => alert('Erro: ' + (err.response?.data?.detail || err.message))
  });

  // Ações
  const openNew = () => {
    setEditingItem(null);
    reset();
    setIsEditing(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    // Popula o form
    fields.forEach(f => setValue(f.name, item[f.name]));
    setIsEditing(true);
  };

  const closeForm = () => {
    setIsEditing(false);
    setEditingItem(null);
    reset();
  };

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (!endpoint) return <div className="p-4 text-red-500">Erro: Endpoint não definido para este template.</div>;

  // --- MODO FORMULÁRIO ---
  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-fade-in h-full">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
            <h2 className="text-xl font-bold dark:text-white">
                {editingItem ? `Editar ${title}` : `Novo ${title}`}
            </h2>
            <button onClick={closeForm} className="text-gray-500 hover:text-red-500 transition-colors">
                <XMarkIcon className="w-6 h-6"/>
            </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map((field) => (
                    <div key={field.name} className={field.fullWidth ? 'col-span-2' : ''}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'select' ? (
                            <select {...register(field.name, { required: field.required })} className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 p-2.5 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                <option value="">Selecione...</option>
                                {field.options?.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ) : (
                            <input 
                                type={field.type || 'text'} 
                                {...register(field.name, { required: field.required })}
                                className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 p-2.5 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={closeForm} className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors">
                    <CheckIcon className="w-4 h-4"/> Salvar
                </button>
            </div>
        </form>
      </div>
    );
  }

  // --- MODO LISTA ---
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
        <button onClick={openNew} className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm shadow-sm transition-colors">
            <PlusIcon className="w-4 h-4"/> Novo
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                    {columns.map(col => (
                        <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {col.label}
                        </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                    <tr><td colSpan={columns.length + 1} className="p-8 text-center text-gray-500">Carregando dados...</td></tr>
                ) : items?.length === 0 ? (
                    <tr><td colSpan={columns.length + 1} className="p-8 text-center text-gray-400 italic">Nenhum registro encontrado.</td></tr>
                ) : items?.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        {columns.map(col => (
                            <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                {col.type === 'badge' ? (
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                        ${item[col.key] === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                    `}>
                                        {item[col.key]}
                                    </span>
                                ) : (
                                    item[col.key] || '-'
                                )}
                            </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => openEdit(item)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4 transition-colors">
                                <PencilIcon className="w-4 h-4"/>
                            </button>
                            <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                                <TrashIcon className="w-4 h-4"/>
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