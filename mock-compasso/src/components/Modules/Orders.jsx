import React, { useEffect, useState } from 'react';
import api from '../../api';
import StandardModule from '../Shared/StandardModule';
import Badge from '../Shared/Badge';
import MasterDetailView from '../Shared/MasterDetailView';

const Orders = ({ tabState }) => {
    const [orders, setOrders] = useState([]);
    const [clients, setClients] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        api.get('/orders').then(res => setOrders(res.data));
        api.get('/clients').then(res => setClients(res.data));
    };

    const handleAdd = (data) => {
        api.post('/orders', data).then(() => loadData());
    };

    const renderForm = (close, submit) => {
        const [formData, setFormData] = useState({ client_id: '', total: 0 });
        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente</label>
                    <select className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                    >
                        <option value="">Selecione...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total (R$)</label>
                    <input type="number" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.total} onChange={e => setFormData({ ...formData, total: e.target.value })} />
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={() => submit(formData)} className="bg-blue-600 text-white px-4 py-2 rounded-sm">Salvar Pedido</button>
                </div>
            </div>
        );
    };

    const renderRow = (o) => (
        <>
            <td className="p-3 font-medium text-blue-700 dark:text-blue-400">{o.control_number}</td>
            <td className="p-3 text-gray-600 dark:text-gray-300">{o.client_name}</td>
            <td className="p-3 text-gray-600 dark:text-gray-300">R$ {o.total_final.toLocaleString('pt-BR')}</td>
            <td className="p-3"><Badge status={o.status} /></td>
        </>
    );

    const renderDetail = (o) => (
        <MasterDetailView
            item={o}
            summary={(i) => (
                <div className="p-6">
                    <h1 className="text-xl font-bold dark:text-white">{i.control_number}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{i.client_name}</p>
                    <Badge status={i.status} />
                </div>
            )}
            tabs={[{ label: 'Detalhes', content: (i) => <div className="dark:text-white">Detalhes do Pedido...</div> }]}
        />
    );

    return (
        <StandardModule
            title="Pedidos"
            data={orders}
            newItemLabel="Novo Pedido"
            columns={['Número', 'Cliente', 'Total', 'Status']}
            tabState={tabState}
            renderRow={renderRow}
            renderDetail={renderDetail}
            onAdd={handleAdd}
            renderForm={renderForm}
        />
    );
};

export default Orders;
