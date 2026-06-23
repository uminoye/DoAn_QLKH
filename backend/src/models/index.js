const sequelize = require('../config/database');

const User = require('./User')(sequelize);
const Warehouse = require('./Warehouse')(sequelize);
const Category = require('./Category')(sequelize);
const Product = require('./Product')(sequelize);
const Customer = require('./Customer')(sequelize);
const Location = require('./Location')(sequelize);
const Inventory = require('./Inventory')(sequelize);
const InventoryTransaction = require('./InventoryTransaction')(sequelize);
const { InboundOrder, InboundOrderItem } = require('./InboundOrder')(sequelize);
const { OutboundOrder, OutboundOrderItem } = require('./OutboundOrder')(sequelize);
const { SalesOrder, SalesOrderItem } = require('./SalesOrder')(sequelize);

Warehouse.hasMany(Location, { foreignKey: 'warehouse_id', sourceKey: 'id', onDelete: 'CASCADE' });
Location.belongsTo(Warehouse, { foreignKey: 'warehouse_id', targetKey: 'id' });

Location.belongsTo(Product, { foreignKey: 'product_id', targetKey: 'id', onDelete: 'SET NULL' });
Product.hasMany(Location, { foreignKey: 'product_id', sourceKey: 'id', onDelete: 'SET NULL' });

Category.hasMany(Product, { foreignKey: 'category_id', sourceKey: 'id', onDelete: 'SET NULL' });
Product.belongsTo(Category, { foreignKey: 'category_id', targetKey: 'id' });

Warehouse.hasMany(InboundOrder, { foreignKey: 'warehouse_id', sourceKey: 'id', onDelete: 'SET NULL' });
InboundOrder.belongsTo(Warehouse, { foreignKey: 'warehouse_id', targetKey: 'id' });

InboundOrder.hasMany(InboundOrderItem, { foreignKey: 'inbound_order_id', sourceKey: 'id', onDelete: 'CASCADE' });
InboundOrderItem.belongsTo(InboundOrder, { foreignKey: 'inbound_order_id', targetKey: 'id' });

InboundOrderItem.belongsTo(Product, { foreignKey: 'product_id', targetKey: 'id', onDelete: 'SET NULL' });
InboundOrderItem.belongsTo(Location, { foreignKey: 'assigned_location_id', targetKey: 'id', onDelete: 'SET NULL' });

Warehouse.hasMany(OutboundOrder, { foreignKey: 'warehouse_id', sourceKey: 'id', onDelete: 'SET NULL' });
OutboundOrder.belongsTo(Warehouse, { foreignKey: 'warehouse_id', targetKey: 'id' });

OutboundOrder.hasMany(OutboundOrderItem, { foreignKey: 'outbound_order_id', sourceKey: 'id', onDelete: 'CASCADE' });
OutboundOrderItem.belongsTo(OutboundOrder, { foreignKey: 'outbound_order_id', targetKey: 'id' });

OutboundOrderItem.belongsTo(Product, { foreignKey: 'product_id', targetKey: 'id', onDelete: 'SET NULL' });
OutboundOrderItem.belongsTo(Location, { foreignKey: 'picked_location_id', targetKey: 'id', onDelete: 'SET NULL' });

SalesOrder.belongsTo(Customer, { foreignKey: 'customer_id', targetKey: 'id', onDelete: 'SET NULL' });
SalesOrder.belongsTo(Warehouse, { foreignKey: 'warehouse_id', targetKey: 'id', onDelete: 'SET NULL' });
SalesOrder.hasMany(SalesOrderItem, { foreignKey: 'sales_order_id', sourceKey: 'id', onDelete: 'CASCADE' });
SalesOrderItem.belongsTo(SalesOrder, { foreignKey: 'sales_order_id', targetKey: 'id' });
SalesOrderItem.belongsTo(Product, { foreignKey: 'product_id', targetKey: 'id', onDelete: 'SET NULL' });

Inventory.belongsTo(Product, { foreignKey: 'product_id', targetKey: 'id', onDelete: 'CASCADE' });
Inventory.belongsTo(Warehouse, { foreignKey: 'warehouse_id', targetKey: 'id', onDelete: 'CASCADE' });
Inventory.belongsTo(Location, { foreignKey: 'location_id', targetKey: 'id', onDelete: 'CASCADE' });

InventoryTransaction.belongsTo(Product, { foreignKey: 'product_id', targetKey: 'id', onDelete: 'SET NULL' });
InventoryTransaction.belongsTo(Warehouse, { foreignKey: 'warehouse_id', targetKey: 'id', onDelete: 'SET NULL' });
InventoryTransaction.belongsTo(Location, { foreignKey: 'location_id', targetKey: 'id', onDelete: 'SET NULL' });
InventoryTransaction.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id', onDelete: 'SET NULL' });

InboundOrder.belongsTo(User, { foreignKey: 'created_by', targetKey: 'id', as: 'creator', onDelete: 'SET NULL' });
InboundOrder.belongsTo(User, { foreignKey: 'approved_by', targetKey: 'id', as: 'approver', onDelete: 'SET NULL' });
OutboundOrder.belongsTo(User, { foreignKey: 'created_by', targetKey: 'id', as: 'creator', onDelete: 'SET NULL' });
OutboundOrder.belongsTo(User, { foreignKey: 'approved_by', targetKey: 'id', as: 'approver', onDelete: 'SET NULL' });
SalesOrder.belongsTo(User, { foreignKey: 'created_by', targetKey: 'id', as: 'creator', onDelete: 'SET NULL' });
SalesOrder.belongsTo(User, { foreignKey: 'approved_by', targetKey: 'id', as: 'approver', onDelete: 'SET NULL' });

module.exports = {
  sequelize,
  User,
  Warehouse,
  Category,
  Product,
  Customer,
  Location,
  Inventory,
  InventoryTransaction,
  InboundOrder,
  InboundOrderItem,
  OutboundOrder,
  OutboundOrderItem,
  SalesOrder,
  SalesOrderItem,
};
