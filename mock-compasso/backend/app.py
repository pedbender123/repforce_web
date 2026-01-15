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
# MODELS
# -------------------------------------------------------------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    role = db.Column(db.String(20)) 
    password = db.Column(db.String(100))
    username = db.Column(db.String(50), unique=True)

class Supplier(db.Model):
    __tablename__ = 'suppliers'
    id = db.Column(db.Integer, primary_key=True)
    razao_social = db.Column(db.String(150))
    cnpj = db.Column(db.String(20))
    logo_url = db.Column(db.String(255))
    active = db.Column(db.Boolean, default=True)

class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True)
    razao_social = db.Column(db.String(150))
    fantasy_name = db.Column(db.String(150))
    cnpj = db.Column(db.String(20))
    activity_branch = db.Column(db.String(50)) 
    address_full = db.Column(db.String(255))
    status = db.Column(db.String(20), default='Ativo') 
    abc_class = db.Column(db.String(1), default='C') 
    last_purchase_date = db.Column(db.DateTime, nullable=True)
    credit_limit = db.Column(db.Float, default=10000.0)
    credit_used = db.Column(db.Float, default=0.0)
    
    def to_dict(self):
        days_since = (datetime.now() - self.last_purchase_date).days if self.last_purchase_date else None
        return {
            'id': self.id, 'razao_social': self.razao_social, 'fantasy_name': self.fantasy_name,
            'cnpj': self.cnpj, 'activity_branch': self.activity_branch, 'address': self.address_full,
            'status': self.status, 'abc_class': self.abc_class, 'days_since_purchase': days_since,
            'credit_limit': self.credit_limit, 'credit_used': self.credit_used
        }

class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150))
    sku = db.Column(db.String(50))
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'))
    price_base = db.Column(db.Float) # Current price (with discounts)
    price_original = db.Column(db.Float) # Original price (to prevent compounding)
    cost = db.Column(db.Float)
    stock_current = db.Column(db.Integer, default=0)
    stock_min = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(255))
    unit = db.Column(db.String(10), default='UN')
    group = db.Column(db.String(50)) 
    details = db.Column(db.Text)

    supplier = db.relationship('Supplier')

    def to_dict(self):
        stock_status = 'Crítico' if self.stock_current <= self.stock_min else 'Normal'
        return {
            'id': self.id, 'name': self.name, 'sku': self.sku,
            'supplier_name': self.supplier.razao_social if self.supplier else 'N/A',
            'price': self.price_base, 'price_original': self.price_original,
            'cost': self.cost, 'stock': self.stock_current, 'stock_status': stock_status,
            'unit': self.unit, 'image': self.image_url, 'group': self.group, 'details': self.details
        }

class Campaign(db.Model):
    __tablename__ = 'campaigns'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    discount_value = db.Column(db.Float)
    target_products = db.Column(db.String(255)) # Store as comma-separated IDs "1,2,3"

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    control_number = db.Column(db.String(20))
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'))
    created_at = db.Column(db.DateTime, default=datetime.now)
    status = db.Column(db.String(30), default='Faturado') 
    total_final = db.Column(db.Float, default=0.0)

    client = db.relationship('Client')
    items = db.relationship('OrderItem', backref='order', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id, 'control_number': self.control_number,
            'client_name': self.client.razao_social if self.client else 'Consumidor Final',
            'created_at': self.created_at.isoformat(),
            'status': self.status, 'total_final': self.total_final
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
    status = db.Column(db.String(20), default='Pendente')

    def to_dict(self):
        return {'id': self.id, 'title': self.title, 'status': self.status}

# -------------------------------------------------------------------
# ROUTES
# -------------------------------------------------------------------

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    u, p = data.get('username'), data.get('password')
    user = User.query.filter_by(username=u).first()
    if user and user.password == p:
        return jsonify({'token': f'tk-{user.id}', 'user': {'name': user.name, 'role': user.role}})
    if u == 'compasso' and p == '123456': # Fallback demo
        return jsonify({'token': 'tk-demo', 'user': {'name': 'Compasso Demo', 'role': 'admin'}})
    return jsonify({'error': 'Invalid'}), 401

@app.route('/api/users', methods=['GET', 'POST'])
def manage_users():
    if request.method == 'POST':
        data = request.json
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Faltam dados'}), 400
        new_user = User(
            name=data.get('name'), email=data.get('email'),
            role=data.get('role', 'vendedor'), password=data.get('password'),
            username=data.get('username')
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'success': True, 'id': new_user.id}), 201
    return jsonify([{'id': u.id, 'name': u.name, 'email': u.email, 'role': u.role, 'username': u.username} for u in User.query.all()])

@app.route('/api/users/<int:id>', methods=['PUT', 'DELETE'])
def manage_user_item(id):
    user = User.query.get_or_404(id)
    if request.method == 'DELETE':
        db.session.delete(user)
        db.session.commit()
        return jsonify({'success': True})
    if request.method == 'PUT':
        data = request.json
        user.name = data.get('name', user.name)
        user.email = data.get('email', user.email)
        user.role = data.get('role', user.role)
        if data.get('password'):
            user.password = data.get('password')
        db.session.commit()
        return jsonify({'success': True})

@app.route('/api/clients', methods=['GET', 'POST'])
def manage_clients():
    if request.method == 'POST':
        data = request.json
        new_client = Client(
            razao_social=data.get('razao_social'),
            fantasy_name=data.get('fantasy_name', data.get('razao_social')),
            cnpj=data.get('cnpj'),
            activity_branch=data.get('activity_branch', 'Geral'),
            address_full=data.get('address_full', 'Endereço não informado'),
            abc_class=data.get('abc_class', 'C'),
            credit_limit=float(data.get('credit_limit', 10000.0)),
            status='Ativo'
        )
        db.session.add(new_client)
        db.session.commit()
        return jsonify({'success': True, 'id': new_client.id}), 201
    return jsonify([c.to_dict() for c in Client.query.all()])

@app.route('/api/clients/<int:id>', methods=['PUT', 'DELETE'])
def manage_client_item(id):
    client = Client.query.get_or_404(id)
    if request.method == 'DELETE':
        db.session.delete(client)
        db.session.commit()
        return jsonify({'success': True})
    if request.method == 'PUT':
        data = request.json
        client.razao_social = data.get('razao_social', client.razao_social)
        client.fantasy_name = data.get('fantasy_name', client.fantasy_name)
        client.cnpj = data.get('cnpj', client.cnpj)
        client.activity_branch = data.get('activity_branch', client.activity_branch)
        client.address_full = data.get('address_full', client.address_full)
        client.abc_class = data.get('abc_class', client.abc_class)
        client.credit_limit = float(data.get('credit_limit', client.credit_limit))
        db.session.commit()
        return jsonify({'success': True})

@app.route('/api/products', methods=['GET'])
def get_products():
    return jsonify([p.to_dict() for p in Product.query.all()])

@app.route('/api/products/<int:id>', methods=['PUT', 'DELETE'])
def manage_product_item(id):
    product = Product.query.get_or_404(id)
    if request.method == 'DELETE':
        db.session.delete(product)
        db.session.commit()
        return jsonify({'success': True})
    if request.method == 'PUT':
        data = request.json
        product.name = data.get('name', product.name)
        product.sku = data.get('sku', product.sku)
        product.price_base = float(data.get('price', product.price_base))
        product.price_original = float(data.get('price_original', product.price_original))
        product.stock_current = int(data.get('stock', product.stock_current))
        db.session.commit()
        return jsonify({'success': True})

@app.route('/api/orders', methods=['GET', 'POST'])
def manage_orders():
    if request.method == 'POST':
        try:
            data = request.json or {}
            items_data = data.get('items', [])
            total = float(data.get('total', 0))
            status = data.get('status', 'Faturado')
            client_id = data.get('client_id')
            
            new_order = Order(
                client_id=int(client_id) if client_id else None,
                total_final=total,
                status=status,
                control_number=f"{'ORC' if status == 'Rascunho' else 'PED'}-{datetime.now().strftime('%H%M%S')}"
            )
            db.session.add(new_order)
            db.session.flush()

            for it in items_data:
                prod = Product.query.get(it.get('product_id'))
                if prod:
                    qty = int(it.get('qty', 0))
                    if status != 'Rascunho':
                        prod.stock_current = max(0, prod.stock_current - qty)
                    
                    db.session.add(OrderItem(
                        order_id=new_order.id,
                        product_id=prod.id,
                        qty=qty,
                        price_practiced=prod.price_base or prod.price_original or 0,
                        subtotal=qty * (prod.price_base or prod.price_original or 0)
                    ))
            
            db.session.commit()
            return jsonify(new_order.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
            
    # GET ALL
    return jsonify([o.to_dict() for o in Order.query.all()])

@app.route('/api/orders/<int:id>', methods=['PUT', 'DELETE'])
def manage_order_item(id):
    order = Order.query.get_or_404(id)
    if request.method == 'DELETE':
        db.session.delete(order)
        db.session.commit()
        return jsonify({'success': True})
    
    if request.method == 'PUT':
        data = request.json or {}
        new_status = data.get('status')
        if order.status == 'Rascunho' and new_status == 'Faturado':
            for item in order.items:
                prod = item.product
                if prod:
                    prod.stock_current = max(0, prod.stock_current - item.qty)
            order.status = 'Faturado'
            if order.control_number.startswith('ORC'):
                 order.control_number = f"PED-{datetime.now().strftime('%H%M%S')}"
        elif new_status:
            order.status = new_status
        db.session.commit()
        return jsonify(order.to_dict())

@app.route('/api/campaigns', methods=['GET', 'POST'])
def manage_campaigns():
    if request.method == 'POST':
        try:
            data = request.json or {}
            discount_pct = float(data.get('discount', 0)) / 100.0
            product_ids = [int(x) for x in data.get('products', [])]
            
            target_prods = Product.query.filter(Product.id.in_(product_ids)).all()
            for p in target_prods:
                if not p.price_original:
                    p.price_original = p.price_base
                p.price_base = round(p.price_original * (1.0 - discount_pct), 2)
            
            new_camp = Campaign(
                name=data.get('name'),
                discount_value=float(data.get('discount', 0)),
                target_products=",".join(map(str, product_ids))
            )
            db.session.add(new_camp)
            db.session.commit()
            return jsonify({'success': True}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
            
    return jsonify([{'id': c.id, 'name': c.name, 'discount': c.discount_value, 'products': c.target_products} for c in Campaign.query.all()])

@app.route('/api/campaigns/<int:id>', methods=['DELETE'])
def delete_campaign(id):
    camp = Campaign.query.get_or_404(id)
    try:
        p_ids = [int(x) for x in camp.target_products.split(',') if x]
        target_prods = Product.query.filter(Product.id.in_(p_ids)).all()
        for p in target_prods:
            if p.price_original:
                p.price_base = p.price_original
        db.session.delete(camp)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/tasks', methods=['GET', 'POST'])
def manage_tasks():
    if request.method == 'POST':
        try:
            data = request.json or {}
            new_task = Task(title=data.get('title', 'Sem título'))
            db.session.add(new_task)
            db.session.commit()
            return jsonify(new_task.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
    return jsonify([t.to_dict() for t in Task.query.all()])

@app.route('/api/tasks/<int:id>', methods=['PUT', 'DELETE'])
def manage_task_item(id):
    task = Task.query.get_or_404(id)
    if request.method == 'DELETE':
        db.session.delete(task)
        db.session.commit()
        return jsonify({'success': True})
    if request.method == 'PUT':
        data = request.json or {}
        if 'status' in data: task.status = data.get('status')
        if 'title' in data: task.title = data.get('title')
        db.session.commit()
        return jsonify(task.to_dict())

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000, host='0.0.0.0')

