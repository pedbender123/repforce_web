import axios from 'axios';

// A instância do Axios
const apiClient = axios.create({
  // O Nginx (proxy reverso) espera /api/ para redirecionar ao backend.
  baseURL: '/api', 
});

// Interceptor de Request
// (O token é adicionado dinamicamente pelo AuthContext ao logar)

// Interceptor de Response (para lidar com erros 401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Se der 401 (não autorizado), pode ser que o token expirou
      console.error("Erro 401 - Não autorizado. Deslogando...");
      
      // Limpa o localStorage e recarrega a página para /login
      localStorage.removeItem('token');
      // Use replace para não adicionar ao histórico de navegação
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;