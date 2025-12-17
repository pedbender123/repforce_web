import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import {
  LogOut,
  LayoutDashboard,
  Package,
  Users,
  Menu,
  X,
  Sun,
  Moon,
  Shield,
  Briefcase
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Mapeamento de Ícones
  const iconMap = {
    'LayoutDashboard': <LayoutDashboard size={20} />,
    'Package': <Package size={20} />,
    'Users': <Users size={20} />,
    'Shield': <Shield size={20} />,
    'Briefcase': <Briefcase size={20} />
  };

  // --- ÁREA ADMIN PADRÃO ---
  const adminArea = {
    id: 'admin_default',
    name: 'Administração',
    icon: 'Shield',
    pages_json: [
      { label: 'Dashboard', path: '/admin/dashboard' },
      { label: 'Produtos', path: '/admin/products' },
      { label: 'Usuários', path: '/admin/users' },
      { label: 'Cargos', path: '/admin/roles' }
    ]
  };

  // Como o Admin por enquanto só tem uma "Area" de gestão, usamos ela como única.
  // Futuramente, se o Admin tiver acesso a outras areas (ex: Vendas), elas entrariam aqui.
  const displayAreas = [adminArea];

  const [activeArea, setActiveArea] = useState(adminArea);

  // Sincroniza área ativa com URL
  useEffect(() => {
    const foundArea = displayAreas.find(area => {
      return area.pages_json.some(page => location.pathname.startsWith(page.path));
    });
    if (foundArea) {
      setActiveArea(foundArea);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper para renderizar ícone
  const renderIcon = (iconName) => iconMap[iconName] || <Briefcase size={20} />;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        <div
          className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title="Clique para alternar o menu"
        >
          {/* LOGO CORRIGIDA E REDIMENSIONÁVEL */}
          <img src="/logo_clara.png" alt="RepForce" className="h-8 w-auto object-contain" />
        </div>

        <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
          <p className={`px-4 text-xs font-semibold text-gray-400 uppercase mb-2 ${isCollapsed ? 'text-center' : ''}`}>
            {isCollapsed ? 'Apps' : 'Gestão'}
          </p>
          <ul className="space-y-1 px-3">
            {displayAreas.map((area) => (
              <li key={area.id}>
                <button
                  onClick={() => {
                    setActiveArea(area);
                    if (area.pages_json && area.pages_json.length > 0) {
                      navigate(area.pages_json[0].path);
                    }
                  }}
                  className={`w-full flex items-center py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${isCollapsed ? 'justify-center px-0' : 'px-4'
                    } ${activeArea?.id === area.id
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  title={isCollapsed ? area.name : ''}
                >
                  <span className={`${isCollapsed ? '' : 'mr-3'}`}>{renderIcon(area.icon)}</span>
                  {!isCollapsed && <span className="whitespace-nowrap">{area.name}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate" title={user?.full_name}>
                    {user?.full_name || 'Admin'}
                  </span>
                </div>
                <button onClick={toggleTheme} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={18} className="mr-2" />
                Sair
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <button onClick={toggleTheme} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20 p-2 transition-colors"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <img src="/logo_clara.png" alt="RepForce" className="h-6 mr-2" />
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 dark:text-gray-300">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* --- MENU SUPERIOR (PÁGINAS) --- */}
        <div className="hidden md:flex bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-0 items-end h-16 shadow-sm z-10 overflow-x-auto">
          {activeArea?.pages_json?.map((page) => {
            const isPageActive = location.pathname.startsWith(page.path);
            return (
              <Link
                key={page.path}
                to={page.path}
                className={`mr-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isPageActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
                  }`}
              >
                {page.label}
              </Link>
            );
          })}
        </div>


        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-800 z-50 border-b border-gray-200 dark:border-gray-700 shadow-lg">
            <nav className="p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Páginas</p>
              <ul className="space-y-2">
                {activeArea?.pages_json?.map((page) => (
                  <li key={page.path}>
                    <Link
                      to={page.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${location.pathname.startsWith(page.path)
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      {/* Icone individual para página removido na tabs, mas no mobile pode manter simples */}
                      {page.label}
                    </Link>
                  </li>
                ))}
                <li className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                  <button onClick={toggleTheme} className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {theme === 'dark' ? <Sun size={18} className="mr-3" /> : <Moon size={18} className="mr-3" />}
                    Alterar Tema
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 dark:text-red-400"
                  >
                    <LogOut size={18} className="mr-3" />
                    Sair
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;