import React from 'react';
import { useTabs } from '../../context/TabContext';
import { X, Home, FileText, CircuitBoard, Layers } from 'lucide-react';

const TabManager = () => {
    const { tabs, activeTabId, switchTab, closeTab } = useTabs();

    if (tabs.length <= 1) return null; // Don't show if single tab (cleaner) OR show for consistency? Let's show always if preferred, but usually MDI shows only when needed. 
    // User req: "Menu horizontal... que vai ficar posicionado na parte inferior ao que já existe"
    // Let's show it always to reinforce the MDI concept.

    const getIcon = (tab) => {
        if (tab.isFixed) return <Layers size={14} />;
        if (tab.type === 'FICHA') return <FileText size={14} />;
        if (tab.type === 'FORM') return <CircuitBoard size={14} />;
        return <FileText size={14} />;
    };

    return (
        <div className="flex items-center w-full bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 pt-2 gap-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => {
                const isActive = tab.id === activeTabId;
                return (
                    <div
                        key={tab.id}
                        onClick={() => switchTab(tab.id)}
                        className={`
                            group flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg cursor-pointer border-t border-l border-r transition-all min-w-[120px] max-w-[200px]
                            ${isActive 
                                ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 relative top-[1px]' 
                                : 'bg-gray-200 dark:bg-gray-800 border-transparent text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-700'
                            }
                        `}
                    >
                        {getIcon(tab)}
                        <span className="truncate flex-1 text-xs">{tab.title}</span>
                        
                        {!tab.isFixed && (
                            <button
                                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                                className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default TabManager;
