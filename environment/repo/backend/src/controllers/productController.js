const { Op } = require('sequelize');
const { Product, OperationLog } = require('../models');

const getAllProducts = async (req, res) => {
  try {
    const { name, category, status } = req.query;
    const whereClause = {};

    if (name) {
      whereClause.name = { [Op.like]: `%${name}%` };
    }
    if (category) {
      whereClause.category = category;
    }
    if (status !== undefined && status !== '') {
      whereClause.status = status === 'true';
    }

    const products = await Product.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    return res.json(products);
  } catch (error) {
    console.error('Get all products error:', error);
    return res.status(500).json({ message: '获取农产品列表失败' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: '农产品不存在' });
    }
    return res.json(product);
  } catch (error) {
    console.error('Get product by ID error:', error);
    return res.status(500).json({ message: '获取农产品详情失败' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, category, unit, price, stock, origin, image, description } = req.body;
    if (!name || !category || !unit || price === undefined || stock === undefined || !origin) {
      return res.status(400).json({ message: '必填字段不能为空' });
    }

    const newProduct = await Product.create({
      name,
      category,
      unit,
      price,
      stock,
      origin,
      image: image || '',
      description: description || '',
      status: true
    });

    await OperationLog.create({
      username: req.user.username,
      action: '入库农产品',
      details: `创建了新农产品：${name} (${category})，初始库存: ${stock}${unit}，采购/单价: ${price}元`,
      ip: req.ip || '127.0.0.1'
    });

    return res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ message: '添加农产品失败' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, unit, price, stock, origin, image, description, status } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: '农产品不存在' });
    }

    if (name) product.name = name;
    if (category) product.category = category;
    if (unit) product.unit = unit;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (origin) product.origin = origin;
    if (image !== undefined) product.image = image;
    if (description !== undefined) product.description = description;
    if (status !== undefined) product.status = status;

    await product.save();

    await OperationLog.create({
      username: req.user.username,
      action: '编辑农产品',
      details: `修改了农产品信息：${product.name} (ID: ${product.id})`,
      ip: req.ip || '127.0.0.1'
    });

    return res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ message: '更新农产品失败' });
  }
};

const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, quantity, reason } = req.body; // type: 'in' = inbound, 'out' = outbound, 'set' = adjust count
    if (!type || quantity === undefined || quantity <= 0) {
      return res.status(400).json({ message: '调整类型和数量不正确' });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: '农产品不存在' });
    }

    const oldStock = product.stock;
    let newStock = oldStock;

    if (type === 'in') {
      newStock += parseInt(quantity);
    } else if (type === 'out') {
      if (oldStock < quantity) {
        return res.status(400).json({ message: '库存不足，无法出库' });
      }
      newStock -= parseInt(quantity);
    } else if (type === 'set') {
      newStock = parseInt(quantity);
    } else {
      return res.status(400).json({ message: '未知的库存调整类型' });
    }

    product.stock = newStock;
    await product.save();

    const actionText = type === 'in' ? '增加库存' : type === 'out' ? '减少库存' : '盘点库存';
    const logDetails = `${actionText}：${product.name} (ID: ${product.id})，原有库存: ${oldStock}${product.unit}，变更数量: ${quantity}${product.unit}，现库存: ${newStock}${product.unit}。备注: ${reason || '无'}`;

    await OperationLog.create({
      username: req.user.username,
      action: '库存变动',
      details: logDetails,
      ip: req.ip || '127.0.0.1'
    });

    return res.json(product);
  } catch (error) {
    console.error('Adjust stock error:', error);
    return res.status(500).json({ message: '调整库存失败' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: '农产品不存在' });
    }

    const { name } = product;
    await product.destroy();

    await OperationLog.create({
      username: req.user.username,
      action: '删除农产品',
      details: `删除了农产品及其关联信息：${name} (ID: ${id})`,
      ip: req.ip || '127.0.0.1'
    });

    return res.json({ message: '农产品已成功删除' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ message: '删除农产品失败，可能存在其他关联数据关联' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
};
