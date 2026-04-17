# WebClaw Docker 部署

## 快速开始

```bash
# 1. 准备环境变量
cp .env.example .env
# 编辑 .env，至少设置 ADMIN_PASSWORD 和 JWT_SECRET
#   JWT_SECRET 可用 `openssl rand -hex 32` 生成

# 2. 构建并启动
docker compose up -d --build

# 3. 访问
open http://localhost:3000
```

首次启动会自动执行 `prisma migrate deploy` 建表。

## 首次导入示例数据（可选）

```bash
docker compose exec webclaw sh -c 'DATABASE_URL=file:/app/data/dev.db node -e "require(\"@prisma/client\"); console.log(\"client ok\")"'
# 由于 seed 需要 tsx（dev-only），推荐在宿主机运行一次：
DATABASE_URL="file:$(docker volume inspect webclaw_webclaw-data -f '{{.Mountpoint}}')/dev.db" npm run seed
```

或在 `.env` 里设 `SEED_ON_STARTUP=true` 再启动一次（tsx 必须打进镜像才生效，默认未包含）。

## 数据持久化

- `webclaw-data` 卷：`/app/data/dev.db` SQLite 数据库
- `webclaw-uploads` 卷：`/app/public/uploads/` 用户上传的图片和附件

```bash
# 查看卷
docker volume ls | grep webclaw

# 备份数据库
docker compose exec webclaw sh -c 'cp /app/data/dev.db /app/data/dev.db.bak'
docker cp webclaw:/app/data/dev.db.bak ./dev.db.bak
```

## 运维常用

```bash
docker compose logs -f webclaw     # 看日志
docker compose restart webclaw     # 重启
docker compose exec webclaw sh     # 进容器
docker compose down                # 停止（保留卷）
docker compose down -v             # 停止并删除卷（数据丢失！）
```

## 反向代理 + HTTPS（可选）

建议在前面套一层 Caddy / Nginx / Traefik 做 TLS 终止。样例（Caddyfile）：

```
yourdomain.com {
    reverse_proxy 127.0.0.1:3000
}
```

## 资源占用估算

- 构建后镜像：约 280-350 MB
- 运行时内存：100-200 MB（空闲）
- SQLite 适合中小流量（< 数千 QPS 读）

## 升级

```bash
git pull
docker compose up -d --build
# migrate deploy 会在容器启动时自动应用新迁移
```
