import React, { useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { Link, useNavigate } from 'react-router-dom';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { AuthContext } from '../../context/AuthContext';

const deleteProduct = async (id) => {
    await apiClient.delete(`/catalog/products/${id}`);
};

export default function ProductList() {
    const queryClient = useQueryClient();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Verifica permissão simplificada (idealmente viria do backend/token)
    // Assumindo que apenas não-vendedores podem editar catálogo por enquanto
    const canEdit = user?.profile !== 'representante' && user?.profile !== 'sales_rep';

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

    if (isLoading) return <div className="p-8 text-center dark:text-white">Carregando catálogo...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden h-full flex flex-col transition-colors">
            <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                <h2 className="text-xl font-bold dark:text-white text-gray-800">Catálogo de Produtos</h2>
                {canEdit && (
                    <button
                        onClick={() => navigate('/admin/products/new')}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" /> Novo Produto
                    </button>
                )}
            </div>

            <div className="overflow-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Img</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Preço</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estoque</th>
                            {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {products?.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="px-6 py-4">
                                    {p.image_url ?
                                        <img src={p.image_url} alt="" className="h-10 w-10 object-cover rounded border dark:border-gray-600" /> :
                                        <span className="text-gray-400 dark:text-gray-500">-</span>
                                    }
                                </td>
                                <td className="px-6 py-4 text-sm dark:text-white font-medium">{p.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{p.sku}</td>
                                <td className="px-6 py-4 text-sm text-green-600 dark:text-green-400 font-bold">R$ {p.price?.toFixed(2)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{p.stock}</td>
                                {canEdit && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                        <button
                                            onClick={() => navigate(`/admin/products/${p.id}`)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                                            title="Editar"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => { if (window.confirm('Excluir produto?')) deleteMutation.mutate(p.id) }}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                                            title="Excluir"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {products?.length === 0 && (
                            <tr>
                                <td colSpan={canEdit ? 6 : 5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                    Nenhum produto encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
