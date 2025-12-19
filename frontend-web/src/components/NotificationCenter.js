import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Info, AlertTriangle, Package, Map } from 'lucide-react';
import sysAdminApiClient from '../api/sysAdminApiClient';

const NotificationCenter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data } = await sysAdminApiClient.get('/crm/tasks?status=open');
            setTasks(data);
            setUnreadCount(data.length);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Poll every 30s or just once on mount
        fetchTasks();
        const interval = setInterval(fetchTasks, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleComplete = async (taskId) => {
        try {
            await sysAdminApiClient.patch(`/crm/tasks/${taskId}`, { status: 'completed' });
            setTasks(tasks.filter(t => t.id !== taskId));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to complete task", error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'error': return <AlertTriangle size={16} className="text-red-500" />;
            case 'order': return <Package size={16} className="text-blue-500" />;
            case 'route': return <Map size={16} className="text-green-500" />;
            default: return <Info size={16} className="text-gray-500" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Notificações</h3>
                        <button onClick={() => setIsOpen(false)}><X size={16} className="text-gray-400" /></button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading && tasks.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500">Carregando...</div>
                        ) : tasks.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500">Nenhuma notificação pendente.</div>
                        ) : (
                            <ul>
                                {tasks.map(task => (
                                    <li key={task.id} className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex items-start gap-3">
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(task.type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{task.title}</p>
                                            {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(task.created_at).toLocaleString()}</p>
                                        </div>
                                        <button
                                            onClick={() => handleComplete(task.id)}
                                            className="text-green-500 hover:bg-green-100 p-1 rounded transition-colors"
                                            title="Marcar como feito"
                                        >
                                            <Check size={16} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
