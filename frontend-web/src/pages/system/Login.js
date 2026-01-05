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