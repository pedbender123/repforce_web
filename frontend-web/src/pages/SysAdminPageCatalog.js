// Lista de todas as páginas disponíveis no sistema para criação de menus
export const SYSTEM_PAGES = [
  // --- PÁGINAS SYSADMIN (Tenant: Systems) ---
  { label: 'SysAdmin - Dashboard', path: '/sysadmin/dashboard', category: 'SysAdmin' },
  { label: 'SysAdmin - Empresas (Tenants)', path: '/sysadmin/tenants', category: 'SysAdmin' },
  { label: 'SysAdmin - Usuários Globais', path: '/sysadmin/users', category: 'SysAdmin' },
  { label: 'SysAdmin - Áreas do Sistema', path: '/sysadmin/areas', category: 'SysAdmin' },

  // --- PÁGINAS APP (Operacional) ---
  { label: 'App - Dashboard', path: '/app/dashboard', category: 'App' },
  { label: 'App - Clientes', path: '/app/clients', category: 'App' },
  { label: 'App - Novo Cliente', path: '/app/clients/new', category: 'App' },
  { label: 'App - Novo Pedido', path: '/app/orders/new', category: 'App' },
  { label: 'App - Nova Rota', path: '/app/routes/new', category: 'App' },

  // --- PÁGINAS ADMIN (Gestão do Tenant) ---
  { label: 'Admin - Dashboard', path: '/admin/dashboard', category: 'Admin' },
  { label: 'Admin - Produtos', path: '/admin/products', category: 'Admin' },
  { label: 'Admin - Equipe (Usuários)', path: '/admin/users', category: 'Admin' },
  { label: 'Admin - Cargos (Roles)', path: '/admin/roles', category: 'Admin' },
];

export const getPagesByCategory = () => {
  return SYSTEM_PAGES.reduce((acc, page) => {
    if (!acc[page.category]) acc[page.category] = [];
    acc[page.category].push(page);
    return acc;
  }, {});
};