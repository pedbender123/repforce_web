import React, { useState } from 'react';
import { Plus, Table, Edit2, Trash2, Check, X } from 'lucide-react';
import apiClient from '../../api/apiClient';

const TableSidebar = ({ entities, selectedEntity, onSelectEntity, onEntityCreated }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newEntityName, setNewEntityName] = useState('');
    
    // Edit State
    const [editingEntityId, setEditingEntityId] = useState(null);
    const [editName, setEditName] = useState('');

    const handleCreate = async () => {
        if (!newEntityName) return;
        try {
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
    
    const startEditing = (entity, e) => {
        e.stopPropagation();
        setEditingEntityId(entity.id);
        setEditName(entity.display_name);
    };

    const handleUpdate = async (e) => {
        e.stopPropagation();
        if (!editName) return;
        try {
            await apiClient.patch(`/api/builder/entities/${editingEntityId}`, {
                display_name: editName
                // slug intentionally left out to avoid complex rename for now, or we can add it later
            });
            setEditingEntityId(null);
            if (onEntityCreated) onEntityCreated();
        } catch (error) {
            alert("Erro ao atualizar: " + (error.response?.data?.detail || error.message));
        }
    };
    
    const handleDelete = async (entityId, e) => {
        e.stopPropagation();
        if (!window.confirm("Tem certeza? Isso apagará a tabela e todos os dados permanentemente!")) return;
        
        try {
            await apiClient.delete(`/api/builder/entities/${entityId}`);
            if (selectedEntity?.id === entityId) onSelectEntity(null);
            if (onEntityCreated) onEntityCreated();
        } catch (error) {
            alert("Erro ao deletar: " + (error.response?.data?.detail || error.message));
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
                    <div key={entity.id} className="relative group">
                        {editingEntityId === entity.id ? (
                            <div className="flex items-center p-2 bg-white dark:bg-gray-800 rounded shadow-sm border border-blue-500">
                                <input
                                    className="flex-1 text-sm bg-transparent outline-none dark:text-white"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleUpdate(e);
                                        if (e.key === 'Escape') setEditingEntityId(null);
                                    }}
                                />
                                <button onClick={handleUpdate} className="text-green-500 hover:text-green-600 p-1"><Check size={14} /></button>
                                <button onClick={() => setEditingEntityId(null)} className="text-red-500 hover:text-red-600 p-1"><X size={14} /></button>
                            </div>
                        ) : (
                            <button
                                onClick={() => onSelectEntity(entity)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${selectedEntity?.id === entity.id
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center overflow-hidden">
                                     <Table size={16} className="mr-3 opacity-70 flex-shrink-0" />
                                     <span className="truncate">{entity.display_name}</span>
                                </div>
                                {!entity.is_system && (
                                    <div className="flex items-center gap-1">
                                        <div onClick={(e) => startEditing(entity, e)} className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-blue-500">
                                            <Edit2 size={12} />
                                        </div>
                                        <div onClick={(e) => handleDelete(entity.id, e)} className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-red-500">
                                            <Trash2 size={12} />
                                        </div>
                                    </div>
                                )}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableSidebar;
