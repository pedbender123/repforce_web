import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { 
  HomeIcon, 
  UserGroupIcon, 
  ArrowLeftOnRectangleIcon 
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Usuários', href: '/admin/users', icon: UserGroupIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function AdminLayout() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar - Fundo ESCURO para a logo CLARA aparecer */}
      <div className="w-64 flex flex-col bg-repforce-dark dark:bg-black text-white transition-colors"> 
        <div className="h-20 flex items-center justify-center shadow-md px-4 border-b border-gray-700">
           <img 
             src="/logo_clara.png" 
             alt="Repforce Admin" 
             className="h-10 w-auto object-contain" // object-contain impede o efeito "linguiça"
           />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                location.pathname.startsWith(item.href)
                  ? 'bg-repforce-primary text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
              )}
            >
              <item.icon
                className="mr-3 flex-shrink-0 h-6 w-6"
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeftOnRectangleIcon
              className="mr-3 flex-shrink-0 h-6 w-6"
              aria-hidden="true"
            />
            Sair
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm h-16 z-10 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {navigation.find(nav => location.pathname.startsWith(nav.href))?.name || 'Admin Dashboard'}
            </h1>
            <div className="flex items-center space-x-4">
              {/* Botão de Tema PRESENTE */}
              <ThemeToggle />
              <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold border border-blue-200 dark:border-blue-800">
                 ADMIN (TENANT)
               </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
}