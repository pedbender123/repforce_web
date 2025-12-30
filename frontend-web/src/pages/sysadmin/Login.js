import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sysAdminApiClient from '../../api/sysAdminApiClient';
import ThemeToggle from '../../components/ThemeToggle';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await sysAdminApiClient.post('/v1/auth/login', {
                username,
                password
            });

            const { access_token } = response.data;
            if (access_token) {
                localStorage.setItem('sysadmin_token', access_token);
                navigate('/sysadmin/companies');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Erro ao conectar ao servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen transition-colors duration-300 relative">
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            {/* Left Side - Banner (Identical to CRM) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-900 border-r border-gray-800 items-center justify-center p-12">
                <div className="text-white max-w-md text-center">
                    {/* Dark Container for Logo matching CRM style if needed, or just logo on dark bg */}
                    <img
                        src="/logo_clara.png"
                        alt="Repforce"
                        className="mb-8 w-48 mx-auto object-contain"
                    />
                    <h1 className="text-4xl font-bold mb-4">Gestão Global.</h1>
                    <p className="text-gray-400">Acesso exclusivo para administradores da plataforma.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-8">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center mb-6">
                        SysAdmin Login
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Usuário
                            </label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                                placeholder="Ex: admin"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Senha
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2"
                            />
                        </div>

                        {error && (
                            <div className="text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
