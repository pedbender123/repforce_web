import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { 
  HomeIcon, 
  UsersIcon, 
  ShoppingCartIcon,
  ArrowLeftOnRectangleIcon 
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: HomeIcon },
  { name: 'Meus Clientes', href: '/app/clients', icon: UsersIcon },
  { name: 'Novo Pedido', href: '/app/orders/new', icon: ShoppingCartIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function AppLayout() {
  const { logout, userProfile } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar - Moldura Antiga */}
      <div className="w-64 flex flex-col bg-repforce-dark dark:bg-black text-white transition-colors"> 
        <div className="h-20 flex items-center justify-center shadow-md px-4 border-b border-gray-700">
           {/* Logo Clara para fundo escuro */}
           <img 
             src="/logo_clara.png" 
             alt="Repforce App" 
             className="h-10 w-auto object-contain"
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
              {navigation.find(nav => location.pathname.startsWith(nav.href))?.name || 'Área do Representante'}
            </h1>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-bold border border-green-200 dark:border-green-800 uppercase">
                 {userProfile || 'Representante'}
               </div>
            </div>
          </div>
        </header>
        
        {/* Renderiza as páginas Server-Driven ou Estáticas dentro desta moldura */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
}