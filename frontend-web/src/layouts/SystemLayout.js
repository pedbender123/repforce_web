import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    BuildingOfficeIcon,
    CurrencyDollarIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import SysAdminTopHeaderActions from '../components/SysAdminTopHeaderActions';
import { Menu, X } from 'lucide-react'; // For mobile interaction if needed

export default function SystemLayout() {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Blue Theme for sidebar active state
    const navigation = [
        { name: 'Empresas', href: '/sysadmin/companies', icon: BuildingOfficeIcon },
        { name: 'Faturamento', href: '/sysadmin/billing', icon: CurrencyDollarIcon },
        { name: 'Diagnósticos', href: '/sysadmin/diagnostics', icon: ClipboardDocumentCheckIcon },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">

            {/* Sidebar - Matching CrmLayout Style */}
            <aside className={`hidden md:flex flex-col bg-gray-900 dark:bg-black border-r border-gray-800 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
                <div className="flex items-center justify-center h-16 shrink-0 px-4 bg-gray-900 border-b border-gray-800 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                    <img src="/logo_clara.png" alt="RepForce" className="h-8 w-auto object-contain" />
                </div>

                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`
                  group flex items-center px-2 py-3 text-sm font-medium rounded-lg transition-colors duration-150
                  ${isActive
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                                title={isCollapsed ? item.name : ''}
                            >
                                <item.icon
                                    className={`flex-shrink-0 h-6 w-6 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'} ${isCollapsed ? '' : 'mr-3'}`}
                                    aria-hidden="true"
                                />
                                {!isCollapsed && <span>{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800 flex justify-center">
                    <span className="text-xs text-gray-600">v2.1</span>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Top Header - White/Dark bar with Right Actions ONLY */}
                <header className="flex items-center justify-end px-6 py-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-10">
                    {/* No central tabs/pages as requested ("menu superior que não precisa ter nada de paginas") */}
                    <div className="flex items-center">
                        <SysAdminTopHeaderActions />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
