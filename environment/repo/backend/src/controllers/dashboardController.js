const { Op, fn, col } = require('sequelize');
const { Product, Listing, SaleRecord, OperationLog, SystemSetting } = require('../models');

const getStats = async (req, res) => {
  try {
    // 1. Total sales amount (sum of price * quantity from SaleRecord)
    const saleRecords = await SaleRecord.findAll();
    let totalSales = 0;
    saleRecords.forEach(rec => {
      totalSales += parseFloat(rec.price) * rec.quantity;
    });

    // 2. Total products count and total stock quantity
    const totalProducts = await Product.count();
    const products = await Product.findAll({ attributes: ['stock'] });
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);

    // 3. Listed products count vs total listings
    const totalListings = await Listing.count();
    const listedCount = await Listing.count({ where: { status: 'Listed' } });
    const listingRate = totalListings > 0 ? Math.round((listedCount / totalListings) * 100) : 0;

    // 4. Retrieve temperature settings & simulate current storage stats
    const settings = await SystemSetting.findAll();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    const tempMin = parseFloat(settingsMap['cold_storage_temp_min'] || '-2.0');
    const tempMax = parseFloat(settingsMap['cold_storage_temp_max'] || '4.0');
    
    // Simulate current warehouse temp near the midpoint, occasionally showing safe values
    // We can store a simulated temperature or just calculate a beautiful mock value
    const currentStorageTemp = 1.2; // in celsius (completely healthy)

    // 5. Recent operations log (top 5)
    const recentLogs = await OperationLog.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalProducts,
      totalStock,
      totalListings,
      listedCount,
      listingRate,
      storageTemp: currentStorageTemp,
      tempMin,
      tempMax,
      recentLogs
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ message: '获取仪表盘统计数据失败' });
  }
};

const getSalesChartData = async (req, res) => {
  try {
    // 1. Sales Trend over past 7 days
    const now = new Date();
    const past7Days = [];
    const dateLabels = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const dateString = `${month}-${date}`;
      past7Days.push({
        dateStart: new Date(year, d.getMonth(), d.getDate(), 0, 0, 0),
        dateEnd: new Date(year, d.getMonth(), d.getDate(), 23, 59, 59),
        label: dateString
      });
      dateLabels.push(dateString);
    }

    const salesTrend = [];
    for (const day of past7Days) {
      const daySales = await SaleRecord.findAll({
        where: {
          soldAt: {
            [Op.between]: [day.dateStart, day.dateEnd]
          }
        }
      });
      let dayTotal = 0;
      daySales.forEach(rec => {
        dayTotal += parseFloat(rec.price) * rec.quantity;
      });
      salesTrend.push(parseFloat(dayTotal.toFixed(2)));
    }

    // 2. Category distribution
    const categories = ['Grains', 'Vegetables', 'Fruits', 'Meats', 'Dairy'];
    const categoryLabels = {
      'Grains': '粮食作物',
      'Vegetables': '新鲜蔬菜',
      'Fruits': '时令水果',
      'Meats': '禽畜肉蛋',
      'Dairy': '奶制品'
    };
    
    const categoryData = [];
    for (const cat of categories) {
      const count = await Product.count({ where: { category: cat } });
      categoryData.push({
        value: count,
        name: categoryLabels[cat]
      });
    }

    // 3. Stock Level chart (top 6 products)
    const topStockProducts = await Product.findAll({
      limit: 6,
      order: [['stock', 'DESC']],
      attributes: ['name', 'stock', 'unit']
    });

    const stockChartLabels = topStockProducts.map(p => p.name);
    const stockChartValues = topStockProducts.map(p => p.stock);

    return res.json({
      salesTrend: {
        labels: dateLabels,
        data: salesTrend
      },
      categoryData,
      stockLevel: {
        labels: stockChartLabels,
        data: stockChartValues
      }
    });
  } catch (error) {
    console.error('Get sales chart data error:', error);
    return res.status(500).json({ message: '获取销售图表数据失败' });
  }
};

module.exports = {
  getStats,
  getSalesChartData,
};
