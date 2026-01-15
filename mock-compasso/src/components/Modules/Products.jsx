import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import api from '../../api';
import StandardModule from '../Shared/StandardModule';

const Products = ({ tabState }) => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        api.get('/products')
            .then(res => setProducts(res.data))
            .catch(err => console.error("Error loading products", err));
    }, []);

    const renderRow = (p) => (
        <>
            <td className="p-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{p.sku || p.code}</td>
            <td className="p-3 font-medium text-gray-800 dark:text-white">{p.name}</td>
            <td className="p-3 text-gray-600 dark:text-gray-300">{p.supplier_name || p.brand}</td>
            <td className={`p-3 font-bold ${p.stock <= (p.stock_min || 0) ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {p.stock} <span className="text-xs font-normal text-gray-400">{p.unit}</span>
            </td>
            <td className="p-3 text-right text-gray-900 dark:text-white">
                R$ {p.price ? p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </td>
        </>
    );

    const renderDetail = (p) => (
        <div className="flex h-full bg-gray-50 dark:bg-gray-800/50 p-8 justify-center animate-fade-in">
            <div className="bg-white dark:bg-gray-900 max-w-2xl w-full rounded-sm shadow-sm border border-gray-200 dark:border-gray-700 p-8 h-fit">
                {/* Header */}
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
                            <div className="flex gap-2 mt-3">
                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-sm text-xs font-bold uppercase">
                                    {p.group}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Preço Base</p>
                        <p className="text-3xl font-bold text-gray-800 dark:text-white">
                            R$ {p.price ? p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '--'}
                        </p>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Estoque</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Disponível</span>
                                <span className={`font-bold ${p.stock <= (p.stock_min || 0) ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                                    {p.stock} {p.unit}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Detalhes</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            {p.details || 'Sem descrição adicional.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <StandardModule
            title="Catálogo"
            data={products}
            newItemLabel="Adicionar"
            columns={['Código', 'Nome', 'Fornecedor', 'Estoque', 'Preço']}
            tabState={tabState}
            renderRow={renderRow}
            renderDetail={renderDetail}
        />
    );
};

export default Products;
