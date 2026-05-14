const { Op } = require('sequelize');
const { Listing, Product, OperationLog } = require('../models');

const getAllListings = async (req, res) => {
  try {
    const { title, platform, status } = req.query;
    const whereClause = {};

    if (title) {
      whereClause.title = { [Op.like]: `%${title}%` };
    }
    if (platform) {
      whereClause.platform = platform;
    }
    if (status) {
      whereClause.status = status;
    }

    const listings = await Listing.findAll({
      where: whereClause,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'unit', 'price', 'stock', 'origin']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json(listings);
  } catch (error) {
    console.error('Get all listings error:', error);
    return res.status(500).json({ message: '获取上架列表失败' });
  }
};

const createListing = async (req, res) => {
  try {
    const { productId, title, price, quantity, platform, status } = req.body;
    if (!productId || !title || price === undefined || quantity === undefined || !platform) {
      return res.status(400).json({ message: '必填字段不能为空' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: '关联的农产品不存在' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: `上架数量 (${quantity}) 不能大于农产品库存数量 (${product.stock})` });
    }

    const listStatus = status || 'Draft';
    const listedAt = listStatus === 'Listed' ? new Date() : null;

    const newListing = await Listing.create({
      productId,
      title,
      price,
      quantity,
      platform,
      status: listStatus,
      listedAt,
    });

    // Deduct stock if listed directly? Usually we can choose to or not.
    // Let's keep stock in Product as warehouse inventory, and listing as market availability.
    // That's standard for agricultural supply chain!

    await OperationLog.create({
      username: req.user.username,
      action: '创建上架',
      details: `创建了产品上架："${title}"，平台: ${platform}，上架数量: ${quantity}${product.unit}，零售价: ${price}元，当前状态: ${listStatus}`,
      ip: req.ip || '127.0.0.1'
    });

    return res.status(201).json(newListing);
  } catch (error) {
    console.error('Create listing error:', error);
    return res.status(500).json({ message: '创建上架信息失败' });
  }
};

const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, quantity, platform, status } = req.body;

    const listing = await Listing.findByPk(id, {
      include: [{ model: Product, as: 'product' }]
    });
    if (!listing) {
      return res.status(404).json({ message: '上架条目不存在' });
    }

    if (quantity !== undefined && listing.product) {
      if (listing.product.stock < quantity) {
        return res.status(400).json({ message: `上架数量 (${quantity}) 不能大于农产品库存数量 (${listing.product.stock})` });
      }
    }

    if (title) listing.title = title;
    if (price !== undefined) listing.price = price;
    if (quantity !== undefined) listing.quantity = quantity;
    if (platform) listing.platform = platform;
    
    if (status) {
      if (status === 'Listed' && listing.status !== 'Listed') {
        listing.listedAt = new Date();
      } else if (status !== 'Listed') {
        listing.listedAt = null;
      }
      listing.status = status;
    }

    await listing.save();

    await OperationLog.create({
      username: req.user.username,
      action: '修改上架',
      details: `修改了产品上架："${listing.title}" (ID: ${listing.id})`,
      ip: req.ip || '127.0.0.1'
    });

    return res.json(listing);
  } catch (error) {
    console.error('Update listing error:', error);
    return res.status(500).json({ message: '更新上架信息失败' });
  }
};

const toggleListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Draft', 'Listed', 'Delisted'
    if (!status || !['Draft', 'Listed', 'Delisted'].includes(status)) {
      return res.status(400).json({ message: '无效的上架状态' });
    }

    const listing = await Listing.findByPk(id, {
      include: [{ model: Product, as: 'product' }]
    });
    if (!listing) {
      return res.status(404).json({ message: '上架条目不存在' });
    }

    if (status === 'Listed') {
      if (listing.product && listing.product.stock < listing.quantity) {
        return res.status(400).json({ message: `无法上架！上架数量 (${listing.quantity}) 已超过该产品当前库存量 (${listing.product.stock})` });
      }
      listing.listedAt = new Date();
    } else {
      listing.listedAt = null;
    }

    listing.status = status;
    await listing.save();

    const statusTexts = { 'Draft': '存为草稿', 'Listed': '产品上架', 'Delisted': '下架产品' };
    await OperationLog.create({
      username: req.user.username,
      action: statusTexts[status] || '上架状态变更',
      details: `变更上架状态为【${status}】: "${listing.title}" (ID: ${listing.id})`,
      ip: req.ip || '127.0.0.1'
    });

    return res.json(listing);
  } catch (error) {
    console.error('Toggle listing status error:', error);
    return res.status(500).json({ message: '切换上架状态失败' });
  }
};

const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findByPk(id);
    if (!listing) {
      return res.status(404).json({ message: '上架条目不存在' });
    }

    const { title } = listing;
    await listing.destroy();

    await OperationLog.create({
      username: req.user.username,
      action: '删除上架',
      details: `删除了产品上架记录："${title}" (ID: ${id})`,
      ip: req.ip || '127.0.0.1'
    });

    return res.json({ message: '上架记录删除成功' });
  } catch (error) {
    console.error('Delete listing error:', error);
    return res.status(500).json({ message: '删除上架记录失败' });
  }
};

module.exports = {
  getAllListings,
  createListing,
  updateListing,
  toggleListingStatus,
  deleteListing,
};
