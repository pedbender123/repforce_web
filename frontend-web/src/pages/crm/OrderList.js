import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';

const fetchOrders = async () => {
    const { data } = await apiClient.get('/orders');
    return data;
};

export default function OrderList() {
    const navigate = useNavigate();

    const { data: orders, isLoading, isError } = useQuery(['orders'], fetchOrders, {
        retry: 1,
    });

    if (isLoading) return <div className="p-8 text-center dark:text-white">Carregando pedidos...</div>;
    if (isError) return <div className="p-8 text-center text-red-600">Erro ao carregar pedidos.</div>;

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden h-full flex flex-col transition-colors">
            {/* Header */}
            <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                <h2 className="text-xl font-bold dark:text-white text-gray-800">Meus Pedidos</h2>
                <button
                    onClick={() => navigate('/app/orders/new')}
                    className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" /> <span>Novo Pedido</span>
                </button>
            </div>

            {/* Content */}
            <div className="overflow-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total (R$)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {orders?.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">#{order.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${order.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            order.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {order.status === 'draft' ? 'Rascunho' :
                                            order.status === 'approved' ? 'Aprovado' : order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-right font-bold text-gray-900 dark:text-white">
                                    {order.total_value?.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                        <EyeIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {orders?.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                    Nenhum pedido encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
