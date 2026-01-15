import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Loader2, Save } from 'lucide-react';
import DynamicFieldRenderer from '../DynamicFieldRenderer';

const GenericForm = ({ entityId, layoutConfig, recordId, onSuccess }) => {
    const [searchParams] = useSearchParams();
    const draftId = searchParams.get('draft_id');
    
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
            const refFields = fieldsData.filter(f => f.field_type === 'ref' || f.field_type === 'list_ref');
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
                else if (f.field_type === 'list_ref') initial[f.name] = []; // Initialize list_ref as empty array
                else initial[f.name] = '';
            });
            setFormData(initial);

            // 4. If Edit Mode (recordId), fetch data
            if (recordId) {
                const currentEntity = allEntities.find(e => e.id === entityId);
                if (currentEntity) {
                    try {
                        // Attempt to fetch record. Assuming filter by ID works as seen before or standard Get
                         const { data: searchResult } = await apiClient.get(`/api/engine/object/${currentEntity.slug}?id=${recordId}`);
                         if (searchResult && searchResult.length > 0) {
                             setFormData({ ...initial, ...searchResult[0] });
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

    // Draft Recovery: Load from localStorage if draft_id exists
    useEffect(() => {
        if (draftId && !recordId && fields.length > 0) {
            const draftKey = `draft_${draftId}`;
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                try {
                    const parsedDraft = JSON.parse(savedDraft);
                    setFormData(prev => ({ ...prev, ...parsedDraft }));
                    console.log('Draft recovered:', draftKey);
                } catch (e) {
                    console.error('Failed to parse draft', e);
                }
            }
        }
    }, [draftId, recordId, fields]);

    // Auto-save to localStorage (debounced)
    useEffect(() => {
        if (!draftId || recordId) return; // Only for drafts, not edits
        
        const timer = setTimeout(() => {
            const draftKey = `draft_${draftId}`;
            localStorage.setItem(draftKey, JSON.stringify(formData));
            console.log('Draft auto-saved:', draftKey);
        }, 3000); // 3 second debounce
        
        return () => clearTimeout(timer);
    }, [formData, draftId, recordId]);

    const handleFieldChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
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
            
            // Clear draft from localStorage if it was a draft creation
            if (draftId && !recordId) {
                const draftKey = `draft_${draftId}`;
                localStorage.removeItem(draftKey);
                console.log('Draft cleared:', draftKey);
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
                {fields.map(field => {
                    const fieldConfig = {
                        ...field,
                        key: field.name,
                        options: (field.field_type === 'ref' || field.field_type === 'list_ref') ? refOptions[field.name] : field.options,
                        type: field.field_type // Renderer uses 'type', DB uses 'field_type'
                    };

                    return (
                        <DynamicFieldRenderer
                            key={field.id}
                            fieldConfig={fieldConfig}
                            value={formData[field.name]}
                            onChange={handleFieldChange}
                        />
                    );
                })}
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
