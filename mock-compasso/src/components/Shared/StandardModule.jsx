import React, { useState } from 'react';
import { Search, Plus, ChevronRight, X } from 'lucide-react';

const StandardModule = ({ title, data, columns, renderRow, renderDetail, newItemLabel, tabState, onAdd, renderForm, showAddButton = true }) => {
    const { tabs, activeId, setActiveId, open, close } = tabState;
    const activeItem = tabs.find(t => t.id === activeId);
    const [showAddModal, setShowAddModal] = useState(false);

    const closeModal = () => setShowAddModal(false);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 animate-fade-in text-gray-900 dark:text-white">
            {/* Tab Bar */}
            <div className="flex items-end px-2 border-b border-gray-300 dark:border-gray-700 bg-[#f3f4f6] dark:bg-gray-950 h-10 gap-1 overflow-x-auto no-scrollbar">
                {/* Main List Tab */}
                <div
                    onClick={() => setActiveId('list')}
                    className={`cursor-pointer px-4 py-2 text-xs font-bold uppercase tracking-wide border-t border-l border-r border-gray-300 dark:border-gray-700 rounded-t-sm ${activeId === 'list'
                            ? 'bg-white dark:bg-gray-900 border-b-white dark:border-b-gray-900 text-gray-700 dark:text-white translate-y-[1px]'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                >
                    Lista de {title}
                </div>

                {/* Dynamic Tabs */}
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveId(tab.id)}
                        className={`cursor-pointer pl-3 pr-2 py-2 text-xs font-bold uppercase tracking-wide border-t border-l border-r border-gray-300 dark:border-gray-700 rounded-t-sm flex items-center gap-2 max-w-[200px] ${activeId === tab.id
                                ? 'bg-white dark:bg-gray-900 border-b-white dark:border-b-gray-900 text-gray-700 dark:text-white translate-y-[1px]'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        <span className="truncate">{tab.name || tab.clientName || tab.code || tab.razao_social}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); close(tab.id); }}
                            className="hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 rounded-sm p-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeId === 'list' ? (
                    <div className="p-4 h-full overflow-y-auto bg-white dark:bg-gray-900">

                        {/* Search & Actions Bar */}
                        <div className="flex justify-between mb-4 items-center bg-gray-50 dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded-sm">
                            <div className="relative">
                                <Search className="absolute left-3 top-2 w-4 h-4 text-gray-400" />
                                <input
                                    className="pl-9 pr-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-sm text-sm w-64 focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="Pesquisar..."
                                />
                            </div>
                            {newItemLabel && showAddButton && (
                                <button onClick={() => setShowAddModal(true)} className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-1.5 rounded-sm text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                                    <Plus className="w-4 h-4" /> {newItemLabel}
                                </button>
                            )}
                        </div>

                        {/* Data Table */}
                        <div className="border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-300 dark:border-gray-700 text-xs uppercase">
                                    <tr>
                                        {columns.map((c, i) => <th key={i} className="p-3">{c}</th>)}
                                        <th className="p-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                    {data.map((item, idx) => (
                                        <tr
                                            key={idx}
                                            onClick={() => open(item)}
                                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors group"
                                        >
                                            {renderRow(item)}
                                            <td className="p-3 text-right">
                                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 inline" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    activeItem
                        ? renderDetail(activeItem)
                        : <div className="p-10 text-center text-gray-400 dark:text-gray-600">Item fechado ou removido.</div>
                )}
            </div>

            {/* Generic Add Modal */}
            {showAddModal && newItemLabel && showAddButton && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-lg shadow-xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg dark:text-white">{newItemLabel}</h3>
                            <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {/* If renderForm is passed, use it, else generic */}
                            {renderForm ? renderForm(closeModal, (data) => { onAdd(data); closeModal(); }) : (
                                <p className="text-gray-500">Formulário não configurado.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StandardModule;
