import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

import { Settings, LogOut, Sun, Moon, User, PenTool, ChevronDown } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { useBuilder } from '../context/BuilderContext';

const TopHeaderActions = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { logout, user, isSysAdmin, tenant, exitImpersonation } = useContext(AuthContext);
    const { isEditMode, toggleEditMode } = useBuilder(); 
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        if (isSysAdmin && tenant) {
            // Impersonation Mode: Exit to SysAdmin
            exitImpersonation();
            navigate('/sysadmin/config');
        } else {
            // Regular Logout
            logout();
            navigate('/login');
        }
    };

    const nameToDisplay = user?.full_name || user?.name || user?.username || 'User';
    const initial = nameToDisplay.charAt(0).toUpperCase();

    return (
        <div className="flex items-center space-x-3 ml-auto">
            {/* Notification Center */}
            <NotificationCenter />
            
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Alternar Tema"
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 focus:outline-none"
                    title={nameToDisplay}
                >
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow hover:bg-blue-700 transition-colors">
                        {initial}
                    </div>
                </button>

                {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-100 dark:border-gray-700 z-50 animate-in fade-in zoom-in duration-200">
                        {/* User Header */}
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{nameToDisplay}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>

                        {/* Edit Mode Toggle - Hidden for Demo/Compasso */}
                        {!['demo', 'compasso'].includes(tenant?.slug) && (
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <PenTool size={16} /> Modo Edição
                                </span>
                                <button
                                    onClick={toggleEditMode}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isEditMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEditMode ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        </div>
                        )}

                        {/* Menu Items */}
                        <button
                            onClick={() => { navigate('/sysadmin/config?tab=profile'); setIsProfileOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                            <User size={16} /> Meu Perfil
                        </button>
                        
                        <button
                            onClick={() => { navigate('/admin/config'); setIsProfileOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                            <Settings size={16} /> Configurações
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 mt-1 border-t border-gray-100 dark:border-gray-700"
                        >
                            <LogOut size={16} /> {isSysAdmin && tenant ? 'Sair do Tenant' : 'Sair'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopHeaderActions;
