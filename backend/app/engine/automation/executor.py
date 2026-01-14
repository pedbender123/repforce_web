import logging
import requests
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.engine.automation.definitions import ActionType

logger = logging.getLogger(__name__)

class ActionExecutor:
    def __init__(self, session: Session):
        self.session = session

    def execute(self, action_type: str, params: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Rotear a execução para a função específica baseada no tipo (Síncrono).
        """
        try:
            logger.info(f"Executing Action: {action_type} with params: {params}")
            
            if action_type == ActionType.DB_CREATE:
                return self._db_create(params)
            elif action_type == ActionType.DB_UPDATE:
                return self._db_update(params)
            elif action_type == ActionType.DB_DELETE:
                return self._db_delete(params)
            elif action_type == ActionType.WEBHOOK:
                return self._webhook(params)
            
            # Navegação e Toast são ações de CLIENTE, ignoradas no backend
            elif action_type in [ActionType.NAVIGATE, ActionType.SHOW_TOAST]:
                return {"success": True, "message": "Client-side action ignored by backend runner"}
            
            raise ValueError(f"Unknown action type: {action_type}")

        except Exception as e:
            logger.error(f"Action Execution Failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _db_create(self, params: Dict[str, Any]):
        entity_slug = params.get("entity_slug")
        data = params.get("data", {})
        
        columns = ", ".join(data.keys())
        placeholders = ", ".join([f":{k}" for k in data.keys()])
        
        query = text(f"INSERT INTO {entity_slug} ({columns}) VALUES ({placeholders}) RETURNING id")
        
        result = self.session.execute(query, data)
        self.session.commit()
        new_id = result.scalar()
        
        return {"success": True, "record_id": str(new_id)}

    def _db_update(self, params: Dict[str, Any]):
        entity_slug = params.get("entity_slug")
        record_id = params.get("record_id")
        data = params.get("data", {})
        
        if not record_id:
            raise ValueError("record_id is required for DB_UPDATE")

        set_clause = ", ".join([f"{k} = :{k}" for k in data.keys()])
        query_str = f"UPDATE {entity_slug} SET {set_clause} WHERE id = :record_id"
        
        exec_data = data.copy()
        exec_data["record_id"] = record_id
        
        self.session.execute(text(query_str), exec_data)
        self.session.commit()
        return {"success": True}

    def _db_delete(self, params: Dict[str, Any]):
        entity_slug = params.get("entity_slug")
        record_id = params.get("record_id")

        self.session.execute(
            text(f"DELETE FROM {entity_slug} WHERE id = :id"), 
            {"id": record_id}
        )
        self.session.commit()
        return {"success": True}

    def _webhook(self, params: Dict[str, Any]):
        url = params.get("url")
        method = params.get("method", "POST")
        headers = params.get("headers", {})
        body = params.get("body", {})

        response = requests.request(method, url, json=body, headers=headers, timeout=10)
        
        return {
            "success": 200 <= response.status_code < 300,
            "status": response.status_code,
            "response": response.json() if response.content else None
        }
