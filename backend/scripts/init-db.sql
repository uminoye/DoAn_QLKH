-- ============================================================
-- WMS MULTI-WAREHOUSE SYSTEM - DATABASE SCHEMA
-- PostgreSQL on Neon.tech
-- ============================================================

-- ============================================================
-- 1. SEQUENCES (Auto-generate codes)
-- ============================================================
DROP SEQUENCE IF EXISTS seq_customer CASCADE;
DROP SEQUENCE IF EXISTS seq_product CASCADE;
DROP SEQUENCE IF EXISTS seq_inbound CASCADE;
DROP SEQUENCE IF EXISTS seq_outbound CASCADE;
DROP SEQUENCE IF EXISTS seq_sales_order CASCADE;
DROP SEQUENCE IF EXISTS seq_user CASCADE;

CREATE SEQUENCE seq_user START 1;
CREATE SEQUENCE seq_customer START 1;
CREATE SEQUENCE seq_product START 1;
CREATE SEQUENCE seq_inbound START 1;
CREATE SEQUENCE seq_outbound START 1;
CREATE SEQUENCE seq_sales_order START 1;

-- ============================================================
-- 2. TABLES
-- ============================================================

-- USERS
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','MANAGER','KHO','SALES')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WAREHOUSES
DROP TABLE IF EXISTS warehouses CASCADE;
CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  total_capacity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES
DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  unit VARCHAR(30) DEFAULT 'Cái',
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOMERS
DROP TABLE IF EXISTS customers CASCADE;
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  customer_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOCATIONS (Generic Bins: Zone-Aisle-Rack-Shelf-Bin)
DROP TABLE IF EXISTS locations CASCADE;
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  warehouse_id INT REFERENCES warehouses(id) ON DELETE CASCADE,
  bin_code VARCHAR(30) UNIQUE NOT NULL,
  zone VARCHAR(10),
  aisle VARCHAR(10),
  rack VARCHAR(10),
  shelf VARCHAR(10),
  bin VARCHAR(10),
  status VARCHAR(10) DEFAULT 'EMPTY' CHECK (status IN ('EMPTY','FULL')),
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY (Stock per product per warehouse per location)
DROP TABLE IF EXISTS inventory CASCADE;
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id INT REFERENCES warehouses(id) ON DELETE CASCADE,
  location_id INT REFERENCES locations(id) ON DELETE CASCADE,
  quantity INT DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id, location_id)
);

-- INVENTORY_TRANSACTIONS (Audit log for FIFO/LIFO traceability)
DROP TABLE IF EXISTS inventory_transactions CASCADE;
CREATE TABLE inventory_transactions (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  warehouse_id INT REFERENCES warehouses(id) ON DELETE SET NULL,
  location_id INT REFERENCES locations(id) ON DELETE SET NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('INBOUND','OUTBOUND','SALE','ADJUST')),
  reference_type VARCHAR(30),
  reference_id INT,
  quantity_change INT NOT NULL,
  quantity_after INT NOT NULL,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INBOUND ORDERS
DROP TABLE IF EXISTS inbound_orders CASCADE;
CREATE TABLE inbound_orders (
  id SERIAL PRIMARY KEY,
  inbound_code VARCHAR(20) UNIQUE NOT NULL,
  warehouse_id INT REFERENCES warehouses(id) ON DELETE SET NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  approved_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INBOUND ORDER ITEMS
DROP TABLE IF EXISTS inbound_order_items CASCADE;
CREATE TABLE inbound_order_items (
  id SERIAL PRIMARY KEY,
  inbound_order_id INT REFERENCES inbound_orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  requested_quantity INT NOT NULL CHECK (requested_quantity > 0),
  assigned_location_id INT REFERENCES locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OUTBOUND ORDERS
DROP TABLE IF EXISTS outbound_orders CASCADE;
CREATE TABLE outbound_orders (
  id SERIAL PRIMARY KEY,
  outbound_code VARCHAR(20) UNIQUE NOT NULL,
  warehouse_id INT REFERENCES warehouses(id) ON DELETE SET NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','COMPLETED','REJECTED')),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  approved_by INT REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OUTBOUND ORDER ITEMS
DROP TABLE IF EXISTS outbound_order_items CASCADE;
CREATE TABLE outbound_order_items (
  id SERIAL PRIMARY KEY,
  outbound_order_id INT REFERENCES outbound_orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  requested_quantity INT NOT NULL CHECK (requested_quantity > 0),
  picked_quantity INT DEFAULT 0,
  picked_location_id INT REFERENCES locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SALES ORDERS
DROP TABLE IF EXISTS sales_orders CASCADE;
CREATE TABLE sales_orders (
  id SERIAL PRIMARY KEY,
  sales_order_code VARCHAR(20) UNIQUE NOT NULL,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  warehouse_id INT REFERENCES warehouses(id) ON DELETE SET NULL,
  total_amount DECIMAL(14,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','PROCESSING','COMPLETED')),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  approved_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SALES ORDER ITEMS
DROP TABLE IF EXISTS sales_order_items CASCADE;
CREATE TABLE sales_order_items (
  id SERIAL PRIMARY KEY,
  sales_order_id INT REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_location ON inventory(location_id);
CREATE INDEX idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_warehouse ON inventory_transactions(warehouse_id);
CREATE INDEX idx_inventory_transactions_created ON inventory_transactions(created_at);
CREATE INDEX idx_locations_warehouse ON locations(warehouse_id);
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_product ON locations(product_id);
CREATE INDEX idx_inbound_orders_warehouse ON inbound_orders(warehouse_id);
CREATE INDEX idx_inbound_orders_status ON inbound_orders(status);
CREATE INDEX idx_outbound_orders_warehouse ON outbound_orders(warehouse_id);
CREATE INDEX idx_outbound_orders_status ON outbound_orders(status);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_products_category ON products(category_id);

-- ============================================================
-- 4. SEED DATA
-- ============================================================

-- Users (password: 123456)
-- bcrypt hash for '123456': $2a$10$... (will be inserted via Node.js seeder)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@wms.vn', '$2a$10$rQnM1.vkqXqTqZ3F5f0kJeQZ5kJeQZ5kJeQZ5kJeQZ5kJeQZ5kJe', 'Nguyễn Văn Admin', 'ADMIN'),
('manager', 'manager@wms.vn', '$2a$10$rQnM1.vkqXqTqZ3F5f0kJeQZ5kJeQZ5kJeQZ5kJeQZ5kJeQZ5kJe', 'Trần Thị Manager', 'MANAGER'),
('kho', 'kho@wms.vn', '$2a$10$rQnM1.vkqXqTqZ3F5f0kJeQZ5kJeQZ5kJeQZ5kJeQZ5kJeQZ5kJe', 'Lê Văn Kho', 'KHO'),
('sales', 'sales@wms.vn', '$2a$10$rQnM1.vkqXqTqZ3F5f0kJeQZ5kJeQZ5kJeQZ5kJeQZ5kJeQZ5kJe', 'Phạm Thị Sales', 'SALES');

-- Warehouses
INSERT INTO warehouses (name, address, total_capacity) VALUES
('Kho Tổng Hà Nội', '123 Đường Nguyễn Trãi, Quận Thanh Xuân, Hà Nội', 100),
('Kho 1 - HCM', '456 Đường Lê Văn Việt, Quận 9, TP.HCM', 100),
('Kho 2 - Đà Nẵng', '789 Đường Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng', 100);

-- Categories
INSERT INTO categories (name, description) VALUES
('Thực phẩm', 'Các sản phẩm thực phẩm tổng hợp'),
('Điện tử', 'Thiết bị điện tử và linh kiện'),
('Quần áo', 'Trang phục và thời trang'),
('Mỹ phẩm', 'Sản phẩm chăm sóc sắc đẹp'),
('Đồ gia dụng', 'Vật dụng gia đình và sinh hoạt');

-- Products
INSERT INTO products (sku, name, category_id, unit, price) VALUES
('SP-000001', 'Gạo ST25 5kg', 1, 'Bao', 145000),
('SP-000002', 'Dầu ăn Meizan 1L', 1, 'Chai', 32000),
('SP-000003', 'Nước mắm Nam Ngư 500ml', 1, 'Chai', 28000),
('SP-000004', 'Tivi Samsung 43 inch', 2, 'Cái', 8500000),
('SP-000005', 'Quạt điện Osaka 16"', 2, 'Cái', 520000),
('SP-000006', 'Áo sơ mi nam cổ bẻ', 3, 'Cái', 250000),
('SP-000007', 'Quần jeans nam 32', 3, 'Cái', 380000),
('SP-000008', 'Kem dưỡng da Vaseline', 4, 'Hộp', 85000),
('SP-000009', 'Nước hoa hồng toner', 4, 'Chai', 120000),
('SP-000010', 'Nồi cơm điện Cuckoo', 5, 'Cái', 1450000);

-- Customers
INSERT INTO customers (customer_code, name, phone, email, address) VALUES
('KH-000001', 'Công ty TNHH Thương Mại An Phát', '0901234567', 'anphat@gmail.com', '12 Lê Lợi, Quận 1, TP.HCM'),
('KH-000002', 'Đại lý Bách Khoa Hà Nội', '0912345678', 'bkhn@vina.com', '45 Giải Phóng, Quận Hai Bà Trưng, Hà Nội'),
('KH-000003', 'Siêu thị Mini Mart Đà Nẵng', '0923456789', 'minimart.dn@outlook.com', '78 Nguyễn Văn Linh, Đà Nẵng'),
('KH-000004', 'Hộ kinh doanh Tân Phát', '0934567890', 'tanphat@gmail.com', '90 Trần Hưng Đạo, Quận 5, TP.HCM'),
('KH-000005', 'Cửa hàng Tiện lợi Sạch', '0945678901', 'sach@gmail.com', '23 Hoàng Diệu, Đà Nẵng');
