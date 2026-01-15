import React, { useEffect, useState } from 'react';
import { Package, Save } from 'lucide-react';
import api from '../../api';
import StandardModule from '../Shared/StandardModule';

const ProductForm = ({ onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState(initialData || { name: '', sku: '', price: '', stock: 0 });
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descrição do Móvel</label>
                    <input type="text" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cód. Fábrica (SKU)</label>
                    <input type="text" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estoque Atual</label>
                    <input type="number" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Preço Unitário (R$)</label>
                <input type="number" className="w-full border p-2 rounded-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
            </div>
            <div className="flex justify-end pt-4 gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancelar</button>
                <button onClick={() => onSubmit(formData)} className="bg-blue-600 text-white px-8 py-2 rounded-sm text-sm font-bold uppercase">
                    <Save className="w-4 h-4 inline mr-1" /> Salvar Móvel
                </button>
            </div>
        </div>
    );
};

const Products = ({ tabState }) => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        api.get('/products')
            .then(res => setProducts(res.data))
            .catch(err => console.error("Error loading products", err));
    };

    const handleEdit = (id, data) => {
        api.put(`/products/${id}`, data).then(() => loadData());
    };

    const handleDelete = (id) => {
        api.delete(`/products/${id}`).then(() => loadData());
    };

    const renderRow = (p) => (
        <>
            <td className="p-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{p.sku || p.code}</td>
            <td className="p-3 font-medium text-gray-800 dark:text-white">{p.name}</td>
            <td className="p-3 text-gray-600 dark:text-gray-300">{p.supplier_name || p.brand}</td>
            <td className={`p-3 font-bold ${p.stock <= (p.stock_min || 0) ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {p.stock} <span className="text-xs font-normal text-gray-400">{p.unit}</span>
            </td>
            <td className="p-3 text-right text-gray-900 dark:text-white font-bold">
                R$ {p.price ? p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </td>
        </>
    );

    const renderDetail = (p) => (
        <div className="flex h-full bg-gray-50 dark:bg-gray-800/50 p-8 justify-center animate-fade-in">
            <div className="bg-white dark:bg-gray-900 max-w-2xl w-full rounded-sm shadow-sm border border-gray-200 dark:border-gray-700 p-8 h-fit">
                <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                    <div className="flex gap-6">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-sm flex items-center justify-center border border-gray-200 dark:border-gray-700">
                            <Package className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{p.name}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
                                {p.sku || p.code} • {p.supplier_name || p.brand}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <StandardModule
            title="Catálogo de Móveis"
            data={products}
            newItemLabel="Adicionar Móvel"
            columns={['Cód. Fábrica', 'Descrição do Móvel', 'Indústria (Fábrica)', 'Estoque', 'Preço Unitário']}
            tabState={tabState}
            renderRow={renderRow}
            renderDetail={renderDetail}
            onEdit={handleEdit}
            onDelete={handleDelete}
            renderForm={ProductForm}
            showAddButton={false}
        />
    );
};

export default Products;
