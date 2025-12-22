import React, { useContext } from 'react';
import { SysAdminAuthContext } from '../../context/SysAdminAuthContext';
import { User, Shield, Key, ArrowLeft, Mail, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
    const { user } = useContext(SysAdminAuthContext);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header da Página - Estilo ConfigPage */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center gap-4">
                <Link to="/sysadmin/dashboard" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Meu Perfil</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie suas informações pessoais e credenciais de acesso.</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* User Card */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                        <div className="bg-blue-600 h-32"></div>
                        <div className="px-6 -mt-12 flex flex-col md:flex-row items-center md:items-end">
                            <div className="h-24 w-24 rounded-full bg-white p-1 shadow-lg">
                                <div className="h-full w-full rounded-full bg-blue-500 text-white flex items-center justify-center text-3xl font-bold uppercase">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            </div>
                            <div className="mt-4 md:mt-0 md:ml-4 text-center md:text-left mb-4 flex-1">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{user?.name}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center md:justify-start mt-1">
                                    <Mail size={14} className="mr-1" />
                                    {user?.email || `admin@${user?.username || 'sys'}.com`}
                                </p>
                            </div>
                            <div className="mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {user?.role_name || 'SysAdmin'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Informações de Acesso */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center mb-4">
                                <Shield className="mr-2 text-blue-500" size={20} />
                                Detalhes da Conta
                            </h3>

                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</span>
                                        <span className="text-sm font-mono text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                                            @{user?.username || 'sysadmin'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Nível de Acesso</span>
                                        <span className="text-sm text-gray-800 dark:text-gray-200">Total (Superusuário)</span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                    <div className="flex items-start">
                                        <Building className="mt-0.5 mr-2 text-gray-400" size={16} />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Escopo do Sistema</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Como SysAdmin, você tem visibilidade sobre todos os Tenants e configurações globais.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Segurança */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center mb-4">
                                <Key className="mr-2 text-yellow-500" size={20} />
                                Segurança e Senha
                            </h3>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Para sua segurança, recomendamos alterar sua senha periodicamente e não compartilhá-la com ninguém.
                                </p>

                                <button className="w-full group flex items-center justify-between p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-sm transition-all">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            <Key size={20} />
                                        </div>
                                        <div className="ml-3 text-left">
                                            <span className="block text-sm font-medium text-gray-900 dark:text-white">Alterar Senha</span>
                                            <span className="block text-xs text-gray-500 dark:text-gray-400">Atualizar credenciais de acesso</span>
                                        </div>
                                    </div>
                                    <ArrowLeft className="transform rotate-180 text-gray-400 group-hover:text-blue-500 transition-colors" size={20} />
                                </button>

                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-xs text-blue-700 dark:text-blue-300 flex items-start">
                                    <Shield size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                                    Suas ações administrativas são registradas em log para fins de auditoria.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
