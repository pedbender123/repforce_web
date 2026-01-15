import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProvisioningScreen = () => {
    const { user, refreshUser, logout } = useAuth();

    useEffect(() => {
        const interval = setInterval(() => {
            refreshUser();
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [refreshUser]);

    if (user?.tenant?.status === 'active') {
        // Logic in parent component should handle redirect/unmounting this screen
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 px-4">
            <div className="text-center max-w-md">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Preparando seu Ambiente
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Estamos configurando o banco de dados exclusivo da <strong>{user?.tenant?.name}</strong>.
                    Isso pode levar alguns instantes.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-8 overflow-hidden relative">
                    <div className="bg-blue-600 h-2.5 rounded-full w-full animate-progress-indeterminate"></div>
                </div>

                <button
                    onClick={logout}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                    Cancelar e Sair
                </button>
            </div>
            <style jsx>{`
                @keyframes progress-indeterminate {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-progress-indeterminate {
                    animation: progress-indeterminate 2s infinite linear;
                }
            `}</style>
        </div>
    );
};

export default ProvisioningScreen;
