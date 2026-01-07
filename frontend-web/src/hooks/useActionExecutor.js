import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const useActionExecutor = () => {
    const navigate = useNavigate();

    const executeAction = async (action, contextData = {}) => {
        if (!action) return;

        console.log("Executing Action:", action, "Context:", contextData);

        try {
            switch (action.action_type) {
                case 'NAVIGATE':
                    const path = action.config.path;
                    if (path) {
                        // Replace variables like :id in path
                        let finalPath = path;
                        Object.keys(contextData).forEach(key => {
                            finalPath = finalPath.replace(`:${key}`, contextData[key]);
                        });

                        // Check for include_record_id
                        if (action.config.include_record_id && contextData.id) {
                            const separator = finalPath.includes('?') ? '&' : '?';
                            finalPath += `${separator}record_id=${contextData.id}`;
                        }

                        // Check for Ref Filter
                        if (action.config.ref_filter_enabled && action.config.ref_filter_field && contextData.id) {
                             const separator = finalPath.includes('?') ? '&' : '?';
                             // We use generic 'filter_field' and 'filter_value' params that ListPage understands
                             finalPath += `${separator}filter_field=${action.config.ref_filter_field}&filter_value=${contextData.id}`;
                        }
                        
                        navigate(finalPath);
                    }
                    break;

                case 'FETCH_FIRST':
                    // Need entitySlug from context
                    const slug = contextData.entitySlug;
                    if (!slug) {
                        console.warn('FETCH_FIRST requires entitySlug in context');
                        return;
                    }
                    // Fetch first
                    // We can use the object list endpoint with limit=1
                    const { data } = await apiClient.get(`/api/engine/object/${slug}?limit=1`);
                    if (data && data.length > 0) {
                        const firstId = data[0].id;
                        // Reload current page with record_id param, or just trigger callback?
                        // Usually this runs on PageLoad. 
                        // We can just Navigate to self with query param.
                        const currentPath = window.location.pathname;
                        navigate(`${currentPath}?record_id=${firstId}`, { replace: true });
                    }
                    break;

                case 'URL':
                    const url = action.config.url;
                    if (url) {
                        window.open(url, '_blank');
                    }
                    break;

                case 'WEBHOOK':
                    // We send to our backend proxy to handle the actual external call (avoids CORS)
                    // Or call directly if configured. Ideally backend.
                    // For now, let's try direct call, if fails fallback to backend? 
                    // Actually, safer to assume it's an external webhook, so CORS might block.
                    // Better to have a "Trigger Proxy" endpoint.
                    // But for "Virtual Buttons" we already have server action.
                    // Let's implement a simple fire-and-forget or await via backend.
                    if (action.config.url) {
                        await apiClient.post('/api/engine/actions/proxy', {
                            url: action.config.url,
                            data: contextData
                        });
                        alert("Ação disparada com sucesso!");
                    }
                    break;
                
                case 'CREATE_ITEM':
                case 'EDIT_ITEM':
                case 'DELETE_ITEM':
                    // These are server-side actions usually. 
                    // We can reuse the "Virtual Action" endpoint logic but trigger it from UI.
                    // Or simply call the generic Proxy that decides?
                    // Let's call the `execute_virtual_action` endpoint logic but via a new `execute_ui_action` endpoint?
                    // Or just handle them here if we have code. 
                    // Simpler: Trigger the action ID via backend.
                    await apiClient.post(`/api/engine/actions/${action.id}/execute`, contextData);
                    alert("Operação realizada!");
                    // Refresh data?
                    break;

                case 'CREATE_TASK':
                    await apiClient.post('/api/system/tasks', {
                        title: action.config.title,
                        description: action.config.description,
                        assignee_id: action.config.assignee_id
                    });
                    alert("Tarefa criada com sucesso!");
                    break;

                case 'RUN_FLOW':
                    if (action.config.flow_actions && action.config.flow_actions.length > 0) {
                        for (const flowActionId of action.config.flow_actions) {
                            try {
                                // Fetch the full action config
                                const { data: flowAction } = await apiClient.get(`/api/builder/actions/${flowActionId}`);
                                if (flowAction) {
                                    // Execute recursively
                                    await executeAction(flowAction, contextData);
                                }
                            } catch (err) {
                                console.error(`Failed to execute flow action ${flowActionId}`, err);
                                // Continue or break? Let's continue.
                            }
                        }
                    }
                    break;

                default:
                    console.warn("Action type not supported in frontend yet:", action.action_type);
            }
        } catch (error) {
            console.error("Action Failed:", error);
            alert("Erro ao executar ação: " + error.message);
        }
    };

    return { executeAction };
};

export default useActionExecutor;
