from fastapi import Request
from typing import Literal

# GLOBAL: Vê tudo do tenant
# TEAM: Vê tudo da equipe (futuro)
# OWN: Vê apenas o que criou ou é dono (representative_id == user.id)
PermissionScope = Literal["GLOBAL", "TEAM", "OWN"]

def get_user_scope(request: Request) -> PermissionScope:
    """
    Cérebro do Antigravity.
    Analisa o perfil e o cargo para ditar a regra de visibilidade.
    """
    
    # 1. Verifica se temos o role_name no state (vindo do token)
    role_name = getattr(request.state, "role_name", None)
    
    # 2. SysAdmin e Admin veem TUDO sempre
    # Aqui assumimos que no banco, os Roles se chamam "sysadmin", "admin", "manager"
    # Ou que o Auth Service injetou esses nomes no token.
    if role_name in ['sysadmin', 'admin', 'manager']:
        return "GLOBAL"

    # 3. Verifica Objeto User completo (se injetado)
    if hasattr(request.state, "user"):
        user = request.state.user
        if user.role_obj:
            access_level = getattr(user.role_obj, "access_level", "own")
            if access_level == "global":
                return "GLOBAL"
            if access_level == "team":
                return "TEAM"

    # Default seguro
    return "OWN"
