
import json
from sqlalchemy.orm import Session
from app.db import models_system

def create_shadow_backup(db: Session, tenant_slug: str, table_name: str, record_id: str, data: dict):
    """
    Creates a snapshot of the record in the public shadow_backups table.
    """
    try:
        backup = models_system.ShadowBackup(
            tenant_slug=tenant_slug,
            table_name=table_name,
            record_id=str(record_id),
            data=json.dumps(data, default=str)
        )
        db.add(backup)
        db.commit()
    except Exception as e:
        print(f"Shadow Backup Failed: {e}")
        # We don't block the main deletion flow, but we log it.
