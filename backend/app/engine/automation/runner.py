import logging
import re
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.engine.automation.executor import ActionExecutor

logger = logging.getLogger(__name__)

class AutomationRunner:
    def __init__(self, session: Session):
        self.executor = ActionExecutor(session)

    def run_steps(self, steps: List[Dict[str, Any]], context: Dict[str, Any]):
        """
        Executa uma lista linear de passos (Síncrono).
        """
        results = {}
        execution_context = context.copy()
        
        for i, step in enumerate(steps):
            action_type = step.get("action")
            raw_params = step.get("params", {})
            
            interpolated_params = self._interpolate(raw_params, execution_context)
            
            logger.info(f"Running Step {i}: {action_type}")
            
            result = self.executor.execute(action_type, interpolated_params)
            
            step_id = step.get("id", f"step_{i}")
            results[step_id] = result
            execution_context[step_id] = result
            
            if not result.get("success", False):
                logger.error(f"Step {i} failed. Stopping execution.")
                return {"success": False, "error": result.get("error"), "stopped_at": i}

        return {"success": True, "results": results}

    def _interpolate(self, data: Any, context: Dict[str, Any]) -> Any:
        if isinstance(data, str):
            def replace_match(match):
                key = match.group(1).strip()
                keys = key.split('.')
                val = context
                try:
                    for k in keys:
                        val = val[k]
                    return str(val)
                except (KeyError, TypeError):
                    return f"{{{{{key}}}}}"
            
            return re.sub(r"\{\{(.+?)\}\}", replace_match, data)
        
        elif isinstance(data, dict):
            return {k: self._interpolate(v, context) for k, v in data.items()}
        
        elif isinstance(data, list):
            return [self._interpolate(item, context) for item in data]
            
        return data
