import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Database, Menu, X, Layout, List } from 'lucide-react';

import TableSidebar from '../../components/builder/TableSidebar';
import FieldsGrid from '../../components/builder/FieldsGrid';
import FieldModal from '../../components/builder/FieldModal';
import TabConfigurator from '../../components/builder/TabConfigurator';

const DatabaseEditor = () => {
    const [entities, setEntities] = useState([]);
    const [selectedEntity, setSelectedEntity] = useState(null);
    const [fields, setFields] = useState([]);
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // View Mode: 'fields' | 'layout'
    const [viewMode, setViewMode] = useState('fields'); 
    const [isTabConfigOpen, setIsTabConfigOpen] = useState(false);

    const [selectedFieldToEdit, setSelectedFieldToEdit] = useState(null);

    useEffect(() => {
        fetchEntities();
    }, []);

    useEffect(() => {
        if (selectedEntity) {
            fetchFields(selectedEntity.id);
            setIsSidebarOpen(false); // Auto-close on selection (mobile convenience)
            // Reset view to fields when changing entity? Or keep preference? Keep preference desirable.
        } else {
            setFields([]);
        }
    }, [selectedEntity]);

    const fetchEntities = async (selectId = null) => {
        try {
            const { data } = await apiClient.get('/api/builder/entities');
            if (Array.isArray(data)) {
                setEntities(data);
                if (selectId) {
                   const found = data.find(e => e.id === selectId);
                   if (found) setSelectedEntity(found);
                }
            } else {
                console.warn("API returned invalid entities data:", data);
                setEntities([]);
            }
        } catch (error) {
            console.error("Erro ao buscar tabelas:", error);
            setEntities([]);
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
    
    const handleDeleteField = async (field) => {
        if (!window.confirm("Tem certeza que deseja excluir este campo? Todos os dados dele serão perdidos.")) return;
        try {
            await apiClient.delete(`/api/builder/entities/${selectedEntity.id}/fields/${field.id}`);
            fetchFields(selectedEntity.id);
        } catch (error) {
            alert("Erro ao excluir campo: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleSaveLayout = async (tabs) => {
        if (!selectedEntity) return;
        try {
            const currentConfig = selectedEntity.layout_config || {};
            const newConfig = { ...currentConfig, tabs: tabs };
            
            await apiClient.patch(`/api/builder/entities/${selectedEntity.id}`, {
                layout_config: newConfig
            });
            
            // Refresh entity locally
            const updatedEntity = { ...selectedEntity, layout_config: newConfig };
            setSelectedEntity(updatedEntity);
            
            // Update in list
            setEntities(prev => prev.map(e => e.id === selectedEntity.id ? updatedEntity : e));
            
        } catch (error) {
            alert("Erro ao salvar layout: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div className="flex h-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 relative">
            
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <TableSidebar
                entities={entities}
                selectedEntity={selectedEntity}
                onSelectEntity={setSelectedEntity}
                onEntityCreated={() => fetchEntities()}
                className={`
                    absolute md:static top-0 left-0 h-full z-50 
                    transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0 md:shadow-none'}
                `}
            />

            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full overflow-hidden w-full">
                {selectedEntity ? (
                    <>
                        {/* Header */}
                        <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 md:px-6 justify-between bg-white dark:bg-gray-900 flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <button 
                                    className="md:hidden p-1 mr-1 text-gray-500 hover:bg-gray-100 rounded"
                                    onClick={() => setIsSidebarOpen(true)}
                                >
                                    <Menu size={20} />
                                </button>
                                
                                <div className="flex items-center gap-2">
                                    <Database size={20} className="text-blue-500" />
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800 dark:text-white truncate max-w-[150px] md:max-w-none leading-none">
                                            {selectedEntity.display_name}
                                        </h2>
                                        <span className="text-[10px] font-mono text-gray-400">
                                            {selectedEntity.slug}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* View Switcher */}
                            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('fields')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                                        viewMode === 'fields' 
                                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                    }`}
                                >
                                    <List size={16} />
                                    <span className="hidden sm:inline">Campos</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('layout')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                                        viewMode === 'layout' 
                                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                    }`}
                                >
                                    <Layout size={16} />
                                    <span className="hidden sm:inline">Visualização 360º</span>
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        {viewMode === 'fields' ? (
                            <FieldsGrid
                                fields={fields}
                                onAddField={() => {
                                    setSelectedFieldToEdit(null);
                                    setIsFieldModalOpen(true);
                                }}
                                onEditField={(field) => {
                                    setSelectedFieldToEdit(field);
                                    setIsFieldModalOpen(true);
                                }}
                                onDeleteField={handleDeleteField}
                            />
                        ) : (
                            <div className="flex-1 overflow-auto p-8">
                                <div className="max-w-4xl mx-auto space-y-8">
                                    {/* Tabs Section */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Abas Relacionadas</h3>
                                                <p className="text-sm text-gray-500">Configure quais listas de dados aparecem quando este registro é visualizado.</p>
                                            </div>
                                            <button 
                                                onClick={() => setIsTabConfigOpen(true)}
                                                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-sm border border-blue-100 dark:border-blue-900/50"
                                            >
                                                Configurar Abas
                                            </button>
                                        </div>

                                        {/* Preview of Tabs */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {(selectedEntity.layout_config?.tabs || []).map((tab, idx) => (
                                                <div key={idx} className={`p-4 rounded-lg border ${tab.is_active ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50' : 'border-gray-100 dark:border-gray-800 opacity-60'}`}>
                                                    <div className="font-bold text-gray-800 dark:text-gray-200">{tab.label}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Tabela: <span className="font-mono">{tab.target_entity}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!selectedEntity.layout_config?.tabs || selectedEntity.layout_config.tabs.length === 0) && (
                                                <div className="col-span-full py-8 text-center text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg">
                                                    Nenhuma aba configurada.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Widgets Section (Placeholder) */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 opacity-80">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Widgets de Dashboard</h3>
                                        <p className="text-sm text-gray-500 mb-6">Arraste widgets para compor o painel lateral deste registro.</p>
                                        
                                        <div className="p-8 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center">
                                            <Layout size={32} className="mx-auto text-gray-400 mb-2" />
                                            <span className="text-gray-500 font-medium">Editor de Widgets em breve...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <button 
                            className="md:hidden absolute top-4 left-4 p-2 bg-gray-100 rounded"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} className="text-gray-600" />
                        </button>
                        <Database size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">Selecione ou crie uma tabela</p>
                    </div>
                )}
            </div>

            <FieldModal
                isOpen={isFieldModalOpen}
                onClose={() => {
                    setIsFieldModalOpen(false);
                    setSelectedFieldToEdit(null);
                }}
                entity={selectedEntity}
                onFieldCreated={() => fetchFields(selectedEntity?.id)}
                initialData={selectedFieldToEdit}
            />
            
            <TabConfigurator 
                isOpen={isTabConfigOpen}
                onClose={() => setIsTabConfigOpen(false)}
                currentTabs={selectedEntity?.layout_config?.tabs || []}
                onSave={handleSaveLayout}
            />
        </div>
    );
};

export default DatabaseEditor;
