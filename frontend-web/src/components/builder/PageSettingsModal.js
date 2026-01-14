import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

import { Plus, Trash2 } from 'lucide-react';

const PageSettingsModal = ({ isOpen, onClose, page, onUpdate }) => {
    const [name, setName] = useState('');
    const [isHidden, setIsHidden] = useState(false);
    const [filters, setFilters] = useState([]); // Array of { key: '', value: '' }
    const [loading, setLoading] = useState(false);
    
    // Template Config (Phase 3)
    const [defaultDetailSubpageId, setDefaultDetailSubpageId] = useState('');
    const [defaultFormSubpageId, setDefaultFormSubpageId] = useState('');
    const [availableSubpages, setAvailableSubpages] = useState([]);
    
    // Click Config State
    const [clickConfig, setClickConfig] = useState({ type: 'NONE', targetPageId: '', targetTemplate: 'FICHA' });
    const [availablePages, setAvailablePages] = useState([]);
    const [existingTrail, setExistingTrail] = useState(null);

    useEffect(() => {
        if (isOpen && page) {
            setName(page.name);
            setIsHidden(page.layout_config?.is_hidden || false);
            setDefaultDetailSubpageId(page.default_detail_subpage_id || '');
            setDefaultFormSubpageId(page.default_form_subpage_id || '');

            // Convert Object to Array for UI
            const pf = page.layout_config?.permanent_filters || {};
            const filterArray = Object.entries(pf).map(([k, v]) => ({ key: k, value: v }));
            setFilters(filterArray);

            // Fetch Subpages for this page
            if (page.type === 'list') {
                fetchSubpages();
                fetchClickData();
            }
        }
    }, [isOpen, page]);

    const fetchClickData = async () => {
        try {
            const [pagesRes, trailsRes] = await Promise.all([
                apiClient.get('/api/builder/navigation/pages'),
                apiClient.get('/api/builder/trails')
            ]);
            setAvailablePages(pagesRes.data);

            // Find existing trail for this list
            const trail = trailsRes.data.find(t => 
                t.trigger_type === 'MANUAL' && 
                String(t.trigger_config?.page_id) === String(page.id) &&
                t.trigger_config?.context === 'LIST'
            );
            
            setExistingTrail(trail);

            if (trail) {
                // Determine Mode based on Nodes
                // Fetch full trail details to check nodes
                const { data: fullTrail } = await apiClient.get(`/api/builder/trails/${trail.id}`);
                const nodes = Object.values(fullTrail.original.nodes || {});
                
                // Check if it looks like a "Open Subpage" trail
                const openSubpageNode = nodes.find(n => n.action_type === 'NAVIGATE' || n.action_type === 'OPEN_SUBPAGE');
                
                if (openSubpageNode && nodes.length === 1) { // Simple Subpage Trail
                    setClickConfig({
                        type: 'SUBPAGE',
                        targetPageId: openSubpageNode.config?.page_id || '',
                        targetTemplate: 'FICHA' // Default or derived if stored
                    });
                } else {
                    setClickConfig({ type: 'TRAIL' });
                }
            } else {
                setClickConfig({ type: 'NONE', targetPageId: '', targetTemplate: 'FICHA' });
            }

        } catch (e) {
            console.error("Error loading click data", e);
        }
    };

    const fetchSubpages = async () => {
        try {
            const { data } = await apiClient.get(`/api/builder/pages/${page.id}/subpages`);
            setAvailableSubpages(data || []);
        } catch (e) {
            console.error("Error loading subpages", e);
            setAvailableSubpages([]);
        }
    };

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            // Convert Array back to Object
            const parsedFilters = filters.reduce((acc, curr) => {
                if (curr.key && curr.value) acc[curr.key] = curr.value;
                return acc;
            }, {});

            const newLayoutConfig = {
                ...(page.layout_config || {}),
                permanent_filters: parsedFilters,
                is_hidden: isHidden
            };

            await apiClient.put(`/api/builder/navigation/pages/${page.id}`, {
                name,
                layout_config: newLayoutConfig,
                default_detail_subpage_id: defaultDetailSubpageId || null,
                default_form_subpage_id: defaultFormSubpageId || null
            });

            // Handle Click Config (Trails)
            if (page.type === 'list') {
                await saveClickConfiguration();
            }

            onUpdate();
            onClose();
        } catch (error) {
            alert("Erro ao salvar: " + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("ATENÇÃO: Tem certeza que deseja excluir esta página? Esta ação não pode ser desfeita.")) return;
        
        setLoading(true);
        try {
            await apiClient.delete(`/api/builder/navigation/pages/${page.id}`);
            if (onClose) onClose();
            if (onUpdate) onUpdate({ deleted: true });
        } catch (error) {
            alert("Erro ao excluir página: " + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    const saveClickConfiguration = async () => {
        if (clickConfig.type === 'NONE') {
            if (existingTrail) {
                // Deactivate or Delete? Let's Delete to keep clean as per user intent "cria/não"
                await apiClient.delete(`/api/builder/trails/${existingTrail.id}`);
            }
            return;
        }

        const trailData = {
            name: `[Auto] Click - ${name}`,
            trigger_type: 'MANUAL',
            trigger_config: {
                context: 'LIST',
                page_id: page.id,
                entity_id: page.entity_id // GenericListPage passes entityId? No, Page Obj has it?
            },
            is_active: true
        };

        if (clickConfig.type === 'SUBPAGE') {
            if (!defaultDetailSubpageId) {
                alert("Configure um Template de Detalhes antes de ativar esta ação!");
                throw new Error("Template Padrão não configurado");
            }

            // Create Node Structure using default template
            const nodeId = 'n_' + Date.now();
            const nodes = {
                [nodeId]: {
                    id: nodeId,
                    type: 'ACTION',
                    action_type: 'NAVIGATE',
                    name: 'Abrir Detalhes',
                    config: {
                        subpage_id: defaultDetailSubpageId, // Use configured default
                        record_id: '{{id}}' // Context ID from List Row
                    }
                }
            };
            trailData.nodes = nodes;
        } else if (clickConfig.type === 'TRAIL') {
           // If switching to TRAIL but trail already exists, keep it. 
           // If creating new, leave empty nodes.
           if (!existingTrail) {
               trailData.nodes = {}; // Empty
           }
        }

        if (existingTrail) {
             // Update Existing
             // Only update nodes if switching types or updating Subpage config. 
             // If Custom Trail, DON'T overwrite nodes unless we are reseting from Subpage.
             
             let shouldUpdateNodes = false;
             if (clickConfig.type === 'SUBPAGE') shouldUpdateNodes = true;
             // If Custom Trail, we don't zero it out if it was already Custom.
             
             const payload = { ...existingTrail, ...trailData };
             if (!shouldUpdateNodes && clickConfig.type === 'TRAIL') delete payload.nodes;

             await apiClient.put(`/api/builder/trails/${existingTrail.id}`, payload);
        } else {
             // Create New
             await apiClient.post('/api/builder/trails', trailData);
        }

        if (clickConfig.type === 'TRAIL' && !existingTrail) {
            alert("Trilha criada! Acesse o Gerenciador de Trilhas para configurar os passos.");
        }
    };

    const addFilter = () => {
        setFilters([...filters, { key: '', value: '' }]);
    };

    const removeFilter = (index) => {
        const newFilters = [...filters];
        newFilters.splice(index, 1);
        setFilters(newFilters);
    };

    const updateFilter = (index, field, val) => {
        const newFilters = [...filters];
        newFilters[index][field] = val;
        setFilters(newFilters);
    };

    // Pages that deal with single records (now only as SubPages, not main pages)

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[800px] h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex-none mb-4">
                    <h3 className="text-lg font-bold dark:text-white">Configurar Página: {page?.name} ({page?.type})</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {/* General Settings */}
                    <div className="p-4 border border-gray-100 dark:border-gray-700 rounded bg-gray-50/50 dark:bg-gray-800/50">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Geral</label>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Nome da Página</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                             <input 
                                type="checkbox" 
                                id="isHidden" 
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={isHidden}
                                onChange={(e) => setIsHidden(e.target.checked)} 
                             />
                             <label htmlFor="isHidden" className="text-sm text-gray-700 dark:text-gray-300 select-none">Ocultar da Navegação</label>
                        </div>
                    </div>

                    {/* Template Configuration (Phase 3) - ONLY FOR LISTS */}
                    {page?.type === 'list' && (
                        <div className="p-4 border border-green-100 dark:border-green-900 rounded bg-green-50/30 dark:bg-green-900/10">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Templates Padrão</label>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Template de Detalhes (Ficha)</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white text-sm"
                                            value={defaultDetailSubpageId}
                                            onChange={(e) => setDefaultDetailSubpageId(e.target.value)}
                                        >
                                            <option value="">Nenhum (desativado)</option>
                                            {availableSubpages.filter(sp => ['view', 'ficha_simples', 'split_view', 'ficha_360'].includes(sp.type)).map(sp => (
                                                <option key={sp.id} value={sp.id}>{sp.name} ({sp.type})</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const name = prompt("Nome da SubPágina de Detalhes:", "Detalhes");
                                                if (!name) return;
                                                try {
                                                    const { data } = await apiClient.post(`/api/builder/pages/${page.id}/subpages`, {
                                                        name,
                                                        type: 'ficha_360',
                                                        order: availableSubpages.length
                                                    });
                                                    await fetchSubpages();
                                                    setDefaultDetailSubpageId(data.id);
                                                } catch (e) {
                                                    alert("Erro ao criar subpágina: " + (e.response?.data?.detail || e.message));
                                                }
                                            }}
                                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-medium"
                                        >
                                            + Criar
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Usado ao clicar em uma linha da lista</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Template de Criação (Form)</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white text-sm"
                                            value={defaultFormSubpageId}
                                            onChange={(e) => setDefaultFormSubpageId(e.target.value)}
                                        >
                                            <option value="">Nenhum (desativado)</option>
                                            {availableSubpages.filter(sp => sp.type === 'form').map(sp => (
                                                <option key={sp.id} value={sp.id}>{sp.name} ({sp.type})</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const name = prompt("Nome da SubPágina de Formulário:", "Novo Registro");
                                                if (!name) return;
                                                try {
                                                    const { data } = await apiClient.post(`/api/builder/pages/${page.id}/subpages`, {
                                                        name,
                                                        type: 'form',
                                                        order: availableSubpages.length
                                                    });
                                                    await fetchSubpages();
                                                    setDefaultFormSubpageId(data.id);
                                                } catch (e) {
                                                    alert("Erro ao criar subpágina: " + (e.response?.data?.detail || e.message));
                                                }
                                            }}
                                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-medium"
                                        >
                                            + Criar
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Usado ao clicar em "Novo"</p>
                                </div>
                            </div>
                        </div>
                    )}

                    
                    {/* Filters - ONLY FOR Lists */}
                    {['list', 'list_readonly', 'list_custom'].includes(page?.type) && (
                        <div className="space-y-6">
                             {/* Row Click Action (Only for LISTS) */}
                             {page?.type === 'list' && (
                                <div className="p-4 border border-blue-100 dark:border-blue-900 rounded bg-blue-50/30 dark:bg-blue-900/10">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ação ao Clicar na Linha</label>
                                    
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="clickAction"
                                                    checked={clickConfig.type === 'NONE'}
                                                    onChange={() => setClickConfig({...clickConfig, type: 'NONE'})}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">Nenhuma</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="clickAction"
                                                    checked={clickConfig.type === 'SUBPAGE'}
                                                    onChange={() => setClickConfig({...clickConfig, type: 'SUBPAGE'})}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">Abrir Subpágina (Ficha)</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name="clickAction"
                                                    checked={clickConfig.type === 'TRAIL'}
                                                    onChange={() => setClickConfig({...clickConfig, type: 'TRAIL'})}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">Trilha Personalizada</span>
                                            </label>
                                        </div>

                                        {/* SUBCONFIG: SUBPAGE */}
                                        {clickConfig.type === 'SUBPAGE' && (
                                            <div className="pl-4 border-l-2 border-blue-200 mt-2 space-y-3 animate-in slide-in-from-left-2">
                                                <p className="text-xs text-gray-500">
                                                    Ao clicar em uma linha, abrirá o <b>Template de Detalhes (Ficha)</b> configurado acima.
                                                    {!defaultDetailSubpageId && (
                                                        <span className="text-orange-600 block mt-1">⚠️ Você precisa configurar um Template de Detalhes primeiro.</span>
                                                    )}
                                                </p>
                                            </div>
                                        )}

                                        {/* SUBCONFIG: TRAIL */}
                                        {clickConfig.type === 'TRAIL' && (
                                            <div className="pl-4 border-l-2 border-purple-200 mt-2 animate-in slide-in-from-left-2">
                                                <p className="text-xs text-gray-500">
                                                    Uma trilha em branco será criada no Gerenciador de Trilhas com o gatilho já configurado para esta lista.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                             )}

                            <div className="p-4 border border-gray-100 dark:border-gray-700 rounded bg-gray-50/50 dark:bg-gray-800/50">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Filtros Permanentes</label>
                                    <button onClick={addFilter} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800">
                                        <Plus size={12} /> Adicionar
                                    </button>
                                </div>
                                
                                {filters.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">Nenhum filtro configurado.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {filters.map((f, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <input 
                                                    className="w-1/3 text-xs p-2 border rounded dark:bg-gray-900 dark:text-white"
                                                    placeholder="Campo (ex: status)"
                                                    value={f.key}
                                                    onChange={e => updateFilter(idx, 'key', e.target.value)}
                                                />
                                                <input 
                                                    className="flex-1 text-xs p-2 border rounded dark:bg-gray-900 dark:text-white"
                                                    placeholder="Valor ou Fórmula (ex: {me}, ativo)"
                                                    value={f.value}
                                                    onChange={e => updateFilter(idx, 'value', e.target.value)}
                                                />
                                                <button onClick={() => removeFilter(idx)} className="text-red-500 hover:text-red-700 p-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[10px] text-gray-400 mt-2">
                                    Use chaves para variáveis de contexto: <code>{`{me}`}</code> para ID do usuário atual.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-none mt-6 flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                     {/* Botão Deletar (Esquerda) */}
                    <button 
                        onClick={handleDelete} 
                        className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded border border-transparent hover:border-red-200 transition-colors text-sm font-medium"
                    >
                        Deletar Página
                    </button>

                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Cancelar</button>
                        <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageSettingsModal;
