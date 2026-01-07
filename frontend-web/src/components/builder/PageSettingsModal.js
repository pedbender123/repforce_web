import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

const PageSettingsModal = ({ isOpen, onClose, pageId, onUpdate }) => {
    const [name, setName] = useState('');
    // specific config fields
    const [permanentFilters, setPermanentFilters] = useState('{}');
    const [loading, setLoading] = useState(false);
    const [pageData, setPageData] = useState(null);

    useEffect(() => {
        if (isOpen && pageId) {
            fetchPageDetails();
        }
    }, [isOpen, pageId]);

    const fetchPageDetails = async () => {
        try {
            // We need to find the page or fetch it direct.
            // There is no direct GET /pages/{id} in standard routes usually, we get it from navigation structure.
            // But we can try to GET from navigation structure or just rely on what we have?
            // Actually, backend might have `get_all_pages` or we iterate.
            // Let's assume we need to fetch the hierarchy or just use a helper if available.
            // Update: We can use the GenericListPage fetch logic? No.
            // Let's just PUT with what we know, but we need existing layout_config to not lose columns.
            // Better: Fetch the layout config first? 
            // The `api/builder/navigation` returns everything. Let's fetch that?
            // Or assume the parent component passed the `page` object?
            // Let's make the parent pass the `page` object to avoid complex fetching here.
        } catch (error) {
            console.error(error);
        }
    };

    // NOTE: We change the prop to `page` instead of `pageId` for simplicity in MVP
};

// Re-writing component with `page` prop
const PageSettingsModalReal = ({ isOpen, onClose, page, onUpdate }) => {
    const [name, setName] = useState('');
    const [permanentFilters, setPermanentFilters] = useState('{}');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && page) {
            setName(page.name);
            const filters = page.layout_config?.permanent_filters || {};
            setPermanentFilters(JSON.stringify(filters, null, 2));
        }
    }, [isOpen, page]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            let parsedFilters = {};
            try {
                parsedFilters = JSON.parse(permanentFilters);
            } catch (e) {
                alert("JSON de filtros inválido.");
                setLoading(false);
                return;
            }

            // We need to preserve other layout_config keys (like columns)
            // But `page` prop might be stale if we just edited columns in another tab.
            // Ideally we re-fetch. But for now let's trust `page` or doing a shallow merge on backend?
            // The backend `update_page` likely replaces `layout_config`.
            // So we should ideally merge client side with specific knowledge or server side.
            // Let's merge with `page.layout_config`.
            
            const newLayoutConfig = {
                ...(page.layout_config || {}),
                permanent_filters: parsedFilters
            };

            await apiClient.put(`/api/builder/navigation/pages/${page.id}`, {
                name,
                layout_config: newLayoutConfig
            });

            onUpdate();
            onClose();
        } catch (error) {
            alert("Erro ao salvar: " + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[500px] animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Configurar Página: {page?.name}</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nome</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Filtros Permanentes (JSON)</label>
                        <p className="text-xs text-gray-400 mb-2">Ex: <code>{`{"status": "ativo", "created_by": "{me}"}`}</code></p>
                        <textarea
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white font-mono text-xs h-32"
                            value={permanentFilters}
                            onChange={(e) => setPermanentFilters(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Cancelar</button>
                    <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PageSettingsModalReal;
