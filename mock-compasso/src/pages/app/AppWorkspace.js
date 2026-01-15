import React, { useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useTabs } from '../../context/TabContext';
import DynamicPageLoader from './DynamicPageLoader';
import MainDashboardWrapper from './MainDashboardWrapper';
import { getShadowComponent } from '../custom/RouteManager';

const AppWorkspace = () => {
    const { tabs, activeTabId, openSubPage, switchTab, updateTab, closeTab } = useTabs();
    const location = useLocation();
    const navigate = useNavigate();
    const { tenantId } = useParams(); // Get Tenant from URL to toggle Shadow Mode
    
    // 1. URL Sync Logic (Router -> Tabs)
    useEffect(() => {
        const path = location.pathname; // /app/tenant/group/page
        const search = location.search;
        const fullPath = path + search;
        
        // CLEANUP ZOMBIE TABS (Temporary Fix for Demo)
        // Auto-close tabs that are stuck loading and not active
        const zombies = tabs.filter(t => t.title === 'Carregando...' && t.id !== activeTabId);
        if (zombies.length > 0) {
            zombies.forEach(z => {
                // Prevent closing if it was JUST created (race condition?)
                // Assuming "Carregando..." tabs persist from prev session
                closeTab(z.id); 
            });
        }

        const activeTab = tabs.find(t => t.id === activeTabId);
        // ... (rest of logic)
        if (activeTab && activeTab.path === fullPath) return;

        const existing = tabs.find(t => t.path === fullPath);
        if (existing) {
            switchTab(existing.id);
            return;
        }

        // New Route -> Create Tab
        const parts = path.split('/');
        // [ , app, tenant, group, pageId, subPageId? ]
        if (parts.length >= 5) {
             const pageId = parts[4];
             const subPageId = parts[5];
             const query = new URLSearchParams(search); 
             const recordId = query.get('id');
             const draftId = query.get('draft_id');
             
             const isDashboard = pageId === 'dashboard';

             const newTabId = isDashboard ? 'dashboard' : (recordId ? `record_${recordId}` : (subPageId ? `${subPageId}_${draftId || 'view'}` : `page_${pageId}`));
             
             const idCollision = tabs.find(t => t.id === newTabId);
             
             if (idCollision) {
                 updateTab(newTabId, { path: fullPath });
                 switchTab(newTabId);
                 return;
             }

             openSubPage({
                 id: newTabId,
                 title: isDashboard ? 'Dashboard' : (subPageId ? 'Carregando...' : 'Lista'),
                 path: fullPath,
                 template: isDashboard ? 'DASHBOARD' : 'app_page',
                 data: { pageId, subPageId, recordId }
             });
        }
    }, [location.pathname, location.search, tabs, activeTabId]);

    // 2. Render Tabs (Keep Alive)
    return (
        <div className="h-full w-full relative bg-gray-50 dark:bg-gray-900">
            {tabs.map(tab => {
                const isActive = tab.id === activeTabId;
                
                let content = null;

                if (tab.id === 'dashboard' || tab.type === 'DASHBOARD') {
                     content = <MainDashboardWrapper />;
                } else {
                     let { pageId, subPageId, recordId } = tab.data || {};
                     
                     if (!pageId) {
                         const pts = tab.path.split('?')[0].split('/');
                         pageId = pts[4];
                         subPageId = pts[5];
                         const q = tab.path.split('?')[1];
                         if(q) {
                             const query = new URLSearchParams(q);
                             recordId = query.get('id');
                         }
                     }

                     // SHADOW MODE INTERCEPTION
                     // If tenant is demo/compasso AND we have a shadow component
                     const isShadowMode = ['demo', 'compasso'].includes(tenantId || location.pathname.split('/')[2]);
                     const ShadowComponent = isShadowMode ? getShadowComponent(pageId, subPageId) : null;

                     if (ShadowComponent) {
                         content = <ShadowComponent pageId={pageId} subPageId={subPageId} recordId={recordId} />;
                     } else {
                         content = (
                             <DynamicPageLoader 
                                 pageId={pageId}
                                 subPageId={subPageId}
                                 recordId={recordId}
                                 embedded={true} 
                             />
                         );
                     }
                }

                return (
                    <div 
                        key={tab.id} 
                        className="h-full w-full absolute inset-0 overflow-hidden" 
                        style={{ 
                            visibility: isActive ? 'visible' : 'hidden', 
                            zIndex: isActive ? 10 : 0,
                            pointerEvents: isActive ? 'auto' : 'none'
                        }}
                    >
                        {content}
                    </div>
                );
            })}
        </div>
    );
};

export default AppWorkspace;
