import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import apiClient from '../../api/apiClient';
import { jwtDecode } from 'jwt-decode';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { token, userProfile } = useContext(AuthContext);

  // Mapeamento de perfis para rotas
  const getRedirectPath = (profile) => {
    switch (profile) {
      case 'admin': return '/admin/dashboard';
      case 'representante': return '/app/dashboard';
      case 'sysadmin': return '/sysadmin/dashboard';
      default: return '/app/dashboard';
    }
  };

  // Se já estiver logado (e o contexto já tiver carregado), redireciona
  if (token) return <Navigate to={getRedirectPath(userProfile)} replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('remember_me', rememberMe);

      const response = await apiClient.post('/auth/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token } = response.data;

      // --- LÓGICA CRÍTICA DE LOGIN ---
      // 1. Salva o token diretamente no storage
      localStorage.setItem('token', access_token);

      // 3. Força o navegador a ir para a nova URL ou usa navigate se possível.
      // Como o Login é public, e Lobby é private, podemos usar navigate se o estado do AuthContext atualizar rápido.
      // Mas a lógica antiga usava window.location.href para garantir refresh.
      // Vamos manter o padrão mas redirecionar para /lobby

      let targetPath = '/lobby';

      try {
        const decoded = jwtDecode(access_token);
        // Se for sysadmin, vai direto.
        if (decoded.is_sysadmin) {
          targetPath = '/sysadmin/dashboard';
        }
      } catch (e) { console.warn(e); }

      window.location.href = targetPath;

      // 3. Força o navegador a ir para a nova URL. 
      // Isso garante que o App recarregue do zero com o novo token no localStorage.
      window.location.href = targetPath;

    } catch (err) {
      console.error("Login Error:", err);
      setError('Login falhou. Verifique usuário e senha.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen transition-colors duration-300">
      <div className="absolute top-4 right-4 z-50"><ThemeToggle /></div>
      <div className="hidden lg:flex lg:w-1/2 bg-repforce-dark dark:bg-black items-center justify-center p-12">
        <div className="text-white max-w-md">
          <img src="/logo_clara.png" alt="Repforce" className="mb-8 w-48 object-contain" />
          <h1 className="text-4xl font-bold mb-4">Gestão inteligente.</h1>
          <p className="text-gray-300">Acesse sua conta para continuar.</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-8">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-6">Login</h2>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2" />
            </div>
            <div className="flex items-center">
              <input id="remember" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Manter conectado</label>
            </div>
            {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-repforce-primary hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}