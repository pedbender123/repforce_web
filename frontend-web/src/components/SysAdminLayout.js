import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSysAdminAuth } from '../context/SysAdminAuthContext';

export default function SysAdminLayout({ menuItems }) {
  const { logout } = useSysAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-red-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center font-bold text-xl">SYSADMIN</div>
            <button onClick={() => { logout(); navigate('/sysadmin/login'); }} className="text-sm bg-red-800 px-3 py-1 rounded">Sair</button>
          </div>
          <nav className="flex space-x-4 pb-2 overflow-x-auto">
            <Link to="/sysadmin/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-800">Dashboard</Link>
            {menuItems?.map(area => area.pages.map(page => (
                <Link key={page.path} to={page.path} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-800">
                    {page.label}
                </Link>
            )))}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}