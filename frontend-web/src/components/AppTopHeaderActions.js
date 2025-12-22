import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { Settings, LogOut, Sun, Moon } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const AppTopHeaderActions = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Helper to get initial
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    // Check if user is Admin (can see Config)
    const isAdmin = ['admin', 'manager', 'sysadmin'].includes(user?.profile);

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

            {/* Notifications */}
            <NotificationCenter />

            {/* Config Button (Only for Admins) */}
            {isAdmin && (
                <button
                    onClick={() => navigate('/admin/config')}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Configurações"
                >
                    <Settings size={20} />
                </button>
            )}

            {/* Profile Avatar */}
            <button
                onClick={() => navigate('/app/profile')}
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

export default AppTopHeaderActions;
