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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Blue Theme for sidebar active state
    const navigation = [
        { name: 'System Hub', href: '/sysadmin/config', icon: BuildingOfficeIcon },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">

            {/* Sidebar - Desktop */}
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

            {/* Mobile Sidebar (Drawer) */}
            {isMobileMenuOpen && (
                <div className="relative z-50 md:hidden" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-gray-900/80" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <div className="fixed inset-y-0 left-0 flex">
                        <div className="relative mr-16 flex w-full max-w-xs flex-1">
                             <div className="absolute top-0 right-0 -mr-12 pt-2">
                                <button type="button" className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setIsMobileMenuOpen(false)}>
                                    <span className="sr-only">Close sidebar</span>
                                    <X className="h-6 w-6 text-white" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
                                <div className="flex h-16 shrink-0 items-center">
                                    <img className="h-8 w-auto" src="/logo_clara.png" alt="RepForce" />
                                </div>
                                <nav className="flex flex-1 flex-col">
                                    <ul className="flex flex-1 flex-col gap-y-7">
                                        <li>
                                            <ul className="-mx-2 space-y-1">
                                                {navigation.map((item) => (
                                                    <li key={item.name}>
                                                        <Link
                                                            to={item.href}
                                                            onClick={() => setIsMobileMenuOpen(false)}
                                                            className={`
                                                                group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                                                                ${location.pathname.startsWith(item.href)
                                                                    ? 'bg-gray-800 text-white'
                                                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'}
                                                            `}
                                                        >
                                                            <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                                            {item.name}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Mobile Top Header */}
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 md:hidden dark:bg-gray-900 dark:border-gray-800">
                    <button type="button" className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div className="flex-1 text-sm font-semibold leading-6 text-gray-900 dark:text-white">SysAdmin</div>
                    <SysAdminTopHeaderActions />
                </div>

                {/* Desktop Top Header - White/Dark bar with Right Actions ONLY */}
                <header className="hidden md:flex items-center justify-end px-6 py-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-10">
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
