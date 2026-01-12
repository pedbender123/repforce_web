import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import useActionExecutor from '../hooks/useActionExecutor';
import { Loader2, AlertTriangle, Plus, Settings } from 'lucide-react';
import { useBuilder } from '../context/BuilderContext';
import FieldLayoutModal from '../components/builder/FieldLayoutModal';

/**
 * EntityPage (Ficha 360 v2)
 * Componente principal da Ficha 360 com suporte a personalização de campos e separadores.
 */
const EntityPage = ({ page, pageId, entityId, entitySlug, entityName }) => {
    console.log("[EntityPage] Props:", { pageId, entityId, entitySlug, entityName });
    const [searchParams] = useSearchParams();
    const recordId = searchParams.get('record_id');
    
    const [data, setData] = useState(null);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { isEditMode } = useBuilder();
    const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);

    // Actions
    const { executeAction } = useActionExecutor();

    useEffect(() => {
        if (entityId) fetchFields();
    }, [entityId]);

    useEffect(() => {
        if (recordId) {
            fetchRecord(recordId);
        } else {
            handlePageLoadAction();
        }
    }, [recordId, pageId]);

    const fetchFields = async () => {
        console.log("[EntityPage] Fetching fields for entityId:", entityId);
        try {
            const { data } = await apiClient.get(`/api/builder/entities/${entityId}/fields`);
            console.log("[EntityPage] Fields received:", data.length);
            setFields(data);
        } catch (error) {
            console.error("Failed to load fields", error);
        }
    };

    const fetchRecord = async (id) => {
        setLoading(true);
        setError(null);
        try {
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
            const updatedLayout = {
                ...(page.layout_config || {}),
                fields_layout: newLayout
            };

            await apiClient.put(`/api/builder/navigation/pages/${pageId}`, {
                name: page.name,
                layout_config: updatedLayout
            });
            
            window.location.reload(); 
        } catch (error) {
            alert("Erro ao salvar layout: " + (error.response?.data?.detail || error.message));
        }
    };

    const getTitleInfo = () => {
        if (!data) return { value: 'Carregando...', name: null };

        const layout = page.layout_config?.fields_layout || [];
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
        const layout = page.layout_config?.fields_layout || [];
        
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
                    <div key={`div-${idx}`} className="py-2 border-b border-gray-100 dark:border-gray-700 mt-4 mb-2">
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
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-red-500">
                <AlertTriangle size={48} className="mb-2" />
                <p className="text-lg font-medium">{error}</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
                <p className="text-lg">Nenhum registro selecionado.</p>
                <p className="text-sm mt-1">Selecione um item na lista anterior.</p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", gap: "16px", height: "calc(100vh - 120px)" }}>
            {/* Bloco 30% (Ficha / Detalhes) */}
            <div style={{ width: "30%", minWidth: "300px" }} className="flex flex-col h-full">
                <div className="flex-1 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-y-auto group/ficha relative">
                    {isEditMode && (
                        <button 
                            onClick={() => setIsFieldsModalOpen(true)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full opacity-0 group-hover/ficha:opacity-100 transition-opacity text-gray-500 hover:text-blue-600 shadow-sm z-10"
                            title="Personalizar Campos"
                        >
                            <Settings size={16} />
                        </button>
                    )}

                    <h1 className="text-xl font-bold mb-3 text-gray-800 dark:text-white border-b pb-1 border-gray-100 dark:border-gray-700">
                        {titleInfo.value}
                    </h1>

                    <div className="grid grid-cols-1 gap-2">
                        {renderLayoutItems()}
                    </div>
                </div>
            </div>

            {/* Bloco 70% (Área de Conteúdo / Abas) */}
            <div style={{ flex: 1 }} className="flex flex-col h-full overflow-hidden">
                {/* Tab Bar Container */}
                <div className="flex items-center gap-1 px-4 pt-2 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border-x border-t border-gray-200 dark:border-gray-700 rounded-t-lg text-blue-600 shadow-sm">
                        Geral
                    </div>
                    
                    <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors">
                        <Plus size={14} /> Add Aba
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 bg-white dark:bg-gray-800 rounded-b-lg shadow-sm border-x border-b border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <p className="text-xl font-medium">Área de Conteúdo (70%)</p>
                        <p className="text-sm">Espaço reservado para tabelas relacionadas, dashboards ou formulários adicionais.</p>
                    </div>
                </div>
            </div>

            <FieldLayoutModal 
                isOpen={isFieldsModalOpen}
                onClose={() => setIsFieldsModalOpen(false)}
                entityId={entityId}
                currentLayout={page.layout_config?.fields_layout}
                onSave={handleSaveFieldsLayout}
            />
        </div>
    );
};

export default EntityPage;
