import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Database } from 'lucide-react';

import TableSidebar from '../../components/builder/TableSidebar';
import FieldsGrid from '../../components/builder/FieldsGrid';
import FieldModal from '../../components/builder/FieldModal';

const DatabaseEditor = () => {
    const [entities, setEntities] = useState([]);
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [fields, setFields] = useState([]);
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);

    useEffect(() => {
        fetchEntities();
    }, []);

    useEffect(() => {
        if (selectedEntity) {
            fetchFields(selectedEntity.id);
        } else {
            setFields([]);
        }
    }, [selectedEntity]);

    const fetchEntities = async () => {
        try {
            const { data } = await apiClient.get('/api/builder/entities');
            setEntities(data);
        } catch (error) {
            console.error("Erro ao buscar tabelas:", error);
        }
    };

    const fetchFields = async (entityId) => {
        try {
            const { data } = await apiClient.get(`/api/builder/entities/${entityId}/fields`);
            setFields(data);
        } catch (error) {
            console.error("Erro ao buscar campos:", error);
        }
    };

    return (
        <div className="flex h-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <TableSidebar
                entities={entities}
                selectedEntity={selectedEntity}
                onSelectEntity={setSelectedEntity}
                onEntityCreated={fetchEntities}
            />

            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full overflow-hidden">
                {selectedEntity ? (
                    <>
                        {/* Header */}
                        <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 justify-between bg-white dark:bg-gray-900 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <Database size={20} className="text-blue-500" />
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                                    {selectedEntity.display_name}
                                </h2>
                                <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                    {selectedEntity.slug}
                                </span>
                            </div>
                        </div>

                        <FieldsGrid
                            fields={fields}
                            onAddField={() => setIsFieldModalOpen(true)}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Database size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">Selecione ou crie uma tabela</p>
                    </div>
                )}
            </div>

            <FieldModal
                isOpen={isFieldModalOpen}
                onClose={() => setIsFieldModalOpen(false)}
                entity={selectedEntity}
                onFieldCreated={() => fetchFields(selectedEntity.id)}
            />
        </div>
    );
};

export default DatabaseEditor;
