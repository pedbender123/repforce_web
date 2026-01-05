import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Key, ArrowLeft, Mail, Building, Briefcase } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function ProfilePage() {
    const { user, refreshUser, isSysAdmin } = useAuth();
    const location = useLocation();

    if (!user) return <div className="p-8 text-center text-gray-500">Carregando dados do usuário...</div>;

    const stats = [
        { label: 'Papel', value: isSysAdmin ? 'Administrador Global' : (user.profile || 'Membro'), icon: Shield, color: 'text-blue-600' },
        { label: 'E-mail', value: user.username, icon: Mail, color: 'text-indigo-600' },
        { label: 'Empresas', value: user.memberships?.length || 0, icon: Building, color: 'text-purple-600' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {/* Header com breadcrumb simples se não estiver vindo de lugar específico */}
            <div className="flex items-center gap-4 py-4">
                <Link to={isSysAdmin ? '/sysadmin' : '/app'} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 ring-4 ring-blue-50 dark:ring-blue-900/10">
                            <User size={48} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.full_name || user.username}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                            {isSysAdmin ? 'SYS ADMIN' : 'USER'}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-repforce-primary to-blue-700 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="font-bold mb-2">Segurança RepForce</h3>
                        <p className="text-xs text-blue-100 leading-relaxed">
                            Sua conta está protegida por criptografia de ponta a ponta e autenticação JWT.
                        </p>
                    </div>
                </div>

                {/* Details Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-750 bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-gray-800 dark:text-white">Informações da Conta</h3>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                            {stats.map((stat) => (
                                <div key={stat.label} className="p-6 flex items-center gap-4">
                                    <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 ${stat.color}`}>
                                        <stat.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-tighter">{stat.label}</p>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800 dark:text-white">Ações Rápidas</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => alert("Alterar senha em breve")} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors dark:text-gray-200">
                                <Key size={16} /> Alterar Senha
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
