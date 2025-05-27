---
layout: page
title: gitea
date: 2024-11-1 12:00:00 +0800
---
## 本地内网部署
创建yml文件：
```yml
services:
  gitea:
    image: gitea/gitea:latest
    container_name: gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
    restart: always
    ports:
      - "3000:3000"
      - "2222:22"
    volumes:
      - ./gitea:/data
```
使用docker compose构建：
```bash
mkdir gitea
docker compose up -d
# 或docker-compose
docker-compose up -d
```
构建完毕后，访问`IP:3000`进行配置。

## https部署

# Gitea HTTPS 自动续签部署完整指南

## 前置条件

1. **服务器要求**：
   - Ubuntu/Debian/CentOS 等 Linux 系统
   - 至少 1GB RAM，2GB 推荐
   - 已安装 Docker 和 Docker Compose

2. **域名要求**：
   - 拥有一个域名（如 `www.example.com`）
   - 域名已正确解析到服务器 IP 地址

3. **端口要求**：
   - 确保以下端口未被占用或可以使用：
     - `1080`（HTTP）
     - `10443`（HTTPS）
     - `2222`（SSH）
     - `3000`（Gitea 直接访问，可选）

4. **防火墙设置**：
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 1080
   sudo ufw allow 10443
   sudo ufw allow 2222
   sudo ufw allow 3000  # 可选
   
   # CentOS/RHEL
   sudo firewall-cmd --permanent --add-port=1080/tcp
   sudo firewall-cmd --permanent --add-port=10443/tcp
   sudo firewall-cmd --permanent --add-port=2222/tcp
   sudo firewall-cmd --permanent --add-port=3000/tcp  # 可选
   sudo firewall-cmd --reload
   ```

## 步骤 1：准备工作目录

```bash
# 创建项目目录
mkdir -p /home/gitea-deploy
cd /home/gitea-deploy

# 创建必要的子目录
mkdir -p user_conf.d
mkdir -p certbot-webroot
mkdir -p gitea
```

## 步骤 2：创建 Docker Compose 配置文件

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  gitea:
    image: gitea/gitea:latest
    container_name: gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
    restart: always
    ports:
      - "3000:3000"
      - "2222:22"
    volumes:
      - ./gitea:/data
    networks:
      - gitea-network

  nginx-certbot:
    image: jonasal/nginx-certbot:latest
    container_name: nginx-certbot
    restart: always
    environment:
      - CERTBOT_EMAIL=your-email@example.com  # 替换为你的邮箱
      - STAGING=0
    ports:
      - "1080:80"
      - "10443:443"
    volumes:
      - nginx_secrets:/etc/letsencrypt
      - ./user_conf.d:/etc/nginx/user_conf.d
      - ./certbot-webroot:/var/www/certbot
    networks:
      - gitea-network

volumes:
  nginx_secrets:

networks:
  gitea-network:
    driver: bridge
```

**重要**：将 `your-email@example.com` 替换为你的真实邮箱地址。

## 步骤 3：创建初始 Nginx 配置（HTTP 模式）

创建 `user_conf.d/gitea.conf`：

```nginx
server {
    listen 80;
    server_name www.example.com;  # 替换为你的域名

    client_max_body_size 512M;

    # Let's Encrypt 验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri $uri/ =404;
    }

    location / {
        proxy_pass http://gitea:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto http;
        proxy_set_header X-Forwarded-Port 1080;
    }
}
```

**重要**：将 `www.example.com` 替换为你的真实域名。

## 步骤 4：启动服务并进行初始配置

```bash
# 启动服务
docker-compose up -d

# 检查服务状态
docker-compose ps

# 等待几分钟让服务完全启动
sleep 30
```

访问 `http://你的域名:1080` 或 `http://你的IP:1080` 进行 Gitea 初始设置：

1. **数据库设置**：选择 SQLite3（默认）
2. **一般设置**：
   - **站点标题**：自定义
   - **仓库根目录**：`/data/git/repositories`（默认）
   - **Git LFS 根目录**：`/data/git/lfs`（默认）
   - **以用户身份运行**：`git`（默认）
3. **服务器和第三方服务设置**：
   - **SSH 服务器域名**：你的域名（如 `www.example.com`）
   - **SSH 端口**：`2222`
   - **HTTP 端口**：`3000`
   - **应用 URL**：`http://你的域名:1080/`
4. **管理员账户设置**：创建你的管理员账户

完成设置后，确认可以正常登录和使用。

## 步骤 5：申请 SSL 证书

使用 DNS 验证方式申请证书（推荐，因为更稳定）：

```bash
docker exec -it nginx-certbot certbot certonly --manual --preferred-challenges dns --email your-email@example.com -d www.example.com --agree-tos
```

按照提示：
1. 同意条款
2. 当提示添加 DNS TXT 记录时，去你的域名管理面板添加：
   - **类型**：TXT
   - **名称**：`_acme-challenge.www.example.com`
   - **值**：命令中显示的值
3. 等待 DNS 传播（通常 2-5 分钟）
4. 按回车继续验证

如果申请成功，会显示证书保存路径。

## 步骤 6：更新 Nginx 配置启用 HTTPS

修改 `user_conf.d/gitea.conf`：

```nginx
server {
    listen 80;
    server_name www.example.com;  # 替换为你的域名
    
    # Let's Encrypt 验证路径（重要：这个必须在重定向之前）
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri $uri/ =404;
    }
    
    # 其他请求重定向到 HTTPS
    location / {
        return 301 https://$server_name:10443$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name www.example.com;  # 替换为你的域名

    ssl_certificate /etc/letsencrypt/live/www.example.com/fullchain.pem;  # 替换域名
    ssl_certificate_key /etc/letsencrypt/live/www.example.com/privkey.pem;  # 替换域名
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    client_max_body_size 512M;

    location / {
        proxy_pass http://gitea:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Port 10443;
    }
}
```

**重要**：将所有 `www.example.com` 替换为你的真实域名。

## 步骤 7：更新 Gitea 配置

更新 Gitea 的 ROOT_URL 设置：

```bash
# 方法 1：直接编辑配置文件
docker exec gitea sed -i 's|ROOT_URL = http://.*|ROOT_URL = https://www.example.com:10443/|g' /data/gitea/conf/app.ini

# 方法 2：手动编辑（如果上面的命令不工作）
docker exec -it gitea vi /data/gitea/conf/app.ini
# 找到 ROOT_URL 行，修改为：ROOT_URL = https://你的域名:10443/
```

## 步骤 8：重启服务

```bash
# 重启所有服务
docker-compose restart

# 检查服务状态
docker-compose ps

# 检查 nginx 日志确认 SSL 正常
docker logs nginx-certbot 2>&1 | tail -20
```

## 步骤 9：验证 HTTPS 访问

1. 访问 `https://你的域名:10443`
2. 确认：
   - SSL 证书有效（浏览器显示锁图标）
   - HTTP 自动重定向到 HTTPS
   - Gitea 功能正常

## 步骤 10：设置自动续签

nginx-certbot 镜像会自动处理证书续签，但我们需要确保配置正确。

检查自动续签是否工作：

```bash
# 查看 certbot 日志
docker logs nginx-certbot 2>&1 | grep -i renew

# 手动测试续签（干跑模式）
docker exec nginx-certbot certbot renew --dry-run --webroot -w /var/www/certbot
```

如果测试成功，证书会在到期前自动续签。

## Git 使用方式

部署完成后，你可以通过以下方式使用 Git：

### HTTPS 方式（推荐）：
```bash
git clone https://www.example.com:10443/用户名/仓库名.git
```

### SSH 方式：
```bash
git clone ssh://git@www.example.com:2222/用户名/仓库名.git
```

## 故障排除

### 1. 证书申请失败
- 确认域名正确解析到服务器 IP
- 确认防火墙开放相应端口
- 尝试使用 DNS 验证而非 HTTP 验证

### 2. HTTPS 访问失败
```bash
# 检查 nginx 配置语法
docker exec nginx-certbot nginx -t

# 检查证书文件是否存在
docker exec nginx-certbot ls -la /etc/letsencrypt/live/你的域名/

# 查看详细日志
docker logs nginx-certbot
```

### 3. Gitea 无法访问
```bash
# 检查 Gitea 日志
docker logs gitea

# 检查网络连接
docker exec nginx-certbot curl http://gitea:3000
```

### 4. 端口被占用
```bash
# 检查端口占用
netstat -tlnp | grep -E ':80|:443|:1080|:10443'

# 停止占用端口的服务或修改 docker-compose.yml 中的端口映射
```

## 安全建议

1. **定期备份**：
   ```bash
   # 备份 Gitea 数据
   docker exec gitea tar czf /data/gitea-backup-$(date +%Y%m%d).tar.gz /data/gitea
   
   # 复制到宿主机
   docker cp gitea:/data/gitea-backup-$(date +%Y%m%d).tar.gz ./
   ```

2. **限制注册**：在 Gitea 管理界面中禁用公开注册

3. **启用 2FA**：为管理员账户启用双因素认证

4. **定期更新**：
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

5. **监控日志**：定期检查访问日志和错误日志

## 文件结构总览

部署完成后，你的目录结构应该如下：

```
/home/gitea-deploy/
├── docker-compose.yml
├── user_conf.d/
│   └── gitea.conf
├── certbot-webroot/
├── gitea/
│   └── [Gitea数据文件]
└── README.md（可选）
```

按照以上步骤，你应该能够成功部署一个带有自动 HTTPS 证书续签的 Gitea 服务。

