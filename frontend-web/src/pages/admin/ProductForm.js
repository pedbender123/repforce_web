import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';

export default function ProductForm() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    formData.append('cost_price', data.cost_price);
    formData.append('stock', data.stock);
    if (data.image[0]) formData.append('image', data.image[0]);
    mutation.mutate(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">Cadastrar Produto</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Produto</label>
            <input {...register('name', { required: true })} className="mt-1 w-full rounded-md border-gray-300 dark:bg-gray-700 dark:text-white p-2 border"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SKU</label>
                <input {...register('sku')} className="mt-1 w-full rounded-md border-gray-300 dark:bg-gray-700 dark:text-white p-2 border"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estoque</label>
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
            <input type="file" {...register('image')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        </div>
        <button type="submit" disabled={mutation.isLoading} className="w-full bg-repforce-primary text-white py-2 rounded-md hover:bg-blue-700 mt-4">
            {mutation.isLoading ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </form>
    </div>
  );
}