import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';

const NotificationPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Mock Notifications
    const notifications = [
        { id: 1, title: 'Bem-vindo ao RepForce', time: 'Agora', read: false },
        { id: 2, title: 'Sistema atualizado para v2.1', time: '10 min', read: false },
        { id: 3, title: 'Backup realizado com sucesso', time: '1 h', read: true }
    ];

    const unreadCount = notifications.filter(n => !n.read).length;

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
                title="Notificações"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-0 z-50 ring-1 ring-black ring-opacity-5 border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notificações</h3>
                        <span className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                            Marcar lidas
                        </span>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                Nenhuma notificação.
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                {notifications.map((notif) => (
                                    <li key={notif.id} className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {notif.title}
                                            </p>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{notif.time}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 text-center">
                        <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                            Ver todas as notificações
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
