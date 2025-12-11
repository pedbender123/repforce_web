import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import * as Icons from 'lucide-react';

export default function DynamicLayout() {
  const { logout, user } = useAuth();
  const [menu, setMenu] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/navigation/menu').then(res => setMenu(res.data));
  }, []);

  const Icon = ({ name }) => {
    const LucideIcon = Icons[name] || Icons.Circle;
    return <LucideIcon size={20} />;
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center font-bold text-xl border-b border-slate-700">REPFORCE</div>
        <nav className="flex-1 p-4 space-y-4">
          {menu.map(area => (
            <div key={area.id}>
              <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold mb-2">
                <Icon name={area.icon} /> {area.label}
              </div>
              <div className="space-y-1 pl-4">
                {area.pages.map(page => (
                  <button key={page.path} onClick={() => navigate(page.path)} className="block text-sm hover:text-blue-400">
                    {page.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <button onClick={() => { logout(); navigate('/login'); }} className="p-4 border-t border-slate-700 hover:bg-slate-800">Sair</button>
      </aside>
      <main className="flex-1 bg-gray-100 overflow-auto">
        <header className="h-16 bg-white shadow flex items-center justify-between px-6">
            <h1 className="font-bold text-gray-700">Olá, {user?.sub}</h1>
        </header>
        <Outlet />
      </main>
    </div>
  );
}