import React, { useState } from 'react';
import apiClient from '../../api/apiClient';
import { PlayIcon, CheckCircleIcon, XCircleIcon, TerminalIcon } from '@heroicons/react/24/outline';

export default function SysAdminDiagnostics() {
    const [isRunning, setIsRunning] = useState(false);
    const [report, setReport] = useState(null);
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const runDiagnostics = async () => {
        setIsRunning(true);
        setReport(null);
        setLogs([]);
        addLog("Initializing System Health Check...");

        try {
            addLog("Contacting backend Probe...");
            const { data } = await apiClient.post('/sysadmin/health/run');

            addLog("Response received.");
            if (data.status === 'pass') {
                addLog("GLOBAL STATUS: PASS ✅");
            } else {
                addLog("GLOBAL STATUS: FAIL ❌");
            }

            data.checks.forEach(check => {
                addLog(`[${check.name}] ${check.status.toUpperCase()}: ${check.message}`);
            });

            setReport(data);

        } catch (error) {
            addLog(`ERROR: ${error.message}`);
            if (error.response) {
                addLog(`Server responded with: ${error.response.status}`);
            }
        } finally {
            setIsRunning(false);
            addLog("Diagnostics finished.");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold dark:text-white mb-2">Diagnóstico do Sistema</h1>
            <p className="text-gray-500 mb-6">Execute testes de integridade para verificar banco de dados, schemas e serviços essenciais.</p>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center dark:text-white">
                        <TerminalIcon className="w-5 h-5 mr-2" />
                        Console de Diagnóstico
                    </h2>
                    <button
                        onClick={runDiagnostics}
                        disabled={isRunning}
                        className={`flex items-center px-4 py-2 rounded text-white font-medium transition-colors ${isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isRunning ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span> Executando...
                            </>
                        ) : (
                            <>
                                <PlayIcon className="w-5 h-5 mr-2" /> Rodar Diagnóstico
                            </>
                        )}
                    </button>
                </div>

                {/* Terminal Output */}
                <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg h-96 overflow-y-auto shadow-inner border border-gray-700">
                    {logs.length === 0 ? (
                        <span className="text-gray-500 opacity-50">Pronto para iniciar. Clique em "Rodar Diagnóstico".</span>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} className="mb-1 border-b border-gray-800/50 pb-1 last:border-0">
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Results Summary (Only if Report exists) */}
            {report && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {report.checks.map((check, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border flex items-start ${check.status === 'pass'
                                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                            }`}>
                            {check.status === 'pass' ? (
                                <CheckCircleIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                            ) : (
                                <XCircleIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                            )}
                            <div>
                                <h4 className="font-bold text-sm">{check.name}</h4>
                                <p className="text-sm mt-1 opacity-90">{check.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
