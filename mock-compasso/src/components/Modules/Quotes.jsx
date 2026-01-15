import React, { useEffect, useState } from 'react';
import api from '../../api';
import StandardModule from '../Shared/StandardModule';
import Badge from '../Shared/Badge';
import MasterDetailView from '../Shared/MasterDetailView';
import { Plus, Trash2, FileText, Send, CheckCircle } from 'lucide-react';

const QuoteForm = ({ onClose, onSubmit, clients = [], products = [] }) => {
    const [clientId, setClientId] = useState('');
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

    const totalQuote = items.reduce((sum, it) => sum + calculateItemTotal(it), 0);

    const handleSave = () => {
        if (!clientId) return alert("Selecione um cliente");
        onSubmit({ client_id: clientId, total: totalQuote, items, status: 'Rascunho' });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prospect / Lojista</label>
                <select className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={clientId} onChange={e => setClientId(e.target.value)}
                >
                    <option value="">Selecione o Lojista...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                </select>
            </div>

            <div className="border border-dashed border-gray-300 dark:border-gray-700 p-4 rounded-lg bg-gray-50/50 dark:bg-gray-900/20">
                <div className="flex justify-between items-center mb-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase italic">Pré-Mapeamento de Carga</label>
                    <button onClick={addItem} className="text-blue-600 flex items-center gap-1 text-[10px] font-black uppercase hover:underline">
                        <Plus className="w-3 h-3" /> Unitizar Itens
                    </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {items.map((it, idx) => {
                        const productTotal = calculateItemTotal(it);
                        return (
                            <div key={idx} className="flex gap-2 items-center bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                                <select
                                    className="flex-1 border-none bg-transparent text-xs rounded-sm dark:text-white focus:ring-0"
                                    value={it.product_id}
                                    onChange={e => updateItem(idx, 'product_id', e.target.value)}
                                >
                                    <option value="">Produto...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <input
                                    type="number"
                                    className="w-14 border-none bg-gray-100 dark:bg-gray-700 text-xs rounded-sm dark:text-white text-center focus:ring-1 focus:ring-blue-500"
                                    value={it.qty}
                                    onChange={e => updateItem(idx, 'qty', e.target.value)}
                                />
                                <span className="text-[10px] font-bold dark:text-white w-20 text-right">R$ {productTotal.toLocaleString()}</span>
                                <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 uppercase font-black">Subtotal Estimado:</span>
                    <span className="text-lg font-black text-gray-700 dark:text-gray-200">R$ {totalQuote.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>

            <div className="flex justify-end pt-4 gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Mudar Depois</button>
                <button onClick={handleSave} className="bg-gray-800 dark:bg-gray-700 hover:bg-black text-white px-6 py-2 rounded-sm text-sm font-bold shadow transition-all flex items-center gap-2">
                    <Send className="w-4 h-4" /> Salvar Proposta
                </button>
            </div>
        </div>
    );
};

const Quotes = ({ tabState }) => {
    const [quotes, setQuotes] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        api.get('/orders').then(res => {
            // FILTER ONLY RASCUNHOS
            const list = Array.isArray(res.data) ? res.data.filter(o => o.status === 'Rascunho') : [];
            setQuotes(list);
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

    const handleConvertToOrder = (id) => {
        if (!window.confirm("Deseja faturar este orçamento agora? Isso dará baixa no estoque real.")) return;
        api.put(`/orders/${id}`, { status: 'Faturado' }).then(() => {
            alert("Orçamento faturado com sucesso! Agora ele é um pedido real.");
            loadData();
        });
    };

    const renderRow = (o) => (
        <>
            <td className="p-3 font-medium text-gray-800 dark:text-white flex items-center gap-2">
                <FileText className="w-3 h-3 text-gray-400" /> {o.control_number}
            </td>
            <td className="p-3 text-gray-600 dark:text-gray-300">{o.client_name}</td>
            <td className="p-3 text-gray-600 dark:text-gray-300 font-black">R$ {o.total_final.toLocaleString('pt-BR')}</td>
            <td className="p-3"><Badge status={o.status} /></td>
        </>
    );

    const renderDetail = (q) => (
        <MasterDetailView
            item={q}
            summary={(i) => (
                <div className="p-6 bg-gray-50 dark:bg-gray-800/20 border-b dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold dark:text-white">{i.control_number}</h2>
                        <p className="text-sm text-gray-500">{i.client_name}</p>
                    </div>
                    <button
                        onClick={() => handleConvertToOrder(i.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-sm text-sm font-black uppercase shadow-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                        <CheckCircle className="w-4 h-4" /> Confirmar e Gerar Pedido
                    </button>
                </div>
            )}
            tabs={[{
                label: 'Resumo de Proposta', content: (i) => (
                    <div className="p-6">
                        <div className="p-4 border dark:border-gray-700 rounded bg-white dark:bg-gray-900">
                            <span className="text-[10px] font-black uppercase text-gray-400">Total Estimado</span>
                            <p className="text-2xl font-black text-gray-800 dark:text-white">R$ {i.total_final.toLocaleString()}</p>
                            <p className="text-[10px] italic text-gray-500 mt-2">* Este orçamento não reserva estoque até que seja faturado.</p>
                        </div>
                    </div>
                )
            }]}
        />
    );

    return (
        <StandardModule
            title="Orçamentos"
            data={quotes}
            newItemLabel="Nova Cotação"
            columns={['Proposta/Rascunho', 'Solicitante', 'Total Estimado', 'Status']}
            tabState={tabState}
            renderRow={renderRow}
            renderDetail={renderDetail}
            onAdd={handleAdd}
            onDelete={handleDelete}
            renderForm={(props) => <QuoteForm {...props} clients={clients} products={products} />}
        />
    );
};

export default Quotes;
