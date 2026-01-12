import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import NavigationGroupModal from '../../components/builder/NavigationGroupModal';
import NavigationPageModal from '../../components/builder/NavigationPageModal';
import PageSettingsModal from '../../components/builder/PageSettingsModal';
import { Plus, Layout, Folder, FileText, Settings, Trash2 } from 'lucide-react';

const NavigationEditor = () => {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isPageModalOpen, setIsPageModalOpen] = useState(false);
    
    // Page Settings
    const [editingPage, setEditingPage] = useState(null);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const { data } = await apiClient.get('/api/builder/navigation');
            setGroups(data);
            // Re-select group to update pages list if selected
            if (selectedGroup) {
                const updated = data.find(g => g.id === selectedGroup.id);
                if (updated) setSelectedGroup(updated);
                else setSelectedGroup(null); // Deselect if deleted
            }
            // Trigger global refresh
            window.dispatchEvent(new Event('navigation-updated'));
        } catch (error) {
            console.error("Erro ao buscar navegação:", error);
        }
    };

    const deleteGroup = async (group) => {
        if (!window.confirm(`Tem certeza que deseja excluir o grupo "${group.name}" e todas as suas páginas?`)) return;
        try {
            await apiClient.delete(`/api/builder/navigation/groups/${group.id}`);
            fetchGroups();
        } catch (error) {
            alert("Erro ao excluir grupo: " + (error.response?.data?.detail || error.message));
        }
    };

    const deletePage = async (page) => {
        if (!window.confirm(`Tem certeza que deseja excluir a página "${page.name}"?`)) return;
        try {
            await apiClient.delete(`/api/builder/navigation/pages/${page.id}`);
            fetchGroups();
        } catch (error) {
            alert("Erro ao excluir página: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div className="flex h-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            {/* Sidebar: Groups */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-black/20 h-full">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Grupos de Menu</span>
                    <button
                        onClick={() => setIsGroupModalOpen(true)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                        <Plus size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {groups.map(group => (
                        <button
                            key={group.id}
                            onClick={() => setSelectedGroup(group)}
                            className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${selectedGroup?.id === group.id
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                                }`}
                        >
                            <Folder size={16} className="mr-3 opacity-70" />
                            <span className="truncate flex-1 text-left">{group.name}</span>
                            <div className="flex items-center gap-1">
                                <span className="text-xs opacity-50 bg-gray-200 dark:bg-gray-700 px-1.5 rounded-full">{group.pages?.length || 0}</span>
                                <div
                                    onClick={(e) => { e.stopPropagation(); deleteGroup(group); }}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-400 hover:text-red-500 rounded transition-colors"
                                >
                                    <Trash2 size={12} />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content: Pages in Group */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full overflow-hidden">
                {selectedGroup ? (
                    <>
                        {/* Header */}
                        <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 justify-between bg-white dark:bg-gray-900 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <Folder size={20} className="text-blue-500" />
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                                    {selectedGroup.name}
                                </h2>
                            </div>
                            <button
                                onClick={() => setIsPageModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors shadow-sm"
                            >
                                <Plus size={16} />
                                <span>Adicionar Página</span>
                            </button>
                        </div>

                        {/* Pages Grid */}
                        <div className="flex-1 overflow-auto p-6 bg-gray-50/50 dark:bg-black/20">
                           {selectedGroup.pages && selectedGroup.pages.length > 0 ? (
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                   {selectedGroup.pages.map(page => (
                                       <div key={page.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors shadow-sm group relative">
                                           <div className="flex items-start justify-between mb-2">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-1 rounded capitalize">{page.type}</span>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingPage(page); }}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600"
                                                        title="Configurações"
                                                    >
                                                        <Settings size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); deletePage(page); }}
                                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500"
                                                        title="Excluir Página"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                           </div>
                                           <h3 className="font-medium text-gray-900 dark:text-white truncate" title={page.name}>{page.name}</h3>
                                           {page.entity_id && <p className="text-xs text-gray-500 mt-1 truncate">Entity: {page.entity_id}</p>}
                                       </div>
                                   ))}
                               </div>
                           ) : (
                               <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                   <Layout size={48} className="mb-4 opacity-20" />
                                   <p>Nenhuma página neste grupo.</p>
                                   <button onClick={() => setIsPageModalOpen(true)} className="mt-2 text-blue-500 hover:underline">Criar primeira página</button>
                               </div>
                           )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Folder size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">Selecione um grupo de menu</p>
                    </div>
                )}
            </div>

            <NavigationGroupModal 
                isOpen={isGroupModalOpen} 
                onClose={() => setIsGroupModalOpen(false)} 
                onGroupCreated={fetchGroups} 
            />
            
            <NavigationPageModal
                isOpen={isPageModalOpen}
                onClose={() => setIsPageModalOpen(false)}
                groupId={selectedGroup?.id}
                onPageCreated={fetchGroups}
            />
            
            <PageSettingsModal
                isOpen={!!editingPage}
                onClose={() => setEditingPage(null)}
                page={editingPage}
                onUpdate={fetchGroups}
            />
        </div>
    );
};

export default NavigationEditor;
