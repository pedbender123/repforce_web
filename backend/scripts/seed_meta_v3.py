import sys
import os
from sqlalchemy import text
from sqlalchemy.orm import Session
import uuid

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db import session, metadata_models

def seed_tenant_metadata(tenant_slug: str):
    print(f"--- Seeding Metadata for tenant: {tenant_slug} ---")
    
    # Session setup
    db_gen = session.get_db()
    db = next(db_gen)
    
    # 1. Ensure Schema
    safe_slug = tenant_slug.replace("-", "_")
    schema_name = f"tenant_{safe_slug}"
    print(f"Schema: {schema_name}")
    
    with session.engine.connect() as conn:
        conn.execute(text(f"SET search_path TO \"{schema_name}\", public"))
        
        # 2. Create tables if they don't exist
        print("Creating Meta tables...")
        metadata_models.BaseCrm.metadata.create_all(bind=conn)
        conn.commit()

    # 3. Populate definitions
    # Need a session with the right search_path
    db.execute(text(f"SET search_path TO \"{schema_name}\", public"))
    
    # -- PRODUCT --
    print("Seeding 'product' entity...")
    product_entity = db.query(metadata_models.MetaEntity).filter(metadata_models.MetaEntity.name == "products").first()
    if not product_entity:
        product_entity = metadata_models.MetaEntity(
            name="products",
            display_name="Produtos",
            description="Catálogo de produtos do sistema",
            entity_type=metadata_models.MetaEntityType.SYSTEM,
            is_system=True
        )
        db.add(product_entity)
        db.flush()
        
        # Fields
        fields = [
            ("name", "Nome", metadata_models.FieldType.TEXT, True),
            ("sku", "SKU", metadata_models.FieldType.TEXT, False),
            ("price", "Preço", metadata_models.FieldType.CURRENCY, False),
        ]
        for name, label, ftype, req in fields:
            f = metadata_models.MetaField(
                entity_id=product_entity.id,
                name=name,
                label=label,
                type=ftype,
                is_required=req,
                is_system=True
            )
            db.add(f)
            
        # Default View
        view = metadata_models.MetaView(
            entity_id=product_entity.id,
            name="Todos os Produtos",
            type=metadata_models.ViewType.LIST,
            is_default=True,
            config={"columns": ["name", "sku", "price"]}
        )
        db.add(view)

    # -- CLIENT --
    print("Seeding 'clients' entity...")
    client_entity = db.query(metadata_models.MetaEntity).filter(metadata_models.MetaEntity.name == "clients").first()
    if not client_entity:
        client_entity = metadata_models.MetaEntity(
            name="clients",
            display_name="Clientes",
            description="Base de clientes (CRM)",
            entity_type=metadata_models.MetaEntityType.SYSTEM,
            is_system=True
        )
        db.add(client_entity)
        db.flush()
        
        # Fields
        fields = [
            ("name", "Nome do Cliente", metadata_models.FieldType.TEXT, True),
        ]
        for name, label, ftype, req in fields:
            f = metadata_models.MetaField(
                entity_id=client_entity.id,
                name=name,
                label=label,
                type=ftype,
                is_required=req,
                is_system=True
            )
            db.add(f)

    db.commit()
    print("Done!")

if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else "test-corp"
    seed_tenant_metadata(slug)
