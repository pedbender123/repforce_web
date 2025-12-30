import sys
import os
sys.path.append(os.getcwd())

from app.db import session, models_system
from app.core import security
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_and_reset():
    db = session.SessionSys()
    try:
        user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.username == "admin").first()
        if not user:
            logger.error("User 'admin' NOT FOUND!")
            return

        logger.info(f"User found: {user.username} (ID: {user.id})")
        logger.info(f"Is Superuser: {user.is_superuser}")
        logger.info(f"Is Active: {user.is_active}")

        # Reset Password
        new_pw = "12345678"
        hashed = security.get_password_hash(new_pw)
        user.password_hash = hashed
        db.commit()
        logger.info(f"Password forcefully reset to: {new_pw}")
        
        # Verify immediately
        if security.verify_password(new_pw, hashed):
             logger.info("Verification check: SUCCESS")
        else:
             logger.error("Verification check: FAILED")

    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_and_reset()
