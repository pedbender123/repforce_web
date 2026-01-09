

import asyncio
from typing import Dict, Any

# Internal n8n webhook base (Docker DNS)
# Use env var eventually, hardcoded for Resilient SaaS mvp speed
 

async def emit_event(tenant_slug: str, event_type: str, payload: Dict[str, Any]):
    """
    Async Fire-and-Forget event emission to Internal Automation Engine.
    """
    # Requires tenant_id, not slug, for credit deduction.
    # We will try to resolve it or add it to payload.
    # For now, we assume payload might contain 'tenant_id' or we need to lookup.
    
    # Ideally, event_bus should receive tenant_id. 
    # For this refactor, let's assume tenant_slug is actually tenant_id or we can't deduct.
    # Or we construct a tenant_id lookup cache. 
    # TO KEEP IT SIMPLE: We will require payload to have 'tenant_id'.
    
    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        print(f"Event {event_type} missing tenant_id for automation.")
        return

    # Direct Internal Script Execution for System Events
    # (Assuming we want to run a script matching the event type)
    from app.engine.services.internal_scripts import execute_script_by_name
    from app.shared.database import SessionSys
    
    # We need a DB session? Maybe not if just running script content logic.
    # But internal_scripts might need DB? execute_script_by_name is pure logic mostly, but if it accesses DB...
    # Let's keep SessionSys just in case we need it later, but remove credit check.
    
    db = SessionSys()
    try:
        result = execute_script_by_name(event_type, payload)
        # print(f"Event {event_type} executed: {result}")
        
    except Exception as e:
        print(f"Error executing event {event_type}: {e}")
    finally:
        db.close()
