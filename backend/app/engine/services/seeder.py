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
        # Check if Rotas entity exists for this tenant
        rotas = db.query(models_meta.MetaEntity).filter_by(slug='rotas', tenant_id=tenant_id).first()
        
        if not rotas:
            logger.info(f"Seeding defaults for tenant {tenant_id}: Creating Rotas entity...")
            rotas = models_meta.MetaEntity(
                tenant_id=tenant_id,
                name="Rotas",
                slug="rotas",
                display_name="Rotas",
                is_system=True
            )
            db.add(rotas)
            db.flush() # get ID
            
            fields = [
                models_meta.MetaField(entity_id=rotas.id, name="nome", label="Nome da Rota", field_type="text", is_required=True),
                models_meta.MetaField(entity_id=rotas.id, name="path", label="Caminho / URL", field_type="text", is_required=True),
                models_meta.MetaField(entity_id=rotas.id, name="active", label="Ativa?", field_type="boolean")
            ]
            db.add_all(fields)
            db.commit()
            logger.info("Rotas seeded successfully.")
        else:
            logger.info(f"Tenant {tenant_id} already has Rotas entity.")
            
    except Exception as e:
        logger.error(f"Failed to seed defaults for tenant {tenant_id}: {e}")
        db.rollback()
