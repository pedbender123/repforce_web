import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HomeIcon, 
  UsersIcon, 
  ShoppingCartIcon, 
  ArrowLeftOnRectangleIcon 
} from '@heroicons/react/24/outline';

// Placeholder para o Logo
const LogoSmall = () => (
  <span className="text-2xl font-bold text-white tracking-wider">
    REPFORCE
  </span>
);

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
    <div className="flex h-screen bg-repforce-light">
      {/* Sidebar (Menu Lateral) */}
      <div className="w-64 flex flex-col bg-repforce-dark text-white">
        <div className="h-16 flex items-center justify-center shadow-md">
          <LogoSmall />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                location.pathname === item.href
                  ? 'bg-repforce-primary text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
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
        
        {/* Botão de Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
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
        {/* Header (opcional) */}
        <header className="bg-white shadow-sm h-16 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            {/* Pode adicionar um título da página aqui */}
            <h1 className="text-xl font-semibold text-gray-900">
              {navigation.find(nav => nav.href === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
        </header>
        
        {/* Área de conteúdo rolável */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet /> {/* O conteúdo da rota (ex: AppClientList) é renderizado aqui */}
        </main>
      </div>
    </div>
  );
}