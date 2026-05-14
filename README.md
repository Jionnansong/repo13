# 恒丰现代农产品管理系统 (Agricultural Products Management System)

## 🛠 技术栈
- Frontend: Vue 3 + Vite + Element Plus + Tailwind CSS + Pinia + ECharts
- Backend: Node.js + Express.js + Sequelize ORM
- Database: SQLite (数据保存在容器内的 `/app/data/farm.sqlite` 目录中)

## 🚀 启动指南 (How to Run)
1. 确保 Docker 正在运行。
2. 切换到项目 `environment` 目录中。
3. 执行以下命令构建 Docker 镜像：
   ```bash
   docker build -t farm-system -f Dockerfile .
   ```
4. 构建完成后，启动单容器实例运行全栈应用：
   ```bash
   docker run -d -p 8213:8213 --name farm-system-container farm-system
   ```
5. 容器启动完成后，即可打开浏览器进行访问。

## 🔗 服务地址 (Services)
- 全栈管理系统: http://localhost:8213
- 数据库路径: 容器内 `/app/data/farm.sqlite` 

## 🧪 测试账号
- 系统管理员 (Admin): `admin` / `123456`
- 农业操作员 (Staff): `staff` / `123456`
