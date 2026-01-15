import React, { useState } from 'react';
import { X, Save, ArrowRight, Database, Zap, Calculator } from 'lucide-react';
import FormulaEditorModal from '../FormulaEditorModal';

const TrailNodeEditor = ({ node, previousNodes = [], onSave, onClose, isOpen }) => {
    const [label, setLabel] = useState(node?.data?.label || 'Nova Ação');
    const [contextSource, setContextSource] = useState(node?.data?.config?.context_source || 'TRIGGER'); // TRIGGER, PREVIOUS, MANUAL
    const [selectedPreviousNode, setSelectedPreviousNode] = useState(node?.data?.config?.context_node_id || '');
    const [manualFormula, setManualFormula] = useState(node?.data?.config?.record_id || '');
    const [isFormulaOpen, setIsFormulaOpen] = useState(false);

    // Dynamic Fields based on Action Type (Simplified for now)
    // We strictly focus on "Context ID" (The target record) logic here as requested.

    if (!isOpen) return null;

    const handleSave = () => {
        let recordIdExpression = '';
        
        if (contextSource === 'TRIGGER') {
            recordIdExpression = '{{trigger.record_id}}';
        } else if (contextSource === 'PREVIOUS') {
            recordIdExpression = `{{${selectedPreviousNode}.result_id}}`;
        } else {
            recordIdExpression = manualFormula;
        }

        const newConfig = {
            ...node.data.config,
            context_source: contextSource,
            context_node_id: selectedPreviousNode,
            record_id: recordIdExpression
        };

        onSave(node.id, {
            ...node.data,
            label,
            config: newConfig
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
                
                <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        Configurar Ação
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Passo</label>
                        <input 
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm font-medium focus:ring-2 ring-blue-500 outline-none dark:text-white"
                            placeholder="Ex: Atualizar Cliente"
                        />
                    </div>

                    {/* Smart Context Selector */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-3">
                            <Database size={16} className="text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-bold text-blue-800 dark:text-blue-300">Contexto do Registro</span>
                        </div>
                        
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg cursor-pointer border border-transparent hover:border-blue-300 transition-colors">
                                <input 
                                    type="radio" 
                                    name="context" 
                                    checked={contextSource === 'TRIGGER'} 
                                    onChange={() => setContextSource('TRIGGER')}
                                    className="accent-blue-600"
                                />
                                <div>
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Usar Registro do Gatilho</div>
                                    <div className="text-xs text-slate-400">Aplica a ação no registro que iniciou o fluxo</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg cursor-pointer border border-transparent hover:border-blue-300 transition-colors">
                                <input 
                                    type="radio" 
                                    name="context" 
                                    checked={contextSource === 'PREVIOUS'} 
                                    onChange={() => setContextSource('PREVIOUS')}
                                    className="accent-blue-600"
                                    disabled={previousNodes.length === 0}
                                />
                                <div className={previousNodes.length === 0 ? "opacity-50" : ""}>
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Usar Resultado Anterior</div>
                                    <div className="text-xs text-slate-400">Usa o ID criado/retornado por um passo anterior</div>
                                </div>
                            </label>

                            {contextSource === 'PREVIOUS' && (
                                <div className="ml-8">
                                    <select 
                                        value={selectedPreviousNode}
                                        onChange={e => setSelectedPreviousNode(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 ring-blue-500 outline-none dark:text-white"
                                    >
                                        <option value="" disabled>Selecione o passo...</option>
                                        {previousNodes.map(n => (
                                            <option key={n.id} value={n.id}>{n.data.label || n.id}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg cursor-pointer border border-transparent hover:border-blue-300 transition-colors">
                                <input 
                                    type="radio" 
                                    name="context" 
                                    checked={contextSource === 'MANUAL'} 
                                    onChange={() => setContextSource('MANUAL')}
                                    className="accent-blue-600"
                                />
                                <div>
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Expressão Manual</div>
                                    <div className="text-xs text-slate-400">Defina o ID usando uma fórmula personalizada</div>
                                </div>
                            </label>

                            {contextSource === 'MANUAL' && (
                                <div className="ml-8 flex gap-2">
                                    <input 
                                        value={manualFormula}
                                        onChange={e => setManualFormula(e.target.value)}
                                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm font-mono dark:text-white"
                                        placeholder="{{trigger.record_id}}"
                                    />
                                    <button 
                                        onClick={() => setIsFormulaOpen(true)}
                                        className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200"
                                    >
                                        <Calculator size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-sm font-bold transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                        <Save size={16} /> Salvar Configuração
                    </button>
                </div>
            </div>

            <FormulaEditorModal 
                isOpen={isFormulaOpen}
                onClose={() => setIsFormulaOpen(false)}
                formula={manualFormula}
                onSave={setManualFormula}
            />
        </div>
    );
};

export default TrailNodeEditor;
