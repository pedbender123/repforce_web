import React, { useState } from 'react';
import { XCircleIcon, ClipboardDocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ErrorDialog({ isOpen, onClose, title = "Erro na Operação", message }) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                {/* Modal panel */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                                <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                    {title}
                                </h3>
                                <div className="mt-2 text-left">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        Copie o erro abaixo para enviar ao suporte:
                                    </p>
                                    <div className="relative">
                                        <textarea 
                                            readOnly 
                                            value={message} 
                                            className="w-full h-32 p-2 text-xs font-mono bg-gray-50 dark:bg-gray-900 text-red-800 dark:text-red-300 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none resize-none"
                                        />
                                        <button 
                                            onClick={handleCopy}
                                            className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors"
                                            title="Copiar"
                                        >
                                            <ClipboardDocumentIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        </button>
                                    </div>
                                    {copied && <p className="text-xs text-green-600 mt-1 font-bold text-right">Copiado!</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button 
                            type="button" 
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
