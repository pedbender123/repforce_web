import React from 'react';
import { X, Package, Tag, Archive } from 'lucide-react';

const ProductFicha = ({ product, onClose }) => {
    if (!product) return null;

    return (
        <div className="absolute inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-700">
                <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-gray-50 dark:bg-gray-800">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-500" /> Detalhes do Produto
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                        <Package className="w-24 h-24 text-gray-300" />
                    </div>

                    <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2">{product.name}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{product.sku} • {product.unit}</p>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Preço Base</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">R$ {product.price}</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Estoque</p>
                                <p className={`text-lg font-bold ${product.stock_status === 'Crítico' ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {product.stock} <span className="text-xs text-gray-400 font-normal">{product.unit}</span>
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Tag className="w-4 h-4 text-gray-400" /> Detalhes Técnicos
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                {product.details || "Sem detalhes adicionais."}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Archive className="w-4 h-4 text-gray-400" /> Fornecedor
                            </h3>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs">
                                    {product.supplier_name?.charAt(0)}
                                </div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{product.supplier_name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductFicha;
