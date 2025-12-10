# Definição das Telas Padrão do Sistema

SYSADMIN_PAGES = [
    {
        "area": "SysAdmin",
        "icon": "ShieldCheckIcon",
        "order": 1,
        "pages": [
            {
                "label": "Gestão de Tenants",
                "component_key": "GENERIC_LIST",
                "path": "/sysadmin/tenants",
                "config": {
                    "endpoint": "/sysadmin/tenants",
                    "title": "Empresas (Tenants)",
                    "columns": [
                        { "key": "name", "label": "Empresa" },
                        { "key": "slug", "label": "Slug" },
                        { "key": "status", "label": "Status", "type": "badge" }
                    ],
                    "fields": [
                        { "name": "name", "label": "Nome da Empresa", "required": True },
                        { "name": "slug", "label": "Slug (URL)", "required": True },
                        { "name": "sysadmin_email", "label": "Email do Admin", "required": True },
                        { "name": "sysadmin_password", "label": "Senha Inicial", "type": "password", "required": True },
                        { 
                            "name": "tenant_type", 
                            "label": "Tipo", 
                            "type": "select",
                            "required": True,
                            "options": [
                                {"value": "industry", "label": "Indústria"}, 
                                {"value": "agency", "label": "Agência"}, 
                                {"value": "reseller", "label": "Revenda"}
                            ]
                        }
                    ]
                }
            },
            {
                "label": "Gestão de Usuários",
                "component_key": "GENERIC_LIST",
                "path": "/sysadmin/users",
                "config": {
                    "endpoint": "/sysadmin/all-users",
                    "title": "Usuários do Sistema (Todos)",
                    "columns": [
                        { "key": "username", "label": "Usuário" },
                        { "key": "email", "label": "Email" },
                        { "key": "is_active", "label": "Ativo", "type": "boolean" }
                    ],
                    "fields": [
                        { "name": "username", "label": "Username", "required": True },
                        { "name": "email", "label": "Email", "required": True },
                        { "name": "password", "label": "Senha", "type": "password", "required": True },
                        { "name": "tenant_id", "label": "Tenant ID (1=Sys)", "type": "number", "required": True }
                    ]
                }
            },
            {
                "label": "Gestão de Áreas",
                "component_key": "GENERIC_LIST",
                "path": "/sysadmin/areas",
                "config": {
                    "endpoint": "/sysadmin/areas",
                    "title": "Áreas do Menu (Tenants)",
                    "columns": [
                        { "key": "label", "label": "Nome da Área" },
                        { "key": "icon", "label": "Ícone" },
                        { "key": "tenant_id", "label": "Tenant ID" }
                    ],
                    "fields": [
                        { "name": "label", "label": "Rótulo da Área", "required": True },
                        { "name": "icon", "label": "Nome do Ícone (ex: UsersIcon)", "required": True },
                        { "name": "tenant_id", "label": "ID do Tenant", "type": "number", "required": True },
                        { "name": "order", "label": "Ordem", "type": "number", "required": True }
                    ]
                }
            },
            {
                "label": "Gestão de Páginas",
                "component_key": "GENERIC_LIST",
                "path": "/sysadmin/pages",
                "config": {
                    "endpoint": "/sysadmin/pages",
                    "title": "Páginas do Menu",
                    "columns": [
                        { "key": "label", "label": "Nome da Página" },
                        { "key": "path", "label": "Rota URL" },
                        { "key": "area_id", "label": "Área ID" }
                    ],
                    "fields": [
                        { "name": "label", "label": "Nome da Página", "required": True },
                        { "name": "path", "label": "Rota (ex: /app/clients)", "required": True },
                        { "name": "area_id", "label": "ID da Área Pai", "type": "number", "required": True },
                        { 
                            "name": "component_key", 
                            "label": "Template (ex: GENERIC_LIST)", 
                            "type": "select", 
                            "required": True,
                            "options": [
                                {"value": "GENERIC_LIST", "label": "Lista Genérica"},
                                {"value": "TABLE_MANAGER", "label": "Gerenciador de Tabelas"},
                                {"value": "ROLE_MANAGER", "label": "Gerenciador de Cargos"},
                                {"value": "DASHBOARD", "label": "Dashboard"}
                            ]
                        }
                    ]
                }
            },
            {
                "label": "Gestão de Tabelas",
                "component_key": "TABLE_MANAGER",
                "path": "/sysadmin/tables",
                "config": {}
            }
        ]
    }
]

TENANT_DEFAULT_PAGES = [
    {
        "area": "Administrativo",
        "icon": "Cog6ToothIcon",
        "order": 99,
        "pages": [
            {
                "label": "Usuários",
                "component_key": "GENERIC_LIST",
                "path": "/admin/users",
                "config": {
                    "endpoint": "/api/admin/users",
                    "title": "Usuários da Equipe",
                    "columns": [
                        { "key": "username", "label": "Usuário" },
                        { "key": "email", "label": "Email" }
                    ],
                    "fields": [
                        { "name": "username", "label": "Username", "required": True },
                        { "name": "email", "label": "Email", "required": True },
                        { "name": "password", "label": "Senha", "type": "password", "required": True }
                    ]
                }
            },
            {
                "label": "Cargos e Permissões",
                "component_key": "ROLE_MANAGER",
                "path": "/admin/roles",
                "config": {}
            }
        ]
    }
]