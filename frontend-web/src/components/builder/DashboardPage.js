import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useBuilder } from '../../context/BuilderContext';
import apiClient from '../../api/apiClient';
import { Plus, BarChart2, Hash, Settings, Trash, Save, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import WidgetConfigModal from './WidgetConfigModal';

const ResponsiveGridLayout = WidthProvider(Responsive);

// --- Widget Component ---
const DashboardWidget = ({ widget }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (widget.config && widget.config.entity_slug) {
            fetchData();
        }
    }, [widget.config]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const payload = {
                metric: widget.config.metric,
                field: widget.config.target_field,
                group_by: widget.config.group_by
            };
            const { data: res } = await apiClient.post(`/api/engine/analytics/aggregate/${widget.config.entity_slug}`, payload);
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!widget.config?.entity_slug) return <div className="h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">Sem configuração. Clique em <Settings size={12} className="inline"/> para configurar.</div>;
    if (loading) return <div className="h-full flex items-center justify-center text-gray-400 text-xs">Carregando...</div>;
    if (!data) return <div className="h-full flex items-center justify-center text-gray-400 text-xs">Sem dados</div>;

    if (widget.type === 'KPI') {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <span className="text-4xl font-bold text-blue-600">{data.value || 0}</span>
                <span className="text-xs text-gray-500 uppercase">{widget.config.metric}</span>
            </div>
        );
    }

    if (widget.type === 'CHART') {
        const charData = (data.labels || []).map((l, i) => ({
            name: l,
            val: data.values[i]
        }));
        
        return (
            <div className="h-full w-full p-2 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1f2937', color: '#fff', border: 'none' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="val" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    }
    
    return null;
};

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
        // We only care about saving when user explicitly saves or auto-save?
        // Let's update local widget state to reflect new positions
        // This is tricky because 'widgets' has config, layout has positions.
        // We map positions back to widgets.
        
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
            // alert("Dashboard salvo!");
        } catch (error) {
            console.error("Erro ao salvar dashboard", error);
        } finally {
            setSaving(false);
        }
    };

    const addWidget = (type) => {
        const id = `w_${Date.now()}`;
        const newWidget = {
            i: id, x: 0, y: Infinity, w: 4, h: 4, 
            type: type, 
            title: 'Novo Widget',
            config: {} 
        };
        setWidgets([...widgets, newWidget]);
        // Layout auto-updates via state, but we might need to refresh 'layouts' state
    };
    
    const removeWidget = (id) => {
        if(!window.confirm("Remover widget?")) return;
        setWidgets(widgets.filter(w => w.i !== id));
    };
    
    const handleSaveWidgetConfig = (updatedWidget) => {
        setWidgets(widgets.map(w => w.i === updatedWidget.i ? updatedWidget : w));
        setEditingWidget(null);
    };



    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Toolbar */}
            {isEditMode && (
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex justify-between items-center shadow-sm z-10">
                    <div className="flex gap-2">
                        <button onClick={() => addWidget('KPI')} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded text-sm text-gray-700 dark:text-gray-200">
                            <Hash size={14} /> KPI
                        </button>
                        <button onClick={() => addWidget('CHART')} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded text-sm text-gray-700 dark:text-gray-200">
                            <BarChart2 size={14} /> Gráfico
                        </button>
                    </div>
                    <button 
                        onClick={saveDashboard} 
                        disabled={saving}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm disabled:opacity-50 shadow-sm"
                    >
                        <Save size={14} /> {saving ? 'Salvando...' : 'Salvar Layout'}
                    </button>
                </div>
            )}

            {/* Grid */}
            <div className="flex-1 overflow-auto p-4">
                <ResponsiveGridLayout
                    className="layout"
                    layouts={layouts}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={30}
                    isDraggable={isEditMode}
                    isResizable={isEditMode}
                    onLayoutChange={(layout, allLayouts) => handleLayoutChange(layout, allLayouts)}
                    draggableHandle=".drag-handle"
                >
                    {widgets.map(w => (
                        <div key={w.i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                            {/* Widget Header */}
                            <div className="flex justify-between items-center p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 drag-handle cursor-move">
                                <span className="font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wide truncate">{w.title}</span>
                                {isEditMode && (
                                    <div className="flex gap-1 shrink-0">
                                        <button 
                                            // onMouseDown to prevent drag start
                                            onMouseDown={e => e.stopPropagation()}
                                            onClick={() => setEditingWidget(w)} 
                                            className="text-gray-400 hover:text-blue-500 p-0.5"
                                        >
                                            <Settings size={12} />
                                        </button>
                                        <button 
                                            onMouseDown={e => e.stopPropagation()}
                                            onClick={() => removeWidget(w.i)} 
                                            className="text-gray-400 hover:text-red-500 p-0.5"
                                        >
                                            <Trash size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {/* Widget Content */}
                            <div className="flex-1 overflow-hidden relative">
                                <DashboardWidget widget={w} />
                            </div>
                        </div>
                    ))}
                </ResponsiveGridLayout>
                {widgets.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <p>Dashboard vazio.</p>
                        {isEditMode && <p>Adicione widgets usando a barra superior.</p>}
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
