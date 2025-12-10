import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * Template específico para "Gestão de Cargos".
 * Lista cargos e, ao expandir, mostra matriz de permissões por área.
 */
export default function RoleManager() {
  const [expandedRole, setExpandedRole] = useState(null);

  // 1. Busca Cargos
  const { data: roles } = useQuery(['roles'], async () => {
    // Mock temporário até o backend ter essa rota
    // const res = await apiClient.get('/sysadmin/roles'); 
    return [
        { id: 1, name: 'Administrador', permissions: { 1: true, 2: true, 3: true } }, 
        { id: 2, name: 'Vendedor', permissions: { 2: true } },
        { id: 3, name: 'Financeiro', permissions: { 3: true } }
    ]; 
  });

  // 2. Busca Áreas (para montar a lista de seleção)
  const { data: areas } = useQuery(['areas'], async () => {
     // Mock temporário
     return [
         { id: 1, label: 'Vendas' }, { id: 2, label: 'Clientes' }, { id: 3, label: 'Financeiro' }
     ]; 
  });

  const toggleExpand = (roleId) => {
    setExpandedRole(expandedRole === roleId ? null : roleId);
  };

  const togglePermission = (roleId, areaId) => {
    console.log(`Alterar permissão: Cargo ${roleId} -> Área ${areaId}`);
    // Aqui entra mutation para salvar no backend
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Gestão de Cargos & Permissões</h2>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Defina quais áreas cada perfil de usuário pode acessar dentro da plataforma.
        </p>

        {roles?.map(role => (
          <div key={role.id} className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
            {/* Header do Cargo */}
            <div 
                onClick={() => toggleExpand(role.id)}
                className="bg-gray-50 dark:bg-gray-700 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
                <div className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    {expandedRole === role.id ? <ChevronDownIcon className="w-5 h-5"/> : <ChevronRightIcon className="w-5 h-5"/>}
                    {role.name}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Object.keys(role.permissions).length} áreas permitidas
                </span>
            </div>

            {/* Corpo Expandido (Lista de Áreas) */}
            {expandedRole === role.id && (
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {areas?.map(area => (
                            <label key={area.id} className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={role.permissions[area.id] || false}
                                    onChange={() => togglePermission(role.id, area.id)}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{area.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}