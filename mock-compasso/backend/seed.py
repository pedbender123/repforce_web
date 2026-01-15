from app import app, db, User, Supplier, Client, Product, Campaign, Order, OrderItem, Task
from datetime import datetime, timedelta

def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # Users
        admin = User(name='Admin Logística', email='admin@repmoveis.com', username='compasso', password='123', role='admin')
        vendedor = User(name='Ricardo Vendas', email='ricardo@repmoveis.com', username='ricardo', password='123', role='vendedor')
        db.session.add_all([admin, vendedor])

        # Suppliers (Furniture Factories)
        s1 = Supplier(razao_social='Móveis Premium S/A', cnpj='12.345.678/0001-90', active=True)
        s2 = Supplier(razao_social='Estofados Soft Conforto', cnpj='98.765.432/0001-11', active=True)
        s3 = Supplier(razao_social='Madeira de Lei Indústria', cnpj='44.333.222/0001-44', active=True)
        db.session.add_all([s1, s2, s3])
        db.session.commit()

        # Clients (Furniture Stores / Decor)
        c1 = Client(razao_social='Casa & Design Interiores', cnpj='11.111.111/0001-11', last_purchase_date=datetime.now() - timedelta(days=2))
        c2 = Client(razao_social='Mega Loja do Sofá', cnpj='22.222.222/0001-22', last_purchase_date=datetime.now() - timedelta(days=15))
        c3 = Client(razao_social='Shopping dos Móveis', cnpj='33.333.333/0001-33', last_purchase_date=datetime.now() - timedelta(days=45))
        db.session.add_all([c1, c2, c3])

        # Products (Furniture)
        p1 = Product(name='Sofá Retrátil 3 Lugares Cinza', sku='SOF-001', supplier_id=s2.id, price_base=2490.0, price_original=2490.0, cost=1200.0, stock_current=20, stock_min=5, unit='UN', group='Salas')
        p2 = Product(name='Mesa de Jantar 6 Cadeiras Madeira', sku='MES-992', supplier_id=s1.id, price_base=3850.0, price_original=3850.0, cost=1800.0, stock_current=8, stock_min=3, unit='JG', group='Copa/Cozinha')
        p3 = Product(name='Guarda-Roupa Casal 6 Portas', sku='GDR-020', supplier_id=s1.id, price_base=1750.0, price_original=1750.0, cost=900.0, stock_current=15, stock_min=2, unit='UN', group='Quartos')
        p4 = Product(name='Poltrona Decorativa Veludo', sku='POL-005', supplier_id=s2.id, price_base=890.0, price_original=890.0, cost=400.0, stock_current=4, stock_min=10, unit='UN', group='Decoração')
        db.session.add_all([p1, p2, p3, p4])

        # Tasks
        t1 = Task(title='Confirmar entrega Casa & Design')
        t2 = Task(title='Enviar catálogo novo para Shopping dos Móveis')
        db.session.add_all([t1, t2])

        db.session.commit()
        print("✓ Database Seeded Correctly (Furniture Context)!")

if __name__ == '__main__':
    seed()
