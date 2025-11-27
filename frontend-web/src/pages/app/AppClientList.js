import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';

const fetchClients = async () => {
  const { data } = await apiClient.get('/crm/clients');
  return data;
};

export default function AppClientList() {
  const navigate = useNavigate();
  const { data: clients, isLoading } = useQuery(['clients'], fetchClients);

  if (isLoading) return <div className="p-8 text-center dark:text-white">Carregando...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold dark:text-white">Meus Clientes</h2>
        <button className="bg-repforce-primary text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
            + Novo Cliente
        </button>
      </div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {clients?.map((client) => (
                <tr 
                    key={client.id} 
                    onClick={() => navigate(`/app/clients/${client.id}`)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{client.trade_name || client.name}</div>
                        <div className="text-xs text-gray-500">{client.cnpj}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {client.address_data?.cidade || '-'}
                    </td>
                    <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            {client.status}
                        </span>
                    </td>
                </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}