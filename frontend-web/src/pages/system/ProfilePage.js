import React, { useContext } from 'react';
import { SysAdminAuthContext } from '../../context/SysAdminAuthContext';
import { User, Shield, Key } from 'lucide-react';

const ProfilePage = () => {
    const { user } = useContext(SysAdminAuthContext);

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="bg-blue-600 h-32"></div>
                <div className="px-6 -mt-12 flex flex-col md:flex-row items-center md:items-end">
                    <div className="h-24 w-24 rounded-full bg-white p-1 shadow-lg">
                        <div className="h-full w-full rounded-full bg-blue-500 text-white flex items-center justify-center text-3xl font-bold">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-4 text-center md:text-left mb-4">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{user?.name}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username || 'sysadmin'}</p>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                                <Shield className="mr-2" size={20} /> Informações de Acesso
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium mr-2">Cargo:</span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{user?.role_name || 'SysAdmin'}</span>
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    <span className="font-medium mr-2">Tenant:</span>
                                    Systems (Global)
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                                <Key className="mr-2" size={20} /> Segurança
                            </h3>
                            <button className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:shadow-sm transition-shadow">
                                <span className="block text-sm font-medium text-gray-900 dark:text-white">Alterar Senha</span>
                                <span className="block text-xs text-gray-500 mt-1">Atualize sua senha de acesso periodicamente.</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
