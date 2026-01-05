import React, { useState } from 'react';
import {
    Play,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Server,
    Database,
    Code
} from 'lucide-react';
import apiClient from '../../api/apiClient';

export default function SysAdminDiagnostics() {
    const [logs, setLogs] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [stats, setStats] = useState({ ok: 0, warn: 0, error: 0 });

    const runDiagnostics = async () => {
        setIsRunning(true);
        setLogs([]);
        setStats({ ok: 0, warn: 0, error: 0 });

        try {
            // Call the API
            const response = await apiClient.post('/sysadmin/diagnostics/run', {});
            const results = response.data;

            setLogs(results);

            // Calculate stats
            const newStats = results.reduce((acc, log) => {
                if (log.status === 'OK') acc.ok++;
                else if (log.status === 'WARN') acc.warn++;
                else acc.error++;
                return acc;
            }, { ok: 0, warn: 0, error: 0 });

            setStats(newStats);

        } catch (error) {
            console.error("Diagnostic Failed", error);
            setLogs([{
                category: "System",
                status: "CRITICAL",
                message: "Failed to execute diagnostics",
                details: error.message
            }]);
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

    const getStatusColor = (status) => {
        if (status === 'OK') return 'bg-green-50 text-green-700 border-green-200';
        if (status === 'WARN') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        return 'bg-red-50 text-red-700 border-red-200';
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Server className="h-6 w-6" />
                        Diagnóstico de Sistema (Deep Scan)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Verificação de integridade estrutural (Schema vs Model) e saúde do ambiente python.
                    </p>
                </div>

                <button
                    onClick={runDiagnostics}
                    disabled={isRunning}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all
            ${isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'}
          `}
                >
                    {isRunning ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                        <Play className="h-5 w-5" />
                    )}
                    {isRunning ? 'Executando...' : 'Iniciar Varredura'}
                </button>
            </div>

            {/* Stats Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Passou</p>
                        <p className="text-3xl font-bold text-green-600">{stats.ok}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-100" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Alertas</p>
                        <p className="text-3xl font-bold text-yellow-600">{stats.warn}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-100" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Erros</p>
                        <p className="text-3xl font-bold text-red-600">{stats.error}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-100" />
                </div>
            </div>

            {/* Logs View */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <Database className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Log de Verificação</h3>
                </div>

                {logs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Code className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhuma verificação executada ainda.</p>
                        <p className="text-sm">Clique em "Iniciar Varredura" para começar.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {logs.map((log, index) => (
                            <div k={index} className={`p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}>
                                <div className="mt-1 shrink-0">
                                    {getStatusIcon(log.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(log.status)}`}>
                                            {log.status}
                                        </span>
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {log.category}
                                        </span>
                                    </div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                        {log.message}
                                    </p>
                                    {log.details && log.details !== log.message && (
                                        <p className="mt-1 text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-900 p-2 rounded break-all">
                                            {log.details}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
