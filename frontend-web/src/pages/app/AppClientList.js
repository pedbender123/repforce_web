import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';

const fetchClients = async () => {
  const { data } = await apiClient.get('/crm/clients');
  return data;
};

export default function AppClientList() {
  const { data: clients, error, isLoading, isError } = useQuery(
    ['clients'], 
    fetchClients
  );

  if (isLoading) {
    return <div className="text-center p-10 dark:text-white">Carregando clientes...</div>;
  }

  if (isError) {
    return <div className="text-center p-10 text-red-600">Erro ao buscar clientes: {error.message}</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden transition-colors duration-300">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Meus Clientes</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Nome
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                CNPJ
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                ID do Representante
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {clients && clients.length > 0 ? (
              clients.map((client) => (
                <tr key={client.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {client.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {client.cnpj || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {client.representative_id}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}