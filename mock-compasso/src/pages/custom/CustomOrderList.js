import React, { useState, useEffect } from 'react';
import { useTabs } from '../../context/TabContext';
import apiClient from '../../api/apiClient';
import { Search, Plus, Filter, MoreHorizontal, ShoppingCart, Calendar, DollarSign, User } from 'lucide-react';

const CustomOrderList = ({ pageId }) => {
    const { openSubPage, updateTab, activeTabId } = useTabs();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        updateTab(activeTabId, { title: 'Pedidos' });
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/api/engine/object/pedidos');
            setOrders(data);
        } catch (error) {
            console.error("Erro ao carregar pedidos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (order) => {
        openSubPage({
             id: `order_${order.id}`,
             title: `Pedido ${order.numero_pedido || order.id}`,
             path: `/app/compasso/comercial/pedidos/ficha?id=${order.id}`,
             template: 'app_page', 
             data: { pageId: 'pedidos', subPageId: 'ficha', recordId: order.id }
        });
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
             {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Pedidos de Venda</h1>
                    <p className="text-sm text-gray-500">Gestão de vendas e faturamento</p>
                </div>
                <div className="flex items-center gap-3">
                   <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                        <Plus size={18} /> Novo Pedido
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                 {loading ? (
                    <div className="space-y-4">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                     <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                         <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-medium text-gray-500">Número</th>
                                        <th className="px-6 py-4 text-left font-medium text-gray-500">Cliente</th>
                                        <th className="px-6 py-4 text-left font-medium text-gray-500">Data</th>
                                        <th className="px-6 py-4 text-left font-medium text-gray-500">Valor Total</th>
                                        <th className="px-6 py-4 text-left font-medium text-gray-500">Status</th>
                                        <th className="px-6 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.map(order => (
                                        <tr key={order.id} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => handleRowClick(order)}>
                                            <td className="px-6 py-4 font-bold text-blue-600">
                                                <div className="flex items-center gap-2"><ShoppingCart size={16}/> #{order.numero_pedido || order.id.substring(0,6)}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-800">
                                                <div className="flex items-center gap-2"><User size={16} className="text-gray-400"/> CLIE-{order.cliente || order.cliente_id}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex items-center gap-2"><Calendar size={14}/> {new Date(order.created_at || Date.now()).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">R$ {order.valor_total || '0,00'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    order.status === 'Aprovado' ? 'bg-green-100 text-green-800' : 
                                                    order.status === 'Cancelado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {order.status || 'Rascunho'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <MoreHorizontal size={18} className="text-gray-400 hover:text-gray-600"/>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                        </table>
                     </div>
                )}
            </div>
        </div>
    );
};

export default CustomOrderList;
