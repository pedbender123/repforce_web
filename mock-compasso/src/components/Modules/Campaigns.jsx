import React, { useEffect, useState } from 'react';
import api from '../../api';
import StandardModule from '../Shared/StandardModule';
import Badge from '../Shared/Badge';
import MasterDetailView from '../Shared/MasterDetailView';

const Campaigns = ({ tabState }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        api.get('/campaigns').then(res => setCampaigns(res.data));
        api.get('/products').then(res => setProducts(res.data));
    };

    const handleAdd = (data) => {
        api.post('/campaigns', data).then(() => loadData());
    };

    const renderForm = (close, submit) => {
        // Multi-select for products
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
                    <p className="text-xs text-gray-400 mb-2">Será aplicado imediatamente aos produtos selecionados.</p>
                    <input type="number" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Selecionar Produtos ({formData.products.length})</label>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-sm p-2 bg-gray-50 dark:bg-gray-800/50">
                        {products.map(p => (
                            <div key={p.id} onClick={() => toggleProduct(p.id)} className={`cursor-pointer p-2 flex items-center justify-between hover:bg-white dark:hover:bg-gray-700 ${formData.products.includes(p.id) ? 'text-blue-600 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                                <span>{p.name} - {p.sku}</span>
                                {formData.products.includes(p.id) && <span className="text-xs">✔</span>}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={() => submit(formData)} className="bg-purple-600 text-white px-4 py-2 rounded-sm">Criar e Aplicar</button>
                </div>
            </div>
        );
    };

    const renderRow = (c) => (
        <>
            <td className="p-3 font-medium text-purple-700 dark:text-purple-400">{c.name}</td>
            <td className="p-3 text-gray-600 dark:text-gray-300">{c.discount}% Desc.</td>
            <td className="p-3 text-gray-600 dark:text-gray-300">Aplicado</td>
            <td className="p-3"><Badge status="Ativa" /></td>
        </>
    );

    const renderDetail = (c) => (
        <MasterDetailView
            item={c}
            summary={(i) => (
                <div className="p-6">
                    <h1 className="text-xl font-bold dark:text-white">{i.name}</h1>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-2">{i.discount}% OFF</p>
                </div>
            )}
            tabs={[{ label: 'Produtos', content: (i) => <div className="dark:text-white p-4">IDs dos produtos afetados: {i.target}</div> }]}
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
            renderForm={renderForm}
        />
    );
};

export default Campaigns;
