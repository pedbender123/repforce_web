import sys
import os
import uuid
import json

# Adicionar root do backend ao path
sys.path.append('/app')

from app.shared.database import SessionSys as SessionLocal
from app.system.models import Tenant
from app.engine.metadata.models import MetaEntity, MetaField, MetaNavigationGroup, MetaPage, MetaSubPage

def run():
    print("Starting CRM Setup...")
    db = SessionLocal()
    try:
        # 1. Tenant "Demo CRM"
        tenant_name = "Demo CRM"
        tenant = db.query(Tenant).filter_by(name=tenant_name).first()
        if not tenant:
            print(f"Creating Tenant: {tenant_name}")
            tenant = Tenant(name=tenant_name, slug="demo-crm", status="active") # Schema is derived from ID/Slug
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
        else:
            print(f"Using Existing Tenant: {tenant.name} ({tenant.id})")
        
        tenant_id = tenant.id

        # 2. Cleanup - WIPE EVERYTHING FOR THIS TENANT
        print("Cleaning up old metadata...")
        # Delete Groups (cascades pages -> subpages)
        db.query(MetaNavigationGroup).filter_by(tenant_id=tenant_id).delete()
        # Delete Entities (cascades fields, views)
        # Note: Pages referencing entities might cause FK issues, but we deleted pages first via Groups?
        # Pages have FK to Entity (SET NULL or CASCADE?). Model says SET NULL.
        # So we can delete Entities now.
        db.query(MetaEntity).filter_by(tenant_id=tenant_id).delete()
        
        db.commit()
        print("Cleanup Complete.")

        # 3. Create Structure
        
        # --- Group: Principal ---
        group = MetaNavigationGroup(tenant_id=tenant_id, name="Principal", order=0, icon="Layout")
        db.add(group); db.flush()

        # ==========================
        # ENTITY: CLIENTES
        # ==========================
        print("Creating Entity: Clientes")
        e_cli = MetaEntity(tenant_id=tenant_id, slug="clientes", display_name="Clientes", icon="Users")
        db.add(e_cli); db.flush()
        
        # Fields
        db.add_all([
            MetaField(entity_id=e_cli.id, name="nome", label="Nome Fantasia", field_type="text", is_required=True),
            MetaField(entity_id=e_cli.id, name="razao_social", label="Razão Social", field_type="text"),
            MetaField(entity_id=e_cli.id, name="cnpj", label="CNPJ", field_type="text"),
            MetaField(entity_id=e_cli.id, name="status", label="Status", field_type="select", options=["Ativo", "Inativo", "Prospect"]),
            MetaField(entity_id=e_cli.id, name="contato", label="Nome do Contato", field_type="text"),
            MetaField(entity_id=e_cli.id, name="email", label="Email", field_type="email"),
            MetaField(entity_id=e_cli.id, name="telefone", label="Telefone", field_type="text")
        ])
        
        # Page
        p_cli = MetaPage(group_id=group.id, entity_id=e_cli.id, name="Clientes", type="list", order=0, 
                         layout_config={"visible_columns": ["nome", "status", "email", "telefone"]})
        db.add(p_cli); db.flush()
        
        # SubPages
        sp_cli_360 = MetaSubPage(page_id=p_cli.id, name="Ficha 360", type="ficha_360", order=0, config={
            "tabs": [
                {"id": "general", "label": "Geral", "is_active": True},
                {"id": "vendas", "label": "Vendas", "is_active": True, "target_entity": None, "filter_column": None} # Placeholder for now
            ]
        })
        sp_cli_form = MetaSubPage(page_id=p_cli.id, name="Novo Cliente", type="form", order=1)
        db.add_all([sp_cli_360, sp_cli_form]); db.flush()
        
        # Helper: Set Defaults
        p_cli.default_detail_subpage_id = sp_cli_360.id
        p_cli.default_form_subpage_id = sp_cli_form.id


        # ==========================
        # ENTITY: PRODUTOS
        # ==========================
        print("Creating Entity: Produtos")
        e_prod = MetaEntity(tenant_id=tenant_id, slug="produtos", display_name="Produtos", icon="Package")
        db.add(e_prod); db.flush()
        
        db.add_all([
            MetaField(entity_id=e_prod.id, name="nome", label="Nome do Produto", field_type="text", is_required=True),
            MetaField(entity_id=e_prod.id, name="codigo", label="SKU", field_type="text"),
            MetaField(entity_id=e_prod.id, name="categoria", label="Categoria", field_type="select", options=["Eletrônicos", "Móveis", "Serviços"]),
            MetaField(entity_id=e_prod.id, name="preco", label="Preço Base", field_type="currency"),
            MetaField(entity_id=e_prod.id, name="estoque", label="Estoque Atual", field_type="number")
        ])
        
        p_prod = MetaPage(group_id=group.id, entity_id=e_prod.id, name="Produtos", type="list", order=1,
                         layout_config={"visible_columns": ["nome", "codigo", "categoria", "preco", "estoque"]})
        db.add(p_prod); db.flush()
        
        sp_prod_360 = MetaSubPage(page_id=p_prod.id, name="Ficha 360", type="ficha_360", order=0)
        sp_prod_form = MetaSubPage(page_id=p_prod.id, name="Novo Produto", type="form", order=1)
        db.add_all([sp_prod_360, sp_prod_form]); db.flush()
        
        p_prod.default_detail_subpage_id = sp_prod_360.id
        p_prod.default_form_subpage_id = sp_prod_form.id


        # ==========================
        # ENTITY: VENDAS (OPORTUNIDADES)
        # ==========================
        print("Creating Entity: Vendas")
        e_venda = MetaEntity(tenant_id=tenant_id, slug="vendas", display_name="Vendas", icon="DollarSign")
        db.add(e_venda); db.flush()
        
        db.add_all([
            MetaField(entity_id=e_venda.id, name="titulo", label="Título", field_type="text", is_required=True),
            # Ideally this would be Lookup, using text for MVP speed
            MetaField(entity_id=e_venda.id, name="cliente_id", label="ID Cliente", field_type="text"), 
            MetaField(entity_id=e_venda.id, name="valor", label="Valor Total", field_type="currency"),
            MetaField(entity_id=e_venda.id, name="fase", label="Fase", field_type="select", options=["Prospecção", "Negociação", "Fechado Ganho", "Perdido"]),
            MetaField(entity_id=e_venda.id, name="data_fechamento", label="Data Prevista", field_type="date")
        ])
        
        p_venda = MetaPage(group_id=group.id, entity_id=e_venda.id, name="Vendas", type="list", order=2,
                          layout_config={"visible_columns": ["titulo", "fase", "valor", "data_fechamento"]})
        db.add(p_venda); db.flush()
        
        sp_venda_360 = MetaSubPage(page_id=p_venda.id, name="Ficha 360", type="ficha_360", order=0)
        sp_venda_form = MetaSubPage(page_id=p_venda.id, name="Nova Venda", type="form", order=1)
        db.add_all([sp_venda_360, sp_venda_form]); db.flush()
        
        p_venda.default_detail_subpage_id = sp_venda_360.id
        p_venda.default_form_subpage_id = sp_venda_form.id

        # Update Cliente Tab to point to Vendas (Mock Link)
        # We need to set target_entity=e_venda.id and filter_column="cliente_id"
        sp_cli_360.config = {
            "tabs": [
                {"id": "general", "label": "Geral", "is_active": True},
                {"id": "vendas", "label": "Vendas", "is_active": True, "target_entity": str(e_venda.id), "filter_column": "cliente_id"}
            ]
        }
        db.add(sp_cli_360)


        # Commit Everything
        db.commit()
        print("Database Updated Successfully.")
        
        # Generate JSON Template
        template_data = {
            "tenant": tenant.name,
            "groups": [
                {
                    "name": group.name,
                    "pages": [p.name for p in group.pages]
                }
            ],
            "entities": ["Clientes", "Produtos", "Vendas"]
        }
        
        with open("crm_template.json", "w") as f:
            json.dump(template_data, f, indent=2)
            
        print("crm_template.json generated.")

    except Exception as e:
        db.rollback()
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run()
