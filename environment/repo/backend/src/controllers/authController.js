const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, OperationLog } = require('../models');
const { JWT_SECRET } = require('../config/db');

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未授权，缺少凭证' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findByPk(decoded.id);
    if (!user || !user.status) {
      return res.status(401).json({ message: '未授权或账号已被禁用' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: '未授权，凭证无效' });
  }
};

// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '拒绝访问，需要管理员权限' });
  }
  next();
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ message: '用户名或密码不正确' });
    }

    if (!user.status) {
      return res.status(403).json({ message: '该账号已被禁用' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '用户名或密码不正确' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await OperationLog.create({
      username: user.username,
      action: '登录系统',
      details: `用户 ${user.realName} (${user.username}) 成功登录系统`,
      ip: req.ip || '127.0.0.1'
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        realName: user.realName,
        phone: user.phone,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: '登录失败，服务器内部错误' });
  }
};

const getCurrentUser = async (req, res) => {
  return res.json({
    id: req.user.id,
    username: req.user.username,
    role: req.user.role,
    realName: req.user.realName,
    phone: req.user.phone,
    status: req.user.status,
  });
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: '原密码和新密码不能为空' });
    }

    const user = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '原密码不正确' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await OperationLog.create({
      username: user.username,
      action: '修改密码',
      details: `用户 ${user.realName} 修改了自己的登录密码`,
      ip: req.ip || '127.0.0.1'
    });

    return res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: '修改密码失败' });
  }
};

const getAccounts = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    return res.json(users);
  } catch (error) {
    console.error('Get accounts error:', error);
    return res.status(500).json({ message: '获取账号列表失败' });
  }
};

const createAccount = async (req, res) => {
  try {
    const { username, password, role, realName, phone } = req.body;
    if (!username || !password || !realName) {
      return res.status(400).json({ message: '用户名、密码和真实姓名不能为空' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      role: role || 'staff',
      realName,
      phone,
      status: true,
    });

    await OperationLog.create({
      username: req.user.username,
      action: '创建账号',
      details: `管理员创建了新账号 ${realName} (${username})`,
      ip: req.ip || '127.0.0.1'
    });

    return res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      realName: newUser.realName,
      phone: newUser.phone,
      status: newUser.status,
    });
  } catch (error) {
    console.error('Create account error:', error);
    return res.status(500).json({ message: '创建账号失败' });
  }
};

const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, realName, phone, password } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: '账号不存在' });
    }

    // Don't allow changing admin role of system admin unless allowed
    if (user.username === 'admin' && role && role !== 'admin') {
      return res.status(400).json({ message: '无法更改内置系统管理员的角色' });
    }

    if (realName) user.realName = realName;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    await OperationLog.create({
      username: req.user.username,
      action: '编辑账号',
      details: `管理员修改了账号 ${user.realName} (${user.username}) 的信息`,
      ip: req.ip || '127.0.0.1'
    });

    return res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      realName: user.realName,
      phone: user.phone,
      status: user.status,
    });
  } catch (error) {
    console.error('Update account error:', error);
    return res.status(500).json({ message: '更新账号失败' });
  }
};

const toggleAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: '账号不存在' });
    }

    if (user.username === 'admin') {
      return res.status(400).json({ message: '无法禁用内置系统管理员' });
    }

    user.status = !user.status;
    await user.save();

    await OperationLog.create({
      username: req.user.username,
      action: user.status ? '启用账号' : '禁用账号',
      details: `管理员${user.status ? '启用' : '禁用'}了账号 ${user.realName} (${user.username})`,
      ip: req.ip || '127.0.0.1'
    });

    return res.json({ id: user.id, status: user.status });
  } catch (error) {
    console.error('Toggle status error:', error);
    return res.status(500).json({ message: '切换账号状态失败' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: '账号不存在' });
    }

    if (user.username === 'admin') {
      return res.status(400).json({ message: '无法删除内置系统管理员' });
    }

    const { username, realName } = user;
    await user.destroy();

    await OperationLog.create({
      username: req.user.username,
      action: '删除账号',
      details: `管理员删除了账号 ${realName} (${username})`,
      ip: req.ip || '127.0.0.1'
    });

    return res.json({ message: '账号删除成功' });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ message: '删除账号失败' });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  login,
  getCurrentUser,
  changePassword,
  getAccounts,
  createAccount,
  updateAccount,
  toggleAccountStatus,
  deleteAccount,
};
