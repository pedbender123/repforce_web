import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import sysAdminApiClient from '../../api/sysAdminApiClient';

const fetchAllUsers = async () => {
  const { data } = await sysAdminApiClient.get('/sysadmin/all-users');
  return data;
};

const profileOptions = [
  { value: 'all', label: 'Todos Perfis' },
  { value: 'sysadmin', label: 'SysAdmin' },
  { value: 'admin', label: 'Admin' },
  { value: 'representante', label: 'Representante' },
];

export default function AllUserManagement() {
  const [profileFilter, setProfileFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');

  const { data: users, isLoading: isLoadingUsers } = useQuery(
    ['allSystemUsers'], 
    fetchAllUsers
  );

  const uniqueTenants = useMemo(() => {
    if (!users) return [];
    const tenants = users.map(user => user.tenant);
    const tenantMap = new Map(tenants.map(t => [t.id, t]));
    return [{ id: 'all', name: 'Todos Tenants' }, ...Array.from(tenantMap.values())];
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const profileMatch = profileFilter === 'all' || user.profile === profileFilter;
      const tenantMatch = tenantFilter === 'all' || user.tenant.id === parseInt(tenantFilter, 10);
      return profileMatch && tenantMatch;
    });
  }, [users, profileFilter, tenantFilter]);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden transition-colors">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Todos Usuários do Sistema</h2>
      </div>

      {/* Filtros */}
      <div className="p-4 flex flex-col md:flex-row gap-4">
        <div>
          <label htmlFor="profileFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrar por Perfil
          </label>
          <select
            id="profileFilter"
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
            className="mt-1 block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-repforce-primary focus:border-repforce-primary sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-white"
          >
            {profileOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tenantFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrar por Tenant
          </label>
          <select
            id="tenantFilter"
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="mt-1 block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-repforce-primary focus:border-repforce-primary sm:text-sm rounded-md bg-white dark:bg-gray-700 dark:text-white"
          >
            {uniqueTenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email (Contato)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Perfil</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tenant</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoadingUsers ? (
              <tr><td colSpan="5" className="p-4 text-center dark:text-white">Carregando...</td></tr>
            ) : (
              filteredUsers?.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.profile === 'sysadmin' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                      user.profile === 'admin' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 
                      'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    }`}>
                      {user.profile}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.tenant.name} (ID: {user.tenant.id})</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}