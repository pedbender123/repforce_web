BEGIN;

SET search_path TO tenant_1;

CREATE TABLE tenant_1.alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> 00896204b438

CREATE TABLE clients (
    id SERIAL NOT NULL, 
    fantasy_name VARCHAR, 
    name VARCHAR, 
    trade_name VARCHAR, 
    cnpj VARCHAR, 
    email VARCHAR, 
    phone VARCHAR, 
    status VARCHAR, 
    address VARCHAR, 
    city VARCHAR, 
    state VARCHAR, 
    zip_code VARCHAR, 
    representative_id INTEGER, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_clients_cnpj ON clients (cnpj);

CREATE INDEX ix_clients_fantasy_name ON clients (fantasy_name);

CREATE INDEX ix_clients_id ON clients (id);

CREATE INDEX ix_clients_representative_id ON clients (representative_id);

CREATE TABLE suppliers (
    id SERIAL NOT NULL, 
    name VARCHAR, 
    cnpj VARCHAR, 
    email VARCHAR, 
    phone VARCHAR, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_suppliers_id ON suppliers (id);

CREATE INDEX ix_suppliers_name ON suppliers (name);

CREATE TABLE visit_routes (
    id SERIAL NOT NULL, 
    name VARCHAR, 
    date VARCHAR, 
    stops JSON, 
    user_id INTEGER, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_visit_routes_id ON visit_routes (id);

CREATE INDEX ix_visit_routes_user_id ON visit_routes (user_id);

CREATE TABLE contacts (
    id SERIAL NOT NULL, 
    name VARCHAR, 
    role VARCHAR, 
    email VARCHAR, 
    phone VARCHAR, 
    is_primary BOOLEAN, 
    client_id INTEGER, 
    PRIMARY KEY (id), 
    FOREIGN KEY(client_id) REFERENCES clients (id)
);

CREATE INDEX ix_contacts_id ON contacts (id);

CREATE TABLE orders (
    id SERIAL NOT NULL, 
    external_id VARCHAR, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP), 
    updated_at TIMESTAMP WITH TIME ZONE, 
    status VARCHAR, 
    total_value FLOAT, 
    margin_value FLOAT, 
    notes TEXT, 
    client_id INTEGER, 
    representative_id INTEGER, 
    PRIMARY KEY (id), 
    FOREIGN KEY(client_id) REFERENCES clients (id)
);

CREATE INDEX ix_orders_external_id ON orders (external_id);

CREATE INDEX ix_orders_id ON orders (id);

CREATE INDEX ix_orders_representative_id ON orders (representative_id);

CREATE TABLE products (
    id SERIAL NOT NULL, 
    sku VARCHAR, 
    name VARCHAR, 
    description TEXT, 
    price FLOAT, 
    cost_price FLOAT, 
    stock INTEGER, 
    image_url VARCHAR, 
    category VARCHAR, 
    supplier_id INTEGER, 
    PRIMARY KEY (id), 
    FOREIGN KEY(supplier_id) REFERENCES suppliers (id)
);

CREATE INDEX ix_products_id ON products (id);

CREATE INDEX ix_products_name ON products (name);

CREATE INDEX ix_products_sku ON products (sku);

CREATE TABLE order_items (
    id SERIAL NOT NULL, 
    order_id INTEGER, 
    product_id INTEGER, 
    quantity INTEGER, 
    unit_price FLOAT, 
    total FLOAT, 
    PRIMARY KEY (id), 
    FOREIGN KEY(order_id) REFERENCES orders (id), 
    FOREIGN KEY(product_id) REFERENCES products (id)
);

CREATE INDEX ix_order_items_id ON order_items (id);

INSERT INTO tenant_1.alembic_version (version_num) VALUES ('00896204b438') RETURNING tenant_1.alembic_version.version_num;

COMMIT;

