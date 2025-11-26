import React from 'react';
import { useQuery } from '@tanstack/react-query';
// CORREÇÃO: Usando apiClient padrão (o Admin não tem acesso ao sysAdminApiClient)
import apiClient from '../api/apiClient';

// Endpoint fictício para o admin ver sua própria empresa (ajustar backend se necessário)
const fetchMyTenant = async () => {
  // Como o admin já está logado no contexto de um tenant, podemos criar um endpoint
  // ou reutilizar a lógica de "meus dados". Por enquanto, vamos deixar um placeholder
  // ou buscar dados do usuário logado que contém info do tenant.
  const { data } = await apiClient.get('/auth/users/me');
  return data.tenant;
};

export default function TenantManagement() {
  const { data: tenant, isLoading } = useQuery(['myTenant'], fetchMyTenant);

  if (isLoading) return <div className="p-6 text-gray-600 dark:text-gray-300">Carregando dados da empresa...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow transition-colors duration-300">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Minha Empresa
      </h1>
      
      {tenant ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Nome</label>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">{tenant.name}</p>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">CNPJ</label>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">{tenant.cnpj || '-'}</p>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <span className={`mt-1 inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                  tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {tenant.status}
                </span>
             </div>
          </div>
        </div>
      ) : (
        <p className="text-red-500">Não foi possível carregar os dados da empresa.</p>
      )}
    </div>
  );
}
