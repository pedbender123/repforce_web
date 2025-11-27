import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { Link } from 'react-router-dom';

export default function ProductList() {
  const { data: products, isLoading } = useQuery(['products'], async () => {
    const res = await apiClient.get('/catalog/products');
    return res.data;
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
            </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {products?.map((p) => (
                <tr key={p.id}>
                    <td className="px-6 py-4">
                        {p.image_url ? <img src={p.image_url} alt="" className="h-10 w-10 object-cover rounded"/> : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm dark:text-white font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.sku}</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-bold">R$ {p.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.stock}</td>
                </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}