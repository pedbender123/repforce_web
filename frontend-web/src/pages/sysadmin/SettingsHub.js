import React, { useState, useEffect } from 'react';
import { User, Activity, CheckSquare, Server, Settings, Play, CheckCircle, AlertTriangle, XCircle, Code, DollarSign, Layout } from 'lucide-react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import apiClient from '../../api/apiClient';
import UserManagement from './components/UserManagement';
import RoleManagement from './components/RoleManagement';
import TenantManagement from './components/TenantManagement';

// --- SUB-COMPONENTS ---

const GeneralSettings = () => (
    <div className="space-y-6">
        <div>
            <h3 className="text-xl font-bold dark:text-white">Geral</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Informações globais da plataforma Repforce.
            </p>
        </div>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Nome do Sistema</label>
                <div className="mt-1">
                    <input type="text" disabled value="RepForce SaaS v2.1" className="block w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-sm sm:text-sm dark:text-white p-3 border" />
                </div>
            </div>
        </div>
    </div>
);

const BillingModule = () => (
    <div className="space-y-6">
        <div>
            <h3 className="text-xl font-bold dark:text-white">Faturamento & Planos</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gestão de assinaturas e créditos globais.
            </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-2xl border border-blue-100 dark:border-blue-800 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100">Módulo de Faturamento Integrado</h4>
            <p className="text-blue-700 dark:text-blue-300 text-sm max-w-md mx-auto mt-2">
                A gestão de faturamento agora será centralizada via engine de Stripe. 
                Configure suas chaves API no `.env` para habilitar a automação.
            </p>
        </div>
    </div>
);

const RealDiagnostics = () => {
    const [logs, setLogs] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [stats, setStats] = useState({ ok: 0, warn: 0, error: 0 });

    const runDiagnostics = async () => {
        setIsRunning(true);
        setLogs([]);
        setStats({ ok: 0, warn: 0, error: 0 });
        try {
            const response = await apiClient.post('/v1/sysadmin/diagnostics/run', {});
            const results = response.data;
            setLogs(results);
            const newStats = results.reduce((acc, log) => {
                if (log.status === 'OK') acc.ok++;
                else if (log.status === 'WARN') acc.warn++;
                else acc.error++;
                return acc;
            }, { ok: 0, warn: 0, error: 0 });
            setStats(newStats);
        } catch (error) {
            console.error("Diagnostic Failed", error);
            setLogs([{ category: "System", status: "CRITICAL", message: "Failed to execute diagnostics", details: error.message }]);
            setStats({ ok: 0, warn: 0, error: 1 });
        } finally {
            setIsRunning(false);
        }
    };

    const getStatusIcon = (status) => {
        if (status === 'OK') return <CheckCircle className="h-5 w-5 text-green-500" />;
        if (status === 'WARN') return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        return <XCircle className="h-5 w-5 text-red-500" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Saúde do Sistema
                    </h3>
                    <p className="text-sm text-gray-500">Varredura profunda de infraestrutura.</p>
                </div>
                <button
                    onClick={runDiagnostics}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-6 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {isRunning ? <Loader2 className="animate-spin h-5 w-5" /> : <Play className="h-5 w-5" />}
                    {isRunning ? 'Verificando...' : 'Iniciar Scan'}
                </button>
            </div>

            {logs.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 flex justify-between items-center">
                        <span className="text-green-700 font-bold">OK</span>
                        <span className="text-2xl font-black text-green-800">{stats.ok}</span>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800 flex justify-between items-center">
                        <span className="text-yellow-700 font-bold">Alertas</span>
                        <span className="text-2xl font-black text-yellow-800">{stats.warn}</span>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 flex justify-between items-center">
                        <span className="text-red-700 font-bold">Erros</span>
                        <span className="text-2xl font-black text-red-800">{stats.error}</span>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                    {logs.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Code className="mx-auto h-12 w-12 mb-4 opacity-10" />
                            Aguardando comando de varredura...
                        </div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                                {getStatusIcon(log.status)}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black uppercase text-gray-400">{log.category}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{log.message}</p>
                                    {log.details && <p className="text-xs font-mono text-gray-500 mt-1">{log.details}</p>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const CompletedTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/v1/sysadmin/tasks?completed=true')
            .then(res => setTasks(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center p-12 text-gray-400"><Loader2 className="animate-spin inline mr-2"/> Carregando histórico...</div>;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold dark:text-white">Tarefas Concluídas</h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <ul className="divide-y divide-gray-50 dark:divide-gray-700">
                    {tasks.length === 0 ? (
                        <li className="p-12 text-center text-gray-400">Nenhum histórico disponível.</li>
                    ) : (
                        tasks.map((task) => (
                            <li key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-gray-800 dark:text-white">{task.title}</h4>
                                    <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase rounded-full border border-green-100">Finalizada</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{task.description}</p>
                                <span className="text-[10px] text-gray-400 font-medium tracking-widest">{new Date(task.created_at).toLocaleDateString()}</span>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};

export default function SettingsHub() {
    const [activeTab, setActiveTab] = useState('tenants');

    const tabs = [
        { id: 'tenants', name: 'Controle de Clientes', icon: BuildingOfficeIcon },
        { id: 'users', name: 'Usuários Mestres', icon: User },
        { id: 'roles', name: 'Níveis de Acesso', icon: CheckSquare },
        { id: 'billing', name: 'Faturamento SaaS', icon: DollarSign },
        { id: 'diagnostics', name: 'Saúde & Logs', icon: Activity },
        { id: 'tasks', name: 'Task History', icon: CheckSquare },
        { id: 'general', name: 'Configurações', icon: Settings },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Removed */}
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Navigation Sidebar */}
                <aside className="lg:col-span-3">
                    <nav className="flex flex-col gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all
                                    ${activeTab === tab.id
                                        ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-200 dark:shadow-none'
                                        : 'text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}
                                `}
                            >
                                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Dynamic Content Panel */}
                <div className="lg:col-span-9">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 min-h-[600px]">
                        {activeTab === 'tenants' && <TenantManagement />}
                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'roles' && <RoleManagement />}
                        {activeTab === 'billing' && <BillingModule />}
                        {activeTab === 'diagnostics' && <RealDiagnostics />}
                        {activeTab === 'tasks' && <CompletedTasks />}
                        {activeTab === 'general' && <GeneralSettings />}
                    </div>
                </div>
            </div>
        </div>
    );
}

const Loader2 = ({ className }) => <Activity className={className} />;
