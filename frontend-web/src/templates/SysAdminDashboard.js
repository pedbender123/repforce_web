import React from 'react';
import { useSysAdminAuth } from '../context/SysAdminAuthContext';

export default function SysAdminDashboard() {
  const { userProfile } = useSysAdminAuth();
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow m-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Painel SysAdmin</h1>
      <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md border border-red-100 dark:border-red-800 mb-6">
        <p className="text-lg text-gray-700 dark:text-gray-200">
          Logado como <span className="font-bold text-red-600 uppercase">{userProfile}</span>.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-750">
            <h3 className="text-xl font-bold dark:text-white">Tenants</h3>
            <p className="dark:text-gray-400">Gerencie empresas e contratos.</p>
        </div>
      </div>
    </div>
  );
}