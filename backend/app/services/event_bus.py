
import httpx
import asyncio
from typing import Dict, Any

# Internal n8n webhook base (Docker DNS)
# Use env var eventually, hardcoded for Resilient SaaS mvp speed
N8N_WEBHOOK_BASE = "http://n8n:5678/webhook" 

async def emit_event(tenant_slug: str, event_type: str, payload: Dict[str, Any]):
    """
    Async Fire-and-Forget event emission to n8n.
    Constructs URL: http://n8n:5678/webhook/{tenant_slug}/{event_type}
    """
    url = f"{N8N_WEBHOOK_BASE}/{tenant_slug}/{event_type}"
    
    # We don't await response validation strictly, but we log errors.
    # To truly be fire-and-forget without blocking main thread, 
    # we can use asyncio.create_task or BackgroundTasks if passed from route.
    # Here we assume caller uses await or BackgroundTasks wrapper.
    
    headers = {
        "Content-Type": "application/json",
        "X-Event-Source": "Repforce-Backend"
    }
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            # We don't care about the response body for events, just status
            # But we catch exceptions to not crash the backend.
            await client.post(url, json=payload, headers=headers)
            # print(f"Event Emitted: {event_type} -> {url}") # Debug log
            
    except Exception as e:
        print(f"Failed to emit event {event_type} to n8n: {e}")
