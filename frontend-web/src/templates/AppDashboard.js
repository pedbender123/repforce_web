import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AppDashboard() {
  const { userProfile } = useAuth();
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow m-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Bem-vindo!</h1>
      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md border border-blue-100 dark:border-blue-800 mb-6">
        <p className="text-lg text-gray-700 dark:text-gray-200">
          Perfil ativo: <span className="font-bold text-blue-600 uppercase">{userProfile}</span>.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-750">
            <h3 className="text-xl font-bold dark:text-white">Resumo de Vendas</h3>
            <p className="dark:text-gray-400">Seus indicadores de performance aparecerão aqui.</p>
        </div>
      </div>
    </div>
  );
}