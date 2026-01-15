import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { Layout, List, FileText, CheckCircle } from 'lucide-react';

const PageWizard = ({ isOpen, onClose, groupId, onPageCreated }) => {
    const [step, setStep] = useState(1);
    const [pageData, setPageData] = useState({
        name: '',
        type: 'list',
        entity_id: ''
    });
    const [entities, setEntities] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchEntities();
            setStep(1);
            setPageData({ name: '', type: 'list', entity_id: '' });
        }
    }, [isOpen]);

    const fetchEntities = async () => {
        try {
            const { data } = await apiClient.get('/api/builder/entities');
            setEntities(data);
        } catch (error) {
            console.error("Erro ao buscar tabelas:", error);
        }
    };

    const handleCreate = async () => {
        if (!pageData.name || !groupId) return;

        try {
            await apiClient.post(`/api/builder/navigation/groups/${groupId}/pages`, {
                name: pageData.name,
                type: pageData.type,
                entity_id: pageData.entity_id || null,
                layout_config: {}, // Empty start
                order: 99 // Append to end
            });
            onPageCreated();
            onClose();
        } catch (error) {
            alert("Erro ao criar página: " + (error.response?.data?.detail || error.message));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 w-[500px] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold dark:text-white">Nova Página</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                {/* STEPS */}
                <div className="space-y-6">
                    
                    {/* 1. Basic Info */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome da Página</label>
                        <input 
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white"
                            placeholder="Ex: Meus Pedidos"
                            value={pageData.name}
                            onChange={e => setPageData({...pageData, name: e.target.value})}
                            autoFocus
                        />
                    </div>

                    {/* 2. Template Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Tipo de Página</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={() => setPageData({...pageData, type: 'list'})}
                                className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-all ${pageData.type === 'list' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'}`}
                            >
                                <List size={24} />
                                <span className="text-xs font-medium">Lista</span>
                            </button>
                            <button 
                                onClick={() => setPageData({...pageData, type: 'form'})}
                                className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-all ${pageData.type === 'form' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'}`}
                            >
                                <FileText size={24} />
                                <span className="text-xs font-medium">Formulário</span>
                            </button>
                            <button 
                                onClick={() => setPageData({...pageData, type: 'dashboard'})}
                                className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-all ${pageData.type === 'dashboard' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'}`}
                            >
                                <Layout size={24} />
                                <span className="text-xs font-medium">Dashboard</span>
                            </button>
                        </div>
                    </div>

                    {/* 3. Data Source */}
                    {pageData.type !== 'dashboard' && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fonte de Dados (Tabela)</label>
                            <select 
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-transparent dark:text-white"
                                value={pageData.entity_id}
                                onChange={e => setPageData({...pageData, entity_id: e.target.value})}
                            >
                                <option value="">Selecione uma tabela...</option>
                                {entities.map(ent => (
                                    <option key={ent.id} value={ent.id}>{ent.display_name} ({ent.slug})</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                Dados virão desta tabela criada no Database Builder.
                            </p>
                        </div>
                    )}

                </div>

                <div className="mt-8 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">Cancelar</button>
                    <button 
                        onClick={handleCreate} 
                        disabled={!pageData.name || (pageData.type !== 'dashboard' && !pageData.entity_id)}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <CheckCircle size={16} />
                        Criar Página
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PageWizard;
