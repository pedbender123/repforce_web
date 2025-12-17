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
    
    # 1. Verifica se usuário está na request (injetado pelo middleware de Auth)
    if not hasattr(request.state, "user"):
        return "OWN" # Padrão restritivo se não houver user
        
    user = request.state.user
    
    # Adquirir Role do objeto user (se o ORM já tiver carregado)
    # Assumindo que request.state.user é o modelo SQLAlchemy com relacionamento role_obj carregado
    # Se não, precisaríamos verificar como o middleware popula o user.
    
    # Acessar perfil para SysAdmin/Superuser
    profile = getattr(user, "profile", None)
    
    # 1. SysAdmin e Admin veem TUDO sempre
    if profile in ['sysadmin', 'admin', 'manager']:
        return "GLOBAL"

    # 2. Verifica Cargo (Role) Específico definido no banco
    # Se o usuário tiver um cargo customizado com nível de acesso definido
    if user.role_obj:
        access_level = getattr(user.role_obj, "access_level", "own")
        if access_level == "global":
            return "GLOBAL"
        if access_level == "team":
            return "TEAM"
        return "OWN"
    
    # 3. Fallback baseado no perfil legado (enquanto migramos)
    if profile in ['representante', 'sales_rep']:
        return "OWN"
        
    # Default seguro (Zero Trust)
    return "OWN"
