import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SysAdminAuthContext } from '../context/SysAdminAuthContext';
import { ThemeContext } from '../context/ThemeContext';
import sysAdminApiClient from '../api/sysAdminApiClient';
import { 
  LogOut, 
  Menu, 
  X,
  Sun,
  Moon,
  ShieldAlert,
  Settings,
  Database,
  Server,
  Layout,
  Briefcase
} from 'lucide-react';

const fetchMyAreas = async () => {
    try {
        const { data: allAreas } = await sysAdminApiClient.get('/sysadmin/areas');
        return allAreas;
    } catch (e) {
        return [];
    }
};

const SysAdminLayout = () => {
  const { logout } = useContext(SysAdminAuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const iconMap = {
    'ShieldAlert': <ShieldAlert size={20} />,
    'Settings': <Settings size={20} />,
    'Database': <Database size={20} />,
    'Server': <Server size={20} />,
    'Layout': <Layout size={20} />,
    'Briefcase': <Briefcase size={20} />
  };

  // --- ÁREA LOCAL COMPLETA (Priority) ---
  const systemManagementArea = {
      id: 'sys_local_override', // ID único para evitar conflito
      name: 'Gestão do Sistema',
      icon: 'ShieldAlert',
      pages_json: [
        { label: 'Dashboard', path: '/sysadmin/dashboard' },
        { label: 'Tenants (Empresas)', path: '/sysadmin/tenants' },
        { label: 'Usuários Globais', path: '/sysadmin/users' },
        { label: 'Gestão de Áreas', path: '/sysadmin/areas' } // Página faltante adicionada
      ]
  };

  const { data: fetchedAreas, isLoading } = useQuery(['sysAdminMenuAreas'], fetchMyAreas);

  // LÓGICA DE DEDUPLICAÇÃO:
  // 1. Pegamos as áreas do banco.
  // 2. Filtramos qualquer área que tenha o nome "Gestão do Sistema" para evitar duplicidade com a nossa local.
  // 3. Colocamos a nossa systemManagementArea local (completa) sempre em primeiro.
  const filteredFetchedAreas = fetchedAreas 
    ? fetchedAreas.filter(a => a.name !== 'Gestão do Sistema') 
    : [];

  const displayAreas = [systemManagementArea, ...filteredFetchedAreas];

  const [activeArea, setActiveArea] = useState(systemManagementArea);

  // Sincroniza área ativa com URL
  useEffect(() => {
    // Tenta encontrar a área correspondente à URL atual
    const foundArea = displayAreas.find(area => {
        const pages = area.pages_json || area.pages;
        return Array.isArray(pages) && pages.some(page => location.pathname.startsWith(page.path));
    });

    if (foundArea) {
        setActiveArea(foundArea);
    }
    // Não colocamos "else" para evitar resetar para a primeira área se o usuário estiver em uma sub-rota não mapeada
  }, [location.pathname, fetchedAreas]); // Dependência em fetchedAreas para re-executar quando os dados chegarem

  const handleLogout = () => {
    logout();
    navigate('/sysadmin/login');
  };

  // Helper seguro para páginas
  const activePages = activeArea?.pages_json || activeArea?.pages || [];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      
      {/* Sidebar Desktop */}
      <aside 
        className={`hidden md:flex flex-col bg-gray-900 dark:bg-black border-r border-gray-800 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div 
          className="h-16 flex items-center justify-center border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <img src="/logo_clara.png" alt="RepForce" className="h-8 w-auto object-contain" />
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
          <p className={`px-4 text-xs font-semibold text-gray-500 uppercase mb-2 ${isCollapsed ? 'text-center' : ''}`}>
             {isCollapsed ? 'Áreas' : 'Áreas do Sistema'}
          </p>
          <ul className="space-y-1 px-3">
            {displayAreas.map((area) => (
              <li key={area.id || area.name}>
                <button
                  onClick={() => {
                      setActiveArea(area);
                      // Navega para a primeira página da área
                      const pages = area.pages_json || area.pages;
                      if (pages && pages.length > 0) {
                          navigate(pages[0].path);
                      }
                  }}
                  className={`w-full flex items-center py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    isCollapsed ? 'justify-center px-0' : 'px-4'
                  } ${
                    (activeArea?.id === area.id || activeArea?.name === area.name)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={isCollapsed ? area.name : ''}
                >
                  <span className={`${isCollapsed ? '' : 'mr-3'}`}>
                    {iconMap[area.icon] || <ShieldAlert size={20}/>}
                  </span>
                  {!isCollapsed && <span className="whitespace-nowrap">{area.name}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800">
            {!isCollapsed ? (
                <>
                  <div className="flex items-center justify-between mb-4 px-2">
                     <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">SysAdmin</span>
                        <span className="text-xs text-gray-500">Root Access</span>
                     </div>
                     <button onClick={toggleTheme} className="text-gray-500 hover:text-white p-1 rounded hover:bg-gray-800">
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                     </button>
                  </div>
                  <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">
                    <LogOut size={18} className="mr-2" />
                    Sair
                  </button>
                </>
            ) : (
                <div className="flex flex-col items-center space-y-4">
                    <button onClick={toggleTheme} className="text-gray-500 hover:text-white p-2 rounded hover:bg-gray-800">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button onClick={handleLogout} className="text-red-400 hover:bg-red-900/30 p-2 rounded-lg transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 bg-gray-900 text-white border-b border-gray-800">
          <div className="flex items-center">
             <img src="/logo_clara.png" alt="RepForce" className="h-6 mr-2" />
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* --- MENU SUPERIOR (TABS DA ÁREA ATIVA) --- */}
        <div className="hidden md:flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-0 items-end h-16 shadow-sm z-10 overflow-x-auto">
            {activePages.map((page) => {
                const isPageActive = location.pathname.startsWith(page.path);
                return (
                    <Link
                        key={page.path}
                        to={page.path}
                        className={`mr-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            isPageActive 
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
                        }`}
                    >
                        {page.label}
                    </Link>
                );
            })}
        </div>

         {/* Mobile Menu */}
         {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-gray-900 text-white z-50 border-b border-gray-800 shadow-lg">
            <nav className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Páginas de {activeArea?.name}</p>
              <ul className="space-y-2">
                {activePages.map((page) => (
                  <li key={page.path}>
                    <Link
                      to={page.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                        location.pathname.startsWith(page.path)
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400'
                      }`}
                    >
                      {page.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SysAdminLayout;