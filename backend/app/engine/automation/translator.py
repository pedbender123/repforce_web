from typing import Dict, List, Any

class GraphTranslator:
    @staticmethod
    def translate(nodes_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Converte o formato de grafo (Nodes + Edges/Next) para uma lista executável.
        Assume que existe um nó inicial e segue o fluxo.
        """
        steps = []
        
        # Encontrar o nó inicial (trigger) ou o primeiro nó sem entradas (simplificação)
        # Numa estrutura complexa, procurariamos pelo trigger_type.
        
        # Estrutura esperada do nodes_config: { "node_id": { "type": "ACTION", "action": "DB_CREATE", "next": "next_node_id", "params": {} } }
        
        # 1. Identificar início
        current_node_id = None
        for nid, node in nodes_config.items():
            # Regra simples: Se for do tipo TRIGGER ou START
            if node.get("type") in ["TRIGGER", "START"]:
                current_node_id = nid
                break
        
        # Se não achar trigger explícito, pega o primeiro (arriscado, mas fallback)
        if not current_node_id and nodes_config:
            current_node_id = list(nodes_config.keys())[0]

        visited = set()
        
        while current_node_id:
            if current_node_id in visited:
                break # Loop detectado
            
            visited.add(current_node_id)
            node = nodes_config[current_node_id]
            
            # Adiciona à lista se for uma AÇÃO
            if node.get("type") == "ACTION":
                steps.append({
                    "id": current_node_id,
                    "action": node.get("action_type"), # Mapeando action_type do front para action do runner
                    "params": node.get("config", {})     # params/config
                })
            
            # Próximo passo
            current_node_id = node.get("next") or node.get("outputs", {}).get("next")

        return steps
