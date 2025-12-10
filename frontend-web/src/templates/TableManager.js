import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient';

/**
 * Template para "Gestão de Tabelas".
 * Permite selecionar uma entidade (ex: Clientes) e adicionar colunas extras.
 */
export default function TableManager() {
  const [selectedTable, setSelectedTable] = useState('clients');
  
  const tables = [
      { id: 'clients', label: 'Clientes' },
      { id: 'orders', label: 'Pedidos' },
      { id: 'products', label: 'Produtos' }
  ];

  // Mock de colunas atuais
  const { data: columns } = useQuery(['tableColumns', selectedTable], async () => {
    // Buscaria do backend: /api/sysadmin/tables/{selectedTable}/columns
    return [
        { name: 'name', type: 'string', system: true, label: 'Nome' },
        { name: 'email', type: 'string', system: true, label: 'Email' },
        { name: 'custom_field_1', type: 'date', system: false, label: 'Data Aniversário' }
    ]; 
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Customização de Tabelas</h2>
        </div>
        
        <div className="p-6 flex-1 overflow-auto">
            <div className="flex flex-col md:flex-row gap-6 h-full">
                {/* Lateral Esquerda: Seleção */}
                <div className="w-full md:w-1/3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecione a Tabela</label>
                    <select 
                        value={selectedTable} 
                        onChange={(e) => setSelectedTable(e.target.value)}
                        className="w-full rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 p-2.5 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    >
                        {tables.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Selecione qual tabela do banco de dados você deseja personalizar. Colunas do sistema não podem ser removidas.
                    </p>
                </div>
                
                {/* Lateral Direita: Colunas */}
                <div className="w-full md:w-2/3 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border dark:border-gray-700 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold dark:text-white text-sm">Colunas Ativas: {tables.find(t => t.id === selectedTable)?.label}</h3>
                        <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">
                            + Nova Coluna
                        </button>
                    </div>
                    
                    <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                        {columns?.map((col, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-200 dark:border-gray-700">
                                <div>
                                    <span className="text-sm font-semibold text-gray-800 dark:text-white block">{col.label}</span>
                                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{col.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                        {col.type}
                                    </span>
                                    {col.system ? (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                                            Sistema
                                        </span>
                                    ) : (
                                        <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded border border-green-100 dark:border-green-800">
                                            Custom
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}