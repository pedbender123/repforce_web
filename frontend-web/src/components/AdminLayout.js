import React, { useContext, useState } from 'react';
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
  Moon
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Produtos', path: '/admin/products', icon: <Package size={20} /> },
    { name: 'Usuários', path: '/admin/users', icon: <Users size={20} /> },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar Desktop */}
      <aside 
        className={`hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div 
          className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title="Clique para alternar o menu"
        >
           <img src="/logo_clara.png" alt="RepForce" className="h-8" />
           {!isCollapsed && (
             <span className="ml-2 text-xl font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
               Admin
             </span>
           )}
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    isCollapsed ? 'justify-center px-0' : 'px-4'
                  } ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  title={isCollapsed ? item.name : ''}
                >
                  <span className={`${isCollapsed ? '' : 'mr-3'}`}>{item.icon}</span>
                  {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </Link>
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

      {/* Mobile Header (Mantido) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
             <img src="/logo_clara.png" alt="RepForce" className="h-6 mr-2" />
             <span className="font-bold text-gray-800 dark:text-white">RF Admin</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 dark:text-gray-300">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-800 z-50 border-b border-gray-200 dark:border-gray-700 shadow-lg">
            <nav className="p-4">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                ))}
                 <li className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                   <button onClick={toggleTheme} className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {theme === 'dark' ? <Sun size={18} className="mr-3"/> : <Moon size={18} className="mr-3"/>}
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