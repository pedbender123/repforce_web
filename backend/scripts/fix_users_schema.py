import sys
import os
from sqlalchemy import create_engine, text, inspect

# Configura path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine_sys
from app.db import models

def fix_users_schema():
    print("=== Corrigindo Schema da Tabela Users ===")
    
    with engine_sys.connect() as conn:
        inspector = inspect(conn)
        columns = [c['name'] for c in inspector.get_columns("users")]
        print(f"Colunas atuais: {columns}")
        
        # 1. Adicionar Colunas Faltantes
        # username
        if "username" not in columns:
            print("Adicionando coluna 'username'...")
            conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR"))
            conn.execute(text("CREATE INDEX ix_users_username ON users (username)"))

        # name
        if "name" not in columns:
             print("Adicionando coluna 'name'...")
             conn.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR"))

        # full_name
        if "full_name" not in columns:
             print("Adicionando coluna 'full_name'...")
             conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR"))
        
        # is_active
        if "is_active" not in columns:
             print("Adicionando coluna 'is_active'...")
             conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))

        # role_id
        if "role_id" not in columns:
             print("Adicionando coluna 'role_id'...")
             conn.execute(text("ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id)"))

        conn.commit()
        print("Estrutura da tabela atualizada.")

        # 2. Migrar Dados (Populate)
        print("Migrando dados existentes...")
        users = conn.execute(text("SELECT id, email, profile, tenant_id FROM users")).fetchall()
        
        for u in users:
            user_id = u.id
            email = u.email
            tenant_id = u.tenant_id
            
            updates = {}
            
            # Username (Default to email part)
            if email:
                username_guess = email.split('@')[0]
                # Check uniqueness? For now assume simplicity
                updates["username"] = username_guess
                updates["name"] = username_guess.title()
            
            # Role (Try to find 'Admin' or 'SysAdmin' or 'Sales Rep')
            if tenant_id:
                # Find a role in this tenant
                # Priority: "sysadmin" -> "Super Admin" / "systems" ?
                # If tenant_id == 2 (Systems), try "Super Admin"
                role_query = text("SELECT id FROM roles WHERE tenant_id = :tid ORDER BY id ASC LIMIT 1")
                role = conn.execute(role_query, {"tid": tenant_id}).fetchone()
                if role:
                    updates["role_id"] = role.id
            
            # Apply updates
            if updates:
                set_clause = ", ".join([f"{k} = :{k}" for k in updates.keys()])
                params = {**updates, "uid": user_id}
                update_sql = text(f"UPDATE users SET {set_clause} WHERE id = :uid AND (username IS NULL OR role_id IS NULL)")
                conn.execute(update_sql, params)
                print(f"  Atualizado user {user_id}: {updates}")
        
        conn.commit()
        
        # 3. Create SysAdmin user if missing (Explicit check)
        # Check if username='sysadmin' exists
        check = conn.execute(text("SELECT id FROM users WHERE username = 'sysadmin'")).fetchone()
        if not check:
             print("Criando usuario 'sysadmin' padrao...")
             # Hash hardcoded: 12345678 (from main.py logic)
             pw_hash = "$2b$12$f/rOX0AZf3R5Iqaqw03tHeE3WDhKToGkXFTw6qWSI058Hevl6IlE." 
             
             # Locate Role/Tenant
             sys_tenant = conn.execute(text("SELECT id FROM tenants WHERE name = 'Systems'")).fetchone()
             if sys_tenant:
                 tid = sys_tenant.id
                 sys_role = conn.execute(text("SELECT id FROM roles WHERE tenant_id = :tid AND name = 'sysadmin' LIMIT 1"), {"tid": tid}).fetchone()
                 rid = sys_role.id if sys_role else None
                 
                 if rid:
                     conn.execute(text("""
                        INSERT INTO users (username, email, hashed_password, name, full_name, is_active, tenant_id, role_id, profile)
                        VALUES ('sysadmin', 'admin@repforce.com.br', :pw, 'SysAdmin', 'System Administrator', TRUE, :tid, :rid, 'sysadmin')
                     """), {"pw": pw_hash, "tid": tid, "rid": rid})
                     print("  Usuario 'sysadmin' criado.")
                 else:
                     print("  Role 'sysadmin' nao encontrado. Pulando criacao de usuario.")
        
        conn.commit()
        print("Concluído.")

if __name__ == "__main__":
    fix_users_schema()
