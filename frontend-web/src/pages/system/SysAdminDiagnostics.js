import React, { useState } from 'react';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import { PlayIcon, CheckCircleIcon, XCircleIcon, CommandLineIcon } from '@heroicons/react/24/outline';

export default function SysAdminDiagnostics() {
    const [statusData, setStatusData] = useState(null);
    const [isPolling, setIsPolling] = useState(false);

    // Polling Logic
    useEffect(() => {
        let interval;
        if (isPolling) {
            fetchStatus(); // Immediate check
            interval = setInterval(fetchStatus, 2000);
        }
        return () => clearInterval(interval);
    }, [isPolling]);

    const fetchStatus = async () => {
        try {
            const { data } = await sysAdminApiClient.get('/sysadmin/health/status');
            setStatusData(data);

            if (data.status === 'finished' || data.status === 'error') {
                setIsPolling(false);
            } else if (data.status === 'running') {
                setIsPolling(true); // Ensure polling stays on if we re-loaded page
            }
        } catch (error) {
            console.error("Error fetching status:", error);
            setIsPolling(false);
        }
    };

    const runDiagnostics = async () => {
        try {
            setIsPolling(true);
            setStatusData(prev => ({ ...prev, status: 'starting' })); // Optimistic UI
            await sysAdminApiClient.post('/sysadmin/health/run');
        } catch (error) {
            if (error.response && error.response.status === 409) {
                // Already running, just start polling
                setIsPolling(true);
            } else {
                alert("Erro ao iniciar teste: " + error.message);
                setIsPolling(false);
            }
        }
    };

    const downloadLog = async () => {
        try {
            const response = await sysAdminApiClient.get('/sysadmin/health/download-log', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `stress_test_${new Date().getTime()}.txt`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            alert("Erro ao baixar log.");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold dark:text-white mb-2">Diagnóstico Avançado & Stress Test</h1>
            <p className="text-gray-500 mb-6">Validação completa de infraestrutura, incluindo inserção de 10k itens e simulação de carga.</p>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center dark:text-white">
                        <CommandLineIcon className="w-5 h-5 mr-2" />
                        Painel de Controle
                    </h2>
                    <div className="flex space-x-3">
                        {statusData?.status === 'finished' && (
                            <button
                                onClick={downloadLog}
                                className="flex items-center px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Baixar Relatório (.txt)
                            </button>
                        )}

                        <button
                            onClick={runDiagnostics}
                            disabled={isPolling || statusData?.status === 'running'}
                            className={`flex items-center px-4 py-2 rounded text-white font-medium transition-colors ${isPolling || statusData?.status === 'running'
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {isPolling || statusData?.status === 'running' ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span> Teste em Andamento...
                                </>
                            ) : (
                                <>
                                    <PlayIcon className="w-5 h-5 mr-2" /> Iniciar Teste Completo
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Progress Bar (Overall) */}
                {statusData && (
                    <div className="mb-8">
                        <div className="flex justify-between text-sm mb-1 text-gray-600 dark:text-gray-400">
                            <span>Progresso Global</span>
                            <span>{statusData.progress_percent || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${statusData.progress_percent || 0}%` }}></div>
                        </div>
                    </div>
                )}

                {/* Steps List */}
                <div className="space-y-3">
                    {statusData?.steps?.map((step, idx) => (
                        <div key={idx} className="flex items-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                            <div className="mr-4">
                                {step.status === 'pending' && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                                {step.status === 'running' && <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                                {step.status === 'done' && <CheckCircleIcon className="w-6 h-6 text-green-500" />}
                                {step.status === 'error' && <XCircleIcon className="w-6 h-6 text-red-500" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <h4 className={`font-semibold ${step.status === 'running' ? 'text-blue-600' : 'text-gray-800 dark:text-gray-200'}`}>
                                        {step.name}
                                    </h4>
                                    {step.duration && (
                                        <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                            {step.duration}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{step.details}</p>
                            </div>
                        </div>
                    ))}

                    {!statusData && !isPolling && (
                        <div className="text-center py-10 text-gray-500">
                            Nenhum teste executado recentemente.
                        </div>
                    )}
                </div>

                {/* Live Logs */}
                {statusData?.logs?.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Logs em Tempo Real</h3>
                        <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-lg h-60 overflow-y-auto shadow-inner">
                            {statusData.logs.map((log, index) => (
                                <div key={index} className="border-b border-gray-800/50 pb-1 last:border-0 opacity-90">
                                    {log}
                                </div>
                            ))}
                            {/* Auto-scroll anchor if needed */}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
