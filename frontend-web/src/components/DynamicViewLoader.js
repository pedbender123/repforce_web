import React from 'react';
import DynamicTable from './DynamicTable';
import DynamicForm from './DynamicForm';

/**
 * Interpretador de Visualizações (Fase 3 - Refatorado)
 * Decide se renderiza Tabela ou Formulário baseado no viewMode.
 */
const DynamicViewLoader = ({ entity, viewMode, selectedId, onAction }) => {

    // Callbacks unificados para os componentes filhos
    const handleEdit = (id) => onAction('edit', id);
    const handleCreate = () => onAction('create');
    const handleDelete = (id) => onAction('delete', id);
    const handleCancel = () => onAction('list');
    const handleSuccess = () => onAction('list');

    if (viewMode === 'form') {
        return (
            <DynamicForm
                entity={entity}
                recordId={selectedId}
                onCancel={handleCancel}
                onSuccess={handleSuccess}
            />
        );
    }

    // Default to List
    return (
        <DynamicTable
            entity={entity}
            onEdit={handleEdit}
            onCreate={handleCreate}
            onDelete={handleDelete}
        />
    );
};

export default DynamicViewLoader;
