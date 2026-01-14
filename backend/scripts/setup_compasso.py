import sys
import os
import json
import uuid
from datetime import datetime

# Adicionar root do backend ao path
sys.path.append('/app')

from app.shared.database import SessionSys as SessionLocal
from app.system.models import Tenant
from app.engine.metadata.models import MetaEntity, MetaField, MetaNavigationGroup, MetaPage, MetaSubPage
from app.engine.metadata import data_models

def run():
    print("Starting Compasso V1 Setup (Structure + Seed)...")
    db = SessionLocal()
    try:
        # 1. Tenant "Compasso Demo"
        tenant_name = "Compasso Demo"
        tenant = db.query(Tenant).filter_by(slug="compasso-demo").first()
        if not tenant:
            print(f"Creating Tenant: {tenant_name}")
            tenant = Tenant(name=tenant_name, slug="compasso-demo", status="active")
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
        else:
            print(f"Using Existing Tenant: {tenant.name} ({tenant.id})")
        
        tenant_id = tenant.id

        # 2. Cleanup - WIPE EVERYTHING FOR THIS TENANT
        print("Cleaning up old metadata...")
        db.query(MetaNavigationGroup).filter_by(tenant_id=tenant_id).delete()
        db.query(MetaEntity).filter_by(tenant_id=tenant_id).delete()
        # Clean Data (Entity Records) - Optional but good for reset
        db.query(data_models.EntityRecord).filter_by(tenant_id=tenant_id).delete()
        
        db.commit()
        print("Cleanup Complete.")

        # 3. Create Entities & Fields
        entities = {}

        def create_entity(name, slug, icon, fields_data):
            print(f"Creating Entity: {name}")
            ent = MetaEntity(tenant_id=tenant_id, slug=slug, display_name=name, icon=icon)
            db.add(ent); db.flush()
            entities[slug] = ent.id
            
            fields = []
            for f in fields_data:
                formula = f.get("formula")
                is_virtual = f.get("is_virtual", False)
                if formula: is_virtual = True

                mf = MetaField(
                    entity_id=ent.id,
                    name=f["name"],
                    label=f["label"],
                    field_type=f["type"],
                    is_required=f.get("required", False),
                    options=f.get("options"),
                    formula=formula,
                    is_virtual=is_virtual
                )
                fields.append(mf)
            db.add_all(fields)
            return ent

        # --- Entities Def ---
        # Same as before, just repeating for completeness of the file re-write
        
        # Fornecedores
        ent_forn = create_entity("Fornecedores", "fornecedores", "Truck", [
            {"name": "razao_social", "label": "Razão Social", "type": "text", "required": True},
            {"name": "cnpj", "label": "CNPJ", "type": "text"},
            {"name": "ativo", "label": "Ativo", "type": "boolean"},
            {"name": "contato_comercial", "label": "Contato Comercial", "type": "text"}
        ])

        # Produtos
        ent_prod = create_entity("Produtos", "produtos", "Package", [
            {"name": "nome", "label": "Nome", "type": "text", "required": True},
            {"name": "sku", "label": "SKU", "type": "text"},
            {"name": "fornecedor_ref", "label": "Fornecedor", "type": "lookup", "options": ["fornecedores"]}, 
            {"name": "preco_base", "label": "Preço Base", "type": "currency"},
            {"name": "custo", "label": "Custo", "type": "currency"},
            {"name": "estoque_atual", "label": "Estoque Atual", "type": "number"},
            {"name": "estoque_minimo", "label": "Estoque Mínimo", "type": "number"},
            {"name": "unidade_medida", "label": "Unidade", "type": "select", "options": ["UN", "KG", "M", "CX", "L", "PAR"]},
            {"name": "status_estoque", "label": "Status Estoque", "type": "text", "formula": "IF([estoque_atual] <= [estoque_minimo], 'Critico', 'Normal')"}
        ])

        # Regras Frete
        create_entity("Regras de Frete", "regras_frete", "Map", [
            {"name": "estado_uf", "label": "Estado (UF)", "type": "select", "options": ["SP", "RJ", "MG", "ES", "RS", "SC", "PR", "BA", "PE"]},
            {"name": "valor_pedido_minimo", "label": "Pedido Mínimo", "type": "currency"},
            {"name": "percentual_frete", "label": "% Frete", "type": "percent"}
        ])

        # Clientes
        ent_cli = create_entity("Clientes", "clientes", "Users", [
            {"name": "razao_social", "label": "Razão Social", "type": "text"},
            {"name": "nome_fantasia", "label": "Nome Fantasia", "type": "text", "required": True},
            {"name": "ramo_atividade", "label": "Ramo", "type": "select", "options": ["Marcenaria", "Revenda", "Construtora", "Arquiteto", "Consumidor Final"]},
            {"name": "status_cadastro", "label": "Status", "type": "select", "options": ["Prospect", "Ativo", "Bloqueado Financeiro", "Inativo"]},
            {"name": "data_ultima_compra", "label": "Última Compra", "type": "date"},
            {"name": "dias_sem_compra", "label": "Dias s/ Compra", "type": "number", "formula": "TODAY() - [data_ultima_compra]"}
        ])

        # Pedidos
        ent_ped = create_entity("Pedidos", "pedidos", "ShoppingCart", [
            {"name": "numero_controle", "label": "Nº Controle", "type": "text"},
            {"name": "cliente_ref", "label": "Cliente", "type": "lookup", "options": ["clientes"]},
            {"name": "data_criacao", "label": "Data Criação", "type": "date"},
            {"name": "status", "label": "Status", "type": "select", "options": ["Rascunho", "Em Negociacao", "Aguardando Aprovação", "Aprovado", "Em Separação", "Faturado", "Em Rota", "Entregue", "Devolvido", "Cancelado"]},
            {"name": "condicao_pagamento", "label": "Pagamento", "type": "select", "options": ["À Vista", "30 Dias", "30/60 Dias", "30/60/90 Dias"]},
            {"name": "validade_orcamento", "label": "Validade", "type": "date"},
            {"name": "valor_desconto", "label": "Desconto", "type": "currency"},
            {"name": "total_itens", "label": "Total Itens", "type": "currency", "formula": "SUM_RELATION(itens_pedido, subtotal)"},
            {"name": "total_final", "label": "Total Final", "type": "currency", "formula": "[total_itens] - [valor_desconto]"},
            {"name": "fase_funil", "label": "Fase", "type": "text", "formula": "IF([status] in ['Rascunho', 'Em Negociacao'], 'Orcamento', 'Venda')"}
        ])

        # Itens Pedido
        ent_itens = create_entity("Itens do Pedido", "itens_pedido", "List", [
            {"name": "pedido_ref", "label": "Pedido", "type": "lookup", "options": ["pedidos"]},
            {"name": "produto_ref", "label": "Produto", "type": "lookup", "options": ["produtos"]},
            {"name": "quantidade", "label": "Qtd", "type": "number"},
            {"name": "preco_praticado", "label": "Preço", "type": "currency"},
            {"name": "subtotal", "label": "Subtotal", "type": "currency", "formula": "[quantidade] * [preco_praticado]"}
        ])

        # Campanhas
        create_entity("Campanhas", "campanhas", "Megaphone", [
            {"name": "nome_campanha", "label": "Campanha", "type": "text", "required": True},
            {"name": "data_inicio", "label": "Início", "type": "date"},
            {"name": "data_fim", "label": "Fim", "type": "date"},
            {"name": "valor_desconto", "label": "Valor", "type": "number"},
            {"name": "ativa_hoje", "label": "Ativa", "type": "boolean", "formula": "TODAY() >= [data_inicio] AND TODAY() <= [data_fim]"}
        ])

        # Interacoes
        create_entity("Interações", "interacoes", "MessageSquare", [
            {"name": "cliente_ref", "label": "Cliente", "type": "lookup", "options": ["clientes"]},
            {"name": "data_hora", "label": "Data/Hora", "type": "datetime"},
            {"name": "tipo", "label": "Tipo", "type": "select", "options": ["Visita Presencial", "Ligação", "WhatsApp", "Email"]},
            {"name": "resumo", "label": "Resumo", "type": "longtext"}
        ])
        
        # Tarefas
        create_entity("Tarefas", "tarefas", "CheckCircle", [
            {"name": "titulo", "label": "Título", "type": "text", "required": True},
            {"name": "status", "label": "Status", "type": "select", "options": ["Pendente", "Concluído"]}
        ])

        db.flush()

        # 4. Create Navigation & Subpages
        
        def create_page(group_id, name, entity_slug, filter_dict=None):
            ent_id = entities[entity_slug]
            config = {}
            if filter_dict:
                config["permanent_filters"] = filter_dict
            
            page = MetaPage(group_id=group_id, entity_id=ent_id, name=name, type="list", layout_config=config)
            db.add(page); db.flush()
            
            sp_360 = MetaSubPage(page_id=page.id, name="Ficha 360", type="ficha_360", order=0)
            sp_form = MetaSubPage(page_id=page.id, name="Novo " + name[:-1], type="form", order=1)
            db.add_all([sp_360, sp_form]); db.flush()
            
            page.default_detail_subpage_id = sp_360.id
            page.default_form_subpage_id = sp_form.id
            db.add(page)
            return page

        # G1: Vendas
        g_vendas = MetaNavigationGroup(tenant_id=tenant_id, name="Vendas", order=0, icon="DollarSign")
        db.add(g_vendas); db.flush()
        create_page(g_vendas.id, "Orçamentos", "pedidos", {"status": ["Rascunho", "Em Negociacao", "Aguardando Aprovação"]})
        create_page(g_vendas.id, "Pedidos e Entregas", "pedidos", {"status": ["Aprovado", "Em Separação", "Faturado", "Em Rota", "Entregue"]})
        create_page(g_vendas.id, "Clientes", "clientes")

        # G2: Catálogo
        g_catalogo = MetaNavigationGroup(tenant_id=tenant_id, name="Catálogo", order=1, icon="Book")
        db.add(g_catalogo); db.flush()
        create_page(g_catalogo.id, "Produtos", "produtos")
        create_page(g_catalogo.id, "Fornecedores", "fornecedores")
        create_page(g_catalogo.id, "Campanhas", "campanhas")

        # G3: Produtividade
        g_prod = MetaNavigationGroup(tenant_id=tenant_id, name="Produtividade", order=2, icon="CheckSquare")
        db.add(g_prod); db.flush()
        create_page(g_prod.id, "Minhas Tarefas", "tarefas")
        create_page(g_prod.id, "Histórico", "interacoes")

        db.commit()


        # ==========================================
        # 5. SEED DATA (POVOAMENTO)
        # ==========================================
        print("Seeding Data...")

        def add_record(slug, data):
            rec = data_models.EntityRecord(
                tenant_id=tenant_id,
                entity_id=entities[slug],
                data=data
            )
            db.add(rec)
            db.commit() # Commit each to get ID and ensure seq
            return str(rec.id)

        # -- Fornecedores --
        f1_id = add_record("fornecedores", {"razao_social": "Madeireira Silva Ltda", "cnpj": "12.345.678/0001-90", "ativo": True, "contato_comercial": "Sr. Silva"})
        f2_id = add_record("fornecedores", {"razao_social": "Ferragens Top S.A.", "cnpj": "98.765.432/0001-10", "ativo": True, "contato_comercial": "Marcos"})

        # -- Produtos --
        p1_id = add_record("produtos", {
            "nome": "MDF Branco 15mm (Placa)", "sku": "MDF-B-15", 
            "fornecedor_ref": f1_id, "preco_base": 150.00, "custo": 100.00, 
            "estoque_atual": 50, "estoque_minimo": 10, "unidade_medida": "UN"
        })
        p2_id = add_record("produtos", {
            "nome": "Corrediça Telescópica 40cm", "sku": "COR-40", 
            "fornecedor_ref": f2_id, "preco_base": 25.00, "custo": 12.00, 
            "estoque_atual": 200, "estoque_minimo": 50, "unidade_medida": "PAR"
        })
        p3_id = add_record("produtos", {
            "nome": "Dobradiça Curva", "sku": "DOB-C", 
            "fornecedor_ref": f2_id, "preco_base": 5.00, "custo": 2.50, 
            "estoque_atual": 500, "estoque_minimo": 100, "unidade_medida": "UN"
        })

        # -- Clientes --
        c1_id = add_record("clientes", {
            "nome_fantasia": "Marcenaria do Zé", "razao_social": "José Santos ME", 
            "ramo_atividade": "Marcenaria", "status_cadastro": "Ativo", "data_ultima_compra": "2023-12-01"
        })
        c2_id = add_record("clientes", {
            "nome_fantasia": "Construtora Build", "razao_social": "Build Eng.", 
            "ramo_atividade": "Construtora", "status_cadastro": "Prospect"
        })

        # -- Pedidos --
        
        # Pedido 1: Rascunho, Zé
        ped1_id = add_record("pedidos", {
            "numero_controle": "PED-001", "cliente_ref": c1_id, "data_criacao": datetime.now().isoformat(),
            "status": "Rascunho", "condicao_pagamento": "30 Dias", "valor_desconto": 0
        })
        
        # Itens Pedido 1
        add_record("itens_pedido", {"pedido_ref": ped1_id, "produto_ref": p1_id, "quantidade": 5, "preco_praticado": 150.00, "subtotal": 750.00})
        add_record("itens_pedido", {"pedido_ref": ped1_id, "produto_ref": p2_id, "quantidade": 10, "preco_praticado": 25.00, "subtotal": 250.00})

        # Update totals manually (hooks handle logic if integrated, but here we enforce initial state or depend on system calc)
        # Assuming hooks run? NO, data access layer hooks run on API, not direct DB session insert here unless we call hook.
        # But for seed, data is static.

        # Pedido 2: Aprovado (History)
        ped2_id = add_record("pedidos", {
            "numero_controle": "PED-000", "cliente_ref": c1_id, "data_criacao": "2023-12-01",
            "status": "Aprovado", "condicao_pagamento": "À Vista", "valor_desconto": 50
        })

        print("Compasso V1 Setup + Seed Completed Successfully.")

    except Exception as e:
        db.rollback()
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run()
