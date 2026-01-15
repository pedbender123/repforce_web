from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Database Config - SQLite
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(BASE_DIR, 'repforce.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# -------------------------------------------------------------------
# MODELS (Compasso V1 Structure)
# -------------------------------------------------------------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    role = db.Column(db.String(20)) # admin, vendedor, gerente
    password = db.Column(db.String(100))
    username = db.Column(db.String(50)) # Added username field

class Supplier(db.Model):
    __tablename__ = 'suppliers'
    id = db.Column(db.Integer, primary_key=True)
    razao_social = db.Column(db.String(150))
    cnpj = db.Column(db.String(20))
    logo_url = db.Column(db.String(255))
    active = db.Column(db.Boolean, default=True)
    contact_info = db.Column(db.String(255))

class FreightRule(db.Model):
    __tablename__ = 'freight_rules'
    id = db.Column(db.Integer, primary_key=True)
    state_uf = db.Column(db.String(2))
    min_order_value = db.Column(db.Float)
    freight_percent = db.Column(db.Float)

class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True)
    razao_social = db.Column(db.String(150))
    fantasy_name = db.Column(db.String(150))
    cnpj = db.Column(db.String(20))
    activity_branch = db.Column(db.String(50)) 
    address_full = db.Column(db.String(255))
    status = db.Column(db.String(20)) 
    abc_class = db.Column(db.String(1)) 
    last_purchase_date = db.Column(db.DateTime, nullable=True)
    
    credit_limit = db.Column(db.Float, default=10000.0)
    credit_used = db.Column(db.Float, default=0.0)
    
    def to_dict(self):
        days_since = (datetime.now() - self.last_purchase_date).days if self.last_purchase_date else None
        return {
            'id': self.id,
            'razao_social': self.razao_social,
            'fantasy_name': self.fantasy_name,
            'cnpj': self.cnpj,
            'segment': self.activity_branch,
            'activity_branch': self.activity_branch,
            'address': self.address_full,
            'status': self.status,
            'abc_class': self.abc_class,
            'days_since_purchase': days_since,
            'credit_limit': self.credit_limit,
            'credit_used': self.credit_used
        }

class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150))
    sku = db.Column(db.String(50))
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'))
    price_base = db.Column(db.Float)
    cost = db.Column(db.Float)
    stock_current = db.Column(db.Integer)
    stock_min = db.Column(db.Integer)
    image_url = db.Column(db.String(255))
    unit = db.Column(db.String(10))
    group = db.Column(db.String(50)) 
    details = db.Column(db.Text)

    supplier = db.relationship('Supplier')

    def to_dict(self):
        stock_status = 'Crítico' if self.stock_current <= self.stock_min else 'Normal'
        return {
            'id': self.id, 'name': self.name, 'sku': self.sku,
            'supplier_name': self.supplier.razao_social if self.supplier else '',
            'price': self.price_base, 'cost': self.cost,
            'stock': self.stock_current, 'stock_status': stock_status,
            'unit': self.unit, 'image': self.image_url, 'group': self.group,
            'details': self.details
        }

class Campaign(db.Model):
    __tablename__ = 'campaigns'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    discount_type = db.Column(db.String(20))
    value = db.Column(db.Float)
    target_type = db.Column(db.String(20))
    target_value = db.Column(db.String(100))

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    control_number = db.Column(db.String(20))
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'))
    created_at = db.Column(db.DateTime, default=datetime.now)
    status = db.Column(db.String(30)) 
    payment_condition = db.Column(db.String(50))
    validity = db.Column(db.DateTime)
    discount_value = db.Column(db.Float, default=0.0)
    link_nf = db.Column(db.String(255))
    
    total_items = db.Column(db.Float, default=0.0)
    total_final = db.Column(db.Float, default=0.0)

    client = db.relationship('Client')
    items = db.relationship('OrderItem', backref='order', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id, 'control_number': self.control_number,
            'client_name': self.client.razao_social if self.client else '',
            'created_at': self.created_at.isoformat(),
            'status': self.status,
            'total_final': self.total_final,
            'fase_funil': 'Orcamento' if self.status in ['Rascunho', 'Em Negociacao', 'Aguardando Aprovação'] else 'Venda'
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'))
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    qty = db.Column(db.Integer)
    price_practiced = db.Column(db.Float)
    subtotal = db.Column(db.Float)
    
    product = db.relationship('Product')

class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255))
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=True) # made nullable
    priority = db.Column(db.String(20))
    deadline = db.Column(db.DateTime)
    status = db.Column(db.String(20))

    client = db.relationship('Client')

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title,
            'client_name': self.client.razao_social if self.client else 'Geral',
            'priority': self.priority,
            'status': self.status,
            'deadline': self.deadline.strftime('%d/%m') if self.deadline else ''
        }

# -------------------------------------------------------------------
# ROUTES
# -------------------------------------------------------------------

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    u = data.get('username')
    p = data.get('password')
    # Simple hardcoded check first or db check
    user = User.query.filter_by(username=u).first()
    if user:
         # In real app compare hash, here plain for requested "0 segurança"
         if user.password == p:
             return jsonify({'token': f'tk-{user.id}', 'user': {'name': user.name, 'role': user.role}})
    
    if u == 'compasso' and p == '123456':
         return jsonify({'token': 'tk-demo', 'user': {'name': 'Compasso Demo', 'role': 'admin'}})
    if u == 'admin' and p == '123':
        return jsonify({'token': 'tk-admin', 'user': {'name': 'Admin', 'role': 'admin'}})
    return jsonify({'error': 'Invalid'}), 401

@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    if not users:
        # Return mocks if empty
        return jsonify([
            {'id': 1, 'name': 'Compasso Demo', 'role': 'admin', 'email': 'demo@compasso.com', 'username': 'compasso'},
            {'id': 2, 'name': 'Pedro Vendedor', 'role': 'vendedor', 'email': 'pedro@repforce.com', 'username': 'pedro'}
        ])
    return jsonify([{
        'id': u.id, 'name': u.name, 'email': u.email, 'role': u.role, 'username': u.username
    } for u in users])

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    new_user = User(
        name=data.get('name'),
        email=data.get('email'),
        role=data.get('role', 'vendedor'),
        password=data.get('password'),
        username=data.get('username') # Added username
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'success': True, 'id': new_user.id}), 201

@app.route('/api/roles', methods=['GET'])
def get_roles():
    return jsonify([
        {'id': 'admin', 'name': 'Administrador'},
        {'id': 'vendedor', 'name': 'Vendedor Externo'},
        {'id': 'gerente', 'name': 'Gerente Comercial'}
    ])

# --- CRUDs ---

@app.route('/api/clients', methods=['GET'])
def get_clients():
    return jsonify([c.to_dict() for c in Client.query.all()])

@app.route('/api/clients', methods=['POST']) # Added boilerplate for copy paste module
def create_client():
    # Placeholder for MVP compatibility with "Orders/Quotes" style
    return jsonify({'success': True}), 201

@app.route('/api/products', methods=['GET'])
def get_products():
    return jsonify([p.to_dict() for p in Product.query.all()])

@app.route('/api/orders', methods=['GET'])
def get_orders():
    return jsonify([o.to_dict() for o in Order.query.all()])

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json
    client = Client.query.get(data.get('client_id')) if data.get('client_id') else None
    new_order = Order(
        client_id=client.id if client else None,
        status=data.get('status', 'Rascunho'),
        total_final=float(data.get('total', 0.0)),
        control_number=f"PED-{datetime.now().strftime('%H%M%S')}",
        created_at=datetime.now()
    )
    db.session.add(new_order)
    db.session.commit()
    return jsonify(new_order.to_dict()), 201

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    return jsonify([t.to_dict() for t in Task.query.all()])

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.json
    new_task = Task(
        title=data.get('title'),
        priority='Normal',
        status='Pendente',
        deadline=datetime.now() + timedelta(days=7)
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify(new_task.to_dict()), 201

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    total_sales = db.session.query(db.func.sum(Order.total_final)).filter(Order.status == 'Faturado').scalar() or 0
    return jsonify({
        'sales_today': 15000, 
        'total_sales_month': total_sales,
        'new_clients': 12
    })

@app.route('/api/campaigns', methods=['GET'])
def get_campaigns():
    return jsonify([{
        'id': c.id, 'name': c.name, 'discount': c.value, 'target': c.target_value
    } for c in Campaign.query.all()])

@app.route('/api/campaigns', methods=['POST'])
def create_campaign():
    data = request.json
    new_camp = Campaign(
        name=data.get('name'),
        discount_type='Percentual',
        value=float(data.get('discount', 0)),
        target_type='PRODUTO', 
        target_value=str(data.get('products', []))
    )
    db.session.add(new_camp)
    
    # APPLY DISCOUNT LOGIC
    product_ids = data.get('products', []) 
    discount_pct = float(data.get('discount', 0)) / 100.0
    
    if product_ids:
        products = Product.query.filter(Product.id.in_(product_ids)).all()
        for p in products:
            if p.price_base:
                p.price_base = p.price_base * (1.0 - discount_pct)
            
    db.session.commit()
    return jsonify({'success': True}), 201

@app.cli.command("seed_db")
def seed_db_cmd():
    db.create_all()
    print("Tables created.")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
