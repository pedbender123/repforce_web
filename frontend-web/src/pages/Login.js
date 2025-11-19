import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login, token, userProfile } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = (profile) => {
    switch (profile) {
      case 'admin': return '/admin';
      case 'representante': return '/app';
      default: return '/login';
    }
  };

  if (token) {
    const redirectTo = getRedirectPath(userProfile);
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const profile = await login(username, password);
      const redirectTo = getRedirectPath(profile);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError('Falha no login. Verifique seu usuário e senha.');
    }
  };

  return (
    <div className="flex min-h-screen transition-colors duration-300">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Lado Esquerdo (Banner) - Escuro */}
      <div className="hidden lg:flex lg:w-1/2 bg-repforce-dark dark:bg-black items-center justify-center p-12 transition-colors">
        <div className="text-white text-left max-w-md">
          {/* Logo grande no banner */}
          <img 
            src="/logo_clara.png" 
            alt="Repforce" 
            className="mb-8 w-64 h-auto object-contain"
          />
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Tecnologia que entende quem vende.
          </h1>
          <p className="text-xl text-gray-300">
            Acesse seu painel para organizar rotas, acompanhar clientes e controlar tudo que importa.
          </p>
        </div>
      </div>
      
      {/* Lado Direito (Formulário) */}
      <div className="flex-1 flex flex-col justify-center items-center bg-repforce-light dark:bg-gray-900 lg:w-1/2 p-8 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 md:p-12 rounded-lg shadow-xl transition-colors border border-transparent dark:border-gray-700">
          
          {/* Logo visível mobile/tablet e topo do form */}
          <div className="mb-10 flex justify-center">
             <div className="bg-repforce-dark p-4 rounded-lg shadow-md">
                <img 
                  src="/logo_clara.png" 
                  alt="Repforce" 
                  className="h-10 w-auto object-contain" 
                />
             </div>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white text-center mb-6">
            Acesse sua conta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Usuário
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Seu usuário"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-repforce-primary focus:border-repforce-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-repforce-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-repforce-primary transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}