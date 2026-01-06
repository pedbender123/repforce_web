import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

import { Settings, LogOut, Sun, Moon, User, PenTool } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { useBuilder } from '../context/BuilderContext';

const TopHeaderActions = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { logout, user } = useContext(AuthContext);
    const { isEditMode, toggleEditMode } = useBuilder(); // Consume Builder Context
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Helper to get initial
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <div className="flex items-center space-x-3 ml-auto">
            {/* Builder Direct Access (Explicit) */}
            <button
                onClick={() => navigate('/app/editor/database')}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md text-sm font-medium transition-colors text-gray-700 dark:text-gray-200"
                title="Ir para o Construtor de Banco de Dados"
            >
                <PenTool size={16} />
                <span>Construtor</span>
            </button>

            {/* Edit Mode Toggle (Keep for Context Logic if needed, but made less prominent or removed if direct access is preferred. 
                User complained about "activating dev mode". Direct access is better. 
                Let's keep context logic but auto-activate on entering builder pages? 
                For now, let's keep the globally available toggle but make the direct link primary.
            */}

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Alternar Tema"
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notifications */}
            <NotificationCenter />

            {/* Config Button (Corrected Route) */}
            <button
                onClick={() => navigate('/admin/config')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Configurações"
            >
                <Settings size={20} />
            </button>

            {/* Profile Avatar */}
            <button
                onClick={() => navigate('/sysadmin/config?tab=profile')}
                className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow hover:bg-blue-700 transition-colors"
                title="Perfil"
            >
                {initial}
            </button>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Sair"
            >
                <LogOut size={20} />
            </button>
        </div>
    );
};

export default TopHeaderActions;
