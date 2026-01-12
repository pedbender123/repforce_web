

from typing import Dict, Any, Optional



class ActionHookService:
    @staticmethod
    def execute_sync(hook_name: str, payload: Dict[str, Any], timeout: float = 5.0) -> Optional[Dict[str, Any]]:
        """
        Executes a synchronous call to Internal Automation Engine (Virtual Hooks).
        """
        tenant_id = payload.get("tenant_id")
        if not tenant_id:
            print(f"Action Hook {hook_name} missing tenant_id in payload.")
            return None

        from app.shared.database import SessionSys
        from app.engine.metadata import models as models_meta
        from app.engine.services.internal_scripts import execute_script_by_name
        
        db = SessionSys()
        try:
             # Look for Virtual Hook for this tenant
             action = db.query(models_meta.MetaAction).filter(
                 models_meta.MetaAction.trigger_source == 'VIRTUAL_HOOK',
                 models_meta.MetaAction.trigger_context == hook_name,
                 models_meta.MetaAction.tenant_id == tenant_id
             ).first()
             
             if not action:
                 # Optional: Warn if hook expected but not found?
                 # For now, just return None (no override)
                 return None

             if action.action_type == 'PYTHON_SCRIPT':
                 # Direct execution
                 script_name = action.config.get("script_name")
                 return execute_script_by_name(script_name, payload)
                 
             return None
        except Exception as e:
            print(f"Error in Action Hook {hook_name}: {e}")
            return None
        finally:
            db.close()
