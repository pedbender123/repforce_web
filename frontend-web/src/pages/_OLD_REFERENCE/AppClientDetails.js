import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import EditableField from '../../components/EditableField';
import ContactCard from '../../components/ContactCard';
import { Tab } from '@headlessui/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function AppClientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isAddingContact, setIsAddingContact] = useState(false);

    const { data: client, isLoading } = useQuery(['client', id], async () => {
        const res = await apiClient.get(`/crm/clients/${id}`);
        return res.data;
    });

    const updateClientMutation = useMutation((data) => apiClient.put(`/crm/clients/${id}`, data), {
        onSuccess: () => queryClient.invalidateQueries(['client', id])
    });

    const createContactMutation = useMutation((data) => apiClient.post(`/crm/clients/${id}/contacts`, data), {
        onSuccess: () => {
            queryClient.invalidateQueries(['client', id]);
            setIsAddingContact(false);
        }
    });

    const deleteContactMutation = useMutation((contactId) => apiClient.delete(`/crm/contacts/${contactId}`), {
        onSuccess: () => queryClient.invalidateQueries(['client', id])
    });

    const handleUpdate = (field, value) => updateClientMutation.mutate({ [field]: value });

    const handleAddContact = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        createContactMutation.mutate({
            name: formData.get('name'),
            role: formData.get('role'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            is_primary: false
        });
    };

    if (isLoading) return <div className="p-8 text-center dark:text-white">Carregando...</div>;

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-4">
                <ArrowLeftIcon className="w-4 h-4 mr-1" /> Voltar
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Coluna Perfil */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            <EditableField value={client.trade_name || client.name} onSave={(v) => handleUpdate(client.trade_name ? 'trade_name' : 'name', v)} />
                        </h1>
                        <div className="text-sm text-gray-500 mb-6 font-mono flex items-center gap-2">
                            CNPJ: <EditableField value={client.cnpj} onSave={(v) => handleUpdate('cnpj', v)} />
                        </div>
                        <div className="space-y-1">
                            <EditableField label="Razão Social" value={client.name} onSave={(v) => handleUpdate('name', v)} />
                            <EditableField label="Nome Fantasia" value={client.fantasy_name} onSave={(v) => handleUpdate('fantasy_name', v)} />
                            <EditableField label="Email" value={client.email} onSave={(v) => handleUpdate('email', v)} />
                            <EditableField label="Telefone" value={client.phone} onSave={(v) => handleUpdate('phone', v)} />
                            <EditableField label="Status" value={client.status} onSave={(v) => handleUpdate('status', v)} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">Endereço</h3>
                        <div className="space-y-2">
                            <EditableField label="Endereço Completo" value={client.address} onSave={(v) => handleUpdate('address', v)} />
                            <div className="grid grid-cols-2 gap-2">
                                <EditableField label="Cidade" value={client.city} onSave={(v) => handleUpdate('city', v)} />
                                <EditableField label="Estado" value={client.state} onSave={(v) => handleUpdate('state', v)} />
                            </div>
                            <EditableField label="CEP" value={client.zip_code} onSave={(v) => handleUpdate('zip_code', v)} />
                        </div>
                    </div>
                </div>

                {/* Coluna Abas */}
                <div className="lg:col-span-8 bg-white dark:bg-gray-800 shadow rounded-lg flex flex-col min-h-[500px]">
                    <Tab.Group>
                        <Tab.List className="flex space-x-1 rounded-t-lg bg-gray-50 dark:bg-gray-900/50 p-1 border-b border-gray-200 dark:border-gray-700">
                            {['Visão Geral', 'Contatos', 'Pedidos'].map((tab) => (
                                <Tab key={tab} className={({ selected }) =>
                                    classNames('w-full rounded-md py-2.5 text-sm font-medium leading-5 focus:outline-none',
                                        selected ? 'bg-white dark:bg-gray-700 text-repforce-primary shadow' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-white/[0.12]')
                                }>{tab}</Tab>
                            ))}
                        </Tab.List>
                        <Tab.Panels className="p-6 flex-1">
                            <Tab.Panel>
                                <div className="text-center text-gray-500 py-10">Resumo de vendas e atividades aparecerá aqui.</div>
                            </Tab.Panel>
                            <Tab.Panel>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-medium dark:text-white">Contatos Vinculados</h3>
                                    <button onClick={() => setIsAddingContact(!isAddingContact)} className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-100 font-medium">
                                        {isAddingContact ? 'Cancelar' : '+ Adicionar Contato'}
                                    </button>
                                </div>

                                {isAddingContact && (
                                    <form onSubmit={handleAddContact} className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input name="name" placeholder="Nome" required className="rounded border-gray-300 text-sm p-2" />
                                            <input name="role" placeholder="Cargo" className="rounded border-gray-300 text-sm p-2" />
                                            <input name="email" placeholder="Email" className="rounded border-gray-300 text-sm p-2" />
                                            <input name="phone" placeholder="Telefone" className="rounded border-gray-300 text-sm p-2" />
                                        </div>
                                        <button type="submit" className="mt-4 w-full bg-repforce-primary text-white py-2 rounded text-sm hover:bg-blue-700">Salvar Contato</button>
                                    </form>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {client.contacts?.map(contact => (
                                        <ContactCard key={contact.id} contact={contact} onDelete={(id) => deleteContactMutation.mutate(id)} />
                                    ))}
                                </div>
                                {client.contacts?.length === 0 && !isAddingContact &&
                                    <p className="text-gray-400 text-center py-8 italic">Nenhum contato cadastrado.</p>
                                }
                            </Tab.Panel>
                            <Tab.Panel>
                                <div className="text-center text-gray-500 py-10">Histórico de pedidos em breve.</div>
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>
            </div>
        </div>
    );
}