import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import {
    UserIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    MapPinIcon,
    PhoneIcon
} from '@heroicons/react/24/outline';

const fetchClients = async () => {
    const { data } = await apiClient.get('/crm/clients');
    return data;
};

const deleteClient = async (id) => {
    await apiClient.delete(`/crm/clients/${id}`);
};

export default function ClientList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: clients, isLoading, isError, error } = useQuery(['clients'], fetchClients);

    const deleteMutation = useMutation(deleteClient, {
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            alert('Cliente excluído com sucesso.');
        },
        onError: (err) => alert(`Erro ao excluir: ${err.message}`)
    });

    const handleEdit = (e, id) => {
        e.stopPropagation();
        navigate(`/app/clients/${id}`);
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            deleteMutation.mutate(id);
        }
    };

    const filteredClients = clients?.filter(client =>
        client.fantasy_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cnpj?.includes(searchTerm)
    );

    if (isLoading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    );

    if (isError) return (
        <div className="p-8 text-center text-red-600">
            Erro ao carregar clientes: {error?.message}
        </div>
    );

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white">Carteira de Clientes</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie seus clientes e visitas</p>
                </div>
                <button
                    onClick={() => navigate('/app/clients/new')}
                    className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Novo Cliente
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
                    placeholder="Buscar por nome, razão social ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredClients?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum cliente encontrado</h3>
                    <p className="mt-1 text-sm text-gray-500">Tente outra busca ou cadastre um novo cliente.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <div
                            key={client.id}
                            onClick={() => navigate(`/app/clients/${client.id}`)}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 cursor-pointer overflow-hidden group relative"
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors truncate pr-6">
                                        {client.fantasy_name || client.name}
                                    </h3>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${client.status === 'active'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                        {client.status === 'active' ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-mono">{client.cnpj}</p>

                                <div className="space-y-2">
                                    {client.address_data?.cidade && (
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            {client.address_data.cidade} - {client.address_data.uf}
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                            <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            {client.phone}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Ver detalhes →</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => handleEdit(e, client.id)}
                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, client.id)}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
