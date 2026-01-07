from app.shared import database, security
from app.system.models import models as models_system

def reset_password():
    db = database.SessionSys()
    try:
        user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.username == "pbrandon").first()
        if user:
            print(f"Reseting password for {user.username}...")
            user.password_hash = security.get_password_hash("1asdfgh.")
            db.commit()
            print("Password reset successfully to: 1asdfgh.")
        else:
            print("User pbrandon not found seed might have failed.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_password()
