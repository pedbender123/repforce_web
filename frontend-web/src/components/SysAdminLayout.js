import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSysAdminAuth } from '../context/SysAdminAuthContext';
import ThemeToggle from './ThemeToggle';
import { ArrowLeftOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function SysAdminLayout({ menuItems }) {
  const { logout } = useSysAdminAuth();
  const location = useLocation();

  // Se não vierem itens de menu (loading), usa um array vazio
  const tabs = menuItems?.flatMap(area => 
    area.pages.map(page => ({
        name: page.label,
        href: page.path
    }))
  ) || [];

  // Adiciona o Dashboard manualmente no início se não vier do banco
  if (!tabs.find(t => t.href === '/sysadmin/dashboard')) {
      tabs.unshift({ name: 'Dashboard', href: '/sysadmin/dashboard' });
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      
      {/* SIDEBAR */}
      <div className="w-16 flex flex-col items-center bg-repforce-dark dark:bg-black text-white py-4 z-20 shadow-xl"> 
        <div className="mb-6 p-2 bg-blue-600 rounded-lg shadow-lg">
           <span className="font-bold text-xl">RF</span>
        </div>
        <div className="p-3 bg-white/10 rounded-md cursor-pointer mb-4 border-l-4 border-blue-500">
            <Cog6ToothIcon className="h-6 w-6 text-white" />
        </div>
        <div className="mt-auto mb-4">
          <button onClick={logout} title="Sair" className="p-2 hover:bg-red-600 rounded-md transition-colors">
            <ArrowLeftOnRectangleIcon className="h-6 w-6 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="bg-white dark:bg-gray-800 h-14 border-b dark:border-gray-700 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                REPFORCE <span className="mx-2">/</span> SYSTEM ADMIN
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs border border-red-200">
                        SA
                    </div>
                </div>
            </div>
        </header>

        {/* ABAS DINÂMICAS */}
        <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-6 pt-1">
            <nav className="-mb-px flex space-x-6 overflow-x-auto">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.href;
                    return (
                        <Link
                            key={tab.name}
                            to={tab.href}
                            className={`
                                whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors
                                ${isActive 
                                    ? 'border-repforce-primary text-repforce-primary dark:text-blue-400 dark:border-blue-400' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                            `}
                        >
                            {tab.name}
                        </Link>
                    );
                })}
            </nav>
        </div>

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6 relative">
          <div className="min-h-full">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}