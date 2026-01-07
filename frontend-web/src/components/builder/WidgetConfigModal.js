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
        // Need to find ID from slug or have endpoint. 
        // /api/builder/entities returns list with ID and slug.
        // We can find ID from entities list if loaded, or fetch by slug if endpoint exists.
        // Let's assume we have entities list.
        // Actually, simpler: fetch entities, find one matching slug, then fetch fields.
        // But 'entities' state might not be ready.
        // Let's rely on user selecting entity to fetch fields.
    };

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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 z-50">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Configurar Widget</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Título</label>
                        <input className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tabela de Dados</label>
                        <select 
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                            value={entitySlug}
                            onChange={e => handleEntityChange(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {entities.map(e => <option key={e.id} value={e.slug}>{e.display_name}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Métrica</label>
                            <select className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" value={metric} onChange={e => setMetric(e.target.value)}>
                                <option value="count">Contagem (Count)</option>
                                <option value="sum">Soma (Sum)</option>
                                <option value="avg">Média (Avg)</option>
                            </select>
                        </div>
                    </div>

                    {metric !== 'count' && (
                         <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Campo Alvo (Para Soma/Média)</label>
                            <select className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" value={targetField} onChange={e => setTargetField(e.target.value)}>
                                <option value="">Selecione...</option>
                                {fields.filter(f => ['number','currency'].includes(f.type)).map(f => (
                                    <option key={f.name} value={f.name}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {widget?.type === 'CHART' && (
                         <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Agrupar Por (Eixo X)</label>
                            <select className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
                                <option value="">Selecione...</option>
                                {fields.map(f => (
                                    <option key={f.name} value={f.name}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                </div>
            </div>
        </div>
    );
};

export default WidgetConfigModal;
