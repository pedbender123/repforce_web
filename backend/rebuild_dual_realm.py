import sys
import os
sys.path.append(os.getcwd())

from app.db import session, models_system
from app.core import security
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def rebuild():
    logger.info("Connecting to Database...")
    engine = session.engine
    
    with engine.connect() as conn:
        logger.info("Dropping Public Schema...")
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.commit()
        
    logger.info("Creating Global Tables...")
    models_system.Base.metadata.create_all(bind=engine)
    
    logger.info("Seeding Superuser...")
    db = session.SessionSys()
    try:
        hashed_pw = security.get_password_hash("12345678")
        superuser = models_system.GlobalUser(
            username="admin", # Dual-Realm Spec: "admin"
            password_hash=hashed_pw,
            recovery_email="admin@repforce.com",
            is_superuser=True,
            is_active=True,
            full_name="System Administrator"
        )
        db.add(superuser)
        db.commit()
        logger.info("Superuser created: admin / 12345678")
        
    except Exception as e:
        logger.error(f"Seeding Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    rebuild()
