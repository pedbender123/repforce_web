import sys
import os
import json

# Force path
sys.path.append('/app')

from app.shared.database import SessionSys as SessionLocal
from app.system.models import Tenant
from app.engine.metadata.models import MetaEntity, MetaPage, MetaSubPage, MetaNavigationGroup

def run():
    print("Updating Tabs for Clientes (Compasso Demo)...")
    db = SessionLocal()
    try:
        tenant = db.query(Tenant).filter_by(slug="compasso-demo").first()
        if not tenant:
            print("Tenant Not Found")
            return
        
        tenant_id = tenant.id
        
        # 1. Find Entity "Pedidos"
        ent_pedidos = db.query(MetaEntity).filter_by(tenant_id=tenant_id, slug="pedidos").first()
        if not ent_pedidos:
            print("Entity Pedidos not found")
            return

        # 2. Find Page "Clientes" -> Subpage "Ficha 360"
        # 2. Find Page "Clientes" -> Subpage "Ficha 360"
        # MetaPage is linked to Group, not Tenant directly
        groups = db.query(MetaNavigationGroup).filter_by(tenant_id=tenant_id).all()
        group_ids = [g.id for g in groups]
        
        page = db.query(MetaPage).filter(
            MetaPage.group_id.in_(group_ids),
            MetaPage.name == "Clientes"
        ).first()
        if not page:
            print("Page Clientes not found")
            return
            
        sp_360 = db.query(MetaSubPage).filter_by(page_id=page.id, type="ficha_360").first()
        if not sp_360:
            print("Ficha 360 not found")
            return
            
        # 3. Update Tabs
        current_config = sp_360.config or {}
        
        new_tabs = [
            # Keep General/Insights
            {"id": "general", "label": "Insights", "is_active": True},
            
            # Tab Orçamentos
            {
                "id": "orcamentos",
                "label": "Orçamentos",
                "is_active": True,
                "target_entity": str(ent_pedidos.id),
                "filter_column": "cliente_ref",
                "filters": {
                    "status": ["Rascunho", "Em Negociacao", "Aguardando Aprovação"]
                }
            },
            
            # Tab Pedidos
            {
                "id": "pedidos",
                "label": "Pedidos",
                "is_active": True,
                "target_entity": str(ent_pedidos.id),
                "filter_column": "cliente_ref",
                "filters": {
                    "status": ["Aprovado", "Em Separação", "Faturado", "Em Rota", "Entregue"]
                }
            }
        ]
        
        current_config["tabs"] = new_tabs
        sp_360.config = current_config
        
        # Force update
        db.add(sp_360)
        db.commit()
        print("Tabs Updated Successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run()
