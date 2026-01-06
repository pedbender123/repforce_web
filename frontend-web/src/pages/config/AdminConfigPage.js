import React, { useState } from 'react';
import { Users, Shield, ArrowLeft, Ruler, Table2, Database } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

// Tabs
import AdminUserManagement from '../system/AdminUserManagement';
import DatabaseEditor from '../editor/DatabaseEditor';

const AdminConfigPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'users';

    const setActiveTab = (tab) => {
        setSearchParams({ tab });
    };

    const tabs = [
        { id: 'users', label: 'Usuários', icon: <Users size={20} /> },
        { id: 'database', label: 'Banco de Dados', icon: <Database size={20} /> },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header da Config */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center gap-4">
                <Link to="/admin/dashboard" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configurações da Empresa</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie usuários e estrutura de dados.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
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
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {activeTab === 'users' && (
                    <div className="p-6">
                        <AdminUserManagement />
                    </div>
                )}
                {activeTab === 'database' && (
                    <div className="h-full">
                        <DatabaseEditor />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminConfigPage;
