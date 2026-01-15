import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useTabs } from '../context/TabContext';

const useActionExecutor = () => {
    const navigate = useNavigate();
    const { openSubPage } = useTabs();

    const executeAction = async (action, contextData = {}) => {
        if (!action) return;

        // --- Helper: Interpolation Logic ---
        const resolveString = (val) => {
            if (!val || typeof val !== 'string') return val;
            let resolved = val;
            Object.keys(contextData).forEach(key => {
                const value = contextData[key] !== undefined && contextData[key] !== null ? contextData[key] : '';
                // Replace {{key}}
                resolved = resolved.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
                // Replace :key (legacy path param style)
                resolved = resolved.replace(new RegExp(`:${key}\\b`, 'g'), value);
            });
            return resolved;
        };

        const resolveConfigRecursive = (obj) => {
            if (typeof obj === 'string') return resolveString(obj);
            if (Array.isArray(obj)) return obj.map(item => resolveConfigRecursive(item));
            if (obj && typeof obj === 'object') {
                const resolved = {};
                for (const key in obj) {
                    resolved[key] = resolveConfigRecursive(obj[key]);
                }
                return resolved;
            }
            return obj;
        };

        // Pre-resolve the entire config
        const resolvedConfig = resolveConfigRecursive(action.config || {});
        
        // --- ID CHAINING & CONTEXT PROPAGATION STRATEGY ---
        // 1. Explicit Chain Checkbox
        if (resolvedConfig.chain_id && contextData.id) {
            resolvedConfig.record_id = contextData.id;
        }
        
        // 2. Fallback: Legacy "id" string match
        if (action.config.record_id === 'id' && !resolvedConfig.record_id?.match(/^\d+$/) && contextData.id) {
             resolvedConfig.record_id = contextData.id;
        }

        try {
            switch (action.action_type) {
                // --- NEW MDI ACTION ---
                case 'OPEN_SUBPAGE':
                    if (resolvedConfig.path) {
                        // Determine Title (Try to find page name or use ID)
                        // Ideally we fetch page info or use label from config if exists
                        const pageIdMatch = resolvedConfig.path.match(/\/app\/page\/([a-zA-Z0-9-]+)/);
                        const pageId = pageIdMatch ? pageIdMatch[1] : 'unknown';
                        
                        openSubPage({
                            title: resolvedConfig.title || `Aba ${pageId.substr(0,4)}`, // Fallback title
                            path: resolvedConfig.path,
                            template: resolvedConfig.template || 'FICHA',
                            id: resolvedConfig.path, // Use path as unique ID for now unless specific
                            data: {
                                record_id: resolvedConfig.record_id, // Pass chained ID to draft
                                mode: resolvedConfig.mode || 'view'
                            }
                        });
                    }
                    else {
                        console.warn("OPEN_SUBPAGE missing path");
                    }
                    break;

                case 'NAVIGATE':
                    let path = resolvedConfig.path;
                    
                    // Support page_id (fetch path)
                    if (!path && resolvedConfig.page_id) {
                        path = `/app/page/${resolvedConfig.page_id}`; 
                    }

                    if (path) {
                        path = resolveString(path); // Double check

                        // Append Record ID if exists
                        if (resolvedConfig.record_id && resolvedConfig.record_id !== 'MANUAL') {
                             const separator = path.includes('?') ? '&' : '?';
                             path += `${separator}record_id=${resolvedConfig.record_id}`;
                        }
                        
                        // Ref Filter Support
                        if (resolvedConfig.ref_filter_enabled && resolvedConfig.ref_filter_field && contextData.id) {
                             const separator = path.includes('?') ? '&' : '?';
                             path += `${separator}filter_field=${resolvedConfig.ref_filter_field}&filter_value=${contextData.id}`;
                        }

                        // Check Open Mode (FICHA/MODAL)
                        if (resolvedConfig.open_mode && ['FICHA', 'MODAL'].includes(resolvedConfig.open_mode)) {
                            openSubPage({
                                title: resolvedConfig.title || `Visualização`,
                                path: path,
                                template: resolvedConfig.open_mode,
                                id: path, // Unique key
                                data: {
                                    record_id: resolvedConfig.record_id,
                                    mode: 'view'
                                }
                            });
                        } else {
                            navigate(path);
                        }
                    }
                    break;

                case 'FETCH_FIRST':
                    // Need entitySlug from context
                    const slug = contextData.entitySlug;
                    if (!slug) { console.warn('FETCH_FIRST requires entitySlug'); return; }
                    const { data: dataFirst } = await apiClient.get(`/api/engine/object/${slug}?limit=1`);
                    if (dataFirst && dataFirst.length > 0) {
                        navigate(`${window.location.pathname}?record_id=${dataFirst[0].id}`, { replace: true });
                    }
                    break;

                case 'URL':
                    if (resolvedConfig.url) {
                        window.open(resolvedConfig.url, '_blank');
                    }
                    break;

                case 'WEBHOOK':
                case 'WEBHOOK_OUT': 
                    if (resolvedConfig.url) {
                        await apiClient.post('/api/engine/actions/proxy', {
                            url: resolvedConfig.url,
                            method: resolvedConfig.method || 'POST',
                            body: resolvedConfig.body || {}, 
                            data: contextData 
                        });
                    }
                    break;
                
                case 'CREATE_ITEM':
                case 'DB_CREATE':
                    await apiClient.post(`/api/engine/actions/${action.id}/execute`, { ...contextData, ...resolvedConfig });
                    alert("Criado com sucesso!");
                    break;

                case 'DB_UPDATE':
                case 'EDIT_ITEM':
                     await apiClient.post(`/api/engine/actions/${action.id}/execute`, { ...contextData, ...resolvedConfig });
                     alert("Atualizado com sucesso!");
                     break;

                case 'DB_DELETE':
                case 'DELETE_ITEM':
                      await apiClient.post(`/api/engine/actions/${action.id}/execute`, { customConfig: resolvedConfig, ...contextData  });
                      alert("Deletado com sucesso!");
                      break;

                case 'CREATE_TASK':
                    await apiClient.post('/v1/notifications', { // UPDATED API
                        title: resolvedConfig.title,
                        description: resolvedConfig.description,
                        assignee_id: resolvedConfig.assignee_id || resolvedConfig.assignee, // Support both
                        resource_link: resolvedConfig.link 
                    });
                    alert("Tarefa/Notificação criada!");
                    break;

                case 'RUN_FLOW':
                    if (resolvedConfig.flow_actions?.length > 0) {
                        for (const flowActionId of resolvedConfig.flow_actions) {
                            try {
                                const { data: flowAction } = await apiClient.get(`/api/builder/actions/${flowActionId}`);
                                if (flowAction) await executeAction(flowAction, contextData);
                            } catch (e) { console.error(e); }
                        }
                    }
                    break;

                case 'RUN_TRAIL':
                    if (resolvedConfig.trail_id) {
                        try {
                            const { data: runRes } = await apiClient.post(`/api/engine/automation/run`, {
                                trail_id: resolvedConfig.trail_id,
                                context: contextData
                            });
                            
                            // Handle direct instruction output if automation returns client-side commands (future proof)
                            if (runRes && runRes.client_instruction) {
                                 const instructionAction = runRes.client_instruction;
                                 await executeAction(instructionAction, contextData);
                            } else {
                                if (runRes.message && runRes.success !== false) alert(runRes.message);
                                if (runRes.success === false) throw new Error(runRes.message || "Falha na automação");
                            }
                        } catch (e) {
                             throw e; // Repass to catch block
                        }
                    }
                    break;

                default:
                    console.warn("Action type not supported:", action.action_type);
            }
        } catch (error) {
            console.error("Action Failed:", error);
            alert("Erro ao executar ação: " + (error.response?.data?.detail || error.message));
        }
    };

    return { executeAction };
};

export default useActionExecutor;
