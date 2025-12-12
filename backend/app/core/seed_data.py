# Definição das Telas Padrão do Sistema

# Menu do SysAdmin
SYSADMIN_PAGES = [
    {
        "area": "SysAdmin",
        "icon": "ShieldCheck",
        "order": 1,
        "pages": [
            {
                "label": "Dashboard",
                "component_key": "DASHBOARD_SYSADMIN", # Template Específico
                "path": "/sysadmin/dashboard",
                "config": {}
            },
            {
                "label": "Gestão de Tenants",
                "component_key": "TENANT_MANAGER", # Template Específico (Form lateral + Lista)
                "path": "/sysadmin/tenants",
                "config": {}
            },
            {
                "label": "Gestão de Usuários",
                "component_key": "USER_MANAGER_SYS", # Template Específico
                "path": "/sysadmin/users",
                "config": {}
            },
            {
                "label": "Todos Usuários (Global)",
                "component_key": "ALL_USER_MANAGER", # Template Específico
                "path": "/sysadmin/all-users",
                "config": {}
            }
        ]
    }
]

# Menu padrão para novos Tenants
TENANT_DEFAULT_PAGES = [
    {
        "area": "Vendas",
        "icon": "ShoppingCart",
        "order": 1,
        "pages": [
            {
                "label": "Dashboard",
                "component_key": "DASHBOARD_APP",
                "path": "/app/dashboard",
                "config": {}
            },
            {
                "label": "Meus Clientes",
                "component_key": "CLIENT_LIST", # Lista Customizada
                "path": "/app/clients",
                "config": {}
            },
            # Rotas "Ocultas" (o Frontend vai filtrar do menu, mas criar a rota)
            {
                "label": "Novo Cliente",
                "component_key": "CLIENT_FORM", # Form Especializado
                "path": "/app/clients/new",
                "config": {"hidden": True} 
            },
            {
                "label": "Detalhes do Cliente",
                "component_key": "CLIENT_DETAILS", # Detalhes com Abas
                "path": "/app/clients/:id",
                "config": {"hidden": True}
            },
            {
                "label": "Novo Pedido",
                "component_key": "ORDER_CREATE",
                "path": "/app/orders/new",
                "config": {}
            },
            {
                "label": "Rotas de Visita",
                "component_key": "ROUTE_CREATE",
                "path": "/app/routes/new",
                "config": {}
            }
        ]
    },
    {
        "area": "Administrativo",
        "icon": "Cog",
        "order": 2,
        "pages": [
             {
                "label": "Usuários",
                "component_key": "GENERIC_LIST", # Mantemos o genérico onde funciona bem
                "path": "/admin/users",
                "config": {
                    "endpoint": "/admin/users",
                    "title": "Usuários da Equipe",
                    "columns": [
                        { "key": "username", "label": "Usuário" },
                        { "key": "email", "label": "Email" },
                        { "key": "profile", "label": "Perfil", "type": "badge" }
                    ],
                    "fields": [
                        { "name": "name", "label": "Nome", "required": True },
                        { "name": "username", "label": "Username", "required": True },
                        { "name": "email", "label": "Email", "required": True },
                        { "name": "password", "label": "Senha", "type": "password", "required": True },
                        { 
                            "name": "profile", "label": "Perfil", "type": "select", "required": True,
                            "options": [{"value": "admin", "label": "Admin"}, {"value": "representante", "label": "Representante"}]
                        }
                    ]
                }
            }
        ]
    }
]