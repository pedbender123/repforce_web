import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';

export default function ProductForm() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Busca os dados do usuário para saber o tipo de tenant
  const { data: userInfo } = useQuery(['currentUser'], async () => {
    const res = await apiClient.get('/auth/users/me');
    return res.data;
  });

  const tenantType = userInfo?.tenant?.tenant_type || 'industry'; // Default seguro

  // 2. Busca fornecedores (apenas se não for indústria)
  const { data: suppliers } = useQuery(['suppliers'], async () => {
    const res = await apiClient.get('/catalog/suppliers');
    return res.data;
  }, {
    enabled: tenantType !== 'industry' // Só carrega se não for fabricante
  });

  const mutation = useMutation((formData) => {
    return apiClient.post('/catalog/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
  }, {
    onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        navigate('/admin/products');
    }
  });

  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('price', data.price);
    formData.append('sku', data.sku);
    formData.append('cost_price', data.cost_price || 0);
    
    // Estoque: Se for Agency, pode não controlar (mandar 0 ou valor informativo)
    formData.append('stock', data.stock || 0);
    
    // Fornecedor: Se for Indústria, é ela mesma (null)
    if (data.supplier_id) {
        formData.append('supplier_id', data.supplier_id);
    }

    if (data.image[0]) formData.append('image', data.image[0]);
    
    mutation.mutate(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow max-w-2xl mx-auto transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">Cadastrar Produto</h2>
      
      {/* Badge informativo do tipo de tenant */}
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Modo de cadastro: <span className="font-semibold uppercase">{tenantType === 'industry' ? 'Fabricação Própria' : tenantType === 'agency' ? 'Representação' : 'Revenda'}</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Produto</label>
            <input {...register('name', { required: true })} className="mt-1 w-full rounded-md border-gray-300 dark:bg-gray-700 dark:text-white p-2 border"/>
        </div>
        
        {/* Seleção de Fornecedor - Lógica Condicional */}
        {tenantType !== 'industry' && (
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fornecedor / Representada</label>
                <select 
                    {...register('supplier_id')} 
                    className="mt-1 w-full rounded-md border-gray-300 dark:bg-gray-700 dark:text-white p-2 border"
                >
                    <option value="">Selecione...</option>
                    {suppliers?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Quem fabrica ou fornece este produto.</p>
            </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SKU</label>
                <input {...register('sku')} className="mt-1 w-full rounded-md border-gray-300 dark:bg-gray-700 dark:text-white p-2 border"/>
            </div>
            
            {/* Campo de Estoque - Condicional ou Adaptado */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tenantType === 'agency' ? 'Estoque na Fábrica (Ref.)' : 'Estoque Físico'}
                </label>
                <input type="number" {...register('stock')} className="mt-1 w-full rounded-md border-gray-300 dark:bg-gray-700 dark:text-white p-2 border"/>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço Venda (R$)</label>
                <input type="number" step="0.01" {...register('price', { required: true })} className="mt-1 w-full rounded-md border-gray-300 dark:bg-gray-700 dark:text-white p-2 border"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço Custo (R$)</label>
                <input type="number" step="0.01" {...register('cost_price')} className="mt-1 w-full rounded-md border-gray-300 dark:bg-gray-700 dark:text-white p-2 border"/>
            </div>
        </div>
        
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Imagem</label>
            <input type="file" {...register('image')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-white"/>
        </div>
        
        <button type="submit" disabled={mutation.isLoading} className="w-full bg-repforce-primary text-white py-2 rounded-md hover:bg-blue-700 mt-4">
            {mutation.isLoading ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </form>
    </div>
  );
}