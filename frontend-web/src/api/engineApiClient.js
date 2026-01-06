/**
 * Engine API Client
 * Dedicated client for fetching metadata and engine config.
 * Currently reuses the main apiClient but allows for future segregation.
 */
import apiClient from './apiClient';

const engineApiClient = {
    // Schema & Metadata
    getSchema: async () => {
        const { data } = await apiClient.get('/api/engine/schema');
        return data; // Returns List<MetaEntityResponse>
    },

    getView: async (viewSlug) => {
        // Future: /api/engine/view/{slug}
        const { data } = await apiClient.get(`/api/engine/view/${viewSlug}`);
        return data;
    },

    // Data Operations (Proxy to builder or dedicated data routs)
    listData: async (entitySlug) => {
        // Need a generic data endpoint. For now builder uses specific.
        // TODO: Implement GET /api/engine/data/{entitySlug}
        console.warn("listData not implemented yet");
        return [];
    }
};

export default engineApiClient;
