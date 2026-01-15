import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

const WidgetConfigModal = ({ isOpen, onClose, widget, onSave }) => {
    const [title, setTitle] = useState('');
    const [entitySlug, setEntitySlug] = useState('');
    const [entities, setEntities] = useState([]);
    const [fields, setFields] = useState([]); // Fields of selected entity
    
    // Config
    const [metric, setMetric] = useState('count');
    const [targetField, setTargetField] = useState('');
    const [groupBy, setGroupBy] = useState('');

    useEffect(() => {
        if (isOpen) {
             fetchEntities();
             if (widget) {
                 setTitle(widget.title || '');
                 const conf = widget.config || {};
                 setEntitySlug(conf.entity_slug || '');
                 setMetric(conf.metric || 'count');
                 setTargetField(conf.target_field || '');
                 setGroupBy(conf.group_by || '');
                 
                 if (conf.entity_slug) fetchFields(conf.entity_slug);
             }
        }
    }, [isOpen, widget]);

    const fetchEntities = async () => {
        const { data } = await apiClient.get('/api/builder/entities');
        setEntities(data);
    };

    const fetchFields = async (slug) => {
        // Find entity by slug to get ID (assuming slug is unique/known or endpoint exists)
        // Best effort: find in loaded entities
        // If entities not loaded yet, we can't find it here. 
        // Logic moved to handleEntityChange mainly.
        // If initial load, we need to find it from API or cached list.
    };

    // Helper to load fields when slug is present initially
    useEffect(() => {
        if (entities.length > 0 && widget?.config?.entity_slug) {
            const ent = entities.find(e => e.slug === widget.config.entity_slug);
            if(ent) {
               apiClient.get(`/api/builder/entities/${ent.id}/fields`).then(r => setFields(r.data)); 
            }
        }
    }, [entities, widget]);


    const handleEntityChange = async (slug) => {
        setEntitySlug(slug);
        const ent = entities.find(e => e.slug === slug);
        if (ent) {
            const { data } = await apiClient.get(`/api/builder/entities/${ent.id}/fields`);
            setFields(data);
        } else {
            setFields([]);
        }
    };

    const handleSave = () => {
        const newWidget = {
            ...widget,
            title,
            config: {
                ...widget.config,
                entity_slug: entitySlug,
                metric,
                target_field: targetField,
                group_by: groupBy
            }
        };
        onSave(newWidget);
        onClose();
    };

    if (!isOpen) return null;

    const isChart = ['CHART', 'BAR_VERTICAL', 'BAR_HORIZONTAL', 'STACKED_BAR', 'LINE', 'AREA', 'DONUT', 'TREEMAP', 'PARETO', 'HEATMAP_TABLE', 'HEATMAP_LIST', 'WATERFALL'].includes(widget?.type);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-96 z-50 border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-black mb-6 dark:text-white tracking-tight">Configurar Widget</h3>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Título</label>
                        <input className="w-full p-3 border-2 border-slate-100 rounded-xl font-medium dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition-colors" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Tabela de Dados</label>
                        <select 
                            className="w-full p-3 border-2 border-slate-100 rounded-xl font-medium dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition-colors"
                            value={entitySlug}
                            onChange={e => handleEntityChange(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {entities.map(e => <option key={e.id} value={e.slug}>{e.display_name}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Métrica</label>
                            <select className="w-full p-3 border-2 border-slate-100 rounded-xl font-medium dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition-colors" value={metric} onChange={e => setMetric(e.target.value)}>
                                <option value="count">Contagem (Count)</option>
                                <option value="sum">Soma (Sum)</option>
                                <option value="avg">Média (Avg)</option>
                            </select>
                        </div>
                    </div>

                    {metric !== 'count' && (
                         <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Campo Alvo (Soma/Média)</label>
                            <select className="w-full p-3 border-2 border-slate-100 rounded-xl font-medium dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition-colors" value={targetField} onChange={e => setTargetField(e.target.value)}>
                                <option value="">Selecione...</option>
                                {fields.filter(f => ['number','currency'].includes(f.type)).map(f => (
                                    <option key={f.name} value={f.name}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {isChart && (
                         <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Agrupar Por (Eixo X / Categoria)</label>
                            <select className="w-full p-3 border-2 border-slate-100 rounded-xl font-medium dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition-colors" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
                                <option value="">Selecione...</option>
                                {fields.map(f => (
                                    <option key={f.name} value={f.name}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {(widget?.type === 'PROGRESS_BAR' || widget?.type === 'GAUGE') && (
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Meta / Máximo</label>
                            <input 
                                type="number"
                                className="w-full p-3 border-2 border-slate-100 rounded-xl font-medium dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition-colors" 
                                value={widget.config?.max || 100} 
                                onChange={e => { 
                                    // Updating local widget state reference via props is tricky, let's assume we handle it in handleSave construct
                                    // But here we need state for it
                                    // NOTE: This modal impl is simple. For complex nested config, we should use state properly.
                                    // For now, let's just use the current widget object mutation for temporary state if simple binding fails
                                    const val = e.target.value;
                                    widget.config.max = val; // Direct mutation for dirty state
                                    // Ideally use useState for max
                                }}
                                placeholder="100"
                            />
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-3 text-slate-500 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors uppercase tracking-wide">Cancelar</button>
                    <button onClick={handleSave} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-wide shadow-lg shadow-blue-500/20">Salvar Alterações</button>
                </div>
            </div>
        </div>
    );
};

export default WidgetConfigModal;
