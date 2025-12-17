import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// API Functions
const fetchClients = async () => {
    // O backend Antigravity já filtra por escopo (GLOBAL ou OWN)
    const { data } = await apiClient.get('/crm/clients');
    return data;
};

const deleteClient = async (id) => {
    await apiClient.delete(`/crm/clients/${id}`);
};

export default function ClientList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Queries
    const { data: clients, isLoading, isError, error } = useQuery(['clients'], fetchClients, {
        retry: 1,
    });

    // Mutations
    const deleteMutation = useMutation(deleteClient, {
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            alert('Cliente excluído com sucesso.');
        },
        onError: (err) => alert(`Erro ao excluir: ${err.response?.data?.detail || err.message}`)
    });

    // Handlers
    const handleEdit = (e, id) => {
        e.stopPropagation();
        navigate(`/app/clients/${id}`); // Futuramente unificar rota de edição também
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) return <div className="p-8 text-center dark:text-white">Carregando lista de clientes...</div>;

    if (isError) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-600 font-bold mb-2">Erro ao carregar clientes</div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{error?.response?.status} - {error?.message}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden h-full flex flex-col transition-colors">
            {/* Header */}
            <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                <h2 className="text-xl font-bold dark:text-white text-gray-800">Carteira de Clientes</h2>
                <button
                    onClick={() => navigate('/app/clients/new')}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" /> <span>Novo Cliente</span>
                </button>
            </div>

            {/* Content */}
            <div className="overflow-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Localização</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
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
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                    <button
                                        onClick={(e) => handleEdit(e, client.id)}
                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                                        title="Editar"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, client.id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                                        title="Excluir"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {clients?.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
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
