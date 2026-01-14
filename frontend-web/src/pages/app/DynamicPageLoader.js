
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useBuilder } from '../../context/BuilderContext';
import { useTabs } from '../../context/TabContext';
import { Settings, PenTool } from 'lucide-react';
import GenericListPage from '../../components/builder/GenericListPage';
import GenericRecordPage from '../../components/builder/GenericRecordPage';
import GenericForm from '../../components/builder/GenericForm';
import GenericFormPage from '../../components/builder/GenericFormPage';
import DashboardPage from '../../components/builder/DashboardPage';
import GenericLayout360 from '../../components/engine/GenericLayout360';


// Placeholders for Real Components (List, Form, etc)
// We will replace these with real generic components later



import PageSettingsModal from '../../components/builder/PageSettingsModal'; // Import Modal
import { useNavigate } from 'react-router-dom';

const DynamicPageLoader = ({ pageId: propPageId, embedded = false }) => {
    const params = useParams();
    const pageId = propPageId || params.pageId;
    const { isEditMode } = useBuilder();
    const { updateTab, activeTabId } = useTabs();
    const navigate = useNavigate();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false); // Modal State

    useEffect(() => {
        if (pageId) fetchPageDetails();
    }, [pageId]);

    const fetchPageDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Navigation to find page
            // Optimization: Could use a specific endpoint for single page to avoid fetching all
            const { data: navData } = await apiClient.get('/api/builder/navigation');
            let foundPage = null;
            // Search in all groups
            for (const group of navData) {
                const p = group.pages.find(p => p.id === pageId);
                if (p) foundPage = p;
            }
            
            if (foundPage) {
                // 2. If page has entity, fetch entity details to get name
                if (foundPage.entity_id) {
                    try {
                        const { data: entities } = await apiClient.get('/api/builder/entities');
                        const ent = entities.find(e => e.id === foundPage.entity_id);
                        if (ent) {
                            foundPage.entityName = ent.display_name;
                            foundPage.entitySlug = ent.slug;
                        }
                    } catch (e) {
                         console.warn("Could not fetch entity details");
                    }
                }
                setPage(foundPage);
                // Update Tab Title only if main page
                if (!embedded) {
                    updateTab(activeTabId, { title: foundPage.name });
                }
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

    const handlePageUpdate = (result) => {
        // If deleted, redirect
        if (result?.deleted) {
            window.dispatchEvent(new Event('navigation-updated')); // Trigger Sidebar Refresh
            if (!embedded) navigate('/app');
            return;
        }
        
        // Refresh local data and global nav
        fetchPageDetails();
        window.dispatchEvent(new Event('navigation-updated'));
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Carregando página...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
    if (!page) return null;

    return (
        <div className={`h-full flex flex-col ${embedded ? '' : 'p-3'}`}>
            {/* Header (Hidden if embedded) */}
            {!embedded && (
                <div className="flex justify-between items-center mb-2 shrink-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{page.name}</h1>
                        {isEditMode && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Modo Edição</span>
                                <button 
                                    onClick={() => setIsConfigOpen(true)}
                                    className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full text-gray-500 hover:text-blue-600 transition-colors"
                                    title="Editar Configurações da Página"
                                >
                                    <PenTool size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Modal de Configuração */}
                    {isEditMode && (
                        <PageSettingsModal
                            isOpen={isConfigOpen}
                            onClose={() => setIsConfigOpen(false)}
                            page={page}
                            onUpdate={handlePageUpdate}
                        />
                    )}
                </div>
            )}

            {/* Content Renderer */}
            {['list', 'list_readonly', 'list_custom'].includes(page.type) && <GenericListPage 
                pageId={page.id}
                entityId={page.entity_id} 
                entitySlug={page.entitySlug}
                entityName={page.entityName}
                layoutConfig={page.layout_config} 
                pageType={page.type}
            />}
            {page.type === 'form' && <GenericForm entityId={page.entity_id} layoutConfig={page.layout_config} />}
            {page.type === 'form_page' && <GenericFormPage pageId={page.id} entityId={page.entity_id} layoutConfig={page.layout_config} />}
            {page.type === 'ficha_simples' && <GenericRecordPage 
                pageId={page.id}
                entityId={page.entity_id}
                entitySlug={page.entitySlug}
                entityName={page.entityName}
                layoutConfig={page.layout_config}
            />}
            {page.type === 'dashboard' && <DashboardPage 
                pageId={page.id}
                layoutConfig={page.layout_config}
                entitySlug={page.entitySlug}
            />}
            {page.type === 'split_view' && <GenericLayout360 
                pageId={page.id}
                entityId={page.entity_id}
                entitySlug={page.entitySlug}
                entityName={page.entityName}
                layoutConfig={page.layout_config}
            />}
            {page.type === 'blank' && (
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Tabela Vinculada: <span className="text-blue-600">{page.entityName || page.entity_id || 'Nenhuma'}</span></h2>
                </div>
            )}
        </div>
    );
};

export default DynamicPageLoader;
