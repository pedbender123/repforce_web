import React, { useState } from 'react';
import { X, User, FileText, ShoppingCart, Truck, CreditCard, Printer } from 'lucide-react';

const ClientFicha = ({ client, onClose }) => {
    const [activeTab, setActiveTab] = useState('resumo');

    if (!client) return null;

    const tabs = [
        { id: 'resumo', label: 'Resumo 360º', icon: User },
        { id: 'pedidos', label: 'Histórico Pedidos', icon: ShoppingCart },
        { id: 'financeiro', label: 'Financeiro', icon: CreditCard },
        { id: 'frete', label: 'Regras de Frete', icon: Truck },
    ];

    return (
        <div className="absolute inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col">
                {/* Header */}
                <div className="h-20 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {client.razao_social.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{client.razao_social}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                {client.cnpj} <span className="w-1 h-1 bg-gray-400 rounded-full"></span> {client.segment}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => window.print()} className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Gerar Ficha PDF">
                            <Printer className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 px-8 gap-6 bg-white dark:bg-gray-900">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900">
                    {activeTab === 'resumo' && (
                        <div className="grid grid-cols-2 gap-6 animate-fade-in">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Limite de Crédito</h3>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    R$ {(client.credit_limit - client.credit_used).toLocaleString()}
                                    <span className="text-sm text-gray-400 font-normal ml-2">disponível</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600" style={{ width: `${(client.credit_used / client.credit_limit) * 100}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Total: R$ {client.credit_limit.toLocaleString()}</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Truck className="w-4 h-4" /> Logística
                                </h3>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{client.freight_desc}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Este cliente possui regra negociada de frete. O cálculo será aplicado automaticamente no checkout.
                                </p>
                            </div>

                            <button className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-lg font-bold shadow-lg shadow-blue-900/20 transform hover:-translate-y-1 transition-all">
                                + Iniciar Novo Pedido
                            </button>
                        </div>
                    )}
                    {activeTab !== 'resumo' && (
                        <div className="flex items-center justify-center h-full text-gray-400 font-medium">
                            Conteúdo da aba {activeTab} em desenvolvimento...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientFicha;
