from fastapi import APIRouter
from app.api import auth, admin, sysadmin, catalog, orders, webhooks

api_router = APIRouter()

# Rotas de Autenticação (Login)
api_router.include_router(auth.router, tags=["login"])

# Rotas do SysAdmin (Gestão de Tenants e Usuários Globais)
api_router.include_router(sysadmin.router, prefix="/sysadmin", tags=["sysadmin"])

# Rotas do Admin do Tenant (Gestão de Produtos, Usuários do Tenant, Configs)
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

# Rotas de Catálogo (Visualização de Produtos e Preços para o Vendedor)
api_router.include_router(catalog.router, prefix="/catalog", tags=["catalog"])

# Rotas de Pedidos (Criação e Gestão de Pedidos)
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])

# Webhooks (Integrações externas)
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])