import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HomeIcon, 
  UserGroupIcon, 
  ArrowLeftOnRectangleIcon,
  BuildingOfficeIcon // Ícone novo
} from '@heroicons/react/24/outline';

// Links de navegação do Admin
const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Usuários', href: '/admin/users', icon: UserGroupIcon },
  { name: 'Tenants', href: '/admin/tenants', icon: BuildingOfficeIcon }, // Novo link
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Este é um layout similar ao AppLayout, mas para o /admin
// Pode ter cores diferentes se desejar (ex: um tom mais sóbrio)
export default function AdminLayout() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 flex flex-col bg-gray-800 text-white">
        <div className="h-16 flex items-center justify-center shadow-md">
           <span className="text-2xl font-bold text-white tracking-wider">ADMIN</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                location.pathname.startsWith(item.href)
                  ? 'bg-gray-900 text-white'
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
        <header className="bg-white shadow-sm h-16 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {/* Lógica simples para exibir o título da página */}
              {navigation.find(nav => location.pathname.startsWith(nav.href))?.name || 'Painel do Administrador'}
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}