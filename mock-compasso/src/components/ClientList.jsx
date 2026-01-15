import React, { useEffect, useState } from 'react';
import { Search, Plus, MapPin, Phone, MoreHorizontal } from 'lucide-react';
import api from '../api';

const ClientList = ({ onSelectClient }) => {
    const [clients, setClients] = useState([]);

    useEffect(() => {
        api.get('/clients').then(res => setClients(res.data));
    }, []);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 animate-fade-in p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Clientes</h1>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all">
                    <Plus className="w-4 h-4" /> Novo Cliente
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col flex-1">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-full md:w-80 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="Buscar por nome, CNPJ ou cidade..."
                        />
                    </div>
                </div>

                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider sticky top-0">
                            <tr>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Segmento</th>
                                <th className="p-4">Regra Frete</th>
                                <th className="p-4">Limite Crédito</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {clients.map((client) => (
                                <tr
                                    key={client.id}
                                    onClick={() => onSelectClient(client)}
                                    className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                                                {client.razao_social.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{client.razao_social}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{client.cnpj}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                            {client.segment}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                        {client.freight_desc}
                                    </td>
                                    <td className="p-4">
                                        <div className="w-32">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-500">{(client.credit_used / client.credit_limit * 100).toFixed(0)}% uso</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${(client.credit_used / client.credit_limit) * 100}%` }}></div>
                                            </div>
                                        </div>
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

export default ClientList;
