import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import apiClient from '../../api/apiClient';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { user, token, status, login, userProfile, isSysAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirection Logic Unified
  useEffect(() => {
    if (status === 'authenticated') {
      const from = location.state?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        // Default redirects
        if (isSysAdmin) {
          navigate('/sysadmin', { replace: true });
        } else if (user?.memberships && user.memberships.length > 0) {
          // If no tenant selected but has memberships, pick the first one
          const firstMembership = user.memberships[0];
          const role = firstMembership.role;
          const target = (role === 'owner' || role === 'admin') ? '/admin' : '/app';

          // Select tenant if not already selected
          if (!localStorage.getItem('tenantSlug')) {
            localStorage.setItem('tenantSlug', firstMembership.tenant.slug);
          }

          navigate(target, { replace: true });
        } else {
          // No memberships and not sysadmin? This shouldn't happen for valid users, 
          // but we logout to be safe or redirect to login.
          navigate('/login', { replace: true });
        }
      }
    }
  }, [status, isSysAdmin, userProfile, navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post('/v1/auth/login', {
        username,
        password,
        remember_me: rememberMe
      });

      const { access_token } = response.data;
      await login(access_token);
      // navigation is handled by useEffect above
    } catch (err) {
      console.error("Login Error:", err);
      setError('Login falhou. Verifique usuário e senha.');
      setIsLoading(false);
    }
  };

  if (status === 'loading') return null; // Wait for auth recovery

  return (
    <div className="flex min-h-screen transition-colors duration-300">
      <div className="absolute top-4 right-4 z-50"><ThemeToggle /></div>
      <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center p-12 shadow-inner">
        <div className="text-white max-w-md text-center lg:text-left">
          <img src="/logo_clara.png" alt="Repforce" className="mb-8 w-48 mx-auto lg:mx-0 object-contain shadow-sm" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Gestão inteligente.</h1>
          <p className="text-blue-100 text-lg opacity-80">Acesse sua conta para continuar.</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-center mb-8 lg:hidden">
             <img src="/logo_pbpm.png" alt="Repforce" className="h-10 object-contain" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-2">Bem-vindo</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Faça login para gerenciar sua operação</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Usuário ou E-mail</label>
              <input 
                type="text" 
                required 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="mt-1 block w-full rounded-xl border-gray-200 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-3 transition-all" 
                placeholder="nome@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Senha</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="mt-1 block w-full rounded-xl border-gray-200 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-3 transition-all" 
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">Manter conectado</label>
              </div>
              <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">Esqueceu a senha?</a>
            </div>
            {error && <p className="text-red-500 text-sm font-medium text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-[#2563eb] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all transform active:scale-[0.98]"
            >
              {isLoading ? 'Entrando...' : 'Entrar na Conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}