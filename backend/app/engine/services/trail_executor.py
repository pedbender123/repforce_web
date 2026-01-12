
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.engine.metadata.models import MetaTrail, MetaEntity
from app.engine.formulas import FormulaEngine
from app.engine.api.actions import ActionExecutor # Assuming existing action logic or we implement here
# We might need to implement action logic here if ActionExecutor is for the old system

logger = logging.getLogger(__name__)

class TrailExecutor:
    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id
        self.formula_engine = FormulaEngine(db, tenant_id)

    def execute_trail(self, trail_id: str, trigger_context: Dict[str, Any]):
        """
        Executa uma trilha completa a partir de um contexto inicial.
        Args:
            trail_id: UUID da trilha.
            trigger_context: Dados iniciais (Payload). Ex: { "entity_id": "...", "data": {...} }
        """
        trail = self.db.query(MetaTrail).filter(
            MetaTrail.id == trail_id,
            MetaTrail.tenant_id == self.tenant_id,
            MetaTrail.is_active == True
        ).first()

        if not trail:
            logger.warning(f"Trail {trail_id} not found or inactive.")
            return

        logger.info(f"Starting Trail Execution: {trail.name} ({trail.id})")
        
        # Contexto de Execução (acumula resultados dos nós)
        # [Payload] é o gatilho inicial.
        execution_context = {
            "Payload": trigger_context,
            **trigger_context # Flatten data for easier access if needed
        }

        # Encontrar nó inicial (Type == START or TRIGGER)
        # Assumindo que 'nodes' é um dict { id: node_obj }
        nodes = trail.nodes or {}
        start_node = self._find_start_node(nodes)
        
        current_node_id = start_node
        
        while current_node_id:
            node = nodes.get(current_node_id)
            if not node:
                logger.error(f"Node {current_node_id} not found in trail definition.")
                break
            
            logger.debug(f"Processing Node: {current_node_id} ({node.get('type')})")
            
            try:
                # 1. Resolver Configurações com Fórmulas
                resolved_config = self._resolve_config(node.get('config', {}), execution_context)
                
                # 2. Executar Lógica do Nó
                result = self._execute_node_logic(node, resolved_config, execution_context)
                
                # 3. Armazenar Resultado no Contexto
                # Acessível nos próximos nós como [NodeID.Output]
                execution_context[current_node_id] = result
                
                # 4. Determinar Próximo Nó
                current_node_id = self._determine_next_node(node, result)
                
            except Exception as e:
                logger.error(f"Error executing node {current_node_id}: {e}")
                # TODO: Error handling strategy (stop, retry, error path)
                break

        logger.info(f"Trail Execution {trail.id} finished.")

    def _find_start_node(self, nodes: Dict) -> Optional[str]:
        # Procura por type == 'TRIGGER' ou 'START'
        for nid, n in nodes.items():
            if n.get('type') in ['TRIGGER', 'START']:
                return nid
        return None

    def _resolve_config(self, config: Dict, context: Dict) -> Dict:
        """
        Percorre recursivamente o dicionário de config e resolve strings que parecem fórmulas.
        """
        resolved = {}
        for k, v in config.items():
            if isinstance(v, dict):
                resolved[k] = self._resolve_config(v, context)
            elif isinstance(v, str) and (v.startswith('=') or '[' in v): # Heurística simples
                # Remove '=' if exists for AppSheet style convention
                expr = v[1:] if v.startswith('=') else v
                resolved[k] = self.formula_engine.evaluate(expr, context)
            else:
                resolved[k] = v
        return resolved

    def _execute_node_logic(self, node: Dict, config: Dict, context: Dict) -> Any:
        node_type = node.get('type')
        action_type = node.get('action_type') # Subtipo para ACTION

        if node_type == 'TRIGGER':
            return context.get('Payload')

        elif node_type == 'DECISION':
            # Config deve ter uma 'condition' (fórmula).
            # Se a fórmula já foi resolvida em _resolve_config, pegamos o valor.
            # Mas espera, se config tem a fórmula, _resolve_config já a executou.
            # Então config['condition'] deve ser True/False.
            condition = config.get('condition')
            return bool(condition)

        elif node_type == 'ACTION':
            return self._run_action(action_type, config, context)
            
        return None

    def _run_action(self, action_type: str, config: Dict, context: Dict):
        # Implementação das ações físicas
        if action_type == 'DB_UPDATE':
            # Ex: { "entity_id": "...", "record_id": "...", "data": { "status": "Active" } }
            # As fórmulas dentro de 'data' já foram resolvidas em _resolve_config? Sim.
            
            # TODO: Importante! DB Write.
            # Precisa de Entity ID, Record ID e Data.
            # Se record_id for 'NEW', cria.
            pass
            
        elif action_type == 'SCRIPT':
            # Executa script interno Python (Cuidado com segurança!)
            # Por enquanto stub.
            pass
            
        return {"status": "success", "data": config}

    def _determine_next_node(self, node: Dict, result: Any) -> Optional[str]:
        node_type = node.get('type')
        
        if node_type == 'DECISION':
            # Decision nodes tem 'next_true' e 'next_false'
            if result:
                return node.get('next_true')
            else:
                return node.get('next_false')
                
        # Default next
        return node.get('next_node_id')
