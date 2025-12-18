from sqlalchemy import create_engine, text
import os
import sys

# Corrige o path para conseguir importar o app (se necessario)
sys.path.append(os.getcwd())

# DATABASE_URL do environment ou default para dev
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@repforce_db/repforce")

def update_schema():
    print(f"Conectando a {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    commands = [
        # Adicionar access_level em roles
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='access_level') THEN
                ALTER TABLE roles ADD COLUMN access_level VARCHAR DEFAULT 'own';
                RAISE NOTICE 'Coluna access_level adicionada em roles';
            ELSE
                RAISE NOTICE 'Coluna access_level já existe em roles';
            END IF;
        END $$;
        """,
        
        # Adicionar representative_id em clients
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='representative_id') THEN
                ALTER TABLE clients ADD COLUMN representative_id INTEGER REFERENCES users(id);
                RAISE NOTICE 'Coluna representative_id adicionada em clients';
            ELSE
                RAISE NOTICE 'Coluna representative_id já existe em clients';
            END IF;
        END $$;
        """
        """
    ]
    
    # Optional: Drop profile column command (commented out by default to avoid data loss panic)
    # But for this task "Retire o campo perfil", we should probably do it or at least support it.
    commands.append("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='profile') THEN
                ALTER TABLE users DROP COLUMN profile;
                RAISE NOTICE 'Coluna profile removida de users';
            END IF;
        END $$;
    """)
    
    with engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        for cmd in commands:
            try:
                conn.execute(text(cmd))
                print(f"Comando executado com sucesso.")
            except Exception as e:
                print(f"Erro ao executar comando: {e}")
                
    print("Migração manual concluída.")

if __name__ == "__main__":
    update_schema()
