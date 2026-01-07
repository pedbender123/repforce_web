import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Loader2, Save } from 'lucide-react';

const GenericForm = ({ entityId, layoutConfig, recordId, onSuccess }) => {
    const [fields, setFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // For Ref Fields
    const [entities, setEntities] = useState([]);
    const [refOptions, setRefOptions] = useState({}); // { fieldName: [records] }

    useEffect(() => {
        if (entityId) {
            loadFormSetup();
        }
    }, [entityId, recordId]); // Reload if recordId changes

    const loadFormSetup = async () => {
        setLoading(true);
        try {
            // 1. Fetch Fields
            const { data: fieldsData } = await apiClient.get(`/api/builder/entities/${entityId}/fields`);
            setFields(fieldsData);

            // 2. Fetch Entities (to resolve Refs)
            const { data: allEntities } = await apiClient.get('/api/builder/entities');
            setEntities(allEntities);

            // 3. Resolve Ref Options
            const refFields = fieldsData.filter(f => f.field_type === 'ref');
            const newRefOptions = {};

            for (const field of refFields) {
                const targetEntityId = field.options?.ref_entity_id;
                if (targetEntityId) {
                    const targetEntity = allEntities.find(e => e.id === targetEntityId);
                    if (targetEntity) {
                        try {
                            const { data: records } = await apiClient.get(`/api/engine/object/${targetEntity.slug}`);
                            newRefOptions[field.name] = records;
                        } catch (e) {
                            console.error(`Failed to load ref options for ${field.name}`, e);
                        }
                    }
                }
            }
            setRefOptions(newRefOptions);

            // Initialize Form Data
            const initial = {};
            fieldsData.forEach(f => {
                if (f.field_type === 'boolean') initial[f.name] = false;
                else initial[f.name] = '';
            });
            setFormData(initial);

            // 4. If Edit Mode (recordId), fetch data
            if (recordId) {
                // We need entity slug from somewhere. 
                // We have it in `currentEntity` in handle submit, but here we need it.
                // We fetched allEntities above.
                const currentEntity = allEntities.find(e => e.id === entityId);
                if (currentEntity) {
                    try {
                        const { data: recordData } = await apiClient.get(`/api/engine/object/${currentEntity.slug}`);
                        // The endpoint returns a LIST. We need to filter or get single.
                        // Actually, our engine might list all.
                        // Ideally GET /object/{slug}/{id} should exist.
                        // Let's assume we need to filter if list returned, or implement get single.
                        // Standard REST usually has GET /resource/:id.
                        // Let's try GET /api/engine/object/{slug}?id={recordId} or similar.
                        // Checking `data.py`... list_records supports filtering by ID via query param!
                         const { data: searchResult } = await apiClient.get(`/api/engine/object/${currentEntity.slug}?id=${recordId}`);
                         if (searchResult && searchResult.length > 0) {
                             setFormData(searchResult[0]);
                         }
                    } catch (e) {
                         console.error("Failed to load record", e);
                    }
                }
            }

        } catch (error) {
            console.error("Setup failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e, field) => {
        const val = field.field_type === 'boolean' ? e.target.checked : e.target.value;
        setFormData(prev => ({ ...prev, [field.name]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        // Find current entity slug
        const currentEntity = entities.find(e => e.id === entityId);
        if (!currentEntity) return;

        try {
            if (recordId) {
                 // Update
                 await apiClient.put(`/api/engine/object/${currentEntity.slug}/${recordId}`, formData);
                 alert("Registro atualizado!");
            } else {
                 // Create
                 await apiClient.post(`/api/engine/object/${currentEntity.slug}`, formData);
                 alert("Registro criado!");
                 setFormData({}); 
            }
            
            if (onSuccess) onSuccess();

        } catch (error) {
            alert("Erro ao salvar: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">
                {recordId ? 'Editar Registro' : 'Novo Registro'}
            </h2>
            
            <div className="space-y-4">
                {fields.map(field => (
                    <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {field.label} {field.is_required && <span className="text-red-500">*</span>}
                        </label>
                        
                        {/* Text / Number / Date */}
                        {['text', 'long_text', 'number', 'currency', 'date', 'email', 'whatsapp'].includes(field.field_type) && (
                            <input 
                                type={field.field_type === 'number' || field.field_type === 'currency' ? 'number' : (field.field_type === 'date' ? 'date' : 'text')}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData[field.name] || ''}
                                onChange={e => handleChange(e, field)}
                                required={field.is_required}
                            />
                         )}

                         {/* Boolean */}
                         {field.field_type === 'boolean' && (
                             <input 
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={!!formData[field.name]}
                                onChange={e => handleChange(e, field)}
                             />
                         )}

                         {/* Select (Static) */}
                         {field.field_type === 'select' && (
                             <select
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={formData[field.name] || ''}
                                onChange={e => handleChange(e, field)}
                                required={field.is_required}
                             >
                                 <option value="">Selecione...</option>
                                 {(Array.isArray(field.options) ? field.options : []).map((opt, idx) => (
                                     <option key={idx} value={opt}>{opt}</option>
                                 ))}
                             </select>
                         )}

                         {/* Ref (Dynamic) */}
                         {field.field_type === 'ref' && (
                             <select
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={formData[field.name] || ''}
                                onChange={e => handleChange(e, field)}
                                required={field.is_required}
                             >
                                 <option value="">Selecione...</option>
                                 {(refOptions[field.name] || []).map(rec => (
                                     <option key={rec.id} value={rec.id}>
                                         {rec.nome || rec.name || rec.title || rec.id}
                                     </option>
                                 ))}
                             </select>
                         )}
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button 
                    type="submit" 
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Salvar Registro
                </button>
            </div>
        </form>
    );
};

export default GenericForm;
