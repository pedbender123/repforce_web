# Este arquivo define as páginas padrão que o sistema cria automaticamente
# quando um novo tenant ou o SysAdmin é iniciado.

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
                    "title": "Usuários do Sistema",
                    "columns": [
                        { "key": "username", "label": "Usuário" },
                        { "key": "email", "label": "Email" },
                        { "key": "is_active", "label": "Ativo", "type": "boolean" }
                    ],
                    "fields": [
                        { "name": "username", "label": "Username", "required": True },
                        { "name": "password", "label": "Senha", "type": "password", "required": True },
                        { "name": "email", "label": "Email", "required": True },
                        { 
                            "name": "tenant_id", 
                            "label": "Tenant ID (1=Sys)", 
                            "type": "number", 
                            "required": True 
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
                "label": "Usuários da Equipe",
                "component_key": "GENERIC_LIST",
                "path": "/admin/users",
                "config": {
                    "endpoint": "/sysadmin/users", # Ajustar rota de tenant users se necessário
                    "title": "Equipe",
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