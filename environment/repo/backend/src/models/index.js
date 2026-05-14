const User = require('./user');
const Product = require('./product');
const Listing = require('./listing');
const SaleRecord = require('./saleRecord');
const SystemSetting = require('./systemSetting');
const OperationLog = require('./operationLog');

// Define associations
Listing.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(Listing, { foreignKey: 'productId', as: 'listings' });

SaleRecord.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(SaleRecord, { foreignKey: 'productId', as: 'sales' });

module.exports = {
  User,
  Product,
  Listing,
  SaleRecord,
  SystemSetting,
  OperationLog,
};
