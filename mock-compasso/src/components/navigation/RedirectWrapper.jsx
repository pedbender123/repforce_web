import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import DynamicPageLoader from '../../pages/app/DynamicPageLoader';

const RedirectWrapper = () => {
    const { tenantId, groupId, pageId } = useParams();
    const navigate = useNavigate();
    const [pageType, setPageType] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkPage = async () => {
            try {
                const { data: page } = await apiClient.get(`/api/builder/pages/${pageId}`);
                setPageType(page.type);
                
                // For List pages, show the list directly (don't redirect to subpage)
                if (['list', 'list_readonly', 'list_custom', 'dashboard', 'blank'].includes(page.type)) {
                    // Stay on this route - DynamicPageLoader will render
                    setLoading(false);
                    return;
                }
                
                // For other page types that require a subpage, redirect
                if (page.subpages && page.subpages.length > 0) {
                    const sorted = page.subpages.sort((a, b) => a.order - b.order);
                    navigate(`/app/${tenantId}/${groupId}/${pageId}/${sorted[0].id}`, { replace: true });
                } else {
                    setLoading(false);
                }
                
            } catch (error) {
                console.error("Redirect Error:", error);
                setLoading(false);
            }
        };

        if (pageId && tenantId && groupId) {
            checkPage();
        }
    }, [pageId, tenantId, groupId, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Render the page directly without subPageId
    return <DynamicPageLoader pageId={pageId} />;
};

export default RedirectWrapper;

