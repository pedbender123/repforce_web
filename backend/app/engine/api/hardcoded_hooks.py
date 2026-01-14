from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.engine.metadata import data_models, models as meta_models
import datetime

# --- HELPER FUNCTIONS ---

def get_entity_id(db: Session, tenant_id: str, slug: str):
    ent = db.query(meta_models.MetaEntity).filter(
        meta_models.MetaEntity.slug == slug,
        meta_models.MetaEntity.tenant_id == tenant_id
    ).first()
    return ent.id if ent else None

def get_record(db: Session, tenant_id: str, entity_slug: str, record_id: str):
    ent_id = get_entity_id(db, tenant_id, entity_slug)
    if not ent_id: return None
    return db.query(data_models.EntityRecord).filter(
        data_models.EntityRecord.tenant_id == tenant_id,
        data_models.EntityRecord.entity_id == ent_id,
        data_models.EntityRecord.id == record_id
    ).first()

# --- HOOKS ---

def run_create_hooks(entity_slug: str, payload: dict, db: Session, tenant_id: str):
    """
    Executa validações e modificações ANTES de criar o registro.
    Pode levantar HTTPException para bloquear.
    Modifica 'payload' in-place se necessário.
    """
    
    # W04: Bloqueio de Estoque (Ao salvar Item de Pedido)
    if entity_slug == "itens_pedido":
        produto_id = payload.get("produto_ref")
        qtd = float(payload.get("quantidade", 0))
        
        if produto_id and qtd > 0:
            # Buscar Produto
            prod_rec = get_record(db, tenant_id, "produtos", produto_id)
            if prod_rec:
                estoque_atual = float(prod_rec.data.get("estoque_atual", 0))
                if qtd > estoque_atual:
                    raise HTTPException(status_code=400, detail=f"Estoque Insuficiente! Solicitado: {qtd}, Disponível: {estoque_atual}")

    # W01: Alçada de Aprovação (Ao criar Pedido - Raro criar já com itens, mas ok)
    if entity_slug == "pedidos":
        check_approval_rule(payload)


def run_update_hooks(entity_slug: str, record_id: str, payload: dict, db: Session, tenant_id: str, old_data: dict):
    """
    Executa validações e ações ANTES de atualizar o registro no banco.
    """
    
    # W04: Bloqueio de Estoque (Update de Item)
    if entity_slug == "itens_pedido":
        # Se mudou quantidade ou produto
        new_qtd = float(payload.get("quantidade", 0))
        new_prod = payload.get("produto_ref")
        
        # Otimização: Só checa se Qtd aumentar ou mudar prod
        # Para MVP: Checa sempre que salvar item
        if new_prod:
            prod_rec = get_record(db, tenant_id, "produtos", new_prod)
            if prod_rec:
                estoque_atual = float(prod_rec.data.get("estoque_atual", 0))
                if new_qtd > estoque_atual:
                    raise HTTPException(status_code=400, detail=f"Estoque Insuficiente! Solicitado: {new_qtd}, Disponível: {estoque_atual}")

    # W01: Alçada de Aprovação (Ao atualizar Pedido)
    if entity_slug == "pedidos":
        check_approval_rule(payload)
        
        # W03: Conversão de Venda (Status -> Aprovado)
        new_status = payload.get("status")
        old_status = old_data.get("status")
        
        if new_status == "Aprovado" and old_status != "Aprovado":
            process_conversion(record_id, payload, db, tenant_id)


# --- LOGIC IMPLEMENTATIONS ---

def check_approval_rule(payload: dict):
    # W01: Alçada
    # Condição: Fase == Oramento (Status Rascunho/Negociacao) E Desconto > 15% Total
    # Problema: Total_Itens é virtual. Payload pode não ter ele calculado se for input.
    # Mas se o frontend mandar... vamos confiar ou ignorar se não tiver.
    # Para MVP: Ignorar calculo complexo de itens aqui, usar campos diretos se existirem.
    
    status = payload.get("status")
    if status in ["Rascunho", "Em Negociacao"]:
        total = float(payload.get("total_itens", 0)) # Frontend must ensure this is sent or backend recalcs (complex)
        desconto = float(payload.get("valor_desconto", 0))
        
        if total > 0 and desconto > (0.15 * total):
            payload["status"] = "Aguardando Aprovação"
            # Poderia adicionar log ou notificação aqui


def process_conversion(pedido_id: str, payload: dict, db: Session, tenant_id: str):
    # W03: Baixar Estoque e Atualizar Cliente
    print(f"Processando Conversão de Venda: {pedido_id}")
    
    # 1. Buscar Itens do Pedido
    ent_itens_id = get_entity_id(db, tenant_id, "itens_pedido")
    if not ent_itens_id: return
    
    itens = db.query(data_models.EntityRecord).filter(
        data_models.EntityRecord.tenant_id == tenant_id,
        data_models.EntityRecord.entity_id == ent_itens_id
    ).all()
    
    # Filter in memory (JSONB filter is tricky without proper cast, and "itens_pedido" might be huge, 
    # but for demo it's fine. In prod use JSON contains/filter query)
    pedido_itens = [i for i in itens if i.data.get("pedido_ref") == pedido_id]
    
    for item in pedido_itens:
        prod_id = item.data.get("produto_ref")
        qtd = float(item.data.get("quantidade", 0))
        
        if prod_id and qtd > 0:
            prod_rec = get_record(db, tenant_id, "produtos", prod_id)
            if prod_rec:
                curr_est = float(prod_rec.data.get("estoque_atual", 0))
                new_est = max(0, curr_est - qtd)
                prod_rec.data["estoque_atual"] = new_est
                db.add(prod_rec) # Queue update
                
    # 2. Atualizar Cliente
    cliente_id = payload.get("cliente_ref")
    if cliente_id:
        cli_rec = get_record(db, tenant_id, "clientes", cliente_id)
        if cli_rec:
            cli_rec.data["data_ultima_compra"] = datetime.date.today().isoformat()
            db.add(cli_rec)
            
    db.commit() # Commit side effects immediately (or let session handle it, but better explicit here)
