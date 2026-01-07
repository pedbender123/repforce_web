import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import useActionExecutor from '../../hooks/useActionExecutor';
import { Loader2, AlertTriangle } from 'lucide-react';

const GenericRecordPage = ({ pageId, entityId, entitySlug, entityName, layoutConfig }) => {
    const [searchParams] = useSearchParams();
    const recordId = searchParams.get('record_id');
    
    const [data, setData] = useState(null);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Actions
    const { executeAction } = useActionExecutor();

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
        // Don't show loading immediately, maybe action is fast redirect
        // But fetching actions is async.
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/api/builder/actions?trigger_context=${pageId}&trigger_source=PAGE_LOAD`);
            if (data && data.length > 0) {
                const action = data[0];
                console.log("Triggering PAGE_LOAD action:", action.name);
                // Execute action
                // Context for page load can include entitySlug
                await executeAction(action, { entitySlug }); 
            } else {
                // No action, no ID.
                setData(null);
                setError(null); // Just show "Empty State"
            }
        } catch (e) {
            console.error("Failed to trigger page load action", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-blue-600" size={32} />
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
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b pb-2 border-gray-100 dark:border-gray-700">
                {entityName}: <span className="font-normal text-gray-500">{data.nome || data.name || data.id}</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map(field => (
                    <div key={field.name} className="space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {field.label}
                        </label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                            {String(data[field.name] !== undefined && data[field.name] !== null ? data[field.name] : '-')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GenericRecordPage;
