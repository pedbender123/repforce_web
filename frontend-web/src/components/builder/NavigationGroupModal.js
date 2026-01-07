import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../api/apiClient';
import { 
    LayoutDashboard, Users, ShoppingCart, Map, Package, Settings, Briefcase,
    Phone, ShieldAlert, Database, Layout, Server, Circle, Folder, FileText,
    ChevronDown, Box, Clipboard, PieChart
} from 'lucide-react';

const iconMap = {
    LayoutDashboard, Users, ShoppingCart, Map, Package, Settings, Briefcase,
    Phone, ShieldAlert, Database, Layout, Server, Circle, Folder, FileText,
    Box, Clipboard, PieChart
};

const NavigationGroupModal = ({ isOpen, onClose, onGroupCreated, groupToEdit }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('Circle');
    const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (groupToEdit) {
            setName(groupToEdit.name);
            setIcon(groupToEdit.icon);
        } else {
            setName('');
            setIcon('Circle');
        }
    }, [groupToEdit, isOpen]);
    
    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsIconDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name) return;
        try {
            if (groupToEdit) {
                await apiClient.put(`/api/builder/navigation/groups/${groupToEdit.id}`, {
                    name,
                    icon,
                    order: groupToEdit.order
                });
            } else {
                await apiClient.post('/api/builder/navigation/groups', {
                    name,
                    icon,
                    order: 0
                });
            }
            onClose();
            if (onGroupCreated) onGroupCreated();
        } catch (error) {
            alert("Erro ao salvar grupo: " + (error.response?.data?.detail || error.message));
        }
    };

    const SelectedIcon = iconMap[icon] || Circle;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold mb-4 dark:text-white">{groupToEdit ? 'Editar Grupo' : 'Novo Grupo de Menu'}</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nome do Grupo</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white focus:outline-none focus:border-blue-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    
                    <div ref={dropdownRef} className="relative">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Ícone</label>
                        <button
                            type="button"
                            onClick={() => setIsIconDropdownOpen(!isIconDropdownOpen)}
                            className="w-full flex items-center justify-between p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white hover:border-blue-500 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <SelectedIcon size={18} />
                                <span className="text-sm">{icon}</span>
                            </div>
                            <ChevronDown size={16} className="text-gray-400" />
                        </button>

                        {isIconDropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {Object.keys(iconMap).map((iconKey) => {
                                    const IconComponent = iconMap[iconKey];
                                    return (
                                        <button
                                            key={iconKey}
                                            type="button"
                                            onClick={() => { setIcon(iconKey); setIsIconDropdownOpen(false); }}
                                            className={`w-full flex items-center gap-2 p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${icon === iconKey ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}
                                        >
                                            <IconComponent size={18} />
                                            <span>{iconKey}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{groupToEdit ? 'Salvar' : 'Criar'}</button>
                </div>
            </div>
        </div>
    );
};

export default NavigationGroupModal;
