import React from 'react';
import { X, Info } from 'lucide-react';

const GenericFicha = ({ title, data, onClose, icon: Icon = Info }) => {
    return (
        <div className="absolute inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-700">
                <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-gray-50 dark:bg-gray-800">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Icon className="w-5 h-5 text-blue-500" /> {title}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-8">
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl overflow-x-auto text-xs text-gray-600 dark:text-gray-300 font-mono">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                    <p className="mt-4 text-center text-gray-400 text-sm">Ficha Detalhada em Desenvolvimento</p>
                </div>
            </div>
        </div>
    );
};

export default GenericFicha;
