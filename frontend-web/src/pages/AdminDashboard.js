import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { userProfile } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow transition-colors duration-300">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Painel do Administrador
      </h1>

      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md border border-blue-100 dark:border-blue-800 mb-6">
        <p className="text-lg text-gray-700 dark:text-gray-200">
          Bem-vindo. Seu perfil é: <span className="font-bold text-repforce-primary dark:text-blue-400 uppercase">{userProfile}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-750 dark:hover:bg-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Gestão de Equipe</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Use o menu à esquerda para cadastrar e gerenciar os Representantes da sua empresa.
          </p>
        </div>
        {/* Adicionei mais um card de exemplo para preencher */}
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-750 dark:hover:bg-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Relatórios</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Acompanhe o desempenho de vendas e clientes ativos.
          </p>
        </div>
      </div>
    </div>
  );
}