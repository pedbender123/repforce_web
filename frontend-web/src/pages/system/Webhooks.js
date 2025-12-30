
import React, { useState, useEffect } from 'react';
import api from '../../api/apiClient';
import SkeletonList from '../../components/common/SkeletonList';

export default function Webhooks() {
    const [hooks, setHooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ event_type: '', target_url: '' });

    useEffect(() => {
        loadHooks();
    }, []);

    const loadHooks = async () => {
        try {
            const res = await api.get('/webhooks');
            setHooks(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/webhooks', { ...formData, active: true });
            setFormData({ event_type: '', target_url: '' });
            loadHooks();
        } catch (error) {
            alert('Error saving webhook');
        }
    };

    const handleDelete = async (eventType) => {
        if (!window.confirm('Delete?')) return;
        try {
            await api.delete(`/webhooks/${eventType}`);
            loadHooks();
        } catch (error) {
            alert('Error deleting');
        }
    };

    if (loading) return <div className="p-6"><SkeletonList rows={3} /></div>;

    return (
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Integração de Eventos (Webhooks)</h1>

            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-6 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Adicionar Assinatura</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Evento</label>
                        <select
                            value={formData.event_type}
                            onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">Selecione um evento...</option>
                            <option value="client.created">Cliente Criado (client.created)</option>
                            <option value="client.updated">Cliente Atualizado (client.updated)</option>
                            <option value="order.created">Pedido Criado (order.created)</option>
                            <option value="order.updated">Pedido Atualizado (order.updated)</option>
                            <option value="order.status_changed">Status do Pedido Alterado</option>
                        </select>
                    </div>
                    <div className="sm:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL de Destino (n8n)</label>
                        <div className="flex">
                            <input
                                type="url"
                                placeholder="http://n8n:5678/webhook/..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={formData.target_url}
                                onChange={e => setFormData({ ...formData, target_url: e.target.value })}
                                required
                            />
                            <button type="submit" className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                Salvar
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Evento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">URL</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {hooks.map((hook) => (
                            <tr key={hook.event_type}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{hook.event_type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{hook.target_url}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleDelete(hook.event_type)} className="text-red-600 hover:text-red-900">Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
