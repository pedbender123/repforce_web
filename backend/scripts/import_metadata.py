
import sys
import os
import json
import logging
from sqlalchemy import text
from sqlalchemy.orm import Session

# Setup path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db import session, metadata_models as models
from app.system import models as sys_models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MetadataImporter")

def get_or_create_tenant(db: Session, slug="default-tenant"):
    tenant = db.query(sys_models.Tenant).filter_by(schema_name=slug).first()
    if not tenant:
        logger.info(f"Creating tenant: {slug}")
        tenant = sys_models.Tenant(name=slug.capitalize(), schema_name=slug)
        db.add(tenant)
        db.flush()
        
        # Create schema
        safe_slug = slug.replace("-", "_")
        schema_name = f"tenant_{safe_slug}"
        db.execute(text(f"CREATE SCHEMA IF NOT EXISTS \"{schema_name}\""))
        logger.info(f"Schema {schema_name} created.")
        
        # Init tables
        # Note: In a real scenario, we would use Alembic or a shared init script
        # metadata_models.BaseCrm.metadata.create_all(bind=conn) -> This usually runs on main DB. 
        # For this script we assume tables exist or we manipulate public meta tables chiefly.
        
    return tenant

def import_metadata(json_path: str, tenant_slug: str):
    if not os.path.exists(json_path):
        logger.error(f"File not found: {json_path}")
        return

    with open(json_path, 'r') as f:
        data = json.load(f)

    db_gen = session.get_db()
    db = next(db_gen)

    try:
        tenant = get_or_create_tenant(db, tenant_slug)
        
        # 1. Entities & Fields
        entities_map = {} # name -> id
        
        for ent_def in data.get("entities", []):
            ent_name = ent_def["name"]
            logger.info(f"Processing Entity: {ent_name}")
            
            entity = db.query(models.MetaEntity).filter_by(
                tenant_id=tenant.id, 
                slug=ent_name
            ).first()
            
            if not entity:
                entity = models.MetaEntity(
                    tenant_id=tenant.id,
                    slug=ent_name,
                    display_name=ent_def["display_name"],
                    is_system=False
                )
                db.add(entity)
                db.flush()
            
            entities_map[ent_name] = entity.id
            
            # Fields
            for field_def in ent_def.get("fields", []):
                f_name = field_def["name"]
                field = db.query(models.MetaField).filter_by(
                    entity_id=entity.id,
                    name=f_name
                ).first()
                
                if not field:
                    field = models.MetaField(
                        entity_id=entity.id,
                        name=f_name,
                        label=field_def.get("label", f_name),
                        field_type=field_def["type"],
                        is_required=field_def.get("is_required", False),
                        options=field_def.get("options"),
                        formula=field_def.get("formula"),
                        is_virtual=field_def.get("is_virtual", False)
                    )
                    db.add(field)
                else:
                    # Update formula/virtual status
                    field.formula = field_def.get("formula")
                    field.is_virtual = field_def.get("is_virtual", False)
                    # Update other props if needed
                    
        db.flush()
        
        # 2. Navigation & Pages
        for group_def in data.get("navigation", []):
            g_name = group_def["group"]
            logger.info(f"Processing Group: {g_name}")
            
            group = db.query(models.MetaNavigationGroup).filter_by(
                tenant_id=tenant.id,
                name=g_name
            ).first()
            
            if not group:
                group = models.MetaNavigationGroup(
                    tenant_id=tenant.id,
                    name=g_name,
                    order=0
                )
                db.add(group)
                db.flush()
                
            for page_def in group_def.get("pages", []):
                p_name = page_def["name"]
                ent_slug = page_def.get("entity")
                ent_id = entities_map.get(ent_slug)
                
                page = db.query(models.MetaPage).filter_by(
                    group_id=group.id,
                    name=p_name
                ).first()
                
                layout_config = page_def.get("layout_config", {})
                
                if not page:
                    page = models.MetaPage(
                        group_id=group.id,
                        name=p_name,
                        type=page_def.get("type", "list"),
                        entity_id=ent_id,
                        layout_config=layout_config
                    )
                    db.add(page)
                else:
                    page.layout_config = layout_config
                    page.type = page_def.get("type", page.type)
        
        db.commit()
        logger.info("Import completed successfully.")
        
    except Exception as e:
        logger.error(f"Import failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="Path to JSON metadata file")
    parser.add_argument("--tenant", default="default-tenant", help="Tenant slug")
    
    args = parser.parse_args()
    import_metadata(args.file, args.tenant)
