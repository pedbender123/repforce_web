import React from 'react';
import { useSysAdminAuth } from '../../context/SysAdminAuthContext';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import { Users, Building, ShieldAlert, Activity } from 'lucide-react';

export default function SysAdminDashboard() {
  const { userProfile } = useSysAdminAuth();

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow transition-colors duration-300">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Painel do Sistema (SysAdmin)
      </h1>

      <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md border border-red-100 dark:border-red-800 mb-6">
        <p className="text-lg text-gray-700 dark:text-gray-200">
          Você está logado como <span className="font-bold text-red-600 dark:text-red-400 uppercase">{userProfile}</span>.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Esta é a área de superusuário para gestão de Tenants e configurações globais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-750">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Tenants</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie as empresas cadastradas no sistema.
          </p>
        </div>
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-750">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Usuários do Sistema</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie outros administradores de sistema.
          </p>
        </div>
      </div>
    </div>
  );
}