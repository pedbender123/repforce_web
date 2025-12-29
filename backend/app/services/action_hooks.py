
import httpx
from typing import Dict, Any, Optional

N8N_HOOK_BASE = "http://n8n:5678/webhook-test" # Using webhook-test for sync response usually, or specific production implementation

class ActionHookService:
    @staticmethod
    def execute_sync(hook_name: str, payload: Dict[str, Any], timeout: float = 5.0) -> Optional[Dict[str, Any]]:
        """
        Executes a synchronous call to n8n to intercept flow.
        Returns the JSON response from n8n if successful, or None if failed/timed out.
        Used for B2B Logic / Validations.
        """
        url = f"{N8N_HOOK_BASE}/{hook_name}"
        try:
            with httpx.Client(timeout=timeout) as client:
                resp = client.post(url, json=payload)
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            print(f"Action Hook {hook_name} failed: {e}")
            return None
