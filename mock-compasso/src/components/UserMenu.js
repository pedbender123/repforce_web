import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, Moon, Sun, Settings } from 'lucide-react';

const UserMenu = ({ isSysAdmin = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { logout, user } = useContext(AuthContext); // Can be null if SysAdmin
    const navigate = useNavigate();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        if (isSysAdmin) {
            localStorage.removeItem('sysadmin_token');
            navigate('/login');
        } else {
            logout();
            navigate('/login');
        }
    };

    const handleProfile = () => {
        if (isSysAdmin) {
            navigate('/sysadmin/settings/profile'); // Assuming consolidated settings hub
        } else {
            navigate('/app/settings/profile');
        }
        setIsOpen(false);
    };

    // Initial
    const initial = isSysAdmin ? 'A' : (user?.name ? user.name.charAt(0).toUpperCase() : 'U');

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Menu do Usuário"
            >
                {initial}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5 border border-gray-100 dark:border-gray-700">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {isSysAdmin ? 'Administrador' : user?.name || 'Usuário'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {isSysAdmin ? 'SysAdmin' : user?.email}
                        </p>
                    </div>

                    <button
                        onClick={handleProfile}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                        <User size={16} />
                        Meu Perfil
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    </button>

                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                        <LogOut size={16} />
                        Sair
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
