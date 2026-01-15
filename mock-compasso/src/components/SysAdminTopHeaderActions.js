import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import UserMenu from './UserMenu';
import NotificationPanel from './NotificationPanel';

const SysAdminTopHeaderActions = () => {
    const navigate = useNavigate();

    return (
        <div className="flex items-center space-x-2 ml-auto">
            {/* Notification Panel */}
            <NotificationPanel />

            {/* Global Config */}
            <button
                onClick={() => navigate('/sysadmin/config')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Configurações Globais"
            >
                <Settings size={20} />
            </button>

            {/* User Menu (Profile, Theme, Logout) */}
            <div className="ml-2 border-l border-gray-200 dark:border-gray-700 pl-4">
                <UserMenu isSysAdmin={true} />
            </div>
        </div>
    );
};

export default SysAdminTopHeaderActions;
