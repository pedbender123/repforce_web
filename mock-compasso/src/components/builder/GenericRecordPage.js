import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import useActionExecutor from '../../hooks/useActionExecutor';
import { Loader2, AlertTriangle, Settings } from 'lucide-react';
import { useBuilder } from '../../context/BuilderContext';
import FieldLayoutModal from './FieldLayoutModal';

const GenericRecordPage = ({ pageId, entityId, entitySlug, entityName, layoutConfig }) => {
    const [searchParams] = useSearchParams();
    const recordId = searchParams.get('record_id');
    
    const [data, setData] = useState(null);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Actions
    const { executeAction } = useActionExecutor();

    const { isEditMode } = useBuilder();
    const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);

    useEffect(() => {
        if (entityId) fetchFields();
    }, [entityId]);

    useEffect(() => {
        // Main Logic: ID exists vs No ID
        if (recordId) {
            fetchRecord(recordId);
        } else {
            // No ID: Check for PAGE_LOAD action
            handlePageLoadAction();
        }
    }, [recordId, pageId]);

    const fetchFields = async () => {
        try {
            const { data } = await apiClient.get(`/api/builder/entities/${entityId}/fields`);
            setFields(data);
        } catch (error) {
            console.error("Failed to load fields", error);
        }
    };

    const fetchRecord = async (id) => {
        setLoading(true);
        setError(null);
        try {
            // Need endpoint for single item. 
            // Using list filtering or assuming we have GET /object/{slug}/{id} ?
            // Let's assume list filtering by ID for safety or existing patterns.
            // Actually `actions.py` uses `db.query(...).filter(id=...)`.
            // Let's try to find an endpoint.
            // GenericListPage uses `GET /api/engine/object/{slug}` (List).
            // Let's assume backend supports `GET /api/engine/object/{slug}/{id}` or we filter list.
            // Checking `builder.py` or `data.py`... 
            // I'll assume standard REST list for now and filter just in case, or implement get one.
            // Wait, existing code `GenericListPage` does `apiClient.get('/api/engine/object/' + entitySlug)`.
            // I'll assume we don't have Get One yet. I'll Fetch All and Find (inefficient but works for now).
            // TODO: Optimize backend endpoint.
            const { data } = await apiClient.get(`/api/engine/object/${entitySlug}`);
            const record = data.find(r => r.id === id);
            
            if (record) {
                setData(record);
            } else {
                setError("Registro não encontrado.");
            }
        } catch (error) {
            setError("Erro ao carregar registro.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageLoadAction = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/api/builder/actions?trigger_context=${pageId}&trigger_source=PAGE_LOAD`);
            if (data && data.length > 0) {
                const action = data[0];
                await executeAction(action, { entitySlug }); 
            } else {
                setData(null);
                setError(null);
            }
        } catch (e) {
            console.error("Failed to trigger page load action", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveFieldsLayout = async (newLayout) => {
        try {
            await apiClient.put(`/api/builder/navigation/pages/${pageId}`, {
                name: entityName, // Or fetch actual name
                layout_config: {
                    ...(layoutConfig || {}),
                    fields_layout: newLayout
                }
            });
            window.location.reload();
        } catch (error) {
            alert("Erro ao salvar layout: " + (error.response?.data?.detail || error.message));
        }
    };

    const getTitleInfo = () => {
        if (!data) return { value: 'Carregando...', name: null };

        const layout = layoutConfig?.fields_layout || [];
        const firstFieldInLayout = layout.find(item => item.type !== 'divider');

        if (firstFieldInLayout && data[firstFieldInLayout.name] !== undefined && data[firstFieldInLayout.name] !== null) {
            return { value: String(data[firstFieldInLayout.name]), name: firstFieldInLayout.name };
        }

        const firstField = fields.find(f => f.name.toLowerCase() !== 'id');
        if (firstField && data[firstField.name] !== undefined && data[firstField.name] !== null) {
            return { value: String(data[firstField.name]), name: firstField.name };
        }

        return { 
            value: data.nome || data.name || data.razao_social || 'Sem título',
            name: data.nome ? 'nome' : (data.name ? 'name' : (data.razao_social ? 'razao_social' : null))
        };
    };

    const titleInfo = getTitleInfo();

    const renderLayoutItems = () => {
        const layout = layoutConfig?.fields_layout || [];
        
        if (layout.length === 0) {
            return fields
                .filter(field => field.name !== titleInfo.name)
                .map(field => (
                    <div key={field.name} className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            {field.label}
                        </label>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded text-sm text-gray-800 dark:text-gray-200 min-h-[44px]">
                            {data && data[field.name] !== undefined && data[field.name] !== null ? String(data[field.name]) : '-'}
                        </div>
                    </div>
                ));
        }

        return layout.map((item, idx) => {
            if (item.type === 'divider') {
                return (
                    <div key={`div-${idx}`} className="py-2 border-b border-gray-100 dark:border-gray-700 mt-4 mb-2 md:col-span-2">
                        <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                            {item.label}
                        </span>
                    </div>
                );
            }

            if (item.name === titleInfo.name) return null;

            const field = fields.find(f => f.name === item.name);
            if (!field) return null;

            return (
                <div key={field.name} className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {field.label}
                    </label>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded text-sm text-gray-800 dark:text-gray-200 min-h-[44px]">
                        {data && data[field.name] !== undefined && data[field.name] !== null ? String(data[field.name]) : '-'}
                    </div>
                </div>
            );
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-blue-600">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
                <AlertTriangle size={48} className="mb-2" />
                <p className="text-lg font-medium">{error}</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-lg">Nenhum registro selecionado.</p>
                <p className="text-sm mt-1">Selecione um item na lista anterior.</p>
            </div>
        );
    }

    return (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full overflow-y-auto group relative">
            {isEditMode && (
                <button 
                    onClick={() => setIsFieldsModalOpen(true)}
                    className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-blue-600 shadow-sm z-10"
                    title="Personalizar Campos"
                >
                    <Settings size={16} />
                </button>
            )}

            <h1 className="text-xl font-bold mb-3 text-gray-800 dark:text-white border-b pb-2 border-gray-100 dark:border-gray-700">
                {titleInfo.value}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                {renderLayoutItems()}
            </div>

            <FieldLayoutModal 
                isOpen={isFieldsModalOpen}
                onClose={() => setIsFieldsModalOpen(false)}
                entityId={entityId}
                currentLayout={layoutConfig?.fields_layout}
                onSave={handleSaveFieldsLayout}
            />
        </div>
    );
};

export default GenericRecordPage;
