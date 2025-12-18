import httpx
import logging
from sqlalchemy.orm import Session
from app.db import models_integration
import asyncio

logger = logging.getLogger(__name__)

class WebhookService:
    def __init__(self, db: Session):
        self.db = db

    async def dispatch_event(self, event_name: str, payload: dict):
        """
        Dispara um evento para todos os Webhooks configurados para esse evento.
        """
        try:
            # 1. Encontrar Webhooks ativos para este evento
            # Nota: O filtro JSON idealmente usaria operador @> do Postgres,
            # mas aqui faremos filtro em Python para simplicidade no MVP SQLite/PG hibrido.
            configs = self.db.query(models_integration.WebhookConfig).filter(
                models_integration.WebhookConfig.is_active == True
            ).all()

            targets = [c for c in configs if event_name in c.events]
            
            if not targets:
                logger.debug(f"Nenhum webhook configurado para o evento {event_name}")
                return

            logger.info(f"Disparando evento {event_name} para {len(targets)} webhooks")

            # 2. Enviar Payloads (Async)
            async with httpx.AsyncClient() as client:
                tasks = []
                for config in targets:
                    tasks.append(self._send_payload(client, config, event_name, payload))
                
                await asyncio.gather(*tasks)

        except Exception as e:
            logger.error(f"Erro no dispatch de webhooks: {e}")

    async def _send_payload(self, client: httpx.AsyncClient, config, event_name, payload):
        try:
            full_payload = {
                "event": event_name,
                "timestamp": payload.get("timestamp"),
                "data": payload
            }
            
            headers = config.api_headers or {}
            
            # TODO: Implement HMAC signature with config.secret if needed
            
            response = await client.post(config.url, json=full_payload, headers=headers, timeout=5.0)
            
            if response.status_code >= 400:
                logger.warning(f"Webhook {config.name} falhou com status {response.status_code}")
            else:
                logger.debug(f"Webhook {config.name} sucesso")

        except Exception as e:
            logger.error(f"Falha ao enviar webhook para {config.url}: {e}")
