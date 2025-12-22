import sys
import os
from sqlalchemy import create_engine, text, inspect

# Configura path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine_sys, engine_crm

def verify_sysadmin_and_schema():
    print("=== Diagnóstico SysAdmin & Schema ===")
    
    # 1. Verificar Tables e Users
    with engine_sys.connect() as conn:
        inspector = inspect(conn)
        tables = inspector.get_table_names()
        print(f"Tables in public schema: {tables}")
        
        columns = [c['name'] for c in inspector.get_columns("users")]
        print(f"Columns in 'users' table: {columns}")
        
        roles_cols = [c['name'] for c in inspector.get_columns("roles")]
        print(f"Columns in 'roles' table: {roles_cols}")
        
        print("Dumping users table:")
        result = conn.execute(text("SELECT * FROM users"))
        for row in result:
             print(row)
             
        # Check SysAdmin by rough heuristic
        # We need to know tenant_id of sysadmin
        result = conn.execute(text("SELECT id, tenant_id FROM users WHERE email LIKE '%sys%' OR profile LIKE '%sys%'"))
        sys_user = result.first()
        if sys_user:
             print(f"Potential SysAdmin found: {sys_user}")
             tenant_id = sys_user.tenant_id
        else:
             print("SysAdmin user not easily identified by email/profile.")
             # Fallback to tenant_id=2 (Systems) logic
             tenant_id = 2 
             print(f"Assuming tenant_id={tenant_id} for diagnosis.")

    if not tenant_id:
        print("FATAL: tenant_id is NULL.")
        return

    if not tenant_id:
        print("FATAL: SysAdmin tenant_id is NULL.")
        return

    # 2. Verificar Schema do Tenant
    schema = f"tenant_{tenant_id}"
    print(f"Checking schema '{schema}' in CRM DB...")
    
    with engine_crm.connect() as conn:
        # Check if schema exists
        schema_exists = conn.execute(text(f"SELECT schema_name FROM information_schema.schemata WHERE schema_name = '{schema}'")).scalar()
        if not schema_exists:
             print(f"FATAL: Schema '{schema}' does not exist.")
             return
        print(f"Schema '{schema}' exists.")
        
        # Check tables in schema
        conn.execute(text(f"SET search_path TO {schema}"))
        inspector = inspect(conn)
        tables = inspector.get_table_names(schema=schema)
        print(f"Tables in '{schema}': {tables}")
        
        if "tasks" in tables:
            print("Status: OK - Tabela 'tasks' encontrada.")
        else:
            print("FATAL: Tabela 'tasks' NÃO encontrada.")

if __name__ == "__main__":
    verify_sysadmin_and_schema()
