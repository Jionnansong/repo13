const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const { initDatabase } = require('./seeders/initDb');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 8081;

// Logger
app.use(morgan('combined'));

// Standard middleware
app.use(cors());
app.use(express.json());

// API endpoints
app.use('/api', apiRoutes);

// Serve compiled static files of Vue 3 frontend
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Fallback to index.html for SPA router (history mode)
app.get('*', (req, res, next) => {
  // If it's an API route that wasn't matched, don't serve index.html
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API 接口未找到' });
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: '服务器发生未知错误' });
});

// Start server after database initialization
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(` 农产品管理系统后端成功启动并运行在端口: ${PORT}`);
      console.log(` 访问地址: http://localhost:${PORT}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server due to database init error:', error);
    process.exit(1);
  }
}

startServer();
