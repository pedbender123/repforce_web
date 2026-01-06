import React, { useState } from 'react';
import { Plus, Table } from 'lucide-react';
import apiClient from '../../api/apiClient';

const TableSidebar = ({ entities, selectedEntity, onSelectEntity, onEntityCreated }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newEntityName, setNewEntityName] = useState('');

    const handleCreate = async () => {
        if (!newEntityName) return;
        try {
            // Slugify basic
            const slug = newEntityName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

            await apiClient.post('/api/builder/entities', {
                slug: slug,
                display_name: newEntityName,
                is_system: false
            });

            setNewEntityName('');
            setIsCreating(false);
            if (onEntityCreated) onEntityCreated();
        } catch (error) {
            alert("Erro ao criar tabela: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div className="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-black/20 h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tabelas</span>
                <button
                    onClick={() => setIsCreating(true)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                    <Plus size={16} />
                </button>
            </div>

            {isCreating && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-800">
                    <input
                        className="w-full text-sm p-1 border rounded"
                        placeholder="Nome da tabela..."
                        value={newEntityName}
                        onChange={e => setNewEntityName(e.target.value)}
                        autoFocus
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleCreate();
                            if (e.key === 'Escape') setIsCreating(false);
                        }}
                    />
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {entities.map(entity => (
                    <button
                        key={entity.id}
                        onClick={() => onSelectEntity(entity)}
                        className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${selectedEntity?.id === entity.id
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                            }`}
                    >
                        <Table size={16} className="mr-3 opacity-70" />
                        <span className="truncate">{entity.display_name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TableSidebar;
