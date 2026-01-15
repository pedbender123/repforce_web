// Páginas de Infraestrutura (Sistema) - Não editáveis por tenants
export const CORE_PAGES = [
  { label: 'SysAdmin - Dashboard', path: '/sysadmin/dashboard', category: 'System' },
  { label: 'SysAdmin - Empresas', path: '/sysadmin/tenants', category: 'System' },
  { label: 'SysAdmin - Usuários', path: '/sysadmin/users', category: 'System' },
  { label: 'SysAdmin - Áreas', path: '/sysadmin/areas', category: 'System' },
  { label: 'Admin - Dashboard', path: '/admin/dashboard', category: 'Admin Core' },
  { label: 'Admin - Equipe', path: '/admin/users', category: 'Admin Core' },
  { label: 'Admin - Cargos', path: '/admin/roles', category: 'Admin Core' },
  { label: 'Admin - Campos Personalizados', path: '/admin/fields', category: 'Admin Core' },
  { label: 'Admin - Regras de Preço', path: '/admin/rules', category: 'Admin Core' },
];

// Templates de Páginas CRM - Podem ter campos dinâmicos no futuro
export const CRM_TEMPLATES = [
  { label: 'App - Dashboard', path: '/app/dashboard', category: 'CRM App' },
  { label: 'App - Clientes (Lista)', path: '/app/clients', category: 'CRM App' },
  { label: 'App - Novo Cliente', path: '/app/clients/new', category: 'CRM App' },
  { label: 'App - Pedidos (Lista)', path: '/app/orders', category: 'CRM App' },
  { label: 'App - Novo Pedido', path: '/app/orders/new', category: 'CRM App' },
  { label: 'App - Rotas (Nova)', path: '/app/routes/new', category: 'CRM App' },
  { label: 'Admin - Produtos', path: '/admin/products', category: 'CRM Admin' },
];

// Mantém compatibilidade com código legacy que importa SYSTEM_PAGES
export const SYSTEM_PAGES = [...CORE_PAGES, ...CRM_TEMPLATES];

export default function PageCatalog() {
  return SYSTEM_PAGES.reduce((acc, page) => {
    if (!acc[page.category]) acc[page.category] = [];
    acc[page.category].push(page);
    return acc;
  }, {});
}