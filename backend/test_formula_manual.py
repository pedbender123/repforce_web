import sys
import os
import uuid
sys.path.append(os.getcwd())

from app.shared.database import SessionSys
from app.system.models import Tenant
from app.engine.metadata.models import MetaEntity, MetaField
from app.engine.formulas import FormulaEngine
from app.engine.metadata import data_models
from fastapi import BackgroundTasks
from sqlalchemy import text

def mock_bg_tasks():
    pass

def test_formula_snapshot():
    db = SessionSys()
    
    # 0. Setup Mock Tenant
    tenant_slug = "test_formula_tenant"
    tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
    if not tenant:
        tenant = Tenant(
            slug=tenant_slug,
            name="Formula Test Tenant",
            is_active=True
        )
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
    
    tenant_id = tenant.id
    print(f"Using Tenant: {tenant.slug} ({tenant_id})")
    
    # 1. Create Mock Entity "Vendas"
    # Cleanup first
    db.execute(text("DELETE FROM meta_entities WHERE slug = 'vendas_teste_formula'"))
    db.commit()
    
    entity = MetaEntity(
        tenant_id=tenant_id,
        slug="vendas_teste_formula",
        display_name="Vendas Teste",
        is_system=False
    )
    db.add(entity)
    db.commit()
    db.refresh(entity)
    
    # 2. Add Fields
    # Preco (Number)
    f_preco = MetaField(
        entity_id=entity.id,
        name="preco",
        label="Preço",
        field_type="number"
    )
    # Qtd (Number)
    f_qtd = MetaField(
        entity_id=entity.id,
        name="quantidade",
        label="Quantidade",
        field_type="number"
    )
    # Total (Formula Snapshot)
    f_total = MetaField(
        entity_id=entity.id,
        name="total",
        label="Total",
        field_type="number",
        formula="[preco] * [quantidade]",
        is_virtual=False # Snapshot
    )
    
    db.add_all([f_preco, f_qtd, f_total])
    db.commit()
    
    print("Metadata created.")
    
    # 3. Simulate Action Execution (CREATE_ITEM)
    # Mock Action Object
    class MockAction:
        action_type = "CREATE_ITEM"
        config = {
            "entity_slug": "vendas_teste_formula"
        }
        
    action = MockAction()
    action.tenant_id = tenant_id # Assign instance var
    payload = {
        "preco": 10.50,
        "quantidade": 2
    }
    
    bg = BackgroundTasks()
    
    print("Executing Action...")
    try:
        from app.engine.api import actions
        # We need to monkeypath actions.WorkflowService to avoid triggering real workflows if not needed
        # Or just let it fail silently in bg tasks
        
        result = actions._execute_logic(action, payload, db, bg)
        print("Action Result:", result)
        
        record_id = result.get("record_id")
        
        # 4. Verify Database
        record = db.query(data_models.EntityRecord).filter(data_models.EntityRecord.id == record_id).first()
        data = record.data
        
        print("Record Data:", data)
        
        # Check if total is calculated
        expected_total = 10.50 * 2
        actual_total = data.get("total")
        
        if actual_total == expected_total:
            print("SUCCESS: Formula calculated correctly!")
        elif str(actual_total) == str(expected_total): # Sometimes string/float diff
            print("SUCCESS: Formula calculated correctly (string match)!")
        else:
            print(f"FAILURE: Expected {expected_total}, got {actual_total}")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        # Cleanup
        db.delete(entity)
        db.commit()
        db.close()

if __name__ == "__main__":
    test_formula_snapshot()
