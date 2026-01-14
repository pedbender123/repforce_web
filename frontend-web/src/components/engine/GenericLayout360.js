import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import useActionExecutor from '../../hooks/useActionExecutor';
import { Loader2, AlertTriangle, Settings, Plus, Layout, Database } from 'lucide-react';
import { useBuilder } from '../../context/BuilderContext';
import GenericForm from '../builder/GenericForm';
import TabConfigurator from '../builder/TabConfigurator';
import DynamicPageLoader from '../../pages/app/DynamicPageLoader';

const SimpleDataTable = ({ entityId, filterColumn, filterValue, filters = {} }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cols, setCols] = useState([]);

    useEffect(() => {
        if (entityId && filterColumn && filterValue) {
            fetchData();
        }
    }, [entityId, filterColumn, filterValue, JSON.stringify(filters)]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Get Entity Slug
            const { data: ent } = await apiClient.get(`/api/builder/entities/${entityId}`); 
            const slug = ent.slug; 
            
            // 2. Fetch Fields for headers
            const { data: fields } = await apiClient.get(`/api/builder/entities/${entityId}/fields`);
            const visibleCols = fields.slice(0, 5); // Show first 5 cols
            setCols(visibleCols);

            // 3. Build Query Params
            const params = new URLSearchParams();
            params.append(filterColumn, filterValue);
            
            // Append extra filters (arrays or single values)
            Object.entries(filters).forEach(([key, val]) => {
                if (Array.isArray(val)) {
                    val.forEach(v => params.append(key, v));
                } else {
                    params.append(key, val);
                }
            });

            const { data: recs } = await apiClient.get(`/api/engine/object/${slug}?${params.toString()}`);
            setRecords(recs);

        } catch (e) {
            console.error("Table Load Failed", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-400"><Loader2 className="animate-spin inline-block mr-2" /> Carregando lista...</div>;
    if (records.length === 0) return <div className="p-12 text-center text-gray-400">Nenhum registro encontrado para esta aba.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="text-[10px] text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                        {cols.map(c => <th key={c.id} className="px-6 py-3 font-bold tracking-wider">{c.label}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {records.map(r => (
                        <tr key={r.id} className="bg-white dark:bg-gray-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                            {cols.map(c => (
                                <td key={c.id} className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                    {typeof r[c.name] === 'object' ? JSON.stringify(r[c.name]) : r[c.name]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ...

// Dentro do GenericLayout360 (render)
// ...
// Este replace é complicado porque eu tenho que "pular" o GenericLayout360 definition para chegar no render
// Vou usar dois replaces separados. Um para o componente, outro para a chamada.
// Mas o file está QUEBRADO agora com linhas faltando se eu deletei antes?
// O view_file anterior mostrou linha 11 a 61 com código. A linha 56 tinha o comentário.
// Vou substituir linha 11 até 82.


/**
 * GenericLayout360 (Split View 33/67)
 * Implements the Engine Authority and Dual Realm principles of Repforce 2.1.
 */
const GenericLayout360 = ({ pageId, entityId, entitySlug, entityName, layoutConfig, recordId: propRecordId }) => {
    const [searchParams] = useSearchParams();
    // Priority: Prop > URL 'id' > URL 'record_id'
    const recordId = propRecordId || searchParams.get('id') || searchParams.get('record_id');
    const { isEditMode } = useBuilder();
    
    const [data, setData] = useState(null);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTabId, setActiveTabId] = useState(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Get tabs from layoutConfig
    const tabs = layoutConfig?.tabs || [];

    useEffect(() => {
        if (entityId) fetchRecordAndFields();
    }, [entityId, recordId]);

    useEffect(() => {
        if (tabs.length > 0 && !activeTabId) {
            setActiveTabId(tabs[0].id || 'general');
        }
    }, [tabs]);

    const fetchRecordAndFields = async () => {
        if (!recordId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            const [fieldsRes, recordRes] = await Promise.all([
                apiClient.get(`/api/builder/entities/${entityId}/fields`),
                apiClient.get(`/api/engine/object/${entitySlug}`)
            ]);
            
            setFields(fieldsRes.data);
            // FIX: Convert recordId to number for correct comparison
            const numericId = parseInt(recordId);
            const record = recordRes.data.find(r => r.id === numericId || r.id === recordId);
            
            if (record) {
                setData(record);
            } else {
                setError("Registro não encontrado.");
            }
        } catch (err) {
            setError("Erro ao carregar dados.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTabs = async (newTabs) => {
        try {
            const updatedLayout = {
                ...(layoutConfig || {}),
                tabs: newTabs
            };

            await apiClient.put(`/api/builder/navigation/pages/${pageId}`, {
                name: entityName || "Página 360",
                layout_config: updatedLayout
            });
            window.location.reload();
        } catch (err) {
            alert("Erro ao salvar abas: " + (err.response?.data?.detail || err.message));
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
    if (error) return <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500"><AlertTriangle size={48} className="mb-2" /><p>{error}</p></div>;
    if (!data && recordId) return <div className="text-center p-12 text-gray-400">Nenhum dado encontrado.</div>;
    if (!recordId) return <div className="text-center p-12 text-gray-400">Selecione um registro para visualizar.</div>;

    const activeTabDef = tabs.find(t => (t.id || t.label) === activeTabId);

    return (
        <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-160px)] gap-6 animate-in fade-in duration-500">
            {/* Left Panel: 33% (Details) */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <Database size={16} className="text-blue-600" />
                             <h3 className="font-bold text-gray-800 dark:text-white uppercase text-xs tracking-widest">Ficha Cadastral</h3>
                        </div>
                    </div>
                        <div className="p-5 flex flex-col gap-4">
                            {fields.filter(f => !f.is_hidden).map(field => (
                                <div key={field.id} className="group">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block tracking-wider">
                                        {field.label}
                                    </label>
                                    <div className="text-sm text-gray-700 dark:text-gray-200 font-medium break-words">
                                        {data && data[field.name] !== undefined && data[field.name] !== null ? (
                                            typeof data[field.name] === 'boolean' ? (data[field.name] ? 'Sim' : 'Não') :
                                            field.type === 'currency' ? `R$ ${parseFloat(data[field.name]).toFixed(2)}` :
                                            data[field.name].toString()
                                        ) : (
                                            <span className="text-gray-300 italic text-xs">Vazio</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                </div>
                
                
                {/* Visual Identity Section Removed as per request */}
            </div>

            {/* Right Panel: 67% (Tabs/Insights) */}
            <div className="w-full lg:w-2/3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
                {/* Tabs Header */}
                <div className="flex items-center border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 px-2 pt-2">
                    <div className="flex-1 overflow-x-auto flex scrollbar-hide gap-1">
                        <button
                            onClick={() => setActiveTabId('general')}
                            className={`px-6 py-3 text-sm font-semibold rounded-t-xl transition-all ${activeTabId === 'general' || !activeTabId ? 'bg-white dark:bg-gray-800 text-blue-600 border-x border-t border-gray-100 dark:border-gray-700 -mb-[1px]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Insights
                        </button>
                        {tabs.filter(t => t.is_active).map(tab => (
                            <button
                                key={tab.id || tab.label}
                                onClick={() => setActiveTabId(tab.id || tab.label)}
                                className={`px-6 py-3 text-sm font-semibold rounded-t-xl transition-all ${activeTabId === (tab.id || tab.label) ? 'bg-white dark:bg-gray-800 text-blue-600 border-x border-t border-gray-100 dark:border-gray-700 -mb-[1px]' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    {isEditMode && (
                        <button 
                            onClick={() => setIsConfigOpen(true)}
                            className="p-3 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Configurar Abas"
                        >
                            <Settings size={18} />
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-0">
                    {activeTabId === 'general' || !activeTabId ? (
                        <div className="p-8 flex flex-col items-center justify-center h-full text-center">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 text-blue-600">
                                <Plus size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-700 dark:text-white mb-2">Painel de Contexto</h4>
                            <p className="text-gray-400 max-w-sm text-sm italic">Adicione widgets ou selecione uma aba relacionada para explorar os dados de {entityName}.</p>
                        </div>
                    ) : activeTabDef ? (
                        <div className="min-h-full">
                            {activeTabDef.type === 'page' && activeTabDef.target_page_id ? (
                                <DynamicPageLoader pageId={activeTabDef.target_page_id} embedded={true} />
                            ) : activeTabDef.target_entity && activeTabDef.filter_column ? (
                                <SimpleDataTable 
                                    entityId={activeTabDef.target_entity}
                                    filterColumn={activeTabDef.filter_column}
                                    filterValue={recordId}
                                />
                            ) : (
                                <div className="p-12 text-center text-gray-400 italic">Configure esta aba no Builder para visualizar dados.</div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>

            <TabConfigurator 
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                currentTabs={tabs}
                onSave={handleSaveTabs}
            />
        </div>
    );
};

export default GenericLayout360;
