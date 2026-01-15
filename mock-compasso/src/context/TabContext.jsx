import { createContext, useState, useContext, useEffect } from 'react';

export const TabContext = createContext({});

export const TabProvider = ({ children }) => {
    // Structure: { id: 'dashboard', title: 'Dashboard', component: lazy... }
    const [tabs, setTabs] = useState([{ id: 'dashboard', title: 'Dashboard', type: 'STATIC' }]);
    const [activeTabId, setActiveTabId] = useState('dashboard');

    const openTab = (tab) => {
        const exists = tabs.find(t => t.id === tab.id);
        if (!exists) {
            setTabs(prev => [...prev, tab]);
        }
        setActiveTabId(tab.id);
    };

    const closeTab = (id) => {
        if (id === 'dashboard') return; // Cannot close dashboard
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTabId === id) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    return (
        <TabContext.Provider value={{ tabs, activeTabId, setActiveTabId, openTab, closeTab }}>
            {children}
        </TabContext.Provider>
    );
};

export const useTabs = () => useContext(TabContext);
