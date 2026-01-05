import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import DynamicViewLoader from '../../components/DynamicViewLoader';
import apiClient from '../../api/apiClient';
import { useQueryClient } from '@tanstack/react-query';

const EntityPage = () => {
    const { entity } = useParams();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState('list'); // list | form
    const [selectedId, setSelectedId] = useState(null);

    const handleAction = async (action, id) => {
        switch (action) {
            case 'create':
                setSelectedId(null);
                setViewMode('form');
                break;
            case 'edit':
                setSelectedId(id);
                setViewMode('form');
                break;
            case 'list':
                setSelectedId(null);
                setViewMode('list');
                break;
            case 'delete':
                if (window.confirm('Tem certeza que deseja excluir este registro?')) {
                    try {
                        await apiClient.delete(`/v1/engine/${entity}/${id}`);
                        queryClient.invalidateQueries(['data', entity]);
                    } catch (error) {
                        alert('Erro ao excluir registro');
                    }
                }
                break;
            default:
                break;
        }
    };

    return (
        <div className="container mx-auto p-4 h-full">
            <DynamicViewLoader
                entity={entity}
                viewMode={viewMode}
                selectedId={selectedId}
                onAction={handleAction}
            />
        </div>
    );
};

export default EntityPage;
