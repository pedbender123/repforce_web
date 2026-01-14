
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useBuilder } from '../../context/BuilderContext';
import { useTabs } from '../../context/TabContext';
import { Settings, PenTool, Layout, X } from 'lucide-react';
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
    const [searchParams] = useSearchParams();
    const pageId = propPageId || params.pageId;
    const subPageId = params.subPageId; // NEW: SubPage ID from URL
    const recordId = searchParams.get('id'); // Record ID from query params
    const draftId = searchParams.get('draft_id'); // Draft ID for new records
    
    const { isEditMode } = useBuilder();
    const { updateTab, activeTabId } = useTabs();
    const navigate = useNavigate();
    const [page, setPage] = useState(null);
    const [subPage, setSubPage] = useState(null); // NEW: Active SubPage
    // Fix Infinite Loading: Only load if pageId exists
    const [loading, setLoading] = useState(!!(propPageId || params.pageId));
    const [error, setError] = useState(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false); // Modal State

    useEffect(() => {
        if (pageId) {
            setLoading(true);
            fetchPageDetails();
        } else {
             setLoading(false);
        }
    }, [pageId, subPageId]);

    const fetchPageDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Page directly
            const { data: pageData } = await apiClient.get(`/api/builder/pages/${pageId}`);
            
            if (pageData) {
                // 2. If page has entity, fetch entity details to get name
                if (pageData.entity_id) {
                    try {
                        const { data: entities } = await apiClient.get('/api/builder/entities');
                        const ent = entities.find(e => e.id === pageData.entity_id);
                        if (ent) {
                            pageData.entityName = ent.display_name;
                            pageData.entitySlug = ent.slug;
                        }
                    } catch (e) {
                         console.warn("Could not fetch entity details");
                    }
                }
                setPage(pageData);
                
                // 3. NEW: If subPageId exists, find the active subpage
                // 3. NEW: If subPageId exists, find the active subpage
                if (subPageId) {
                    let foundSubPage = pageData.subpages ? pageData.subpages.find(sp => sp.id === subPageId) : null;
                    
                    // FALLBACK: Se não achar, e for 'ficha', cria sintético
                    if (!foundSubPage && (subPageId === 'ficha' || subPageId === 'detalhes')) {
                        console.warn("SubPage não encontrada, usando Fallback Sintético 'Ficha 360'");
                        foundSubPage = {
                            id: subPageId,
                            name: 'Ficha 360',
                            type: 'ficha_360', // Generic Record View (360)
                            config: {} // Usa defaults do GenericLayout360
                        };
                    }

                    setSubPage(foundSubPage || null);
                    
                    // Update Tab Title with SubPage name
                    if (!embedded && foundSubPage) {
                        const paramLabel = searchParams.get('tab_label');
                        const title = paramLabel ? decodeURIComponent(paramLabel) : foundSubPage.name;
                        updateTab(activeTabId, { title: title });
                    }
                } else {
                    setSubPage(null);
                    // Update Tab Title only if main page
                    if (!embedded) {
                        updateTab(activeTabId, { title: pageData.name });
                    }
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

    // Render SubPage Content
    const renderSubPageContent = () => {
        if (!subPage) return null;
        
        const subPageType = subPage.type;
        
        switch (subPageType) {
            case 'list':
                return <GenericListPage 
                    pageId={page.id}
                    entityId={page.entity_id} 
                    entitySlug={page.entitySlug}
                    entityName={page.entityName}
                    layoutConfig={subPage.config} 
                    pageType="list"
                />;
            case 'view':
            case 'ficha_simples':
                return <GenericRecordPage 
                    pageId={page.id}
                    entityId={page.entity_id}
                    entitySlug={page.entitySlug}
                    entityName={page.entityName}
                    layoutConfig={subPage.config}
                    recordId={recordId}
                />;
            case 'form':
                return <GenericForm 
                    entityId={page.entity_id} 
                    layoutConfig={subPage.config}
                    recordId={recordId}
                    onSuccess={() => navigate(-1)}
                />;
            case 'split_view':
            case 'ficha_360':
                return <GenericLayout360 
                    pageId={page.id}
                    entityId={page.entity_id}
                    entitySlug={page.entitySlug}
                    entityName={page.entityName}
                    layoutConfig={subPage.config}
                    recordId={recordId}
                />;
            default:
                return <div className="p-6 text-gray-500">Tipo de subpágina não suportado: {subPageType}</div>;
        }
    };

    // Render Content Only - Tabs are handled globally by TabContext layout
    if (loading) return <div className="p-10 text-center text-gray-500">Carregando página...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
    if (!page) return null;

    return (
        <div className={`h-full flex flex-col ${embedded ? '' : ''}`}>
             <div className="flex-1 h-full overflow-hidden">
                {subPage ? (
                    renderSubPageContent()
                ) : (
                    <>
                        {['list', 'list_readonly', 'list_custom'].includes(page.type) && <GenericListPage 
                            pageId={page.id}
                            entityId={page.entity_id} 
                            entitySlug={page.entitySlug}
                            entityName={page.entityName}
                            layoutConfig={page.layout_config} 
                            pageType={page.type}
                            defaultDetailSubpageId={page.default_detail_subpage_id}
                            defaultFormSubpageId={page.default_form_subpage_id}
                        />}
                        {page.type === 'dashboard' && <DashboardPage 
                            pageId={page.id}
                            layoutConfig={page.layout_config}
                            entitySlug={page.entitySlug}
                        />}
                        {page.type === 'blank' && (
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Tabela Vinculada: <span className="text-blue-600">{page.entityName || page.entity_id || 'Nenhuma'}</span></h2>
                            </div>
                        )}
                    </>
                )}
             </div>
        </div>
    );
};

export default DynamicPageLoader;
