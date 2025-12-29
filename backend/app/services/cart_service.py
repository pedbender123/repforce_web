
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.db import models_tenant, schemas
from app.services.pricing_service import PricingService

class CartService:
    def __init__(self, db: Session):
        self.db = db
        self.pricing_service = PricingService(db)

    def calculate_cart(self, items: List[schemas.CartItemInput]) -> schemas.CartSummary:
        """
        Calcula o carrinho completo:
        1. Carrega produtos
        2. Aplica regras de preço (item level)
        3. Agrega totais
        """
        if not items:
            return schemas.CartSummary(items=[], total_gross=0, total_discount=0, total_net=0)

        # Carregar produtos (Batch load)
        p_ids = [i.product_id for i in items]
        products = self.db.query(models_tenant.Product).filter(models_tenant.Product.id.in_(p_ids)).all()
        product_map = {p.id: p for p in products}
        
        cart_items = []
        total_gross = 0.0
        total_discount = 0.0
        total_net = 0.0
        total_cost = 0.0

        for item_in in items:
            product = product_map.get(item_in.product_id)
            if not product:
                continue # Ou raise Error
            
            # Pricing logic
            price_info = self.pricing_service.calculate_item_discount(product, item_in.quantity)
            
            # Calcular subtotais
            gross = price_info['original_price']
            net = price_info['final_price']
            discount = price_info['discount_value']
            
            line_total = net * item_in.quantity
            
            total_gross += gross * item_in.quantity
            total_net += line_total
            total_discount += discount * item_in.quantity
            
            cost = (product.cost_price or 0.0) * item_in.quantity
            total_cost += cost

            cart_items.append(schemas.CartItemSummary(
                product_id=product.id,
                name=product.name,
                quantity=item_in.quantity,
                unit_price=gross,
                discount_value=discount,
                net_unit_price=net,
                total=line_total,
                rule_applied=price_info['rule_name']
            ))

        # TODO: Apply global Order Rules here (e.g. Total > 1000 get 5% off everything)
        # self.pricing_service.apply_global_rules(cart_items)

        return schemas.CartSummary(
            items=cart_items,
            total_gross=round(total_gross, 2),
            total_discount=round(total_discount, 2),
            total_net=round(total_net, 2),
            margin_value=round(total_net - total_cost, 2)
        )
