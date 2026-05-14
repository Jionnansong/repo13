const { SystemSetting, OperationLog } = require('../models');

const getSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    return res.json(settingsMap);
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ message: '获取系统配置失败' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { system_name, operating_hours, cold_storage_temp_min, cold_storage_temp_max, warehouse_temp_alarm, system_announcement } = req.body;
    
    const settingsData = {
      system_name,
      operating_hours,
      cold_storage_temp_min,
      cold_storage_temp_max,
      warehouse_temp_alarm,
      system_announcement
    };

    for (const [key, value] of Object.entries(settingsData)) {
      if (value !== undefined) {
        const [setting] = await SystemSetting.findOrCreate({
          where: { key },
          defaults: { value: String(value) }
        });
        if (setting.value !== String(value)) {
          setting.value = String(value);
          await setting.save();
        }
      }
    }

    await OperationLog.create({
      username: req.user.username,
      action: '修改系统设置',
      details: `更新了系统运行参数配置。包括：系统名称或温湿度警戒阈值等。`,
      ip: req.ip || '127.0.0.1'
    });

    return res.json({ message: '系统参数更新成功' });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ message: '修改系统配置失败' });
  }
};

const getLogs = async (req, res) => {
  try {
    const logs = await OperationLog.findAll({
      limit: 100,
      order: [['createdAt', 'DESC']]
    });
    return res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    return res.status(500).json({ message: '获取操作日志失败' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getLogs,
};
