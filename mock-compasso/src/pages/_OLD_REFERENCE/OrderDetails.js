import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import EditableField from '../../components/EditableField';
import { ArrowLeftIcon, CheckIcon, XMarkIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch Order Data
    const { data: order, isLoading, isError } = useQuery(['order', id], async () => {
        const res = await apiClient.get(`/crm/orders/${id}`);
        return res.data;
    });

    // Update Order Mutation (Status/Notes)
    const updateOrderMutation = useMutation((data) => {
        return apiClient.put(`/crm/orders/${id}`, data);
    }, {
        onSuccess: () => {
            queryClient.invalidateQueries(['order', id]);
            queryClient.invalidateQueries(['orders']);
        },
        onError: (err) => alert("Erro ao atualizar pedido: " + err.message)
    });

    // Handle Status Change
    const changeStatus = (newStatus) => {
        if (window.confirm(`Tem certeza que deseja mudar o status para ${newStatus}?`)) {
            updateOrderMutation.mutate({ status: newStatus });
        }
    };

    const handleUpdate = (field, value) => {
        updateOrderMutation.mutate({ [field]: value });
    };

    if (isLoading) return <div className="p-8 text-center dark:text-white">Carregando pedido...</div>;
    if (isError) return <div className="p-8 text-center text-red-600">Erro ao carregar pedido.</div>;

    const STATUS_COLORS = {
        'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        'submitted': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        'canceled': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400">
                    <ArrowLeftIcon className="w-4 h-4 mr-1" /> Voltar
                </button>

                {/* Status Actions */}
                <div className="flex gap-2">
                    {order.status === 'submitted' && (
                        <>
                            <button onClick={() => changeStatus('approved')} className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                                <CheckIcon className="w-4 h-4 mr-1" /> Aprovar
                            </button>
                            <button onClick={() => changeStatus('rejected')} className="flex items-center px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                                <XMarkIcon className="w-4 h-4 mr-1" /> Rejeitar
                            </button>
                        </>
                    )}
                    {(order.status === 'draft' || order.status === 'submitted') && (
                        <button onClick={() => changeStatus('canceled')} className="flex items-center px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">
                            <NoSymbolIcon className="w-4 h-4 mr-1" /> Cancelar
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Header Info */}
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Pedido #{order.id}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Cliente: <span className="font-semibold text-gray-800 dark:text-gray-200">{order.client?.fantasy_name || order.client_id}</span>
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Criado em: {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 text-sm font-bold rounded-full ${STATUS_COLORS[order.status] || ''} uppercase`}>
                            {order.status}
                        </span>
                        <div className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_value)}
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-800 dark:text-white">Itens do Pedido</h3>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit.</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {order.items?.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                        {item.name || `Produto #${item.product_id}`}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-500 dark:text-gray-300">
                                        {item.quantity}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-500 dark:text-gray-300">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right font-bold text-gray-900 dark:text-white">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Notes & Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Observações</h3>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-sm text-yellow-800 dark:text-yellow-200">
                            <EditableField
                                value={order.notes || "Sem observações."}
                                onSave={(v) => handleUpdate('notes', v)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
