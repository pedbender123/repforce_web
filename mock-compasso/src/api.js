import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// LOG TODAS AS REQUISIÇÕES
api.interceptors.request.use(request => {
    // Evita erro 415 em GET removendo body e header Content-Type
    if (request.method === 'get') {
        request.data = undefined;
        if (request.headers) {
            delete request.headers['Content-Type'];
        }
    }
    console.log('🚀 FRONTEND ENVIANDO:', request.method?.toUpperCase(), request.url, request.data || '');
    return request;
});

// LOG TODAS AS RESPOSTAS
api.interceptors.response.use(
    response => {
        console.log('✅ FRONTEND RECEBEU:', response.status, response.config.url);
        return response;
    },
    error => {
        console.error('❌ FRONTEND ERRO:', error.response?.status || 'SEM RESPOSTA', error.config?.url, error.message);
        return Promise.reject(error);
    }
);

export default api;



