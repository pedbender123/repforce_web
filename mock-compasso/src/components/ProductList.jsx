import React, { useEffect, useState } from 'react';
import { Search, Plus, Package, MoreHorizontal, Tag, Folder } from 'lucide-react';
import api from '../api';

const ProductList = ({ onSelectProduct }) => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        api.get('/products').then(res => setProducts(res.data));
    }, []);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 animate-fade-in p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Produtos</h1>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all">
                    <Plus className="w-4 h-4" /> Novo Produto
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col flex-1">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-full md:w-80 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="Buscar por Sku, Nome ou Grupo..."
                        />
                    </div>
                </div>

                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider sticky top-0">
                            <tr>
                                <th className="p-4">Produto</th>
                                <th className="p-4">Grupo</th>
                                <th className="p-4">Preço Base</th>
                                <th className="p-4">Estoque</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {products.map((product) => (
                                <tr
                                    key={product.id}
                                    onClick={() => onSelectProduct(product)}
                                    className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{product.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <Folder className="w-4 h-4 text-gray-400" /> {product.group}
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono font-medium text-gray-900 dark:text-white">
                                        R$ {product.price.toFixed(2)}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${product.stock_status === 'Crítico'
                                                ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                                            }`}>
                                            {product.stock} {product.unit}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductList;
