import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useBuilder } from '../../context/BuilderContext';
import { Settings, PenTool } from 'lucide-react';

// Placeholders for Real Components (List, Form, etc)
// We will replace these with real generic components later
const GenericList = ({ entityId, layoutConfig }) => (
    <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
        <h3 className="text-lg font-bold mb-4">Lista Genérica (Entity {entityId})</h3>
        <p className="text-gray-500">Aqui será renderizada a tabela de dados.</p>
        <pre className="mt-4 bg-gray-100 dark:bg-gray-900 p-2 text-xs rounded">
            Config: {JSON.stringify(layoutConfig, null, 2)}
        </pre>
    </div>
);

const GenericForm = ({ entityId, layoutConfig }) => (
    <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
        <h3 className="text-lg font-bold mb-4">Formulário Genérico (Entity {entityId})</h3>
        <p className="text-gray-500">Aqui será renderizado o formulário de cadastro.</p>
    </div>
);

const DynamicPageLoader = () => {
    const { pageId } = useParams();
    const { isEditMode } = useBuilder();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (pageId) fetchPageDetails();
    }, [pageId]);

    const fetchPageDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            // We need an endpoint to get single page details
            // If it doesn't exist, we might need to create it or filter from groups
            // For now, assuming we filter from full navigation or add endpoint.
            // Let's assume we added GET /navigation/pages/{id} or we filter client side for MVP
            // Hack: Fetch all groups and find page (Optimizable)
            const { data } = await apiClient.get('/api/builder/navigation');
            let foundPage = null;
            for (const group of data) {
                const p = group.pages.find(p => p.id === pageId);
                if (p) foundPage = p;
            }
            
            if (foundPage) {
                setPage(foundPage);
            } else {
                setError("Página não encontrada.");
            }

        } catch (err) {
            console.error("Error loading page:", err);
            setError("Erro ao carregar página.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Carregando página...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
    if (!page) return null;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{page.name}</h1>
                    {isEditMode && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Modo Edição</span>}
                </div>
                
                {isEditMode && (
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                        <Settings size={16} /> Configurar Slots
                    </button>
                )}
            </div>

            {/* Content Renderer */}
            {page.type === 'list' && <GenericList entityId={page.entity_id} layoutConfig={page.layout_config} />}
            {page.type === 'form' && <GenericForm entityId={page.entity_id} layoutConfig={page.layout_config} />}
            {page.type === 'dashboard' && <div className="p-10 text-center border-dashed border-2 rounded">Dashboard Placeholder</div>}
        </div>
    );
};

export default DynamicPageLoader;
