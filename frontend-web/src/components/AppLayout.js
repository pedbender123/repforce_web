import AppTopHeaderActions from './AppTopHeaderActions';
// ... imports

// ... inside AppLayout component
const adminArea = {
  id: 'default_admin',
  name: 'Administração',
  icon: 'Shield',
  pages_json: [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'Produtos', path: '/admin/products' },
    { label: 'Pedidos', path: '/admin/orders' },
    { label: 'Clientes', path: '/admin/clients' },
    // { label: 'Usuários', path: '/admin/users' },  <-- Moved to Config
    // { label: 'Cargos', path: '/admin/roles' }      <-- Moved to Config
  ]
};

// ... inside return (Header Section)
{/* --- MENU SUPERIOR (TABS DA ÁREA ATIVA) --- */ }
<div className="hidden md:flex bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-0 items-center h-16 shadow-sm z-10">
  <div className="flex items-end h-full overflow-x-auto mr-auto">
    {activeArea?.pages_json?.map((page) => {
      // ... existing map logic
      const isPageActive = location.pathname.startsWith(page.path);
      return (
        <Link
          key={page.path}
          to={page.path}
          className={`mr-6 py-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isPageActive
            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
            }`}
        >
          {page.label}
        </Link>
      );
    })}
  </div>

  {/* Right Actions Section (NEW) */}
  <AppTopHeaderActions />
</div>

{/* Mobile Menu */ }
{
  isMobileMenuOpen && (
    <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-800 z-50 border-b border-gray-200 dark:border-gray-700 shadow-lg">
      <nav className="p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Área: {activeArea?.name}</p>
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
                {page.label}
              </Link>
            </li>
          ))}
          {/* Seletor de Área Mobile */}
          <li className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Trocar Área</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {userAreas.map(area => (
                <button
                  key={area.id}
                  onClick={() => { setActiveArea(area); setIsMobileMenuOpen(false); if (area.pages_json?.[0]) navigate(area.pages_json[0].path); }}
                  className={`px-3 py-1 text-xs border rounded transition-colors whitespace-nowrap ${activeArea?.id === area.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'dark:text-white dark:border-gray-600'
                    }`}
                >
                  {area.name}
                </button>
              ))}
            </div>
          </li>
          <li className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
            <button onClick={toggleTheme} className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
              {theme === 'dark' ? <Sun size={18} className="mr-3" /> : <Moon size={18} className="mr-3" />}
              Tema
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
  )
}


<main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
  <Outlet />
</main>
      </div >
    </div >
  );
};

export default AppLayout;