import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, GitBranch, Zap, MoreHorizontal } from 'lucide-react';
import apiClient from '../../api/apiClient';

const TrailList = ({ onSelectTrail }) => {
    const navigate = useNavigate();
    const [trails, setTrails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // New Trail Form State
    const [newTrailName, setNewTrailName] = useState('');
    const [newTrailDesc, setNewTrailDesc] = useState('');

    useEffect(() => {
        fetchTrails();
    }, []);

    const fetchTrails = async () => {
        try {
            const { data } = await apiClient.get('/api/builder/trails');
            if (Array.isArray(data)) {
                setTrails(data);
            } else {
                console.warn("API returned invalid trails data:", data);
                setTrails([]);
            }
        } catch (error) {
            console.error("Error fetching trails", error);
            setTrails([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const { data } = await apiClient.post('/api/builder/trails', {
                name: newTrailName,
                description: newTrailDesc,
                trigger_type: 'MANUAL', // Default
                is_active: true
            });
            setTrails([...trails, data]);
            setIsCreating(false);
            setNewTrailName('');
            setNewTrailDesc('');
            
            if (onSelectTrail) {
                onSelectTrail(data);
            } else {
                navigate(`/app/editor/trails/${data.id}`);
            }
        } catch (error) {
            console.error("Error creating trail", error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir esta trilha?")) return;
        try {
            await apiClient.delete(`/api/builder/trails/${id}`);
            setTrails(trails.filter(t => t.id !== id));
        } catch (error) {
            console.error("Error deleting trail", error);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <GitBranch className="text-blue-500" />
                        Trilhas de Automação
                    </h1>
                    <p className="text-slate-500 mt-1">Gerencie fluxos de trabalho e automações do sistema.</p>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} /> Nova Trilha
                </button>
            </div>

            {/* Create Modal (Inline for simplicity) */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Nova Trilha</h2>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Trilha</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        value={newTrailName}
                                        onChange={e => setNewTrailName(e.target.value)}
                                        placeholder="Ex: Aprovação de Pedido"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                                    <textarea 
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        value={newTrailDesc}
                                        onChange={e => setNewTrailDesc(e.target.value)}
                                        placeholder="O que esta trilha faz?"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
                                >
                                    Criar Trilha
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            {isLoading ? (
                <div className="text-center py-12 text-slate-500">Carregando trilhas...</div>
            ) : trails.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <GitBranch size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhuma trilha encontrada</h3>
                    <p className="text-slate-500 mb-6">Crie sua primeira automação para começar.</p>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="text-blue-600 font-bold hover:underline"
                    >
                        Criar agora
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trails.map(trail => (
                        <div 
                            key={trail.id}
                            onClick={() => {
                                if (onSelectTrail) onSelectTrail(trail);
                                else navigate(`/app/editor/trails/${trail.id}`);
                            }}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group relative"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <GitBranch size={20} />
                                </div>
                                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                    <button 
                                        onClick={() => handleDelete(trail.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{trail.name}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2 h-10">{trail.description || "Sem descrição."}</p>
                            
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${trail.is_active ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                    <span className="text-xs font-medium text-slate-500 uppercase">{trail.is_active ? 'Ativo' : 'Inativo'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                    <Zap size={12} />
                                    {trail.trigger_type}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TrailList;
