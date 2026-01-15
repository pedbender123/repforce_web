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
    // const { isEditMode } = useBuilder();
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


                    </div>
                );
            })}



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
