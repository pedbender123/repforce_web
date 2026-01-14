from enum import Enum
from typing import Dict, Any, List

class ActionType(str, Enum):
    # Database Operations
    DB_CREATE = "DB_CREATE"
    DB_UPDATE = "DB_UPDATE"
    DB_DELETE = "DB_DELETE"
    DB_QUERY = "DB_QUERY"  # Future

    # Communication
    SEND_EMAIL = "SEND_EMAIL"
    WEBHOOK = "WEBHOOK"

    # Logic/Flow
    CONDITION = "CONDITION" # If/Else logic inside runner
    WAIT = "WAIT"           # Delay

    # Frontend/Client (Executed by client if run manually, or ignored by backend runner)
    NAVIGATE = "NAVIGATE"
    SHOW_TOAST = "SHOW_TOAST"

# Definition of expected parameters for each action type
# This acts as the Documentation and Validation Schema
ACTION_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    ActionType.DB_CREATE: {
        "label": "Criar Registro",
        "description": "Cria um novo registro em uma tabela.",
        "params": {
            "entity_slug": {"type": "string", "required": True},
            "data": {"type": "json", "required": True, "description": "Key-value pairs matching field slugs"}
        }
    },
    ActionType.DB_UPDATE: {
        "label": "Atualizar Registro",
        "description": "Atualiza um registro existente.",
        "params": {
            "entity_slug": {"type": "string", "required": True},
            "record_id": {"type": "string", "required": True, "description": "UUID or Formula"},
            "data": {"type": "json", "required": True}
        }
    },
    ActionType.DB_DELETE: {
        "label": "Excluir Registro",
        "params": {
            "entity_slug": {"type": "string", "required": True},
            "record_id": {"type": "string", "required": True}
        }
    },
    ActionType.WEBHOOK: {
        "label": "Chamada HTTP (Webhook)",
        "params": {
            "url": {"type": "string", "required": True},
            "method": {"type": "string", "default": "POST", "options": ["GET", "POST", "PUT", "DELETE"]},
            "headers": {"type": "json", "default": {}},
            "body": {"type": "json", "default": {}}
        }
    }
}
