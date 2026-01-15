import { useState } from 'react';

const useTabSystem = (initial = []) => {
    const [tabs, setTabs] = useState(initial);
    const [activeId, setActiveId] = useState('list');

    // Open a new tab or switch to it if it exists
    const open = (item) => {
        if (!tabs.find(t => t.id === item.id)) {
            setTabs([...tabs, item]);
        }
        setActiveId(item.id);
    };

    // Close a tab and switch to the nearest one or list
    const close = (id) => {
        const remaining = tabs.filter(t => t.id !== id);
        setTabs(remaining);

        if (activeId === id) {
            // Switch to last open tab or list
            setActiveId(remaining.length > 0 ? remaining[remaining.length - 1].id : 'list');
        }
    };

    return { tabs, activeId, setActiveId, open, close };
};

export default useTabSystem;
