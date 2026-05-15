# ==========================================
# 阶段 1: 构建 Vue 3 前端静态资源
# ==========================================
ARG NODE_IMAGE=docker.m.daocloud.io/library/node:20-slim
FROM ${NODE_IMAGE} AS frontend-builder
WORKDIR /app/frontend

# 复制前端 package.json 并安装依赖
COPY repo/frontend/package*.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN npm install

# 复制前端源码并执行打包编译
COPY repo/frontend/ ./
RUN npm run build

# ==========================================
# 阶段 2: 运行后端 Express 服务，并通过 Nginx 独立暴露前端端口
# ==========================================
FROM ${NODE_IMAGE}
WORKDIR /app/backend

# 使用国内 Debian 源安装 Nginx 与 node-gyp 编译依赖
RUN sed -i 's|https://deb.debian.org/debian|http://mirrors.aliyun.com/debian|g; s|http://deb.debian.org/debian|http://mirrors.aliyun.com/debian|g; s|https://security.debian.org/debian-security|http://mirrors.aliyun.com/debian-security|g; s|http://security.debian.org/debian-security|http://mirrors.aliyun.com/debian-security|g; s|https://deb.debian.org/debian-security|http://mirrors.aliyun.com/debian-security|g; s|http://deb.debian.org/debian-security|http://mirrors.aliyun.com/debian-security|g' /etc/apt/sources.list /etc/apt/sources.list.d/*.list /etc/apt/sources.list.d/*.sources 2>/dev/null || true \
    && apt-get update \
    && apt-get install -y --no-install-recommends nginx python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制后端 package.json 并安装依赖
COPY repo/backend/package*.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN npm install

# 复制后端源码
COPY repo/backend/ ./

# 从前端构建阶段拷贝打包好的静态文件
COPY --from=frontend-builder /app/frontend/dist/ /usr/share/nginx/html/

# 前端端口 3000：静态资源 + /api 代理到后端端口 8081
RUN printf '%s\n' \
    'server {' \
    '    listen 3000;' \
    '    server_name _;' \
    '    root /usr/share/nginx/html;' \
    '    index index.html;' \
    '' \
    '    location /api/ {' \
    '        proxy_pass http://127.0.0.1:8081/api/;' \
    '        proxy_http_version 1.1;' \
    '        proxy_set_header Host $host;' \
    '        proxy_set_header X-Real-IP $remote_addr;' \
    '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' \
    '        proxy_set_header X-Forwarded-Proto $scheme;' \
    '    }' \
    '' \
    '    location / {' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '}' \
    > /etc/nginx/conf.d/default.conf \
    && rm -f /etc/nginx/sites-enabled/default

# 创建 SQLite 数据存储目录并设置权限
RUN mkdir -p data

# 分别暴露前端端口 (3000) 与后端端口 (8081)
EXPOSE 3000
EXPOSE 8081

# 环境变量配置
ENV PORT=8081
ENV NODE_ENV=production

# 启动后端 API 与前端 Nginx 服务
CMD ["sh", "-c", "node src/app.js & nginx -g 'daemon off;'"]



# ========== SSH plugin (pluggable, for Cursor/Trae vibe coding) ==========
# Drop-in block: copy the same `ssh_plugin/` folder next to this Dockerfile
# and paste this block at the end of any business Dockerfile. Nothing else
# in the business logic needs to change.
#
# Optional customisation (add BEFORE this block if needed):
#   ENV SSH_PASSWORD=mysecret           # change root password (default: password)
#   ENV SSH_PORT=2222                   # change sshd port     (default: 22)
#   ENV ORIG_ENTRYPOINT=/docker-entrypoint.sh   # chain base image's ENTRYPOINT
#                                                # (e.g. postgres, mysql, jupyter)
#
# NOTE: this block runs as root (required to install sshd). If the base image
#       uses a non-root USER, restore it at the very end, e.g. `USER node`.
USER root
COPY ssh_plugin/ /opt/ssh_plugin/
RUN chmod +x /opt/ssh_plugin/*.sh && /opt/ssh_plugin/install_ssh.sh
EXPOSE 22
ENTRYPOINT ["/opt/ssh_plugin/entrypoint.sh"]
# USER <original-user>   # uncomment & set if the base image requires non-root
# ========== end SSH plugin ==========
