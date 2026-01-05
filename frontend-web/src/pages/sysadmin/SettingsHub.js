import React, { useState, useEffect } from 'react';
import { User, Activity, CheckSquare, Server } from 'lucide-react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import apiClient from '../../api/apiClient';
import UserManagement from './components/UserManagement';
import RoleManagement from './components/RoleManagement';

// Sub-components (could be separate files, consolidated here for now)
const GeneralSettings = () => (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Geral</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Informações globais do sistema.
            </p>
        </div>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Sistema</label>
                <div className="mt-1">
                    <input type="text" disabled value="RepForce SaaS" className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                </div>
            </div>
        </div>
    </div>
);

const ProfileSettings = () => (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Meu Perfil</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gerencie suas credenciais de superusuário.
            </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
            <div className="flex">
                <div className="flex-shrink-0">
                    <User className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Atenção</h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                        <p>Alterações aqui afetam o acesso global ao sistema.</p>
                    </div>
                </div>
            </div>
        </div>
        {/* Change Password Form Mockup */}
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nova Senha</label>
                <div className="mt-1">
                    <input type="password" className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white" />
                </div>
            </div>
            <div className="sm:col-span-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Salvar Alterações</button>
            </div>
        </div>
    </div>
);

const SystemDiagnostics = () => (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Diagnóstico do Sistema</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Status dos serviços vitais.
            </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Server className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-3 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-green-900 dark:text-green-300 truncate">API Backend</dt>
                            <dd>
                                <div className="text-lg font-medium text-green-900 dark:text-green-100">Operacional</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-3 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-green-900 dark:text-green-300 truncate">Database (PostgreSQL)</dt>
                            <dd>
                                <div className="text-lg font-medium text-green-900 dark:text-green-100">Conectado</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const CompletedTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompleted = async () => {
            try {
                const { data } = await apiClient.get('/v1/sysadmin/tasks?completed=true');
                setTasks(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCompleted();
    }, []);

    if (loading) return <div className="text-center">Carregando histórico...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Histórico de Tarefas</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Tarefas marcadas como concluídas.
                </p>
            </div>
            <div className="bg-white dark:bg-gray-800 overflow-hidden sm:rounded-md border border-gray-200 dark:border-gray-700">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {tasks.length === 0 ? (
                        <li className="p-4 text-center text-gray-500 text-sm">Nenhuma tarefa concluída encontrada.</li>
                    ) : (
                        tasks.map((task) => (
                            <li key={task.id} className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-blue-600 truncate">{task.title}</p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Concluída
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            {task.description}
                                        </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                        <p>
                                            Em {new Date(task.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};

export default function SettingsHub() {
    const [activeTab, setActiveTab] = useState('users');

    const tabs = [
        { id: 'users', name: 'Usuários Globais', icon: User },
        { id: 'roles', name: 'Controle de Acesso', icon: CheckSquare },
        { id: 'general', name: 'Geral', icon: BuildingOfficeIcon },
        { id: 'profile', name: 'Meu Perfil', icon: User },
        { id: 'diagnostics', name: 'Diagnóstico', icon: Activity },
        { id: 'tasks', name: 'Histórico de Tarefas', icon: CheckSquare },
    ];

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Configurações
                    </h2>
                </div>
            </div>

            <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
                <aside className="py-6 px-2 sm:px-6 lg:col-span-3 lg:py-0 lg:px-0 bg-white dark:bg-gray-800 rounded-lg shadow min-h-[500px]">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    group flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 transition-colors
                                    ${activeTab === tab.id
                                        ? 'bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-100'
                                        : 'border-transparent text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}
                                `}
                            >
                                <tab.icon
                                    className={`
                                        flex-shrink-0 -ml-1 mr-3 h-6 w-6 
                                        ${activeTab === tab.id ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}
                                    `}
                                    aria-hidden="true"
                                />
                                <span className="truncate">{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                <div className="space-y-6 sm:px-6 lg:col-span-9 lg:px-0">
                    <div className="bg-white dark:bg-gray-800 shadow sm:rounded-md p-6 min-h-[500px]">
                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'roles' && <RoleManagement />}
                        {activeTab === 'general' && <GeneralSettings />}
                        {activeTab === 'profile' && <ProfileSettings />}
                        {activeTab === 'diagnostics' && <SystemDiagnostics />}
                        {activeTab === 'tasks' && <CompletedTasks />}
                    </div>
                </div>
            </div>
        </div>
    );
}
