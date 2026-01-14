import React, { useState, useEffect } from 'react';
import { useTabs } from '../../context/TabContext';
import apiClient from '../../api/apiClient';
import { Search, Plus, Filter, MoreHorizontal, MapPin, Phone, Building2 } from 'lucide-react';

const CustomClientList = ({ pageId }) => {
    const { openSubPage, updateTab, activeTabId } = useTabs();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        updateTab(activeTabId, { title: 'Clientes' });
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/api/engine/object/clientes');
            setClients(data);
        } catch (error) {
            console.error("Erro ao carregar clientes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (client) => {
        openSubPage({
            id: `record_${client.id}`,
            title: client.nome_fantasia || client.razao_social || 'Cliente',
            path: `/app/compasso/comercial/clientes/ficha?id=${client.id}`,
            template: 'app_page', // Will be intercepted by Shadow Router
            data: { pageId: 'clientes', subPageId: 'ficha', recordId: client.id }
        });
    };

    const filtered = clients.filter(c => 
        String(c.nome_fantasia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(c.razao_social || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Clientes</h1>
                    <p className="text-sm text-gray-500">Gestão da carteira de clientes</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar cliente..." 
                            className="pl-10 pr-4 py-2 w-64 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                        <Plus size={18} /> Novo Cliente
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <div className="space-y-4">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filtered.map(client => (
                            <div 
                                key={client.id}
                                onClick={() => handleRowClick(client)}
                                className="group bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                        {(client.nome_fantasia || client.razao_social || '?')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg group-hover:text-blue-600 transition-colors">
                                            {client.nome_fantasia || 'Sem Nome'}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center gap-1"><Building2 size={14}/> {client.cnpj_cpf || 'N/A'}</span>
                                            <span className="flex items-center gap-1"><MapPin size={14}/> {client.cidade || 'N/A'} - {client.uf || 'UF'}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400 uppercase font-semibold">Status</div>
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                            client.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {client.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                    <div className="text-right w-32">
                                        <div className="text-xs text-gray-400 uppercase font-semibold">Tabela de Preço</div>
                                        <div className="font-medium text-gray-700 dark:text-gray-300">{client.tabela_preco || 'Padrão'}</div>
                                    </div>
                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomClientList;
