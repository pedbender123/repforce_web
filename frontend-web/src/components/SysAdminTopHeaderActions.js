import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { Settings, LogOut, Sun, Moon, Bell } from 'lucide-react';

const SysAdminTopHeaderActions = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('sysadmin_token');
        navigate('/sysadmin/login');
    };

    return (
        <div className="flex items-center space-x-3 ml-auto">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Alternar Tema"
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notifications (Mock for SysAdmin for now) */}
            <button
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 relative"
                title="Notificações"
            >
                <Bell size={20} />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Global Config */}
            <button
                onClick={() => navigate('/sysadmin/config')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Configurações Globais"
            >
                <Settings size={20} />
            </button>

            {/* Profile Avatar (Admin) */}
            <button
                className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow hover:bg-blue-700 transition-colors"
                title="Perfil SysAdmin"
            >
                A
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

export default SysAdminTopHeaderActions;
