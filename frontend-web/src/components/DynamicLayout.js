import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react'; // Importa todos os ícones para usar dinamicamente
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const DynamicLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [menuData, setMenuData] = useState([]);
  const [activeArea, setActiveArea] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // 1. Buscar o Menu na API ao carregar
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await apiClient.get('/navigation/menu');
        setMenuData(response.data);
        
        // Tenta descobrir qual área deve estar ativa baseada na URL atual
        const currentPath = location.pathname;
        const foundArea = response.data.find(area => 
          area.pages.some(page => page.path === currentPath)
        );
        
        if (foundArea) {
          setActiveArea(foundArea);
        } else if (response.data.length > 0 && !activeArea) {
          // Se não achar (ex: url raiz), ativa a primeira área por padrão
           setActiveArea(response.data[0]);
        }
      } catch (error) {
        console.error("Falha ao carregar menu:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchMenu();
  }, [user]); // Roda quando o usuário loga

  // Atualiza a área ativa se o usuário navegar manualmente
  useEffect(() => {
    if (menuData.length > 0) {
        const foundArea = menuData.find(area => 
            area.pages.some(page => page.path === location.pathname)
        );
        if (foundArea) setActiveArea(foundArea);
    }
  }, [location.pathname, menuData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper para renderizar ícone pelo nome (string) vindo do banco
  const RenderIcon = ({ name, size = 20 }) => {
    const IconComponent = Icons[name] || Icons.HelpCircle;
    return <IconComponent size={size} />;
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50">Carregando interface...</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* --- SIDEBAR (Áreas Macro) --- */}
      <aside 
        className={`${sidebarOpen ? 'w-20' : 'w-0'} bg-indigo-900 text-white flex flex-col transition-all duration-300 ease-in-out z-20`}
      >
        <div className="h-16 flex items-center justify-center border-b border-indigo-800">
          <div className="font-bold text-xl tracking-tighter">RF</div>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-2 items-center overflow-y-auto">
          {menuData.map((area) => (
            <button
              key={area.id}
              onClick={() => {
                  setActiveArea(area);
                  // Navega para a primeira página da área automaticamente
                  if (area.pages.length > 0) navigate(area.pages[0].path);
              }}
              className={`p-3 rounded-xl transition-colors relative group ${
                activeArea?.id === area.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <RenderIcon name={area.icon} size={24} />
              
              {/* Tooltip (Hover) */}
              <div className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                {area.label}
              </div>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-800 flex justify-center">
          <button onClick={handleLogout} className="text-indigo-300 hover:text-white transition-colors" title="Sair">
            <LogOut size={24} />
          </button>
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Horizontal (Navegação dentro da Área) */}
        <header className="bg-white shadow-sm h-16 flex items-center px-6 justify-between z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-indigo-600 transition-colors lg:hidden">
              <Menu size={24} />
            </button>
            
            {activeArea && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-500 font-medium">
                   <RenderIcon name={activeArea.icon} size={18} />
                   <span>{activeArea.label}</span>
                </div>
                
                <ChevronRight size={16} className="text-gray-300" />
                
                {/* Abas / Links das Páginas */}
                <div className="flex space-x-1">
                    {activeArea.pages.map(page => (
                        <button
                            key={page.id}
                            onClick={() => navigate(page.path)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                location.pathname === page.path 
                                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            {page.label}
                        </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                 <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Tenant</div>
                 <div className="text-sm font-bold text-gray-700">
                    {user?.tenant_schema ? user.tenant_schema.replace('tenant_', '').toUpperCase() : 'SISTEMA'}
                 </div>
             </div>
             <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
                {user?.username?.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        {/* Onde as páginas são renderizadas */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
           <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default DynamicLayout;