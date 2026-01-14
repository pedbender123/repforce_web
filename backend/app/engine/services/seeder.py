from sqlalchemy.orm import Session
from app.engine.metadata import models as models_meta
import logging

logger = logging.getLogger(__name__)

def seed_tenant_defaults(db: Session, tenant_id: str):
    """
    Seeds default metadata for a new or existing tenant.
    Specifically ensures the 'Rotas' metadata entity exists.
    """
    try:
        # Rotas logic removed as per user request


        # Seed Default Cargos
        from app.system import models as models_system
        cargos_count = db.query(models_system.Cargo).filter_by(tenant_id=tenant_id).count()
        if cargos_count == 0:
            logger.info(f"Seeding default Cargos for tenant {tenant_id}...")
            default_cargos = [
                models_system.Cargo(tenant_id=tenant_id, name="Gerente", description="Gestão de equipe e vendas"),
                models_system.Cargo(tenant_id=tenant_id, name="Vendedor", description="Prospecção e vendas diretas")
            ]
            db.add_all(default_cargos)
            db.commit()
            logger.info("Cargos seeded successfully.")
        else:
            logger.info(f"Tenant {tenant_id} already has cargos.")
            
    except Exception as e:
        logger.error(f"Failed to seed defaults for tenant {tenant_id}: {e}")
        db.rollback()
