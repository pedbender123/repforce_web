import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle'; // Importa o botão
import { 
  HomeIcon, 
  UsersIcon, 
  ShoppingCartIcon, 
  ArrowLeftOnRectangleIcon 
} from '@heroicons/react/24/outline';

// Links de navegação
const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: HomeIcon },
  { name: 'Clientes', href: '/app/clients', icon: UsersIcon },
  { name: 'Novo Pedido', href: '/app/orders/new', icon: ShoppingCartIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function AppLayout() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    // Adiciona suporte a modo escuro no fundo geral
    <div className="flex h-screen bg-repforce-light dark:bg-gray-900 transition-colors duration-300">
      
      {/* Sidebar (Menu Lateral) - Sempre escuro ou preto no modo escuro */}
      <div className="w-64 flex flex-col bg-repforce-dark dark:bg-black text-white transition-colors duration-300">
        <div className="h-16 flex items-center justify-center shadow-md px-4">
          {/* No menu lateral escuro, usamos sempre a logo clara */}
          <img 
            src="/logo_clara.png" 
            alt="Repforce" 
            className="h-8 w-auto object-contain"
          />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                location.pathname === item.href
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
            className="group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
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
        {/* Header Superior */}
        <header className="bg-white dark:bg-gray-800 shadow-sm h-16 z-10 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {navigation.find(nav => nav.href === location.pathname)?.name || 'Dashboard'}
            </h1>
            
            <div className="flex items-center space-x-4">
              {/* AQUI ESTÁ O BOTÃO SOL/LUA */}
              <ThemeToggle />
              
              <div className="h-8 w-8 rounded-full bg-repforce-primary text-white flex items-center justify-center font-bold">
                R
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6 bg-repforce-light dark:bg-gray-900 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}