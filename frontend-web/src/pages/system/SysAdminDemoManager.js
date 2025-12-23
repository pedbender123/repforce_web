import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import { Play, StopCircle, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const SysAdminDemoManager = () => {
    const queryClient = useQueryClient();
    const [selectedTenant, setSelectedTenant] = useState('');
    const [feedback, setFeedback] = useState(null);

    // Fetch Tenants
    const { data: tenants, isLoading } = useQuery({
        queryKey: ['sysadmin-tenants'],
        queryFn: async () => {
            const res = await sysAdminApiClient.get('/sysadmin/tenants');
            return res.data;
        }
    });

    // Start Demo Mutation
    const startDemoMutation = useMutation({
        mutationFn: async (tenantId) => {
            const res = await sysAdminApiClient.post(`/sysadmin/demo/${tenantId}/start`);
            return res.data;
        },
        onSuccess: (data) => {
            setFeedback({ type: 'success', message: 'Modo Demo ativado! Dados de exemplo gerados.' });
            queryClient.invalidateQueries(['sysadmin-tenants']);
        },
        onError: (err) => {
            setFeedback({ type: 'error', message: `Erro ao ativar demo: ${err.message}` });
        }
    });

    // Stop Demo Mutation
    const stopDemoMutation = useMutation({
        mutationFn: async (tenantId) => {
            const res = await sysAdminApiClient.post(`/sysadmin/demo/${tenantId}/stop`);
            return res.data;
        },
        onSuccess: (data) => {
            setFeedback({ type: 'info', message: 'Modo Demo encerrado. Dados limpos!' });
            queryClient.invalidateQueries(['sysadmin-tenants']);
        },
        onError: (err) => {
            setFeedback({ type: 'error', message: `Erro ao parar demo: ${err.message}` });
        }
    });

    const handleStart = (tenantId) => {
        if (window.confirm("Atenção: Isso irá popular o tenant com dados de teste. Continuar?")) {
            startDemoMutation.mutate(tenantId);
        }
    };

    const handleStop = (tenantId) => {
        if (window.confirm("CUIDADO: Isso APAGARÁ todos os dados criados desde o início da demonstração. Tem certeza?")) {
            stopDemoMutation.mutate(tenantId);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando tenants...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                        <Play size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gerenciador de Demonstrações</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Ative o "Modo Demo" em tenants para preencher o banco com dados fictícios (Clientes, Produtos, Pedidos).
                            <br />
                            <span className="text-red-500 font-medium">Importante:</span> Ao encerrar a demo, TODO o conteúdo criado durante o período será apagado.
                        </p>
                    </div>
                </div>
            </div>

            {feedback && (
                <div className={`p-4 rounded-md border flex items-center gap-2 ${feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                        feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                            'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                    {feedback.type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />}
                    {feedback.message}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Tenant</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">CNPJ</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {tenants?.map((tenant) => {
                            const isDemoActive = !!tenant.demo_mode_start;
                            return (
                                <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4 font-medium text-gray-800 dark:text-gray-200">
                                        {tenant.name}
                                        {isDemoActive && <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-bold">EM DEMO</span>}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">{tenant.cnpj}</td>
                                    <td className="p-4 text-sm">
                                        {isDemoActive ? (
                                            <div className="flex flex-col">
                                                <span className="text-purple-600 font-medium flex items-center gap-1">
                                                    <Play size={14} /> Ativo
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    Desde: {new Date(tenant.demo_mode_start).toLocaleString()}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">Normal</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {isDemoActive ? (
                                            <button
                                                onClick={() => handleStop(tenant.id)}
                                                disabled={stopDemoMutation.isPending}
                                                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
                                            >
                                                {stopDemoMutation.isPending ? <RefreshCw className="animate-spin" size={16} /> : <StopCircle size={16} />}
                                                Encerrar Demo
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStart(tenant.id)}
                                                disabled={startDemoMutation.isPending}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
                                            >
                                                {startDemoMutation.isPending ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                                                Iniciar Demo
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SysAdminDemoManager;
