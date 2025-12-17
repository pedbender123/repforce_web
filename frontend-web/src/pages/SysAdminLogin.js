import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { SysAdminAuthContext } from '../context/SysAdminAuthContext';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function SysAdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login, token, userProfile } = useSysAdminAuth();
  const navigate = useNavigate();

  if (token && userProfile === 'sysadmin') {
    return <Navigate to="/sysadmin/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const profile = await login(username, password);

      if (profile === 'sysadmin') {
        navigate('/sysadmin/dashboard', { replace: true });
      } else {
        setError('Acesso negado.');
      }
    } catch (err) {
      setError('Falha no login. Verifique seu usuário e senha.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 justify-center items-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 md:p-12 rounded-lg shadow-xl border-t-4 border-red-600 dark:border-red-500 transition-colors">
        <div className="mb-8 text-center">
          {/* Container escuro para a logo aparecer bem em ambos os modos */}
          <div className="bg-gray-900 p-4 rounded-lg inline-block mb-4">
            <img
              src="/logo_clara.png"
              alt="Repforce SysAdmin"
              className="h-10 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Área Restrita - SysAdmin
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            Acesso exclusivo para gestão do sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Usuário (Username)
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}