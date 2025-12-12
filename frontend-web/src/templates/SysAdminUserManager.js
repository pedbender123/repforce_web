// Baseado no seu src/pages/sysadmin/UserManagement.js
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import sysAdminApiClient from '../api/sysAdminApiClient';

export default function SysAdminUserManager() {
  const { data: users } = useQuery(['sysUsers'], async () => (await sysAdminApiClient.get('/sysadmin/users')).data);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Gerenciar Usuários SysAdmin</h2>
      <div className="bg-white dark:bg-gray-800 shadow rounded overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">SysAdmin?</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users?.map(u => (
              <tr key={u.id}>
                <td className="px-6 py-4 dark:text-white">{u.username}</td>
                <td className="px-6 py-4 dark:text-white">{u.email}</td>
                <td className="px-6 py-4 dark:text-white">{u.is_sysadmin ? 'Sim' : 'Não'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}