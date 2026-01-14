import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useBuilder } from '../../context/BuilderContext';
import { Settings, RefreshCw, ChevronDown, Check, Plus, Loader2, Trash } from 'lucide-react';
import GenericFormModal from './GenericFormModal';
import VirtualInfoButton from '../VirtualInfoButton';
import useActionExecutor from '../../hooks/useActionExecutor';

const MAX_VISIBLE_COLUMNS = 8;


const GenericListPage = ({ pageId, entityId, entitySlug, entityName, layoutConfig, pageType = 'list' }) => {
    const { isEditMode } = useBuilder();
    const [data, setData] = useState([]);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [searchParams] = useSearchParams();
    
    // Column Config State
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState({}); // { fieldName: value }
    
    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Refetch when search or filters change
    useEffect(() => {
        if (entitySlug) fetchData();
    }, [debouncedSearch, activeFilters]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Actions
    const [listAction, setListAction] = useState(null);
    const [headerActions, setHeaderActions] = useState([]); // Custom Buttons
    const { executeAction } = useActionExecutor();

    useEffect(() => {
        if (entityId) fetchFields();
        if (entitySlug) fetchData();
        if (pageId) fetchPageActions();
    }, [entityId, entitySlug, pageId]);

    const fetchPageActions = async () => {
        try {
            // Fetch actions bound to this page context
            // 1. List Row Click Action
            const { data: listActions } = await apiClient.get(`/api/builder/actions?trigger_context=${pageId}&trigger_source=LIST_CLICK`);
            if (listActions && listActions.length > 0) {
                setListAction(listActions[0]); // Take the first one found
            } else {
                setListAction(null);
            }

            // 1.5 Fetch Trails (Manual List Context)
            try {
                // Filter client side or if API supports it. Assuming API supports filtering.
                // Or fetching all trails and filtering.
                const { data: trails } = await apiClient.get('/api/builder/trails'); 
                // Filter for this page
                const validTrail = trails.find(t => 
                    t.trigger_type === 'MANUAL' && 
                    t.trigger_config?.context === 'LIST' && 
                    String(t.trigger_config?.page_id) === String(pageId) &&
                    t.is_active
                );

                if (validTrail) {
                    setListAction({
                        action_type: 'RUN_TRAIL',
                        config: { trail_id: validTrail.id, name: validTrail.name }
                    });
                }
            } catch (err) {
                console.error("Error checking trails", err);
            }

            // 2. Custom Header Buttons (if list_custom)
            if (pageType === 'list_custom') {
                 const { data: headerActs } = await apiClient.get(`/api/builder/actions?trigger_context=${pageId}&trigger_source=UI_BUTTON`);
                 setHeaderActions(headerActs);
            } else {
                setHeaderActions([]);
            }

        } catch (error) {
            console.error("Failed to load actions", error);
        }
    };

    useEffect(() => {
        // Initialize visible columns from config or default to EMPTY
        if (fields.length > 0) {
            if (layoutConfig?.columns && layoutConfig.columns.length > 0) {
                // Filter to ensure columns still exist
                const validCols = layoutConfig.columns.filter(colName => 
                    fields.some(f => f.name === colName)
                );
                setVisibleColumns(validCols);
            } else {
                // Default: EMPTY (User requested list to start empty)
                setVisibleColumns([]);
            }
        }
    }, [fields, layoutConfig]);

    const fetchFields = async () => {
        try {
            const { data } = await apiClient.get(`/api/builder/entities/${entityId}/fields`);
            setFields(data);
        } catch (error) {
            console.error("Failed to load fields", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `/api/engine/object/${entitySlug}`;
            
            // Check for filters
            const filterField = searchParams.get('filter_field');
            const filterValue = searchParams.get('filter_value');
            

            
            const sep = url.includes('?') ? '&' : '?';
            
            // Append URL filters
            if (filterField && filterValue) {
                url += `${sep}${filterField}=${filterValue}`;
            }

            // Append Search (q)
            if (debouncedSearch) {
                const s = url.includes('?') ? '&' : '?';
                url += `${s}q=${encodeURIComponent(debouncedSearch)}`;
            }

            // Append Active Filters (Strict)
            Object.keys(activeFilters).forEach(key => {
                if (activeFilters[key]) {
                    const s = url.includes('?') ? '&' : '?';
                    url += `${s}${key}=${encodeURIComponent(activeFilters[key])}`;
                }
            });

            // Append Permanent Filters (from Layout Config)
            if (layoutConfig?.permanent_filters) {
                Object.keys(layoutConfig.permanent_filters).forEach(key => {
                     const val = layoutConfig.permanent_filters[key];
                     if (val) {
                        const s = url.includes('?') ? '&' : '?';
                        url += `${s}${key}=${encodeURIComponent(val)}`;
                     }
                });
            }

            const { data } = await apiClient.get(url);
            setData(data);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleColumn = (fieldName) => {
        setVisibleColumns(prev => {
            if (prev.includes(fieldName)) {
                return prev.filter(c => c !== fieldName);
            } else {
                if (prev.length >= MAX_VISIBLE_COLUMNS) {
                    alert(`O limite é de ${MAX_VISIBLE_COLUMNS} colunas.`);
                    return prev;
                }
                return [...prev, fieldName];
            }
        });
    };

    const saveConfiguration = async () => {
        setSavingConfig(true);
        try {
            const newConfig = {
                ...layoutConfig,
                columns: visibleColumns
            };
            
            await apiClient.put(`/api/builder/navigation/pages/${pageId}`, {
                layout_config: newConfig
            });
            setIsConfigOpen(false);
            // Optional: Notify success (toast)
        } catch (error) {
            alert("Erro ao salvar configuração: " + (error.response?.data?.detail || error.message));
        } finally {
            setSavingConfig(false);
        }
    };

    // Helper to get Field Label
    const getLabel = (name) => {
        const f = fields.find(f => f.name === name);
        return f ? f.label : name;
    };

    // Safe aggregation of columns for Dropdown (Handle "Ghost" columns)
    const allColumnKeys = Array.from(new Set([...fields.map(f => f.name), ...visibleColumns]));

    return (
        // REMOVED overflow-hidden from outer div to allow Dropdown to spill over if needed (though z-index helps)
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {entityName || 'Lista'} <span className="text-gray-400 text-sm font-normal">({data.length})</span>
                    </h2>
                    {/* Refresh Button - Only in Edit Mode */}
                    {isEditMode && (
                        <button 
                            onClick={() => { fetchData(); fetchFields(); }} 
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                            title="Atualizar Dados e Campos"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    )}
                </div>

                {/* Center: Search Bar */}
                <div className="flex-1 max-w-sm mx-4">
                    <input 
                        type="text"
                        placeholder="Buscar..."
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                     {/* Filter Button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`p-1.5 rounded-md transition-colors ${
                                Object.keys(activeFilters).length > 0 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title="Filtros"
                        >
                            <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                                {Object.keys(activeFilters).length > 0 && <span className="text-xs font-bold">{Object.keys(activeFilters).length}</span>}
                            </span>
                        </button>
                        
                        {isFilterOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-3 animate-in fade-in zoom-in duration-150">
                                <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Filtros Ativos</h3>
                                {Object.keys(activeFilters).length === 0 && <p className="text-sm text-gray-400 italic mb-2">Nenhum filtro.</p>}
                                
                                <div className="space-y-2 mb-3">
                                    {Object.entries(activeFilters).map(([key, val]) => (
                                        <div key={key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm">
                                            <span className="truncate max-w-[120px]" title={key}>{getLabel(key)}: <b>{val}</b></span>
                                            <button 
                                                onClick={() => {
                                                    const next = {...activeFilters};
                                                    delete next[key];
                                                    setActiveFilters(next);
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-2">
                                    <p className="text-xs font-medium mb-1 dark:text-gray-300">Adicionar Filtro:</p>
                                    <select 
                                        className="w-full text-sm p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
                                        onChange={(e) => {
                                            if(!e.target.value) return;
                                            const fieldName = e.target.value;
                                            const val = prompt(`Valor para filtrar por "${getLabel(fieldName)}":`);
                                            if (val) {
                                                setActiveFilters(prev => ({...prev, [fieldName]: val}));
                                            }
                                            e.target.value = ""; // Reset
                                        }}
                                    >
                                        <option value="">Selecione um campo...</option>
                                        {fields.map(f => (
                                            <option key={f.name} value={f.name}>{f.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Add Record Button - Logic based on pageType */}
                    {pageType === 'list' && (
                        <button 
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                        >
                            <Plus size={16} /> Novo
                        </button>
                    )}

                    {/* Custom Header Buttons */}
                    {pageType === 'list_custom' && headerActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => executeAction(action)} // Global action, no row context
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                        >
                            <Settings size={14} /> {action.name}
                        </button>
                    ))}
                    
                    {/* Fallback for list_custom if no action and in Edit Mode */}
                    {pageType === 'list_custom' && headerActions.length === 0 && isEditMode && (
                         <span className="text-xs text-orange-500 border border-orange-200 bg-orange-50 px-2 py-1 rounded">
                             Sem botões configurados. Adicione em "Botões de Página".
                         </span>
                    )}

                    {/* Column Configuration (Edit Mode Only) */}
                    {isEditMode && (
                        <div className="relative">
                            <button 
                                onClick={() => setIsConfigOpen(!isConfigOpen)}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors
                                    ${isConfigOpen 
                                        ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300' 
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'
                                    }`}
                            >
                                <Settings size={16} /> Colunas
                            </button>

                            {/* Dropdown for Columns */}
                            {isConfigOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-2 animate-in fade-in zoom-in duration-150">
                                    <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-xs font-bold uppercase text-gray-500">Exibir Colunas ({visibleColumns.length}/{MAX_VISIBLE_COLUMNS})</span>
                                        <button 
                                            onClick={saveConfiguration} 
                                            disabled={savingConfig}
                                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 disabled:opacity-50"
                                        >
                                            {savingConfig ? 'Salvando...' : 'Salvar'}
                                        </button>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto space-y-1">
                                        {allColumnKeys.length === 0 ? (
                                            <p className="text-xs text-center text-gray-400 py-2">Nenhum campo disponível</p>
                                        ) : (
                                            allColumnKeys.map(key => {
                                                const field = fields.find(f => f.name === key);
                                                const label = field ? field.label : `${key} (Desconhecido)`;
                                                const isUnknown = !field;
                                                
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleToggleColumn(key)}
                                                        className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded transition-colors text-left
                                                            ${isUnknown ? 'hover:bg-red-50 text-red-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                                                        title={isUnknown ? "Este campo não existe na tabela, mas está na configuração." : ""}
                                                    >
                                                        <span className={isUnknown ? "italic" : ""}>{label}</span>
                                                        {visibleColumns.includes(key) && <Check size={14} className="text-blue-600" />}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            {visibleColumns.length > 0 ? visibleColumns.map(colName => (
                                <th key={colName} className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                    {getLabel(colName)}
                                </th>
                            )) : (
                                <th className="px-4 py-3 text-gray-400 italic font-normal">Nenhuma coluna selecionada. Ative o modo edição para configurar.</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {visibleColumns.map(c => (
                                        <td key={c} className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                        </td>
                                    ))}
                                    {visibleColumns.length === 0 && (
                                        <td className="px-4 py-3">
                                             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length || 1} className="px-4 py-10 text-center text-gray-400">
                                    Nenhum registro encontrado.
                                </td>
                            </tr>
                        ) : (
                            data.map((row, idx) => (
                                <tr 
                                    key={row.id || idx} 
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 ${listAction ? 'cursor-pointer' : ''}`}
                                    onClick={() => listAction && executeAction(listAction, row)}
                                >
                                    {visibleColumns.map(colName => {
                                        const field = fields.find(f => f.name === colName);
                                        const value = row[colName];
                                        // Check if virtual and text/longtext
                                        const isVirtualInfo = field?.is_virtual && (field?.type === 'text' || field?.field_type === 'text');

                                        return (
                                            <td key={colName} className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                {isVirtualInfo ? (
                                                     <VirtualInfoButton value={value} label={field?.label || colName} />
                                                ) : (
                                                    String(value !== undefined && value !== null ? value : '-')
                                                )}
                                            </td>
                                        );
                                    })}
                                    {visibleColumns.length === 0 && (
                                        <td className="px-4 py-3 text-gray-400 italic">
                                            Selecione colunas para visualizar dados.
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* UX Hint: Missing Action */}
            {isEditMode && !listAction && (
                <div className="bg-yellow-50 border-t border-yellow-100 p-2 text-xs text-yellow-700 flex justify-center">
                    <span>
                        ⚠️ <b>Configuração Necessária:</b> O clique na linha está desativado. 
                        Crie uma Ação do tipo <b>LIST_CLICK</b> para navegar para a Ficha 360 desta entidade.
                    </span>
                </div>
            )}

            {/* Create Modal */}
            <GenericFormModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                entitySlug={entitySlug}
                fields={fields}
                onSuccess={() => {
                    fetchData();
                    // Optional: maybe auto add columns if empty? No, keep user preference.
                }}
            />
        </div>
    );
};

export default GenericListPage;
