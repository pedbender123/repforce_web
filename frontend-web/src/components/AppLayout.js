import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { 
  LogOut, 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Menu, 
  X, 
  Sun, 
  Moon,
  Package,
  Map
} from 'lucide-react';

const AppLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Clientes', path: '/app/clients', icon: <Users size={20} /> }, // Mantido apenas como lista de contatos para pedidos
    { name: 'Novo Pedido', path: '/app/orders/new', icon: <ShoppingCart size={20} /> },
    // { name: 'Rotas', path: '/app/routes/new', icon: <Map size={20} /> }, // Opcional: Rotas podem ser consideradas logistica e não CRM
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-6 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
           <img src="/logo_clara.png" alt="RepForce" className="h-8 mr-2" />
           <span className="text-xl font-bold text-blue-600 dark:text-blue-400">RepForce</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 px-2">
             <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                {user?.full_name || 'Usuário'}
             </span>
             <button onClick={toggleTheme} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
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
        </div>
      </aside>

      {/* Mobile Header & Menu */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <img src="/logo_clara.png" alt="RepForce" className="h-6 mr-2" />
            <span className="font-bold text-gray-800 dark:text-white">RepForce</span>
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;