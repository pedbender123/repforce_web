
import logging
from typing import Dict, Any, Optional
import httpx
from uuid import uuid4
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.engine.metadata.models import MetaTrail, MetaEntity, MetaField
from app.engine.formulas import FormulaEngine

logger = logging.getLogger(__name__)

class TrailExecutor:
    def __init__(self, db: Session, tenant_id: str, user_id: Optional[str] = None):
        self.db = db
        self.tenant_id = tenant_id
        self.user_id = user_id
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
        ).first()

        if not trail or not trail.is_active:
            logger.warning(f"Trail {trail_id} not found or inactive.")
            return

        logger.info(f"Starting Trail Execution: {trail.name} ({trail.id})")
        
        # Contexto de Execução (acumula resultados dos nós)
        # [Payload] é o gatilho inicial.
        # [Vars] são as variáveis locais
        execution_context = {
            "Payload": trigger_context,
            **trigger_context # Flatten data
        }
        
        # Initialize Local Variables with defaults
        if trail.local_variables:
            for var in trail.local_variables:
                 # Default to empty string or 0 based on type? 
                 # For now just empty string or null
                 execution_context[var['name']] = None

        nodes = trail.nodes or {}
        start_node = self._find_start_node(nodes)
        
        current_node_id = start_node
        client_instruction = None 
        
        while current_node_id:
            node = nodes.get(current_node_id)
            if not node:
                break
            
            logger.debug(f"Processing Node: {current_node_id} ({node.get('type')})")
            
            try:
                # 1. Resolver Config
                resolved_config = self._resolve_config(node.get('config', {}), execution_context)
                
                # 2. Executar Lógica
                result = self._execute_node_logic(node, resolved_config, execution_context)
                
                # 3. Store Result
                execution_context[current_node_id] = result
                
                # Check for Client Instructions (like Navigation)
                if isinstance(result, dict) and result.get('__client_instruction'):
                    client_instruction = result['__client_instruction']
                
                # 4. Next Node
                current_node_id = self._determine_next_node(node, result)
                
            except Exception as e:
                logger.error(f"Error executing node {current_node_id}: {e}")
                break

        logger.info(f"Trail Execution {trail.id} finished.")
        return execution_context

    def _find_start_node(self, nodes: Dict) -> Optional[str]:
        # First check if there is a 'ROOT' node (frontend uses this convention sometimes)
        if 'ROOT' in nodes: return 'ROOT'
        
        # Scan for node that is not a target of any other
        all_targets = set()
        for n in nodes.values():
            if n.get('next_node_id'): all_targets.add(n.get('next_node_id'))
            if n.get('next_true'): all_targets.add(n.get('next_true'))
            if n.get('next_false'): all_targets.add(n.get('next_false'))
        
        for nid in nodes.keys():
            if nid not in all_targets:
                return nid
        return None

    def _resolve_config(self, config: Dict, context: Dict) -> Dict:
        resolved = {}
        for k, v in config.items():
            if isinstance(v, dict):
                resolved[k] = self._resolve_config(v, context)
            elif isinstance(v, str) and (v.strip().startswith('=') or '[' in v):
                expr = v.strip()[1:] if v.strip().startswith('=') else v
                resolved[k] = self.formula_engine.evaluate(expr, context)
            else:
                resolved[k] = v
        return resolved

    def _execute_node_logic(self, node: Dict, config: Dict, context: Dict) -> Any:
        node_type = node.get('type')
        action_type = node.get('action_type')

        if node_type == 'TRIGGER':
            return context.get('Payload')

        elif node_type == 'DECISION':
            # Config 'expression' needs to be boolean
            expr = config.get('expression')
            # If it was already resolved by _resolve_config, it might be the value.
            # But normally formula_engine returns the value. 
            # If 'expression' key exists in config, _resolve_config evaluated it.
            return bool(expr)

        elif node_type == 'ACTION':
            return self._run_action(action_type, config, context)
            
        return None

    def _run_action(self, action_type: str, config: Dict, context: Dict):
        if action_type == 'DB_CREATE':
            # config: { table_id: UUID, mapped_values: { col: val } }
            table_id = config.get('table_id')
            values = config.get('mapped_values', {})
            
            if not table_id: return {"error": "No table_id"}
            
            # Find Table Name
            entity = self.db.query(MetaEntity).filter(MetaEntity.id == table_id).first()
            if not entity: return {"error": "Entity not found"}
            
            # Construir Insert SQL
            cols = ', '.join(values.keys())
            # Safe parameter interpolation needed ideally, but values are from trusted formulas?
            # Creating a params dict for execute
            params = {}
            placeholders = []
            for k, v in values.items():
                placeholders.append(f":{k}")
                params[k] = v
            
            sql = f"INSERT INTO {entity.slug} ({cols}) VALUES ({', '.join(placeholders)}) RETURNING id"
            
            try:
                res = self.db.execute(text(sql), params)
                self.db.commit()
                new_id = res.fetchone()[0]
                return {"id": str(new_id), "status": "success"}
            except Exception as e:
                self.db.rollback()
                logger.error(f"DB_CREATE Error: {e}")
                return {"error": str(e)}

        elif action_type == 'DB_UPDATE':
            # config: { table_id: UUID, record_id: UUID, mapped_values: {} }
            table_id = config.get('table_id')
            record_id = config.get('record_id')
            values = config.get('mapped_values', {})
            
            if not table_id or not record_id: return {"error": "Missing ID"}
            
            entity = self.db.query(MetaEntity).filter(MetaEntity.id == table_id).first()
            if not entity: return {"error": "Entity not found"}
            
            set_clauses = []
            params = {"record_id": record_id}
            for k, v in values.items():
                set_clauses.append(f"{k} = :{k}")
                params[k] = v
                
            sql = f"UPDATE {entity.slug} SET {', '.join(set_clauses)} WHERE id = :record_id"
            try:
                self.db.execute(text(sql), params)
                self.db.commit()
                return {"status": "success"}
            except Exception as e:
                self.db.rollback()
                return {"error": str(e)}

        elif action_type == 'DB_DELETE':
             table_id = config.get('table_id')
             record_id = config.get('record_id')
             if not table_id or not record_id: return {"error": "Missing ID"}
             
             entity = self.db.query(MetaEntity).filter(MetaEntity.id == table_id).first()
             sql = f"DELETE FROM {entity.slug} WHERE id = :record_id"
             try:
                self.db.execute(text(sql), {"record_id": record_id})
                self.db.commit()
                return {"status": "success"}
             except Exception as e:
                 return {"error": str(e)}

        elif action_type == 'NAVIGATE':
            # config: { page_id: UUID, record_id: UUID/Formula }
            return {
                "__client_instruction": {
                    "type": "NAVIGATE",
                    "page_id": config.get('page_id'),
                    "record_id": config.get('record_id')
                },
                "status": "instruction_sent"
            }

        elif action_type == 'DB_FETCH_FIELD':
            # config: { table_id: UUID, record_id: UUID, field_name: str }
            table_id = config.get('table_id')
            record_id = config.get('record_id')
            field_name = config.get('field_name')
            
            if not table_id or not record_id or not field_name: 
                return {"error": "Missing params for Fetch Field"}
            
            entity = self.db.query(MetaEntity).filter(MetaEntity.id == table_id).first()
            if not entity: return {"error": "Entity not found"}
            
            # Raw SQL for speed and flexibility
            sql = text(f"SELECT data ->> :field FROM {entity.slug} WHERE id = :record_id")
            result = self.db.execute(sql, {"field": field_name, "record_id": record_id}).fetchone()
            
            val = result[0] if result else None
            return {"value": val, "status": "success"}

        elif action_type == 'MATH_OP':
             # config: { expression: "10 * 2" }
             # logic: Evaluate expression with context
             expr = config.get('expression')
             if not expr: return {"error": "No expression"}
             
             try:
                 # Add context variables to formula evaluation scope if needed
                 # Current FormulaEngine handles basic math and context
                 val = self.formula_engine.evaluate(expr, context)
                 return {"result": val, "status": "success"}
             except Exception as e:
                 return {"error": f"Math Error: {e}"}

        elif action_type == 'GENERATE_CSV':
            # config: { table_id: UUID, filter: str }
            import csv
            import os
            from datetime import datetime
            
            table_id = config.get('table_id')
            if not table_id: return {"error": "Table ID required"}
            
            entity = self.db.query(MetaEntity).filter(MetaEntity.id == table_id).first()
            if not entity: return {"error": "Entity not found"}
            
            # Fetch Data (Simple Select All for now, can add filtering later)
            sql = text(f"SELECT data FROM {entity.slug}") # TODO: Apply filters
            rows = self.db.execute(sql).fetchall()
            
            # Determine Headers (from MetaField)
            fields = self.db.query(MetaField).filter(MetaField.entity_id == entity.id).all()
            headers = [f.name for f in fields]
            
            # Generate File
            filename = f"export_{entity.slug}_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"
            filepath = os.path.join("uploads", filename)
            
            # Ensure upload dir exists (in container mapped volume)
            os.makedirs("uploads", exist_ok=True)
            
            with open(filepath, 'w', newline='') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=headers)
                writer.writeheader()
                for row in rows:
                    # row[0] is the data json
                    data = row[0]
                    # Filter keys to only those in headers (schema match)
                    row_data = {k: data.get(k, '') for k in headers}
                    writer.writerow(row_data)
            
            return {"url": f"/uploads/{filename}", "status": "success"}

        elif action_type == 'GENERATE_PDF':
            # config: { page_id: UUID, record_id: UUID } (Simulate Page View)
            # OR simple data dump template
            import os
            from xhtml2pdf import pisa
            from datetime import datetime
            
            # Mock content for MVP - In real app, render a Jinja2 template
            content = f"""
            <html>
            <body>
            <h1>Relatório de Execução</h1>
            <p>Gerado em: {datetime.now()}</p>
            <hr/>
            <h3>Dados do Contexto</h3>
            <pre>{context}</pre>
            </body>
            </html>
            """
            
            filename = f"report_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
            filepath = os.path.join("uploads", filename)
            os.makedirs("uploads", exist_ok=True)
            
            try:
                with open(filepath, "w+b") as result_file:
                    pisa_status = pisa.CreatePDF(content, dest=result_file)
                
                if pisa_status.err:
                    return {"error": "PDF Generation Error"}
                
                return {"url": f"/uploads/{filename}", "status": "success"}
            except Exception as e:
                return {"error": f"PDF Error: {e}"}

        elif action_type == 'SEND_NOTIFICATION':
             # config: { message: str, recipient: str (username or formula) }
             message = config.get('message')
             recipient_input = config.get('recipient')
             
             if not message or not recipient_input: return {"error": "Missing msg/recipient"}
             
             # Resolve Recipient(s)
             from app.system.models import GlobalUser
             
             # Check if it's a formula result array or string
             recipients = []
             
             # Case 1: "pbrandon" (Username)
             if isinstance(recipient_input, str) and not recipient_input.startswith('['):
                 user = self.db.query(GlobalUser).filter(GlobalUser.username == recipient_input).first()
                 if user: recipients.append(user.id)
             
             # Case 2: List of IDs [uuid, uuid] (from formula)
             elif isinstance(recipient_input, list):
                 recipients = recipient_input
             
             # Dispatch
             count = 0
             for uid in recipients:
                 # Create Notification (Using shared service or direct DB)
                 # Keep it simple: Direct DB
                 # TODO: Import Notification Model
                 # For now, just Log
                 logger.info(f"NOTIFICATION to {uid}: {message}")
                 count += 1
             
             return {"status": "success", "count": count}

        elif action_type == 'WEBHOOK_OUT':
            # config: { url: str, method: str, headers: dict, body: dict }
            url = config.get('url')
            method = config.get('method', 'POST')
            headers = config.get('headers', {})
            body = config.get('body', {})
            
            try:
                with httpx.Client() as client:
                    resp = client.request(method, url, headers=headers, json=body, timeout=10.0)
                    return {"status": resp.status_code, "response": resp.text}
            except Exception as e:
                return {"error": str(e)}
        
        elif action_type == 'CREATE_TASK':
             # config: { assignee_id: UUID, title: str, description: str }
             # Stub for now
             return {"status": "mock_task_created", "config": config}

        return {"status": "unknown_action"}

    def _determine_next_node(self, node: Dict, result: Any) -> Optional[str]:
        node_type = node.get('type')
        
        if node_type == 'DECISION':
            if result is True:
                return node.get('next_true')
            else:
                return node.get('next_false')
                
        return node.get('next_node_id')
