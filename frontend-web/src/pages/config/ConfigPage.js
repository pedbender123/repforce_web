import React, { useState } from 'react';
import { Users, Shield } from 'lucide-react';

// Tabs
import SysAdminAllUserManagement from '../system/SysAdminAllUserManagement';
import SysAdminRoleManagement from '../system/SysAdminRoleManagement';

const ConfigPage = () => {
    const [activeTab, setActiveTab] = useState('users');

    const tabs = [
        { id: 'users', label: 'Gestão de Usuários', icon: <Users size={20} /> },
        { id: 'roles', label: 'Cargos e Permissões', icon: <Shield size={20} /> },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header da Config - Tela Cheia Style */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configurações do Sistema</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie usuários globais, permissões e parâmetros do sistema.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium transition-colors ${activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'users' && <SysAdminAllUserManagement />}
                {activeTab === 'roles' && <SysAdminRoleManagement />}
            </div>
        </div>
    );
};

export default ConfigPage;
