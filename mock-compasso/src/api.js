import axios from 'axios';

// Use same hostname as the browser, but different port for API
const API_HOST = window.location.hostname;
const api = axios.create({
    baseURL: `http://${API_HOST}:5000/api`,
});

export default api;

