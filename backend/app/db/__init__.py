# Compatibility Shim for legacy imports
from app.shared import database as session
from app.shared import schemas
from app.system.models import models as models_system
from app.system.models import models # General models
from app.engine import models_tenant # For 'from ..db import models_tenant as models'

# Re-exporting as specific names
database = session
