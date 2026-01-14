import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { useBuilder } from '../../context/BuilderContext';
import { PenTool, Check, X } from 'lucide-react';
import DashboardPage from '../../components/builder/DashboardPage';

const MainDashboardWrapper = () => {
    const { isEditMode } = useBuilder();
    const [selectedDashboardId, setSelectedDashboardId] = useState(localStorage.getItem('default_dashboard_id'));
    const [pageConfig, setPageConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Selection Mode
    const [isSelecting, setIsSelecting] = useState(false);
    const [availableDashboards, setAvailableDashboards] = useState([]);

    useEffect(() => {
        if (selectedDashboardId) {
            loadDashboard(selectedDashboardId);
        }
    }, [selectedDashboardId]);

    const loadDashboard = async (id) => {
        setLoading(true);
        try {
            // Need to find the page config.
            // Ideally we have an endpoint like /api/builder/navigation/pages/{id}
            // But we often load full nav.
            // Let's use the full nav fetch for now as it's cached/fast enough or consistent.
            const { data } = await apiClient.get('/api/builder/navigation');
            let found = null;
            data.forEach(g => {
                const p = g.pages.find(x => x.id === id);
                if (p) found = p;
            });

            if (found) {
                 // Fetch entity name if needed (like DynamicPageLoader)
                 if (found.entity_id) {
                     try {
                         const { data: entData } = await apiClient.get('/api/builder/entities');
                         const ent = entData.find(e => e.id === found.entity_id);
                         if (ent) found.entitySlug = ent.slug;
                     } catch(e) {}
                 }
                 setPageConfig(found);
            } else {
                setPageConfig(null);
            }
        } catch (e) {
            console.error("Error loading dashboard", e);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSelection = async () => {
        // Load all available dashboard pages
        try {
            const { data } = await apiClient.get('/api/builder/navigation');
            const dashes = [];
            data.forEach(g => {
                g.pages.forEach(p => {
                    if (p.type === 'dashboard') {
                        dashes.push(p);
                    }
                });
            });
            setAvailableDashboards(dashes);
            setIsSelecting(true);
        } catch (e) {
            alert("Erro ao carregar dashboards");
        }
    };

    const handleSelect = (id) => {
        setSelectedDashboardId(id);
        localStorage.setItem('default_dashboard_id', id);
        setIsSelecting(false);
    };

    return (
        <div className="h-full flex flex-col relative">
            {/* Header / Toolbar for Selection */}
            {isEditMode && (
                <div className="absolute top-2 right-2 z-50 flex gap-2">
                    {!isSelecting ? (
                        <button 
                            onClick={handleStartSelection}
                            className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:text-blue-600 text-gray-500 transition-all"
                            title="Selecionar Dashboard Principal"
                        >
                            <PenTool size={16} />
                        </button>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col gap-2 min-w-[200px]">
                            <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-400 mb-1">
                                <span>Selecionar Dash</span>
                                <button onClick={() => setIsSelecting(false)}><X size={14} /></button>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {availableDashboards.map(d => (
                                    <button 
                                        key={d.id} 
                                        onClick={() => handleSelect(d.id)}
                                        className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedDashboardId === d.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 dark:text-gray-300'}`}
                                    >
                                        {d.name}
                                    </button>
                                ))}
                                {availableDashboards.length === 0 && <span className="text-xs italic text-gray-400">Nenhum dashboard encontrado.</span>}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            {loading && <div className="p-10 text-center text-gray-400">Carregando Dashboard...</div>}
            
            {!loading && pageConfig && (
                 <DashboardPage 
                    pageId={pageConfig.id}
                    layoutConfig={pageConfig.layout_config}
                    entitySlug={pageConfig.entitySlug}
                />
            )}

            {!loading && !pageConfig && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p className="text-lg font-medium mb-2">Dashboard Principal</p>
                    <p className="text-sm">Nenhum layout selecionado.</p>
                    {isEditMode && (
                        <button onClick={handleStartSelection} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                            Selecionar Layout
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MainDashboardWrapper;
