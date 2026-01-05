
from app.shared.database import Base
from .models_system import Tenant, GlobalUser, ApiKey, Role, Area, UserGridPreference, role_area_association
import enum

# Backwards compatibility alias
User = GlobalUser

# Enums (Keep here if not moved, or move to models_system? Better keep to minimize breakage if imported from here)
class UserRole(str, enum.Enum):
    SYSADMIN = "sysadmin"
    ADMIN = "admin"
    SALES_REP = "sales_rep"

class AccessLevel(str, enum.Enum):
    GLOBAL = "global"
    TEAM = "team"
    OWN = "own"