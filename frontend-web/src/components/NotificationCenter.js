import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Info, AlertTriangle, Package, Map, Link as LinkIcon } from 'lucide-react';
import apiClient from '../api/apiClient';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/v1/notifications/me?unread_only=true');
            setNotifications(data);
            setUnreadCount(data.length);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Poll every 60s
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (notifId) => {
        try {
            await apiClient.put(`/v1/notifications/${notifId}/read`);
            setNotifications(notifications.filter(n => n.id !== notifId));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleLinkClick = (resourceLink) => {
        if (!resourceLink) return;
        
        // Simple Link handling
        if (resourceLink.type === 'url') {
            window.open(resourceLink.path, '_blank');
        } else if (resourceLink.path) {
            navigate(resourceLink.path);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Notificações"
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
                        {loading && notifications.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500">Carregando...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500">Nenhuma notificação nova.</div>
                        ) : (
                            <ul>
                                {notifications.map(notif => (
                                    <li key={notif.id} className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-start gap-3 group">
                                        <div className="mt-1 flex-shrink-0">
                                            {notif.resource_link ? <LinkIcon size={16} className="text-blue-500" /> : <Info size={16} className="text-gray-500" />}
                                        </div>
                                        <div className="flex-1 cursor-default">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                {notif.title}
                                            </p>
                                            {notif.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.description}</p>}
                                            
                                            {notif.resource_link && (
                                                <button 
                                                    onClick={() => handleLinkClick(notif.resource_link)}
                                                    className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                >
                                                    Acessar Recurso <LinkIcon size={10} />
                                                </button>
                                            )}
                                            
                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                                        </div>
                                        <button
                                            onClick={() => markAsRead(notif.id)}
                                            className="text-gray-400 hover:text-green-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Marcar como lido"
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
