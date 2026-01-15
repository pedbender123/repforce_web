import React, { useEffect, useState } from 'react';
import api from '../../api';
import StandardModule from '../Shared/StandardModule';
import Badge from '../Shared/Badge';
import MasterDetailView from '../Shared/MasterDetailView';
import { Plus, Trash2, Calculator, Wallet } from 'lucide-react';

const OrderForm = ({ onClose, onSubmit, clients = [], products = [], initialData }) => {
    const [clientId, setClientId] = useState(initialData?.client_id || '');
    const [items, setItems] = useState([]);

    const addItem = () => setItems([...items, { product_id: '', qty: 1 }]);
    const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
    const updateItem = (idx, field, val) => {
        const newItems = [...items];
        newItems[idx][field] = val;
        setItems(newItems);
    };

    const calculateItemTotal = (it) => {
        const p = products.find(prod => String(prod.id) === String(it.product_id));
        return p ? (p.price * (it.qty || 0)) : 0;
    };

    const totalOrder = items.reduce((sum, it) => sum + calculateItemTotal(it), 0);

    const handleSave = () => {
        if (!clientId) return alert("Selecione um cliente");
        if (items.length === 0) return alert("Adicione pelo menos um item");
        onSubmit({ client_id: clientId, total: totalOrder, items, status: 'Faturado' });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente / Lojista</label>
                <select className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={clientId} onChange={e => setClientId(e.target.value)}
                >
                    <option value="">Selecione o Lojista...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                </select>
            </div>

            <div className="border border-gray-100 dark:border-gray-800 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                <div className="flex justify-between items-center mb-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest text-blue-600">Confirmação de Carga</label>
                    <button onClick={addItem} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 hover:bg-blue-100 transition-colors">
                        <Plus className="w-3 h-3" /> Adicionar Móvel
                    </button>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((it, idx) => {
                        const productTotal = calculateItemTotal(it);
                        return (
                            <div key={idx} className="flex gap-2 items-start bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex-1">
                                    <select
                                        className="w-full border p-1.5 text-xs rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mb-1"
                                        value={it.product_id}
                                        onChange={e => updateItem(idx, 'product_id', e.target.value)}
                                    >
                                        <option value="">Produto...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (R$ {p.price.toLocaleString()})</option>)}
                                    </select>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-400 uppercase font-bold">Qtd:</span>
                                        <input
                                            type="number"
                                            className="w-12 border-b border-gray-200 dark:border-gray-700 bg-transparent text-center focus:outline-none dark:text-white"
                                            value={it.qty}
                                            onChange={e => updateItem(idx, 'qty', e.target.value)}
                                        />
                                        <span className="text-blue-600 font-black">R$ {productTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                                <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase">Total do Romaneio:</span>
                    <span className="text-lg font-black text-blue-700 dark:text-blue-400 flex items-center gap-1">
                        <Calculator className="w-4 h-4" /> R$ {totalOrder.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            <div className="flex justify-end pt-2 gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Manter Rascunho</button>
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-sm text-sm font-black shadow-lg transition-all active:scale-95 uppercase tracking-tighter flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Finalizar e Faturar
                </button>
            </div>
        </div>
    );
};

const Orders = ({ tabState }) => {
    const [orders, setOrders] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        api.get('/orders').then(res => {
            // FILTER ONLY BILLED (NOT RASCUNHO)
            const list = Array.isArray(res.data) ? res.data.filter(o => o.status === 'Faturado') : [];
            setOrders(list);
        });
        api.get('/clients').then(res => setClients(Array.isArray(res.data) ? res.data : []));
        api.get('/products').then(res => setProducts(Array.isArray(res.data) ? res.data : []));
    };

    const handleAdd = (data) => {
        api.post('/orders', data).then(() => loadData());
    };

    const handleDelete = (id) => {
        api.delete(`/orders/${id}`).then(() => loadData());
    };

    const renderRow = (o) => (
        <>
            <td className="p-3 font-medium text-blue-700 dark:text-blue-400 font-mono text-xs">{o.control_number}</td>
            <td className="p-3 text-gray-700 dark:text-gray-300 font-medium">{o.client_name}</td>
            <td className="p-3 text-gray-900 dark:text-white font-bold">R$ {o.total_final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td className="p-3"><Badge status={o.status} /></td>
        </>
    );

    const renderDetail = (o) => (
        <MasterDetailView
            item={o}
            summary={(i) => (
                <div className="p-6 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/10">
                    <h1 className="text-2xl font-black dark:text-white uppercase tracking-tighter">{i.control_number}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{i.client_name}</p>
                    <div className="mt-4 flex gap-4">
                        <Badge status={i.status} />
                        <span className="text-[10px] font-black uppercase text-gray-400 self-center">Faturado em {new Date(i.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            )}
            tabs={[{
                label: 'Dados de Romaneio', content: (i) => (
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                            <span className="text-xs font-bold text-gray-400 uppercase">Valor de Carga</span>
                            <span className="font-black text-xl text-blue-600">R$ {i.total_final.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2">Histórico Logístico</h4>
                            <div className="text-[10px] space-y-2">
                                <p className="flex justify-between border-b pb-1 dark:border-gray-800"><span>Criação do Pedido</span> <span className="text-gray-600">Sucesso</span></p>
                                <p className="flex justify-between border-b pb-1 dark:border-gray-800"><span>Baixa de Estoque</span> <span className="text-gray-600">Processado</span></p>
                                <p className="flex justify-between pb-1"><span>Aguardando Expedição</span> <span className="text-blue-600 font-bold">Pendente</span></p>
                            </div>
                        </div>
                    </div>
                )
            }]}
        />
    );

    return (
        <StandardModule
            title="Pedidos Faturados"
            data={orders}
            newItemLabel="Novo Pedido"
            columns={['Romaneio', 'Lojista', 'Total Faturado', 'Status']}
            tabState={tabState}
            renderRow={renderRow}
            renderDetail={renderDetail}
            onAdd={handleAdd}
            onDelete={handleDelete}
            renderForm={(props) => <OrderForm {...props} clients={clients} products={products} />}
        />
    );
};

export default Orders;
