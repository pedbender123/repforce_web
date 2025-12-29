from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.db import models_tenant

class PricingService:
    def __init__(self, db: Session):
        self.db = db
        # Carrega regras ativas
        self.rules = self.db.query(models_tenant.DiscountRule)\
            .filter(models_tenant.DiscountRule.active == True)\
            .order_by(models_tenant.DiscountRule.priority.desc())\
            .all()

    def _is_rule_applicable(self, rule: models_tenant.DiscountRule, item_context: Dict) -> bool:
        """
        Verifica se a regra se aplica ao contexto do item/pedido.
        item_context: {
           'product_id': int, 
           'family_id': int, 
           'brand_id': int, 
           'quantity': int, 
           'unit_price': float
        }
        """
        now = datetime.now()
        
        # 1. Validação de Data
        if rule.start_date and now < rule.start_date:
            return False
        if rule.end_date and now > rule.end_date:
            return False

        # 2. Validação de Escopo (Target)
        if rule.target_type == models_tenant.DiscountTargetType.PRODUCT:
            if rule.target_id != item_context.get('product_id'): return False
        elif rule.target_type == models_tenant.DiscountTargetType.FAMILY:
            if rule.target_id != item_context.get('family_id'): return False
        elif rule.target_type == models_tenant.DiscountTargetType.BRAND:
            if rule.target_id != item_context.get('brand_id'): return False
        
        # 3. Validação de Gatilhos (Quantity/Value)
        if rule.min_quantity and item_context.get('quantity', 0) < rule.min_quantity:
            return False
        
        # TODO: Implementar Mix e regras baseadas em valor total do pedido se necessário
        
        return True

    def calculate_item_discount(self, product: models_tenant.Product, quantity: int) -> Dict:
        """
        Retorna o desconto aplicável para um item específico.
        Retorno: { 'discount_value': float, 'rule_applied': str }
        """
        context = {
            'product_id': product.id,
            'family_id': product.family_id,
            'brand_id': product.brand_id,
            'quantity': quantity,
            'unit_price': product.price
        }

        # Itera sobre regras (já ordenadas por prioridade)
        for rule in self.rules:
            if self._is_rule_applicable(rule, context):
                discount = 0.0
                if rule.discount_percent:
                    discount = product.price * (rule.discount_percent / 100.0)
                elif rule.discount_value:
                    discount = rule.discount_value
                
                # Garante que desconto não exceda preço
                discount = min(discount, product.price)
                
                return {
                    'original_price': product.price,
                    'final_price': product.price - discount,
                    'discount_value': discount,
                    'rule_name': rule.name
                }
        
        return {
            'original_price': product.price,
            'final_price': product.price,
            'discount_value': 0.0,
            'rule_name': None
        }

    def calculate_order_total(self, items: List[Dict]) -> float:
        """
        Calcula total de uma lista de itens aplicando regras.
        items: [{ 'product_id': 1, 'quantity': 10 }, ...]
        """
        total = 0.0
        # TODO: Otimização (carregar produtos em batch)
        for item in items:
            product = self.db.query(models_tenant.Product).get(item['product_id'])
            if not product: continue
            
            result = self.calculate_item_discount(product, item['quantity'])
            total += result['final_price'] * item['quantity']
            
        return total
