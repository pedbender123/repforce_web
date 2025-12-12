import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { useNavigate } from 'react-router-dom';

export default function ClientList() {
  const navigate = useNavigate();
  const { data: clients, isLoading, isError } = useQuery(['clients'], async () => {
    const res = await apiClient.get('/crm/clients');
    return res.data;
  });

  if (isLoading) return <div className="p-8 text-center dark:text-white">Carregando lista de clientes...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Erro ao carregar clientes.</div>;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden h-full flex flex-col m-6">
      <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
        <h2 className="text-xl font-bold dark:text-white text-gray-800">Carteira de Clientes</h2>
        <button 
            onClick={() => navigate('/app/clients/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
            <span>+</span> Novo Cliente
        </button>
      </div>
      
      <div className="overflow-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localização</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {clients?.map((client) => (
                    <tr 
                        key={client.id} 
                        onClick={() => navigate(`/app/clients/${client.id}`)}
                        className="cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <td className="px-6 py-4">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {client.trade_name || client.name}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                                {client.document || 'Sem Documento'}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {client.address_json?.cidade ? (
                                <span>{client.address_json.cidade} - {client.address_json.uf}</span>
                            ) : <span className="italic text-gray-400">Não informado</span>}
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                                {client.status || 'Ativo'}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}