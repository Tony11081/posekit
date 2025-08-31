# 🚀 PoseKit Dokploy 部署指南

完整的生产环境部署指南，帮助你将PoseKit部署到Dokploy服务器。

## 📋 部署前准备

### 1. 服务器要求
- **CPU**: 最少2核心，推荐4核心
- **内存**: 最少4GB RAM，推荐8GB
- **存储**: 最少20GB可用空间（用于图片存储）
- **操作系统**: Ubuntu 20.04+ 或 CentOS 8+
- **Docker**: 版本20.10+
- **Dokploy**: 已安装并运行

### 2. 域名准备
- 购买域名并配置DNS指向你的服务器IP
- 例如：`posekit.yourdomain.com`

### 3. 环境变量配置
```bash
# 复制环境变量模板
cp env.example .env

# 编辑配置文件
nano .env
```

**必须配置的变量：**
```env
# 数据库密码 (必须修改！)
POSTGRES_PASSWORD=your_super_secure_password_here

# Redis密码 (必须修改！)
REDIS_PASSWORD=your_redis_password_here

# JWT密钥 (必须修改！至少32个字符)
JWT_SECRET=your_jwt_secret_key_at_least_32_characters_long

# 你的域名 (修改为你的实际域名)
DOMAIN=posekit.yourdomain.com
NEXT_PUBLIC_API_URL=https://posekit.yourdomain.com/api
NEXT_PUBLIC_CDN_URL=https://posekit.yourdomain.com/uploads
CDN_BASE_URL=https://posekit.yourdomain.com/uploads

# 管理员账号
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=admin_secure_password_123
```

## 🎯 Dokploy 部署步骤

### 方式一：通过 Dokploy UI 界面

1. **登录 Dokploy 控制台**
   ```bash
   # 访问你的Dokploy地址
   https://your-server-ip:3000
   ```

2. **创建新应用**
   - 点击 "New Application"
   - 选择 "Docker Compose"
   - 输入应用名称：`posekit`

3. **配置Git仓库**
   ```
   Repository URL: https://github.com/your-username/posekit.git
   Branch: main
   Build Path: /
   Docker Compose File: docker-compose.yml
   ```

4. **环境变量设置**
   - 方式A：上传 `.env` 文件
   - 方式B：手动添加每个环境变量
   
   **核心环境变量：**
   ```
   POSTGRES_PASSWORD=your_super_secure_password
   REDIS_PASSWORD=your_redis_password  
   JWT_SECRET=your_jwt_secret_32_chars_min
   NEXT_PUBLIC_API_URL=https://yourdomain.com/api
   NEXT_PUBLIC_CDN_URL=https://yourdomain.com/uploads
   CDN_BASE_URL=https://yourdomain.com/uploads
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_PASSWORD=admin_password
   ```

5. **域名配置**
   - 添加你的域名：`posekit.yourdomain.com`
   - 启用SSL证书（推荐Let's Encrypt）

6. **资源配置**
   ```json
   {
     "memory": "2Gi",
     "cpu": "1000m",
     "replicas": 1
   }
   ```

7. **存储卷配置**
   - `postgres_data`: 10GB (数据库数据)
   - `uploads_data`: 20GB (上传的图片)
   - `redis_data`: 1GB (缓存数据)

8. **点击部署**
   - 点击 "Deploy" 按钮
   - 监控部署日志
   - 等待所有服务健康检查通过

### 方式二：命令行部署

1. **使用部署脚本**
   ```bash
   # 赋予执行权限
   chmod +x deploy.sh
   
   # 完整部署
   ./deploy.sh deploy
   
   # 查看部署状态
   ./deploy.sh status
   
   # 查看日志
   ./deploy.sh logs
   ```

2. **手动Docker Compose部署**
   ```bash
   # 构建镜像
   docker-compose build
   
   # 启动服务
   docker-compose up -d
   
   # 检查服务状态
   docker-compose ps
   
   # 查看日志
   docker-compose logs -f
   ```

## ✅ 部署后验证

### 1. 检查服务状态
```bash
# 所有服务应该显示为 "Up" 和 "healthy"
docker-compose ps

# 预期输出：
# posekit_web_1      Up (healthy)
# posekit_api_1      Up (healthy) 
# posekit_postgres_1 Up (healthy)
# posekit_redis_1    Up (healthy)
# posekit_nginx_1    Up (healthy)
```

### 2. 测试网站访问
```bash
# 测试主页
curl -I https://yourdomain.com
# 应该返回 200 OK

# 测试API健康检查
curl https://yourdomain.com/api/health
# 应该返回 {"status":"ok"}

# 测试上传目录
curl -I https://yourdomain.com/uploads/
# 应该返回 403 或 200 (不是 404)
```

### 3. 检查数据库连接
```bash
# 进入API容器测试数据库连接
docker-compose exec api npm run db:check

# 或直接连接数据库
docker-compose exec postgres psql -U postgres -d posekit -c "SELECT version();"
```

### 4. 创建管理员账户
```bash
# 如果自动创建失败，手动创建管理员
docker-compose exec api npm run create-admin \
  --email="admin@yourdomain.com" \
  --password="your_admin_password"
```

### 5. 访问管理后台
- 访问：`https://yourdomain.com/admin`
- 使用管理员账号登录
- 上传第一批姿态图片

## 🔧 SSL证书配置

### 自动SSL（推荐）
如果使用Dokploy界面，可以直接启用Let's Encrypt自动SSL证书。

### 手动SSL配置
1. **获取SSL证书**
   ```bash
   # 使用certbot获取证书
   sudo certbot certonly --standalone -d yourdomain.com
   
   # 或上传现有证书到 ssl/ 目录
   mkdir ssl
   cp your-cert.pem ssl/cert.pem
   cp your-key.pem ssl/key.pem
   ```

2. **更新Nginx配置**
   ```bash
   # 编辑nginx.conf，取消注释HTTPS部分
   nano nginx.conf
   
   # 重新部署
   docker-compose up -d nginx
   ```

## 📊 监控和维护

### 1. 日志监控
```bash
# 查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f web
docker-compose logs -f api
docker-compose logs -f postgres

# 查看最近的错误日志
docker-compose logs --tail=100 api | grep -i error
```

### 2. 性能监控
```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h
du -sh /var/lib/docker/volumes/

# 查看数据库性能
docker-compose exec postgres psql -U postgres -d posekit \
  -c "SELECT * FROM pg_stat_activity WHERE state != 'idle';"
```

### 3. 备份
```bash
# 数据库备份
docker-compose exec postgres pg_dump -U postgres posekit > backup_$(date +%Y%m%d).sql

# 上传文件备份
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# 自动备份脚本
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

### 4. 更新部署
```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
./deploy.sh deploy

# 或使用docker-compose
docker-compose down
docker-compose up --build -d
```

## 🐛 常见问题排查

### 1. 服务启动失败
```bash
# 检查端口占用
netstat -tulpn | grep -E ':(80|443|3000|3001|5432|6379)'

# 清理和重启
docker-compose down -v
docker system prune -f
./deploy.sh deploy
```

### 2. 数据库连接问题
```bash
# 检查数据库服务
docker-compose logs postgres

# 测试连接
docker-compose exec postgres psql -U postgres -d posekit -c "SELECT 1;"

# 重置数据库密码
docker-compose exec postgres psql -U postgres \
  -c "ALTER USER postgres PASSWORD 'new_password';"
```

### 3. 图片上传失败
```bash
# 检查上传目录权限
docker-compose exec api ls -la /app/uploads/

# 检查磁盘空间
df -h

# 检查Nginx配置
docker-compose exec nginx nginx -t
```

### 4. SSL证书问题
```bash
# 检查证书文件
ls -la ssl/

# 测试SSL配置
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# 重新获取Let's Encrypt证书
sudo certbot renew
```

## 🚀 性能优化建议

### 1. 数据库优化
```sql
-- 在PostgreSQL中执行
-- 调整连接数
ALTER SYSTEM SET max_connections = '200';

-- 优化内存设置
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';

-- 重启数据库生效
SELECT pg_reload_conf();
```

### 2. 缓存优化
```bash
# 在docker-compose.yml中增加Redis内存
redis:
  command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### 3. Nginx优化
```nginx
# 在nginx.conf中添加
worker_processes auto;
worker_connections 4096;

gzip_comp_level 6;
gzip_min_length 1000;
gzip_types text/css application/javascript application/json image/svg+xml;
```

## 🔐 安全建议

1. **定期更新密码**
   - 定期更换数据库密码
   - 更新JWT密钥
   - 修改管理员密码

2. **防火墙配置**
   ```bash
   # 只开放必要端口
   ufw allow 22    # SSH
   ufw allow 80    # HTTP
   ufw allow 443   # HTTPS
   ufw enable
   ```

3. **备份策略**
   - 每日自动备份数据库
   - 每周备份上传文件
   - 备份文件存储到异地

4. **监控告警**
   - 设置服务健康检查
   - 配置磁盘空间告警
   - 监控异常访问日志

## 📞 技术支持

如果遇到部署问题，请：

1. **检查日志**：`docker-compose logs -f`
2. **查看文档**：参考本指南和README.md
3. **社区支持**：提交GitHub Issue
4. **专业支持**：联系技术支持团队

---

**祝你部署成功！🎉**