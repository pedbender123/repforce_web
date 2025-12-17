import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const deleteProduct = async (id) => {
  await apiClient.delete(`/catalog/products/${id}`);
};

export default function ProductList() {
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useQuery(['products'], async () => {
    const res = await apiClient.get('/catalog/products');
    return res.data;
  });

  const deleteMutation = useMutation(deleteProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      alert('Produto excluído com sucesso!');
    },
    onError: () => alert('Erro ao excluir produto.')
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold dark:text-white">Catálogo de Produtos</h2>
        <Link to="/admin/products/new" className="bg-repforce-primary text-white px-4 py-2 rounded hover:bg-blue-700">
          Novo Produto
        </Link>
      </div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Img</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {products?.map((p) => (
            <tr key={p.id}>
              <td className="px-6 py-4">
                {p.image_url ? <img src={p.image_url} alt="" className="h-10 w-10 object-cover rounded" /> : '-'}
              </td>
              <td className="px-6 py-4 text-sm dark:text-white font-medium">{p.name}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{p.sku}</td>
              <td className="px-6 py-4 text-sm text-green-600 font-bold">R$ {p.price.toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{p.stock}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                <Link to={`/admin/products/${p.id}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                  <PencilIcon className="w-5 h-5" />
                </Link>
                <button onClick={() => { if (window.confirm('Excluir produto?')) deleteMutation.mutate(p.id) }} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}