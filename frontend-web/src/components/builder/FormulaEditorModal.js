import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../api/apiClient';
import { Play, Clipboard, HelpCircle, X, ChevronRight, Calculator, ListTree } from 'lucide-react';

const FormulaEditorModal = ({ isOpen, onClose, formula, onSave, fields = [], entityId }) => {
    const [inputValue, setInputValue] = useState(formula || '');
    const [previewResult, setPreviewResult] = useState(null);
    const [functions, setFunctions] = useState([]);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [activeTab, setActiveTab] = useState('functions'); // 'functions' or 'columns'
    
    // Highlight colors
    const colors = {
        function: '#2563eb', // Blue
        column: '#ea580c',   // Orange
        string: '#16a34a',   // Green
        operator: '#4b5563'  // Gray
    };

    const textareaRef = useRef(null);
    const highlightRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setInputValue(formula || '');
            fetchFunctions();
        }
    }, [isOpen, formula]);

    useEffect(() => {
        // Debounced preview
        const timer = setTimeout(() => {
            if (inputValue) handlePreview();
        }, 800);
        return () => clearTimeout(timer);
    }, [inputValue]);

    const fetchFunctions = async () => {
        try {
            const { data } = await apiClient.get('/api/builder/formulas/functions');
            setFunctions(data);
        } catch (error) {
            console.error("Failed to fetch functions");
        }
    };

    const handlePreview = async () => {
        setIsLoadingPreview(true);
        try {
            const { data } = await apiClient.post('/api/builder/formulas/preview', {
                formula: inputValue,
                entity_id: entityId
            });
            setPreviewResult(data);
        } catch (error) {
            setPreviewResult({ success: false, result: "Erro na conexão" });
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const renderHighlighted = (text) => {
        if (!text) return null;

        // Custom Syntax Highlighting Logic
        // 1. Column brackets: [Column Name]
        // 2. Functions: NAME(
        // 3. Strings: "text" or 'text'
        
        const columnPattern = /\[([^\]]+)\]/g;
        const functionPattern = /\b([A-Z_]+)\(/g;
        const stringPattern = /("[^"]*"|'[^']*')/g;

        let parts = [];
        let lastIndex = 0;

        // Simplified approach: use a combined regex or nested replacements
        // For performance and clarity, let's just use a simple tokenizer-like loop if needed, 
        // but for now, let's use a more robust regex-based display.

        // Actually, the easiest way is to use a single regex with groups.
        const combinedPattern = /(".*?"|'.*?'|\[.*?\]|\b[A-Z_]+\b(?=\())/g;
        
        const splitText = text.split(combinedPattern);
        
        return splitText.map((part, i) => {
            if (!part) return null;
            
            if (part.startsWith('"') || part.startsWith("'")) {
                return <span key={i} style={{ color: colors.string }}>{part}</span>;
            }
            if (part.startsWith('[')) {
                return <span key={i} style={{ color: colors.column }} className="font-bold">{part}</span>;
            }
            if (functions.some(f => f.name === part)) {
                return <span key={i} style={{ color: colors.function }} className="font-black italic">{part}</span>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    const insertText = (textToInsert) => {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const newText = inputValue.substring(0, start) + textToInsert + inputValue.substring(end);
        setInputValue(newText);
        
        // Return focus and set cursor position
        setTimeout(() => {
            textareaRef.current.focus();
            const newPos = start + textToInsert.length;
            textareaRef.current.setSelectionRange(newPos, newPos);
        }, 10);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Calculator size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold dark:text-white">Editor de Expressões</h3>
                            <p className="text-xs text-gray-500">Sintaxe compatível com AppSheet</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar: Library */}
                    <div className="w-72 border-r border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 flex flex-col">
                        <div className="flex p-2 border-b border-gray-100 dark:border-gray-800">
                            <button 
                                onClick={() => setActiveTab('functions')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'functions' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 ring-1 ring-gray-200 dark:ring-gray-700' : 'text-gray-400 hover:text-gray-600'}`}>
                                FUNÇÕES
                            </button>
                            <button 
                                onClick={() => setActiveTab('columns')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'columns' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 ring-1 ring-gray-200 dark:ring-gray-700' : 'text-gray-400 hover:text-gray-600'}`}>
                                COLUNAS
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {activeTab === 'functions' ? (
                                functions.map(func => (
                                    <button 
                                        key={func.name}
                                        onClick={() => insertText(`${func.name}(`)}
                                        className="w-full text-left p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg group transition-all"
                                    >
                                        <div className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">{func.name}</div>
                                        <div className="text-[10px] text-gray-400 truncate">{func.syntax}</div>
                                    </button>
                                ))
                            ) : (
                                fields.map(field => (
                                    <button 
                                        key={field.name}
                                        onClick={() => insertText(`[${field.name}]`)}
                                        className="w-full text-left p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg group transition-all"
                                    >
                                        <div className="text-sm font-mono font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-1 transition-transform">[{field.name}]</div>
                                        <div className="text-[10px] text-gray-400 truncate">{field.label}</div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
                        {/* Highlights & Input */}
                        <div className="flex-1 relative font-mono p-6">
                            {/* The Highlight Layer */}
                            <div 
                                className="absolute inset-x-6 inset-y-6 pointer-events-none whitespace-pre-wrap break-words text-lg leading-relaxed z-0 dark:text-white"
                                style={{ color: 'transparent' }}
                            >
                                {renderHighlighted(inputValue)}
                            </div>
                            
                            {/* The Real Input Layer */}
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="absolute inset-x-6 inset-y-6 bg-transparent border-none outline-none resize-none text-lg leading-relaxed z-10 p-0 m-0 w-[calc(100%-48px)] h-[calc(100%-48px)] caret-blue-500 whitespace-pre-wrap break-words dark:text-gray-100"
                                style={{ color: 'transparent', caretColor: 'currentColor' }}
                                spellCheck="false"
                                placeholder="Digite sua expressão aqui... ex: IF([Status] = 'Active', 1, 0)"
                            />
                        </div>

                        {/* Footer Status / Validation */}
                        <div className="h-48 border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resultado do Teste</span>
                                {isLoadingPreview && <div className="animate-pulse flex gap-1 items-center text-xs text-blue-500"><Play size={10} fill="currentColor"/> Calculando...</div>}
                            </div>
                            
                            <div className={`flex-1 rounded-xl border flex flex-col justify-center items-center px-6 transition-all shadow-inner
                                ${!previewResult ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' :
                                  previewResult.success ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 
                                  'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'}`}
                            >
                                {!inputValue ? (
                                    <p className="text-gray-400 text-sm italic">Digite uma expressão para ver o resultado</p>
                                ) : (
                                    <div className="text-center">
                                        {previewResult?.success ? (
                                            <>
                                                <div className="text-2xl font-black text-green-700 dark:text-green-400">{previewResult.result ?? 'null'}</div>
                                                <div className="text-[10px] text-green-600 mt-1 uppercase font-bold tracking-tighter">Expressão Válida</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-sm font-mono text-red-600 dark:text-red-400 break-all">{previewResult?.result || 'Erro ao processar'}</div>
                                                <div className="text-[10px] text-red-500 mt-1 uppercase font-bold tracking-tighter">Sintaxe Inválida</div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-white dark:bg-gray-950">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={() => { onSave(inputValue); onClose(); }} 
                        className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                        Aplicar Expressão
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormulaEditorModal;
