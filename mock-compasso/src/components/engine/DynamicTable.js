import React, { useState } from 'react';
import apiClient from '../../api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';

const DynamicTable = ({ entity, onEdit, onCreate, onDelete, onRowClick, permanentFilter, hideTitle }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Fetch Metadata
    const { data: meta, isLoading: isMetaLoading } = useQuery({
        queryKey: ['metadata', entity],
        queryFn: async () => {
            const response = await apiClient.get(`/api/engine/metadata/${entity}`);
            return response.data;
        }
    });

    // 2. Fetch Data
    const { data: records, isLoading: isDataLoading } = useQuery({
        queryKey: ['data', entity, permanentFilter],
        queryFn: async () => {
            // Build query params including permanentFilter
            const params = { ...permanentFilter };
            const response = await apiClient.get(`/api/engine/object/${entity}`, { params });
            return response.data;
        }
    });

    if (isMetaLoading || isDataLoading) {
        return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    }

    if (!meta) return <div>Erro ao carregar metadados da entidade: {entity}</div>;

    const columns = meta.fields.filter(f => !f.is_hidden_in_list);

    // Client-side filtering for search term (MVP)
    // Real implementation should move this to backend params if dataset is large
    const filteredRecords = records?.filter(row => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return Object.values(row).some(val => String(val).toLowerCase().includes(searchLower));
    });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden h-full flex flex-col">
            {!hideTitle && (
                <div className="p-4 border-b dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white">{meta.display_name}</h2>
                        {meta.description && <p className="text-sm text-gray-500 dark:text-gray-400">{meta.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="pl-9 pr-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {onCreate && (
                            <button
                                onClick={onCreate}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Novo
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="overflow-auto flex-1">
                <table className="w-full text-left relative">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs uppercase font-semibold sticky top-0 z-10">
                        <tr>
                            {columns.map(col => (
                                <th key={col.name} className="px-6 py-3">{col.label}</th>
                            ))}
                            {(onEdit || onDelete) && <th className="px-6 py-3 text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {filteredRecords?.map((row, idx) => (
                            <tr 
                                key={row.id || idx} 
                                className={`
                                    hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors 
                                    ${onRowClick ? 'cursor-pointer active:bg-blue-50' : ''}
                                `}
                                onClick={() => onRowClick && onRowClick(row)}
                            >
                                {columns.map(col => (
                                    <td key={col.name} className="px-6 py-4 text-sm dark:text-gray-300">
                                        {formatValue(row[col.name], col.type)}
                                    </td>
                                ))}
                                {(onEdit || onDelete) && (
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(row.id)}
                                                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 rounded transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(row.id)}
                                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {(!filteredRecords || filteredRecords.length === 0) && (
                            <tr>
                                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
                                    Nenhum registro encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const formatValue = (val, type) => {
    if (val === null || val === undefined) return '-';

    switch (type) {
        case 'currency':
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
        case 'date':
           try { return new Date(val).toLocaleDateString('pt-BR'); } catch { return val; }
        case 'boolean':
            return val ? 'Sim' : 'Não';
        default:
            return String(val);
    }
};

export default DynamicTable;
