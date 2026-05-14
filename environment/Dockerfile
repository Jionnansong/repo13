# ==========================================
# 阶段 1: 构建 Vue 3 前端静态资源
# ==========================================
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# 复制前端 package.json 并安装依赖
COPY repo/frontend/package*.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN npm install

# 复制前端源码并执行打包编译
COPY repo/frontend/ ./
RUN npm run build

# ==========================================
# 阶段 2: 运行后端 Express 服务并挂载前端
# ==========================================
FROM node:20-slim
WORKDIR /app

# 复制后端 package.json 并安装依赖
COPY repo/backend/package*.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN npm install

# 复制后端源码
COPY repo/backend/ ./

# 从前端构建阶段拷贝打包好的静态文件到后端的公共资源目录
COPY --from=frontend-builder /app/frontend/dist/ ./public/

# 创建 SQLite 数据存储目录并设置权限
RUN mkdir -p data

# 暴露单容器端口 (8213)
EXPOSE 8213

# 环境变量配置
ENV PORT=8213
ENV NODE_ENV=production

# 启动 Express 全栈服务器
CMD ["node", "src/app.js"]
