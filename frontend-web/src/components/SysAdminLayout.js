import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSysAdminAuth } from '../context/SysAdminAuthContext'; // <-- USA O AUTH NOVO
import { 
  HomeIcon, 
  UserGroupIcon, 
  ArrowLeftOnRectangleIcon,
  BuildingOfficeIcon,
  GlobeAltIcon // Ícone novo
} from '@heroicons/react/24/outline';

// Links de navegação do SysAdmin
const navigation = [
  { name: 'Dashboard', href: '/sysadmin/dashboard', icon: HomeIcon },
  { name: 'Ver Todos Usuários', href: '/sysadmin/all-users', icon: GlobeAltIcon },
  { name: 'Gerenciar Tenants', href: '/sysadmin/tenants', icon: BuildingOfficeIcon },
  { name: 'Gerenciar SysAdmins', href: '/sysadmin/systems-users', icon: UserGroupIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function SysAdminLayout() {
  const { logout } = useSysAdminAuth(); // <-- USA O LOGOUT NOVO
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 flex flex-col bg-gray-900 text-white"> 
        <div className="h-16 flex items-center justify-center shadow-md">
           <span className="text-2xl font-bold text-white tracking-wider">SYSADMIN</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                location.pathname.startsWith(item.href)
                  ? 'bg-gray-700 text-white'
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
              {navigation.find(nav => location.pathname.startsWith(nav.href))?.name || 'Painel do SysAdmin'}
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