from typing import Dict, Any
from sqlalchemy.orm import Session
from app.engine.automation.runner import AutomationRunner
from app.engine.automation.translator import GraphTranslator
from app.engine.metadata.models import MetaTrail
import logging

logger = logging.getLogger(__name__)

class AutomationService:
    def __init__(self, session: Session):
        self.session = session
        self.runner = AutomationRunner(session)

    def run_trail(self, trail_id: str, context: Dict[str, Any]):
        """
        Busca a trilha, traduz e executa (Síncrono).
        """
        logger.info(f"Triggering Trail: {trail_id}")
        
        # Síncrono: session.get
        trail = self.session.get(MetaTrail, trail_id)
        if not trail:
            raise ValueError(f"Trail {trail_id} not found")
            
        if not trail.is_active:
             logger.info(f"Trail {trail_id} is inactive. Skipping.")
             return {"success": False, "message": "Inactive trail"}

        steps = GraphTranslator.translate(trail.nodes)
        
        if not steps:
            logger.warning(f"Trail {trail_id} has no steps.")
            return {"success": True, "executed": 0}

        return self.runner.run_steps(steps, context)
