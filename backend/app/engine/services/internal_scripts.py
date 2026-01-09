import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.system import models as models_system

logger = logging.getLogger(__name__)



def execute_script_by_name(script_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Registry of internal Python scripts replacing n8n/no-code logic.
    """
    logger.info(f"Executing Internal Script: {script_name}")
    
    if script_name == 'validate_order':
        total = payload.get("total_value", 0)
        # Example logic: > 10k requires approval
        if total > 10000:
             return {"approved": False, "reason": "Requires Manager Approval (Over 10k)"}
        return {"approved": True}
        
    elif script_name == 'enrich_lead':
        email = payload.get("email", "")
        if "gmail.com" in email:
             return {"score": 50, "segment": "B2C"}
        return {"score": 80, "segment": "B2B"}
        
    elif script_name == 'order_created':
        # Async side-effect script
        order_id = payload.get("id", "Unknown")
        logger.info(f"[Script Side-Effect] Processing new order {order_id}. Notifying Logistics...")
        return {"status": "processed"}

    return {"error": f"Script {script_name} not found"}
