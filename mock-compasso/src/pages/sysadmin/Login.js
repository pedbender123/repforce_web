import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import ThemeToggle from '../../components/ThemeToggle';

export default function SysAdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { status, login, isSysAdmin } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirection Logic
    useEffect(() => {
        if (status === 'authenticated') {
            if (isSysAdmin) navigate('/lobby', { replace: true });
            else navigate('/login', { replace: true }); // Not a sysadmin? Go to regular login.
        }
    }, [status, isSysAdmin, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/v1/auth/login', {
                username,
                password
            });
            const { access_token } = response.data;
            await login(access_token);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erro ao realizar login administrativo');
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'loading') return null;

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="absolute top-4 right-4"><ThemeToggle /></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-500/20">
                        <img className="h-12 w-auto" src="/logo_clara.png" alt="Repforce SysAdmin" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Painel da Plataforma
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Acesso restrito a administradores globais
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-800 py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-gray-700">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative text-sm">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                Username
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                Senha
                            </label>
                            <div className="mt-1">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all font-bold"
                            >
                                {isLoading ? 'Autenticando...' : 'Acessar Infraestrutura'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
