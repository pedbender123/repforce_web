import React, { useEffect, useState } from 'react';
import { Truck, CreditCard } from 'lucide-react';
import api from '../../api';
import StandardModule from '../Shared/StandardModule';
import MasterDetailView from '../Shared/MasterDetailView';
import Badge from '../Shared/Badge';

const Clients = ({ tabState }) => {
    const [clients, setClients] = useState([]);

    useEffect(() => {
        api.get('/clients')
            .then(res => setClients(res.data))
            .catch(err => console.error("Error loading clients", err));
    }, []);

    // Helper to render row
    const renderRow = (c) => (
        <>
            <td className="p-3 font-medium text-blue-700 dark:text-blue-400">{c.razao_social || c.name}</td>
            <td className="p-3 text-gray-600 dark:text-gray-300">{c.cnpj}</td>
            <td className="p-3 text-gray-600 dark:text-gray-300">{c.segment || c.activity_branch}</td>
            <td className="p-3"><Badge status={c.status} /></td>
        </>
    );

    // Helper to render detail
    const renderDetail = (c) => (
        <MasterDetailView
            item={c}
            summary={(i) => (
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-blue-700 rounded-sm flex items-center justify-center text-white text-xl font-bold shadow-sm">
                            {(i.razao_social || i.name || '?').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">{i.razao_social || i.name}</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase">Cliente</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-4 rounded-sm border border-gray-200 dark:border-gray-700 shadow-sm space-y-2 text-sm">
                        <div><span className="text-xs text-gray-500 dark:text-gray-400 block">CNPJ</span><span className="dark:text-gray-300">{i.cnpj}</span></div>
                        <div><span className="text-xs text-gray-500 dark:text-gray-400 block">Email</span><span className="text-blue-600 dark:text-blue-400">{i.email || 'Não informado'}</span></div>
                        <div><span className="text-xs text-gray-500 dark:text-gray-400 block">Endereço</span><span className="dark:text-gray-300">{i.address}</span></div>
                        <div className="pt-2"><Badge status={i.status} /></div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-4 rounded-sm border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="dark:text-gray-400">Crédito</span>
                            <span className="font-bold dark:text-gray-200">{(i.credit_used && i.credit_limit) ? Math.round((i.credit_used / i.credit_limit) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-blue-600" style={{ width: `${(i.credit_used && i.credit_limit) ? (i.credit_used / i.credit_limit) * 100 : 0}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Disp: R$ {i.credit_limit ? (i.credit_limit - (i.credit_used || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                        </p>
                    </div>
                </div>
            )}
            tabs={[
                {
                    label: 'Visão 360',
                    content: () => (
                        <div className="grid grid-cols-2 gap-6">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-sm p-4">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                                    <Truck className="w-4 h-4" /> Logística
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Frete CIF padrão. Horário comercial.</p>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-sm p-4">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" /> Pagamento
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Boleto 28 DDL. Tabela Ouro.</p>
                            </div>
                        </div>
                    )
                },
                {
                    label: 'Histórico',
                    content: (i) => (
                        <div className="space-y-4">
                            {(i.history || ['Sem histórico recente']).map((h, k) => (
                                <div key={k} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mt-1.5" />
                                    {h}
                                </div>
                            ))}
                        </div>
                    )
                }
            ]}
        />
    );

    return (
        <StandardModule
            title="Contas"
            data={clients}
            newItemLabel="Nova Conta"
            columns={['Razão Social', 'CNPJ', 'Segmento', 'Status']}
            tabState={tabState}
            renderRow={renderRow}
            renderDetail={renderDetail}
        />
    );
};

export default Clients;
