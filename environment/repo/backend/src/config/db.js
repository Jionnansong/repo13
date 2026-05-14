const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(dataDir, 'farm.sqlite'),
  logging: false,
});

const JWT_SECRET = process.env.JWT_SECRET || 'farm-management-super-secret-key-2026';

module.exports = {
  sequelize,
  JWT_SECRET,
};
