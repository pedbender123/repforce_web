import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    BuildingOfficeIcon,
    CurrencyDollarIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function SystemLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const navigation = [
        { name: 'Empresas', href: '/sysadmin/companies', icon: BuildingOfficeIcon },
        { name: 'Faturamento', href: '/sysadmin/billing', icon: CurrencyDollarIcon },
    ];

    const handleLogout = () => {
        localStorage.removeItem('sysadmin_token');
        navigate('/sysadmin/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
            {/* Sidebar */}
            <div className="fixed inset-y-0 flex z-30 flex-col w-64 bg-gray-900 border-r border-gray-800">
                <div className="flex items-center justify-center h-16 shrink-0 px-4 bg-gray-900 text-white font-bold text-xl">
                    Clara System
                </div>
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <nav className="flex-1 px-2 py-4 space-y-1">
                        {navigation.map((item) => {
                            const isActive = location.pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${isActive
                                            ? 'bg-gray-800 text-white'
                                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                  `}
                                >
                                    <item.icon
                                        className={`mr-3 flex-shrink-0 h-6 w-6 ${isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-300'}`}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* User / Logout */}
                <div className="shrink-0 flex items-center p-4 bg-gray-900 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-sm font-medium text-gray-300 hover:text-white"
                    >
                        <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6 text-gray-400" />
                        <span>Sair</span>
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col pl-64">
                <main className="flex-1 py-6 px-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
