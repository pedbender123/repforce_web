import React, { useEffect, useState } from 'react';
import api from '../../api';
import StandardModule from '../Shared/StandardModule';
import Badge from '../Shared/Badge';
import MasterDetailView from '../Shared/MasterDetailView';

const CampaignForm = ({ onClose, onSubmit, products = [] }) => {
    const [formData, setFormData] = useState({ name: '', discount: 0, products: [] });

    const toggleProduct = (id) => {
        const current = formData.products;
        if (current.includes(id)) {
            setFormData({ ...formData, products: current.filter(x => x !== id) });
        } else {
            setFormData({ ...formData, products: [...current, id] });
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome da Campanha</label>
                <input type="text" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desconto (%)</label>
                <input type="number" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Produtos ({formData.products.length})</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-sm p-2">
                    {products.map(p => (
                        <div key={p.id} onClick={() => toggleProduct(p.id)} className={`cursor-pointer p-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 ${formData.products.includes(p.id) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                            <span>{p.name}</span>
                            {formData.products.includes(p.id) && <span>✔</span>}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-end pt-4 gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
                <button onClick={() => onSubmit(formData)} className="bg-purple-600 text-white px-4 py-2 rounded-sm text-sm font-bold">Criar Campanha</button>
            </div>
        </div>
    );
};

const Campaigns = ({ tabState }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        api.get('/campaigns').then(res => setCampaigns(Array.isArray(res.data) ? res.data : []));
        api.get('/products').then(res => setProducts(Array.isArray(res.data) ? res.data : []));
    };

    const handleAdd = (data) => {
        api.post('/campaigns', data).then(() => loadData());
    };

    const handleDelete = (id) => {
        api.delete(`/campaigns/${id}`).then(() => loadData());
    };

    const renderRow = (c) => (
        <>
            <td className="p-3 font-medium text-purple-700 dark:text-purple-400">{c.name}</td>
            <td className="p-3 text-gray-600 dark:text-gray-300">{c.discount}% Desc.</td>
            <td className="p-3 text-gray-600 dark:text-gray-300">Ativa</td>
            <td className="p-3"><Badge status="Ativa" /></td>
        </>
    );

    const renderDetail = (c) => (
        <MasterDetailView
            item={c}
            summary={(i) => (
                <div className="p-6">
                    <h1 className="text-xl font-bold dark:text-white">{i.name}</h1>
                    <p className="text-lg text-purple-600 font-bold mt-2">{i.discount}% OFF</p>
                </div>
            )}
            tabs={[{ label: 'Geral', content: (i) => <div className="p-4 dark:text-white">Produtos Impactados (IDs): {i.products}</div> }]}
        />
    );

    return (
        <StandardModule
            title="Campanhas"
            data={campaigns}
            newItemLabel="Nova Campanha"
            columns={['Nome', 'Regra', 'Status', 'Situação']}
            tabState={tabState}
            renderRow={renderRow}
            renderDetail={renderDetail}
            onAdd={handleAdd}
            onDelete={handleDelete}
            renderForm={(props) => <CampaignForm {...props} products={products} />}
        />
    );
};

export default Campaigns;
