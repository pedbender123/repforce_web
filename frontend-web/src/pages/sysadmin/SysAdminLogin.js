import React, { useState } from 'react';
import { useSysAdminAuth } from '../../context/SysAdminAuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function SysAdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login, token, userProfile } = useSysAdminAuth();
  const navigate = useNavigate();

  // Se já estiver logado como SysAdmin, vai para o dashboard
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
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md bg-gray-800 p-8 md:p-12 rounded-lg shadow-xl border border-red-500">
          <div className="mb-10 text-center">
            <ShieldExclamationIcon className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-semibold text-white">
              Área Restrita - SysAdmin
            </h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-gray-300"
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-white"
                />
              </div>
            </div>

            <div className="mt-4">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-300"
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-white"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 text-center text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="mt-8">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}