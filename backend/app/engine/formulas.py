
import re
import math
import logging
import uuid
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.engine.metadata.models import MetaEntity, MetaField

logger = logging.getLogger(__name__)

class FormulaEngine:
    """
    Motor de processamento de expressões estilo AppSheet.
    Suporta Lógica, Matemática, Texto, Datas, Referências e Contexto de Usuário.
    """
    
    def __init__(self, db: Session, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id
        self._geocode_cache = {} # Cache local para esta instância

    def evaluate(self, formula: str, context: Dict[str, Any], user_context: Optional[Dict[str, Any]] = None, current_entity_id: Optional[str] = None) -> Any:
        """
        Avalia uma fórmula dado um contexto (registro atual).
        Args:
            formula: A string da expressão.
            context: Dicionário com os dados do registro atual (colunas).
            user_context: Dicionário com dados do usuário {id, email, cargo, ...}.
            current_entity_id: ID da entidade atual (para resolver metadados e Refs).
        """
        if not formula:
            return None
            
        try:
            # --- PRE-PROCESSAMENTO (REGEX Transpilation) ---
            
            processed_formula = formula
            
            # 1. Tratamento de Dereference: [Ref].[Column]
            # Converte [RefField].[TargetCol] -> LOOKUP([RefField], 'TargetTableDeterminedByMeta', 'id', 'TargetCol')
            # OBS: Resolver a tabela alvo requer consulta de metadados se não for explicito.
            # Para MVP Agil: Se conseguirmos identificar o campo Ref, injetamos.
            # Caso contrário, teremos que usar uma função DEREF dinamica.
            
            # Regex para [Ref].[Col] - suporta nomes com espaço dentro dos colchetes
            deref_pattern = r'\[([^\]]+)\]\.\[([^\]]+)\]'
            
            def replace_deref(match):
                ref_col = match.group(1)
                target_col = match.group(2)
                # Tentativa de inferir tabela é custosa aqui sem cache. 
                # Vamos usar uma função helper DEREF que faz a busca no runtime.
                # Transpila para: DEREF(context['RefCol'], 'TargetCol')
                # A função DEREF precisará descobrir a tabela alvo baseada no nome da coluna Ref do contexto atual.
                return f"DEREF('{ref_col}', '{target_col}')"
            
            processed_formula = re.sub(deref_pattern, replace_deref, processed_formula)

            # 2. Tratamento de Colunas: [Coluna] -> variables.get('Coluna')
            # Cuidado para não quebrar strings que contem colchetes. Assumimos sintaxe valida.
            def replace_column(match):
                col_name = match.group(1)
                # Escape single quotes in column name just in case
                safe_col = col_name.replace("'", "\\'")
                return f"variables.get('{safe_col}')"
            
            processed_formula = re.sub(r'\[([^\]]+)\]', replace_column, processed_formula)
            
            # 3. Operadores AppSheet -> Python
            processed_formula = processed_formula.replace("<>", "!=")
            # = vira ==, mas ignora se precedido por <, >, !, = 
            processed_formula = re.sub(r'(?<![<>!=])=(?!=)', '==', processed_formula) 
            
            # --- DEFINIÇÃO DE FUNÇÕES (GLOBALS) ---

            # Lógica
            def app_if(cond, val_true, val_false):
                return val_true if cond else val_false
            
            def app_ifs(*args):
                # Pares: cond1, val1, cond2, val2 ...
                for i in range(0, len(args), 2):
                    if i + 1 >= len(args): 
                        return None # Argumentos impares sem match
                    if args[i]:
                        return args[i+1]
                return None # Nenhuma condição verdadeira

            def app_isblank(val):
                return val is None or val == ""
            
            def app_isnotblank(val):
                return not app_isblank(val)
            
            def app_and(*args):
                return all(args)
            
            def app_or(*args):
                return any(args)
            
            def app_not(val):
                return not val


            # Usuário
            def app_user():
                # Retorna o NOME do usuário (Full Name)
                return user_context.get('name') if user_context else None
            
            def app_username():
                # Retorna o USERNAME/LOGIN do usuário
                return user_context.get('username') if user_context else None

            def app_useremail():
                return user_context.get('email') if user_context else None
            
            def app_usercargo():
                return user_context.get('cargo') if user_context else None

            # Buscas e Listas
            def app_lookup(lookup_val, table_slug, lookup_col, return_col):
                return self._lookup(lookup_val, table_slug, lookup_col, return_col)
            
            def app_deref(ref_col_name, target_col_name):
                # Função mágica para [Ref].[Col]
                # Precisa descobrir qual tabela a ref_col_name aponta.
                # Requer entity_id atual.
                if not current_entity_id:
                    return None
                
                # Buscar metadados do campo
                # Otimização: Cachear isso seria ideal.
                ref_val = context.get(ref_col_name)
                if not ref_val:
                    return None
                    
                field_meta = self.db.execute(text("""
                    SELECT f.options 
                    FROM meta_fields f
                    WHERE f.entity_id = :ent_id AND f.name = :fname
                """), {"ent_id": current_entity_id, "fname": ref_col_name}).fetchone()
                
                if not field_meta or not field_meta[0]:
                    return None
                
                options = field_meta[0] # JSON
                target_table = options.get('target') # Slug da tabela alvo
                
                if not target_table:
                    return None
                    
                # Agora faz o lookup: PK (id) = ref_val, retorna target_col_name
                return self._lookup(ref_val, target_table, 'id', target_col_name)

            def app_select(table_slug, return_col, filter_expr=None):
                return self._select(table_slug, return_col, filter_expr, user_context)

            def app_filter(table_slug, filter_expr):
                return self._select(table_slug, "id", filter_expr, user_context)

            def app_any(lst):
                if isinstance(lst, list) and len(lst) > 0:
                    return lst[0]
                return None
            
            def app_in(val, lst):
                if isinstance(lst, list):
                    return val in lst
                return False

            # Matemática e Agregação
            def app_count(lst):
                if isinstance(lst, list):
                    return len(lst)
                return 0
            
            def app_sum(lst):
                if isinstance(lst, list):
                    # Filtrar nulos e somar
                    return sum(float(x) for x in lst if x is not None and str(x).replace('.','',1).isdigit())
                return 0
            
            def app_average(lst):
                if isinstance(lst, list) and len(lst) > 0:
                    clean = [float(x) for x in lst if x is not None and str(x).replace('.','',1).isdigit()]
                    if not clean: return 0
                    return sum(clean) / len(clean)
                return 0
            
            def app_uniqueid():
                return str(uuid.uuid4())[:8] # AppSheet style short UUID or Full? Usando short por enquanto.

            # Data e Hora
            def app_today():
                return datetime.now().date() # retorna date object
            
            def app_now():
                return datetime.now() # retorna datetime object
            
            def app_timenow():
                return datetime.now().time()
            
            def app_workday(start_date, days):
                # Simplificado: não considera feriados, só fds
                if isinstance(start_date, str):
                    try: start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
                    except: return None
                if not isinstance(start_date, (date, datetime)):
                    return None
                
                current = start_date
                added = 0
                direction = 1 if days > 0 else -1
                days = abs(days)
                
                while added < days:
                    current += timedelta(days=direction)
                    if current.weekday() < 5: # 0-4 é Seg-Sex
                        added += 1
                return current

            # Texto
            def app_concatenate(*args):
                return "".join([str(a) if a is not None else "" for a in args])
            
            def app_split(text_val, separator):
                if not text_val: return []
                return str(text_val).split(separator)

            # Geocodificação
            def app_latlong(address):
                if not address: return None
                if address in self._geocode_cache:
                    return self._geocode_cache[address]
                
                try:
                    import httpx
                    with httpx.Client(timeout=10.0) as client:
                        resp = client.get(
                            "https://nominatim.openstreetmap.org/search",
                            params={"q": address, "format": "json", "limit": 1},
                            headers={"User-Agent": "RepforceCRM/1.0"}
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            if data:
                                lat = data[0].get("lat")
                                lon = data[0].get("lon")
                                res = f"{lat},{lon}"
                                self._geocode_cache[address] = res
                                return res
                except Exception as e:
                    logger.error(f"Geocoding error for '{address}': {e}")
                return None

            # Globals para eval
            eval_globals = {
                "__builtins__": None,
                # Python basics
                "math": math,
                "int": int, "float": float, "str": str, "len": len, "list": list,
                # Logic
                "IF": app_if, "IFS": app_ifs, 
                "ISBLANK": app_isblank, "ISNOTBLANK": app_isnotblank,
                "AND": app_and, "OR": app_or, "NOT": app_not,
                # User
                "USER": app_user, "USERNAME": app_username, "USEREMAIL": app_useremail, "USERCARGO": app_usercargo,
                # List/Search
                "LOOKUP": app_lookup, "SELECT": app_select, "FILTER": app_filter, 
                "ANY": app_any, "IN": app_in, "DEREF": app_deref,
                # Math
                "COUNT": app_count, "SUM": app_sum, "AVERAGE": app_average, "UNIQUEID": app_uniqueid,
                # Date
                "TODAY": app_today, "NOW": app_now, "TIMENOW": app_timenow, "WORKDAY": app_workday,
                # Text
                "CONCATENATE": app_concatenate, "SPLIT": app_split,
                # Geo
                "LATLONG": app_latlong
            }

            # Sanitização do Contexto
            safe_context = {}
            for k, v in context.items():
                if isinstance(v, str):
                    try:
                        if v.isdigit(): safe_context[k] = int(v)
                        elif v.replace('.','',1).isdigit(): safe_context[k] = float(v)
                        else: safe_context[k] = v
                    except: safe_context[k] = v
                else:
                    safe_context[k] = v

            logger.debug(f"Eval: {processed_formula} | Ctx: {safe_context.keys()}")
            return eval(processed_formula, eval_globals, {"variables": safe_context})

        except Exception as e:
            logger.error(f"Formula Error '{formula}': {e}")
            return None

    def _lookup(self, lookup_val, target_table_slug, lookup_col, return_col):
        try:
            target_entity = self.db.query(MetaEntity).filter(
                MetaEntity.slug == target_table_slug, 
                MetaEntity.tenant_id == self.tenant_id
            ).first()
            if not target_entity: return None

            sql = text(f"""
                SELECT data->>:return_col 
                FROM entity_records 
                WHERE entity_id = :entity_id 
                AND data->>:key_col = :val
                LIMIT 1
            """)
            row = self.db.execute(sql, {
                "return_col": return_col,
                "entity_id": target_entity.id,
                "key_col": lookup_col,
                "val": str(lookup_val)
            }).fetchone()
            return row[0] if row else None
        except Exception as e:
            logger.error(f"Lookup DB Error: {e}")
            return None

    def _select(self, table_slug, return_col, filter_expr_raw, user_context):
        """
        Implementação básica de SELECT. 
        Warning: Performance crítica. Itera sobre registros para filtrar via Python se expression complexa.
        Se filter_expr_raw for None, retorna tudo.
        """
        try:
            target_entity = self.db.query(MetaEntity).filter(
                MetaEntity.slug == table_slug, 
                MetaEntity.tenant_id == self.tenant_id
            ).first()
            if not target_entity: return []

            # Buscar TODOS os registros da entidade alvo
            # TODO: Em produção, isso deve ser otimizado para não carregar tudo na memória
            # Ou implementar transpilação de formula para SQL WHERE.
            
            sql = text("SELECT id, data FROM entity_records WHERE entity_id = :eid")
            rows = self.db.execute(sql, {"eid": target_entity.id}).fetchall()
            
            results = []
            
            # Se não tiver filtro, retorna direto
            if not filter_expr_raw or filter_expr_raw == "TRUE":
                for r in rows:
                    data = r.data
                    if return_col == "id": results.append(str(r.id))
                    else: results.append(data.get(return_col))
                return results

            # Se tiver filtro, avalia para cada linha
            # Recursão do evaluate!
            for r in rows:
                row_ctx = r.data
                row_ctx['id'] = str(r.id) # Ensure ID is available
                
                # Evaluate filter condition boolean
                # Cuidado: Recursão infinita se filtro chamar SELECT da mesma tabela?
                # Devemos passar current_entity_id=target_entity.id
                match = self.evaluate(filter_expr_raw, row_ctx, user_context, str(target_entity.id))
                
                if match:
                    if return_col == "id": results.append(str(r.id))
                    else: results.append(row_ctx.get(return_col))
                    
            return results
        except Exception as e:
            logger.error(f"Select DB Error: {e}")
            return []
