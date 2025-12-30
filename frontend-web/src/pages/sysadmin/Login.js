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
            // New V1 Endpoint
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
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 justify-center items-center p-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 md:p-12 rounded-lg shadow-xl border-t-4 border-purple-600 dark:border-purple-500 transition-colors">
                <div className="mb-8 text-center">
                    {/* Container escuro para a logo aparecer bem em ambos os modos */}
                    <div className="bg-gray-900 p-4 rounded-lg inline-block mb-4">
                        <img
                            src="/logo_clara.png"
                            alt="Repforce SysAdmin"
                            className="h-10 w-auto object-contain" // Height 10 as per original
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Área Restrita - SysAdmin
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                        Acesso exclusivo para gestão do sistema.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Usuário
                        </label>
                        <div className="mt-1">
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                                placeholder="Ex: admin"
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
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
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
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 transition-colors"
                        >
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
