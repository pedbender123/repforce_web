from app import app, db, User, Supplier, Client, Product, Campaign, Order, OrderItem, Task
import datetime

def run_seed():
    with app.app_context():
        print("Resetting DB...")
        db.drop_all()
        db.create_all()
        
        # Suppliers
        s1 = Supplier(razao_social="Indústria Portinari", cnpj="55.555.555/0001-55", active=True, contact_info="comercial@portinari.com.br")
        s2 = Supplier(razao_social="Suvinil Basf", cnpj="66.666.666/0001-66", active=True, contact_info="vendas@suvinil.com.br")
        s3 = Supplier(razao_social="Votorantim Cimentos", cnpj="77.777.777/0001-77", active=True, contact_info="pedidos@votoran.com.br")
        db.session.add_all([s1, s2, s3])
        db.session.commit() # Commit to get IDs

        # Clients
        c1 = Client(razao_social="Construtora Silva & Filhos", fantasy_name="Silva Construções", cnpj="00.000.000/0001-91", activity_branch="Construtora", address_full="Av. Paulista, 1000 - SP", status="Ativo", abc_class="A", last_purchase_date=datetime.datetime.now() - datetime.timedelta(days=2))
        c2 = Client(razao_social="Mercadinho do Bairro Ltda", fantasy_name="Mercadinho", cnpj="11.111.111/0001-11", activity_branch="Revenda", address_full="Rua das Flores, 123 - SP", status="Ativo", abc_class="B", last_purchase_date=datetime.datetime.now() - datetime.timedelta(days=15))
        c3 = Client(razao_social="Empreiteira Global SA", fantasy_name="Global Obras", cnpj="22.222.222/0001-22", activity_branch="Construtora", address_full="Rodovia BR 101, Km 50", status="Prospect", abc_class="C", last_purchase_date=None)
        db.session.add_all([c1, c2, c3])
        db.session.commit()

        # Products
        p1 = Product(name="Porcelanato 80x80 Polido", sku="PIS01", supplier_id=s1.id, price_base=120.00, cost=80.00, stock_current=500, stock_min=100, unit="M2", group="Acabamento", details="Alta resistência.")
        p2 = Product(name="Tinta Acrílica Fosca 18L", sku="TIN01", supplier_id=s2.id, price_base=350.00, cost=220.00, stock_current=50, stock_min=80, unit="L", group="Pintura", details="Branco Neve.")
        p3 = Product(name="Cimento CP II 50kg", sku="CIM01", supplier_id=s3.id, price_base=35.00, cost=25.00, stock_current=1000, stock_min=200, unit="SC", group="Básico", details="Uso geral.")
        p4 = Product(name="Argamassa ACIII 20kg", sku="ARG01", supplier_id=s3.id, price_base=45.90, cost=30.00, stock_current=300, stock_min=50, unit="SC", group="Básico", details="Interno e Externo.")
        db.session.add_all([p1, p2, p3, p4])
        db.session.commit()

        # Campaigns
        camp1 = Campaign(name="Oferta Acabamento", start_date=datetime.datetime.now(), end_date=datetime.datetime.now()+datetime.timedelta(days=30), discount_type="Percentual", value=15, target_type="GRUPO", target_value="Acabamento")
        db.session.add(camp1)

        # Orders (Quotes & Sales)
        # 1. Quote in Negotiation
        o1 = Order(control_number="Q-001", client_id=c1.id, status="Em Negociacao", payment_condition="30/60 Dias", validity=datetime.datetime.now()+datetime.timedelta(days=7), discount_value=0.0)
        db.session.add(o1)
        db.session.commit()
        oi1 = OrderItem(order_id=o1.id, product_id=p1.id, qty=100, price_practiced=120.00, subtotal=12000.0)
        db.session.add(oi1)
        
        # 2. Approved Sale
        o2 = Order(control_number="PED-102", client_id=c2.id, status="Faturado", payment_condition="À Vista", validity=datetime.datetime.now(), discount_value=50.0)
        db.session.add(o2)
        db.session.commit()
        oi2 = OrderItem(order_id=o2.id, product_id=p3.id, qty=10, price_practiced=35.00, subtotal=350.0)
        db.session.add(oi2)

        # Tasks
        t1 = Task(title="Ligar para cobrar orçamento Q-001", client_id=c1.id, priority="Alta", status="Pendente", deadline=datetime.datetime.now()+datetime.timedelta(days=1))
        t2 = Task(title="Visita de relacionamento", client_id=c3.id, priority="Média", status="Em Andamento", deadline=datetime.datetime.now()+datetime.timedelta(days=5))
        db.session.add_all([t1, t2])

        db.session.commit()
        
        # Calculate totals
        # Mocking the calculation calls found in automation logic to ensure consistent DB state
        # (Simplified for seed)
        o1.total_items = 12000.0; o1.total_final = 12000.0
        o2.total_items = 350.0; o2.total_final = 300.0
        db.session.commit()

        print("Seeded V1 Data")

if __name__ == '__main__':
    run_seed()
