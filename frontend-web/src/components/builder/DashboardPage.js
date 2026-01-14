import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useBuilder } from '../../context/BuilderContext';
import apiClient from '../../api/apiClient';
import { 
    Plus, BarChart2, Hash, Settings, Trash, Save, PieChart, Activity, 
    LayoutTemplate, Gauge, MoreHorizontal, Table, List
} from 'lucide-react';
import WidgetConfigModal from './WidgetConfigModal';
import WidgetRenderer from '../dashboard/widgets/WidgetRenderer';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardPage = ({ pageId, layoutConfig, entitySlug }) => {
    const { isEditMode } = useBuilder();
    const [layouts, setLayouts] = useState({ lg: [] });
    const [widgets, setWidgets] = useState([]);
    const [saving, setSaving] = useState(false);
    
    // Config Modal
    const [editingWidget, setEditingWidget] = useState(null);

    useEffect(() => {
        if (layoutConfig?.widgets) {
            setWidgets(layoutConfig.widgets);
            // Construct layout from widgets
            const lgLayout = layoutConfig.widgets.map(w => ({
                i: w.i, x: w.x, y: w.y, w: w.w, h: w.h, minW: 2, minH: 2
            }));
            setLayouts({ lg: lgLayout });
        } else {
            setWidgets([]);
            setLayouts({ lg: [] });
        }
    }, [layoutConfig]);

    const handleLayoutChange = (currentLayout, allLayouts) => {
        const newWidgets = widgets.map(w => {
            const layoutItem = currentLayout.find(l => l.i === w.i);
            if (layoutItem) {
                return { ...w, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h };
            }
            return w;
        });
        setWidgets(newWidgets);
    };

    const saveDashboard = async () => {
        setSaving(true);
        try {
            const newConfig = {
                ...layoutConfig,
                widgets: widgets
            };
            await apiClient.put(`/api/builder/navigation/pages/${pageId}`, {
                layout_config: newConfig
            });
            // Toast would be good here
        } catch (error) {
            console.error("Erro ao salvar dashboard", error);
            alert("Erro ao salvar");
        } finally {
            setSaving(false);
        }
    };

    const addWidget = (type, title = 'Novo Widget', w=4, h=4) => {
        const id = `w_${Date.now()}`;
        const newWidget = {
            i: id, x: 0, y: Infinity, w: w, h: h, 
            type: type, 
            title: title,
            config: {} 
        };
        setWidgets([...widgets, newWidget]);
    };
    
    const removeWidget = (id) => {
        if(!window.confirm("Remover widget?")) return;
        setWidgets(widgets.filter(w => w.i !== id));
    };
    
    const handleSaveWidgetConfig = (updatedWidget) => {
        setWidgets(widgets.map(w => w.i === updatedWidget.i ? updatedWidget : w));
        setEditingWidget(null);
    };

    const WidgetButton = ({ type, icon, label, w=4, h=4 }) => (
        <button 
            onClick={() => addWidget(type, label, w, h)} 
            className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-600"
        >
            {icon} {label}
        </button>
    );

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Toolbar */}
            {isEditMode && (
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex flex-col gap-2 shadow-sm z-10">
                   <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Widgets Disponíveis</span>
                        <button 
                            onClick={saveDashboard} 
                            disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 shadow-lg shadow-blue-500/20 transition-all uppercase tracking-wide"
                        >
                            <Save size={14} /> {saving ? 'Salvando...' : 'Salvar Layout'}
                        </button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                        {/* KPIs */}
                        <WidgetButton type="SCORECARD" icon={<Hash size={14} />} label="Scorecard" w={2} h={2} />
                        <WidgetButton type="GAUGE" icon={<Gauge size={14} />} label="Velocímetro" w={3} h={3} />
                        <WidgetButton type="PROGRESS_BAR" icon={<Activity size={14} />} label="Barra Progresso" w={3} h={2} />
                        
                        {/* Charts */}
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                        <WidgetButton type="BAR_VERTICAL" icon={<BarChart2 size={14} />} label="Barras Vert." />
                        <WidgetButton type="BAR_HORIZONTAL" icon={<BarChart2 size={14} className="rotate-90"/>} label="Barras Horiz." />
                        <WidgetButton type="LINE" icon={<Activity size={14} />} label="Linha" />
                        <WidgetButton type="AREA" icon={<Activity size={14} />} label="Área" />
                        <WidgetButton type="DONUT" icon={<PieChart size={14} />} label="Rosca" />
                        <WidgetButton type="TREEMAP" icon={<LayoutTemplate size={14} />} label="Treemap" />
                        <WidgetButton type="STACKED_BAR" icon={<BarChart2 size={14} />} label="Empilhado" />
                        <WidgetButton type="PARETO" icon={<BarChart2 size={14} />} label="Pareto" />
                        <WidgetButton type="WATERFALL" icon={<BarChart2 size={14} />} label="Waterfall" />
                        
                        {/* Lists/Tables */}
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                        <WidgetButton type="HEATMAP_TABLE" icon={<Table size={14} />} label="Tabela Heatmap" w={6} h={5} />
                        <WidgetButton type="HEATMAP_LIST" icon={<List size={14} />} label="Lista Heatmap" w={4} h={5} />
                   </div>
                </div>
            )}

            {/* Grid */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-900/50">
                <ResponsiveGridLayout
                    className="layout"
                    layouts={layouts}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={40} // Increased slightly
                    isDraggable={isEditMode}
                    isResizable={isEditMode}
                    onLayoutChange={(layout, allLayouts) => handleLayoutChange(layout, allLayouts)}
                    draggableHandle=".drag-handle"
                    margin={[16, 16]}
                >
                    {widgets.map(w => (
                        <div key={w.i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                            {/* Widget Header */}
                            <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-gray-800 drag-handle cursor-move">
                                <span className="font-bold text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-widest truncate">{w.title}</span>
                                {isEditMode && (
                                    <div className="flex gap-1 shrink-0">
                                        <button 
                                            onMouseDown={e => e.stopPropagation()}
                                            onClick={() => setEditingWidget(w)} 
                                            className="text-slate-300 hover:text-blue-500 p-1 rounded-md hover:bg-blue-50 transition-colors"
                                        >
                                            <Settings size={14} />
                                        </button>
                                        <button 
                                            onMouseDown={e => e.stopPropagation()}
                                            onClick={() => removeWidget(w.i)} 
                                            className="text-slate-300 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {/* Widget Content */}
                            <div className="flex-1 overflow-hidden relative p-1">
                                <WidgetRenderer widget={w} />
                            </div>
                        </div>
                    ))}
                </ResponsiveGridLayout>
                {widgets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-fade-in">
                        <LayoutTemplate size={48} className="mb-4 opacity-20"/>
                        <p className="font-bold">Dashboard vazio.</p>
                        {isEditMode && <p className="text-sm">Adicione widgets usando a barra superior.</p>}
                    </div>
                )}
            </div>

            <WidgetConfigModal
                isOpen={!!editingWidget}
                onClose={() => setEditingWidget(null)}
                widget={editingWidget}
                onSave={handleSaveWidgetConfig}
            />
        </div>
    );
};

export default DashboardPage;
