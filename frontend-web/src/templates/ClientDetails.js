// Baseado no seu src/pages/app/AppClientDetails.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: client, isLoading } = useQuery(['client', id], async () => {
    if(!id) return null;
    return (await apiClient.get(`/crm/clients/${id}`)).data;
  }, { enabled: !!id });

  if (isLoading) return <div className="p-8 text-center dark:text-white">Carregando...</div>;
  if (!client) return <div className="p-8 text-center dark:text-white">Cliente não encontrado.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button onClick={() => navigate('/app/clients')} className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-4">
        <ArrowLeftIcon className="w-4 h-4 mr-1"/> Voltar
      </button>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{client.trade_name || client.name}</h1>
        <p className="text-gray-500 font-mono">Documento: {client.document}</p>
        
        <div className="mt-6 border-t dark:border-gray-700 pt-4">
            <h3 className="font-bold dark:text-white mb-2">Endereço</h3>
            {client.address_json ? (
                <p className="dark:text-gray-300">
                    {client.address_json.rua}, {client.address_json.numero} - {client.address_json.bairro}<br/>
                    {client.address_json.cidade} / {client.address_json.uf} - {client.address_json.cep}
                </p>
            ) : <p className="italic text-gray-400">Sem endereço.</p>}
        </div>
      </div>
    </div>
  );
}