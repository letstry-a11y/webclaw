# WebClaw Docker 部署

## 快速开始

```bash
# 1. 准备环境变量
cp .env.example .env
# 在 .env 设置 INITIAL_USER_PASSWORD、JWT_SECRET 和 PUBLIC_BASE_URL
#   JWT_SECRET 可用 `openssl rand -hex 32` 生成

# 2. 构建并启动
docker compose up -d --build

# 3. 访问
open http://localhost:3100
```

容器启动时使用 `prisma db push` 同步 SQLite 表结构。

## 企业账号与首次启用

公网用户通过 `/register` 提交企业邮箱、姓名和部门。管理员在 `/admin/users` 审批申请和重置密码，通过公司内部渠道将个人激活链接交给对应员工。员工可以沿用初始密码，也可以在 `/account` 设置个人密码。重置会使旧会话和旧激活链接失效。

首次部署时，在服务器环境中设置 `COMPANY_ADMIN_EMAIL`、`COMPANY_ADMIN_NAME`、`COMPANY_ADMIN_DEPARTMENT` 和 `BOOTSTRAP_ADMIN_PASSWORD`。下列命令只在系统尚无管理员时建立首个账号。将输出文件私下交给该管理员。

```sh
umask 077
mkdir -p tmp/medbot-access
docker compose exec -T -e COMPANY_ADMIN_EMAIL -e COMPANY_ADMIN_NAME -e COMPANY_ADMIN_DEPARTMENT -e BOOTSTRAP_ADMIN_PASSWORD webclaw node scripts/bootstrap-company-admin.mjs > tmp/medbot-access/admin-activation.txt
```

已有部署可用 `docker-compose.public.yml` 复用原数据和附件卷。设置 `WEBCLAW_DATA_VOLUME`、`WEBCLAW_UPLOAD_VOLUME` 为原卷名，执行 `docker compose -f docker-compose.yml -f docker-compose.public.yml up -d`。此配置在本机的 3100 和 3610 端口提供同一个应用，隧道可转发至 3100。

## 项目总览与管理周报

`/ai-projects` 展示从需求评审到质保结题的完整清单，也涵盖早期单独录入的产品。已关联的需求与产品共用一行。基础积分来自立项评审，核定积分来自结题评定，已发积分按实际发放累计。项目详情支持记录进展。

`/ai-projects/weekly` 使用管理员登录。选择周次后可以补填成果、下周计划和资源需求，下载 CSV 清单和 Markdown 周报。流程记录按上海时间从周一零时起算，下一周周一零时结束。历史周报中的项目清单反映采集时的状态，周内变化见每个项目的 `week` 字段。

内部汇报程序可在服务器回环地址读取接口，将部署环境的 `MANAGEMENT_REPORT_TOKEN` 放入请求头。公网访问周报和写入周进展均使用已登录的管理员会话。

```bash
curl --fail --silent --show-error \
  --header "Authorization: Bearer ${MANAGEMENT_REPORT_TOKEN}" \
  'http://localhost:3100/api/management/ai-projects?week=2026-11-16&format=json'
```

`week` 接受周内任意有效日期，省略时取本周。`format` 支持 `json`、`csv`、`md`。JSON 中 `period` 标记周界，`generatedAt` 标记台账采集时间，`weekTotals` 汇总新增、有记录、已填报及已报阻碍的项目数。按 `projects[].id` 关联同一项目，积分值为空表示尚未核定或缺少历史记录。若需要留存某次汇报当时的积分和状态，保存当次导出文件。

Docker 之外使用 `prisma migrate deploy` 的安装，可先在备份副本上核对迁移。本次补齐历史迁移遗漏的 `AiDemandRequest.committeeAssistant`、`Post.authorFingerprint` 和 `Post.attachments`。若曾手工同步字段，仅在对应迁移的全部字段及默认值均已存在时，使用 `prisma migrate resolve --applied <迁移目录名>` 标记该迁移，随后正常执行后续迁移。

## 首次导入示例数据（可选）

```bash
docker compose exec webclaw sh -c 'DATABASE_URL=file:/app/data/dev.db node -e "require(\"@prisma/client\"); console.log(\"client ok\")"'
# 由于 seed 需要 tsx（dev-only），推荐在宿主机运行一次：
DATABASE_URL="file:$(docker volume inspect webclaw_webclaw-data -f '{{.Mountpoint}}')/dev.db" npm run seed
```

AI 项目看板初始数据可在容器启动后安全补齐（重复执行不会重复创建）：

```bash
docker compose exec webclaw node prisma/seed-ai.js
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
# 启动时会同步表结构，沿用已有的数据卷
```
