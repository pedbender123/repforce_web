import sys
import os
from sqlalchemy import create_engine, inspect, text

# Adiciona o diretório pai ao path para importar app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db import models_crm
from app.db.database import engine_crm, engine_sys

def fix_missing_tasks_table():
    print("Iniciando verificação de tabela 'tasks' em todos os tenants...")

    # 1. Obter lista de Tenants Ativos
    with engine_sys.connect() as sys_conn:
        result = sys_conn.execute(text("SELECT id, name FROM tenants"))
        tenants = result.fetchall()
        print(f"Encontrados {len(tenants)} tenants.")

    # 2. Iterar e Criar Tabela
    with engine_crm.connect() as crm_conn:
        for tenant_id, tenant_name in tenants:
            schema = f"tenant_{tenant_id}"
            print(f"Verificando tenant {tenant_id} ({tenant_name}) schema '{schema}'...")

            try:
                # Set search path
                crm_conn.execute(text(f"SET search_path TO {schema}"))
                
                # Check execution by inspecting
                # Note: Inspection methods usually need a connection or engine. 
                # Inspector uses the engine/connection it was bound to.
                # If we bind with shared engine, it might default to public?
                # We need to ensure the inspector sees the schema.
                
                inspector = inspect(crm_conn)
                tables = inspector.get_table_names(schema=schema)
                
                if "tasks" in tables:
                    print(f"  [OK] Tabela 'tasks' já existe.")
                else:
                    print(f"  [MISSING] Tabela 'tasks' não encontrada. Criando...")
                    # Cria apenas a tabela Task
                    models_crm.Task.__table__.create(bind=crm_conn)
                    print(f"  [SUCCESS] Tabela 'tasks' criada com sucesso.")
                    
            except Exception as e:
                print(f"  [ERROR] Falha ao processar tenant {tenant_id}: {e}")

    print("Concluído.")

if __name__ == "__main__":
    fix_missing_tasks_table()
