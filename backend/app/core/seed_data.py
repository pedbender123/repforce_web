# Configurações JSON para Server-Driven UI

# Menu do SysAdmin
SYSADMIN_PAGES = [
    {
        "area": "SysAdmin",
        "icon": "ShieldCheck",
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
                        { "name": "sysadmin_email", "label": "Email Admin", "required": True },
                        { "name": "sysadmin_password", "label": "Senha Inicial", "type": "password", "required": True },
                        { 
                            "name": "tenant_type", 
                            "label": "Tipo", 
                            "type": "select",
                            "options": [
                                {"value": "industry", "label": "Indústria"}, 
                                {"value": "reseller", "label": "Revenda"}
                            ],
                            "required": True
                        }
                    ]
                }
            },
            {
                "label": "Gestão de Usuários",
                "component_key": "GENERIC_LIST",
                "path": "/sysadmin/users",
                "config": {
                    "endpoint": "/sysadmin/users",
                    "title": "Usuários Globais",
                    "columns": [
                        { "key": "username", "label": "Usuário" },
                        { "key": "is_sysadmin", "label": "SysAdmin", "type": "boolean" }
                    ],
                    "fields": [
                        { "name": "username", "label": "Username", "required": True },
                        { "name": "password", "label": "Senha", "type": "password", "required": True },
                        { "name": "email", "label": "Email", "required": True },
                        { "name": "tenant_id", "label": "Tenant ID (1=Sys)", "type": "number", "required": True }
                    ]
                }
            }
        ]
    }
]

# Menu padrão para novos Tenants
TENANT_DEFAULT_PAGES = [
    {
        "area": "Vendas",
        "icon": "ShoppingCart",
        "pages": [
            {
                "label": "Meus Clientes",
                "component_key": "GENERIC_LIST",
                "path": "/app/clients",
                "config": {
                    "endpoint": "/crm/clients",
                    "title": "Carteira de Clientes",
                    "columns": [
                        { "key": "name", "label": "Razão Social" },
                        { "key": "email", "label": "Email" },
                        { "key": "document", "label": "Documento" }
                    ],
                    "fields": [
                        { "name": "name", "label": "Nome / Razão", "required": True },
                        { "name": "trade_name", "label": "Nome Fantasia" },
                        { "name": "email", "label": "Email" },
                        { "name": "document", "label": "CPF/CNPJ" }
                    ]
                }
            }
        ]
    }
]