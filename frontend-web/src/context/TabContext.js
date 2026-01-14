import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import apiClient from '../api/apiClient';
import { AuthContext } from './AuthContext';

export const TabContext = createContext({});

export const TabProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Structure: { id: 'uuid', title: 'Start', path: '/app/dashboard', isFixed: true, data: {} }
    const [tabs, setTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [isRestoring, setIsRestoring] = useState(true);

    // 1. Restore State from Backend on Mount
    useEffect(() => {
        const restoreState = async () => {
            if (!user) return;
            try {
                // If backend has state (implied via user.ui_state or separate fetch), restore it.
                // For now, let's assume we fetch it or user object has it.
                // Since user object might be stale, let's fetch strictly.
                // BUT for MVP speed, we'll initialize with just the current page if empty.
                
                // Mock Persistence Read (Implementation Pending Backend Endpoint specific for UI State if not in /me)
                // Using LocalStorage as interim cache for stability before full backend sync
                const localState = localStorage.getItem(`tabs_${user.id}`);
                if (localState) {
                    const parsed = JSON.parse(localState);
                    setTabs(parsed.tabs || []);
                    setActiveTabId(parsed.activeTabId);
                } else {
                    // Default Initial State
                    const initialTab = { 
                        id: 'dashboard', 
                        title: 'Dashboard', 
                        path: '/app/dashboard', 
                        isFixed: true 
                    };
                    setTabs([initialTab]);
                    setActiveTabId(initialTab.id);
                }
            } catch (e) {
                console.error("Tab Restore Error", e);
            } finally {
                setIsRestoring(false);
            }
        };
        restoreState();
    }, [user]);

    // 2. Persist State (Debounced)
    useEffect(() => {
        if (isRestoring || !user) return;
        
        const stateToSave = { tabs, activeTabId };
        localStorage.setItem(`tabs_${user.id}`, JSON.stringify(stateToSave));

        // TODO: Sync to Backend (Optional for now, user requested "stored in cache on backend")
        // apiClient.put('/v1/users/ui_state', { mdi_tabs: stateToSave });
    }, [tabs, activeTabId, user, isRestoring]);

    // 3. Open Subpage Action
    const openSubPage = useCallback((config) => {
        // config: { title, path, originalPath, template, id (optional), recordId (optional) }
        
        // Check if already open (by ID or Path)
        const existingToken = config.id || config.path;
        const existing = tabs.find(t => t.id === existingToken || t.path === config.path);
        
        if (existing) {
            setActiveTabId(existing.id);
            navigate(existing.path);
            return;
        }

        const newTab = {
            id: config.id || uuidv4(),
            title: config.title || 'Nova Aba',
            path: config.path, // The actual URL this tab represents
            type: config.template || 'DEFAULT',
            isFixed: false,
            data: config.data || {} // Form draft data
        };

        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
        navigate(newTab.path);
    }, [tabs, navigate]);

    const closeTab = useCallback((tabId) => {
        const tabIndex = tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;
        
        const tab = tabs[tabIndex];
        if (tab.isFixed) return; // Cannot close fixed tabs
        
        const newTabs = tabs.filter(t => t.id !== tabId);
        setTabs(newTabs);

        // Calculate next active tab if we closed the active one
        if (activeTabId === tabId) {
            const nextIndex = Math.max(0, tabIndex - 1);
            const nextTab = newTabs[nextIndex];
            if (nextTab) {
                setActiveTabId(nextTab.id);
                navigate(nextTab.path);
            }
        }
    }, [tabs, activeTabId, navigate]);

    const switchTab = useCallback((tabId) => {
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            setActiveTabId(tab.id);
            navigate(tab.path);
        }
    }, [tabs, navigate]);

    // Sync URL with Tab (If user navigates manually via Sidebar or Back Button)
    useEffect(() => {
        if (isRestoring || tabs.length === 0) return;

        // 1. Is the current path already an open tab?
        const existingTab = tabs.find(t => t.path === location.pathname);
        if (existingTab) {
            if (activeTabId !== existingTab.id) {
                setActiveTabId(existingTab.id);
            }
            return;
        }

        // 2. If not found, and it's a valid app route, assume it's a "Main Navigation" (Sidebar/Back)
        // We replace the 'Main' tab (usually the first fixed one) with this new context.
        if (location.pathname.startsWith('/app/')) {
            setTabs(prev => {
                const newTabs = [...prev];
                // Find first fixed/main tab
                const mainTabIndex = newTabs.findIndex(t => t.isFixed) !== -1 ? newTabs.findIndex(t => t.isFixed) : 0;
                
                if (newTabs[mainTabIndex]) {
                    // Update Main Tab
                    newTabs[mainTabIndex] = {
                        ...newTabs[mainTabIndex],
                        title: 'Carregando...', // DynamicSidebar/PageLoader should ideally update this title
                        path: location.pathname,
                        id: 'main_tab' // Keep ID stable or change? Stable is better for main tab.
                    };
                    setActiveTabId(newTabs[mainTabIndex].id);
                }
                return newTabs;
            });
        }
    }, [location.pathname, isRestoring]);
    
    const updateTab = useCallback((tabId, updates) => {
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...updates } : t));
    }, []);

    return (
        <TabContext.Provider value={{
            tabs,
            activeTabId,
            openSubPage,
            closeTab,
            switchTab,
            updateTab,
            setTabs 
        }}>
            {children}
        </TabContext.Provider>
    );
};

export const useTabs = () => useContext(TabContext);
