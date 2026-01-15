import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import apiClient from '../api/apiClient';

const NotificationPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch Tasks
    const fetchTasks = async () => {
        setLoading(true);
        try {
            // Lists pending tasks by default
            const { data } = await apiClient.get('/v1/sysadmin/tasks');
            setTasks(data);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        if (isOpen) {
            fetchTasks();
        }
    }, [isOpen]);

    const markAsCompleted = async (taskId) => {
        try {
            await apiClient.patch(`/v1/sysadmin/tasks/${taskId}`, { is_completed: true });
            // Remove from list
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (error) {
            console.error("Failed to mark finished", error);
        }
    };

    const unreadCount = tasks.length;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 relative rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Tarefas / Notificações"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-0 z-50 ring-1 ring-black ring-opacity-5 border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tarefas Pendentes</h3>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500 text-sm">Carregando...</div>
                        ) : tasks.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                Nenhuma tarefa pendente.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                {tasks.map((task) => (
                                    <li key={task.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex justify-between items-start group">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {task.title}
                                                </p>
                                                {task.description && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{task.description}</p>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => markAsCompleted(task.id)}
                                                className="text-gray-400 hover:text-green-500 transition-colors"
                                                title="Marcar como concluída"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        </div>
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

export default NotificationPanel;
