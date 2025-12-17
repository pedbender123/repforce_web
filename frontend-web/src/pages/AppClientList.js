import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const fetchClients = async () => {
    const { data } = await apiClient.get('/crm/clients');
    return data;
};

const deleteClient = async (id) => {
    await apiClient.delete(`/crm/clients/${id}`);
};

export default function AppClientList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Adicionei tratamento de erro na query
    const { data: clients, isLoading, isError, error } = useQuery(['clients'], fetchClients, {
        retry: 1, // Tenta apenas 1 vez se falhar
    });

    const deleteMutation = useMutation(deleteClient, {
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            alert('Cliente excluído!');
        },
        onError: () => alert('Erro ao excluir cliente')
    });

    if (isLoading) return <div className="p-8 text-center dark:text-white">Carregando lista de clientes...</div>;

    if (isError) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-600 font-bold mb-2">Erro ao carregar clientes ({error?.response?.status || 'Erro'})</div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Se você vê um erro 500, seu banco de dados precisa ser resetado (docker compose down -v).
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                <h2 className="text-xl font-bold dark:text-white text-gray-800">Carteira de Clientes</h2>
                {/* CORREÇÃO: O botão agora navega para a rota de criação */}
                <button
                    onClick={() => navigate('/app/clients/new')}
                    className="bg-repforce-primary text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <span>+</span> Novo Cliente
                </button>
            </div>

            <div className="overflow-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
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
                                        {client.cnpj || 'Sem CNPJ'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {client.address_data?.cidade ? (
                                        <span>{client.address_data.cidade} - {client.address_data.uf}</span>
                                    ) : (
                                        <span className="italic text-gray-400">Não informado</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${client.status === 'active' ? 'bg-green-100 text-green-800' :
                                        client.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {client.status === 'active' ? 'Ativo' : client.status === 'blocked' ? 'Bloqueado' : 'Inativo'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {clients?.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                    Nenhum cliente encontrado na sua carteira.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}