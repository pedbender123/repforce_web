import httpx
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.engine.metadata import models as models_meta
from app.system import models as models_system

logger = logging.getLogger(__name__)

class WorkflowService:
    @staticmethod
    async def trigger_workflows(
        db: Session,
        entity_slug: str,
        trigger_type: str,
        payload_data: dict,
        tenant_id: str,
        user_id: str = None,
        changes: dict = None
    ):
        """
        Main entry point to check and dispatch workflows.
        This function should be called as a Background Task to avoid blocking the API.
        """
        try:
            # 1. Find the Entity by Slug
            entity = db.query(models_meta.MetaEntity).filter(
                models_meta.MetaEntity.slug == entity_slug,
                models_meta.MetaEntity.tenant_id == tenant_id
            ).first()

            if not entity:
                logger.warning(f"[Workflow] Entity not found for slug: {entity_slug}")
                return

            # 2. Find Active Workflows for this Entity and Trigger
            workflows = db.query(models_meta.MetaWorkflow).filter(
                models_meta.MetaWorkflow.entity_id == entity.id,
                models_meta.MetaWorkflow.trigger_type == trigger_type,
                models_meta.MetaWorkflow.is_active == True
            ).all()

            if not workflows:
                return # No automation configured

            # 3. Construct Payload
            # Fetch user info if available
            user_info = {"id": user_id, "email": "unknown"}
            if user_id:
                user = db.query(models_system.User).filter(models_system.User.id == user_id).first()
                if user:
                    user_info["email"] = user.email

            event_payload = {
                "event": f"entity.{trigger_type.lower().replace('on_', '')}",
                "entity": entity_slug,
                "entity_name": entity.display_name,
                "tenant_id": str(tenant_id),
                "actor": user_info,
                "timestamp": datetime.utcnow().isoformat(),
                "data": payload_data,
                "changes": changes or {}
            }

            # 4. Dispatch Webhooks
            async with httpx.AsyncClient() as client:
                for wf in workflows:
                    try:
                        # Internal Script Handler
                        if wf.webhook_url and wf.webhook_url.startswith("internal://"):
                            script_name = wf.webhook_url.replace("internal://", "")
                            logger.info(f"[Workflow] Executing Internal Script: {script_name}")
                            
                            # Import shared service
                            from app.engine.services.internal_scripts import execute_script_by_name
                            
                            # Execute (Sync in Async loop - acceptable for light scripts, else use threadpool)
                            result = execute_script_by_name(script_name, event_payload)
                            logger.info(f"[Workflow] Result: {result}")
                            continue

                        # Standard Webhook
                        logger.info(f"[Workflow] Dispatching {wf.name or 'Webhook'} to {wf.webhook_url}")
                        resp = await client.post(wf.webhook_url, json=event_payload, timeout=10.0)
                        if resp.status_code >= 400:
                            logger.error(f"[Workflow] Failed to send to {wf.webhook_url}: {resp.status_code} - {resp.text}")
                    except Exception as e:
                        logger.error(f"[Workflow] Error dispatching to {wf.webhook_url}: {str(e)}")

        except Exception as e:
            logger.error(f"[Workflow] Critical error in trigger_workflows: {str(e)}")
