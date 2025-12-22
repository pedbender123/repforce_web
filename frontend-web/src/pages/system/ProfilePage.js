import React, { useContext } from 'react';
import { SysAdminAuthContext } from '../../context/SysAdminAuthContext';
import { AuthContext } from '../../context/AuthContext';
import { User, Shield, Key, ArrowLeft, Mail, Building, Briefcase } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const ProfilePage = () => {
    const location = useLocation();
    const isSysAdmin = location.pathname.includes('/sysadmin');

    // Hooks need to be unconditional, but we can selectively use data
    const sysAuth = useContext(SysAdminAuthContext);
    const appAuth = useContext(AuthContext);

    const user = isSysAdmin ? sysAuth.user : appAuth.user;
    const dashboardLink = isSysAdmin ? "/sysadmin/dashboard" : "/app/dashboard";

    // Tenant Banner Logic
    const tenantLogo = user?.tenant?.logo_url;
    const tenantName = user?.tenant?.name || "RepForce";

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header / Banner Area */}
            <div className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {/* Banner Background (Optional: Could be a cover image if we had one) */}
                <div className="h-32 w-full bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden relative">
                    {/* Abstract Shapes or Pattern */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                </div>

                {/* Main Info Layer */}
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-end -mt-12 pb-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="h-28 w-28 rounded-full bg-white dark:bg-gray-800 p-1.5 shadow-xl">
                                <div className="h-full w-full rounded-full bg-blue-500 text-white flex items-center justify-center text-4xl font-bold uppercase overflow-hidden">
                                    {/* If Tenant Logo exists and we are NOT SysAdmin (SysAdmin usually has no tenant logo context logic yet), use it? 
                                        Wait, user said: "No perfil do users coloque como baner, a logo do tenant dele."
                                        Let's put the tenant logo as a "Cover" or "Banner" element if possible, or alongside the user avatar.
                                        Let's try putting the logo in the banner area (top right) and keep User Avatar here.
                                     */}
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            </div>
                            <span className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-2 border-white dark:border-gray-800 bg-green-500" title="Online"></span>
                        </div>

                        <div className="mt-4 md:mt-0 md:ml-6 flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
                            <p className="text-gray-500 dark:text-gray-300 flex items-center justify-center md:justify-start mt-1 gap-4">
                                <span className="flex items-center"><Mail size={16} className="mr-1.5" /> {user?.email}</span>
                                {!isSysAdmin && user?.tenant && (
                                    <span className="flex items-center"><Briefcase size={16} className="mr-1.5" /> {user?.tenant?.name}</span>
                                )}
                            </p>
                        </div>

                        {/* Back Button */}
                        <div className="mb-1 md:mb-4 self-center md:self-end mt-4 md:mt-0">
                            <Link to={dashboardLink} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <ArrowLeft size={16} className="mr-2" />
                                Voltar ao Dashboard
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Tenant Logo Banner Overlay (The requested Feature) */}
                {!isSysAdmin && tenantLogo && (
                    <div className="absolute top-4 right-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 shadow-lg hidden md:block">
                        <img src={tenantLogo} alt="Tenant Logo" className="h-12 w-auto object-contain brightness-0 invert" />
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Informações de Acesso */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center mb-6">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg mr-4">
                                <Shield className="text-blue-600 dark:text-blue-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detalhes da Conta</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Suas permissões e identificação</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</span>
                                <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">@{user?.username || 'user'}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Perfil</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 uppercase">
                                    {user?.role_name || user?.profile || 'User'}
                                </span>
                            </div>
                            {/* Tenant Info */}
                            {!isSysAdmin && (
                                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</span>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{tenantName}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Segurança */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center mb-6">
                            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg mr-4">
                                <Key className="text-yellow-600 dark:text-yellow-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Segurança</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie suas credenciais</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                Para sua segurança, recomendamos utilizar uma senha forte e alterá-la periodicamente. Nunca compartilhe sua senha com terceiros.
                            </p>

                            <button className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all group">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">Alterar Senha</span>
                                <ArrowLeft className="transform rotate-180 text-gray-400 group-hover:text-blue-500" size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
