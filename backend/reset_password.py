
import sys
import os

sys.path.append(os.getcwd())

from app.shared import database, security
from app.system import models

def reset_passwords():
    print("--- RESETTING PASSWORDS ---")
    db = database.SessionSys()
    
    try:
        # 1. Reset pbrandon
        user = db.query(models.GlobalUser).filter(models.GlobalUser.username == "pbrandon").first()
        if user:
            print(f"Found user: {user.username}")
            new_hash = security.get_password_hash("1asdfgh.")
            user.password_hash = new_hash
            db.commit()
            print(f"Password for {user.username} reset to '1asdfgh.'")
        else:
            print("User pbrandon NOT FOUND.")

        # 2. Reset admin
        admin = db.query(models.GlobalUser).filter(models.GlobalUser.username == "admin").first()
        if admin:
            new_hash_admin = security.get_password_hash("12345678")
            admin.password_hash = new_hash_admin
            db.commit()
            print(f"Password for admin reset to '12345678'")
            
    except Exception as e:
        print(f"Error resetting passwords: {e}")
        db.rollback()
    finally:
        db.close()
        print("--- DONE ---")

if __name__ == "__main__":
    reset_passwords()
