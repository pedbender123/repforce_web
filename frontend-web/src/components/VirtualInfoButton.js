import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

const VirtualInfoButton = ({ value, label }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!value) return null;

    return (
        <>
            <button 
                onClick={(e) => {
                    e.stopPropagation(); // Evita trigger da linha
                    setIsOpen(true);
                }}
                className="text-blue-500 hover:text-blue-700 transition-colors"
                title={label}
            >
                <Info size={18} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                                {label}
                            </h3>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto">
                            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap text-base leading-relaxed">
                                {value}
                            </p>
                        </div>
                        
                        {/* Footer */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 text-right rounded-b-lg">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VirtualInfoButton;
