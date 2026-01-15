import React, { useState } from 'react';

const MasterDetailView = ({ item, summary, tabs }) => {
    const [activeTab, setActiveTab] = useState(tabs[0].label);
    return (
        <div className="flex h-full bg-white dark:bg-gray-900 animate-fade-in">
            {/* Sidebar Summary */}
            <div className="w-[30%] min-w-[300px] border-r border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 h-full overflow-y-auto relative">
                {summary(item)}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-300 dark:border-gray-700 px-4 pt-2 bg-gray-50 dark:bg-gray-800/50">
                    {tabs.map(t => (
                        <button
                            key={t.label}
                            onClick={() => setActiveTab(t.label)}
                            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === t.label
                                    ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-white dark:bg-gray-900 rounded-t-sm'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {tabs.find(t => t.label === activeTab)?.content(item)}
                </div>
            </div>
        </div>
    );
};

export default MasterDetailView;
