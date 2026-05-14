const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const {
  User,
  Product,
  Listing,
  SaleRecord,
  SystemSetting,
  OperationLog
} = require('../models');

async function initDatabase() {
  try {
    // Check if tables exist, create them if not.
    // In production, we sync without force to persist existing data.
    // If the database is completely empty (no users), we'll do a fresh sync and seed.
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if User table exists and has records
    let shouldSeed = false;
    try {
      const userCount = await User.count();
      if (userCount === 0) {
        shouldSeed = true;
      }
    } catch (err) {
      // Table doesn't exist, need full sync and seed
      shouldSeed = true;
    }

    if (shouldSeed) {
      console.log('Empty database detected. Syncing database schema and seeding initial data...');
      await sequelize.sync({ force: true });
      await seedData();
      console.log('Database seeding completed successfully.');
    } else {
      console.log('Database already has data. Syncing schemas without data loss...');
      await sequelize.sync();
    }
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
}

async function seedData() {
  // 1. Users
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('123456', salt);

  const admin = await User.create({
    username: 'admin',
    password: hashedPassword,
    role: 'admin',
    realName: '系统管理员',
    phone: '13888888888',
    status: true,
  });

  const staff = await User.create({
    username: 'staff',
    password: hashedPassword,
    role: 'staff',
    realName: '农业操作员',
    phone: '13999999999',
    status: true,
  });

  // 2. Products
  const products = [
    {
      name: '有机红富士苹果',
      category: 'Fruits',
      unit: '箱',
      price: 68.00,
      stock: 150,
      origin: '山东烟台',
      image: '',
      description: '优质套袋红富士苹果，个大脆甜，绿色无公害，富含维生素。',
      status: true,
    },
    {
      name: '优质五常大米',
      category: 'Grains',
      unit: '袋',
      price: 89.00,
      stock: 320,
      origin: '黑龙江五常',
      image: '',
      description: '特等五常稻花香，双层真空包装，米粒饱满，香甜粘糯。',
      status: true,
    },
    {
      name: '高原沙地土豆',
      category: 'Vegetables',
      unit: '袋',
      price: 15.00,
      stock: 500,
      origin: '甘肃定西',
      image: '',
      description: '高原沙地种植，淀粉含量极高，口感沙软香糯。',
      status: true,
    },
    {
      name: '纯天然草原山羊肉',
      category: 'Meats',
      unit: 'kg',
      price: 78.00,
      stock: 80,
      origin: '内蒙古锡林郭勒',
      image: '',
      description: '草原天然牧场放养，肉质鲜美，紧实少油，无腥膻味。',
      status: true,
    },
    {
      name: '高钙低脂纯鲜牛奶',
      category: 'Dairy',
      unit: '箱',
      price: 45.00,
      stock: 200,
      origin: '河北张家口',
      image: '',
      description: '巴氏杀菌冷链直供，含有丰富活性营养因子和乳钙。',
      status: true,
    },
    {
      name: '丹东红颜草莓礼盒',
      category: 'Fruits',
      unit: '盒',
      price: 28.00,
      stock: 120,
      origin: '辽宁丹东',
      image: '',
      description: '红颜奶油草莓，大棚现采，果形饱满，香浓多汁。',
      status: true,
    },
    {
      name: '富硒高山西兰花',
      category: 'Vegetables',
      unit: 'kg',
      price: 12.00,
      stock: 240,
      origin: '云南昆明',
      image: '',
      description: '高海拔温室无菌培育，富含微量元素硒，脆嫩可口。',
      status: true,
    },
    {
      name: '老北京手工酸奶',
      category: 'Dairy',
      unit: '箱',
      price: 38.00,
      stock: 150,
      origin: '北京延庆',
      image: '',
      description: '传统工艺酿造，口感浓郁醇厚，活性益生菌含量高。',
      status: true,
    }
  ];

  const dbProducts = [];
  for (const p of products) {
    const createdProduct = await Product.create(p);
    dbProducts.push(createdProduct);
  }

  // 3. Listings
  const listings = [
    {
      productId: dbProducts[0].id,
      title: '【官方直营】山东红富士苹果精品箱装 10斤',
      price: 78.00,
      quantity: 80,
      platform: 'E-commerce',
      status: 'Listed',
      listedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    },
    {
      productId: dbProducts[1].id,
      title: '黑龙江特产五常稻花香大米 10kg 家庭装',
      price: 99.00,
      quantity: 200,
      platform: 'E-commerce',
      status: 'Listed',
      listedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    },
    {
      productId: dbProducts[2].id,
      title: '甘肃沙地土豆批发 50斤整袋直发 酒店食材直销',
      price: 13.50,
      quantity: 400,
      platform: 'Wholesale',
      status: 'Listed',
      listedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
    },
    {
      productId: dbProducts[3].id,
      title: '草原直发鲜山羊排/羊腿肉 顺丰冷链包邮',
      price: 88.00,
      quantity: 50,
      platform: 'E-commerce',
      status: 'Listed',
      listedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    },
    {
      productId: dbProducts[4].id,
      title: '草原牧歌高钙纯牛奶 250ml*12盒 批发专供',
      price: 42.00,
      quantity: 150,
      platform: 'Wholesale',
      status: 'Listed',
      listedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
    },
    {
      productId: dbProducts[5].id,
      title: '辽宁丹东精选红颜奶油草莓礼盒 2斤装',
      price: 35.00,
      quantity: 30,
      platform: 'Farmers Market',
      status: 'Delisted',
      listedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
    },
    {
      productId: dbProducts[6].id,
      title: '富硒高山西兰花 新鲜蔬菜商超配送 50斤起订',
      price: 10.00,
      quantity: 100,
      platform: 'Wholesale',
      status: 'Draft',
      listedAt: null,
    }
  ];

  for (const l of listings) {
    await Listing.create(l);
  }

  // 4. Sales Records (past 7 days sales)
  const sales = [];
  const now = new Date();
  
  // Helper to generate date offsets
  const getDateOffset = (days) => {
    const d = new Date();
    d.setDate(now.getDate() - days);
    return d;
  };

  // Generate 7 days of sales records
  // We'll simulate varied sales daily to draw a beautiful trend chart.
  const dailyDistribution = [
    { dayOffset: 6, records: [{ pIdx: 0, qty: 15 }, { pIdx: 1, qty: 20 }, { pIdx: 2, qty: 100 }, { pIdx: 4, qty: 10 }] }, // 6 days ago
    { dayOffset: 5, records: [{ pIdx: 1, qty: 12 }, { pIdx: 3, qty: 5 }, { pIdx: 4, qty: 15 }, { pIdx: 0, qty: 8 }] },   // 5 days ago
    { dayOffset: 4, records: [{ pIdx: 0, qty: 22 }, { pIdx: 2, qty: 150 }, { pIdx: 5, qty: 10 }, { pIdx: 1, qty: 18 }] }, // 4 days ago
    { dayOffset: 3, records: [{ pIdx: 1, qty: 25 }, { pIdx: 3, qty: 8 }, { pIdx: 4, qty: 30 }, { pIdx: 6, qty: 50 }] },  // 3 days ago
    { dayOffset: 2, records: [{ pIdx: 0, qty: 18 }, { pIdx: 2, qty: 80 }, { pIdx: 5, qty: 25 }, { pIdx: 1, qty: 15 }] },  // 2 days ago
    { dayOffset: 1, records: [{ pIdx: 1, qty: 35 }, { pIdx: 3, qty: 12 }, { pIdx: 4, qty: 25 }, { pIdx: 0, qty: 30 }] }, // 1 day ago
    { dayOffset: 0, records: [{ pIdx: 0, qty: 25 }, { pIdx: 1, qty: 40 }, { pIdx: 2, qty: 120 }, { pIdx: 5, qty: 15 }] }, // today
  ];

  for (const day of dailyDistribution) {
    const recordDate = getDateOffset(day.dayOffset);
    for (const rec of day.records) {
      const prod = dbProducts[rec.pIdx];
      await SaleRecord.create({
        productId: prod.id,
        quantity: rec.qty,
        price: prod.price, // Sell at product cost for simple tracking, or list price
        soldAt: recordDate,
      });
    }
  }

  // 5. System Settings
  const settings = [
    { key: 'system_name', value: '恒丰现代农业产品管理系统' },
    { key: 'operating_hours', value: '08:00 - 18:00' },
    { key: 'cold_storage_temp_min', value: '-2.0' },
    { key: 'cold_storage_temp_max', value: '4.0' },
    { key: 'warehouse_temp_alarm', value: '25.0' },
    { key: 'system_announcement', value: '欢迎使用恒丰现代农业管理系统！今日主推黑龙江五常大米和山东红富士苹果，请各仓库操作员注意冷库温度监控与日常除湿。' }
  ];

  for (const s of settings) {
    await SystemSetting.create(s);
  }

  // 6. Operation Log
  await OperationLog.create({
    username: 'system',
    action: '系统初始化',
    details: '系统成功创建了SQLite数据库表结构，并导入了基础演示账号、高品质农产品库存、市场货架上架条目以及7日内的模拟销售历史记录。',
    ip: '127.0.0.1'
  });
}

module.exports = {
  initDatabase,
};
