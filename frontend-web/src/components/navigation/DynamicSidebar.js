import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import {
    LayoutDashboard, Users, ShoppingCart, Map, Package, Settings, Briefcase,
    Phone, ShieldAlert, Database, Layout, Server, Circle, Folder, FileText,
    Plus, ChevronRight, ChevronDown, Trash, Pencil
} from 'lucide-react';
import { useBuilder } from '../../context/BuilderContext';
import PageWizard from '../builder/PageWizard'; // Wizard Import
import NavigationGroupModal from '../builder/NavigationGroupModal';

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

const DynamicSidebar = ({ isCollapsed, groups = [], onRefresh }) => {
    const { isEditMode } = useBuilder();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Group Modal State
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState(null);

    // State for creating group (Inline - KEEPING for quick add, but mainly using Modal for edits)
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");

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
            if (onRefresh) onRefresh();
        } catch (error) {
            alert("Erro ao criar grupo");
        }
    };

    const handleEditGroup = (e, group) => {
        e.stopPropagation();
        setGroupToEdit(group);
        setGroupModalOpen(true);
    };

    // Render Icon Helper
    const RenderIcon = ({ name, size = 20, className }) => {
        const Icon = iconMap[name] || Circle;
        return <Icon size={size} className={className} />;
    };

    return (
        <nav className="flex-1 overflow-y-auto py-2 px-1 space-y-2">
            {/* Dynamic Groups */}
            {groups.map(group => {
                // Determine if this group is active (either directly selected or one of its pages is viewed)
                const isGroupActive = location.pathname === `/app/group/${group.id}` || 
                                     group.pages?.some(p => location.pathname === `/app/page/${p.id}`);
                
                return (
                    <div
                        key={group.id}
                        onClick={() => navigate(`/app/group/${group.id}`)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 mb-0.5 cursor-pointer group/item
                            ${isGroupActive
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            } ${isCollapsed ? 'justify-center px-0' : ''}`}
                        title={isCollapsed ? group.name : ''}
                    >
                        <div className="flex items-center overflow-hidden">
                            <RenderIcon name={group.icon || 'Folder'} size={20} className={`${isCollapsed ? '' : 'mr-3'}`} />
                            {!isCollapsed && <span className="truncate">{group.name}</span>}
                        </div>
                        
                        {/* Edit Button */}
                        {isEditMode && !isCollapsed && (
                            <button
                                onClick={(e) => handleEditGroup(e, group)}
                                className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-white/20 rounded transition-all"
                                title="Editar Grupo"
                            >
                                <Pencil size={12} />
                            </button>
                        )}
                    </div>
                );
            })}

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
            
            <NavigationGroupModal 
                isOpen={groupModalOpen}
                onClose={() => { setGroupModalOpen(false); setGroupToEdit(null); }}
                onGroupCreated={onRefresh} // Also handles updates
                groupToEdit={groupToEdit}
            />
        </nav>
    );
};

export default DynamicSidebar;
