import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import apiClient from '../api/apiClient';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState(''); // Mantém suporte a Multi-tenant
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  
  const { token, userProfile } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = (profile) => {
    switch (profile) {
      case 'admin': return '/admin';
      case 'representante': return '/app';
      default: return '/login';
    }
  };

  if (token) return <Navigate to={getRedirectPath(userProfile)} replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
        const formData = new URLSearchParams();
        // Backend novo espera tenant_slug se não for sysadmin ou user global
        // Se seu backend precisa, mande. Se não, remova.
        if(tenantSlug) formData.append('tenant_slug', tenantSlug);
        formData.append('username', username);
        formData.append('password', password);
        formData.append('remember_me', rememberMe); 

        const response = await apiClient.post('/auth/token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        window.location.reload(); 
    } catch (err) {
        setError('Login falhou. Verifique suas credenciais.');
    }
  };

  return (
    <div className="flex min-h-screen transition-colors duration-300">
      <div className="absolute top-4 right-4 z-50"><ThemeToggle /></div>
      <div className="hidden lg:flex lg:w-1/2 bg-repforce-dark dark:bg-black items-center justify-center p-12">
        <div className="text-white max-w-md">
          <img src="/logo_clara.png" alt="Repforce" className="mb-8 w-48 object-contain"/>
          <h1 className="text-4xl font-bold mb-4">Gestão inteligente.</h1>
          <p className="text-gray-300">Acesse sua conta para continuar.</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-8">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-6">Login</h2>
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Campo Opcional de Tenant Slug se necessário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código da Empresa</label>
              <input type="text" placeholder="Ex: demo (Opcional)" value={tenantSlug} onChange={e => setTenantSlug(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário</label>
              <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"/>
            </div>
            <div className="flex items-center">
              <input id="remember" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Manter conectado</label>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-repforce-primary hover:bg-blue-700">Entrar</button>
          </form>
        </div>
      </div>
    </div>
  );
}