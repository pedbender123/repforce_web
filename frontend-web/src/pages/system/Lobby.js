import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function Lobby() {
    const { user, selectTenant, logout, isSysAdmin } = useContext(AuthContext);
    const navigate = useNavigate();

    // If SysAdmin, usually they go to SysAdmin Dashboard, but if they land here:
    useEffect(() => {
        if (isSysAdmin) {
            navigate('/sysadmin/dashboard');
        }
    }, [isSysAdmin, navigate]);

    const handleSelectFn = (slug) => {
        selectTenant(slug);
        navigate('/app/dashboard');
    };

    const memberships = user?.memberships || [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="absolute top-4 right-4"><ThemeToggle /></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <img className="mx-auto h-12 w-auto" src="/logo_clara.png" alt="Repforce" />
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    Selecione seu Espaço de Trabalho
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Você tem acesso aos seguintes ambientes:
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {memberships.length === 0 ? (
                        <div className="text-center">
                            <p className="text-gray-500 dark:text-gray-300 mb-4">
                                Você ainda não é membro de nenhum tenant.
                            </p>
                            <button
                                onClick={logout}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                            >
                                Sair
                            </button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {memberships.map((membership) => (
                                <li key={membership.tenant.id} className="py-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-medium text-gray-900 dark:text-white truncate">
                                                {membership.tenant.name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                Role: {membership.role}
                                            </p>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => handleSelectFn(membership.tenant.slug)}
                                                className="inline-flex items-center shadow-sm px-4 py-2 border border-blue-500 text-sm leading-5 font-medium rounded-full text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-blue-400 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                Entrar
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <button
                            onClick={logout}
                            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            Sair e acessar com outra conta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
