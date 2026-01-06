import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import {
    LayoutDashboard, Users, ShoppingCart, Map, Package, Settings, Briefcase,
    Phone, ShieldAlert, Database, Layout, Server, Circle, Folder, FileText,
    Plus, ChevronRight, ChevronDown, Trash
} from 'lucide-react';
import { useBuilder } from '../../context/BuilderContext';

const iconMap = {
    'LayoutDashboard': LayoutDashboard,
    'Users': Users,
    'ShoppingCart': ShoppingCart,
    'Map': Map,
    'Package': Package,
    'Settings': Settings,
    'Briefcase': Briefcase,
    'Phone': Phone,
    'ShieldAlert': ShieldAlert,
    'Server': Server,
    'Database': Database,
    'Layout': Layout,
    'Circle': Circle,
    'Folder': Folder,
    'FileText': FileText
};

import PageWizard from '../builder/PageWizard'; // Wizard Import

const DynamicSidebar = ({ isCollapsed }) => {
    const [groups, setGroups] = useState([]);
    const { isEditMode } = useBuilder();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Wizard State
    const [wizardOpen, setWizardOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState(null);

    // State for creating group
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");

    useEffect(() => {
        fetchNavigation();
    }, []);

    const fetchNavigation = async () => {
        try {
            const { data } = await apiClient.get('/api/builder/navigation');
            setGroups(data);
        } catch (error) {
            console.error("Erro ao carregar navegação:", error);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName) return;
        try {
            await apiClient.post('/api/builder/navigation/groups', {
                name: newGroupName,
                icon: "Folder",
                order: groups.length
            });
            setNewGroupName("");
            setIsCreatingGroup(false);
            fetchNavigation();
        } catch (error) {
            alert("Erro ao criar grupo");
        }
    };

    // Render Icon Helper
    const RenderIcon = ({ name, size = 20, className }) => {
        const Icon = iconMap[name] || Circle;
        return <Icon size={size} className={className} />;
    };

    return (
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
            {/* Dynamic Groups */}
            {groups.map(group => (
                <div key={group.id} className="space-y-1">
                    <div className={`flex items-center justify-between px-2 text-xs font-semibold text-gray-500 uppercase mb-1 ${isCollapsed ? 'justify-center' : ''}`}>
                        {!isCollapsed && <span>{group.name}</span>}
                        {isEditMode && !isCollapsed && (
                             <button 
                                onClick={() => { setSelectedGroupId(group.id); setWizardOpen(true); }}
                                className="text-gray-400 hover:text-blue-500" 
                                title="Adicionar Página"
                            >+</button>
                        )}
                    </div>

                    {/* Pages in Group */}
                    {group.pages && group.pages.map(page => (
                        <button
                            key={page.id}
                            onClick={() => navigate(`/app/page/${page.id}`)}
                            className={`w-full flex items-center py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                                ${location.pathname === `/app/page/${page.id}`
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                            title={isCollapsed ? page.name : ''}
                        >
                            <span className={`${isCollapsed ? '' : 'mr-3'}`}>
                                <FileText size={20} />
                            </span>
                            {!isCollapsed && <span className="truncate">{page.name}</span>}
                        </button>
                    ))}

                    {/* Empty Group State */}
                    {(!group.pages || group.pages.length === 0) && !isCollapsed && (
                        <div className="px-3 py-1 text-xs text-gray-600 italic">Vazio</div>
                    )}
                </div>
            ))}

            {/* Builder Mode: Add Group Action */}
            {isEditMode && (
                <div className={`mt-4 pt-4 border-t border-gray-800 ${isCollapsed ? 'hidden' : ''}`}>
                    {isCreatingGroup ? (
                        <div className="px-2">
                            <input
                                autoFocus
                                className="w-full bg-gray-800 text-white text-xs p-2 rounded mb-2 border border-blue-500 focus:outline-none"
                                placeholder="Nome do Grupo..."
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleCreateGroup();
                                    if (e.key === 'Escape') setIsCreatingGroup(false);
                                }}
                            />
                            <div className="flex gap-2">
                                <button onClick={handleCreateGroup} className="flex-1 bg-blue-600 text-white text-xs py-1 rounded">Salvar</button>
                                <button onClick={() => setIsCreatingGroup(false)} className="flex-1 bg-gray-700 text-gray-300 text-xs py-1 rounded">Cancelar</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreatingGroup(true)}
                            className="w-full border border-dashed border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500 rounded-lg p-2 text-xs flex items-center justify-center gap-2 transition-colors">
                            <Plus size={14} /> Novo Grupo
                        </button>
                    )}
                </div>
            )}
            <PageWizard 
                isOpen={wizardOpen} 
                onClose={() => setWizardOpen(false)} 
                groupId={selectedGroupId}
                onPageCreated={fetchNavigation}
            />
        </nav>
    );
};

export default DynamicSidebar;
