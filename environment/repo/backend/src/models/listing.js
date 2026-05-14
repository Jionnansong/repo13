const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Listing = sequelize.define('Listing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  platform: {
    type: DataTypes.STRING, // 'E-commerce', 'Wholesale', 'Farmers Market'
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING, // 'Draft', 'Listed', 'Delisted'
    allowNull: false,
    defaultValue: 'Draft',
  },
  listedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = Listing;
