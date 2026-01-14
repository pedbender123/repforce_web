import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { User, Phone, Mail, MapPin, Building, FileText, ShoppingCart, DollarSign, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useTabs } from '../../context/TabContext';

const CustomClient360 = () => {
    const [searchParams] = useSearchParams();
    const clientId = searchParams.get('id');
    const [client, setClient] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    // Internal Tab State (Pedidos vs Orçamentos)
    const [activeTab, setActiveTab] = useState('pedidos');
    const { openSubPage, updateTab, activeTabId } = useTabs(); // Merged hook call

    useEffect(() => {
        if (clientId) loadData();
    }, [clientId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load Client
            const { data: clientData } = await apiClient.get(`/api/engine/object/clientes/${clientId}`);
            setClient(clientData);
            
            // Update Tab Title
            updateTab(activeTabId, { title: clientData.nome_fantasia || clientData.razao_social || 'Ficha Cliente' });

            // Load Orders (Mocked query for now or real if relationship exists)
            // Assuming filter convention: ?cliente_id=XYZ
            // Fallback to fetch all and filter client side for MVP Stability if API filter is shaky
            const { data: ordersData } = await apiClient.get(`/api/engine/object/pedidos`); // Get all for MVP Safety
            // Filter manually to be safe
            // Assuming order has 'cliente' (lookup ID) or 'cliente_id'
            // Let's implement robust filtering in frontend for the demo
            const clientOrders = ordersData.filter(o => String(o.cliente) === String(clientId) || String(o.cliente_id) === String(clientId));
            setOrders(clientOrders);

        } catch (error) {
            console.error("Erro carregando ficha 360", error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleOrderClick = (order) => {
        // Open Order Tab
        openSubPage({
             id: `order_${order.id}`,
             title: `Pedido ${order.numero_pedido || order.id}`,
             path: `/app/compasso/comercial/pedidos/ficha?id=${order.id}`,
             template: 'app_page',
             data: { pageId: 'pedidos', subPageId: 'ficha', recordId: order.id }
        });
    }

    if (loading) return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
    if (!client) return <div className="p-10 text-center text-red-500">Cliente não encontrado</div>;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            {/* 360 Header Banner */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between">
                     <div className="flex items-center gap-6">
                         <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                             {(client.nome_fantasia || '?')[0]}
                         </div>
                         <div>
                             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{client.nome_fantasia}</h1>
                             <div className="flex items-center gap-2 text-gray-500 mt-1">
                                 <Building size={16} /> <span>{client.razao_social}</span>
                                 <span className="mx-2">•</span>
                                 <span>CNPJ: {client.cnpj_cpf}</span>
                             </div>
                             <div className="flex items-center gap-4 mt-3">
                                 <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wide ${client.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                     {client.ativo ? 'Cliente Ativo' : 'Inativo'}
                                 </span>
                                 <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold uppercase">
                                     {client.tabela_preco || 'Padrão'}
                                 </span>
                             </div>
                         </div>
                     </div>
                     
                     {/* Quick Actions */}
                     <div className="flex gap-3">
                         <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm font-medium">Editar</button>
                         <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium flex items-center gap-2">
                             <ShoppingCart size={18} /> Novo Pedido
                         </button>
                     </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 p-6">
                {/* Left Column: Info Card */}
                <div className="col-span-4 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <User size={20} className="text-blue-500"/> Dados de Contato
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="text-gray-400 mt-1" size={18} />
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold">Email</div>
                                    <div className="text-sm text-blue-600 hover:underline cursor-pointer">{client.email || 'Não informado'}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="text-gray-400 mt-1" size={18} />
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold">Telefone</div>
                                    <div className="text-sm text-gray-800 dark:text-gray-200">{client.telefone || 'Não informado'}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="text-gray-400 mt-1" size={18} />
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold">Endereço</div>
                                    <div className="text-sm text-gray-800 dark:text-gray-200">
                                        {client.endereco}, {client.numero}<br/>
                                        {client.bairro}<br/>
                                        {client.cidade} - {client.uf}<br/>
                                        CEP: {client.cep}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Financial Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                         <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <DollarSign size={20} className="text-green-500"/> Financeiro
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-green-50 rounded-lg">
                                <div className="text-xs text-green-600 font-bold uppercase">Limite</div>
                                <div className="text-lg font-bold text-green-800">R$ {client.limite_credito || '0,00'}</div>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                                <div className="text-xs text-red-600 font-bold uppercase">Em Aberto</div>
                                <div className="text-lg font-bold text-red-800">R$ 0,00</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Related Lists */}
                <div className="col-span-8">
                    {/* Tabs */}
                    <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700 mb-4">
                        <button 
                            onClick={() => setActiveTab('pedidos')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pedidos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <ShoppingCart size={16} /> Pedidos ({orders.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('orcamentos')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'orcamentos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <FileText size={16} /> Orçamentos (0)
                        </button>
                    </div>

                    {/* Content */}
                    {activeTab === 'pedidos' ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {orders.length === 0 ? (
                                <div className="p-10 text-center text-gray-400">
                                    <ShoppingCart size={40} className="mx-auto mb-3 opacity-20"/>
                                    <p>Nenhum pedido encontrado.</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm item-center">
                                    <thead className="bg-gray-50 dark:bg-gray-800border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500">Número</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500">Data</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500">Valor Total</th>
                                            <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                                            <th className="px-6 py-3 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleOrderClick(order)}>
                                                <td className="px-6 py-4 font-bold text-blue-600">#{order.numero_pedido || order.id.substring(0,6)}</td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14}/> {new Date(order.created_at || Date.now()).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium">R$ {order.valor_total || '0,00'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold uppercase">
                                                        {order.status || 'Pendente'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-400">
                                                    <AlertCircle size={16} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ) : (
                        <div className="p-10 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
                            <p>Funcionalidade de Orçamentos em breve.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomClient360;
